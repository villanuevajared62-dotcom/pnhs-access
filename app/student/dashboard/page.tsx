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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-pnhs-primary border-t-transparent rounded-full animate-spin"></div>
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
    { label: 'Overall GPA', value: '89.8', icon: Award, color: 'bg-yellow-500' },
    { label: 'Attendance', value: '95%', icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Enrolled Subjects', value: '8', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Pending Tasks', value: '3', icon: FileText, color: 'bg-orange-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-purple-700 to-purple-600 text-white transition-all duration-300 z-50 ${
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
                  <p className="text-xs text-purple-200">Student Portal</p>
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
              { icon: BookOpen, label: 'Dashboard', active: true },
              { icon: Award, label: 'My Grades' },
              { icon: Calendar, label: 'Schedule' },
              { icon: FileText, label: 'Assignments' },
              { icon: User, label: 'Profile' },
            ].map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  item.active
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 text-purple-100'
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
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-purple-100 ${
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
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.fullName}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
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
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* My Subjects */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Subjects</h2>
                <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {subjects.map((subject, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{subject.name}</h3>
                        <p className="text-sm text-gray-600">{subject.teacher}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">{subject.grade}</div>
                        <div
                          className={`text-xs font-semibold ${
                            subject.status === 'excellent' ? 'text-green-600' : 'text-blue-600'
                          }`}
                        >
                          {subject.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  Wednesday
                </span>
              </div>
              <div className="space-y-3">
                {schedule.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.subject}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{item.room}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="mt-8 card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Announcements</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">Midterm Examinations</h3>
                    <p className="text-gray-600 mt-1">
                      Midterm exams will be conducted from February 15-20, 2026. Please review your
                      schedules.
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">2 days ago</span>
                </div>
              </div>
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">School Foundation Day</h3>
                    <p className="text-gray-600 mt-1">
                      Join us in celebrating PNHS Foundation Day on February 25, 2026. Various
                      activities planned!
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">5 days ago</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
