export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  fullName: string
  createdAt: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  message?: string
}

// Mock database - In production, use a real database
export const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123', // In production, use hashed passwords
    email: 'admin@pnhs.edu.ph',
    role: 'admin' as const,
    fullName: 'Administrator',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    username: 'teacher1',
    password: 'teacher123',
    email: 'teacher1@pnhs.edu.ph',
    role: 'teacher' as const,
    fullName: 'Maria Santos',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    username: 'teacher2',
    password: 'teacher123',
    email: 'teacher2@pnhs.edu.ph',
    role: 'teacher' as const,
    fullName: 'Juan Dela Cruz',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    username: 'student1',
    password: 'student123',
    email: 'student1@pnhs.edu.ph',
    role: 'student' as const,
    fullName: 'Pedro Reyes',
    createdAt: new Date().toISOString(),
  },
]

export function authenticateUser(credentials: LoginCredentials): AuthResponse {
  const user = users.find(
    (u) => u.username === credentials.username && u.password === credentials.password
  )

  if (!user) {
    return {
      success: false,
      message: 'Invalid username or password',
    }
  }

  const { password, ...userWithoutPassword } = user
  return {
    success: true,
    user: userWithoutPassword,
  }
}

export function getUserFromStorage(): User | null {
  if (typeof window === 'undefined') return null
  
  const userStr = localStorage.getItem('pnhs_user')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function saveUserToStorage(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('pnhs_user', JSON.stringify(user))
}

export function removeUserFromStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('pnhs_user')
}
