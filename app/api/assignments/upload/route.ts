import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session";

const db = prisma as any;

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json(
      { message: "Only teachers/admin can upload assignment files" },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const classId = String(formData.get("classId") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "file is required" }, { status: 400 });
    }

    if (user.role === "teacher" && classId) {
      const cls = await db.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      });

      if (!cls || cls.teacherId !== user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name || "").slice(0, 16);
    const base = path
      .basename(file.name || "attachment", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 48);
    const safeName = `${Date.now()}_${user.id}_${base || "file"}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "assignments");
    const output = path.join(uploadDir, safeName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(output, buffer);

    return NextResponse.json(
      {
        filePath: `/uploads/assignments/${safeName}`,
        fileName: file.name,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading assignment attachment:", error);
    return NextResponse.json(
      { message: "Failed to upload assignment attachment" },
      { status: 500 },
    );
  }
}
