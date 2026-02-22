import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

const navItems = [
  { href: '/dashboard/teacher', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/teacher/classes', icon: '🏫', label: 'My Classes' },
  { href: '/dashboard/teacher/grades', icon: '📝', label: 'Grades' },
  { href: '/dashboard/teacher/attendance', icon: '✅', label: 'Attendance' },
  { href: '/dashboard/teacher/announcements', icon: '📢', label: 'Announcements' },
]

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'teacher') redirect('/auth/login')
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="teacher" name={session.name} navItems={navItems} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
