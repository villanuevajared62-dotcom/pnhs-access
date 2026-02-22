import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token || token.role !== 'student') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await prisma.student.findUnique({ where: { userId: token.id } })
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: {
      class: {
        include: {
          teacher: { include: { user: true } }
        }
      }
    }
  })

  return NextResponse.json(enrollments.map(e => e.class))
}
