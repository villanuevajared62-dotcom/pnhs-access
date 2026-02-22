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
  if (user.role !== "student") {
    return NextResponse.json(
      { message: "Only students can upload" },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();
    const assignmentId = String(formData.get("assignmentId") || "");
    const file = formData.get("file");

    if (!assignmentId) {
      return NextResponse.json(
        { message: "assignmentId is required" },
        { status: 400 },
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "file is required" },
        { status: 400 },
      );
    }

    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 },
      );
    }

    const enrolled = assignment.classId
      ? await db.enrollment.findFirst({
          where: { classId: assignment.classId, studentId: user.id },
        })
      : null;

    if (assignment.studentId && assignment.studentId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (assignment.classId && !enrolled) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Generate safe filename
    const ext = (file.name || "").split(".").pop()?.slice(0, 16) || "bin";
    const safeName = `${assignmentId}_${user.id}_${Date.now()}.${ext}`;

    // For Vercel serverless: store in DB with placeholder path
    // For local: save to filesystem
    if (isServerless) {
      // Upload to Vercel Blob for persistent storage
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const blobOptions = { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN } as const;
      const blob = await put(safeName, buffer, blobOptions);

      const existing = await db.submission.findFirst({
        where: { assignmentId, studentId: user.id },
        orderBy: { submittedAt: "desc" },
      });

      const submission = existing
        ? await db.submission.update({
            where: { id: existing.id },
            data: {
              filePath: blob.url,
              status: "submitted",
              submittedAt: new Date(),
            },
          })
        : await db.submission.create({
            data: {
              assignmentId,
              studentId: user.id,
              filePath: blob.url,
              status: "submitted",
              submittedAt: new Date(),
            },
          });

      return NextResponse.json(submission, { status: 201 });
    } else {
      // Local development: use filesystem
      const { promises: fs } = await import("fs");
      const path = await import("path");

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "submissions",
      );
      const output = path.join(uploadDir, safeName);

      await fs.mkdir(uploadDir, { recursive: true });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.writeFile(output, buffer);

      const relativePath = `/uploads/submissions/${safeName}`;
      const existing = await db.submission.findFirst({
        where: { assignmentId, studentId: user.id },
        orderBy: { submittedAt: "desc" },
      });

      const submission = existing
        ? await db.submission.update({
            where: { id: existing.id },
            data: {
              filePath: relativePath,
              status: "submitted",
              submittedAt: new Date(),
            },
          })
        : await db.submission.create({
            data: {
              assignmentId,
              studentId: user.id,
              filePath: relativePath,
              status: "submitted",
              submittedAt: new Date(),
            },
          });

      return NextResponse.json(submission, { status: 201 });
    }
  } catch (error) {
    console.error("Error uploading submission:", error);
    return NextResponse.json(
      { message: "Failed to upload submission" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "student") {
    return NextResponse.json(
      { message: "Only students can delete submissions" },
      { status: 403 },
    );
  }

  try {
    const url = new URL(req.url);
    const assignmentId = String(url.searchParams.get("assignmentId") || "");
    if (!assignmentId) {
      return NextResponse.json(
        { message: "assignmentId is required" },
        { status: 400 },
      );
    }

    const submission = await db.submission.findFirst({
      where: { assignmentId, studentId: user.id },
      orderBy: { submittedAt: "desc" },
    });

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 },
      );
    }

    // Only delete from filesystem if not in serverless mode
    if (!isServerless) {
      const { promises: fs } = await import("fs");
      const path = await import("path");

      const currentPath = String(submission.filePath || "").trim();
      if (currentPath.startsWith("/uploads/submissions/")) {
        const target = path.join(
          process.cwd(),
          "public",
          currentPath.replace(/^\//, ""),
        );
        try {
          await fs.unlink(target);
        } catch {
          // Ignore missing file on disk.
        }
      }
    }

    const updated = await db.submission.update({
      where: { id: submission.id },
      data: {
        filePath: "",
        status: "pending",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error deleting submission file:", error);
    return NextResponse.json(
      { message: "Failed to delete submission" },
      { status: 500 },
    );
  }
}
