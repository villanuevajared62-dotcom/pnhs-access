import { NextRequest, NextResponse } from "next/server";
import type { Class } from "@/lib/shared-data";
import prisma from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/server-session-node";

let classes: Class[] = [
  {
    id: "1",
    name: "Math 101",
    teacher: "Ms. Santos",
    teacherId: "1",
    students: 42,
    schedule: "MWF 8:00-9:00 AM",
    room: "Room 101",
    gradeLevel: "Grade 10",
    section: "A",
  },
  {
    id: "2",
    name: "Science 201",
    teacher: "Mr. Cruz",
    teacherId: "2",
    students: 38,
    schedule: "TTH 9:00-10:30 AM",
    room: "Room 205",
    gradeLevel: "Grade 11",
    section: "B",
    strand: "STEM",
  },
  {
    id: "3",
    name: "English 301",
    teacher: "Ms. Garcia",
    teacherId: "3",
    students: 35,
    schedule: "MWF 10:00-11:00 AM",
    room: "Room 103",
    gradeLevel: "Grade 12",
    section: "A",
  },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const item = await prisma.class.findUnique({
    where: { id },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!item || item.deletedAt)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Override `students` with authoritative enrollment count
  const out = {
    ...item,
    students: (item as any)._count?.enrollments ?? item.students ?? 0,
  };
  return NextResponse.json(out);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const updates = await req.json();
    const updateData: any = {
      name: updates.name,
      teacher: updates.teacher,
      teacherId: updates.teacherId,
      students: updates.students,
      schedule: updates.schedule,
      room: updates.room,
      gradeLevel: updates.gradeLevel,
      section: updates.section,
      strand: updates.strand,
    };

    const updated = await prisma.class.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updated);
  } catch (e) {
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
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    await prisma.class.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user?.id || null,
        actorRole: auth.user?.role || null,
        action: "soft-delete",
        resource: "Class",
        resourceId: id,
        metadata: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const cls = await prisma.class.findUnique({
      where: { id },
    });
    if (!cls || cls.deletedAt)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isSenior =
      String(cls.gradeLevel) === "Grade 11" ||
      String(cls.gradeLevel) === "Grade 12";

    const studentWhere: any = {
      gradeLevel: cls.gradeLevel,
      deletedAt: null,
      status: "active",
    };
    if (isSenior) {
      const strandValue = (cls.strand || "").toString().trim();
      const sectionValue = (cls.section || "").toString().trim();
      if (strandValue) studentWhere.strand = strandValue;
      if (sectionValue) studentWhere.section = sectionValue;
    } else {
      if (cls.section) studentWhere.section = cls.section;
    }

    const targetStudents = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true },
    });
    const targetIds = new Set(targetStudents.map((s) => s.id));

    const currentEnrollments = await prisma.enrollment.findMany({
      where: { classId: cls.id },
      select: { id: true, studentId: true },
    });
    const currentIds = new Set(currentEnrollments.map((e) => e.studentId));

    const toAdd = Array.from(targetIds).filter((id) => !currentIds.has(id));
    const toRemove = [...currentEnrollments].filter(
      (e) => !targetIds.has(e.studentId),
    );

    if (toAdd.length > 0) {
      await prisma.enrollment.createMany({
        data: toAdd.map((sid) => ({ studentId: sid, classId: cls.id })),
      });
    }
    if (toRemove.length > 0) {
      await prisma.enrollment.deleteMany({
        where: { id: { in: toRemove.map((e) => e.id) } },
      });
    }

    const updatedCount = targetIds.size;
    await prisma.class.update({
      where: { id: cls.id },
      data: { students: updatedCount },
    });

    const result = await prisma.class.findUnique({
      where: { id: cls.id },
      include: { _count: { select: { enrollments: true } } },
    });
    const out = {
      ...(result as any),
      students:
        (result as any)?._count?.enrollments ?? (result as any)?.students ?? 0,
    };
    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    console.error("Recompute enrollments failed:", e);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

export const runtime = "nodejs"
