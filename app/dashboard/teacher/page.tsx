import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const session = await getSession()
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.userId },
    include: {
      classes: { include: { subject: true, students: true } },
    }
  })
  const announcements = await prisma.announcement.findMany({
    where: { OR: [{ audience: 'all' }, { audience: 'teachers' }] },
    orderBy: { createdAt: 'desc' }, take: 3
  })
  const recentGrades = teacher ? await prisma.grade.findMany({
    where: { teacherId: teacher.id },
    include: { student: { include: { user: true } }, class: { include: { subject: true } } },
    orderBy: { createdAt: 'desc' }, take: 5
  }) : []

  const totalStudents = teacher?.classes.reduce((acc, c) => acc + c.students.length, 0) || 0

  return (
    <div>
      <TopBar title={`Hello, ${session?.name}! 👋`} subtitle="Teacher Dashboard" />
      <div className="p-8">
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { label: 'My Classes', value: teacher?.classes.length || 0, icon: '🏫', color: 'from-blue-400 to-blue-600' },
            { label: 'Total Students', value: totalStudents, icon: '🎓', color: 'from-green-400 to-green-600' },
            { label: 'Grade Entries', value: recentGrades.length, icon: '📝', color: 'from-yellow-400 to-yellow-600' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-2xl mb-3`}>{s.icon}</div>
              <div className="font-display font-bold text-2xl text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Classes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900">🏫 My Classes</h2>
              <Link href="/dashboard/teacher/classes" className="text-green-600 text-sm hover:underline">View all</Link>
            </div>
            {teacher?.classes.length === 0 && <p className="text-gray-400 text-sm">No classes assigned yet.</p>}
            <div className="space-y-3">
              {teacher?.classes.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.subject.name} • {c.schedule || 'No schedule'}</div>
                  </div>
                  <div className="text-xs bg-white text-blue-700 px-2.5 py-1 rounded-lg font-medium">{c.students.length} students</div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="card">
            <h2 className="font-display font-bold text-gray-900 mb-4">📢 Announcements</h2>
            {announcements.length === 0 && <p className="text-gray-400 text-sm">No announcements.</p>}
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="bg-yellow-50 rounded-xl p-4">
                  <div className="font-semibold text-gray-800 text-sm">{a.title}</div>
                  <div className="text-gray-500 text-xs mt-1 line-clamp-2">{a.content}</div>
                  <div className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-6">
          <h2 className="font-display font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/dashboard/teacher/grades', icon: '📝', label: 'Enter Grades' },
              { href: '/dashboard/teacher/attendance', icon: '✅', label: 'Take Attendance' },
              { href: '/dashboard/teacher/classes', icon: '👥', label: 'View Students' },
            ].map(a => (
              <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
