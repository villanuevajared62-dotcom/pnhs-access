// lib/auth.ts

import bcrypt from "bcryptjs";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "teacher" | "student";
  fullName: string;
  createdAt: string;
  studentId?: string;
  gradeLevel?: string;
  section?: string;
  strand?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

/**
 * Utility: check if code is running on client
 */
export const isClient = (): boolean => {
  return typeof window !== "undefined";
};

// Mock database (OK for demo / school project)
const users: (User & { password: string })[] = [
  {
    id: "1",
    username: "admin",
    password: bcrypt.hashSync("admin123", 10),
    email: "admin@pnhs.edu.ph",
    role: "admin" as const,
    fullName: "Administrator",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    username: "teacher1",
    password: bcrypt.hashSync("teacher123", 10),
    email: "teacher1@pnhs.edu.ph",
    role: "teacher" as const,
    fullName: "Maria Santos",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    username: "teacher2",
    password: bcrypt.hashSync("teacher123", 10),
    email: "teacher2@pnhs.edu.ph",
    role: "teacher" as const,
    fullName: "Juan Dela Cruz",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    username: "student1",
    password: bcrypt.hashSync("student123", 10),
    email: "student1@pnhs.edu.ph",
    role: "student" as const,
    fullName: "Pedro Reyes",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Authenticate user (pure function — server safe)
 */
export function authenticateUser(credentials: LoginCredentials): AuthResponse {
  const user = users.find((u) => u.username === credentials.username);
  if (!user || !bcrypt.compareSync(credentials.password, user.password)) {
    return {
      success: false,
      message: "Invalid username or password",
    };
  }

  const { password, ...userWithoutPassword } = user;

  return {
    success: true,
    user: userWithoutPassword,
  };
}

/**
 * CLIENT-ONLY helpers (safe for Vercel build)
 */
export function getUserFromStorage(): User | null {
  if (!isClient()) return null;

  try {
    const raw = window.localStorage.getItem("pnhs_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Stored value is intentionally minimal for safety (avoid full-profile in localStorage)
    return {
      id: parsed.id || "",
      username: parsed.username || "",
      email: parsed.email || "",
      role: parsed.role || "student",
      fullName: parsed.fullName || parsed.username || "",
      createdAt: parsed.createdAt || new Date().toISOString(),
    } as User;
  } catch (error) {
    return null;
  }
}

export function saveUserToStorage(user: User): void {
  if (!isClient()) return;
  // Store minimal but *identifying* fields so client fallback still works
  // (id is required so dashboard can load enrollments/grades/attendance).
  const safe = {
    id: user.id,
    username: user.username,
    fullName: user.fullName || "",
    email: user.email || "",
    role: user.role,
    createdAt: user.createdAt,
    // Optional academic fields for client convenience (if present)
    studentId: (user as any).studentId || "",
    gradeLevel: (user as any).gradeLevel || "",
    section: (user as any).section || "",
    strand: (user as any).strand || "",
  };
  try {
    window.localStorage.setItem("pnhs_user", JSON.stringify(safe));
  } catch (e) {
    // ignore localStorage errors (quota/private mode)
  }
}

export function removeUserFromStorage(): void {
  if (!isClient()) return;
  window.localStorage.removeItem("pnhs_user");
}

// Admin-managed user account utilities (in-memory, demo only)
export type ManageUserCreate = {
  username: string;
  password: string;
  email: string;
  role: User["role"];
  fullName: string;
};

export type ManageUserUpdate = Partial<{
  username: string;
  password: string;
  email: string;
  role: User["role"];
  fullName: string;
}>;

function toPublicUser(u: User & { password: string }): User {
  const { password, ...rest } = u;
  return rest;
}

export function listAuthUsers(): User[] {
  return users.map(toPublicUser);
}

export function getAuthUserById(id: string): User | null {
  const u = users.find((x) => x.id === id);
  return u ? toPublicUser(u) : null;
}

export function addAuthUser(payload: ManageUserCreate): {
  success: boolean;
  user?: User;
  message?: string;
} {
  if (
    !payload.username ||
    !payload.password ||
    !payload.email ||
    !payload.fullName ||
    !payload.role
  ) {
    return { success: false, message: "Missing required fields" };
  }
  if (users.some((u) => u.username === payload.username)) {
    return { success: false, message: "Username already exists" };
  }
  const newUser: User & { password: string } = {
    id: Date.now().toString(),
    username: payload.username,
    password: bcrypt.hashSync(payload.password, 10),
    email: payload.email,
    role: payload.role,
    fullName: payload.fullName,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return { success: true, user: toPublicUser(newUser) };
}

export function updateAuthUser(
  id: string,
  updates: ManageUserUpdate,
): { success: boolean; user?: User; message?: string } {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return { success: false, message: "Not found" };

  // If updating username, ensure uniqueness
  if (
    updates.username &&
    users.some((u, i) => u.username === updates.username && i !== idx)
  ) {
    return { success: false, message: "Username already taken" };
  }

  const applied = { ...users[idx], ...updates };
  if (updates.password)
    applied.password = bcrypt.hashSync(updates.password, 10);
  users[idx] = applied;
  return { success: true, user: toPublicUser(users[idx]) };
}

export function deleteAuthUser(id: string): {
  success: boolean;
  message?: string;
} {
  const prevLen = users.length;
  for (let i = users.length - 1; i >= 0; i--) {
    if (users[i].id === id) users.splice(i, 1);
  }
  if (users.length === prevLen) return { success: false, message: "Not found" };
  return { success: true };
}
