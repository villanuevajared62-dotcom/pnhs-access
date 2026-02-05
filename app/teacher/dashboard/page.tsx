'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Users, ClipboardCheck, FileText, Calendar, LogOut, Menu, X,
  GraduationCap, Bell, Search, Award, Clock, TrendingUp,
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
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
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
    { label: 'My Classes', value: '3', icon: BookOpen, color: 'bg-emerald-600' },
    { label: 'Total Students', value: '115', icon: Users, color: 'bg-green-600' },
    { label: 'Pending Grades', value: '12', icon: ClipboardCheck, color: 'bg-lime-600' },
    { label: 'Attendance Rate', value: '96%', icon: TrendingUp, color: 'bg-teal-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-green-800 to-green-700 text-white transition-all duration-300 z-50 shadow-2xl ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className={`flex items-center justify-center rounded-xl overflow-hidden shadow-lg bg-white/10 border border-white/20 ${sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'}`}>
                <img
                  src="/pnhs-logo.png" // change to your actual logo path
                  alt="PNHS Logo"
                  className="w-full h-full object-contain p-1.5"
                />
                <GraduationCap className="absolute w-7 h-7 text-white/40" />
              </div>

              {sidebarOpen && (
                <div className="flex flex-col">
                  <h1 className="font-bold text-xl tracking-tight">PNHS</h1>
                  <p className="text-xs text-green-200">Teacher Portal</p>
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
              { icon: BookOpen, label: 'Dashboard', active: true },
              { icon: Users, label: 'My Classes' },
              { icon: ClipboardCheck, label: 'Attendance' },
              { icon: FileText, label: 'Grades' },
              { icon: Calendar, label: 'Schedule' },
              { icon: Award, label: 'Student Records' },
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
                <h1 className="text-2xl lg:text-3xl font-bold text-green-900">Teacher Dashboard</h1>
                <p className="text-green-700 mt-1">Welcome back, {user?.fullName || 'Teacher'}!</p>
              </div>
              <div className="flex items-center space-x-5">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                  />
                </div>
                <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-6 h-6 text-gray-700" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-green-700 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {user?.fullName?.charAt(0) || 'T'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-green-100 hover:border-emerald-400 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-4 rounded-xl`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-emerald-800">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-md p-7 border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-green-900">My Classes</h2>
                <button className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">View All</button>
              </div>
              <div className="space-y-4">
                {myClasses.map((cls, i) => (
                  <div key={i} className="p-5 border border-gray-200 rounded-xl hover:border-emerald-400 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{cls.name}</h3>
                        <p className="text-sm text-gray-600">{cls.section}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                        {cls.students} students
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                      <Clock className="w-4 h-4" />
                      <span>{cls.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-7 border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-green-900">Upcoming Tasks</h2>
                <button className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Add Task</button>
              </div>
              <div className="space-y-3">
                {upcomingTasks.map((task, i) => (
                  <div key={i} className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:bg-emerald-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{task.task}</p>
                        <p className="text-sm text-gray-600">{task.deadline}</p>
                      </div>
                    </div>
                    <ClipboardCheck className="w-6 h-6 text-gray-400 hover:text-emerald-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-bold text-green-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5">
                <ClipboardCheck className="w-10 h-10" />
                <div className="text-left">
                  <h3 className="font-bold text-lg">Take Attendance</h3>
                  <p className="text-emerald-100 text-sm mt-1">Mark student attendance</p>
                </div>
              </button>
              <button className="bg-gradient-to-r from-lime-600 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5">
                <FileText className="w-10 h-10" />
                <div className="text-left">
                  <h3 className="font-bold text-lg">Submit Grades</h3>
                  <p className="text-lime-100 text-sm mt-1">Enter student grades</p>
                </div>
              </button>
              <button className="bg-gradient-to-r from-teal-600 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5">
                <Calendar className="w-10 h-10" />
                <div className="text-left">
                  <h3 className="font-bold text-lg">View Schedule</h3>
                  <p className="text-teal-100 text-sm mt-1">Check class schedule</p>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}