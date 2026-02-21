import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSessionUser } from "@/lib/server-session";
import bcrypt from "bcryptjs";

const prismaPromise = import("@/lib/prisma").then((m) => m.default);

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const prisma = await prismaPromise;
  const teachersRaw: any = await prisma.teacher.findMany({
    where: { deletedAt: null },
  });
  const teachers = teachersRaw.map((t: any) => {
    const { password, subjects, teacherSubjects, ...rest } = t;
    return {
      ...rest,
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
    const prisma = await prismaPromise;
    const hashed = body.password
      ? await bcrypt.hash(body.password, 10)
      : undefined;
    const teacherData: any = {
      name: body.name,
      email: body.email,
      department: body.department ?? "",
      subjects: JSON.stringify(body.subjects ?? []),
      students: body.students ?? 0,
      status: body.status ?? "active",
      username: body.username ?? undefined,
      password: hashed,
    };
    const newTeacher = await prisma.teacher.create({
      data: teacherData,
    });

    // Subjects are stored as JSON string in the `subjects` column for now.
    // (Prisma client in this workspace does not expose Subject/TeacherSubject helpers.)
    // Future migration: create Subject and TeacherSubject rows and link them.

    return NextResponse.json(newTeacher, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}
