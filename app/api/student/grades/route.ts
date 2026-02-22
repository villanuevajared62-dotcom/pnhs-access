import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'student') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await prisma.student.findUnique({ where: { userId: session.userId } })
  if (!student) return NextResponse.json([])

  const grades = await prisma.grade.findMany({
    where: { studentId: student.id },
    include: { class: { include: { subject: true } } },
    orderBy: [{ quarter: 'asc' }]
  })
  return NextResponse.json(grades)
}
