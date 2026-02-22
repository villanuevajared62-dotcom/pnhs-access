'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface NavItem { href: string; icon: string; label: string }

export default function Sidebar({ role, name, navItems }: { role: string; name: string; navItems: NavItem[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  const roleColors: Record<string, string> = { admin: 'bg-red-100 text-red-700', teacher: 'bg-blue-100 text-blue-700', student: 'bg-green-100 text-green-700' }
  const roleLabel: Record<string, string> = { admin: 'Administrator', teacher: 'Teacher', student: 'Student' }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xs">PNHS</span>
          </div>
          <div>
            <div className="font-display font-bold text-green-800 text-sm">PNHS ACCESS</div>
            <div className="text-xs text-gray-400">Portal System</div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 mx-3 mt-4 bg-green-50 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 text-sm truncate">{name}</div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[role]}`}>
              {roleLabel[role]}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 mt-2 space-y-1">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : 'text-gray-600'}`}>
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button onClick={logout} disabled={loggingOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <span className="text-lg">🚪</span>
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  )
}
