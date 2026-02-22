import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create subjects
  const subjects = await Promise.all([
    prisma.subject.upsert({ where: { code: 'MATH' }, update: {}, create: { name: 'Mathematics', code: 'MATH' } }),
    prisma.subject.upsert({ where: { code: 'ENG' }, update: {}, create: { name: 'English', code: 'ENG' } }),
    prisma.subject.upsert({ where: { code: 'SCI' }, update: {}, create: { name: 'Science', code: 'SCI' } }),
    prisma.subject.upsert({ where: { code: 'FIL' }, update: {}, create: { name: 'Filipino', code: 'FIL' } }),
    prisma.subject.upsert({ where: { code: 'AP' }, update: {}, create: { name: 'Araling Panlipunan', code: 'AP' } }),
    prisma.subject.upsert({ where: { code: 'PE' }, update: {}, create: { name: 'Physical Education', code: 'PE' } }),
  ])

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminHash, role: 'admin', name: 'System Administrator', email: 'admin@pnhs.edu.ph' }
  })

  // Teachers
  const teacher1Hash = await bcrypt.hash('teacher123', 10)
  const teacherUser1 = await prisma.user.upsert({
    where: { username: 'teacher1' },
    update: {},
    create: { username: 'teacher1', password: teacher1Hash, role: 'teacher', name: 'Maria Santos', email: 'msantos@pnhs.edu.ph' }
  })
  const teacher1 = await prisma.teacher.upsert({
    where: { userId: teacherUser1.id },
    update: {},
    create: { userId: teacherUser1.id, department: 'Mathematics', subjectIds: subjects[0].id }
  })

  const teacherUser2 = await prisma.user.upsert({
    where: { username: 'teacher2' },
    update: {},
    create: { username: 'teacher2', password: teacher1Hash, role: 'teacher', name: 'Jose Reyes', email: 'jreyes@pnhs.edu.ph' }
  })
  const teacher2 = await prisma.teacher.upsert({
    where: { userId: teacherUser2.id },
    update: {},
    create: { userId: teacherUser2.id, department: 'Science', subjectIds: subjects[2].id }
  })

  // Classes
  const class1 = await prisma.class.upsert({
    where: { id: 'class-7a-math' },
    update: {},
    create: { id: 'class-7a-math', name: 'Grade 7 - Sampaguita (Math)', gradeLevel: '7', section: 'Sampaguita', teacherId: teacher1.id, subjectId: subjects[0].id, schedule: 'MWF 7:30-8:30 AM' }
  })
  const class2 = await prisma.class.upsert({
    where: { id: 'class-8b-sci' },
    update: {},
    create: { id: 'class-8b-sci', name: 'Grade 8 - Rosal (Science)', gradeLevel: '8', section: 'Rosal', teacherId: teacher2.id, subjectId: subjects[2].id, schedule: 'TTh 9:00-10:00 AM' }
  })

  // Students
  const studentHash = await bcrypt.hash('student123', 10)
  const studentNames = [
    { username: 'student1', name: 'Juan Dela Cruz', studentId: 'PNHS-2024-001' },
    { username: 'student2', name: 'Ana Reyes', studentId: 'PNHS-2024-002' },
    { username: 'student3', name: 'Carlo Mendoza', studentId: 'PNHS-2024-003' },
    { username: 'student4', name: 'Sofia Garcia', studentId: 'PNHS-2024-004' },
    { username: 'student5', name: 'Miguel Torres', studentId: 'PNHS-2024-005' },
  ]

  const studentRecords = []
  for (const s of studentNames) {
    const u = await prisma.user.upsert({
      where: { username: s.username },
      update: {},
      create: { username: s.username, password: studentHash, role: 'student', name: s.name }
    })
    const st = await prisma.student.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, studentId: s.studentId, gradeLevel: '7', section: 'Sampaguita', classId: class1.id }
    })
    studentRecords.push(st)
  }

  // Grades
  for (const student of studentRecords) {
    for (let q = 1; q <= 4; q++) {
      const score = Math.floor(Math.random() * 30) + 70
      await prisma.grade.upsert({
        where: { id: `grade-${student.id}-${class1.id}-${q}` },
        update: {},
        create: { id: `grade-${student.id}-${class1.id}-${q}`, studentId: student.id, classId: class1.id, teacherId: teacher1.id, quarter: q, score, remarks: score >= 75 ? 'Passed' : 'Failed' }
      })
    }
  }

  // Attendance (last 7 days)
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    for (const student of studentRecords) {
      const statuses = ['present', 'present', 'present', 'present', 'late', 'absent', 'present']
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      await prisma.attendance.upsert({
        where: { id: `att-${student.id}-${dateStr}` },
        update: {},
        create: { id: `att-${student.id}-${dateStr}`, studentId: student.id, classId: class1.id, teacherId: teacher1.id, date: dateStr, status }
      })
    }
  }

  // Announcements
  await prisma.announcement.upsert({
    where: { id: 'ann-1' },
    update: {},
    create: { id: 'ann-1', title: 'Welcome Back, School Year 2025-2026!', content: 'We are thrilled to welcome everyone back for the new school year. Let us work together for academic excellence.', authorId: 'admin', audience: 'all' }
  })
  await prisma.announcement.upsert({
    where: { id: 'ann-2' },
    update: {},
    create: { id: 'ann-2', title: 'First Quarter Exams Schedule', content: 'First quarter examinations will be held on September 16-20, 2025. Please review your schedules.', authorId: 'admin', audience: 'all' }
  })
  await prisma.announcement.upsert({
    where: { id: 'ann-3' },
    update: {},
    create: { id: 'ann-3', title: 'Grade Submission Deadline', content: 'All teachers must submit first quarter grades by October 1, 2025. Please use the Teacher Portal for submissions.', authorId: 'admin', audience: 'teachers' }
  })

  console.log('Database seeded successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
