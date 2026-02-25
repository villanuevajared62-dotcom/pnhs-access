import { NextRequest, NextResponse } from "next/server";
import { STRANDS, type Student } from "@/lib/shared-data";
import prisma from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/server-session-node";
import bcrypt from "bcryptjs";

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
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || student.deletedAt)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  const out = { ...student, password: undefined };
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

    console.debug("PUT /api/students/", id, { updates });

    const allowed = new Set([
      "name",
      "email",
      "username",
      "gradeLevel",
      "section",
      "strand",
      "gpa",
      "status",
      "studentId",
      "password",
    ]);
    for (const k of Object.keys(updates || {})) {
      if (!allowed.has(k)) delete updates[k];
    }

    if (typeof updates.name !== "undefined" && typeof updates.name !== "string")
      return NextResponse.json(
        { message: "Invalid payload: name" },
        { status: 400 },
      );
    if (
      typeof updates.email !== "undefined" &&
      typeof updates.email !== "string"
    )
      return NextResponse.json(
        { message: "Invalid payload: email" },
        { status: 400 },
      );
    if (
      typeof updates.gradeLevel !== "undefined" &&
      typeof updates.gradeLevel !== "string"
    )
      return NextResponse.json(
        { message: "Invalid payload: gradeLevel" },
        { status: 400 },
      );
    if (
      typeof updates.section !== "undefined" &&
      typeof updates.section !== "string"
    )
      return NextResponse.json(
        { message: "Invalid payload: section" },
        { status: 400 },
      );

    let target = await prisma.student.findUnique({ where: { id } });
    if (!target) {
      target = await prisma.student.findFirst({
        where: { studentId: id },
      });
      if (!target) {
        return NextResponse.json(
          { message: "Student not found" },
          { status: 404 },
        );
      }
    }

    const data: Record<string, any> = {};
    if (typeof updates.name !== "undefined") data.name = updates.name;
    if (typeof updates.email !== "undefined") data.email = updates.email;
    if (typeof updates.username !== "undefined")
      data.username = updates.username;
    if (typeof updates.gradeLevel !== "undefined")
      data.gradeLevel = updates.gradeLevel;
    if (typeof updates.section !== "undefined") data.section = updates.section;
    if (typeof updates.strand !== "undefined") data.strand = updates.strand;
    if (typeof updates.gpa !== "undefined") data.gpa = updates.gpa;
    if (typeof updates.status !== "undefined") data.status = updates.status;
    if (typeof updates.studentId !== "undefined")
      data.studentId = updates.studentId;

    // FIX: Only hash password if it's a non-empty plain text string
    // Reject bcrypt hashes being sent back (they start with $2a$ or $2b$)
    if (
      updates.password &&
      updates.password !== "" &&
      !updates.password.startsWith("$2") &&
      !isMaskedPassword(updates.password)
    ) {
      data.password = await bcrypt.hash(updates.password, 10);
    }

    // Normalize/coerce fields to expected shapes to avoid Prisma invalid-invocation errors
    if (typeof data.gpa !== "undefined" && typeof data.gpa !== "string") {
      data.gpa = String(data.gpa);
    }

    if (typeof data.section === "string") {
      const secMatch = data.section.match(/^Section\s+([A-E])$/i);
      if (secMatch) data.section = secMatch[1].toUpperCase();
      // if a strand label was accidentally put in `section`, move it to `strand`
      if (!/^[A-E]$/.test(data.section) && STRANDS.includes(data.section)) {
        data.strand = data.section;
        data.section = "A";
      }
    }

    if (typeof data.strand === "string") {
      const strandMatch = data.strand.match(/^Strand\s+(.+)$/i);
      if (strandMatch) data.strand = strandMatch[1];
      if (data.strand !== "" && !STRANDS.includes(data.strand)) {
        // sanitize unknown strand values to empty string (prevent passing objects)
        data.strand = String(data.strand);
      }
    }

    console.debug("prisma.student.update data ->", {
      whereId: target.id,
      data,
    });

    // Try update; if Prisma client/schema doesn't include `strand`, retry without it
    try {
      const updated = await prisma.student.update({
        where: { id: target.id },
        data,
      });
      const out = { ...updated, password: undefined };
      return NextResponse.json(out);
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (
        msg.includes("Unknown argument `strand`") ||
        msg.includes("Unknown arg `strand`")
      ) {
        console.warn(
          "Prisma client missing 'strand' field; retrying update without it.",
        );
        delete data.strand;
        const updated = await prisma.student.update({
          where: { id: target.id },
          data,
        });
        const out = { ...updated, password: undefined };
        return NextResponse.json(out);
      }
      throw err;
    }
  } catch (e: any) {
    console.error("Error updating student:", e?.message || e);

    if (e?.code === "P2002") {
      return NextResponse.json(
        { message: "Duplicate field value (username or email already exists)" },
        { status: 400 },
      );
    }
    if (e?.code === "P2025") {
      return NextResponse.json(
        { message: "Student record not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: e?.message || "Not found or invalid payload" },
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
    // Soft-delete the student
    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate all existing sessions for this student
    await prisma.session.updateMany({
      where: { userId: id },
      data: { revoked: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: auth.user?.id || null,
        actorRole: auth.user?.role || null,
        action: "soft-delete",
        resource: "Student",
        resourceId: id,
        metadata: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}

export const runtime = "nodejs";
