// lib/auth.ts

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

/**
 * Utility: check if code is running on client
 */
export const isClient = (): boolean => {
  return typeof window !== 'undefined'
}

// Mock database (OK for demo / school project)
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
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

/**
 * Authenticate user (pure function — server safe)
 */
export function authenticateUser(
  credentials: LoginCredentials
): AuthResponse {
  const user = users.find(
    (u) =>
      u.username === credentials.username &&
      u.password === credentials.password
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

/**
 * CLIENT-ONLY helpers (safe for Vercel build)
 */
export function getUserFromStorage(): User | null {
  if (!isClient()) return null

  try {
    const userStr = window.localStorage.getItem('pnhs_user')
    return userStr ? (JSON.parse(userStr) as User) : null
  } catch {
    return null
  }
}

export function saveUserToStorage(user: User): void {
  if (!isClient()) return
  window.localStorage.setItem('pnhs_user', JSON.stringify(user))
}

export function removeUserFromStorage(): void {
  if (!isClient()) return
  window.localStorage.removeItem('pnhs_user')
}
