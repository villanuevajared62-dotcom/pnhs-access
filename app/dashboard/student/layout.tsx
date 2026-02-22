import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

const navItems = [
  { href: '/dashboard/student', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/student/grades', icon: '📝', label: 'My Grades' },
  { href: '/dashboard/student/attendance', icon: '✅', label: 'Attendance' },
  { href: '/dashboard/student/profile', icon: '👤', label: 'Profile' },
  { href: '/dashboard/student/announcements', icon: '📢', label: 'Announcements' },
]

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'student') redirect('/auth/login')
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="student" name={session.name} navItems={navItems} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
