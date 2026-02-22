import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Students see only their own grades
  if (user.role === "student") {
    const items = await prisma.grade.findMany({
      where: { studentId: user.id },
    });
    return NextResponse.json(items);
  }

  // Teachers see grades for subjects they teach
  if (user.role === "teacher") {
    const tSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId: user.id },
      select: { subjectId: true },
    });
    const subjectIds = tSubjects.map((s) => s.subjectId);

    const classIds = (
      await prisma.class.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      })
    ).map((c) => c.id);

    const studentIds = (
      await prisma.enrollment.findMany({
        where: { classId: { in: classIds } },
        select: { studentId: true },
      })
    ).map((e) => e.studentId);

    const whereClauses: any[] = [];
    if (subjectIds.length > 0) {
      whereClauses.push({ subjectId: { in: subjectIds } });
    }
    if (studentIds.length > 0) {
      whereClauses.push({ studentId: { in: studentIds } });
    }

    const items = whereClauses.length
      ? await prisma.grade.findMany({ where: { OR: whereClauses } })
      : [];
    return NextResponse.json(items);
  }

  // Admin can see all
  const items = await prisma.grade.findMany();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const existing = await prisma.grade.findFirst({
      where: {
        studentId: body.studentId,
        subjectId: body.subjectId,
        quarter: body.quarter,
      },
    });

    const saved = existing
      ? (() => {
          // Normalize duplicates by applying the same latest value
          // to all rows with identical student+subject+quarter.
          return prisma.grade
            .updateMany({
              where: {
                studentId: body.studentId,
                subjectId: body.subjectId,
                quarter: body.quarter,
              },
              data: {
                grade: body.grade,
                remarks: body.remarks ?? existing.remarks ?? "",
              },
            })
            .then(async () => {
              const refreshed = await prisma.grade.findFirst({
                where: {
                  studentId: body.studentId,
                  subjectId: body.subjectId,
                  quarter: body.quarter,
                },
                orderBy: { id: "desc" },
              });
              return refreshed!;
            });
        })()
      : await prisma.grade.create({
          data: {
            studentId: body.studentId,
            subjectId: body.subjectId,
            grade: body.grade,
            quarter: body.quarter,
            remarks: body.remarks ?? "",
          },
        });
    return NextResponse.json(saved, { status: existing ? 200 : 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}
