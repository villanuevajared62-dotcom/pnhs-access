'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Calendar, Award, FileText, LogOut, Menu, X, GraduationCap,
  Bell, TrendingUp, Clock, User as UserIcon, Download, Check, Upload,
  MessageSquare, Star, AlertCircle, CheckCircle,
} from 'lucide-react'
import { getUserFromStorage, removeUserFromStorage, type User } from '@/lib/auth'

interface Subject {
  id: string
  name: string
  grade: string
  teacher: string
  status: 'excellent' | 'good' | 'average'
  attendance: string
  assignments: { completed: number; total: number }
}

interface Assignment {
  id: string
  title: string
  subject: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded'
  grade?: string
}

interface Announcement {
  id: string
  title: string
  message: string
  date: string
  type: 'info' | 'warning' | 'success'
}

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Mathematics', grade: '92', teacher: 'Ms. Santos', status: 'excellent', attendance: '95%', assignments: { completed: 12, total: 15 } },
    { id: '2', name: 'Science', grade: '88', teacher: 'Mr. Cruz', status: 'good', attendance: '92%', assignments: { completed: 10, total: 12 } },
    { id: '3', name: 'English', grade: '90', teacher: 'Ms. Garcia', status: 'excellent', attendance: '97%', assignments: { completed: 14, total: 15 } },
    { id: '4', name: 'Filipino', grade: '85', teacher: 'Mr. Reyes', status: 'good', attendance: '90%', assignments: { completed: 11, total: 13 } },
    { id: '5', name: 'History', grade: '94', teacher: 'Ms. Torres', status: 'excellent', attendance: '98%', assignments: { completed: 13, total: 14 } },
  ])

  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: '1', title: 'Algebra Problem Set', subject: 'Mathematics', dueDate: 'Feb 15, 2026', status: 'pending' },
    { id: '2', title: 'Science Lab Report', subject: 'Science', dueDate: 'Feb 12, 2026', status: 'submitted' },
    { id: '3', title: 'Essay on Literature', subject: 'English', dueDate: 'Feb 18, 2026', status: 'pending' },
    { id: '4', title: 'History Research Paper', subject: 'History', dueDate: 'Feb 20, 2026', status: 'graded', grade: '95' },
  ])

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: '1', title: 'Midterm Examinations', message: 'Midterm exams will be conducted from February 15-20, 2026. Please review your schedules.', date: '2 days ago', type: 'info' },
    { id: '2', title: 'School Foundation Day', message: 'Join us in celebrating PNHS Foundation Day on February 25, 2026. Various activities planned!', date: '5 days ago', type: 'success' },
    { id: '3', title: 'Library Hours Extended', message: 'Library will be open until 8 PM during exam week to accommodate students.', date: '1 week ago', type: 'info' },
  ])

  const schedule = [
    { subject: 'Mathematics', time: '8:00 AM - 9:00 AM', room: 'Room 101', teacher: 'Ms. Santos' },
    { subject: 'Science', time: '9:30 AM - 10:30 AM', room: 'Room 205', teacher: 'Mr. Cruz' },
    { subject: 'English', time: '11:00 AM - 12:00 PM', room: 'Room 103', teacher: 'Ms. Garcia' },
    { subject: 'Filipino', time: '1:00 PM - 2:00 PM', room: 'Room 104', teacher: 'Mr. Reyes' },
  ]

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

  const handleNavigation = (tab: string) => {
    setActiveTab(tab)
  }

  const handleSubmitAssignment = (assignmentId: string) => {
    setAssignments(assignments.map(a =>
      a.id === assignmentId ? { ...a, status: 'submitted' as const } : a
    ))
    alert('Assignment submitted successfully!')
  }

  const calculateGPA = () => {
    const total = subjects.reduce((sum, subject) => sum + parseFloat(subject.grade), 0)
    return (total / subjects.length).toFixed(1)
  }

  const calculateAttendance = () => {
    const attendances = subjects.map(s => parseFloat(s.attendance.replace('%', '')))
    const total = attendances.reduce((sum, att) => sum + att, 0)
    return `${(total / attendances.length).toFixed(0)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const stats = [
    { label: 'Overall GPA', value: calculateGPA(), icon: Award, color: 'bg-yellow-500' },
    { label: 'Attendance', value: calculateAttendance(), icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Enrolled Subjects', value: subjects.length.toString(), icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Pending Tasks', value: assignments.filter(a => a.status === 'pending').length.toString(), icon: FileText, color: 'bg-orange-500' },
  ]

  const navigationItems = [
    { icon: BookOpen, label: 'Dashboard', key: 'dashboard' },
    { icon: Award, label: 'My Grades', key: 'grades' },
    { icon: Calendar, label: 'Schedule', key: 'schedule' },
    { icon: FileText, label: 'Assignments', key: 'assignments' },
    { icon: UserIcon, label: 'Profile', key: 'profile' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'grades':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Grades</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Download className="w-5 h-5" />
                Download Report Card
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Academic Summary</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-4xl font-bold text-purple-600">{calculateGPA()}</div>
                  <div className="text-sm text-gray-600 mt-1">Current GPA</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-4xl font-bold text-green-600">{calculateAttendance()}</div>
                  <div className="text-sm text-gray-600 mt-1">Attendance Rate</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-4xl font-bold text-blue-600">{subjects.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Enrolled Subjects</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="bg-white rounded-2xl shadow-md p-6 border border-purple-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{subject.teacher}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-purple-600">{subject.grade}</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                        subject.status === 'excellent' ? 'bg-green-100 text-green-700' :
                        subject.status === 'good' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {subject.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-600">Attendance</p>
                      <p className="text-lg font-semibold text-gray-900">{subject.attendance}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Assignments</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {subject.assignments.completed}/{subject.assignments.total}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'schedule':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Schedule</h2>
            
            <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Today's Classes</h3>
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
              <div className="space-y-3">
                {schedule.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{item.subject}</p>
                        <p className="text-sm text-gray-600">{item.teacher}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>{item.time}</span>
                          </div>
                          <span className="text-sm text-gray-600">{item.room}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Schedule</h3>
              <div className="grid grid-cols-6 gap-2">
                <div className="font-semibold text-sm text-gray-700 p-2">Time</div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                  <div key={day} className="font-semibold text-sm text-gray-700 p-2 text-center">{day}</div>
                ))}
                
                {['8:00 AM', '9:30 AM', '11:00 AM', '1:00 PM'].map((time, idx) => (
                  <>
                    <div key={time} className="text-xs text-gray-600 p-2">{time}</div>
                    {[1, 2, 3, 4, 5].map(day => (
                      <div key={`${time}-${day}`} className="p-2 border border-gray-200 rounded text-xs">
                        {idx < schedule.length ? schedule[idx].subject.slice(0, 10) : ''}
                      </div>
                    ))}
                  </>
                ))}
              </div>
            </div>
          </div>
        )

      case 'assignments':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Assignments</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">
                  {assignments.filter(a => a.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Pending</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">
                  {assignments.filter(a => a.status === 'submitted').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Submitted</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">
                  {assignments.filter(a => a.status === 'graded').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Graded</div>
              </div>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-2xl shadow-md p-6 border border-purple-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{assignment.subject}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      assignment.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {assignment.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Due: {assignment.dueDate}</span>
                    </div>
                    
                    {assignment.status === 'pending' && (
                      <button
                        onClick={() => handleSubmitAssignment(assignment.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Submit
                      </button>
                    )}
                    
                    {assignment.status === 'graded' && assignment.grade && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Grade:</span>
                        <span className="text-xl font-bold text-green-600">{assignment.grade}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'profile':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-5xl mb-4">
                    {user?.fullName.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{user?.fullName}</h3>
                  <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600">Student ID</div>
                    <div className="font-semibold text-gray-900">{user?.studentId || 'STU-2024-001'}</div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white rounded-2xl shadow-md p-6 border border-purple-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.fullName}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                      <input
                        type="text"
                        defaultValue={user?.gradeLevel || 'Grade 10'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                      <input
                        type="text"
                        defaultValue={user?.section || 'Section A'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-md p-6 border border-purple-100 hover:border-purple-400 transition-all duration-300">
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
              <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">My Subjects</h2>
                  <button
                    onClick={() => handleNavigation('grades')}
                    className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {subjects.slice(0, 5).map((subject) => (
                    <div
                      key={subject.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 transition-colors cursor-pointer"
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

              <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>
                <div className="space-y-3">
                  {schedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
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

            <div className="mt-8 bg-white rounded-2xl shadow-md p-6 border border-purple-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Announcements</h2>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-4 border-l-4 rounded-lg ${
                      announcement.type === 'info' ? 'bg-blue-50 border-blue-500' :
                      announcement.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-green-50 border-green-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{announcement.title}</h3>
                        <p className="text-gray-600 mt-1">{announcement.message}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{announcement.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-purple-700 to-purple-600 text-white transition-all duration-300 z-50 shadow-2xl ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center w-full'}`}>
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
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.key)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.key ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-purple-100'
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

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-purple-100">
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

        <main className="p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}