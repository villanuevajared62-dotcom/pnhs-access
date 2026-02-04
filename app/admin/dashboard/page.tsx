'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  TrendingUp,
  Calendar,
  Bell,
  Search,
  Menu,
  X,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-pnhs-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Students', value: '1,245', icon: Users, color: 'bg-blue-500', change: '+12%' },
    { label: 'Active Teachers', value: '48', icon: GraduationCap, color: 'bg-green-500', change: '+3%' },
    { label: 'Total Classes', value: '32', icon: BookOpen, color: 'bg-purple-500', change: '+5%' },
    { label: 'Attendance Rate', value: '94.5%', icon: TrendingUp, color: 'bg-orange-500', change: '+2.1%' },
  ]

  const recentActivities = [
    { action: 'New student enrolled', user: 'John Doe', time: '2 hours ago', type: 'success' },
    { action: 'Grade submitted', user: 'Ms. Santos', time: '3 hours ago', type: 'info' },
    { action: 'Attendance recorded', user: 'Mr. Cruz', time: '5 hours ago', type: 'info' },
    { action: 'New teacher added', user: 'Admin', time: '1 day ago', type: 'success' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-pnhs-dark to-pnhs-primary text-white transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-lg">PNHS</h1>
                  <p className="text-xs text-blue-200">Admin Panel</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <nav className="space-y-2">
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  item.active
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 text-blue-100'
                } ${!sidebarOpen && 'justify-center'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/20">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-blue-100 ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.fullName}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pnhs-primary"
                  />
                </div>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pnhs-primary to-pnhs-secondary rounded-full flex items-center justify-center text-white font-bold">
                    {user?.fullName.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-green-600 font-semibold text-sm">{stat.change}</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="card hover:scale-105 transition-transform flex items-center space-x-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <UserPlus className="w-8 h-8" />
                <div className="text-left">
                  <h3 className="font-bold">Add Student</h3>
                  <p className="text-sm text-blue-100">Enroll new student</p>
                </div>
              </button>
              <button className="card hover:scale-105 transition-transform flex items-center space-x-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                <GraduationCap className="w-8 h-8" />
                <div className="text-left">
                  <h3 className="font-bold">Add Teacher</h3>
                  <p className="text-sm text-green-100">Register new teacher</p>
                </div>
              </button>
              <button className="card hover:scale-105 transition-transform flex items-center space-x-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <FileText className="w-8 h-8" />
                <div className="text-left">
                  <h3 className="font-bold">Generate Report</h3>
                  <p className="text-sm text-purple-100">Create analytics report</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                    ></div>
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
