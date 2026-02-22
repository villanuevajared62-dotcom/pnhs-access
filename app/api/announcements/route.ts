import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/server-session-node";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const items = await prisma.announcement.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const body = await req.json();
    const newAnnouncement = await prisma.announcement.create({
      data: {
        title: body.title,
        message: body.message,
        author: body.author ?? auth.user?.fullName ?? "Admin",
        type: body.type ?? "info",
        date: body.date ? new Date(body.date) : new Date(),
        createdAt: new Date(),
      },
    });
    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}

export const runtime = "nodejs"
