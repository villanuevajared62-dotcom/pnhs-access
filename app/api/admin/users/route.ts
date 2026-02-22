import { NextResponse, NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { username, password, role, name, email, gradeLevel, section, department } = body
  const hash = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({ data: { username, password: hash, role, name, email } })
    if (role === 'student') {
      const sid = `PNHS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`
      await prisma.student.create({ data: { userId: user.id, studentId: sid, gradeLevel: gradeLevel || '7', section: section || 'A' } })
    } else if (role === 'teacher') {
      await prisma.teacher.create({ data: { userId: user.id, department: department || '' } })
    }
    return NextResponse.json({ success: true, id: user.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error creating user'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
