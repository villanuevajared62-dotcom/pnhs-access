import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";

export const runtime = "nodejs";

function normalizePeriod(raw: unknown): string {
  const v = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return v;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin" && user.role !== "teacher") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const classId = String(url.searchParams.get("classId") || "").trim();
  const period = normalizePeriod(url.searchParams.get("period"));
  if (!classId || !period) {
    return NextResponse.json(
      { message: "classId and period are required" },
      { status: 400 },
    );
  }

  const resourceId = `${classId}:${period}`;
  const latest = await prisma.auditLog.findFirst({
    where: { action: "grades_finalized", resource: "grades", resourceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    approved: !!latest,
    approvedAt: latest?.createdAt || null,
    actorId: latest?.actorId || null,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const classId = String(body?.classId || "").trim();
    const period = normalizePeriod(body?.period);
    if (!classId || !period) {
      return NextResponse.json(
        { message: "classId and period are required" },
        { status: 400 },
      );
    }

    const cls = await prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      select: { id: true },
    });
    if (!cls) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    const resourceId = `${classId}:${period}`;
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: "admin",
        action: "grades_finalized",
        resource: "grades",
        resourceId,
        metadata: JSON.stringify({
          classId,
          period,
          approvedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({ approved: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}

