import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/server-session-node";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Admin: full list
  if (user.role === "admin") {
    const itemsRaw = await prisma.student.findMany({
      where: { deletedAt: null },
    });
    const items = itemsRaw.map((s) => ({
      ...s,
      password: undefined,
      username: s.username ?? undefined,
    }));
    return NextResponse.json(items);
  }

  // Teacher: students in their classes
  if (user.role === "teacher") {
    const classes = await prisma.class.findMany({
      where: { teacherId: user.id },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);
    if (classIds.length === 0) return NextResponse.json([]);
    const students = await prisma.student.findMany({
      where: { enrollments: { some: { classId: { in: classIds } } } },
    });
    const items = students.map((s) => ({
      ...s,
      password: undefined,
      username: undefined,
    }));
    return NextResponse.json(items);
  }

  // Student: only own record
  if (user.role === "student") {
    const s = await prisma.student.findUnique({ where: { id: user.id } });
    if (!s) return NextResponse.json([], { status: 200 });
    return NextResponse.json({
      ...s,
      password: undefined,
      username: undefined,
    });
  }

  return NextResponse.json([], { status: 200 });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const hashed = body.password
      ? await bcrypt.hash(body.password, 10)
      : undefined;
    const createData: any = {
      name: body.name,
      email: body.email,
      username: body.username,
      password: hashed,
      gradeLevel: body.gradeLevel,
      section: body.section,
      strand: body.strand ?? "",
      gpa: body.gpa ?? "",
      status: body.status ?? "active",
      studentId: body.studentId ?? `STU-${Date.now()}`,
    };

    const newStudent = await prisma.student.create({ data: createData });
    return NextResponse.json(newStudent, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Invalid payload or duplicate username" },
      { status: 400 },
    );
  }
}

export const runtime = "nodejs";
