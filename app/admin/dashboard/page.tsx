'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, BookOpen, GraduationCap, BarChart3, Settings, LogOut, UserPlus,
  FileText, TrendingUp, Calendar, Bell, Search, Menu, X, Edit, Trash2,
  Download, Filter, ChevronDown, Check, X as XIcon, Plus,
} from 'lucide-react'
import { getUserFromStorage, removeUserFromStorage, type User } from '@/lib/auth'

interface Student {
  id: string
  name: string
  email: string
  gradeLevel: string
  section: string
  gpa: string
  status: 'active' | 'inactive'
}

interface Teacher {
  id: string
  name: string
  email: string
  department: string
  subjects: string[]
  students: number
  status: 'active' | 'inactive'
}

interface Class {
  id: string
  name: string
  teacher: string
  students: number
  schedule: string
  room: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Juan Dela Cruz', email: 'juan@pnhs.edu.ph', gradeLevel: 'Grade 10', section: 'A', gpa: '92.5', status: 'active' },
    { id: '2', name: 'Maria Santos', email: 'maria@pnhs.edu.ph', gradeLevel: 'Grade 11', section: 'B', gpa: '88.3', status: 'active' },
    { id: '3', name: 'Pedro Reyes', email: 'pedro@pnhs.edu.ph', gradeLevel: 'Grade 9', section: 'C', gpa: '90.1', status: 'active' },
    { id: '4', name: 'Ana Garcia', email: 'ana@pnhs.edu.ph', gradeLevel: 'Grade 12', section: 'A', gpa: '94.7', status: 'active' },
    { id: '5', name: 'Jose Torres', email: 'jose@pnhs.edu.ph', gradeLevel: 'Grade 10', section: 'B', gpa: '86.2', status: 'active' },
  ])

  const [teachers, setTeachers] = useState<Teacher[]>([
    { id: '1', name: 'Ms. Santos', email: 'santos@pnhs.edu.ph', department: 'Mathematics', subjects: ['Algebra', 'Geometry'], students: 120, status: 'active' },
    { id: '2', name: 'Mr. Cruz', email: 'cruz@pnhs.edu.ph', department: 'Science', subjects: ['Biology', 'Chemistry'], students: 95, status: 'active' },
    { id: '3', name: 'Ms. Garcia', email: 'garcia@pnhs.edu.ph', department: 'English', subjects: ['Literature', 'Grammar'], students: 110, status: 'active' },
    { id: '4', name: 'Mr. Reyes', email: 'reyes@pnhs.edu.ph', department: 'Filipino', subjects: ['Filipino', 'Literature'], students: 105, status: 'active' },
  ])

  const [classes, setClasses] = useState<Class[]>([
    { id: '1', name: 'Math 101', teacher: 'Ms. Santos', students: 42, schedule: 'MWF 8:00-9:00 AM', room: 'Room 101' },
    { id: '2', name: 'Science 201', teacher: 'Mr. Cruz', students: 38, schedule: 'TTH 9:00-10:30 AM', room: 'Room 205' },
    { id: '3', name: 'English 301', teacher: 'Ms. Garcia', students: 35, schedule: 'MWF 10:00-11:00 AM', room: 'Room 103' },
    { id: '4', name: 'Filipino 101', teacher: 'Mr. Reyes', students: 40, schedule: 'TTH 1:00-2:30 PM', room: 'Room 104' },
  ])

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

  const handleNavigation = (tab: string) => {
    setActiveTab(tab)
  }

  const handleDeleteStudent = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== id))
    }
  }

  const handleDeleteTeacher = (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      setTeachers(teachers.filter(t => t.id !== id))
    }
  }

  const handleDeleteClass = (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      setClasses(classes.filter(c => c.id !== id))
    }
  }

  const handleAddStudent = () => {
    const newStudent: Student = {
      id: String(students.length + 1),
      name: 'New Student',
      email: 'newstudent@pnhs.edu.ph',
      gradeLevel: 'Grade 10',
      section: 'A',
      gpa: '85.0',
      status: 'active'
    }
    setStudents([...students, newStudent])
    setShowAddModal(false)
  }

  const handleExportData = () => {
    const data = activeTab === 'students' ? students : activeTab === 'teachers' ? teachers : classes
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-data.json`
    a.click()
  }

  const filteredStudents = students.filter(s => 
    (selectedFilter === 'all' || s.gradeLevel.includes(selectedFilter)) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredTeachers = teachers.filter(t => 
    (selectedFilter === 'all' || t.department.toLowerCase().includes(selectedFilter.toLowerCase())) &&
    (t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     t.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Students', value: students.length.toString(), icon: Users, color: 'bg-teal-700', change: '+12%' },
    { label: 'Active Teachers', value: teachers.filter(t => t.status === 'active').length.toString(), icon: GraduationCap, color: 'bg-green-700', change: '+3%' },
    { label: 'Total Classes', value: classes.length.toString(), icon: BookOpen, color: 'bg-emerald-700', change: '+5%' },
    { label: 'Avg Attendance', value: '94.5%', icon: TrendingUp, color: 'bg-green-600', change: '+2.1%' },
  ]

  const navigationItems = [
    { icon: BarChart3, label: 'Dashboard', key: 'dashboard' },
    { icon: Users, label: 'Students', key: 'students' },
    { icon: GraduationCap, label: 'Teachers', key: 'teachers' },
    { icon: BookOpen, label: 'Classes', key: 'classes' },
    { icon: FileText, label: 'Reports', key: 'reports' },
    { icon: Calendar, label: 'Schedule', key: 'schedule' },
    { icon: Settings, label: 'Settings', key: 'settings' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">Students Management</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-5 h-5" />
                  Add Student
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Grade</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Section</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">GPA</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-t border-green-100 hover:bg-green-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{student.gradeLevel}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{student.section}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.gpa}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'teachers':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">Teachers Management</h2>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>

            <div className="grid gap-4">
              {filteredTeachers.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{teacher.name}</h3>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        <p className="text-sm text-gray-600 mt-1">{teacher.department}</p>
                        <div className="flex gap-2 mt-2">
                          {teacher.subjects.map((subject, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-5 h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6">
                    <div className="text-sm">
                      <span className="text-gray-600">Students: </span>
                      <span className="font-semibold text-gray-900">{teacher.students}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Status: </span>
                      <span className={`font-semibold ${teacher.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                        {teacher.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'classes':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">Classes Management</h2>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Teacher: {cls.teacher}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{cls.students} students</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{cls.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{cls.room}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'reports':
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">Reports & Analytics</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Student Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Excellent (90-100)</span>
                    <span className="font-semibold text-green-600">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Good (80-89)</span>
                    <span className="font-semibold text-blue-600">35%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average (70-79)</span>
                    <span className="font-semibold text-yellow-600">15%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Below Average (&lt;70)</span>
                    <span className="font-semibold text-red-600">5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Attendance Overview</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 mb-2">94.5%</div>
                    <div className="text-sm text-gray-600">Average Attendance Rate</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">1,178</div>
                      <div className="text-xs text-gray-600 mt-1">Present Today</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">67</div>
                      <div className="text-xs text-gray-600 mt-1">Absent Today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'schedule':
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">School Schedule</h2>
            <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden">
              <div className="grid grid-cols-6 bg-green-50">
                <div className="p-4 font-semibold text-green-900">Time</div>
                <div className="p-4 font-semibold text-green-900">Monday</div>
                <div className="p-4 font-semibold text-green-900">Tuesday</div>
                <div className="p-4 font-semibold text-green-900">Wednesday</div>
                <div className="p-4 font-semibold text-green-900">Thursday</div>
                <div className="p-4 font-semibold text-green-900">Friday</div>
              </div>
              {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'].map((time) => (
                <div key={time} className="grid grid-cols-6 border-t border-green-100">
                  <div className="p-4 text-sm font-medium text-gray-700">{time}</div>
                  {[1, 2, 3, 4, 5].map((day) => (
                    <div key={day} className="p-4 text-sm text-gray-600 border-l border-green-100">
                      {day % 2 === 0 ? 'Math 101' : day % 3 === 0 ? 'Science 201' : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )

      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">System Settings</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">School Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                    <input
                      type="text"
                      defaultValue="Pila National High School"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">School Year</label>
                    <input
                      type="text"
                      defaultValue="2025-2026"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-sm text-gray-700">Email notifications for new enrollments</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-sm text-gray-700">Daily attendance reports</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 text-green-600 rounded" />
                    <span className="text-sm text-gray-700">Grade submission reminders</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-green-100 hover:border-teal-400 transition-all duration-300 cursor-pointer">
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
                <button
                  onClick={() => handleNavigation('students')}
                  className="bg-gradient-to-r from-teal-700 to-green-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5"
                >
                  <UserPlus className="w-10 h-10" />
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Manage Students</h3>
                    <p className="text-teal-100 text-sm mt-1">View all students</p>
                  </div>
                </button>
                <button
                  onClick={() => handleNavigation('teachers')}
                  className="bg-gradient-to-r from-emerald-700 to-green-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5"
                >
                  <GraduationCap className="w-10 h-10" />
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Manage Teachers</h3>
                    <p className="text-emerald-100 text-sm mt-1">View all teachers</p>
                  </div>
                </button>
                <button
                  onClick={() => handleNavigation('reports')}
                  className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5"
                >
                  <FileText className="w-10 h-10" />
                  <div className="text-left">
                    <h3 className="font-bold text-lg">View Reports</h3>
                    <p className="text-green-100 text-sm mt-1">Analytics & insights</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-7 border border-green-100">
              <h2 className="text-xl font-bold text-green-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {[
                  { action: 'New student enrolled', user: 'Juan Dela Cruz', time: '2 hours ago', type: 'success' },
                  { action: 'Grade submitted', user: 'Ms. Santos', time: '3 hours ago', type: 'info' },
                  { action: 'Attendance recorded', user: 'Mr. Cruz', time: '5 hours ago', type: 'info' },
                  { action: 'Class schedule updated', user: 'Admin', time: '1 day ago', type: 'success' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b last:border-b-0 hover:bg-green-50 px-4 rounded-lg transition-colors">
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
          </div>
        )
    }
  }

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
                <GraduationCap className="w-7 h-7 text-white" />
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
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.key)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all ${
                  activeTab === item.key ? 'bg-white/20 shadow-inner font-semibold' : 'hover:bg-white/10 text-green-100'
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
          {renderContent()}
        </main>
      </div>
    </div>
  )
}