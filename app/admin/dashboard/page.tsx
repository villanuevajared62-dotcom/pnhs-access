'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, BookOpen, GraduationCap, BarChart3, Settings, LogOut, UserPlus,
  FileText, TrendingUp, Calendar, Bell, Search, Menu, X, Edit, Trash2,
  Download, Filter, ChevronDown, Check, X as XIcon, Plus, Send, Clock,
} from 'lucide-react'
import { getUserFromStorage, removeUserFromStorage, type User } from '@/lib/auth'
import {
  getAnnouncements, addAnnouncement, deleteAnnouncement,
  getStudents, addStudent, updateStudent, deleteStudent,
  getTeachers, addTeacher, updateTeacher, deleteTeacher,
  getClasses, addClass, updateClass, deleteClass,
  formatDate,
  type Announcement, type Student, type Teacher, type Class
} from '@/lib/shared-data'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  
  // Editing states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  
  // Form states
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    gradeLevel: 'Grade 10',
    section: 'A',
    gpa: '',
    status: 'active',
    studentId: ''
  })

  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    department: '',
    subjects: [''],
    status: 'active',
    students: 0
  })

  const [classForm, setClassForm] = useState({
    name: '',
    teacher: '',
    students: 0,
    schedule: '',
    room: ''
  })

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success'
  })

  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    const currentUser = getUserFromStorage()
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/login')
      return
    }
    setUser(currentUser)
    loadData()
    setLoading(false)
  }, [router])

  const loadData = () => {
    setStudents(getStudents())
    setTeachers(getTeachers())
    setClasses(getClasses())
    setAnnouncements(getAnnouncements())
  }

  const handleLogout = () => {
    removeUserFromStorage()
    router.push('/login')
  }

  const handleNavigation = (tab: string) => {
    setActiveTab(tab)
  }

  const handleDeleteStudent = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id)
      loadData()
    }
  }

  const handleDeleteTeacher = (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      deleteTeacher(id)
      loadData()
    }
  }

  const handleDeleteClass = (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      deleteClass(id)
      loadData()
    }
  }

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      deleteAnnouncement(id)
      loadData()
    }
  }

  const handleAddAnnouncement = () => {
    if (!announcementForm.title || !announcementForm.message) {
      alert('Please fill in all fields')
      return
    }

    addAnnouncement({
      title: announcementForm.title,
      message: announcementForm.message,
      type: announcementForm.type,
      author: user?.fullName || 'Admin',
      date: new Date().toISOString()
    })

    setAnnouncementForm({ title: '', message: '', type: 'info' })
    setShowAnnouncementModal(false)
    loadData()
  }

  const handleAddStudent = () => {
    if (!studentForm.name || !studentForm.email) {
      alert('Please fill in required fields')
      return
    }

    const newStudent = addStudent({
      ...studentForm,
      studentId: studentForm.studentId || `STU-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`
    })
    
    setStudentForm({
      name: '',
      email: '',
      gradeLevel: 'Grade 10',
      section: 'A',
      gpa: '',
      status: 'active',
      studentId: ''
    })
    setShowAddModal(false)
    loadData()
  }

  const handleUpdateStudent = () => {
    if (!editingStudent) return
    
    updateStudent(editingStudent.id, editingStudent)
    setEditingStudent(null)
    loadData()
  }

  const handleUpdateTeacher = () => {
    if (!editingTeacher) return
    
    updateTeacher(editingTeacher.id, editingTeacher)
    setEditingTeacher(null)
    loadData()
  }

  const handleUpdateClass = () => {
    if (!editingClass) return
    
    updateClass(editingClass.id, editingClass)
    setEditingClass(null)
    loadData()
  }

  const handleExportData = () => {
    const data = activeTab === 'students' ? students : 
                 activeTab === 'teachers' ? teachers : 
                 activeTab === 'classes' ? classes : 
                 announcements
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const filteredStudents = students.filter(s => 
    (selectedFilter === 'all' || s.gradeLevel.includes(selectedFilter)) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     s.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
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
    { label: 'Announcements', value: announcements.length.toString(), icon: Bell, color: 'bg-green-600', change: '+2' },
  ]

  const navigationItems = [
    { icon: BarChart3, label: 'Dashboard', key: 'dashboard' },
    { icon: Bell, label: 'Announcements', key: 'announcements' },
    { icon: Users, label: 'Students', key: 'students' },
    { icon: GraduationCap, label: 'Teachers', key: 'teachers' },
    { icon: BookOpen, label: 'Classes', key: 'classes' },
    { icon: FileText, label: 'Reports', key: 'reports' },
    { icon: Settings, label: 'Settings', key: 'settings' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'announcements':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">Announcements Management</h2>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-5 h-5" />
                New Announcement
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`bg-white rounded-2xl shadow-md p-6 border-l-4 ${
                    announcement.type === 'info' ? 'border-blue-500' :
                    announcement.type === 'warning' ? 'border-yellow-500' :
                    'border-green-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          announcement.type === 'info' ? 'bg-blue-100 text-blue-700' :
                          announcement.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {announcement.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{announcement.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>By: {announcement.author}</span>
                        <span>•</span>
                        <span>{formatDate(announcement.date)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-green-900">Student ID</th>
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
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">{student.studentId}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{student.gradeLevel}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{student.section}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">{student.gpa}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingStudent(student)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            >
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
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTeacherForm({
                      name: '',
                      email: '',
                      department: '',
                      subjects: [''],
                      status: 'active',
                      students: 0
                    })
                    setEditingTeacher({
                      id: '',
                      name: '',
                      email: '',
                      department: '',
                      subjects: [],
                      status: 'active',
                      students: 0
                    })
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-5 h-5" />
                  Add Teacher
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
                      <button 
                        onClick={() => setEditingTeacher(teacher)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
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
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setClassForm({
                      name: '',
                      teacher: '',
                      students: 0,
                      schedule: '',
                      room: ''
                    })
                    setEditingClass({
                      id: '',
                      name: '',
                      teacher: '',
                      students: 0,
                      schedule: '',
                      room: ''
                    })
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-5 h-5" />
                  Add Class
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

            <div className="grid md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Teacher: {cls.teacher}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingClass(cls)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">System Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">Total Students</span>
                    <span className="text-2xl font-bold text-green-600">{students.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-gray-700">Total Teachers</span>
                    <span className="text-2xl font-bold text-emerald-600">{teachers.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-teal-50 rounded-lg">
                    <span className="text-sm text-gray-700">Total Classes</span>
                    <span className="text-2xl font-bold text-teal-600">{classes.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-700">Announcements</span>
                    <span className="text-2xl font-bold text-blue-600">{announcements.length}</span>
                  </div>
                </div>
              </div>
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
                      defaultValue="Pantabangan National High School"
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
                  onClick={() => handleNavigation('announcements')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-5"
                >
                  <Bell className="w-10 h-10" />
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Announcements</h3>
                    <p className="text-blue-100 text-sm mt-1">Post updates & news</p>
                  </div>
                </button>
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
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-7 border border-green-100">
              <h2 className="text-xl font-bold text-green-900 mb-6">Recent Announcements</h2>
              <div className="space-y-4">
                {announcements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} className="flex items-start justify-between py-4 border-b last:border-b-0 hover:bg-green-50 px-4 rounded-lg transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${
                        announcement.type === 'success' ? 'bg-green-500' : 
                        announcement.type === 'warning' ? 'bg-yellow-500' : 
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{announcement.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{announcement.message.substring(0, 100)}...</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(announcement.date)}</span>
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
              <div className={`flex items-center justify-center rounded-xl overflow-hidden shadow-lg ${sidebarOpen ? 'w-12 h-12' : 'w-10 h-10'}`}>
                <img
                  src="/login/public/logo.png"
                  alt="PNHS Logo"
                  className="w-full h-full object-contain"
                />
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
                
                {activeTab === 'students' && (
                  <div className="relative">
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none pr-10"
                    >
                      <option value="all">All Grades</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
                
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

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">New Announcement</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none resize-none"
                  rows={5}
                  placeholder="Enter announcement message"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={announcementForm.type}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value as 'info' | 'warning' | 'success' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                >
                  <option value="info">Information</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddAnnouncement}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Send className="w-5 h-5" />
                  Publish Announcement
                </button>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">Add New Student</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Enter student name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="student@pnhs.edu.ph"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Grade Level</label>
                  <select
                    value={studentForm.gradeLevel}
                    onChange={(e) => setStudentForm({ ...studentForm, gradeLevel: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  >
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
                  <select
                    value={studentForm.section}
                    onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  >
                    {['A', 'B', 'C', 'D', 'E'].map((section) => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID (Optional)</label>
                <input
                  type="text"
                  value={studentForm.studentId}
                  onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Leave blank to auto-generate"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddStudent}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Add Student
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">Edit Student</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID</label>
                <input
                  type="text"
                  value={editingStudent.studentId}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
                  <input
                    type="text"
                    value={editingStudent.gradeLevel}
                    onChange={(e) => setEditingStudent({...editingStudent, gradeLevel: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">GPA</label>
                  <input
                    type="text"
                    value={editingStudent.gpa}
                    onChange={(e) => setEditingStudent({...editingStudent, gpa: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateStudent}
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

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">{editingTeacher.id ? 'Edit Teacher' : 'Add Teacher'}</h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Enter teacher name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="teacher@pnhs.edu.ph"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={editingTeacher.department}
                  onChange={(e) => setEditingTeacher({...editingTeacher, department: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateTeacher}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Check className="w-5 h-5" />
                  {editingTeacher.id ? 'Save Changes' : 'Add Teacher'}
                </button>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">{editingClass.id ? 'Edit Class' : 'Add Class'}</h3>
              <button
                onClick={() => setEditingClass(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class Name</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({...editingClass, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="e.g., Grade 10 - Mathematics"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teacher</label>
                <input
                  type="text"
                  value={editingClass.teacher}
                  onChange={(e) => setEditingClass({...editingClass, teacher: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Teacher name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room</label>
                  <input
                    type="text"
                    value={editingClass.room}
                    onChange={(e) => setEditingClass({...editingClass, room: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    placeholder="e.g., Room 101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Students</label>
                  <input
                    type="number"
                    value={editingClass.students}
                    onChange={(e) => setEditingClass({...editingClass, students: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule</label>
                <input
                  type="text"
                  value={editingClass.schedule}
                  onChange={(e) => setEditingClass({...editingClass, schedule: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="e.g., Mon/Wed/Fri 8:00 AM"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateClass}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Check className="w-5 h-5" />
                  {editingClass.id ? 'Save Changes' : 'Add Class'}
                </button>
                <button
                  onClick={() => setEditingClass(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}