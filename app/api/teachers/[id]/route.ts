import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSessionUser } from "@/lib/server-session-node";
import bcrypt from "bcryptjs";

const prismaPromise = import("@/lib/prisma").then((m) => m.default);

function isMaskedPassword(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return true;
  return /^[*•●·\-_=#]{4,}$/.test(v);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const prisma = await prismaPromise;
  const teacherRaw = await prisma.teacher.findUnique({
    where: { id },
    include: { teacherSubjects: { include: { subject: true } } },
  });
  if (!teacherRaw)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { password, subjects, teacherSubjects, ...rest } = teacherRaw as any;
  const teacher = {
    ...rest,
    subjects: (teacherSubjects || []).map((ts: any) => ts.subject.name),
    subjectsLegacy: (() => {
      try {
        return JSON.parse(subjects || "[]");
      } catch {
        return [];
      }
    })(),
  };
  return NextResponse.json(teacher);
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
    const prisma = await prismaPromise;
    const data: any = {
      name: updates.name,
      email: updates.email,
      department: updates.department,
      subjects: updates.subjects ? JSON.stringify(updates.subjects) : undefined,
      students: updates.students,
      status: updates.status,
    };
    if (typeof updates.username !== "undefined")
      data.username = updates.username;
    if (
      typeof updates.password !== "undefined" &&
      updates.password !== null &&
      typeof updates.password === "string" &&
      !isMaskedPassword(updates.password) &&
      !updates.password.startsWith("$2")
    ) {
      const hashed = await bcrypt.hash(updates.password, 10);
      data.password = hashed;
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data,
    });
    const out = { ...updated, password: undefined };
    return NextResponse.json(out);
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
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const prisma = await prismaPromise;
    await prisma.teacher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user?.id || null,
        actorRole: auth.user?.role || null,
        action: "soft-delete",
        resource: "Teacher",
        resourceId: id,
        metadata: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}

export const runtime = "nodejs"
