'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  Award,
  FileText,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Bell,
  TrendingUp,
  Clock,
  User,
} from 'lucide-react'
import { getUserFromStorage, removeUserFromStorage, type User } from '@/lib/auth'

// Type for navigation items
type NavItem = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUserFromStorage()
    if (!currentUser || currentUser.role !== 'student') {
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

  const subjects = [
    { name: 'Mathematics', grade: '92', teacher: 'Ms. Santos', status: 'excellent' },
    { name: 'Science', grade: '88', teacher: 'Mr. Cruz', status: 'good' },
    { name: 'English', grade: '90', teacher: 'Ms. Garcia', status: 'excellent' },
    { name: 'Filipino', grade: '85', teacher: 'Mr. Reyes', status: 'good' },
    { name: 'History', grade: '94', teacher: 'Ms. Torres', status: 'excellent' },
  ]

  const schedule = [
    { subject: 'Mathematics', time: '8:00 AM - 9:00 AM', room: 'Room 101' },
    { subject: 'Science', time: '9:30 AM - 10:30 AM', room: 'Room 205' },
    { subject: 'English', time: '11:00 AM - 12:00 PM', room: 'Room 103' },
    { subject: 'Filipino', time: '1:00 PM - 2:00 PM', room: 'Room 104' },
  ]

  const stats = [
    { label: 'Overall GPA', value: '89.8', icon: Award, color: 'bg-lime-600' },
    { label: 'Attendance', value: '95%', icon: TrendingUp, color: 'bg-teal-600' },
    { label: 'Enrolled Subjects', value: '8', icon: BookOpen, color: 'bg-green-600' },
    { label: 'Pending Tasks', value: '3', icon: FileText, color: 'bg-emerald-600' },
  ]

  const navItems: NavItem[] = [
    { icon: BookOpen, label: 'Dashboard', active: true },
    { icon: Award, label: 'My Grades' },
    { icon: Calendar, label: 'Schedule' },
    { icon: FileText, label: 'Assignments' },
    { icon: User, label: 'Profile' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-green-700 to-green-600 text-white transition-all duration-300 z-50 shadow-2xl ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div
                className={`flex items-center justify-center rounded-xl overflow-hidden shadow-lg bg-white/10 border border-white/20 ${
                  sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'
                } relative`}
              >
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
                  <p className="text-xs text-green-200">Student Portal</p>
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
            {navItems.map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${
                  item.active
                    ? 'bg-white/20 shadow-inner font-semibold'
                    : 'hover:bg-white/10 text-green-100'
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
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-green-100 ${
              !sidebarOpen && 'justify-center px-0'
            }`}
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-green-100">
          <div className="px-6 lg:px-10 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-green-800">Student Dashboard</h1>
                <p className="text-green-600 mt-1">
                  Welcome back, {user?.fullName ?? 'Student'}!
                </p>
              </div>
              <div className="flex items-center space-x-5">
                <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-6 h-6 text-gray-700" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-lime-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {user?.fullName?.charAt(0) ?? 'S'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-10">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md p-6 border border-green-100 hover:border-lime-400 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-4 rounded-xl`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-lime-800">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Subjects & Schedule */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* My Subjects */}
            <div className="bg-white rounded-2xl shadow-md p-7 border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-green-800">My Subjects</h2>
                <button className="text-lime-600 hover:text-lime-800 font-medium text-sm">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {subjects.map((sub, i) => (
                  <div
                    key={i}
                    className="p-5 border border-gray-200 rounded-xl hover:border-lime-400 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{sub.name}</h3>
                        <p className="text-sm text-gray-600">{sub.teacher}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-lime-700">{sub.grade}</div>
                        <div
                          className={`text-xs font-semibold mt-1 ${
                            sub.status === 'excellent' ? 'text-green-600' : 'text-teal-600'
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-md p-7 border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-green-800">Today's Schedule</h2>
                <span className="px-4 py-1.5 bg-lime-100 text-lime-700 rounded-full text-sm font-semibold">
                  Wednesday
                </span>
              </div>
              <div className="space-y-4">
                {schedule.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:bg-lime-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.subject}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.room}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}