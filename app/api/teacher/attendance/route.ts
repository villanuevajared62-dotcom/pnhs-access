import { NextResponse, NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) return NextResponse.json([])

  const classId = req.nextUrl.searchParams.get('classId')
  const date = req.nextUrl.searchParams.get('date')
  const where: Record<string, string> = { teacherId: teacher.id }
  if (classId) where.classId = classId
  if (date) where.date = date

  const attendance = await prisma.attendance.findMany({
    where,
    include: { student: { include: { user: true } } },
    orderBy: { date: 'desc' }
  })
  return NextResponse.json(attendance)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'teacher') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.userId } })
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

  const { records, classId, date } = await req.json() // records: [{studentId, status}]
  const results = await Promise.all(
    records.map(async (r: { studentId: string; status: string }) => {
      const id = `att-${r.studentId}-${date}`
      return prisma.attendance.upsert({
        where: { id },
        update: { status: r.status },
        create: { id, studentId: r.studentId, classId, teacherId: teacher.id, date, status: r.status }
      })
    })
  )
  return NextResponse.json(results)
}
