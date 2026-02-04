'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  Calendar,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Bell,
  Search,
  Award,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { getUserFromStorage, removeUserFromStorage, type User } from '@/lib/auth'

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getUserFromStorage()
    if (!currentUser || currentUser.role !== 'teacher') {
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

  const myClasses = [
    { name: 'Grade 10 - Mathematics', students: 42, section: 'Section A', time: '8:00 AM - 9:00 AM' },
    { name: 'Grade 9 - Algebra', students: 38, section: 'Section B', time: '9:30 AM - 10:30 AM' },
    { name: 'Grade 11 - Statistics', students: 35, section: 'Section C', time: '1:00 PM - 2:00 PM' },
  ]

  const upcomingTasks = [
    { task: 'Submit Q2 Grades', deadline: 'Tomorrow', priority: 'high' },
    { task: 'Parent-Teacher Meeting', deadline: 'Feb 10', priority: 'medium' },
    { task: 'Prepare Midterm Exam', deadline: 'Feb 15', priority: 'medium' },
    { task: 'Update Lesson Plans', deadline: 'Feb 20', priority: 'low' },
  ]

  const stats = [
    { label: 'My Classes', value: '3', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Total Students', value: '115', icon: Users, color: 'bg-green-500' },
    { label: 'Pending Grades', value: '12', icon: ClipboardCheck, color: 'bg-orange-500' },
    { label: 'Attendance Rate', value: '96%', icon: TrendingUp, color: 'bg-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-green-700 to-green-600 text-white transition-all duration-300 z-50 ${
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
                  <p className="text-xs text-green-200">Teacher Portal</p>
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
              { icon: Users, label: 'My Classes' },
              { icon: ClipboardCheck, label: 'Attendance' },
              { icon: FileText, label: 'Grades' },
              { icon: Calendar, label: 'Schedule' },
              { icon: Award, label: 'Student Records' },
            ].map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  item.active
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 text-green-100'
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
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-green-100 ${
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
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.fullName}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold">
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
            {/* My Classes */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Classes</h2>
                <button className="text-green-600 hover:text-green-700 font-semibold text-sm">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {myClasses.map((classItem, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{classItem.name}</h3>
                        <p className="text-sm text-gray-600">{classItem.section}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {classItem.students} students
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{classItem.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Tasks</h2>
                <button className="text-green-600 hover:text-green-700 font-semibold text-sm">
                  Add Task
                </button>
              </div>
              <div className="space-y-3">
                {upcomingTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          task.priority === 'high'
                            ? 'bg-red-500'
                            : task.priority === 'medium'
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900">{task.task}</p>
                        <p className="text-sm text-gray-600">{task.deadline}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <ClipboardCheck className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="card hover:scale-105 transition-transform flex items-center space-x-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                <ClipboardCheck className="w-8 h-8" />
                <div className="text-left">
                  <h3 className="font-bold">Take Attendance</h3>
                  <p className="text-sm text-green-100">Mark student attendance</p>
                </div>
              </button>
              <button className="card hover:scale-105 transition-transform flex items-center space-x-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <FileText className="w-8 h-8" />
                <div className="text-left">
                  <h3 className="font-bold">Submit Grades</h3>
                  <p className="text-sm text-blue-100">Enter student grades</p>
                </div>
              </button>
              <button className="card hover:scale-105 transition-transform flex items-center space-x-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <Calendar className="w-8 h-8" />
                <div className="text-left">
                  <h3 className="font-bold">View Schedule</h3>
                  <p className="text-sm text-purple-100">Check class schedule</p>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
