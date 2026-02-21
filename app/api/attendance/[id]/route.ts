import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const item = await prisma.attendance.findUnique({
      where: { id },
    });
    if (!item)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Student may only access own attendance
    if (user.role === "student" && item.studentId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Teacher may only access attendance for their classes
    if (user.role === "teacher") {
      const classes = await prisma.class.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });
      const classIds = classes.map((c) => c.id);
      if (!classIds.includes(item.classId)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
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
    const existing = await prisma.attendance.findUnique({
      where: { id },
    });
    if (!existing)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    // Teacher ownership check
    if (user.role === "teacher") {
      const classes = await prisma.class.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });
      const classIds = classes.map((c) => c.id);
      if (!classIds.includes(existing.classId)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    const updates = await req.json();
    const validStatuses = ["present", "late", "absent"];
    if (
      updates.status !== undefined &&
      !validStatuses.includes(String(updates.status).toLowerCase())
    ) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 },
      );
    }

    let nextDate: Date | undefined;
    if (updates.date !== undefined) {
      nextDate = new Date(updates.date);
      if (Number.isNaN(nextDate.getTime())) {
        return NextResponse.json(
          { message: "Invalid date value" },
          { status: 400 },
        );
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (nextDate > today) {
        return NextResponse.json(
          { message: "Cannot set attendance to a future date" },
          { status: 400 },
        );
      }
      nextDate.setHours(0, 0, 0, 0);
    }

    // Teacher editing from dashboard should only adjust status/date.
    // Student/class changes are restricted to admins.
    const isAdmin = user.role === "admin";
    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        status: updates.status
          ? String(updates.status).toLowerCase()
          : existing.status,
        date: nextDate ?? existing.date,
        classId: isAdmin
          ? (updates.classId ?? existing.classId)
          : existing.classId,
        studentId: isAdmin
          ? (updates.studentId ?? existing.studentId)
          : existing.studentId,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Invalid payload or not found" },
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
    const existing = await prisma.attendance.findUnique({
      where: { id },
    });
    if (!existing)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (user.role === "teacher") {
      const classes = await prisma.class.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });
      const classIds = classes.map((c) => c.id);
      if (!classIds.includes(existing.classId)) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.attendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
