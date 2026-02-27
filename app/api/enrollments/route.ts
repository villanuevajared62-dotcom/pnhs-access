import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, getSessionUser } from "@/lib/server-session-node";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Student: only their enrollments
  if (user.role === "student") {
    const items = await prisma.enrollment.findMany({
      where: { studentId: user.id, class: { deletedAt: null } },
      include: { class: true },
    });
    return NextResponse.json(items);
  }

  // Teacher: enrollments for classes they teach
  if (user.role === "teacher") {
    const classes = await prisma.class.findMany({
      where: { teacherId: user.id, deletedAt: null },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);
    const items = await prisma.enrollment.findMany({
      where: {
        classId: { in: classIds },
        class: { deletedAt: null },
        student: { deletedAt: null },
      },
      include: { student: true, class: true },
    });
    return NextResponse.json(items);
  }

  // Admin: all
  const items = await prisma.enrollment.findMany({
    where: { class: { deletedAt: null }, student: { deletedAt: null } },
    include: { student: true, class: true },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    if (!body.studentId || !body.classId)
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    const created = await prisma.enrollment.create({
      data: { studentId: body.studentId, classId: body.classId },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}

export const runtime = "nodejs"
