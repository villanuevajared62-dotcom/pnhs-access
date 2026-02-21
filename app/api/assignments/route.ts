import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session";
const db = prisma as any;
export const dynamic = "force-dynamic";

interface AssignmentPayload {
  title: string;
  subject?: string;
  dueDate: string;
  status?: string;
  description?: string;
  studentId?: string;
  classId?: string;
  points?: string | number;
  gradingCriteria?: string;
  submissionRequirements?: string;
  attachmentPath?: string;
  attachmentName?: string;
}

const ATTACHMENT_PREFIX = "ATTACHMENT_META:";

function parseSubmissionRequirements(value?: string | null) {
  if (!value) {
    return { text: "", attachmentPath: null as string | null, attachmentName: null as string | null };
  }

  if (!value.startsWith(ATTACHMENT_PREFIX)) {
    return { text: value, attachmentPath: null as string | null, attachmentName: null as string | null };
  }

  try {
    const parsed = JSON.parse(value.slice(ATTACHMENT_PREFIX.length)) as {
      text?: string;
      attachmentPath?: string;
      attachmentName?: string;
    };
    return {
      text: parsed.text || "",
      attachmentPath: parsed.attachmentPath || null,
      attachmentName: parsed.attachmentName || null,
    };
  } catch {
    return { text: value, attachmentPath: null as string | null, attachmentName: null as string | null };
  }
}

function serializeSubmissionRequirements(
  text?: string | null,
  attachmentPath?: string | null,
  attachmentName?: string | null,
) {
  const cleanText = text?.trim() || "";
  const cleanPath = attachmentPath?.trim() || "";
  const cleanName = attachmentName?.trim() || "";

  if (!cleanPath && !cleanName) {
    return cleanText || null;
  }

  return `${ATTACHMENT_PREFIX}${JSON.stringify({
    text: cleanText,
    attachmentPath: cleanPath || undefined,
    attachmentName: cleanName || undefined,
  })}`;
}

function shapeAssignment(assignment: any) {
  if (!assignment) return null;
  const parsedReq = parseSubmissionRequirements(assignment.submissionRequirements);
  const rawPoints = assignment.gradingCriteria;
  const points =
    rawPoints !== null && rawPoints !== undefined && String(rawPoints).trim() !== ""
      ? String(rawPoints)
      : null;
  return {
    ...assignment,
    className: assignment.class?.name || null,
    points,
    submissionRequirements: parsedReq.text,
    attachmentPath: parsedReq.attachmentPath,
    attachmentName: parsedReq.attachmentName,
  };
}

async function hydrateSubmissionStudents(assignments: any[]) {
  const studentIds = Array.from(
    new Set(
      assignments
        .flatMap((a: any) => (a.submissions || []).map((s: any) => String(s.studentId || "")))
        .filter((id: string) => id.length > 0),
    ),
  );

  if (studentIds.length === 0) return assignments;

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, email: true },
  });
  const studentMap = new Map(students.map((s) => [String(s.id), s]));

  return assignments.map((a: any) => ({
    ...a,
    submissions: (a.submissions || []).map((s: any) => ({
      ...s,
      student: studentMap.get(String(s.studentId || "")) || null,
    })),
  }));
}

function parseDueDateInput(raw?: string) {
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const m = raw
    .trim()
    .match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})[,\sT]+(\d{1,2}):(\d{2})(?:\s*([aApP][mM]))?$/,
    );
  if (!m) return null;

  let day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  let hour = Number(m[4]);
  const minute = Number(m[5]);
  const ampm = (m[6] || "").toLowerCase();

  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  day = Math.max(1, Math.min(31, day));
  const safeMonth = Math.max(1, Math.min(12, month));
  const safeHour = Math.max(0, Math.min(23, hour));
  const safeMinute = Math.max(0, Math.min(59, minute));

  return new Date(year, safeMonth - 1, day, safeHour, safeMinute);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "student") {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        select: { classId: true },
      });
      const classIds = enrollments.map((e) => e.classId);

      const assignments = await db.assignment.findMany({
        where: {
          OR: [{ studentId: user.id }, { classId: { in: classIds } }],
        },
        include: {
          class: true,
          submissions: {
            where: { studentId: user.id },
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { dueDate: "asc" },
      });

      const shaped = assignments.map((a: any) => {
        const latestSubmission = a.submissions[0];
        const parsedReq = parseSubmissionRequirements(a.submissionRequirements);
        const rawPoints = a.gradingCriteria;
        const points =
          rawPoints !== null && rawPoints !== undefined && String(rawPoints).trim() !== ""
            ? String(rawPoints)
            : null;
        const hasSubmittedFile = Boolean(
          latestSubmission?.filePath && String(latestSubmission.filePath).trim() !== "",
        );
        const normalizedStatus =
          latestSubmission?.status === "graded"
            ? "graded"
            : hasSubmittedFile
              ? "submitted"
              : "pending";
        return {
          id: a.id,
          title: a.title,
          subject: a.subject || a.class?.subject || a.class?.name || "",
          className: a.class?.name || null,
          dueDate: a.dueDate,
          description: a.description || "",
          points,
          submissionRequirements: parsedReq.text,
          attachmentPath: parsedReq.attachmentPath,
          attachmentName: parsedReq.attachmentName,
          classId: a.classId,
          studentId: user.id,
          status: normalizedStatus,
          grade: latestSubmission?.grade || a.grade || undefined,
          filePath: latestSubmission?.filePath || null,
          submittedAt: latestSubmission?.submittedAt || null,
        };
      });

      return NextResponse.json(shaped, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    if (user.role === "teacher") {
      const teacherClasses = await db.class.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });
      const teacherClassIds = teacherClasses.map((c: any) => c.id);
      const studentIds = (
        await db.class.findMany({
          where: { id: { in: teacherClassIds } },
          select: { enrollments: { select: { studentId: true } } },
        })
      ).flatMap((c: any) => c.enrollments.map((e: any) => e.studentId));

      const assignments = await db.assignment.findMany({
        where: {
          OR: [
            { classId: { in: teacherClassIds } },
            { studentId: { in: studentIds } },
          ],
        },
        include: {
          class: true,
          student: { select: { id: true, name: true, email: true } },
          submissions: {
            select: {
              id: true,
              studentId: true,
              status: true,
              filePath: true,
              submittedAt: true,
              grade: true,
              feedback: true,
            },
            orderBy: { submittedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const hydrated = await hydrateSubmissionStudents(assignments);
      return NextResponse.json(hydrated.map(shapeAssignment), {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    const assignments = await db.assignment.findMany({
      include: {
        class: true,
        student: { select: { id: true, name: true, email: true } },
        submissions: {
          select: {
            id: true,
            studentId: true,
            status: true,
            filePath: true,
            submittedAt: true,
            grade: true,
            feedback: true,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const hydrated = await hydrateSubmissionStudents(assignments);
    return NextResponse.json(hydrated.map(shapeAssignment), {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("Failed to fetch assignments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch assignments",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only teachers/admin can create assignments" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as AssignmentPayload;

    if (!body.title || !body.dueDate) {
      return NextResponse.json(
        { error: "Title and dueDate are required" },
        { status: 400 },
      );
    }

    if (!body.classId && !body.studentId) {
      return NextResponse.json(
        { error: "Either classId or studentId is required" },
        { status: 400 },
      );
    }

    if (user.role === "teacher" && body.classId) {
      const cls = await db.class.findUnique({
        where: { id: body.classId },
        select: { id: true, teacherId: true },
      });
      if (!cls) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
      if (cls.teacherId !== user.id) {
        return NextResponse.json(
          { error: "Cannot create assignment for other teachers' class" },
          { status: 403 },
        );
      }
    }

    const submissionRequirements = serializeSubmissionRequirements(
      body.submissionRequirements,
      body.attachmentPath,
      body.attachmentName,
    );
    const pointsValue =
      body.points !== undefined && body.points !== null && String(body.points).trim() !== ""
        ? String(body.points).trim()
        : body.gradingCriteria || null;

    const parsedDueDate = parseDueDateInput(body.dueDate);
    if (!parsedDueDate) {
      return NextResponse.json(
        { error: "Invalid dueDate format. Use a valid date/time value." },
        { status: 400 },
      );
    }

    const assignment = await db.assignment.create({
      data: {
        title: body.title,
        subject: body.subject || null,
        dueDate: parsedDueDate,
        status: body.status || "published",
        description: body.description || null,
        classId: body.classId || null,
        studentId: body.studentId || null,
        gradingCriteria: pointsValue,
        submissionRequirements,
      },
      include: {
        class: true,
        student: { select: { id: true, name: true, email: true } },
        submissions: true,
      },
    });

    try {
      if (assignment.classId) {
        const enrolled = await db.enrollment.findMany({
          where: { classId: assignment.classId },
          select: { studentId: true },
        });

        const uniqueStudentIds = Array.from(
          new Set<string>(
            enrolled
              .map((e: any) => String(e.studentId || ""))
              .filter((studentId: string) => studentId.length > 0),
          ),
        );

        if (uniqueStudentIds.length > 0) {
          await db.submission.createMany({
            data: uniqueStudentIds.map((studentId: string) => ({
              assignmentId: assignment.id,
              studentId,
              filePath: "",
              status: "pending",
            })),
          });
        }
      } else if (assignment.studentId) {
        await db.submission.create({
          data: {
            assignmentId: assignment.id,
            studentId: assignment.studentId,
            filePath: "",
            status: "pending",
          },
        });
      }
    } catch (submissionSeedError) {
      // Do not fail assignment creation if placeholder submission rows fail.
      console.warn(
        "Assignment created but failed to seed submission placeholders:",
        submissionSeedError,
      );
    }

    return NextResponse.json(shapeAssignment(assignment), { status: 201 });
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return NextResponse.json(
      {
        error: "Failed to create assignment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
