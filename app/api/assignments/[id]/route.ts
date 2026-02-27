import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-session-node";
import prisma from "@/lib/prisma";
const db = prisma as any;

const ATTACHMENT_PREFIX = "ATTACHMENT_META:";

function sanitizeAttachmentPath(value?: string | null): string | null {
  const raw = (value || "").trim();
  if (!raw) return null;

  if (raw.startsWith("/uploads/")) return raw;
  if (!/^https?:\/\//i.test(raw)) return null;

  try {
    const u = new URL(raw);
    const host = u.host.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host === "vercel.com") return null;
    if (path.includes("/stores/blob/") || path.includes("/browser")) return null;
    return raw;
  } catch {
    return null;
  }
}

function parseSubmissionRequirements(value?: string | null) {
  if (!value) {
    return {
      text: "",
      attachmentPath: null as string | null,
      attachmentName: null as string | null,
    };
  }

  if (!value.startsWith(ATTACHMENT_PREFIX)) {
    return {
      text: value,
      attachmentPath: null as string | null,
      attachmentName: null as string | null,
    };
  }

  try {
    const parsed = JSON.parse(value.slice(ATTACHMENT_PREFIX.length)) as {
      text?: string;
      attachmentPath?: string;
      attachmentName?: string;
    };
    return {
      text: parsed.text || "",
      attachmentPath: sanitizeAttachmentPath(parsed.attachmentPath) || null,
      attachmentName: parsed.attachmentName || null,
    };
  } catch {
    return {
      text: value,
      attachmentPath: null as string | null,
      attachmentName: null as string | null,
    };
  }
}

function serializeSubmissionRequirements(
  text?: string | null,
  attachmentPath?: string | null,
  attachmentName?: string | null,
) {
  const cleanText = text?.trim() || "";
  const cleanPath = sanitizeAttachmentPath(attachmentPath) || "";
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: { class: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    if (user.role === "student") {
      const enrolled = assignment.classId
        ? await prisma.enrollment.findFirst({
            where: { classId: assignment.classId, studentId: user.id },
          })
        : null;

      const canAccess =
        assignment.studentId === user.id ||
        Boolean(enrolled) ||
        (!assignment.studentId && !assignment.classId);
      if (!canAccess) {
        return NextResponse.json(
          { error: "Cannot update other students' assignments" },
          { status: 403 },
        );
      }

      const submission = await db.submission.findFirst({
        where: { assignmentId: assignment.id, studentId: user.id },
        orderBy: { submittedAt: "desc" },
      });

      const updated = submission
        ? await db.submission.update({
            where: { id: submission.id },
            data: {
              status: body.status || "submitted",
              submittedAt:
                body.status === "submitted" || !body.status
                  ? new Date()
                  : undefined,
            },
          })
        : await db.submission.create({
            data: {
              assignmentId: assignment.id,
              studentId: user.id,
              filePath: "",
              status: body.status || "submitted",
              submittedAt:
                body.status === "submitted" || !body.status
                  ? new Date()
                  : undefined,
            },
          });

      return NextResponse.json(updated);
    }

    if (user.role === "teacher") {
      if (assignment.classId) {
        const cls = await db.class.findUnique({
          where: { id: assignment.classId },
          select: { teacherId: true },
        });
        if (!cls || cls.teacherId !== user.id) {
          return NextResponse.json(
            { error: "Cannot modify assignments for other teachers' classes" },
            { status: 403 },
          );
        }
      }
    }

    const parsedSubmissionRequirements = parseSubmissionRequirements(
      assignment.submissionRequirements,
    );
    const hasAttachmentPayload =
      body.attachmentPath !== undefined || body.attachmentName !== undefined;
    const nextSubmissionRequirements =
      body.submissionRequirements !== undefined || hasAttachmentPayload
        ? serializeSubmissionRequirements(
            body.submissionRequirements !== undefined
              ? body.submissionRequirements
              : parsedSubmissionRequirements.text,
            body.attachmentPath !== undefined
              ? body.attachmentPath
              : parsedSubmissionRequirements.attachmentPath,
            body.attachmentName !== undefined
              ? body.attachmentName
              : parsedSubmissionRequirements.attachmentName,
          )
        : undefined;
    const nextPoints =
      body.points !== undefined
        ? String(body.points).trim() || null
        : body.gradingCriteria !== undefined
          ? body.gradingCriteria
          : undefined;

    const parsedDueDate =
      body.dueDate !== undefined ? parseDueDateInput(body.dueDate) : undefined;
    if (body.dueDate !== undefined && !parsedDueDate) {
      return NextResponse.json(
        { error: "Invalid dueDate format. Use a valid date/time value." },
        { status: 400 },
      );
    }

    const updatedAssignment = await db.assignment.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(parsedDueDate !== undefined && { dueDate: parsedDueDate }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.status !== undefined && { status: body.status }),
        ...(nextPoints !== undefined && {
          gradingCriteria: nextPoints,
        }),
        ...(nextSubmissionRequirements !== undefined && {
          submissionRequirements: nextSubmissionRequirements,
        }),
      },
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error("Failed to update assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "teacher" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const assignment = await db.assignment.findUnique({
      where: { id },
      select: { id: true, classId: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    if (user.role === "teacher" && assignment.classId) {
      const cls = await db.class.findUnique({
        where: { id: assignment.classId },
        select: { teacherId: true },
      });
      if (!cls || cls.teacherId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await db.submission.deleteMany({ where: { assignmentId: id } });
    await db.assignment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs"
