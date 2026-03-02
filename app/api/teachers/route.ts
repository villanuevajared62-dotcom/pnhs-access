import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSessionUser } from "@/lib/server-session-node";
import bcrypt from "bcryptjs";

const prismaPromise = import("@/lib/prisma").then((m) => m.default);

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const prisma = await prismaPromise;
  const teachersRaw: any = await prisma.teacher.findMany({
    where: { deletedAt: null },
    include: {
      classes: {
        where: { deletedAt: null },
        select: {
          students: true,
          _count: {
            select: { enrollments: true },
          },
        },
      },
    },
  });
  const teachers = teachersRaw.map((t: any) => {
    const { password, subjects, teacherSubjects, classes, ...rest } = t;

    // Calculate total students from classes (use max of static count or real enrollments)
    const calculatedStudents = Array.isArray(classes)
      ? classes.reduce(
          (acc: number, c: any) =>
            acc + Math.max(c.students || 0, c._count?.enrollments || 0),
          0,
        )
      : rest.students || 0;

    return {
      ...rest,
      students: calculatedStudents,
      subjects: (() => {
        try {
          return JSON.parse(subjects || "[]");
        } catch {
          return [];
        }
      })(),
      username: user.role === "admin" ? (t.username ?? undefined) : undefined,
    };
  });
  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();

    // Validate required fields
    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim() === ""
    ) {
      return NextResponse.json(
        { message: "Teacher name is required" },
        { status: 400 },
      );
    }

    if (
      !body.email ||
      typeof body.email !== "string" ||
      body.email.trim() === ""
    ) {
      return NextResponse.json(
        { message: "Teacher email is required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate username if provided
    if (
      body.username &&
      (typeof body.username !== "string" || body.username.trim() === "")
    ) {
      return NextResponse.json(
        { message: "Username must be a non-empty string" },
        { status: 400 },
      );
    }

    // Validate subjects array
    if (body.subjects && !Array.isArray(body.subjects)) {
      return NextResponse.json(
        { message: "Subjects must be an array" },
        { status: 400 },
      );
    }

    const prisma = await prismaPromise;

    // Check for existing email
    const existingEmail = await prisma.teacher.findFirst({
      where: { email: body.email, deletedAt: null },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: "A teacher with this email already exists" },
        { status: 400 },
      );
    }

    // Check for existing username if provided
    if (body.username) {
      const existingUsername = await prisma.teacher.findFirst({
        where: { username: body.username, deletedAt: null },
      });

      if (existingUsername) {
        return NextResponse.json(
          { message: "A teacher with this username already exists" },
          { status: 400 },
        );
      }
    }

    const hashed = body.password
      ? await bcrypt.hash(body.password, 10)
      : undefined;

    const teacherData: any = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      department: body.department ?? "",
      subjects: JSON.stringify(body.subjects ?? []),
      students: body.students ?? 0,
      status: body.status ?? "active",
      username: body.username ? body.username.trim() : undefined,
      password: hashed,
    };

    const newTeacher = await prisma.teacher.create({
      data: teacherData,
    });

    // Subjects are stored as JSON string in the `subjects` column for now.
    // (Prisma client in this workspace does not expose Subject/TeacherSubject helpers.)
    // Future migration: create Subject and TeacherSubject rows and link them.

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (e: any) {
    console.error("Teacher creation error:", e);

    // Handle specific database errors
    if (e.code === "P2002") {
      const field = e.meta?.target?.[0];
      if (field === "email") {
        return NextResponse.json(
          { message: "A teacher with this email already exists" },
          { status: 400 },
        );
      } else if (field === "username") {
        return NextResponse.json(
          { message: "A teacher with this username already exists" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        message:
          "Failed to create teacher. Please check your input and try again.",
      },
      { status: 400 },
    );
  }
}

export const runtime = "nodejs";
