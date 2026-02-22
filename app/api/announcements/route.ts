<<<<<<< HEAD
import { NextResponse, NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const where = session.role === 'admin' ? {} : {
    OR: [{ audience: 'all' }, { audience: session.role === 'teacher' ? 'teachers' : 'students' }]
  }
  const announcements = await prisma.announcement.findMany({ where, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(announcements)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, content, audience } = await req.json()
  const ann = await prisma.announcement.create({ data: { title, content, audience: audience || 'all', authorId: session.userId } })
  return NextResponse.json(ann)
}
=======
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
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
