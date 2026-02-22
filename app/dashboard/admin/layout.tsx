import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

const navItems = [
  { href: '/dashboard/admin', icon: '🏠', label: 'Dashboard' },
  { href: '/dashboard/admin/users', icon: '👥', label: 'User Management' },
  { href: '/dashboard/admin/students', icon: '🎓', label: 'Students' },
  { href: '/dashboard/admin/teachers', icon: '👨‍🏫', label: 'Teachers' },
  { href: '/dashboard/admin/classes', icon: '🏫', label: 'Classes' },
  { href: '/dashboard/admin/announcements', icon: '📢', label: 'Announcements' },
  { href: '/dashboard/admin/reports', icon: '📊', label: 'Reports' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/auth/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="admin" name={session.name} navItems={navItems} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
