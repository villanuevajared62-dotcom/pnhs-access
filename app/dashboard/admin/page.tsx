import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import TopBar from '@/components/layout/TopBar'
import Link from 'next/link'

export default async function AdminDashboard() {
  const session = await getSession()
  const [totalStudents, totalTeachers, totalClasses, announcements, recentGrades] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 4 }),
    prisma.grade.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { student: { include: { user: true } }, class: { include: { subject: true } } } }),
  ])

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: '🎓', color: 'from-green-400 to-green-600', link: '/dashboard/admin/students' },
    { label: 'Total Teachers', value: totalTeachers, icon: '👨‍🏫', color: 'from-blue-400 to-blue-600', link: '/dashboard/admin/teachers' },
    { label: 'Active Classes', value: totalClasses, icon: '🏫', color: 'from-yellow-400 to-yellow-600', link: '/dashboard/admin/classes' },
    { label: 'Announcements', value: announcements.length, icon: '📢', color: 'from-purple-400 to-purple-600', link: '/dashboard/admin/announcements' },
  ]

  return (
    <div>
      <TopBar title={`Welcome, ${session?.name}! 👋`} subtitle="Here's what's happening today" />
      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map(s => (
            <Link key={s.label} href={s.link} className="card hover:shadow-md transition-all group">
              <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                {s.icon}
              </div>
              <div className="font-display font-bold text-2xl text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Announcements */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900">📢 Announcements</h2>
              <Link href="/dashboard/admin/announcements" className="text-green-600 text-sm hover:underline">View all</Link>
            </div>
            {announcements.length === 0 && <p className="text-gray-400 text-sm">No announcements yet.</p>}
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="bg-green-50 rounded-xl p-4">
                  <div className="font-semibold text-gray-800 text-sm">{a.title}</div>
                  <div className="text-gray-500 text-xs mt-1 line-clamp-2">{a.content}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{a.audience}</span>
                    <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Grades */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900">📝 Recent Grade Entries</h2>
            </div>
            {recentGrades.length === 0 && <p className="text-gray-400 text-sm">No grades yet.</p>}
            <div className="space-y-2">
              {recentGrades.map(g => (
                <div key={g.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{g.student.user.name}</div>
                    <div className="text-xs text-gray-400">{g.class.subject.name} — Q{g.quarter}</div>
                  </div>
                  <div className={`font-bold text-sm px-3 py-1 rounded-lg ${g.score >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {g.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-6">
          <h2 className="font-display font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: '/dashboard/admin/users', icon: '➕', label: 'Add User' },
              { href: '/dashboard/admin/announcements', icon: '📣', label: 'Post Announcement' },
              { href: '/dashboard/admin/classes', icon: '🏫', label: 'Manage Classes' },
              { href: '/dashboard/admin/reports', icon: '📊', label: 'View Reports' },
            ].map(a => (
              <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-green-50 rounded-xl transition-colors group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
                <span className="text-xs font-medium text-gray-600 group-hover:text-green-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
