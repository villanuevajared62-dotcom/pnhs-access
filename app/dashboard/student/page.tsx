import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'

export default async function StudentDashboard() {
  const session = await getSession()
  const student = await prisma.student.findUnique({
    where: { userId: session!.userId },
    include: { class: { include: { subject: true, teacher: { include: { user: true } } } }, user: true }
  })

  const [grades, attendance, announcements] = await Promise.all([
    student ? prisma.grade.findMany({ where: { studentId: student.id }, include: { class: { include: { subject: true } } } }) : [],
    student ? prisma.attendance.findMany({ where: { studentId: student.id }, orderBy: { date: 'desc' }, take: 10 }) : [],
    prisma.announcement.findMany({ where: { OR: [{ audience: 'all' }, { audience: 'students' }] }, orderBy: { createdAt: 'desc' }, take: 3 }),
  ])

  const avgGrade = grades.length > 0 ? (grades.reduce((a, g) => a + g.score, 0) / grades.length).toFixed(1) : 'N/A'
  const presentDays = attendance.filter(a => a.status === 'present').length
  const attendanceRate = attendance.length > 0 ? ((presentDays / attendance.length) * 100).toFixed(0) : 'N/A'

  return (
    <div>
      <TopBar title={`Hello, ${session?.name}! 🌟`} subtitle="Student Dashboard" />
      <div className="p-8">
        {/* Profile Card */}
        {student && (
          <div className="card mb-6 bg-gradient-to-r from-green-50 to-yellow-50 border-green-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                {student.user.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-gray-900">{student.user.name}</h2>
                <p className="text-gray-600 text-sm">{student.studentId} • Grade {student.gradeLevel} - {student.section}</p>
                {student.class && <p className="text-gray-500 text-xs mt-1">📚 {student.class.subject.name} | 👨‍🏫 {student.class.teacher.user.name}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Average Grade', value: avgGrade !== 'N/A' ? `${avgGrade}%` : 'N/A', icon: '📊', color: 'from-green-400 to-green-600' },
            { label: 'Attendance Rate', value: attendanceRate !== 'N/A' ? `${attendanceRate}%` : 'N/A', icon: '✅', color: 'from-blue-400 to-blue-600' },
            { label: 'Subjects', value: [...new Set(grades.map(g => g.class.subjectId))].length, icon: '📚', color: 'from-yellow-400 to-yellow-600' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-2xl mb-3`}>{s.icon}</div>
              <div className="font-display font-bold text-2xl text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Grades */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900">📝 Recent Grades</h2>
              <Link href="/dashboard/student/grades" className="text-green-600 text-sm hover:underline">View all</Link>
            </div>
            {grades.length === 0 && <p className="text-gray-400 text-sm">No grades yet.</p>}
            <div className="space-y-2">
              {grades.slice(0, 5).map(g => (
                <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{g.class.subject.name}</div>
                    <div className="text-xs text-gray-400">Quarter {g.quarter}</div>
                  </div>
                  <span className={`font-bold text-sm px-3 py-1 rounded-lg ${g.score >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{g.score}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="card">
            <h2 className="font-display font-bold text-gray-900 mb-4">📢 Announcements</h2>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="bg-green-50 rounded-xl p-4">
                  <div className="font-semibold text-gray-800 text-sm">{a.title}</div>
                  <div className="text-gray-500 text-xs mt-1 line-clamp-2">{a.content}</div>
                  <div className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-gray-400 text-sm">No announcements.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
