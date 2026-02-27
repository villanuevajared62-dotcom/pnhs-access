import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";
import { getUploadMaxBytes, getUploadMaxMB } from "@/lib/upload-limits";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const db = prisma as any;

// Check if we're running on Vercel (serverless) or local
const isServerless = process.env.VERCEL === "1";

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
        { message: "No file provided" },
        { status: 400 },
      );
    }

    const maxBytes = getUploadMaxBytes();
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          message: `File size must be ${getUploadMaxMB()}MB or less`,
          maxBytes,
        },
        { status: 413 },
      );
    }

    if (user.role === "teacher" && classId) {
      const cls = await db.class.findUnique({
        where: { id: classId },
        select: { teacherId: true },
      });

      if (!cls || cls.teacherId !== user.id) {
        return NextResponse.json(
          { message: "Forbidden - not your class" },
          { status: 403 },
        );
      }
    }

    // Generate safe filename
    const originalName = file.name || "assignment";
    const ext = originalName.split(".").pop()?.slice(0, 16) || "bin";
    const safeName = `${Date.now()}_${user.id}_assignment.${ext}`;

    // Try local filesystem first, fallback to Vercel Blob
    try {
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
          fileName: originalName,
        },
        { status: 201 },
      );
    } catch (localError) {
      console.error("Local upload failed, trying Vercel Blob:", localError);

      // Fallback to Vercel Blob if local fails
      if (isServerless) {
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        if (!blobToken) {
          console.error("Vercel Blob token not configured");
          return NextResponse.json(
            { message: "Upload storage not configured. Please contact admin." },
            { status: 500 },
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const blobOptions = { access: "public" as const, token: blobToken };
        const blob = await put(safeName, buffer, blobOptions);

        return NextResponse.json(
          {
            filePath: blob.url,
            fileName: originalName,
          },
          { status: 201 },
        );
      }

      // If we get here, both local and blob failed
      throw localError;
    }
  } catch (error) {
    console.error("Error uploading assignment attachment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: `Failed to upload assignment attachment: ${errorMessage}` },
      { status: 500 },
    );
  }
}
