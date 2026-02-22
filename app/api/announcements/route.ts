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
