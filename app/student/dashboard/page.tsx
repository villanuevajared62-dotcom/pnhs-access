'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Calendar, Award, FileText, LogOut, Menu, X, GraduationCap,
  Bell, TrendingUp, Clock, User as UserIcon, Download, Upload, ChevronRight,
  Home, RefreshCw, Search, Mail, Eye, Plus, Check, Filter, ChevronDown,
  CheckCircle, AlertCircle, XCircle, TrendingDown, TrendingUp as TrendingUpIcon,
  PieChart, BarChart3
} from 'lucide-react'
import { getUserFromStorage, removeUserFromStorage, type User } from '@/lib/auth'
import { getAnnouncements, formatDate, type Announcement } from '@/lib/shared-data'

interface Subject {
  id: string
  name: string
  grade: string
  teacher: string
  status: 'excellent' | 'good' | 'average'
  attendance: string
  attendanceRecords: {
    present: number
    late: number
    absent: number
    total: number
  }
  assignments: { completed: number; total: number }
  attendanceHistory: {
    date: string
    status: 'present' | 'late' | 'absent'
  }[]
}

interface Assignment {
  id: string
  title: string
  subject: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded'
  grade?: string
  description?: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [showAssignmentModal, setShowAssignmentModal] = useState<Assignment | null>(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState<Subject | null>(null)

  const [subjects, setSubjects] = useState<Subject[]>([
    { 
      id: '1', 
      name: 'Mathematics', 
      grade: '92', 
      teacher: 'Ms. Santos', 
      status: 'excellent', 
      attendance: '95%',
      attendanceRecords: { present: 19, late: 1, absent: 0, total: 20 },
      assignments: { completed: 12, total: 15 },
      attendanceHistory: [
        { date: '2026-01-15', status: 'present' },
        { date: '2026-01-16', status: 'present' },
        { date: '2026-01-17', status: 'late' },
        { date: '2026-01-18', status: 'present' },
        { date: '2026-01-19', status: 'present' },
      ]
    },
    { 
      id: '2', 
      name: 'Science', 
      grade: '88', 
      teacher: 'Mr. Cruz', 
      status: 'good', 
      attendance: '92%',
      attendanceRecords: { present: 18, late: 2, absent: 0, total: 20 },
      assignments: { completed: 10, total: 12 },
      attendanceHistory: [
        { date: '2026-01-15', status: 'present' },
        { date: '2026-01-16', status: 'present' },
        { date: '2026-01-17', status: 'present' },
        { date: '2026-01-18', status: 'late' },
        { date: '2026-01-19', status: 'present' },
      ]
    },
    { 
      id: '3', 
      name: 'English', 
      grade: '90', 
      teacher: 'Ms. Garcia', 
      status: 'excellent', 
      attendance: '97%',
      attendanceRecords: { present: 20, late: 0, absent: 0, total: 20 },
      assignments: { completed: 14, total: 15 },
      attendanceHistory: [
        { date: '2026-01-15', status: 'present' },
        { date: '2026-01-16', status: 'present' },
        { date: '2026-01-17', status: 'present' },
        { date: '2026-01-18', status: 'present' },
        { date: '2026-01-19', status: 'present' },
      ]
    },
    { 
      id: '4', 
      name: 'Filipino', 
      grade: '85', 
      teacher: 'Mr. Reyes', 
      status: 'good', 
      attendance: '90%',
      attendanceRecords: { present: 18, late: 1, absent: 1, total: 20 },
      assignments: { completed: 11, total: 13 },
      attendanceHistory: [
        { date: '2026-01-15', status: 'present' },
        { date: '2026-01-16', status: 'present' },
        { date: '2026-01-17', status: 'absent' },
        { date: '2026-01-18', status: 'present' },
        { date: '2026-01-19', status: 'late' },
      ]
    },
    { 
      id: '5', 
      name: 'History', 
      grade: '94', 
      teacher: 'Ms. Torres', 
      status: 'excellent', 
      attendance: '98%',
      attendanceRecords: { present: 20, late: 0, absent: 0, total: 20 },
      assignments: { completed: 13, total: 14 },
      attendanceHistory: [
        { date: '2026-01-15', status: 'present' },
        { date: '2026-01-16', status: 'present' },
        { date: '2026-01-17', status: 'present' },
        { date: '2026-01-18', status: 'present' },
        { date: '2026-01-19', status: 'present' },
      ]
    },
  ])

  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: '1', title: 'Algebra Problem Set', subject: 'Mathematics', dueDate: '2026-02-15', status: 'pending', description: 'Solve problems 1-20 from chapter 5' },
    { id: '2', title: 'Science Lab Report', subject: 'Science', dueDate: '2026-02-12', status: 'submitted', description: 'Report on chemical reactions experiment' },
    { id: '3', title: 'Essay on Literature', subject: 'English', dueDate: '2026-02-18', status: 'pending', description: 'Write a 1000-word essay on Shakespeare' },
    { id: '4', title: 'History Research Paper', subject: 'History', dueDate: '2026-02-20', status: 'graded', grade: '95', description: 'Research paper on Philippine Revolution' },
  ])

  const [announcements, setAnnouncements] = useState<Announcement[]>([])

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
    loadAnnouncements()
    setTimeout(() => setLoading(false), 800)
  }, [router])

  const loadAnnouncements = () => {
    try {
      const allAnnouncements = getAnnouncements()
      setAnnouncements(allAnnouncements)
    } catch (error) {
      console.error('Error loading announcements:', error)
      setAnnouncements([])
    }
  }

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
    setShowAssignmentModal(null)
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

  // Calculate overall attendance statistics
  const calculateAttendanceStats = () => {
    const totalPresent = subjects.reduce((sum, s) => sum + s.attendanceRecords.present, 0)
    const totalLate = subjects.reduce((sum, s) => sum + s.attendanceRecords.late, 0)
    const totalAbsent = subjects.reduce((sum, s) => sum + s.attendanceRecords.absent, 0)
    const totalClasses = subjects.reduce((sum, s) => sum + s.attendanceRecords.total, 0)
    
    const attendanceRate = totalClasses > 0 ? ((totalPresent + totalLate * 0.5) / totalClasses) * 100 : 0
    
    return {
      present: totalPresent,
      late: totalLate,
      absent: totalAbsent,
      total: totalClasses,
      rate: attendanceRate.toFixed(1)
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    if (filterStatus === 'all') return true
    return assignment.status === filterStatus
  })

  const filteredAnnouncements = announcements.filter(announcement => {
    if (!searchTerm) return true
    return announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
           announcement.author.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const attendanceStats = calculateAttendanceStats()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-green-50">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 animate-pulse mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>
        <p className="mt-6 text-green-700 font-semibold text-lg">Loading Student Dashboard...</p>
        <p className="text-gray-600 mt-2">Please wait a moment</p>
      </div>
    )
  }

  const stats = [
    { 
      label: 'Overall GPA', 
      value: calculateGPA(), 
      icon: Award, 
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600', 
      change: '↑ 0.2 from last quarter' 
    },
    { 
      label: 'Attendance Rate', 
      value: `${attendanceStats.rate}%`, 
      icon: TrendingUp, 
      color: 'bg-gradient-to-br from-green-600 to-green-700', 
      change: attendanceStats.rate >= 95 ? 'Excellent' : attendanceStats.rate >= 90 ? 'Good' : 'Needs improvement',
      trend: parseFloat(attendanceStats.rate) >= 95 ? 'up' : parseFloat(attendanceStats.rate) >= 85 ? 'neutral' : 'down'
    },
    { 
      label: 'Enrolled Subjects', 
      value: subjects.length.toString(), 
      icon: BookOpen, 
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600', 
      change: 'Active this semester' 
    },
    { 
      label: 'Pending Tasks', 
      value: assignments.filter(a => a.status === 'pending').length.toString(), 
      icon: FileText, 
      color: 'bg-gradient-to-br from-blue-500 to-blue-600', 
      change: 'Due this week' 
    },
  ]

  const navigationItems = [
    { icon: Home, label: 'Dashboard', key: 'dashboard' },
    { icon: Bell, label: 'Announcements', key: 'announcements', badge: announcements.length },
    { icon: Award, label: 'My Grades', key: 'grades' },
    { icon: Calendar, label: 'Schedule', key: 'schedule' },
    { icon: FileText, label: 'Assignments', key: 'assignments' },
    { icon: PieChart, label: 'Attendance', key: 'attendance' },
    { icon: UserIcon, label: 'Profile', key: 'profile' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'announcements':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-green-900">School Announcements</h2>
                <p className="text-gray-600 mt-1">Stay updated with school news and announcements</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={loadAnnouncements}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button 
                  onClick={() => {
                    const data = {
                      student: user?.fullName || 'Student',
                      date: new Date().toISOString(),
                      announcements: announcements
                    }
                    const json = JSON.stringify(data, null, 2)
                    const blob = new Blob([json], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `announcements-${new Date().toISOString().split('T')[0]}.json`
                    a.click()
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredAnnouncements.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-green-100 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full flex items-center justify-center">
                  <Bell className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                  {searchTerm ? 'No Announcements Found' : 'No Announcements Yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try a different search term' : 'School administration hasn\'t posted any announcements yet.'}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-green-100 group hover:border-green-300"
                  >
                    <div className={`w-full h-2 rounded-full mb-4 ${
                      announcement.type === 'info' ? 'bg-blue-500' :
                      announcement.type === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                          {announcement.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          announcement.type === 'info' ? 'bg-blue-100 text-blue-700' :
                          announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {announcement.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed line-clamp-3">
                        {announcement.message}
                      </p>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full flex items-center justify-center">
                              <GraduationCap className="w-4 h-4 text-green-700" />
                            </div>
                            <span>{announcement.author}</span>
                          </div>
                          <span className="text-gray-500">
                            {formatDate ? formatDate(announcement.date) : new Date(announcement.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'grades':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-green-900">My Grades</h2>
                <p className="text-gray-600 mt-1">View your academic performance</p>
              </div>
              <button 
                onClick={() => {
                  const data = {
                    student: user?.fullName || 'Student',
                    gpa: calculateGPA(),
                    attendance: calculateAttendance(),
                    subjects: subjects,
                    date: new Date().toISOString()
                  }
                  const json = JSON.stringify(data, null, 2)
                  const blob = new Blob([json], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `grades-report-${(user?.fullName || 'Student').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800"
              >
                <Download className="w-5 h-5" />
                Download Report
              </button>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Academic Summary</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                  <div className="text-4xl font-bold text-yellow-600">{calculateGPA()}</div>
                  <div className="text-sm text-gray-600 mt-1">Current GPA</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-4xl font-bold text-green-600">{calculateAttendance()}</div>
                  <div className="text-sm text-gray-600 mt-1">Attendance Rate</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600">{subjects.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Enrolled Subjects</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100 hover:border-green-300 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{subject.teacher}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                        {subject.grade}
                      </div>
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
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-green-900">My Schedule</h2>
              <p className="text-gray-600 mt-1">View your class schedule</p>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Today's Classes</h3>
                <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-yellow-100 text-green-700 rounded-full text-sm font-semibold">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div
                    key={index}
                    className="p-5 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-yellow-500 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">{item.subject}</p>
                        <p className="text-sm text-gray-600">{item.teacher}</p>
                        <div className="flex items-center gap-4 mt-2">
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
          </div>
        )

      case 'assignments':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-green-900">My Assignments</h2>
                <p className="text-gray-600 mt-1">Track your assignments and submissions</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-10"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                <div className="text-4xl font-bold text-orange-600">
                  {assignments.filter(a => a.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600 mt-2 font-semibold">Pending</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <div className="text-4xl font-bold text-blue-600">
                  {assignments.filter(a => a.status === 'submitted').length}
                </div>
                <div className="text-sm text-gray-600 mt-2 font-semibold">Submitted</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="text-4xl font-bold text-green-600">
                  {assignments.filter(a => a.status === 'graded').length}
                </div>
                <div className="text-sm text-gray-600 mt-2 font-semibold">Graded</div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100 hover:border-green-300 transition-all cursor-pointer"
                  onClick={() => setShowAssignmentModal(assignment)}
                >
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
                      <span>
                        Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    {assignment.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSubmitAssignment(assignment.id)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 text-sm"
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

      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-green-900">Attendance Overview</h2>
              <p className="text-gray-600 mt-1">Track your attendance across all subjects</p>
            </div>

            {/* Overall Attendance Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm opacity-90">Attendance Rate</div>
                  <TrendingUpIcon className="w-5 h-5" />
                </div>
                <div className="text-4xl font-bold">{attendanceStats.rate}%</div>
                <div className="text-sm mt-2 opacity-90">
                  {attendanceStats.rate >= 95 ? 'Excellent Attendance' : 
                   attendanceStats.rate >= 90 ? 'Good Attendance' : 
                   'Needs Improvement'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm opacity-90">Present</div>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="text-4xl font-bold">{attendanceStats.present}</div>
                <div className="text-sm mt-2 opacity-90">Classes attended</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm opacity-90">Late</div>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="text-4xl font-bold">{attendanceStats.late}</div>
                <div className="text-sm mt-2 opacity-90">Late arrivals</div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm opacity-90">Absent</div>
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="text-4xl font-bold">{attendanceStats.absent}</div>
                <div className="text-sm mt-2 opacity-90">Missed classes</div>
              </div>
            </div>

            {/* Subject-wise Attendance */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance by Subject</h3>
              <div className="space-y-4">
                {subjects.map((subject) => {
                  const attendancePercentage = parseFloat(subject.attendance.replace('%', ''))
                  return (
                    <div 
                      key={subject.id} 
                      className="p-4 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer"
                      onClick={() => setShowAttendanceModal(subject)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{subject.name}</h4>
                          <p className="text-sm text-gray-600">{subject.teacher}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            attendancePercentage >= 95 ? 'text-green-600' :
                            attendancePercentage >= 90 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {subject.attendance}
                          </div>
                          <div className={`text-xs font-semibold ${
                            attendancePercentage >= 95 ? 'text-green-600' :
                            attendancePercentage >= 90 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {attendancePercentage >= 95 ? 'Excellent' :
                             attendancePercentage >= 90 ? 'Good' :
                             'Needs Improvement'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Attendance Progress</span>
                          <span>{subject.attendance}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              attendancePercentage >= 95 ? 'bg-green-500' :
                              attendancePercentage >= 90 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${attendancePercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">{subject.attendanceRecords.present}</div>
                          <div className="text-xs text-gray-600">Present</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg">
                          <div className="text-lg font-bold text-yellow-600">{subject.attendanceRecords.late}</div>
                          <div className="text-xs text-gray-600">Late</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <div className="text-lg font-bold text-red-600">{subject.attendanceRecords.absent}</div>
                          <div className="text-xs text-gray-600">Absent</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Attendance Trends */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Attendance Trends</h3>
              <div className="space-y-4">
                {subjects.map((subject) => {
                  const weeklyData = subject.attendanceHistory.slice(-5)
                  return (
                    <div key={subject.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{subject.name}</span>
                        <span className="text-sm text-gray-600">Last 5 classes</span>
                      </div>
                      <div className="flex gap-1">
                        {weeklyData.map((record, index) => (
                          <div 
                            key={index} 
                            className={`flex-1 h-8 rounded-md flex items-center justify-center ${
                              record.status === 'present' ? 'bg-green-500' :
                              record.status === 'late' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            title={`${new Date(record.date).toLocaleDateString()}: ${record.status}`}
                          >
                            <span className="text-white text-xs font-bold">
                              {record.status.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-green-900">My Profile</h2>
              <p className="text-gray-600 mt-1">View and manage your information</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-5xl mb-4 shadow-lg">
                    {user?.fullName?.charAt(0) || 'S'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{user?.fullName || 'Student'}</h3>
                  <p className="text-sm text-gray-600 mt-1">{user?.email || 'student@pnhs.edu.ph'}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600">Student ID</div>
                    <div className="font-semibold text-gray-900">{user?.studentId || 'STU-2024-001'}</div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.fullName || 'Student Name'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || 'student@pnhs.edu.ph'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                      <input
                        type="text"
                        defaultValue={user?.gradeLevel || 'Grade 10'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                      <input
                        type="text"
                        defaultValue={user?.section || 'Section A'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <div className="space-y-8">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-green-600 via-green-700 to-yellow-600 rounded-3xl shadow-2xl p-8 text-white">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-3">
                    Welcome back, {user?.fullName || 'Student'}! 👋
                  </h1>
                  <p className="text-green-100 text-lg mb-6">Here's your academic overview for today.</p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleNavigation('schedule')}
                      className="px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      View Schedule
                    </button>
                    <button 
                      onClick={() => handleNavigation('attendance')}
                      className="px-5 py-2.5 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-colors font-semibold flex items-center gap-2"
                    >
                      <PieChart className="w-4 h-4" />
                      View Attendance
                    </button>
                  </div>
                </div>
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-transparent border-4 border-white/30 flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-white/90" />
                </div>
              </div>
            </div>

            {/* Stats Grid - UPDATED WITH ATTENDANCE VISUALIZATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.color} shadow-md`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    {stat.trend === 'up' && (
                      <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <TrendingUpIcon className="w-3 h-3" />
                        {stat.change}
                      </div>
                    )}
                    {stat.trend === 'down' && (
                      <div className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        {stat.change}
                      </div>
                    )}
                    {!stat.trend && (
                      <div className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
                  <p className="text-3xl font-bold text-green-800">{stat.value}</p>
                  
                  {/* Attendance Progress Bar for Attendance Rate */}
                  {stat.label === 'Attendance Rate' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{stat.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            parseFloat(attendanceStats.rate) >= 95 ? 'bg-green-500' :
                            parseFloat(attendanceStats.rate) >= 90 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${attendanceStats.rate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Main Content Grid - UPDATED WITH ATTENDANCE SECTION */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* My Subjects with Attendance */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-green-900">My Subjects & Attendance</h2>
                    <p className="text-gray-600 mt-1">Subject-wise attendance overview</p>
                  </div>
                  <button
                    onClick={() => handleNavigation('attendance')}
                    className="text-green-700 hover:text-green-900 font-semibold text-sm flex items-center gap-1"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {subjects.slice(0, 4).map((subject) => {
                    const attendancePercentage = parseFloat(subject.attendance.replace('%', ''))
                    return (
                      <div
                        key={subject.id}
                        className="p-4 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer"
                        onClick={() => handleNavigation('attendance')}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">{subject.name}</h3>
                            <p className="text-sm text-gray-600">{subject.teacher}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                              {subject.grade}
                            </div>
                            <div className={`text-sm font-semibold ${
                              attendancePercentage >= 95 ? 'text-green-600' :
                              attendancePercentage >= 90 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {subject.attendance} Attendance
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Attendance</span>
                            <span>{subject.attendance}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                attendancePercentage >= 95 ? 'bg-green-500' :
                                attendancePercentage >= 90 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${attendancePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-green-900">Today's Schedule</h2>
                    <p className="text-gray-600 mt-1">Your classes for today</p>
                  </div>
                  <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-yellow-100 text-green-700 rounded-full text-sm font-semibold">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                </div>
                <div className="space-y-3">
                  {schedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-yellow-500 rounded-lg flex items-center justify-center mr-4">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.subject}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">{item.room}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-green-900">Recent Announcements</h2>
                  <p className="text-gray-600 mt-1">Latest updates from administration</p>
                </div>
                <button
                  onClick={() => handleNavigation('announcements')}
                  className="text-green-700 hover:text-green-900 font-semibold text-sm flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No announcements yet</p>
                  </div>
                ) : (
                  announcements.slice(0, 3).map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`p-5 rounded-2xl border-l-4 ${
                        announcement.type === 'info' ? 'bg-blue-50 border-blue-500' :
                        announcement.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-green-50 border-green-500'
                      }`}
                      onClick={() => handleNavigation('announcements')}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{announcement.title}</h3>
                          <p className="text-gray-700 mt-2 line-clamp-2">{announcement.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                            <span>{announcement.author}</span>
                            <span>•</span>
                            <span>
                              {formatDate ? formatDate(announcement.date) : new Date(announcement.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-50">
      {/* Sidebar - UPDATED WITH ATTENDANCE TAB */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-green-900 to-green-800 text-white transition-all duration-300 z-50 shadow-2xl ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="p-6">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between mb-10' : 'justify-center mb-8'}`}>
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-12 h-12 rounded-full shadow-lg overflow-hidden bg-white p-1">
                <img src="/login/public/logo.png" alt="PNHS Logo" className="w-full h-full object-contain" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-xl">PNHS</h1>
                  <p className="text-xs text-green-200">Student Portal</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {sidebarOpen && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {user?.fullName?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="font-semibold">{user?.fullName || 'Student'}</h3>
                <p className="text-xs text-green-200">Attendance: {attendanceStats.rate}%</p>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.key)}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-start gap-3 px-4' : 'justify-center'} py-3 rounded-xl relative ${
                  activeTab === item.key ? 'bg-white/20' : 'hover:bg-white/10 text-green-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.label}</span>}
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-4' : 'justify-center'} py-3 rounded-xl hover:bg-white/10`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-green-100">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex-1 max-w-2xl mx-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button onClick={() => handleNavigation('attendance')} className="p-2 hover:bg-gray-100 rounded-full relative">
                    <PieChart className="w-6 h-6 text-gray-700" />
                    {parseFloat(attendanceStats.rate) < 90 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="text-sm font-semibold text-gray-900 mb-2">Attendance Summary</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-semibold text-green-600">{attendanceStats.rate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Present:</span>
                        <span className="font-semibold">{attendanceStats.present}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Late:</span>
                        <span className="font-semibold text-yellow-600">{attendanceStats.late}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Absent:</span>
                        <span className="font-semibold text-red-600">{attendanceStats.absent}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleNavigation('announcements')} className="relative p-2 hover:bg-gray-100 rounded-full">
                  <Bell className="w-6 h-6 text-gray-700" />
                  {announcements.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                  )}
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.fullName?.charAt(0) || 'S'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <div className="mb-6">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <button className="hover:text-green-700">Dashboard</button>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold text-green-700 capitalize">{activeTab}</span>
            </nav>
          </div>

          {renderContent()}
        </main>

        <footer className="px-6 lg:px-8 py-4 border-t border-green-100">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
            <p>© {new Date().getFullYear()} PNHS Student Portal. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Pantabangan National High School</p>
          </div>
        </footer>
      </div>

      {/* Attendance Detail Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">{showAttendanceModal.name} Attendance</h3>
              <button
                onClick={() => setShowAttendanceModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl">
                <div className="text-center">
                  <div className="text-5xl font-bold text-green-600 mb-2">{showAttendanceModal.attendance}</div>
                  <div className="text-lg font-semibold text-gray-900">Overall Attendance Rate</div>
                  <div className="text-gray-600">Teacher: {showAttendanceModal.teacher}</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-bold text-green-600">{showAttendanceModal.attendanceRecords.present}</div>
                  <div className="text-sm text-gray-600 mt-1">Present</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <div className="text-3xl font-bold text-yellow-600">{showAttendanceModal.attendanceRecords.late}</div>
                  <div className="text-sm text-gray-600 mt-1">Late</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="text-3xl font-bold text-red-600">{showAttendanceModal.attendanceRecords.absent}</div>
                  <div className="text-sm text-gray-600 mt-1">Absent</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Attendance Progress</span>
                  <span>{showAttendanceModal.attendance}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      parseFloat(showAttendanceModal.attendance) >= 95 ? 'bg-green-500' :
                      parseFloat(showAttendanceModal.attendance) >= 90 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: showAttendanceModal.attendance }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Recent Attendance History */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Recent Attendance History</h4>
                <div className="space-y-2">
                  {showAttendanceModal.attendanceHistory.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          record.status === 'present' ? 'bg-green-500' :
                          record.status === 'late' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowAttendanceModal(null)}
                  className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Detail Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">{showAssignmentModal.title}</h3>
              <button
                onClick={() => setShowAssignmentModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl">{showAssignmentModal.subject}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl">
                    {new Date(showAssignmentModal.dueDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <div className={`px-4 py-3 rounded-xl inline-block ${
                  showAssignmentModal.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                  showAssignmentModal.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {showAssignmentModal.status.toUpperCase()}
                </div>
              </div>

              {showAssignmentModal.description && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-xl">
                    {showAssignmentModal.description}
                  </div>
                </div>
              )}

              {showAssignmentModal.status === 'graded' && showAssignmentModal.grade && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800">Grade Received</h4>
                      <p className="text-sm text-gray-600">Your assignment has been graded</p>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{showAssignmentModal.grade}</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {showAssignmentModal.status === 'pending' && (
                  <button
                    onClick={() => handleSubmitAssignment(showAssignmentModal.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                  >
                    <Upload className="w-5 h-5" />
                    Submit Assignment
                  </button>
                )}
                <button
                  onClick={() => setShowAssignmentModal(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}