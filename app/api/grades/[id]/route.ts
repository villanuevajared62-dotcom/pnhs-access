import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const item = await prisma.grade.findUnique({ where: { id } });
    if (!item)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Student may only access own grade
    if (user.role === "student" && item.studentId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Teacher may only access grades for subjects they teach
    if (user.role === "teacher") {
      const tSubjects = await prisma.teacherSubject.findMany({
        where: { teacherId: user.id },
        select: { subjectId: true },
      });
      const subjectIds = tSubjects.map((s) => s.subjectId);
      if (!subjectIds.includes(item.subjectId))
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(item);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const existing = await prisma.grade.findUnique({
      where: { id },
    });
    if (!existing)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Teacher ownership check
    if (user.role === "teacher") {
      const tSubjects = await prisma.teacherSubject.findMany({
        where: { teacherId: user.id },
        select: { subjectId: true },
      });
      const subjectIds = tSubjects.map((s) => s.subjectId);
      if (!subjectIds.includes(existing.subjectId))
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updates = await req.json();
    const updated = await prisma.grade.update({
      where: { id },
      data: {
        studentId: updates.studentId,
        subjectId: updates.subjectId,
        grade: updates.grade,
        quarter: updates.quarter,
        remarks: updates.remarks,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Not found or invalid payload" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const existing = await prisma.grade.findUnique({
      where: { id },
    });
    if (!existing)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (user.role === "teacher") {
      const tSubjects = await prisma.teacherSubject.findMany({
        where: { teacherId: user.id },
        select: { subjectId: true },
      });
      const subjectIds = tSubjects.map((s) => s.subjectId);
      if (!subjectIds.includes(existing.subjectId))
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.grade.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}

export const runtime = "nodejs"
