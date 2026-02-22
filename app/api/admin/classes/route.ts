import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classes = await prisma.class.findMany({
    include: {
      teacher: { include: { user: true } },
      enrollments: { include: { student: { include: { user: true } } } }
    },
    orderBy: { id: 'asc' }
  })

  return NextResponse.json(classes)
}

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const cls = await prisma.class.create({
    data: body,
    include: { teacher: { include: { user: true } } }
  })

  return NextResponse.json(cls)
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token || token.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')

  await prisma.class.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
