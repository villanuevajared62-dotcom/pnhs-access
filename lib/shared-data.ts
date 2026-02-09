// lib/shared-data.ts
// Shared data service for managing data across Admin, Teacher, and Student dashboards

export interface Announcement {
  id: string
  title: string
  message: string
  date: string
  author: string
  type: 'info' | 'warning' | 'success'
  createdAt: Date
}

export interface Student {
  id: string
  name: string
  email: string
  gradeLevel: string
  section: string
  gpa: string
  status: 'active' | 'inactive'
  studentId: string
}

export interface Teacher {
  id: string
  name: string
  email: string
  department: string
  subjects: string[]
  students: number
  status: 'active' | 'inactive'
}

export interface Class {
  id: string
  name: string
  teacher: string
  teacherId: string
  students: number
  schedule: string
  room: string
  gradeLevel: string
  section: string
}

export interface Grade {
  id: string
  studentId: string
  subjectId: string
  grade: string
  quarter: string
  remarks: string
}

export interface Attendance {
  id: string
  studentId: string
  classId: string
  date: string
  status: 'present' | 'absent' | 'late'
}

// Local Storage Keys
const STORAGE_KEYS = {
  ANNOUNCEMENTS: 'pnhs_announcements',
  STUDENTS: 'pnhs_students',
  TEACHERS: 'pnhs_teachers',
  CLASSES: 'pnhs_classes',
  GRADES: 'pnhs_grades',
  ATTENDANCE: 'pnhs_attendance',
}

// Initialize default data if not exists
const initializeDefaultData = () => {
  // Default Announcements
  if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    const defaultAnnouncements: Announcement[] = [
      {
        id: '1',
        title: 'Midterm Examinations',
        message: 'Midterm exams will be conducted from February 15-20, 2026. Please review your schedules and prepare accordingly.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Admin',
        type: 'info',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        title: 'School Foundation Day',
        message: 'Join us in celebrating PNHS Foundation Day on February 25, 2026. Various activities and programs are planned!',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Admin',
        type: 'success',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        title: 'Library Hours Extended',
        message: 'Library will be open until 8 PM during exam week to accommodate students. Make use of this opportunity!',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Admin',
        type: 'info',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ]
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultAnnouncements))
  }

  // Default Students
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    const defaultStudents: Student[] = [
      { id: '1', name: 'Juan Dela Cruz', email: 'juan@pnhs.edu.ph', gradeLevel: 'Grade 10', section: 'A', gpa: '92.5', status: 'active', studentId: 'STU-2024-001' },
      { id: '2', name: 'Maria Santos', email: 'maria@pnhs.edu.ph', gradeLevel: 'Grade 11', section: 'B', gpa: '88.3', status: 'active', studentId: 'STU-2024-002' },
      { id: '3', name: 'Pedro Reyes', email: 'pedro@pnhs.edu.ph', gradeLevel: 'Grade 9', section: 'C', gpa: '90.1', status: 'active', studentId: 'STU-2024-003' },
      { id: '4', name: 'Ana Garcia', email: 'ana@pnhs.edu.ph', gradeLevel: 'Grade 12', section: 'A', gpa: '94.7', status: 'active', studentId: 'STU-2024-004' },
      { id: '5', name: 'Jose Torres', email: 'jose@pnhs.edu.ph', gradeLevel: 'Grade 10', section: 'B', gpa: '86.2', status: 'active', studentId: 'STU-2024-005' },
    ]
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(defaultStudents))
  }

  // Default Teachers
  if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
    const defaultTeachers: Teacher[] = [
      { id: '1', name: 'Ms. Santos', email: 'santos@pnhs.edu.ph', department: 'Mathematics', subjects: ['Algebra', 'Geometry'], students: 120, status: 'active' },
      { id: '2', name: 'Mr. Cruz', email: 'cruz@pnhs.edu.ph', department: 'Science', subjects: ['Biology', 'Chemistry'], students: 95, status: 'active' },
      { id: '3', name: 'Ms. Garcia', email: 'garcia@pnhs.edu.ph', department: 'English', subjects: ['Literature', 'Grammar'], students: 110, status: 'active' },
      { id: '4', name: 'Mr. Reyes', email: 'reyes@pnhs.edu.ph', department: 'Filipino', subjects: ['Filipino', 'Literature'], students: 105, status: 'active' },
    ]
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(defaultTeachers))
  }

  // Default Classes
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    const defaultClasses: Class[] = [
      { id: '1', name: 'Math 101', teacher: 'Ms. Santos', teacherId: '1', students: 42, schedule: 'MWF 8:00-9:00 AM', room: 'Room 101', gradeLevel: 'Grade 10', section: 'A' },
      { id: '2', name: 'Science 201', teacher: 'Mr. Cruz', teacherId: '2', students: 38, schedule: 'TTH 9:00-10:30 AM', room: 'Room 205', gradeLevel: 'Grade 11', section: 'B' },
      { id: '3', name: 'English 301', teacher: 'Ms. Garcia', teacherId: '3', students: 35, schedule: 'MWF 10:00-11:00 AM', room: 'Room 103', gradeLevel: 'Grade 12', section: 'A' },
      { id: '4', name: 'Filipino 101', teacher: 'Mr. Reyes', teacherId: '4', students: 40, schedule: 'TTH 1:00-2:30 PM', room: 'Room 104', gradeLevel: 'Grade 10', section: 'B' },
    ]
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(defaultClasses))
  }
}

// Announcements Management
export const getAnnouncements = (): Announcement[] => {
  initializeDefaultData()
  const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)
  return data ? JSON.parse(data) : []
}

export const addAnnouncement = (announcement: Omit<Announcement, 'id' | 'createdAt'>): Announcement => {
  const announcements = getAnnouncements()
  const newAnnouncement: Announcement = {
    ...announcement,
    id: Date.now().toString(),
    createdAt: new Date(),
    date: new Date().toISOString()
  }
  announcements.unshift(newAnnouncement)
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements))
  return newAnnouncement
}

export const deleteAnnouncement = (id: string): void => {
  const announcements = getAnnouncements()
  const filtered = announcements.filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filtered))
}

// Students Management
export const getStudents = (): Student[] => {
  initializeDefaultData()
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS)
  return data ? JSON.parse(data) : []
}

export const addStudent = (student: Omit<Student, 'id'>): Student => {
  const students = getStudents()
  const newStudent: Student = {
    ...student,
    id: Date.now().toString()
  }
  students.push(newStudent)
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students))
  return newStudent
}

export const updateStudent = (id: string, updates: Partial<Student>): Student | null => {
  const students = getStudents()
  const index = students.findIndex(s => s.id === id)
  if (index === -1) return null
  
  students[index] = { ...students[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students))
  return students[index]
}

export const deleteStudent = (id: string): void => {
  const students = getStudents()
  const filtered = students.filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered))
}

// Teachers Management
export const getTeachers = (): Teacher[] => {
  initializeDefaultData()
  const data = localStorage.getItem(STORAGE_KEYS.TEACHERS)
  return data ? JSON.parse(data) : []
}

export const addTeacher = (teacher: Omit<Teacher, 'id'>): Teacher => {
  const teachers = getTeachers()
  const newTeacher: Teacher = {
    ...teacher,
    id: Date.now().toString()
  }
  teachers.push(newTeacher)
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers))
  return newTeacher
}

export const updateTeacher = (id: string, updates: Partial<Teacher>): Teacher | null => {
  const teachers = getTeachers()
  const index = teachers.findIndex(t => t.id === id)
  if (index === -1) return null
  
  teachers[index] = { ...teachers[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers))
  return teachers[index]
}

export const deleteTeacher = (id: string): void => {
  const teachers = getTeachers()
  const filtered = teachers.filter(t => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(filtered))
}

// Classes Management
export const getClasses = (): Class[] => {
  initializeDefaultData()
  const data = localStorage.getItem(STORAGE_KEYS.CLASSES)
  return data ? JSON.parse(data) : []
}

export const addClass = (classData: Omit<Class, 'id'>): Class => {
  const classes = getClasses()
  const newClass: Class = {
    ...classData,
    id: Date.now().toString()
  }
  classes.push(newClass)
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes))
  return newClass
}

export const updateClass = (id: string, updates: Partial<Class>): Class | null => {
  const classes = getClasses()
  const index = classes.findIndex(c => c.id === id)
  if (index === -1) return null
  
  classes[index] = { ...classes[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes))
  return classes[index]
}

export const deleteClass = (id: string): void => {
  const classes = getClasses()
  const filtered = classes.filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(filtered))
}

// Get classes by teacher
export const getClassesByTeacher = (teacherId: string): Class[] => {
  const classes = getClasses()
  return classes.filter(c => c.teacherId === teacherId)
}

// Utility function to format date
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}