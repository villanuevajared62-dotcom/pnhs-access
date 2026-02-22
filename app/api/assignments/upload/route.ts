import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";
import { put } from "@vercel/blob";

export const runtime = "nodejs"

const db = prisma as any;

// Check if we're running on Vercel (serverless) or local
const isServerless =
  process.env.VERCEL === "1" || !process.cwd().includes("pnhs-access");

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
      return NextResponse.json(
        { message: "file is required" },
        { status: 400 },
      );
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

    // Generate safe filename
    const ext = (file.name || "").split(".").pop()?.slice(0, 16) || "bin";
    const safeName = `${Date.now()}_${user.id}_assignment.${ext}`;

    // For Vercel serverless: return a placeholder URL and store file data in DB
    // For local: save to filesystem (fallback)
    if (isServerless) {
      // Upload to Vercel Blob for persistent storage
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const blobOptions = { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN } as const;
      const blob = await put(safeName, buffer, blobOptions);

      return NextResponse.json(
        {
          filePath: blob.url,
          fileName: file.name,
        },
        { status: 201 },
      );
    } else {
      // Local development: use filesystem
      const { promises: fs } = await import("fs");
      const path = await import("path");

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "assignments",
      );
      const output = path.join(uploadDir, safeName);

      await fs.mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(output, buffer);

      return NextResponse.json(
        {
          filePath: `/uploads/assignments/${safeName}`,
          fileName: file.name,
        },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error("Error uploading assignment attachment:", error);
    return NextResponse.json(
      { message: "Failed to upload assignment attachment" },
      { status: 500 },
    );
  }
}
