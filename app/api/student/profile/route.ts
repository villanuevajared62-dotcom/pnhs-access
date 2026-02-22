import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'student') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: { user: { select: { name: true, username: true, email: true } }, class: { include: { subject: true, teacher: { include: { user: true } } } } }
  })
  return NextResponse.json(student)
}
