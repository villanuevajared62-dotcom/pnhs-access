import { NextRequest, NextResponse } from "next/server";
import type { Announcement } from "@/lib/shared-data";
import prisma from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/server-session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const item = await prisma.announcement.findUnique({
    where: { id: params.id },
  });
  if (!item || item.deletedAt)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const updates = await req.json();
    const updated = await prisma.announcement.update({
      where: { id: params.id },
      data: {
        title: updates.title,
        message: updates.message,
        author: updates.author,
        type: updates.type,
        date: updates.date ? new Date(updates.date) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { message: "Not found or invalid payload" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    await prisma.announcement.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        actorId: auth.user?.id || null,
        actorRole: auth.user?.role || null,
        action: "soft-delete",
        resource: "Announcement",
        resourceId: params.id,
        metadata: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
