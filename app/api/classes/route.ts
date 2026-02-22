import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/server-session-node";

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const baseWhere: any = { deletedAt: null };

  // Teacher: only classes assigned to this teacher
  if (user.role === "teacher") {
    baseWhere.teacherId = user.id;
  }

  // Student: only classes where the student is enrolled
  if (user.role === "student") {
    baseWhere.enrollments = { some: { studentId: user.id } };
  }

  // Admin: all active classes
  const items = await prisma.class.findMany({
    where: baseWhere,
    include: { _count: { select: { enrollments: true } } },
  });

  const out = items.map((c) => ({
    // prefer the enrollment count over the possibly-stale `students` column
    ...c,
    students: (c as any)._count?.enrollments ?? c.students ?? 0,
    teacherName: (c as any).teacher || "",
  }));
  return NextResponse.json(out);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const createData: any = {
      name: body.name,
      teacher: body.teacher,
      teacherId: body.teacherId,
      students: body.students ?? 0,
      schedule: body.schedule,
      // room is optional in the new admin form — default to empty string
      room: body.room ?? "",
      gradeLevel: body.gradeLevel,
      section: body.section,
      strand: body.strand ?? "",
    };

    // create the class first
    const newClass = await prisma.class.create({ data: createData });

    // Auto-enroll students that match the class's grade/section/strand
    const isSenior =
      (createData.gradeLevel || "").toString() === "Grade 11" ||
      (createData.gradeLevel || "").toString() === "Grade 12";

    const studentWhere: any = {
      gradeLevel: createData.gradeLevel,
      deletedAt: null,
      status: "active",
    };

    if (isSenior) {
      // Senior High: match by strand AND section when both are provided.
      const strandValue = (createData.strand || "").toString().trim();
      const sectionValue = (createData.section || "").toString().trim();
      if (strandValue) studentWhere.strand = strandValue;
      if (sectionValue) studentWhere.section = sectionValue;
    } else {
      // match by section for junior high
      if (createData.section) studentWhere.section = createData.section;
    }

    const studentsToEnroll = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true },
    });

    if (studentsToEnroll.length > 0) {
      const enrollData = studentsToEnroll.map((s) => ({
        studentId: s.id,
        classId: newClass.id,
      }));

      await prisma.enrollment.createMany({ data: enrollData });

      // keep the class "students" counter in-sync (UI prefers authoritative count from enrollments)
      await prisma.class.update({
        where: { id: newClass.id },
        data: { students: studentsToEnroll.length },
      });
    }

    // return the freshly-updated class (client uses /api/classes GET which prefers enrollment count)
    const result = await prisma.class.findUnique({
      where: { id: newClass.id },
      include: { _count: { select: { enrollments: true } } },
    });

    const out = {
      ...(result as any),
      students:
        (result as any)?._count?.enrollments ?? (result as any)?.students ?? 0,
      teacherName: (result as any).teacher || "",
    };

    return NextResponse.json(out, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}
