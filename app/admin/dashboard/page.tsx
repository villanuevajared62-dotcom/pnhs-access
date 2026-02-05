'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, BookOpen, GraduationCap, BarChart3, Settings, LogOut, UserPlus,
  FileText, TrendingUp, Calendar, Bell, Search, Menu, X,
} from 'lucide-react'
import { getUserFromStorage, removeUserFromStorage, type User } from '@/lib/auth'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUserFromStorage()
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login')
      return
    }
    setUser(currentUser)
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    removeUserFromStorage()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Students', value: '1,245', icon: Users, color: 'bg-teal-700', change: '+12%' },
    { label: 'Active Teachers', value: '48', icon: GraduationCap, color: 'bg-green-700', change: '+3%' },
    { label: 'Total Classes', value: '32', icon: BookOpen, color: 'bg-emerald-700', change: '+5%' },
    { label: 'Attendance Rate', value: '94.5%', icon: TrendingUp, color: 'bg-olive-600', change: '+2.1%' },
  ]

  const recentActivities = [
    { action: 'New student enrolled', user: 'John Doe', time: '2 hours ago', type: 'success' },
    { action: 'Grade submitted', user: 'Ms. Santos', time: '3 hours ago', type: 'info' },
    { action: 'Attendance recorded', user: 'Mr. Cruz', time: '5 hours ago', type: 'info' },
    { action: 'New teacher added', user: 'Admin', time: '1 day ago', type: 'success' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-green-900 to-green-800 text-white transition-all duration-300 z-50 shadow-2xl ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className={`flex items-center justify-center rounded-xl overflow-hidden shadow-lg bg-white/10 border border-white/20 ${sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'}`}>
                <img
                  src="/pnhs-logo.png"
                  alt="PNHS Logo"
                  className="w-full h-full object-contain p-1.5"
                />
                <GraduationCap className="absolute w-7 h-7 text-white/40" />
              </div>

              {sidebarOpen && (
                <div className="flex flex-col">
                  <h1 className="font-bold text-xl tracking-tight">PNHS</h1>
                  <p className="text-xs text-green-200">Admin Panel</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <nav className="space-y-1.5">
            {[
              { icon: BarChart3, label: 'Dashboard', active: true },
              { icon: Users, label: 'Students' },
              { icon: GraduationCap, label: 'Teachers' },
              { icon: BookOpen, label: 'Classes' },
              { icon: FileText, label: 'Reports' },
              { icon: Calendar, label: 'Schedule' },
              { icon: Settings, label: 'Settings' },
            ].map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${
                  item.active ? 'bg-white/20 shadow-inner font-semibold' : 'hover:bg-white/10 text-green-100'
                } ${!sidebarOpen && 'justify-center px-0'}`}
              >
                <item.icon className="w-6 h-6 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/15">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-green-100 ${!sidebarOpen && 'justify-center px-0'}`}
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-green-100">
          <div className="px-6 lg:px-10 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-green-900">Admin Dashboard</h1>
                <p className="text-green-700 mt-1">Welcome back, {user?.fullName || 'Admin'}!</p>
              </div>
              <div className="flex items-center space-x-5">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
                  />
                </div>
                <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-6 h-6 text-gray-700" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-green-800 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-green-100 hover:border-teal-400 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-4 rounded-xl`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-green-600 font-semibold text-sm">{stat.change}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-teal-800">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-green-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="bg-gradient-to-r from-teal-700 to-green-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5">
                <UserPlus className="w-10 h-10" />
                <div className="text-left">
                  <h3 className="font-bold text-lg">Add Student</h3>
                  <p className="text-teal-100 text-sm mt-1">Enroll new student</p>
                </div>
              </button>
              <button className="bg-gradient-to-r from-emerald-700 to-green-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5">
                <GraduationCap className="w-10 h-10" />
                <div className="text-left">
                  <h3 className="font-bold text-lg">Add Teacher</h3>
                  <p className="text-emerald-100 text-sm mt-1">Register new teacher</p>
                </div>
              </button>
              <button className="bg-gradient-to-r from-olive-600 to-green-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5">
                <FileText className="w-10 h-10" />
                <div className="text-left">
                  <h3 className="font-bold text-lg">Generate Report</h3>
                  <p className="text-olive-100 text-sm mt-1">Create analytics report</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-7 border border-green-100">
            <h2 className="text-xl font-bold text-green-900 mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${activity.type === 'success' ? 'bg-green-500' : 'bg-teal-500'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.user}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}