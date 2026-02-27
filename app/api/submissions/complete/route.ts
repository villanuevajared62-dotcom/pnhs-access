import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";

export const runtime = "nodejs";

const db = prisma as any;

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "student") {
    return NextResponse.json(
      { message: "Only students can submit" },
      { status: 403 },
    );
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const assignmentId = String(body?.assignmentId || "");
  const filePath = String(body?.filePath || "");

  if (!assignmentId || !filePath) {
    return NextResponse.json(
      { message: "assignmentId and filePath are required" },
      { status: 400 },
    );
  }

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) {
    return NextResponse.json(
      { message: "Assignment not found" },
      { status: 404 },
    );
  }

  const enrolled = assignment.classId
    ? await db.enrollment.findFirst({
        where: { classId: assignment.classId, studentId: user.id },
      })
    : null;

  if (assignment.studentId && assignment.studentId !== user.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (assignment.classId && !enrolled) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const existing = await db.submission.findFirst({
    where: { assignmentId, studentId: user.id },
    orderBy: { submittedAt: "desc" },
  });

  const submission = existing
    ? await db.submission.update({
        where: { id: existing.id },
        data: {
          filePath,
          status: "submitted",
          submittedAt: new Date(),
        },
      })
    : await db.submission.create({
        data: {
          assignmentId,
          studentId: user.id,
          filePath,
          status: "submitted",
          submittedAt: new Date(),
        },
      });

  return NextResponse.json(submission, { status: 201 });
}

