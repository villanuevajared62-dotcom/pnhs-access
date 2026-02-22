import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.userId },
    include: { classes: { include: { subject: true, students: { include: { user: true } } } } }
  })
  return NextResponse.json(teacher?.classes || [])
}
