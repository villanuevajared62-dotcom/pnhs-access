"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  Calendar,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Bell,
  Search,
  Award,
  Clock,
  TrendingUp,
  PlusCircle,
  MessageSquare,
  Eye,
  Download,
  Filter,
  ChevronRight,
  Home,
  RefreshCw,
  BarChart3,
  Settings,
  Mail,
  Edit,
  Trash2,
  Save,
  XCircle,
  Check,
  ChevronDown,
  Upload,
  Plus,
  EyeOff,
} from "lucide-react";
import { getUserFromStorage, saveUserToStorage, type User } from "@/lib/auth";
import { type Announcement } from "@/lib/shared-data";
import AttendanceHistoryModal from "@/components/teacher/AttendanceHistoryModal";

interface ClassData {
  id: string;
  name: string;
  students: number;
  section: string;
  time: string;
  room: string;
  days: string;
}

interface Task {
  id: string;
  task: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  class: string;
  completed: boolean;
  description?: string;
}

interface TeacherAssignment {
  id: string;
  title: string;
  subject?: string;
  className?: string | null;
  dueDate: string;
  status: string;
  description?: string;
  points?: string | null;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  classId?: string;
  studentId?: string | null;
  class?: { id: string; name: string } | null;
  submissions?: Array<{
    id: string;
    status: string;
    filePath?: string | null;
    submittedAt?: string | null;
    student?: { id: string; name: string; email?: string } | null;
  }>;
}

interface StudentRecord {
  id: string;
  name: string;
  class: string;
  section?: string;
  strand?: string;
  enrolledClassIds: string[];
  attendance: string;
  status: "present" | "late" | "absent";
  grade: string;
  email?: string;
}

interface DashboardMessage {
  id: string;
  fromId: string;
  fromRole: "student" | "teacher";
  fromName: string;
  toId: string;
  toRole: "student" | "teacher";
  toName: string;
  toEmail?: string;
  subject: string;
  body: string;
  createdAt: string;
}

export default function TeacherDashboard() {
  type ToastType = "success" | "error" | "warning" | "info";
  const router = useRouter();
  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown error";
    }
  };
  const uploadMaxMB = (() => {
    const raw = process.env.NEXT_PUBLIC_UPLOAD_MAX_MB;
    const parsed = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 50;
  })();
  const uploadMaxBytes = uploadMaxMB * 1024 * 1024;
  const [user, setUser] = useState<User | null>(null);
  const [teacherLabel, setTeacherLabel] = useState<string>("Teacher");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementUnreadCount, setAnnouncementUnreadCount] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [takeAttendanceClass, setTakeAttendanceClass] = useState<string>("");
  const [takeAttendanceRows, setTakeAttendanceRows] = useState<
    {
      studentId: string;
      name: string;
      status: "present" | "late" | "absent" | "excused";
      remarks?: string;
    }[]
  >([]);
  const [quickAttendanceStatus, setQuickAttendanceStatus] = useState<
    Record<string, "present" | "late" | "absent">
  >({});
  const [attendanceModalStudent, setAttendanceModalStudent] = useState<null | {
    id: string;
    name: string;
    attendance: string;
    attendanceRecords: { present: number; late: number; absent: number };
    attendanceHistory: Array<{ id: string; date: string; status: string }>;
  }>(null);

  // Attendance History Modal states
  const [showAttendanceHistoryModal, setShowAttendanceHistoryModal] =
    useState(false);
  const [selectedClassForHistory, setSelectedClassForHistory] =
    useState<string>("");
  const [showGradeModal, setShowGradeModal] = useState<StudentRecord | null>(
    null,
  );
  const [submissionModalAssignment, setSubmissionModalAssignment] =
    useState<TeacherAssignment | null>(null);
  const [messageStudent, setMessageStudent] = useState<StudentRecord | null>(
    null,
  );
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);
  const didInitUnreadRef = useRef(false);
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [todayKey, setTodayKey] = useState<string>(new Date().toDateString());

  const [newClass, setNewClass] = useState({
    name: "",
    section: "",
    time: "",
    room: "",
    days: "",
    students: 0,
  });

  const [newTask, setNewTask] = useState({
    task: "",
    class: "All Classes",
    deadline: "",
    priority: "medium" as "high" | "medium" | "low",
    description: "",
  });

  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(
    null,
  );

  const [myClasses, setMyClasses] = useState<ClassData[]>([
    {
      id: "1",
      name: "Grade 10 - Mathematics",
      students: 42,
      section: "Section A",
      time: "8:00 AM - 9:00 AM",
      room: "Room 201",
      days: "Mon/Wed/Fri",
    },
    {
      id: "2",
      name: "Grade 9 - Algebra",
      students: 38,
      section: "Section B",
      time: "9:30 AM - 10:30 AM",
      room: "Room 105",
      days: "Tue/Thu",
    },
    {
      id: "3",
      name: "Grade 11 - Statistics",
      students: 35,
      section: "STEM",
      time: "1:00 PM - 2:00 PM",
      room: "Room 301",
      days: "Mon/Wed",
    },
  ]);

  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    subject: "",
    dueDate: "",
    classId: "",
    selectedClassIds: [] as string[],
    description: "",
    points: "",
  });
  const [assignmentAttachmentFile, setAssignmentAttachmentFile] =
    useState<File | null>(null);
  const assignmentsRequestSeq = useRef(0);
  const assignmentEmptyStreakRef = useRef(0);
  const lastNonEmptyAssignmentsRef = useRef<TeacherAssignment[]>([]);

  const [studentRecords, setStudentRecords] = useState<StudentRecord[]>([]);
  const [studentProfilePhotos, setStudentProfilePhotos] = useState<
    Record<string, string>
  >({});
  const [gradesData, setGradesData] = useState<any[]>([]);

  // Simplified class label generator: "Grade X - Section Y" or "Grade X - Section Y • Strand"
  const getSimplifiedClassLabel = (cls: ClassData): string => {
    const gradeMatch = cls.name.match(/Grade\s*\d+/i);
    const gradeLevel = gradeMatch ? gradeMatch[0] : "";
    const section = (cls.section || "").trim() || "";

    if (gradeLevel && section) {
      return `${gradeLevel} - ${section}`;
    } else if (section) {
      return section;
    } else if (gradeLevel) {
      return gradeLevel;
    }
    return cls.name;
  };

  const attendanceContextOptions = useMemo(() => {
    const sectionCounts = myClasses.reduce<Record<string, number>>(
      (acc, cls) => {
        const key = getSimplifiedClassLabel(cls);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {},
    );

    return myClasses.map((cls) => {
      const simpleLabel = getSimplifiedClassLabel(cls);
      const needsDetail = (sectionCounts[simpleLabel] || 0) > 1;
      return {
        id: cls.id,
        label: needsDetail ? `${simpleLabel} - ${cls.name}` : simpleLabel,
      };
    });
  }, [myClasses]);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    type: ToastType;
  }>({ open: false, message: "", type: "info" });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ open: true, message, type });
  };
  const [confirmAction, setConfirmAction] = useState<{
    key: string;
    id: string;
    until: number;
  } | null>(null);
  const requestConfirm = (key: string, id: string) => {
    const now = Date.now();
    if (
      confirmAction &&
      confirmAction.key === key &&
      confirmAction.id === id &&
      now < confirmAction.until
    ) {
      setConfirmAction(null);
      return true;
    }
    setConfirmAction({ key, id, until: now + 5000 });
    showToast("Tap delete again to confirm", "warning");
    return false;
  };

  const loadMyMessages = (userId: string) => {
    try {
      const raw = localStorage.getItem("pnhs_in_app_messages");
      const all: DashboardMessage[] = raw ? JSON.parse(raw) : [];
      const mine = all
        .filter((m) => m.fromId === userId || m.toId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      setMessages(mine);
    } catch {
      setMessages([]);
    }
  };

  const getSeenMessageIds = (userId: string): Set<string> => {
    try {
      const raw = localStorage.getItem(`teacher_messages_seen_${userId}`);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(ids);
    } catch {
      return new Set<string>();
    }
  };

  const markStudentMessagesAsSeen = (studentId: string) => {
    if (!user?.id) return;
    try {
      const seen = getSeenMessageIds(user.id);
      messages.forEach((m) => {
        if (m.toId === user.id && m.fromId === studentId) {
          seen.add(m.id);
        }
      });
      localStorage.setItem(
        `teacher_messages_seen_${user.id}`,
        JSON.stringify(Array.from(seen)),
      );
    } catch {
      // ignore storage failures
    }
    loadMyMessages(user.id);
  };

  const classNameById = myClasses.reduce<Record<string, string>>((acc, c) => {
    const key = String(c.id || "");
    if (key) acc[key] = c.name;
    return acc;
  }, {});

  const enrolledCountByClassId = studentRecords.reduce<Record<string, number>>(
    (acc, s) => {
      const classIds = Array.from(new Set(s.enrolledClassIds || []));
      classIds.forEach((classId) => {
        const key = String(classId || "");
        if (!key) return;
        acc[key] = (acc[key] || 0) + 1;
      });
      return acc;
    },
    {},
  );

  const getSubmittedStudents = (a: TeacherAssignment) => {
    const allSubs = Array.isArray(a.submissions) ? a.submissions : [];
    const submittedByStudent = new Map<string, (typeof allSubs)[number]>();
    allSubs.forEach((s) => {
      const sid = String(s.student?.id || "");
      if (!sid) return;
      const hasFile = Boolean(s.filePath && String(s.filePath).trim() !== "");
      const isSubmittedStatus =
        s.status === "submitted" || s.status === "graded";
      if (!hasFile && !isSubmittedStatus) return;
      const prev = submittedByStudent.get(sid);
      if (!prev) {
        submittedByStudent.set(sid, s);
        return;
      }
      const prevTime = prev.submittedAt
        ? new Date(prev.submittedAt).getTime()
        : 0;
      const currTime = s.submittedAt ? new Date(s.submittedAt).getTime() : 0;
      if (currTime >= prevTime) submittedByStudent.set(sid, s);
    });
    return Array.from(submittedByStudent.values());
  };

  const getExpectedSubmissionCount = (a: TeacherAssignment) => {
    if (a.classId) {
      const enrolled = enrolledCountByClassId[String(a.classId)] || 0;
      if (enrolled > 0) return enrolled;
    }
    if (a.studentId) return 1;
    const allSubs = Array.isArray(a.submissions) ? a.submissions : [];
    const uniqueStudentIds = new Set(
      allSubs.map((s) => String(s.student?.id || "")).filter(Boolean),
    );
    return uniqueStudentIds.size || allSubs.length || 0;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const currentUser = data.user as User;
          if (!currentUser || currentUser.role !== "teacher") {
            router.push("/login");
            return;
          }
          setUser(currentUser);
          saveUserToStorage(currentUser);
          await loadTeacherProfileLabel(currentUser.id);
          // Load grades first, then load other data that depends on it
          await loadGradesFromApi();
          await loadData();
          return;
        }

        // fallback to localStorage so a refresh doesn't immediately redirect
        const localUser = getUserFromStorage();
        if (localUser && localUser.role === "teacher") {
          setUser(localUser);
          await loadTeacherProfileLabel(localUser.id || "");
          await loadGradesFromApi();
          await loadData();
          return;
        }

        router.push("/login");
      } catch (error) {
        const localUser = getUserFromStorage();
        if (localUser && localUser.role === "teacher") {
          setUser(localUser);
          await loadTeacherProfileLabel(localUser.id || "");
          await loadGradesFromApi();
          await loadData();
          return;
        }
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const loadTeacherProfileLabel = async (teacherId: string) => {
    if (!teacherId) return;
    try {
      const res = await fetch("/api/teachers", { credentials: "include" });
      if (!res.ok) return;
      const items = await res.json();
      const mine = Array.isArray(items)
        ? items.find((t: any) => String(t?.id || "") === String(teacherId))
        : null;
      if (!mine) return;

      const nextLabel =
        (typeof mine.department === "string" && mine.department.trim()) ||
        (Array.isArray(mine.subjects) && mine.subjects[0]) ||
        (Array.isArray(mine.subjectsLegacy) && mine.subjectsLegacy[0]) ||
        "";

      if (nextLabel) {
        setTeacherLabel(String(nextLabel));
      }
    } catch {
      // Keep current label on fetch failure
    }
  };

  useEffect(() => {
    // Keep sidebar open by default on large screens
    if (typeof window !== "undefined") {
      const isLarge = window.innerWidth >= 1024;
      setSidebarOpen(isLarge);

      const onResize = () => setSidebarOpen(window.innerWidth >= 1024);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    return;
  }, []);

  useEffect(() => {
    if (activeTab !== "assignments") return;
    const interval = setInterval(() => {
      void loadAssignmentsFromApi();
    }, 8000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(
      () => setToast((prev) => ({ ...prev, open: false })),
      2800,
    );
    return () => clearTimeout(t);
  }, [toast.open]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    const key = `teacher_announcements_seen_${user.id}`;
    try {
      const raw = localStorage.getItem(key);
      const seenIds = new Set<string>(raw ? JSON.parse(raw) : []);
      const unread = announcements.filter(
        (a: any) => !seenIds.has(String(a.id)),
      ).length;
      setAnnouncementUnreadCount(unread);
    } catch {
      setAnnouncementUnreadCount(announcements.length);
    }
  }, [announcements, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    if (activeTab !== "announcements") return;
    const key = `teacher_announcements_seen_${user.id}`;
    try {
      const ids = announcements.map((a: any) => String(a.id));
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // ignore storage failures
    }
    setAnnouncementUnreadCount(0);
  }, [activeTab, announcements, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    const key = `teacher_profile_photo_${user.id}`;
    try {
      setProfilePhoto(localStorage.getItem(key) || "");
    } catch {
      setProfilePhoto("");
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    loadMyMessages(user.id);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pnhs_in_app_messages") loadMyMessages(user.id);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const seen = getSeenMessageIds(user.id);
    const unread = messages.filter(
      (m) => m.toId === user.id && !seen.has(m.id),
    ).length;
    setMessageUnreadCount(unread);
  }, [messages, user?.id]);

  useEffect(() => {
    if (
      didInitUnreadRef.current &&
      messageUnreadCount > prevUnreadRef.current
    ) {
      showToast("You have a new message.", "info");
    }
    didInitUnreadRef.current = true;
    prevUnreadRef.current = messageUnreadCount;
  }, [messageUnreadCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!studentRecords.length) {
      setStudentProfilePhotos({});
      return;
    }

    const photos: Record<string, string> = {};
    for (const student of studentRecords) {
      try {
        const value = localStorage.getItem(
          `student_profile_photo_${student.id}`,
        );
        if (value) photos[student.id] = value;
      } catch {
        // ignore storage access errors
      }
    }
    setStudentProfilePhotos(photos);
  }, [studentRecords]);

  const loadData = async () => {
    const results = await Promise.allSettled([
      loadAnnouncements(),
      loadClassesFromApi(),
      loadStudentsFromApi(),
      loadTasksFromApi(),
      loadAssignmentsFromApi(),
    ]);
    results.forEach((r) => {
      if (r.status === "rejected") {
        console.error("Dashboard partial load error:", r.reason);
      }
    });
  };

  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(`teacher_assignments_cache_${user.id}`);
      if (!raw) return;
      const cached = JSON.parse(raw) as TeacherAssignment[];
      if (Array.isArray(cached) && cached.length > 0) {
        setAssignments((prev) => (prev.length > 0 ? prev : cached));
        lastNonEmptyAssignmentsRef.current = cached;
      }
    } catch {
      // ignore cache parse errors
    }
  }, [user?.id]);

  const loadAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as Announcement[];
        setAnnouncements(data);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      setAnnouncements([]);
    }
  };

  const loadClassesFromApi = async () => {
    try {
      const res = await fetch("/api/classes", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      const items = (await res.json()) as any[];
      const mapped = items.map((c: any) => {
        const schedule: string = c.schedule || "";
        const parts = schedule.split(" ");
        const days = parts[0] || "";
        const time = parts.slice(1).join(" ") || schedule;
        return {
          id: String(c.id) || Date.now().toString(),
          name: `${c.gradeLevel} - ${c.name}`,
          students: c.students || 0,
          section:
            c.gradeLevel === "Grade 11" || c.gradeLevel === "Grade 12"
              ? `Section ${c.section ?? ""}${c.strand ? " • " + c.strand : ""}`.trim()
              : `Section ${c.section ?? ""}`.trim(),
          time,
          room: c.room || "",
          days,
        };
      }) as ClassData[];
      setMyClasses(mapped);
    } catch (error) {
      // Ignore
    }
  };

  const loadGradesFromApi = async () => {
    try {
      const res = await fetch("/api/grades", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      const all = await res.json();
      setGradesData(all);
    } catch (e) {
      // ignore
    }
  };

  const loadTasksFromApi = async () => {
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      const tasks = (await res.json()) as any[];
      setUpcomingTasks(tasks);
    } catch (error) {
      // Ignore
    }
  };

  const loadAssignmentsFromApi = async () => {
    const requestId = ++assignmentsRequestSeq.current;
    try {
      const res = await fetch("/api/assignments", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      const list = (await res.json()) as TeacherAssignment[];
      if (requestId !== assignmentsRequestSeq.current) {
        return;
      }
      if (!Array.isArray(list)) return;

      if (list.length > 0) {
        assignmentEmptyStreakRef.current = 0;
        lastNonEmptyAssignmentsRef.current = list;
        if (user?.id) {
          try {
            localStorage.setItem(
              `teacher_assignments_cache_${user.id}`,
              JSON.stringify(list),
            );
          } catch {
            // ignore storage errors
          }
        }
        setAssignments(list);
        return;
      }

      // Protect against transient empty responses that cause flicker/disappearing rows.
      assignmentEmptyStreakRef.current += 1;
      setAssignments((prev) => {
        if (prev.length > 0 && assignmentEmptyStreakRef.current < 3) {
          return prev;
        }
        if (
          lastNonEmptyAssignmentsRef.current.length > 0 &&
          assignmentEmptyStreakRef.current < 3
        ) {
          return lastNonEmptyAssignmentsRef.current;
        }
        return [];
      });
    } catch (error) {
      // Ignore
    }
  };

  const loadStudentsFromApi = async () => {
    try {
      const res = await fetch("/api/students", { credentials: "include" });
      if (!res.ok) {
        throw new Error(
          `Failed to load students: ${res.status} ${res.statusText}`,
        );
      }
      const students = (await res.json()) as any[];
      let latestGrades: any[] = Array.isArray(gradesData) ? gradesData : [];
      try {
        const gRes = await fetch("/api/grades", { credentials: "include" });
        if (gRes.ok) {
          latestGrades = await gRes.json();
          setGradesData(latestGrades);
        }
      } catch (e) {
        console.error("Error fetching grades:", e);
      }
      let enrollments: any[] = [];
      try {
        const eRes = await fetch("/api/enrollments", {
          credentials: "include",
        });
        if (eRes.ok) {
          enrollments = await eRes.json();
        }
      } catch (e) {
        console.error("Error fetching enrollments:", e);
      }
      const enrollmentsByStudent: Record<string, any[]> = {};
      enrollments.forEach((e) => {
        const sid = String(e.studentId || "");
        if (!sid) return;
        enrollmentsByStudent[sid] = enrollmentsByStudent[sid] || [];
        enrollmentsByStudent[sid].push(e);
      });

      // Fetch attendance for teacher's classes once (server filters by teacher)
      let attendanceRows: any[] = [];
      try {
        const aRes = await fetch("/api/attendance", { credentials: "include" });
        if (aRes.ok) {
          attendanceRows = await aRes.json();
        } else {
          console.warn(
            `Failed to load attendance: ${aRes.status} ${aRes.statusText}`,
          );
        }
      } catch (e) {
        console.error("Error fetching attendance:", e);
        attendanceRows = [];
      }

      const attendanceByStudent: Record<string, any[]> = {};
      attendanceRows.forEach((r) => {
        attendanceByStudent[r.studentId] =
          attendanceByStudent[r.studentId] || [];
        attendanceByStudent[r.studentId].push(r);
      });

      const mapped = students.map((s: any, idx: number) => {
        const records = attendanceByStudent[s.id] || [];
        const total = records.length;
        const present = records.filter((r) => r.status === "present").length;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        const studentEnrollments = enrollmentsByStudent[String(s.id)] || [];
        const classNames = studentEnrollments
          .map((e: any) => e.class?.name)
          .filter(Boolean);
        // Remove duplicates using Set
        const uniqueClassNames = [...new Set(classNames)];
        const classDisplay =
          uniqueClassNames.length > 0
            ? uniqueClassNames.join(", ")
            : `${s.gradeLevel} - ${s.section}`;
        const primaryEnrollment = studentEnrollments[0];
        const resolvedSection =
          (s.section && String(s.section).trim()) ||
          (primaryEnrollment?.class?.section &&
            String(primaryEnrollment.class.section).trim()) ||
          "";
        const resolvedStrand =
          (s.strand && String(s.strand).trim()) ||
          (primaryEnrollment?.class?.strand &&
            String(primaryEnrollment.class.strand).trim()) ||
          "";

        const studentGrades = latestGrades.filter((g) => g.studentId === s.id);
        const currentGradeRecord =
          studentGrades.find(
            (g: any) =>
              String(g.subjectId) === "general" && String(g.quarter) === "Q2",
          ) || studentGrades[0];

        const currentGrade =
          currentGradeRecord &&
          Number.isFinite(Number(currentGradeRecord.grade))
            ? String(Math.round(Number(currentGradeRecord.grade)))
            : s.gpa || "0";

        return {
          id: String(s.id) || String(idx + 1),
          name: s.name,
          class: classDisplay,
          section: resolvedSection,
          strand: resolvedStrand,
          enrolledClassIds: [
            ...new Set(
              studentEnrollments
                .map((e: any) => String(e.classId || ""))
                .filter((id: string) => id.length > 0),
            ),
          ],
          attendance: `${pct}%`,
          status: records.length
            ? records[records.length - 1].status
            : "present",
          grade: String(currentGrade),
          email: s.email,
        };
      }) as StudentRecord[];

      setStudentRecords(mapped);
    } catch (error) {
      console.error("Error loading students from API:", error);
      // Keep dashboard usable even when students endpoint temporarily fails.
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      // Ignore
    }
    setUser(null);
    router.push("/login");
  };

  const handleProfilePhotoChange = (e: any) => {
    const file = e?.target?.files?.[0] as File | undefined;
    if (!file || !user?.id) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "warning");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image is too large. Max size is 2MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setProfilePhoto(value);
      try {
        localStorage.setItem(`teacher_profile_photo_${user.id}`, value);
      } catch {
        // ignore storage errors
      }
      showToast("Profile photo updated.", "success");
    };
    reader.onerror = () => showToast("Failed to read selected image.", "error");
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePhoto = () => {
    if (!user?.id) return;
    setProfilePhoto("");
    try {
      localStorage.removeItem(`teacher_profile_photo_${user.id}`);
    } catch {
      // ignore storage errors
    }
    showToast("Profile photo removed.", "info");
  };

  const openStudentMessage = (student: StudentRecord) => {
    setMessageStudent(student);
    setMessageSubject(`Message from ${user?.fullName || "Teacher"}`);
    setMessageBody(
      `Hello ${student.name},\n\nThis is a message regarding your class updates.\n\nRegards,\n${user?.fullName || "Teacher"}`,
    );
    markStudentMessagesAsSeen(student.id);
  };

  const handleSendStudentMessage = () => {
    if (!messageStudent || !user?.id) return;
    const subject = messageSubject.trim() || "Class update";
    const body = messageBody.trim() || "Hello student,";
    const payload: DashboardMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fromId: user.id,
      fromRole: "teacher",
      fromName: user.fullName || "Teacher",
      toId: messageStudent.id,
      toRole: "student",
      toName: messageStudent.name,
      toEmail: messageStudent.email || "",
      subject,
      body,
      createdAt: new Date().toISOString(),
    };
    try {
      const key = "pnhs_in_app_messages";
      const raw = localStorage.getItem(key);
      const items: DashboardMessage[] = raw ? JSON.parse(raw) : [];
      items.unshift(payload);
      localStorage.setItem(key, JSON.stringify(items));
      setMessages(
        items.filter((m) => m.fromId === user.id || m.toId === user.id),
      );
    } catch {
      // ignore localStorage failures
    }
    showToast("Message sent.", "success");
    setMessageStudent(null);
  };

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);

    // Isara lang ang sidebar kung mobile/small screen (< 1024px)
    // Sa desktop/laptop (≥1024px), huwag isara
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };
  const handleAddClass = () => {
    if (!newClass.name || !newClass.section) {
      showToast("Please fill in required fields", "warning");
      return;
    }

    const newClassObj = {
      id: Date.now().toString(),
      ...newClass,
    };

    setMyClasses([...myClasses, newClassObj]);
    setNewClass({
      name: "",
      section: "",
      time: "",
      room: "",
      days: "",
      students: 0,
    });
    setShowAddClassModal(false);
  };

  const handleAddTask = async () => {
    if (!newTask.task || !newTask.deadline) {
      showToast("Please fill in required fields", "warning");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!res.ok) {
        showToast("Failed to add task", "error");
        return;
      }

      setNewTask({
        task: "",
        class: "All Classes",
        deadline: "",
        priority: "medium",
        description: "",
      });
      setShowAddTaskModal(false);
      await loadTasksFromApi();
    } catch (error: unknown) {
      showToast("Error adding task", "error");
      console.error(error);
    }
  };

  const handleAddAssignment = async () => {
    if (
      !newAssignment.title ||
      !newAssignment.dueDate ||
      newAssignment.selectedClassIds.length === 0
    ) {
      showToast("Please fill in required fields", "warning");
      return;
    }

    try {
      let attachmentPath: string | undefined;
      let attachmentName: string | undefined;

      if (assignmentAttachmentFile) {
        const formData = new FormData();
        formData.append("file", assignmentAttachmentFile);
        formData.append("classId", newAssignment.selectedClassIds[0]); // Use first class for upload

        const uploadRes = await fetch("/api/assignments/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadBody = await uploadRes.json().catch(() => ({}));
          showToast(
            uploadBody.message || "Failed to upload attachment",
            "error",
          );
          return;
        }

        const uploadResult = await uploadRes.json();
        attachmentPath = uploadResult.filePath;
        attachmentName = uploadResult.fileName;
      }

      // Create assignments for each selected class
      const assignmentPromises = newAssignment.selectedClassIds.map(
        async (classId) => {
          const res = await fetch("/api/assignments", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: newAssignment.title,
              subject: newAssignment.subject,
              dueDate: newAssignment.dueDate,
              classId: classId,
              description: newAssignment.description,
              points: newAssignment.points,
              attachmentPath,
              attachmentName,
            }),
          });

          if (!res.ok) {
            const raw = await res.text();
            let parsed: any = {};
            try {
              parsed = raw ? JSON.parse(raw) : {};
            } catch {
              parsed = {};
            }
            const message =
              parsed.error ||
              parsed.details ||
              parsed.message ||
              raw ||
              `Failed to create assignment (HTTP ${res.status})`;
            throw new Error(message);
          }

          return res.json();
        },
      );

      await Promise.all(assignmentPromises);

      setNewAssignment({
        title: "",
        subject: "",
        dueDate: "",
        classId: "",
        selectedClassIds: [],
        description: "",
        points: "",
      });
      setAssignmentAttachmentFile(null);
      setShowAddAssignmentModal(false);
      await loadAssignmentsFromApi();
      showToast(
        `Assignment created for ${newAssignment.selectedClassIds.length} class(es) successfully!`,
        "success",
      );
    } catch (error: unknown) {
      console.error(error);
      showToast(`Error creating assignment: ${getErrorMessage(error)}`, "error");
    }
  };

  const handleDeleteClass = (id: string) => {
    if (!requestConfirm("class", id)) return;
    setMyClasses(myClasses.filter((c) => c.id !== id));
  };

  const handleToggleTask = async (id: string) => {
    const task = upcomingTasks.find((t) => String(t.id) === String(id));
    if (!task) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, completed: !task.completed }),
      });

      if (res.ok) {
        await loadTasksFromApi();
      }
    } catch (error: unknown) {
      console.error(error);
      showToast(getErrorMessage(error), "error");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!requestConfirm("task", id)) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        await loadTasksFromApi();
      }
    } catch (error: unknown) {
      console.error(error);
      showToast(getErrorMessage(error), "error");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!requestConfirm("assignment", id)) return;
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(
          body.error || body.message || "Failed to delete assignment",
          "error",
        );
        return;
      }
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      await loadAssignmentsFromApi();
      showToast("Assignment deleted", "success");
    } catch (error: unknown) {
      console.error(error);
      showToast(getErrorMessage(error) || "Error deleting assignment", "error");
    }
  };

  const handleUpdateStudentGrade = async () => {
    if (!editingStudent) return;
    const numericGrade = Number(editingStudent.grade);
    if (
      !Number.isFinite(numericGrade) ||
      numericGrade < 0 ||
      numericGrade > 100
    ) {
      showToast("Grade must be a number between 0 and 100.", "warning");
      return;
    }

    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: String(editingStudent.id),
          subjectId: "general",
          grade: String(Math.round(numericGrade)),
          quarter: "Q2",
          remarks: "Updated by teacher",
        }),
      });

      if (!res.ok) {
        showToast("Failed to update grade. Please try again.", "error");
        return;
      }

      showToast("Grade updated successfully!", "success");
      setStudentRecords(
        studentRecords.map((student) =>
          student.id === editingStudent.id
            ? { ...student, grade: String(Math.round(numericGrade)) }
            : student,
        ),
      );
      setEditingStudent(null);
      await loadGradesFromApi();
      await loadStudentsFromApi();
    } catch (error: unknown) {
      console.error("Error updating grade:", error);
      showToast("An error occurred while updating the grade.", "error");
    }
  };

  const handleTakeAttendance = async () => {
    try {
      if (!takeAttendanceRows.length) {
        showToast("No students to save", "warning");
        return;
      }

      const classId = takeAttendanceClass || myClasses[0]?.id || "";
      if (!classId) {
        showToast("Please select a class first.", "warning");
        return;
      }

      const nowIso = new Date().toISOString();

      const results = await Promise.all(
        takeAttendanceRows.map(async (r) => {
          const res = await fetch("/api/attendance", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: String(r.studentId),
              classId,
              date: nowIso,
              status: r.status,
            }),
          });
          const payload = await res.json().catch(() => ({}));
          return {
            ok: res.ok,
            status: res.status,
            payload,
            studentName: r.name,
          };
        }),
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        const first = failed[0];
        showToast(
          `Saved with issues: ${results.length - failed.length}/${results.length}\n` +
            `${first.studentName}: ${first.payload?.message || `HTTP ${first.status}`}`,
          "warning",
        );
      } else {
        showToast("Attendance recorded successfully!", "success");
      }

      // reload students/attendance so percentages update
      await loadStudentsFromApi();
      setShowAttendanceModal(false);
    } catch (error: unknown) {
      console.error(error);
      showToast(
        getErrorMessage(error) ||
          "Failed to record attendance. Please try again.",
        "error",
      );
    }
  };

  const handleExportData = () => {
    let data: any;
    let filename: string;

    switch (activeTab) {
      case "classes":
        data = myClasses;
        filename = "classes-data";
        break;
      case "attendance":
        data = studentRecords;
        filename = "attendance-data";
        break;
      case "grades":
        data = studentRecords;
        filename = "grades-data";
        break;
      case "students":
        data = studentRecords;
        filename = "students-data";
        break;
      case "assignments":
        data = assignments;
        filename = "assignments-data";
        break;
      default:
        data = {
          classes: myClasses,
          students: studentRecords,
          tasks: upcomingTasks,
          assignments,
        };
        filename = "teacher-data";
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  // -----------------------
  // Attendance helpers
  // -----------------------
  const openStudentAttendance = async (studentId: string, name: string) => {
    try {
      const res = await fetch(`/api/attendance?studentId=${studentId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        showToast("Failed to load attendance history", "error");
        return;
      }
      const rows = (await res.json()) as any[];
      const present = rows.filter((r) => r.status === "present").length;
      const late = rows.filter((r) => r.status === "late").length;
      const absent = rows.filter((r) => r.status === "absent").length;
      const pct = rows.length ? Math.round((present / rows.length) * 100) : 0;

      setAttendanceModalStudent({
        id: studentId,
        name,
        attendance: `${pct}%`,
        attendanceRecords: { present, late, absent },
        attendanceHistory: rows.map((r) => ({
          id: r.id,
          date: r.date,
          status: r.status,
        })),
      });
    } catch (e) {
      console.error(e);
      showToast("Failed to load attendance history", "error");
    }
  };

  const updateAttendanceRecord = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/attendance/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("update failed");
      // refresh modal + summary
      if (attendanceModalStudent) {
        await openStudentAttendance(
          attendanceModalStudent.id,
          attendanceModalStudent.name,
        );
      }
      await loadStudentsFromApi();
    } catch (e) {
      console.error(e);
      showToast("Failed to update attendance", "error");
    }
  };

  const addOrUpdateTodayAttendance = async (
    studentId: string,
    classId: string,
    status: string,
  ) => {
    try {
      const res = await fetch(`/api/attendance?studentId=${studentId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("fetch failed");
      const rows = (await res.json()) as any[];
      const today = new Date().toDateString();
      const todayRow = rows.find(
        (r) =>
          new Date(r.date).toDateString() === today &&
          String(r.classId) === String(classId),
      );
      if (todayRow) {
        await updateAttendanceRecord(todayRow.id, status);
      } else {
        await fetch("/api/attendance", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            classId,
            date: new Date().toISOString(),
            status,
          }),
        });
        await loadStudentsFromApi();
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to add/update today's attendance", "error");
    }
  };

  const handleQuickSaveAttendance = async (student: StudentRecord) => {
    const status =
      quickAttendanceStatus[student.id] || student.status || "present";
    const classId =
      takeAttendanceClass ||
      student.enrolledClassIds[0] ||
      myClasses[0]?.id ||
      "";
    if (!classId) {
      showToast("Please select a class context first.", "warning");
      return;
    }
    await addOrUpdateTodayAttendance(student.id, classId, status);
  };

  // Determine default statuses for take-attendance modal based on class schedule
  const parseTimeToToday = (timeStr: string) => {
    // Handles formats like:
    // "8:00 AM - 9:00 AM" (12-hour with range)
    // "9:30 AM" (12-hour single)
    // "8:00-9:00" (24-hour)
    // "MWF 8:00-9:00 AM" (schedule with days)
    if (!timeStr) return null;

    // Match time pattern: HH:MM or H:MM followed optionally by AM/PM
    // Handles: "8:00 AM", "8:00-9:00 AM", "8:00-9:00", "MWF 8:00-9:00 AM"
    const timeMatch = timeStr.match(
      /(\d{1,2}):(\d{2})(?:\s*-\s*\d{1,2}:\d{2})?\s*(AM|PM)?/i,
    );
    if (!timeMatch) return null;

    let hh = parseInt(timeMatch[1], 10);
    const mm = parseInt(timeMatch[2], 10);
    const ampm = (timeMatch[3] || "AM").toUpperCase();

    // Convert to 24-hour format
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;

    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  };

  // Prepare rows when showing take-attendance modal
  const prepareTakeAttendance = (classId?: string) => {
    const selectedId = classId || takeAttendanceClass || myClasses[0]?.id || "";
    setTakeAttendanceClass(selectedId);
    const cls = myClasses.find((c) => c.id === selectedId) || myClasses[0];
    const startTime = cls?.time ? parseTimeToToday(cls.time) : null;
    const now = new Date();
    const attendanceOpen = startTime ? now >= startTime : true; // allow if no schedule

    const rows = studentRecords
      .filter((s) =>
        selectedId ? s.enrolledClassIds.includes(String(selectedId)) : true,
      )
      .map((s) => ({
        studentId: s.id,
        name: s.name,
        status: attendanceOpen ? "present" : ("present" as const),
      }));

    setTakeAttendanceRows(rows);
  };

  // Daily refresh: reload attendance when the date changes or tab comes into focus
  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    // Function to reload with retry logic
    const reloadWithRetry = async () => {
      try {
        await loadStudentsFromApi();
        retryCount = 0; // Reset on success
      } catch (error) {
        console.error("Failed to load students:", error);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          setTimeout(reloadWithRetry, RETRY_DELAY);
        }
      }
    };

    // Check if date has changed and reload if needed
    const checkAndReloadIfDateChanged = () => {
      const today = new Date().toDateString();
      if (today !== todayKey) {
        setTodayKey(today);
        reloadWithRetry();
      }
    };

    // Handle visibility change (when tab becomes active)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab came into focus, check if date changed
        checkAndReloadIfDateChanged();
      }
    };

    // Interval-based check every minute
    const tick = setInterval(() => {
      checkAndReloadIfDateChanged();
    }, 60 * 1000); // check every minute

    // Listen for visibility changes (tab focus/blur)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [todayKey]);

  // Keep Section Context (takeAttendanceClass) in sync with selected Class filter
  useEffect(() => {
    if (filterClass !== "all") {
      setTakeAttendanceClass(filterClass);
    } else if (!takeAttendanceClass && myClasses.length > 0) {
      setTakeAttendanceClass(myClasses[0].id);
    }
  }, [filterClass, myClasses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload students when attendance context changes to reflect fresh enrollments
  useEffect(() => {
    (async () => {
      try {
        await loadStudentsFromApi();
      } catch {
        // ignore transient errors
      }
    })();
  }, [takeAttendanceClass]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredStudents = studentRecords.filter((student) => {
    // Use filterClass directly instead of takeAttendanceClass for filtering
    const effectiveClassId = filterClass !== "all" ? filterClass : "";
    if (effectiveClassId) {
      const selectedClass = myClasses.find((c) => c.id === effectiveClassId);
      const byId = student.enrolledClassIds.includes(effectiveClassId);
      const bySectionStrand = selectedClass
        ? (() => {
            const clsSection = (selectedClass.section || "").trim();
            const clsStrandPart = clsSection.includes("•")
              ? clsSection.split("•")[1].trim()
              : "";
            const clsSectionLetter = clsSection
              .replace(/^Section\s+/i, "")
              .split("•")[0]
              .trim();
            const secMatch =
              !clsSectionLetter ||
              (student.section || "").trim().toUpperCase() ===
                clsSectionLetter.toUpperCase();
            const strandMatch =
              !clsStrandPart ||
              (student.strand || "").trim().toUpperCase() ===
                clsStrandPart.toUpperCase();
            return secMatch && strandMatch;
          })()
        : false;
      if (!byId && !bySectionStrand) return false;
    }
    if (filterStatus !== "all" && student.status !== filterStatus) return false;
    if (
      searchTerm &&
      !student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const getMessagesWithStudent = (studentId: string) =>
    messages.filter(
      (m) =>
        (m.fromId === user?.id && m.toId === studentId) ||
        (m.fromId === studentId && m.toId === user?.id),
    );

  const getLatestStudentMessage = (studentId: string) =>
    getMessagesWithStudent(studentId)[0] || null;

  const getStudentUnreadCount = (studentId: string) => {
    if (!user?.id) return 0;
    const seen = getSeenMessageIds(user.id);
    return messages.filter(
      (m) => m.toId === user.id && m.fromId === studentId && !seen.has(m.id),
    ).length;
  };

  const filteredGradeStudents = studentRecords.filter((student) => {
    if (filterClass !== "all") {
      const byId = student.enrolledClassIds.includes(filterClass);
      const classNames = student.class.split(", ");
      const byName = classNames.some(
        (cn) =>
          cn.toLowerCase().includes(filterClass.toLowerCase()) ||
          filterClass.toLowerCase().includes(cn.toLowerCase()),
      );
      if (!byId && !byName) return false;
    }
    if (
      searchTerm &&
      !student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const gradeSummary = {
    total: filteredGradeStudents.length,
    passing: filteredGradeStudents.filter((s) => Number(s.grade) >= 75).length,
    atRisk: filteredGradeStudents.filter((s) => Number(s.grade) < 75).length,
    average:
      filteredGradeStudents.length > 0
        ? Math.round(
            filteredGradeStudents.reduce(
              (sum, s) =>
                sum + (Number.isFinite(Number(s.grade)) ? Number(s.grade) : 0),
              0,
            ) / filteredGradeStudents.length,
          )
        : 0,
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (!searchTerm) return true;
    return (
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-green-50 px-4">
        <div className="relative">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-green-600 to-yellow-500 animate-pulse mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-white animate-bounce" />
          </div>
        </div>
        <p className="mt-6 text-green-700 font-semibold text-base md:text-lg text-center">
          Loading Teacher Dashboard...
        </p>
        <p className="text-gray-600 mt-2 text-sm md:text-base text-center">
          Please wait a moment
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "My Classes",
      value: myClasses.length.toString(),
      icon: BookOpen,
      color: "bg-gradient-to-br from-green-600 to-green-700",
      change: "+1 this sem",
    },
    {
      label: "Total Students",
      value: myClasses.reduce((sum, c) => sum + c.students, 0).toString(),
      icon: Users,
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      change: "↗️ 8% from last year",
    },
    {
      label: "Pending Tasks",
      value: upcomingTasks.filter((t) => !t.completed).length.toString(),
      icon: ClipboardCheck,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      change: "Deadline: Tomorrow",
    },
    {
      label: "Attendance Rate",
      value: `${Math.round(studentRecords.reduce((sum, s) => sum + parseInt(s.attendance), 0) / studentRecords.length)}%`,
      icon: TrendingUp,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      change: "↑ 2% from last month",
    },
  ];

  const navigationItems = [
    { icon: Home, label: "Dashboard", key: "dashboard" },
    {
      icon: Bell,
      label: "Announcements",
      key: "announcements",
      badge: announcementUnreadCount,
    },
    { icon: BookOpen, label: "My Classes", key: "classes" },
    { icon: FileText, label: "Assignments", key: "assignments" },
    { icon: FileText, label: "Grades", key: "grades" },
    { icon: BarChart3, label: "Analytics", key: "analytics" },
    {
      icon: Award,
      label: "Students",
      key: "students",
      badge: messageUnreadCount,
    },
    { icon: Settings, label: "Settings", key: "settings" },
  ];

  // Helper function to format dates as "Today", "Yesterday", or date string
  const formatAttendanceDate = (date: string | Date) => {
    const attendanceDate = typeof date === "string" ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = attendanceDate.toDateString() === today.toDateString();
    const isYesterday =
      attendanceDate.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return attendanceDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        attendanceDate.getFullYear() !== today.getFullYear()
          ? "numeric"
          : undefined,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "announcements":
        return (
          <div className="space-y-4 md:space-y-6">
            {filteredAnnouncements.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-8 md:p-12 border border-green-100 text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full flex items-center justify-center">
                  <Bell className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-700 mb-2 md:mb-3">
                  No Announcements Found
                </h3>
                <p className="text-gray-600 text-sm md:text-base mb-4 md:mb-6">
                  {searchTerm
                    ? "Try a different search term"
                    : "School administration hasn't posted any announcements yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300 border border-green-100 group hover:border-green-300"
                  >
                    <div
                      className={`w-full h-2 rounded-full mb-3 md:mb-4 ${
                        announcement.type === "info"
                          ? "bg-blue-500"
                          : announcement.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    ></div>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                          {announcement.title}
                        </h3>
                        <span
                          className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                            announcement.type === "info"
                              ? "bg-blue-100 text-blue-700"
                              : announcement.type === "warning"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {announcement.type.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-gray-700 leading-relaxed line-clamp-3 text-sm md:text-base">
                        {announcement.message}
                      </p>

                      <div className="pt-3 md:pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <div className="flex items-center gap-2 text-gray-600 min-w-0 flex-1">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="w-3 h-3 md:w-4 md:h-4 text-green-700" />
                            </div>
                            <span className="truncate">
                              {announcement.author}
                            </span>
                          </div>
                          <span className="text-gray-500 whitespace-nowrap ml-2">
                            {new Date(announcement.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "classes":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                  My Classes
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  View your classes
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myClasses.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-3 bg-blue-50 rounded-2xl p-8 text-center border-2 border-dashed border-blue-300">
                  <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No classes yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click "Add Class" to create your first class
                  </p>
                </div>
              ) : (
                myClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300 border border-green-100 group hover:border-green-300"
                  >
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                          {cls.name}
                        </h3>
                        <p className="text-gray-600 text-xs md:text-sm truncate">
                          {cls.students} students
                        </p>
                      </div>
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0 ml-3">
                        {cls.students}
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                      <div className="flex items-center gap-2 md:gap-3 text-gray-700">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs md:text-sm truncate">
                          {cls.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-gray-700">
                        <Home className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs md:text-sm truncate">
                          {cls.room}
                        </span>
                        {cls.section && (
                          <span className="ml-3 text-xs md:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {cls.section}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-gray-700">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs md:text-sm truncate">
                          {cls.days}
                        </span>
                      </div>
                    </div>

                    {/* Attendance buttons for each class */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          prepareTakeAttendance(cls.id);
                          setShowAttendanceModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        Take
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClassForHistory(cls.id);
                          setShowAttendanceHistoryModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        <Clock className="w-4 h-4" />
                        History
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "assignments":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                  Assignments
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Create class-based assignments and monitor submissions
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAddAssignmentModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 text-sm md:text-base"
                >
                  <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                  Create Assignment
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-2xl p-4 border border-green-100">
                <p className="text-xs text-gray-500">Total Assignments</p>
                <p className="text-2xl font-bold text-green-700">
                  {assignments.length}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-blue-100">
                <p className="text-xs text-gray-500">Pending Submissions</p>
                <p className="text-2xl font-bold text-blue-700">
                  {assignments.reduce((sum, a) => {
                    const submitted = getSubmittedStudents(a).length;
                    const expected = getExpectedSubmissionCount(a);
                    return sum + Math.max(expected - submitted, 0);
                  }, 0)}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-emerald-100">
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {assignments.reduce(
                    (sum, a) => sum + getSubmittedStudents(a).length,
                    0,
                  )}
                </p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg border border-green-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Title
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Class
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Due Date
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Submissions
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => {
                      const submittedSubs = getSubmittedStudents(a);
                      const expectedCount = getExpectedSubmissionCount(a);
                      return (
                        <tr
                          key={a.id}
                          className="border-t border-green-100 hover:bg-green-50"
                        >
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900">
                            <div className="space-y-1">
                              <div>{a.title}</div>
                              {a.attachmentPath && (
                                <a
                                  href={a.attachmentPath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-green-700 hover:text-green-800 underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="w-3 h-3" />
                                  {a.attachmentName || "View attachment"}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                            {a.className ||
                              a.class?.name ||
                              (a.classId
                                ? classNameById[String(a.classId)]
                                : null) ||
                              a.classId ||
                              "N/A"}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                            {new Date(a.dueDate).toLocaleDateString("en-US")}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                            <div className="space-y-1">
                              <div className="font-semibold text-gray-800">
                                {submittedSubs.length}/{expectedCount} submitted
                              </div>
                              {submittedSubs.slice(0, 3).map((s) => (
                                <div
                                  key={s.id}
                                  className="text-xs text-gray-600"
                                >
                                  {s.student?.name || "Student"}{" "}
                                  {s.filePath ? (
                                    <a
                                      href={s.filePath}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-700 underline ml-1"
                                    >
                                      file
                                    </a>
                                  ) : (
                                    <span className="text-gray-500 ml-1">
                                      (no file)
                                    </span>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSubmissionModalAssignment(a);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800 underline"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View all submitted ({submittedSubs.length})
                              </button>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteAssignment(a.id);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {assignments.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 md:px-6 py-8 text-center text-gray-500 text-sm"
                        >
                          No assignments yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "attendance":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                  Attendance Management
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Track and manage student attendance
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 text-sm md:text-base"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  Export
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1">
                <select
                  value={takeAttendanceClass}
                  onChange={(e) => setTakeAttendanceClass(e.target.value)}
                  className="px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                >
                  <option value="">Section Context (Auto)</option>
                  {attendanceContextOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                >
                  <option value="all">All Classes</option>
                  {myClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {getSimplifiedClassLabel(cls)}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs md:text-sm text-blue-800">
                Flow: 1) Filter students, 2) Set section context, 3) Use Quick
                Mark + Save Today per student, or click Take Attendance for
                whole class.
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg border border-green-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Student Name
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900 hidden sm:table-cell">
                        Class
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Attendance Rate
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Status
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-t border-green-100 hover:bg-green-50"
                      >
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell">
                          {student.class}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-green-600">
                          {student.attendance}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <span
                            className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                              student.status === "present"
                                ? "bg-green-100 text-green-700"
                                : student.status === "late"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {student.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <button
                            onClick={() =>
                              openStudentAttendance(student.id, student.name)
                            }
                            className="px-2 md:px-3 py-1.5 md:py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium text-xs md:text-sm transition-colors flex items-center gap-1.5"
                            title="View attendance history"
                          >
                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                            <span>View History</span>
                          </button>
                          <select
                            value={
                              quickAttendanceStatus[student.id] ||
                              student.status
                            }
                            onChange={(e) =>
                              setQuickAttendanceStatus((prev) => ({
                                ...prev,
                                [student.id]: e.target.value as
                                  | "present"
                                  | "late"
                                  | "absent",
                              }))
                            }
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs md:text-sm bg-white"
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                          </select>
                          <button
                            onClick={async () =>
                              await handleQuickSaveAttendance(student)
                            }
                            className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium text-xs md:text-sm"
                            title="Save today's attendance"
                          >
                            Save Today
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "grades":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                  Grades Management
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  View and manage student grades
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    showToast(
                      "Use Edit Grade per student, then click Save in the modal.",
                      "info",
                    )
                  }
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm md:text-base"
                >
                  <Save className="w-4 h-4 md:w-5 md:h-5" />
                  Grade Workflow
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl text-sm md:text-base"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  Export
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-2xl p-4 border border-green-100">
                <p className="text-xs text-gray-500">Students</p>
                <p className="text-2xl font-bold text-green-700">
                  {gradeSummary.total}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-blue-100">
                <p className="text-xs text-gray-500">Average Grade</p>
                <p className="text-2xl font-bold text-blue-700">
                  {gradeSummary.average}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-emerald-100">
                <p className="text-xs text-gray-500">Passing (&gt;=75)</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {gradeSummary.passing}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-red-100">
                <p className="text-xs text-gray-500">Needs Support (&lt;75)</p>
                <p className="text-2xl font-bold text-red-700">
                  {gradeSummary.atRisk}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
              >
                <option value="all">All Classes</option>
                {myClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {getSimplifiedClassLabel(cls)}
                  </option>
                ))}
              </select>
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs md:text-sm text-blue-800">
                Flow: 1) Search/filter class, 2) Click Edit Grade, 3) Save
                changes in the modal.
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg border border-green-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Student Name
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900 hidden sm:table-cell">
                        Class
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Current Grade
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900 hidden md:table-cell">
                        Performance
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGradeStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="border-t border-green-100 hover:bg-green-50"
                      >
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell">
                          {student.class}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-green-600">
                          {student.grade}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm hidden md:table-cell">
                          <span
                            className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                              parseInt(student.grade) >= 90
                                ? "bg-green-100 text-green-700"
                                : parseInt(student.grade) >= 80
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {parseInt(student.grade) >= 90
                              ? "Excellent"
                              : parseInt(student.grade) >= 80
                                ? "Good"
                                : "Average"}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <button
                            onClick={() => {
                              setEditingStudent(student);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredGradeStudents.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 md:px-6 py-8 text-center text-gray-500 text-sm"
                        >
                          No students found for current filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "students":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                  Student Records
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  View all student information
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 text-sm md:text-base"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  Export
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
              >
                <option value="all">All Classes</option>
                {myClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {getSimplifiedClassLabel(cls)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => openStudentMessage(student)}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100 hover:border-green-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0 overflow-hidden">
                        {studentProfilePhotos[student.id] ? (
                          <img
                            src={studentProfilePhotos[student.id]}
                            alt={`${student.name} profile`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{student.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">
                          {student.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          {student.class}
                        </p>
                        {student.email && (
                          <p className="text-xs text-gray-500 truncate">
                            {student.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-600">
                        Section:
                      </span>
                      <span className="font-semibold text-gray-900 text-sm md:text-base">
                        {student.section || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-600">
                        Strand:
                      </span>
                      <span className="font-semibold text-gray-900 text-sm md:text-base">
                        {student.strand || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    {(() => {
                      const latest = getLatestStudentMessage(student.id);
                      const total = getMessagesWithStudent(student.id).length;
                      const unread = getStudentUnreadCount(student.id);
                      return (
                        <div className="space-y-2">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                            {latest ? latest.body : "No messages yet."}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {total} message{total === 1 ? "" : "s"}
                              </span>
                              {unread > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                                  {unread} new
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markStudentMessagesAsSeen(student.id);
                                  openStudentMessage(student);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 text-xs md:text-sm font-semibold"
                              >
                                <Eye className="w-4 h-4" />
                                View Messages
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openStudentMessage(student);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-xs md:text-sm font-semibold"
                              >
                                <Mail className="w-4 h-4" />
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                Analytics & Reports
              </h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                View performance analytics and insights
              </p>
            </div>

            <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
                  Class Performance
                </h3>
                <div className="space-y-3 md:space-y-4">
                  {myClasses.map((cls) => {
                    const classStudents = studentRecords.filter((s) =>
                      s.class.includes(cls.name.split(" - ")[0]),
                    );
                    const avgGrade =
                      classStudents.length > 0
                        ? Math.round(
                            classStudents.reduce(
                              (sum, s) => sum + parseInt(s.grade),
                              0,
                            ) / classStudents.length,
                          )
                        : 0;
                    return (
                      <div key={cls.id}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs md:text-sm text-gray-700 truncate flex-1 mr-2">
                            {cls.name}
                          </span>
                          <span className="text-xs md:text-sm font-semibold text-green-600 whitespace-nowrap">
                            {avgGrade}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full"
                            style={{ width: `${avgGrade}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
                  Attendance Overview
                </h3>
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-bold text-green-600 mb-2">
                    {Math.round(
                      studentRecords.reduce(
                        (sum, s) => sum + parseInt(s.attendance),
                        0,
                      ) / studentRecords.length,
                    )}
                    %
                  </div>
                  <div className="text-gray-600 text-sm md:text-base">
                    Average Attendance Rate
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6">
                    <div className="bg-green-50 p-3 md:p-4 rounded-xl">
                      <div className="text-xl md:text-2xl font-bold text-green-600">
                        {
                          studentRecords.filter((s) => s.status === "present")
                            .length
                        }
                      </div>
                      <div className="text-xs text-gray-600">Present Today</div>
                    </div>
                    <div className="bg-red-50 p-3 md:p-4 rounded-xl">
                      <div className="text-xl md:text-2xl font-bold text-red-600">
                        {
                          studentRecords.filter((s) => s.status === "absent")
                            .length
                        }
                      </div>
                      <div className="text-xs text-gray-600">Absent Today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                My Profile
              </h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                View and manage your information
              </p>
            </div>

            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
                <div className="text-center">
                  <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full shadow-lg overflow-hidden mb-4 bg-gradient-to-br from-green-600 to-yellow-500 flex items-center justify-center text-white font-bold text-4xl md:text-5xl">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Teacher profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user?.fullName?.charAt(0) || "T"}</span>
                    )}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    {user?.fullName || "Teacher"}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    {user?.email || "teacher@pnhs.edu.ph"}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs md:text-sm text-gray-600">
                      Department
                    </div>
                    <div className="font-semibold text-gray-900">
                      {teacherLabel || "Not set"}
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 cursor-pointer text-sm">
                      <Upload className="w-4 h-4" />
                      Change Profile Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePhotoChange}
                      />
                    </label>
                    {profilePhoto && (
                      <button
                        onClick={handleRemoveProfilePhoto}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.fullName || ""}
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                      disabled
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                      disabled
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={teacherLabel || "Not set"}
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                      disabled
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6 md:space-y-8">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-green-600 via-green-700 to-yellow-600 rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 text-white">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3">
                    Welcome back, {user?.fullName || "Teacher"}! 👋
                  </h1>
                  <p className="text-green-100 text-base md:text-lg mb-4 md:mb-6">
                    Here's what's happening with your classes today.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <button
                      onClick={() => handleNavigation("classes")}
                      className="px-4 md:px-5 py-2 md:py-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <Calendar className="w-4 h-4" />
                      View Classes
                    </button>
                    <button
                      onClick={() => {
                        prepareTakeAttendance();
                        setShowAttendanceModal(true);
                      }}
                      className="px-4 md:px-5 py-2 md:py-2.5 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-colors font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Take Attendance
                    </button>
                  </div>
                </div>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-white/20 to-transparent border-4 border-white/30 flex items-center justify-center mx-auto lg:mx-0">
                  <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-white/90" />
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300 border border-green-100 group"
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div
                      className={`p-2 md:p-3 rounded-xl ${stat.color} shadow-md`}
                    >
                      <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {stat.change}
                    </div>
                  </div>
                  <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold text-green-800">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
              {/* My Classes */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-green-900">
                      My Classes
                    </h2>
                    <p className="text-gray-600 mt-1 text-xs md:text-sm">
                      Active classes this semester
                    </p>
                  </div>
                  <button
                    onClick={() => handleNavigation("classes")}
                    className="text-green-700 hover:text-green-900 font-semibold text-xs md:text-sm flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 md:space-y-4">
                  {myClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-4 md:p-5 border border-gray-200 rounded-xl md:rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base md:text-lg truncate">
                            {cls.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                            <span className="text-xs md:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {cls.section}
                            </span>
                            <span className="text-xs md:text-sm text-gray-600">
                              {cls.students} students
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs md:text-sm font-semibold text-green-700">
                            {cls.time}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cls.days}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Tasks */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-green-900">
                      Upcoming Tasks
                    </h2>
                    <p className="text-gray-600 mt-1 text-xs md:text-sm">
                      Your pending tasks
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 text-xs md:text-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {upcomingTasks
                    .filter((t) => !t.completed)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 md:p-4 border border-gray-200 rounded-xl md:rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all"
                      >
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(String(task.id))}
                            className="w-4 h-4 md:w-5 md:h-5 text-green-600 rounded flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                              {task.task}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-gray-600 truncate">
                                {task.class}
                              </span>
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  task.priority === "high"
                                    ? "bg-red-100 text-red-700"
                                    : task.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {new Date(task.deadline).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(String(task.id))}
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
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-green-900">
                    Recent Announcements
                  </h2>
                  <p className="text-gray-600 mt-1 text-xs md:text-sm">
                    Latest updates from administration
                  </p>
                </div>
                <button
                  onClick={() => handleNavigation("announcements")}
                  className="text-green-700 hover:text-green-900 font-semibold text-xs md:text-sm flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 md:space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <Bell className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm md:text-base">
                      No announcements yet
                    </p>
                  </div>
                ) : (
                  announcements.slice(0, 3).map((announcement) => (
                    <div
                      key={announcement.id}
                      className={`p-4 md:p-5 rounded-xl md:rounded-2xl border-l-4 cursor-pointer ${
                        announcement.type === "info"
                          ? "bg-blue-50 border-blue-500"
                          : announcement.type === "warning"
                            ? "bg-yellow-50 border-yellow-500"
                            : "bg-green-50 border-green-500"
                      }`}
                      onClick={() => handleNavigation("announcements")}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base md:text-lg">
                            {announcement.title}
                          </h3>
                          <p className="text-gray-700 mt-2 line-clamp-2 text-sm md:text-base">
                            {announcement.message}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 mt-3">
                            <span className="truncate">
                              {announcement.author}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="whitespace-nowrap">
                              {new Date(announcement.date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "2-digit",
                                },
                              )}
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
        );
    } // ← THIS was the missing closing brace for the switch statement
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-50">
      {toast.open && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm">
          <div
            className={`rounded-xl shadow-xl border px-4 py-3 text-sm font-medium whitespace-pre-line ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : toast.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : toast.type === "warning"
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-green-900 to-green-800 text-white transition-all duration-300 z-50 shadow-2xl ${
          sidebarOpen ? "w-64 md:w-72" : "w-0 lg:w-20"
        } overflow-hidden lg:overflow-visible`}
      >
        <div className="p-4 md:p-6">
          <div
            className={`flex items-center ${sidebarOpen ? "justify-between mb-8 md:mb-10" : "justify-center mb-8"}`}
          >
            <div
              className={`flex items-center gap-3 ${!sidebarOpen && "justify-center lg:flex"} ${!sidebarOpen && "hidden lg:flex"}`}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg overflow-hidden bg-white p-1">
                <img
                  src="/pnhs-logo.png"
                  alt="PNHS Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-lg md:text-xl">PNHS</h1>
                  <p className="text-xs text-green-200">Teacher Portal</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg lg:hidden"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}
          </div>

          {sidebarOpen && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-4 md:mb-6">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl flex-shrink-0 overflow-hidden">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Teacher avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.fullName?.charAt(0) || "T"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm md:text-base truncate">
                  {user?.fullName || "Teacher"}
                </h3>
                <p className="text-xs text-green-200 truncate">
                  {teacherLabel}
                </p>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.key)}
                className={`w-full flex items-center ${sidebarOpen ? "justify-start gap-3 px-3 md:px-4" : "justify-center"} py-2.5 md:py-3 rounded-xl relative ${
                  activeTab === item.key
                    ? "bg-white/20"
                    : "hover:bg-white/10 text-green-100"
                } ${!sidebarOpen && "hidden lg:flex"}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm md:text-base truncate">
                    {item.label}
                  </span>
                )}
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-xs rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 md:p-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-3 md:px-4" : "justify-center"} py-2.5 md:py-3 rounded-xl hover:bg-white/10 ${!sidebarOpen && "hidden lg:flex"}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm md:text-base">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}
      >
        <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-30 border-b border-green-100">
          <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="flex-1 max-w-md md:max-w-2xl mx-2 md:mx-4">
                <div className="relative">
                  <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => handleNavigation("announcements")}
                  className="relative p-2 hover:bg-gray-100 rounded-full"
                >
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                  {announcementUnreadCount > 0 || messageUnreadCount > 0 ? (
                    <span className="absolute top-1 right-1 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></span>
                  ) : null}
                </button>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Teacher avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.fullName?.charAt(0) || "T"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-4 md:mb-6">
            <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
              <button className="hover:text-green-700">Dashboard</button>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              <span className="font-semibold text-green-700 capitalize">
                {activeTab}
              </span>
            </nav>
          </div>

          {renderContent()}
        </main>

        <footer className="px-4 md:px-6 lg:px-8 py-3 md:py-4 border-t border-green-100">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs md:text-sm text-gray-600 gap-2">
            <p className="text-center md:text-left">
              © {new Date().getFullYear()} PNHS Teacher Portal. All rights
              reserved.
            </p>
            <p className="text-center md:text-left">
              Pantabangan National High School
            </p>
          </div>
        </footer>
      </div>

      {/* Edit Grade Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-green-900">
                Edit Grade: {editingStudent?.name}
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Current Grade
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingStudent?.grade || ""}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent!,
                      grade: e.target.value,
                    })
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleUpdateStudentGrade}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm md:text-base"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm md:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-lg w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-green-900">
                Create Assignment
              </h3>
              <button
                onClick={() => {
                  setAssignmentAttachmentFile(null);
                  setShowAddAssignmentModal(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Subject"
                value={newAssignment.subject}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    subject: e.target.value,
                  })
                }
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {/* Multi-class selection with checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class(es) <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-xl max-h-40 overflow-y-auto p-2 space-y-2">
                  {myClasses.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">
                      No classes available
                    </p>
                  ) : (
                    myClasses.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newAssignment.selectedClassIds.includes(
                            c.id,
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAssignment({
                                ...newAssignment,
                                selectedClassIds: [
                                  ...newAssignment.selectedClassIds,
                                  c.id,
                                ],
                                classId: c.id, // Keep classId for backwards compatibility
                              });
                            } else {
                              const newIds =
                                newAssignment.selectedClassIds.filter(
                                  (id) => id !== c.id,
                                );
                              setNewAssignment({
                                ...newAssignment,
                                selectedClassIds: newIds,
                                classId: newIds.length > 0 ? newIds[0] : "",
                              });
                            }
                          }}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {getSimplifiedClassLabel(c)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {c.students} students
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {newAssignment.selectedClassIds.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Please select at least one class
                  </p>
                )}
              </div>
              <input
                type="text"
                placeholder="Title ng Assignment"
                value={newAssignment.title}
                onChange={(e) =>
                  setNewAssignment({ ...newAssignment, title: e.target.value })
                }
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="datetime-local"
                value={newAssignment.dueDate}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    dueDate: e.target.value,
                  })
                }
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Instructions / Description"
                value={newAssignment.description}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Points / Score"
                value={newAssignment.points}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    points: e.target.value,
                  })
                }
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachment (optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > uploadMaxBytes) {
                      showToast(
                        `File too large. Max allowed is ${uploadMaxMB}MB.`,
                        "warning",
                      );
                      e.target.value = "";
                      setAssignmentAttachmentFile(null);
                      return;
                    }
                    setAssignmentAttachmentFile(file);
                  }}
                  className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Max file size: {uploadMaxMB}MB
                </p>
                {assignmentAttachmentFile && (
                  <p className="text-xs text-gray-600 mt-2">
                    Selected: {assignmentAttachmentFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setAssignmentAttachmentFile(null);
                    setShowAddAssignmentModal(false);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAssignment}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-green-900">
                Add New Task
              </h3>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Task
                </label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={newTask.task}
                  onChange={(e) =>
                    setNewTask({ ...newTask, task: e.target.value })
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={newTask.class}
                  onChange={(e) =>
                    setNewTask({ ...newTask, class: e.target.value })
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="All Classes">All Classes</option>
                  {myClasses.map((cls) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({ ...newTask, deadline: e.target.value })
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      priority: e.target.value as "high" | "medium" | "low",
                    })
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Take Attendance Modal (Teacher) */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-green-900">
                Take Attendance
              </h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 flex-col sm:flex-row">
                <select
                  value={takeAttendanceClass}
                  onChange={(e) => {
                    prepareTakeAttendance(e.target.value);
                  }}
                  className="px-3 md:px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                >
                  {attendanceContextOptions.map((option) => {
                    const cls = myClasses.find((c) => c.id === option.id);
                    return (
                      <option key={option.id} value={option.id}>
                        {option.label}
                        {cls?.days ? ` - ${cls.days}` : ""}
                        {cls?.time ? ` - ${cls.time}` : ""}
                      </option>
                    );
                  })}
                </select>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => prepareTakeAttendance()}
                    className="px-4 py-2 rounded-xl bg-white border border-green-200 text-green-700 text-sm"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleTakeAttendance}
                    className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm"
                  >
                    Save Attendance
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  Attendance defaults to class schedule; you can edit each
                  student's status before saving.
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Student
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {takeAttendanceRows.map((r) => (
                      <tr
                        key={r.studentId}
                        className="border-t border-green-100"
                      >
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {r.name}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <select
                            value={r.status}
                            onChange={(e) =>
                              setTakeAttendanceRows((prev) =>
                                prev.map((x) =>
                                  x.studentId === r.studentId
                                    ? { ...x, status: e.target.value as any }
                                    : x,
                                ),
                              )
                            }
                            className="px-2 py-1 border rounded-lg"
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {takeAttendanceRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-3 py-4 text-sm text-gray-500 text-center"
                        >
                          No enrolled students found for the selected class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Student Modal */}
      {messageStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-green-900">
                  Message Student
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  To: {messageStudent.name}
                  {messageStudent.email ? ` (${messageStudent.email})` : ""}
                </p>
              </div>
              <button
                onClick={() => setMessageStudent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-52 overflow-y-auto">
                {getMessagesWithStudent(messageStudent.id).length === 0 ? (
                  <p className="text-xs text-gray-500">No conversation yet.</p>
                ) : (
                  <div className="space-y-2">
                    {getMessagesWithStudent(messageStudent.id)
                      .slice(0, 8)
                      .reverse()
                      .map((m) => {
                        const mine = m.fromId === user?.id;
                        return (
                          <div
                            key={m.id}
                            className={`p-2 rounded-lg text-xs ${
                              mine
                                ? "bg-green-100 text-green-900 ml-6"
                                : "bg-white text-gray-800 mr-6 border border-gray-200"
                            }`}
                          >
                            <p className="font-semibold mb-1">
                              {mine ? "You" : m.fromName}
                            </p>
                            <p className="whitespace-pre-line">{m.body}</p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={6}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base resize-none"
                  placeholder="Write your message..."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSendStudentMessage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 text-sm md:text-base disabled:opacity-60"
              >
                <Mail className="w-4 h-4" />
                Send Message
              </button>
              <button
                onClick={() => setMessageStudent(null)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment submissions modal */}
      {submissionModalAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-green-900">
                  Submitted Assignments
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {submissionModalAssignment.title}
                </p>
              </div>
              <button
                onClick={() => setSubmissionModalAssignment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="mb-4 text-sm text-gray-600">
              <span className="font-semibold text-gray-800 mr-2">Class:</span>
              {submissionModalAssignment.className ||
                submissionModalAssignment.class?.name ||
                (submissionModalAssignment.classId
                  ? classNameById[String(submissionModalAssignment.classId)]
                  : null) ||
                "N/A"}
            </div>

            <div className="space-y-3">
              {getSubmittedStudents(submissionModalAssignment).length === 0 ? (
                <div className="text-center py-8 text-gray-500 border border-dashed rounded-xl">
                  No submitted files yet
                </div>
              ) : (
                getSubmittedStudents(submissionModalAssignment).map((s) => (
                  <div
                    key={s.id}
                    className="border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {s.student?.name || "Student"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {s.submittedAt
                          ? `Submitted: ${new Date(s.submittedAt).toLocaleString("en-US")}`
                          : "Submitted"}
                      </div>
                    </div>
                    {s.filePath ? (
                      <a
                        href={s.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        View Assignment File
                      </a>
                    ) : (
                      <span className="text-xs text-gray-500">(no file)</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Attendance History Modal (Teacher view + edit) */}
      {attendanceModalStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-green-900">
                  {attendanceModalStudent?.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">Attendance History</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (attendanceModalStudent) {
                      await openStudentAttendance(
                        attendanceModalStudent.id,
                        attendanceModalStudent.name,
                      );
                    }
                  }}
                  className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                  title="Refresh attendance data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setAttendanceModalStudent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-green-600">
                  {attendanceModalStudent?.attendance}
                </div>
                <div className="text-sm text-gray-700">
                  Overall Attendance Rate
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-green-50 rounded-xl text-center border-l-4 border-green-500">
                  <div className="font-bold text-green-600 text-lg">
                    {attendanceModalStudent?.attendanceRecords.present ?? 0}
                  </div>
                  <div className="text-xs text-gray-600">Present</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl text-center border-l-4 border-yellow-500">
                  <div className="font-bold text-yellow-600 text-lg">
                    {attendanceModalStudent?.attendanceRecords.late ?? 0}
                  </div>
                  <div className="text-xs text-gray-600">Late</div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center border-l-4 border-red-500">
                  <div className="font-bold text-red-600 text-lg">
                    {attendanceModalStudent?.attendanceRecords.absent ?? 0}
                  </div>
                  <div className="text-xs text-gray-600">Absent</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Attendance Records
                  </h4>
                  <p className="text-xs text-gray-500">
                    {attendanceModalStudent?.attendanceHistory?.length ?? 0}{" "}
                    total
                  </p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(attendanceModalStudent?.attendanceHistory || []).length ===
                  0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p>No attendance records yet</p>
                    </div>
                  ) : (
                    (attendanceModalStudent?.attendanceHistory || []).map(
                      (rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                rec.status === "present"
                                  ? "bg-green-500"
                                  : rec.status === "late"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {formatAttendanceDate(rec.date)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(rec.date).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-2 flex-shrink-0"></div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Attendance History Modal */}
      {showAttendanceHistoryModal && (
        <AttendanceHistoryModal
          isOpen={showAttendanceHistoryModal}
          onClose={() => setShowAttendanceHistoryModal(false)}
          classId={selectedClassForHistory}
          className={
            myClasses.find((c) => c.id === selectedClassForHistory)?.name ||
            "Class"
          }
          studentRecords={studentRecords}
          showToast={showToast}
          refreshData={loadStudentsFromApi}
        />
      )}
    </div>
  );
}
