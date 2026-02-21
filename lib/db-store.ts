// Shared in-memory data store for tasks and assignments
// In production, use a proper database (PostgreSQL, MongoDB, etc.)

export interface Task {
  id: string;
  task: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  class: string;
  description?: string;
  teacherId?: string;
  completed: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  grade?: string;
  description?: string;
  studentId?: string;
}

export interface Settings {
  schoolName?: string;
  schoolYear?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  classNotifications?: boolean;
}

// In-memory databases
export const tasksDB: Task[] = [];
export const assignmentsDB: Assignment[] = [];
export let taskCounter = 1;
export let assignmentCounter = 1;

export const settingsDB: Settings = {
  schoolName: "PNHS",
  schoolYear: "2025-2026",
  emailNotifications: true,
  smsNotifications: false,
  classNotifications: true,
};

// Helper functions
export function getNextTaskId() {
  return `task-${taskCounter++}`;
}

export function getNextAssignmentId() {
  return `assignment-${assignmentCounter++}`;
}
