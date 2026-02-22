import { NextResponse, NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) return NextResponse.json([])

  const classId = req.nextUrl.searchParams.get('classId')
  const where = classId ? { teacherId: teacher.id, classId } : { teacherId: teacher.id }
  const grades = await prisma.grade.findMany({
    where,
    include: { student: { include: { user: true } }, class: { include: { subject: true } } },
    orderBy: [{ quarter: 'asc' }, { createdAt: 'asc' }]
  })
  return NextResponse.json(grades)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const { studentId, classId, quarter, score, remarks } = await req.json()
  const id = `grade-${studentId}-${classId}-${quarter}`
  const grade = await prisma.grade.upsert({
    where: { id },
    update: { score, remarks },
    create: { id, studentId, classId, teacherId: teacher.id, quarter, score, remarks }
  })
  return NextResponse.json(grade)
}
