'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen, Users, ClipboardCheck, FileText, Calendar, LogOut, Menu, X,
  GraduationCap, Bell, Search, Award, Clock, TrendingUp, PlusCircle,
  MessageSquare, Eye, Download, Filter, ChevronRight, Home, RefreshCw,
  UserCheck, BarChart3, Settings, Mail, Edit, Trash2, Save, XCircle, Check,
  ChevronDown, Upload, Plus, EyeOff
} from 'lucide-react'
import { getUserFromStorage, removeUserFromStorage, type User } from '@/lib/auth'
import { getAnnouncements, formatDate, type Announcement } from '@/lib/shared-data'

interface ClassData {
  id: number
  name: string
  students: number
  section: string
  time: string
  room: string
  days: string
}

interface Task {
  id: number
  task: string
  deadline: string
  priority: 'high' | 'medium' | 'low'
  class: string
  completed: boolean
  description?: string
}

interface StudentRecord {
  id: number
  name: string
  class: string
  attendance: string
  status: 'present' | 'late' | 'absent'
  grade: string
  email?: string
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddClassModal, setShowAddClassModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showGradeModal, setShowGradeModal] = useState<StudentRecord | null>(null)
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // New class form state
  const [newClass, setNewClass] = useState({
    name: '',
    section: '',
    time: '',
    room: '',
    days: '',
    students: 0
  })

  // New task form state
  const [newTask, setNewTask] = useState({
    task: '',
    class: 'All Classes',
    deadline: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    description: ''
  })

  // Editing states
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null)

  const [myClasses, setMyClasses] = useState<ClassData[]>([
    { id: 1, name: 'Grade 10 - Mathematics', students: 42, section: 'Section A', time: '8:00 AM - 9:00 AM', room: 'Room 201', days: 'Mon/Wed/Fri' },
    { id: 2, name: 'Grade 9 - Algebra', students: 38, section: 'Section B', time: '9:30 AM - 10:30 AM', room: 'Room 105', days: 'Tue/Thu' },
    { id: 3, name: 'Grade 11 - Statistics', students: 35, section: 'Section C', time: '1:00 PM - 2:00 PM', room: 'Room 301', days: 'Mon/Wed' },
  ])

  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([
    { id: 1, task: 'Submit Q2 Grades', deadline: '2026-02-16', priority: 'high', class: 'Grade 10 Math', completed: false, description: 'Submit final grades for quarter 2' },
    { id: 2, task: 'Parent-Teacher Meeting', deadline: '2026-02-10', priority: 'medium', class: 'All Classes', completed: false, description: 'Quarterly parent-teacher conference' },
    { id: 3, task: 'Prepare Midterm Exam', deadline: '2026-02-15', priority: 'medium', class: 'Grade 9 Algebra', completed: false, description: 'Create midterm exam questions' },
    { id: 4, task: 'Update Lesson Plans', deadline: '2026-02-20', priority: 'low', class: 'All Classes', completed: false, description: 'Update lesson plans for next month' },
  ])

  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([
    { id: 1, name: 'Maria Santos', class: 'Grade 10 - A', attendance: '95%', status: 'present', grade: '92', email: 'maria.santos@pnhs.edu.ph' },
    { id: 2, name: 'Juan Dela Cruz', class: 'Grade 9 - B', attendance: '88%', status: 'present', grade: '85', email: 'juan.delacruz@pnhs.edu.ph' },
    { id: 3, name: 'Ana Reyes', class: 'Grade 11 - C', attendance: '92%', status: 'late', grade: '90', email: 'ana.reyes@pnhs.edu.ph' },
    { id: 4, name: 'Pedro Gonzales', class: 'Grade 10 - A', attendance: '76%', status: 'absent', grade: '78', email: 'pedro.gonzales@pnhs.edu.ph' },
    { id: 5, name: 'Isabella Cruz', class: 'Grade 10 - A', attendance: '98%', status: 'present', grade: '95', email: 'isabella.cruz@pnhs.edu.ph' },
    { id: 6, name: 'Miguel Torres', class: 'Grade 9 - B', attendance: '82%', status: 'present', grade: '88', email: 'miguel.torres@pnhs.edu.ph' },
  ])

  useEffect(() => {
    const currentUser = getUserFromStorage()
    if (!currentUser || currentUser.role !== 'teacher') {
      router.push('/login')
      return
    }
    setUser(currentUser)
    loadAnnouncements()
    setTimeout(() => setLoading(false), 800)
  }, [router])

  const loadAnnouncements = () => {
    const allAnnouncements = getAnnouncements()
    setAnnouncements(allAnnouncements)
  }

  const handleLogout = () => {
    removeUserFromStorage()
    router.push('/login')
  }

  const handleNavigation = (tab: string) => {
    setActiveTab(tab)
  }

  const handleAddClass = () => {
    if (!newClass.name || !newClass.section) {
      alert('Please fill in required fields')
      return
    }

    const newClassObj = {
      id: myClasses.length + 1,
      ...newClass
    }

    setMyClasses([...myClasses, newClassObj])
    setNewClass({
      name: '',
      section: '',
      time: '',
      room: '',
      days: '',
      students: 0
    })
    setShowAddClassModal(false)
  }

  const handleAddTask = () => {
    if (!newTask.task || !newTask.deadline) {
      alert('Please fill in required fields')
      return
    }

    const newTaskObj = {
      id: upcomingTasks.length + 1,
      ...newTask,
      completed: false
    }

    setUpcomingTasks([...upcomingTasks, newTaskObj])
    setNewTask({
      task: '',
      class: 'All Classes',
      deadline: '',
      priority: 'medium',
      description: ''
    })
    setShowAddTaskModal(false)
  }

  const handleDeleteClass = (id: number) => {
    if (confirm('Are you sure you want to delete this class?')) {
      setMyClasses(myClasses.filter(c => c.id !== id))
    }
  }

  const handleToggleTask = (id: number) => {
    setUpcomingTasks(upcomingTasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const handleDeleteTask = (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setUpcomingTasks(upcomingTasks.filter(t => t.id !== id))
    }
  }

  const handleUpdateStudentGrade = () => {
    if (!editingStudent) return
    
    setStudentRecords(studentRecords.map(student =>
      student.id === editingStudent.id ? editingStudent : student
    ))
    setEditingStudent(null)
  }

  const handleTakeAttendance = () => {
    // Simulate taking attendance
    const updatedStudents = studentRecords.map(student => {
      // Randomly update attendance for demo
      const random = Math.random()
      return {
        ...student,
        attendance: `${Math.min(100, parseInt(student.attendance) + (random > 0.7 ? 1 : 0))}%`,
        status: random > 0.8 ? 'absent' : random > 0.6 ? 'late' : 'present' as const
      }
    })
    
    setStudentRecords(updatedStudents)
    setShowAttendanceModal(false)
    alert('Attendance recorded successfully!')
  }

  const handleExportData = () => {
    let data: any
    let filename: string

    switch (activeTab) {
      case 'classes':
        data = myClasses
        filename = 'classes-data'
        break
      case 'attendance':
        data = studentRecords
        filename = 'attendance-data'
        break
      case 'grades':
        data = studentRecords
        filename = 'grades-data'
        break
      case 'students':
        data = studentRecords
        filename = 'students-data'
        break
      default:
        data = { classes: myClasses, students: studentRecords, tasks: upcomingTasks }
        filename = 'teacher-data'
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const filteredStudents = studentRecords.filter(student => {
    if (filterClass !== 'all' && !student.class.includes(filterClass)) return false
    if (filterStatus !== 'all' && student.status !== filterStatus) return false
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !student.email?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const filteredAnnouncements = announcements.filter(announcement => {
    if (!searchTerm) return true
    return announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
           announcement.author.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-green-50">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 animate-pulse mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>
        <p className="mt-6 text-green-700 font-semibold text-lg">Loading Teacher Dashboard...</p>
        <p className="text-gray-600 mt-2">Please wait a moment</p>
      </div>
    )
  }

  const stats = [
    { label: 'My Classes', value: myClasses.length.toString(), icon: BookOpen, color: 'bg-gradient-to-br from-green-600 to-green-700', change: '+1 this sem' },
    { label: 'Total Students', value: myClasses.reduce((sum, c) => sum + c.students, 0).toString(), icon: Users, color: 'bg-gradient-to-br from-yellow-500 to-yellow-600', change: '↗️ 8% from last year' },
    { label: 'Pending Tasks', value: upcomingTasks.filter(t => !t.completed).length.toString(), icon: ClipboardCheck, color: 'bg-gradient-to-br from-blue-500 to-blue-600', change: 'Deadline: Tomorrow' },
    { label: 'Attendance Rate', value: `${Math.round(studentRecords.reduce((sum, s) => sum + parseInt(s.attendance), 0) / studentRecords.length)}%`, icon: TrendingUp, color: 'bg-gradient-to-br from-emerald-500 to-emerald-600', change: '↑ 2% from last month' },
  ]

  const navigationItems = [
    { icon: Home, label: 'Dashboard', key: 'dashboard' },
    { icon: Bell, label: 'Announcements', key: 'announcements', badge: announcements.length },
    { icon: BookOpen, label: 'My Classes', key: 'classes' },
    { icon: UserCheck, label: 'Attendance', key: 'attendance' },
    { icon: FileText, label: 'Grades', key: 'grades' },
    { icon: BarChart3, label: 'Analytics', key: 'analytics' },
    { icon: Award, label: 'Students', key: 'students' },
    { icon: Settings, label: 'Settings', key: 'settings' },
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
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Search Bar */}
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
                <h3 className="text-2xl font-bold text-gray-700 mb-3">No Announcements Found</h3>
                <p className="text-gray-600 mb-6">{searchTerm ? 'Try a different search term' : 'School administration hasn\'t posted any announcements yet.'}</p>
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
                          <span className="text-gray-500">{formatDate(announcement.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'classes':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-green-900">My Classes</h2>
                <p className="text-gray-600 mt-1">Manage your classes and students</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddClassModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                  Add Class
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClasses.map((cls) => (
                <div key={cls.id} className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-green-100 group hover:border-green-300">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                      <p className="text-gray-600 text-sm">{cls.section}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {cls.students}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{cls.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{cls.room}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{cls.days}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setFilterClass(cls.name)
                        handleNavigation('students')
                      }}
                      className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-semibold"
                    >
                      View Students
                    </button>
                    <button 
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-green-900">Attendance Management</h2>
                <p className="text-gray-600 mt-1">Track and manage student attendance</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800"
                >
                  <ClipboardCheck className="w-5 h-5" />
                  Take Attendance
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Classes</option>
                  {myClasses.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border border-green-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Student Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Class</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Attendance Rate</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Today's Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-t border-green-100 hover:bg-green-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.class}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.attendance}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.status === 'present' ? 'bg-green-100 text-green-700' :
                            student.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            onClick={() => {
                              setEditingStudent(student)
                            }}
                            className="text-green-600 hover:text-green-800 mr-3"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setShowGradeModal(student)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'grades':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-green-900">Grades Management</h2>
                <p className="text-gray-600 mt-1">View and manage student grades</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl"
                >
                  <Save className="w-5 h-5" />
                  Submit Grades
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Classes</option>
                {myClasses.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border border-green-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Student Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Class</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Current Grade</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Performance</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-t border-green-100 hover:bg-green-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.class}</td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">{student.grade}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            parseInt(student.grade) >= 90 ? 'bg-green-100 text-green-700' :
                            parseInt(student.grade) >= 80 ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {parseInt(student.grade) >= 90 ? 'Excellent' : parseInt(student.grade) >= 80 ? 'Good' : 'Average'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button 
                            onClick={() => {
                              setEditingStudent(student)
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'students':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-green-900">Student Records</h2>
                <p className="text-gray-600 mt-1">View all student information</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Classes</option>
                {myClasses.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div key={student.id} className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100 hover:border-green-300 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.class}</p>
                        {student.email && <p className="text-xs text-gray-500">{student.email}</p>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Grade:</span>
                      <span className="font-bold text-green-600">{student.grade}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Attendance:</span>
                      <span className="font-semibold text-gray-900">{student.attendance}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'present' ? 'bg-green-100 text-green-700' :
                        student.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setEditingStudent(student)}
                      className="w-full py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-semibold"
                    >
                      Edit Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-green-900">Analytics & Reports</h2>
              <p className="text-gray-600 mt-1">View performance analytics and insights</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Class Performance</h3>
                <div className="space-y-4">
                  {myClasses.map((cls) => {
                    const classStudents = studentRecords.filter(s => s.class.includes(cls.name.split(' - ')[0]))
                    const avgGrade = classStudents.length > 0 
                      ? Math.round(classStudents.reduce((sum, s) => sum + parseInt(s.grade), 0) / classStudents.length)
                      : 0
                    return (
                      <div key={cls.id}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-700">{cls.name}</span>
                          <span className="text-sm font-semibold text-green-600">{avgGrade}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full" style={{ width: `${avgGrade}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Overview</h3>
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-2">
                    {Math.round(studentRecords.reduce((sum, s) => sum + parseInt(s.attendance), 0) / studentRecords.length)}%
                  </div>
                  <div className="text-gray-600">Average Attendance Rate</div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">
                        {studentRecords.filter(s => s.status === 'present').length}
                      </div>
                      <div className="text-xs text-gray-600">Present Today</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-red-600">
                        {studentRecords.filter(s => s.status === 'absent').length}
                      </div>
                      <div className="text-xs text-gray-600">Absent Today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-green-900">Settings</h2>
              <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={user?.fullName}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      defaultValue="Mathematics"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-sm text-gray-700">Email notifications for new announcements</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-sm text-gray-700">Grade submission reminders</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-sm text-gray-700">Attendance alerts</span>
                  </label>
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
                  <h1 className="text-3xl lg:text-4xl font-bold mb-3">Welcome back, {user?.fullName || 'Teacher'}! 👋</h1>
                  <p className="text-green-100 text-lg mb-6">Here's what's happening with your classes today.</p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleNavigation('classes')}
                      className="px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      View Classes
                    </button>
                    <button 
                      onClick={() => setShowAttendanceModal(true)}
                      className="px-5 py-2.5 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-colors font-semibold flex items-center gap-2"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Take Attendance
                    </button>
                  </div>
                </div>
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/20 to-transparent border-4 border-white/30 flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-white/90" />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-green-100 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.color} shadow-md`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {stat.change}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.label}</h3>
                  <p className="text-3xl font-bold text-green-800">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* My Classes */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-green-900">My Classes</h2>
                    <p className="text-gray-600 mt-1">Active classes this semester</p>
                  </div>
                  <button 
                    onClick={() => handleNavigation('classes')}
                    className="text-green-700 hover:text-green-900 font-semibold text-sm flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {myClasses.map((cls) => (
                    <div key={cls.id} className="p-5 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {cls.section}
                            </span>
                            <span className="text-sm text-gray-600">
                              {cls.students} students
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-700">{cls.time}</div>
                          <div className="text-xs text-gray-500">{cls.days}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Tasks */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-green-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-green-900">Upcoming Tasks</h2>
                    <p className="text-gray-600 mt-1">Your pending tasks</p>
                  </div>
                  <button 
                    onClick={() => setShowAddTaskModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {upcomingTasks.filter(t => !t.completed).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{task.task}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">{task.class}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                            <span>{formatDate(announcement.date)}</span>
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
      {/* Sidebar */}
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
                  <p className="text-xs text-green-200">Teacher Portal</p>
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
                {user?.fullName?.charAt(0) || 'T'}
              </div>
              <div>
                <h3 className="font-semibold">{user?.fullName || 'Teacher'}</h3>
                <p className="text-xs text-green-200">Mathematics Teacher</p>
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
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
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
                <button onClick={() => handleNavigation('announcements')} className="relative p-2 hover:bg-gray-100 rounded-full">
                  <Bell className="w-6 h-6 text-gray-700" />
                  {announcements.length > 0 && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.fullName?.charAt(0) || 'T'}
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
            <p>© {new Date().getFullYear()} PNHS Teacher Portal. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Pantabangan National High School</p>
          </div>
        </footer>
      </div>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">Add New Class</h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class Name *</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="e.g., Grade 10 - Mathematics"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Section *</label>
                  <input
                    type="text"
                    value={newClass.section}
                    onChange={(e) => setNewClass({...newClass, section: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    placeholder="e.g., Section A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Students</label>
                  <input
                    type="number"
                    value={newClass.students}
                    onChange={(e) => setNewClass({...newClass, students: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule</label>
                <input
                  type="text"
                  value={newClass.time}
                  onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="e.g., 8:00 AM - 9:00 AM"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room</label>
                  <input
                    type="text"
                    value={newClass.room}
                    onChange={(e) => setNewClass({...newClass, room: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    placeholder="e.g., Room 101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Days</label>
                  <input
                    type="text"
                    value={newClass.days}
                    onChange={(e) => setNewClass({...newClass, days: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    placeholder="e.g., Mon/Wed/Fri"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddClass}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Add Class
                </button>
                <button
                  onClick={() => setShowAddClassModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">Add New Task</h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task *</label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask({...newTask, task: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="e.g., Submit Q2 Grades"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                  <select
                    value={newTask.class}
                    onChange={(e) => setNewTask({...newTask, class: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  >
                    <option value="All Classes">All Classes</option>
                    {myClasses.map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'high' | 'medium' | 'low'})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline *</label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none resize-none"
                  rows={3}
                  placeholder="Task description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddTask}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Add Task
                </button>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">Take Attendance</h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-blue-700 text-sm">
                  <strong>Today:</strong> {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {studentRecords.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.class}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const updated = studentRecords.map(s => 
                            s.id === student.id ? {...s, status: 'present'} : s
                          )
                          setStudentRecords(updated)
                        }}
                        className={`px-4 py-2 rounded-lg ${student.status === 'present' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'} transition-colors`}
                      >
                        Present
                      </button>
                      <button 
                        onClick={() => {
                          const updated = studentRecords.map(s => 
                            s.id === student.id ? {...s, status: 'late'} : s
                          )
                          setStudentRecords(updated)
                        }}
                        className={`px-4 py-2 rounded-lg ${student.status === 'late' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700'} transition-colors`}
                      >
                        Late
                      </button>
                      <button 
                        onClick={() => {
                          const updated = studentRecords.map(s => 
                            s.id === student.id ? {...s, status: 'absent'} : s
                          )
                          setStudentRecords(updated)
                        }}
                        className={`px-4 py-2 rounded-lg ${student.status === 'absent' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'} transition-colors`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleTakeAttendance}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Check className="w-5 h-5" />
                  Save Attendance
                </button>
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student/Grade Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">Edit Student Record</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                <input
                  type="text"
                  value={editingStudent.class}
                  onChange={(e) => setEditingStudent({...editingStudent, class: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
                  <input
                    type="text"
                    value={editingStudent.grade}
                    onChange={(e) => setEditingStudent({...editingStudent, grade: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Attendance</label>
                  <input
                    type="text"
                    value={editingStudent.attendance}
                    onChange={(e) => setEditingStudent({...editingStudent, attendance: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={editingStudent.status}
                  onChange={(e) => setEditingStudent({...editingStudent, status: e.target.value as any})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                >
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateStudentGrade}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Check className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">Student Details</h3>
              <button
                onClick={() => setShowGradeModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4">
                  {showGradeModal.name.charAt(0)}
                </div>
                <h4 className="text-xl font-bold text-gray-900">{showGradeModal.name}</h4>
                <p className="text-gray-600">{showGradeModal.class}</p>
                {showGradeModal.email && <p className="text-sm text-gray-500">{showGradeModal.email}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Grade</span>
                  <span className="font-bold text-green-600">{showGradeModal.grade}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Attendance</span>
                  <span className="font-bold text-green-600">{showGradeModal.attendance}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Status</span>
                  <span className={`font-bold ${
                    showGradeModal.status === 'present' ? 'text-green-600' :
                    showGradeModal.status === 'late' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {showGradeModal.status.charAt(0).toUpperCase() + showGradeModal.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    setEditingStudent(showGradeModal)
                    setShowGradeModal(null)
                  }}
                  className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  Edit Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}