import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session";
const db = prisma as any;

// GET: Retrieve submission details
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const assignmentId = url.searchParams.get("assignmentId");
  const studentId = url.searchParams.get("studentId");

  try {
    // Build where clause
    const where: any = {};
    if (assignmentId) where.assignmentId = assignmentId;
    if (studentId) where.studentId = studentId;

    // Authorization: Students can only see their own submissions
    if (user.role === "student") {
      where.studentId = user.id;
    }
    if (user.role === "teacher") {
      const classIds = (
        await db.class.findMany({
          where: { teacherId: user.id },
          select: { id: true },
        })
      ).map((c: any) => c.id);
      where.assignment = { classId: { in: classIds } };
    }

    const submissions = await db.submission.findMany({
      where,
      include: {
        assignment: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { message: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}

// POST: Create a new submission record (called when teacher creates assignment)
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Only teachers/admin can create submissions via API (students submit via upload)
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { studentId, assignmentId, status = "pending" } = body;

    // Validation
    if (!studentId || !assignmentId) {
      return NextResponse.json(
        {
          message: "Missing required fields: studentId and assignmentId",
        },
        { status: 400 },
      );
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    // Verify assignment exists
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check if submission already exists
    const existing = await db.submission.findFirst({
      where: {
        studentId,
        assignmentId,
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          message: "Submission already exists for this student-assignment pair",
        },
        { status: 409 },
      );
    }

    // Create submission
    const submission = await db.submission.create({
      data: {
        studentId,
        assignmentId,
        status,
        filePath: "",
      },
      include: {
        assignment: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { message: "Failed to create submission" },
      { status: 500 },
    );
  }
}

// PUT: Update submission status/grade (for teachers grading)
export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Only teachers/admin can update submissions
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { submissionId, status, grade, feedback } = body;

    if (!submissionId) {
      return NextResponse.json(
        { message: "Missing submissionId" },
        { status: 400 },
      );
    }

    // Verify submission exists
    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: true },
    });
    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 },
      );
    }

    // Validate status if provided
    if (status && !["pending", "submitted", "graded"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 },
      );
    }

    if (user.role === "teacher") {
      const assignmentClassId = submission.assignment?.classId;
      if (assignmentClassId) {
        const cls = await db.class.findUnique({
          where: { id: assignmentClassId },
          select: { teacherId: true },
        });
        if (!cls || cls.teacherId !== user.id) {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Update submission
    const updated = await db.submission.update({
      where: { id: submissionId },
      data: {
        ...(status && { status }),
        ...(grade && { grade }),
        ...(feedback && { feedback }),
      },
      include: {
        assignment: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { message: "Failed to update submission" },
      { status: 500 },
    );
  }
}
