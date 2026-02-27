"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Award,
  FileText,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Bell,
  TrendingUp,
  Clock,
  User as UserIcon,
  Download,
  Upload,
  ChevronRight,
  Home,
  RefreshCw,
  Search,
  Mail,
  Eye,
  Plus,
  Check,
  Filter,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  PieChart,
  BarChart3,
  Trash2,
  Users,
  Send,
} from "lucide-react";
import {
  getUserFromStorage,
  removeUserFromStorage,
  saveUserToStorage,
  type User,
} from "@/lib/auth";
import { upload } from "@vercel/blob/client";
import { type Announcement, type Grade, type Class } from "@/lib/shared-data";

interface Subject {
  id: string;
  name: string;
  grade: string;
  teacher: string;
  status: "excellent" | "good" | "average";
  attendance: string;
  attendanceRecords: {
    present: number;
    late: number;
    absent: number;
    total: number;
  };
  assignments: { completed: number; total: number };
  attendanceHistory: {
    date: string;
    status: "present" | "late" | "absent";
  }[];
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  className?: string | null;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  grade?: string;
  points?: string | null;
  description?: string;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  filePath?: string | null;
  submittedAt?: string | null;
}

interface TeacherContact {
  id: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  classNames: string[];
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

export default function StudentDashboard() {
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
    const v = (raw || "").trim().toLowerCase();
    if (v === "0" || v === "unlimited" || v === "infinite" || v === "inf") {
      return 0;
    }
    const parsed = raw ? Number(raw) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 50;
  })();
  const uploadMaxBytes =
    uploadMaxMB === 0 ? Number.POSITIVE_INFINITY : uploadMaxMB * 1024 * 1024;

  const safeFileName = (name: string) => {
    const raw = String(name || "file");
    const base = raw.split(/[\\/]/).pop() || "file";
    const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");
    return cleaned.slice(0, 120) || "file";
  };

  const uploadToBlobIfPossible = async (file: File, pathname: string) => {
    return upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/blob",
    });
  };
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "submitted" | "graded"
  >("all");
  const [showAssignmentModal, setShowAssignmentModal] =
    useState<Assignment | null>(null);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] =
    useState<Subject | null>(null);
  const [teachers, setTeachers] = useState<TeacherContact[]>([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [messageTeacher, setMessageTeacher] = useState<TeacherContact | null>(
    null,
  );
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);
  const didInitUnreadRef = useRef(false);
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
      const raw = localStorage.getItem(`student_messages_seen_${userId}`);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(ids);
    } catch {
      return new Set<string>();
    }
  };

  const markTeacherMessagesAsSeen = (teacherId: string) => {
    if (!user?.id) return;
    try {
      const seen = getSeenMessageIds(user.id);
      messages.forEach((m) => {
        if (m.toId === user.id && m.fromId === teacherId) {
          seen.add(m.id);
        }
      });
      localStorage.setItem(
        `student_messages_seen_${user.id}`,
        JSON.stringify(Array.from(seen)),
      );
    } catch {
      // ignore storage failures
    }
    loadMyMessages(user.id);
  };

  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: "1",
      name: "Mathematics",
      grade: "92",
      teacher: "Ms. Santos",
      status: "excellent",
      attendance: "95%",
      attendanceRecords: { present: 19, late: 1, absent: 0, total: 20 },
      assignments: { completed: 12, total: 15 },
      attendanceHistory: [
        { date: "2026-01-15", status: "present" },
        { date: "2026-01-16", status: "present" },
        { date: "2026-01-17", status: "late" },
        { date: "2026-01-18", status: "present" },
        { date: "2026-01-19", status: "present" },
      ],
    },
    {
      id: "2",
      name: "Science",
      grade: "88",
      teacher: "Mr. Cruz",
      status: "good",
      attendance: "92%",
      attendanceRecords: { present: 18, late: 2, absent: 0, total: 20 },
      assignments: { completed: 10, total: 12 },
      attendanceHistory: [
        { date: "2026-01-15", status: "present" },
        { date: "2026-01-16", status: "present" },
        { date: "2026-01-17", status: "present" },
        { date: "2026-01-18", status: "late" },
        { date: "2026-01-19", status: "present" },
      ],
    },
    {
      id: "3",
      name: "English",
      grade: "90",
      teacher: "Ms. Garcia",
      status: "excellent",
      attendance: "97%",
      attendanceRecords: { present: 20, late: 0, absent: 0, total: 20 },
      assignments: { completed: 14, total: 15 },
      attendanceHistory: [
        { date: "2026-01-15", status: "present" },
        { date: "2026-01-16", status: "present" },
        { date: "2026-01-17", status: "present" },
        { date: "2026-01-18", status: "present" },
        { date: "2026-01-19", status: "present" },
      ],
    },
    {
      id: "4",
      name: "Filipino",
      grade: "85",
      teacher: "Mr. Reyes",
      status: "good",
      attendance: "90%",
      attendanceRecords: { present: 18, late: 1, absent: 1, total: 20 },
      assignments: { completed: 11, total: 13 },
      attendanceHistory: [
        { date: "2026-01-15", status: "present" },
        { date: "2026-01-16", status: "present" },
        { date: "2026-01-17", status: "absent" },
        { date: "2026-01-18", status: "present" },
        { date: "2026-01-19", status: "late" },
      ],
    },
    {
      id: "5",
      name: "History",
      grade: "94",
      teacher: "Ms. Torres",
      status: "excellent",
      attendance: "98%",
      attendanceRecords: { present: 20, late: 0, absent: 0, total: 20 },
      assignments: { completed: 13, total: 14 },
      attendanceHistory: [
        { date: "2026-01-15", status: "present" },
        { date: "2026-01-16", status: "present" },
        { date: "2026-01-17", status: "present" },
        { date: "2026-01-18", status: "present" },
        { date: "2026-01-19", status: "present" },
      ],
    },
  ]);

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementUnreadCount, setAnnouncementUnreadCount] = useState(0);
  const [refreshingAnnouncements, setRefreshingAnnouncements] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");

  const [classSchedule, setClassSchedule] = useState<
    {
      subject: string;
      time: string;
      room: string;
      teacher: string;
      gradeLevel: string;
      section: string;
      strand: string;
    }[]
  >([]);

  const loadStudentProfile = async (studentId: string) => {
    try {
      const res = await fetch("/api/students", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      const mine = Array.isArray(data)
        ? data.find((s: any) => s?.id === studentId) || null
        : data;
      if (!mine) return null;
      let primaryClass: any = null;
      try {
        const enrollmentRes = await fetch("/api/enrollments", {
          credentials: "include",
        });
        if (enrollmentRes.ok) {
          const enrollments = await enrollmentRes.json();
          const mineEnrollments = Array.isArray(enrollments)
            ? enrollments.filter((e: any) => e?.studentId === studentId)
            : [];
          primaryClass = mineEnrollments[0]?.class || null;
        }
      } catch {
        // noop: fallback to student fields only
      }

      const sectionRaw =
        typeof mine.section === "string" ? mine.section.trim() : "";
      const normalizedSection =
        sectionRaw && /^[A-Z]$/i.test(sectionRaw)
          ? `Section ${sectionRaw.toUpperCase()}`
          : sectionRaw;
      const resolvedGrade =
        (primaryClass?.gradeLevel && String(primaryClass.gradeLevel).trim()) ||
        mine.gradeLevel ||
        "";
      const resolvedSection =
        normalizedSection ||
        (() => {
          const classSection = primaryClass?.section
            ? String(primaryClass.section).trim()
            : "";
          if (!classSection) return "";
          return /^[A-Z]$/i.test(classSection)
            ? `Section ${classSection.toUpperCase()}`
            : classSection;
        })() ||
        "";
      const resolvedStrand =
        (mine.strand && String(mine.strand).trim()) ||
        (primaryClass?.strand && String(primaryClass.strand).trim()) ||
        "";

      return {
        studentId: mine.studentId || "",
        gradeLevel: resolvedGrade,
        section: resolvedSection,
        strand: resolvedStrand,
      };
    } catch (e) {
      console.error("Error loading student profile:", e);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const sessionUser: User | null = data?.user || null;
          if (!sessionUser || sessionUser.role !== "student") {
            removeUserFromStorage();
            router.push("/login");
            return;
          }
          const profile = await loadStudentProfile(sessionUser.id);
          const mergedUser = { ...sessionUser, ...(profile || {}) };
          setUser(mergedUser);
          saveUserToStorage(mergedUser);

          // Load enrollments first so "Enrolled Subjects" is authoritative
          await loadEnrollments(sessionUser.id);

          // Then load grades/attendance/assignments in parallel
          await Promise.all([
            loadAnnouncements(),
            loadClasses(),
            loadTeachers(),
            loadGrades(sessionUser.id),
            loadAttendance(sessionUser.id),
            loadAssignments(sessionUser.id),
          ]);
          return;
        }

        if (res.status === 401 || res.status === 403) {
          removeUserFromStorage();
          router.push("/login");
          return;
        }

        // fallback to localStorage so a refresh doesn't immediately redirect
        const localUser = getUserFromStorage();
        if (localUser && localUser.role === "student") {
          const profile = await loadStudentProfile(localUser.id || "");
          const mergedUser = { ...localUser, ...(profile || {}) };
          setUser(mergedUser);
          saveUserToStorage(mergedUser);
          await loadEnrollments(localUser.id || "");
          await Promise.all([
            loadAnnouncements(),
            loadClasses(),
            loadTeachers(),
            loadGrades(localUser.id || ""),
            loadAttendance(localUser.id || ""),
            loadAssignments(localUser.id || ""),
          ]);
          return;
        }

        throw new Error("Failed to check session");
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        removeUserFromStorage();
        router.push("/login");
        return;
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

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
    if (!toast.open) return;
    const t = setTimeout(
      () => setToast((prev) => ({ ...prev, open: false })),
      2800,
    );
    return () => clearTimeout(t);
  }, [toast.open]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    const key = `student_profile_photo_${user.id}`;
    try {
      setProfilePhoto(localStorage.getItem(key) || "");
    } catch {
      setProfilePhoto("");
    }
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
    if (typeof window === "undefined" || !user?.id) return;
    loadMyMessages(user.id);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pnhs_in_app_messages") loadMyMessages(user.id);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    const key = `student_announcements_seen_${user.id}`;
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
    const key = `student_announcements_seen_${user.id}`;
    try {
      const ids = announcements.map((a: any) => String(a.id));
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {
      // ignore storage failures
    }
    setAnnouncementUnreadCount(0);
  }, [activeTab, announcements, user?.id]);

  const loadAnnouncements = async (showFeedback = false) => {
    if (showFeedback) setRefreshingAnnouncements(true);
    try {
      const res = await fetch("/api/announcements", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setAnnouncements([]);
        return;
      }
      const allAnnouncements: Announcement[] = await res.json();
      setAnnouncements(allAnnouncements);
      if (showFeedback) {
        showToast("Announcements refreshed", "success");
      }
    } catch (error) {
      console.error("Error loading announcements:", error);
      setAnnouncements([]);
      if (showFeedback) {
        showToast("Failed to refresh announcements", "error");
      }
    } finally {
      if (showFeedback) setRefreshingAnnouncements(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const [enrollmentsRes, teachersRes] = await Promise.all([
        fetch("/api/enrollments", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/teachers", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      if (!enrollmentsRes.ok || !teachersRes.ok) {
        setTeachers([]);
        return;
      }

      const enrollments = await enrollmentsRes.json();
      const teachersRaw = await teachersRes.json();
      const teachersDirectory = Array.isArray(teachersRaw) ? teachersRaw : [];

      const byKey = new Map<string, TeacherContact>();
      for (const enrollment of Array.isArray(enrollments) ? enrollments : []) {
        const cls = enrollment?.class;
        if (!cls) continue;
        const teacherName = String(cls.teacher || "").trim();
        const teacherId = String(cls.teacherId || "").trim();
        const className = String(cls.name || "").trim();
        const key = teacherId || `name:${teacherName.toLowerCase()}`;
        if (!teacherName) continue;

        if (!byKey.has(key)) {
          byKey.set(key, {
            id: teacherId || key,
            name: teacherName,
            email: "",
            department: "",
            subjects: [],
            classNames: [],
          });
        }
        const item = byKey.get(key)!;
        if (className && !item.classNames.includes(className)) {
          item.classNames.push(className);
        }
      }

      for (const t of teachersDirectory) {
        const idKey = String(t?.id || "").trim();
        const nameKey = `name:${String(t?.name || "")
          .trim()
          .toLowerCase()}`;
        const target = byKey.get(idKey) || byKey.get(nameKey);
        if (!target) continue;
        target.id = idKey || target.id;
        target.name = String(t?.name || target.name);
        target.email = String(t?.email || "");
        target.department = String(t?.department || "");
        target.subjects = Array.isArray(t?.subjects)
          ? t.subjects.filter(Boolean).map((s: any) => String(s))
          : [];
      }

      setTeachers(
        Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (error) {
      console.error("Error loading teachers:", error);
      setTeachers([]);
    }
  };

  // Load subjects from enrollments (authoritative source for "Enrolled Subjects")
  const loadEnrollments = async (studentId: string) => {
    try {
      const res = await fetch("/api/enrollments", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setSubjects([]);
        return;
      }
      const all = await res.json();
      const mine = all.filter((e: any) => e.studentId === studentId);
      const primaryEnrollment = mine[0];
      const primaryClass = primaryEnrollment?.class || {};
      setUser((prev) => {
        if (!prev) return prev;
        const nextGrade =
          (prev.gradeLevel && String(prev.gradeLevel).trim()) ||
          (primaryClass.gradeLevel && String(primaryClass.gradeLevel).trim()) ||
          "";
        const sectionRaw =
          (prev.section && String(prev.section).trim()) ||
          (primaryClass.section && String(primaryClass.section).trim()) ||
          "";
        const nextSection =
          sectionRaw && /^[A-Z]$/i.test(sectionRaw)
            ? `Section ${sectionRaw.toUpperCase()}`
            : sectionRaw;
        const nextStrand =
          (prev.strand && String(prev.strand).trim()) ||
          (primaryClass.strand && String(primaryClass.strand).trim()) ||
          ((nextGrade === "Grade 11" || nextGrade === "Grade 12") &&
          sectionRaw &&
          /^[A-Z]{2,5}$/i.test(sectionRaw)
            ? sectionRaw.toUpperCase()
            : "") ||
          "";
        return {
          ...prev,
          gradeLevel: nextGrade,
          section: nextSection,
          strand: nextStrand,
        };
      });
      const mapped = mine.map((e: any) => {
        const cls = e.class || (e as any).class || {};
        return {
          id: cls.id || e.classId || String(Math.random()),
          name: cls.subject || cls.name || `Subject ${e.id}`,
          grade: "0",
          teacher: cls.teacher || "",
          status: "average" as const,
          attendance: "N/A",
          attendanceRecords: { present: 0, late: 0, absent: 0, total: 0 },
          assignments: { completed: 0, total: 0 },
          attendanceHistory: [],
        };
      });
      setSubjects(mapped);
    } catch (error) {
      console.error("Error loading enrollments:", error);
      setSubjects([]);
    }
  };

  const loadGrades = async (studentId: string) => {
    try {
      const res = await fetch("/api/grades", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) return;
      const all = await res.json();
      const mine = all.filter((g: any) => g.studentId === studentId);

      // Merge grade records into currently-loaded enrolled subjects.
      // If a grade exists for a subject not in `subjects` (rare), add it.
      setSubjects((prev) => {
        const copy = [...prev];
        for (const g of mine) {
          const subjectId = g.subjectId || g.id || String(Math.random());
          const idx = copy.findIndex(
            (s) => s.id === subjectId || s.name === g.subjectId,
          );
          const gradeStr = String(g.grade ?? "0");
          const status =
            Number(gradeStr) >= 90
              ? ("excellent" as const)
              : Number(gradeStr) >= 80
                ? ("good" as const)
                : ("average" as const);
          if (idx !== -1) {
            copy[idx] = { ...copy[idx], grade: gradeStr, status };
          } else {
            copy.push({
              id: subjectId,
              name: g.subjectId || `Subject ${copy.length + 1}`,
              grade: gradeStr,
              teacher: "",
              status,
              attendance: "N/A",
              attendanceRecords: { present: 0, late: 0, absent: 0, total: 0 },
              assignments: { completed: 0, total: 0 },
              attendanceHistory: [],
            });
          }
        }
        return copy;
      });
    } catch (e) {
      console.error("Error loading grades:", e);
    }
  };

  const loadAttendance = async (studentId: string) => {
    try {
      const res = await fetch("/api/attendance", { credentials: "include" });
      if (!res.ok) return;
      const all = await res.json();
      const mine = all.filter((a: any) => a.studentId === studentId);
      // Aggregate attendance per classId
      const grouped: Record<
        string,
        { present: number; late: number; absent: number; total: number }
      > = {};
      for (const r of mine) {
        const key = r.classId || "unknown";
        grouped[key] = grouped[key] || {
          present: 0,
          late: 0,
          absent: 0,
          total: 0,
        };
        grouped[key].total += 1;
        if (r.status === "present") grouped[key].present += 1;
        else if (r.status === "late") grouped[key].late += 1;
        else grouped[key].absent += 1;
      }
      // If subjects were populated from grades, attach attendance counts when classId matches subject id
      setSubjects((prev) =>
        prev.map((s) => {
          const stats = grouped[s.id];
          if (!stats) return s;
          return {
            ...s,
            attendanceRecords: stats,
            attendance:
              stats.total > 0
                ? `${Math.round(((stats.present + stats.late * 0.5) / stats.total) * 100)}%`
                : s.attendance,
          };
        }),
      );
    } catch (e) {
      console.error("Error loading attendance:", e);
    }
  };

  // Open the attendance modal for a specific subject and load day-by-day rows from the API
  const openAttendanceModal = async (subject: Subject) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/attendance?studentId=${user.id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        // show modal with empty data
        setShowAttendanceModal({
          ...subject,
          attendance: "0%",
          attendanceRecords: { present: 0, late: 0, absent: 0, total: 0 },
          attendanceHistory: [],
        });
        return;
      }
      const allRows = await res.json();
      const rows = allRows.filter((r: any) => r.classId === subject.id);
      let present = 0,
        late = 0,
        absent = 0,
        total = 0;
      const attendanceHistory = rows.map((r: any) => {
        total += 1;
        if (r.status === "present") present += 1;
        else if (r.status === "late") late += 1;
        else absent += 1;
        return { date: r.date, status: r.status };
      });
      const percent = total
        ? `${Math.round(((present + late * 0.5) / total) * 100)}%`
        : "0%";
      setShowAttendanceModal({
        ...subject,
        attendanceRecords: { present, late, absent, total },
        attendance: percent,
        attendanceHistory,
      });
    } catch (e) {
      console.error("Failed to load attendance for subject", e);
      setShowAttendanceModal({
        ...subject,
        attendance: "0%",
        attendanceRecords: { present: 0, late: 0, absent: 0, total: 0 },
        attendanceHistory: [],
      });
    }
  };

  const loadClasses = async () => {
    try {
      // API automatically filters classes by student enrollment
      // Only shows classes where student is enrolled (matches grade/section/strand)
      const res = await fetch("/api/classes", { credentials: "include" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setClassSchedule([]);
        return;
      }
      const classes: Class[] = await res.json();
      const mapped = classes.map((c) => ({
        subject: (c as any).subject || c.name,
        time: (c as any).time || "",
        room: c.room || "",
        teacher: c.teacher || "",
        gradeLevel: c.gradeLevel || "",
        section: c.section || "",
        strand: c.strand || "",
      }));
      setClassSchedule(mapped);
    } catch (error) {
      console.error("Error loading classes:", error);
      setClassSchedule([]);
    }
  };

  const loadAssignments = async (studentId: string) => {
    try {
      // API automatically filters assignments by student enrollment
      // Only shows assignments for classes where student is enrolled
      const res = await fetch("/api/assignments", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setAssignments([]);
        return;
      }
      const all = await res.json();
      const mine = Array.isArray(all)
        ? all.filter((a: any) => !a.studentId || a.studentId === studentId)
        : [];
      setAssignments(mine);
    } catch (error) {
      console.error("Error loading assignments:", error);
      setAssignments([]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
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
        localStorage.setItem(`student_profile_photo_${user.id}`, value);
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
      localStorage.removeItem(`student_profile_photo_${user.id}`);
    } catch {
      // ignore storage errors
    }
    showToast("Profile photo removed.", "info");
  };

  const openTeacherMessage = (teacher: TeacherContact) => {
    setMessageTeacher(teacher);
    setMessageSubject(`Inquiry from ${user?.fullName || "Student"}`);
    setMessageBody(
      `Hello ${teacher.name},\n\nI would like to ask about your class.\n\nThank you,\n${user?.fullName || "Student"}`,
    );
    markTeacherMessagesAsSeen(teacher.id);
  };

  const handleSendTeacherMessage = () => {
    if (!messageTeacher || !user?.id) return;
    const subject = messageSubject.trim() || "Student inquiry";
    const body = messageBody.trim() || "Hello teacher,";
    const payload: DashboardMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fromId: user.id,
      fromRole: "student",
      fromName: user.fullName || "Student",
      toId: messageTeacher.id,
      toRole: "teacher",
      toName: messageTeacher.name,
      toEmail: messageTeacher.email || "",
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
    setMessageTeacher(null);
  };

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);

    // Isara lang ang sidebar kung mobile screen (< 1024px)
    // Sa desktop/laptop, huwag isara
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };
  const handleSubmitAssignment = async (assignmentId: string) => {
    try {
      if (!user || user.role !== "student") {
        showToast("Session is not a student account. Please log in again.", "error");
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch {
          // ignore
        }
        removeUserFromStorage();
        router.push("/login");
        return;
      }
      if (!assignmentFile) {
        showToast(
          "Please attach a file (PDF, DOC, image, etc.) before submitting.",
          "warning",
        );
        return;
      }
      setSubmittingAssignment(true);
      const cleanedName = safeFileName(assignmentFile.name);
      const pathname = `submissions/${user?.id || "student"}/${assignmentId}/${Date.now()}_${cleanedName}`;

      try {
        const blob = await uploadToBlobIfPossible(assignmentFile, pathname);
        const completeRes = await fetch("/api/submissions/complete", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId, filePath: blob.url }),
        });
        if (!completeRes.ok) {
          const body = await completeRes.json().catch(() => ({}));
          showToast(
            body.message ||
              `Failed to submit assignment (HTTP ${completeRes.status})`,
            "error",
          );
          return;
        }
      } catch (e) {
        // Fallback: legacy server upload (works for local dev / small files)
        const formData = new FormData();
        formData.append("assignmentId", assignmentId);
        formData.append("file", assignmentFile);
        const res = await fetch("/api/submissions/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (res.status === 403) {
            showToast(
              body.message ||
                "Your session does not have student permissions. Please log in again.",
              "error",
            );
            try {
              await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
              });
            } catch {
              // ignore
            }
            removeUserFromStorage();
            router.push("/login");
            return;
          }
          showToast(
            body.message || `Failed to submit assignment (HTTP ${res.status})`,
            "error",
          );
          return;
        }
      }

      if (user) {
        await loadAssignments(user.id);
      }
      setAssignmentFile(null);
      setShowAssignmentModal(null);
      showToast("Assignment submitted successfully!", "success");
    } catch (error) {
      showToast(`Error submitting assignment: ${getErrorMessage(error)}`, "error");
      console.error(error);
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleDeleteSubmittedFile = async (assignmentId: string) => {
    if (!requestConfirm("submission", assignmentId)) return;
    try {
      const res = await fetch(
        `/api/submissions/upload?assignmentId=${encodeURIComponent(assignmentId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showToast(body.message || "Failed to delete submission", "error");
        return;
      }
      if (user) {
        await loadAssignments(user.id);
      }
      setAssignmentFile(null);
      setShowAssignmentModal(null);
      showToast("Submitted file deleted.", "success");
    } catch (error) {
      console.error(error);
      showToast("Error deleting submission", "error");
    }
  };

  const calculateGPA = () => {
    if (subjects.length === 0) return "0.0";
    const total = subjects.reduce(
      (sum, subject) => sum + parseFloat(subject.grade),
      0,
    );
    return (total / subjects.length).toFixed(1);
  };

  const calculateAttendance = () => {
    const attendances = subjects
      .map((s) => parseFloat(String(s.attendance || "").replace("%", "")))
      .filter((v) => Number.isFinite(v));
    if (attendances.length === 0) return "0%";
    const total = attendances.reduce((sum, att) => sum + att, 0);
    return `${(total / attendances.length).toFixed(0)}%`;
  };

  const calculateAttendanceStats = () => {
    const totalPresent = subjects.reduce(
      (sum, s) => sum + s.attendanceRecords.present,
      0,
    );
    const totalLate = subjects.reduce(
      (sum, s) => sum + s.attendanceRecords.late,
      0,
    );
    const totalAbsent = subjects.reduce(
      (sum, s) => sum + s.attendanceRecords.absent,
      0,
    );
    const totalClasses = subjects.reduce(
      (sum, s) => sum + s.attendanceRecords.total,
      0,
    );

    const attendanceRate =
      totalClasses > 0
        ? ((totalPresent + totalLate * 0.5) / totalClasses) * 100
        : 0;

    return {
      present: totalPresent,
      late: totalLate,
      absent: totalAbsent,
      total: totalClasses,
      rate: attendanceRate.toFixed(1),
    };
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (filterStatus === "all") return true;
    return assignment.status === filterStatus;
  });

  const groupedAssignmentSections =
    filterStatus === "all"
      ? [
          {
            key: "pending",
            label: "Pending Assignments",
            items: filteredAssignments.filter((a) => a.status === "pending"),
          },
          {
            key: "submitted",
            label: "Submitted Assignments",
            items: filteredAssignments.filter((a) => a.status === "submitted"),
          },
          {
            key: "graded",
            label: "Graded Assignments",
            items: filteredAssignments.filter((a) => a.status === "graded"),
          },
        ]
      : [
          {
            key: filterStatus,
            label:
              filterStatus === "pending"
                ? "Pending Assignments"
                : filterStatus === "submitted"
                  ? "Submitted Assignments"
                  : "Graded Assignments",
            items: filteredAssignments,
          },
        ];

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (!searchTerm) return true;
    return (
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredTeachers = teachers.filter((teacher) => {
    if (!teacherSearchTerm) return true;
    const term = teacherSearchTerm.toLowerCase();
    return (
      teacher.name.toLowerCase().includes(term) ||
      teacher.email.toLowerCase().includes(term) ||
      teacher.department.toLowerCase().includes(term) ||
      teacher.subjects.some((s) => s.toLowerCase().includes(term)) ||
      teacher.classNames.some((c) => c.toLowerCase().includes(term))
    );
  });

  const getMessagesWithTeacher = (teacherId: string) =>
    messages.filter(
      (m) =>
        (m.fromId === user?.id && m.toId === teacherId) ||
        (m.fromId === teacherId && m.toId === user?.id),
    );

  const getLatestTeacherMessage = (teacherId: string) =>
    getMessagesWithTeacher(teacherId)[0] || null;

  const getTeacherUnreadCount = (teacherId: string) => {
    if (!user?.id) return 0;
    const seen = getSeenMessageIds(user.id);
    return messages.filter(
      (m) => m.toId === user.id && m.fromId === teacherId && !seen.has(m.id),
    ).length;
  };

  const attendanceStats = calculateAttendanceStats();

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
          Loading Student Dashboard...
        </p>
        <p className="text-gray-600 mt-2 text-sm md:text-base text-center">
          Please wait a moment
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "Overall GPA",
      value: calculateGPA(),
      icon: Award,
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      change: "↑ 0.2 from last quarter",
    },
    {
      label: "Attendance Rate",
      value: `${attendanceStats.rate}%`,
      icon: TrendingUp,
      color: "bg-gradient-to-br from-green-600 to-green-700",
      change:
        parseFloat(attendanceStats.rate) >= 95
          ? "Excellent"
          : parseFloat(attendanceStats.rate) >= 90
            ? "Good"
            : "Needs improvement",
      trend:
        parseFloat(attendanceStats.rate) >= 95
          ? ("up" as const)
          : parseFloat(attendanceStats.rate) >= 85
            ? ("neutral" as const)
            : ("down" as const),
    },
    {
      label: "Enrolled Subjects",
      value: subjects.length.toString(),
      icon: BookOpen,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      change: "Active this semester",
    },
    {
      label: "Pending Tasks",
      value: assignments
        .filter((a) => a.status === "pending")
        .length.toString(),
      icon: FileText,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      change: "Due this week",
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
    { icon: Award, label: "My Grades", key: "grades" },
    { icon: Calendar, label: "Schedule", key: "schedule" },
    { icon: FileText, label: "Assignments", key: "assignments" },
    { icon: PieChart, label: "Attendance", key: "attendance" },
    {
      icon: Users,
      label: "Teachers",
      key: "teachers",
      badge: messageUnreadCount,
    },
    { icon: UserIcon, label: "Profile", key: "profile" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "announcements":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                  School Announcements
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Stay updated with school news and announcements
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => void loadAnnouncements(true)}
                  disabled={refreshingAnnouncements}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all text-sm md:text-base"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshingAnnouncements ? "animate-spin" : ""}`}
                  />
                  {refreshingAnnouncements ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="relative mb-4 md:mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredAnnouncements.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-8 md:p-12 border border-green-100 text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-green-100 to-yellow-100 rounded-full flex items-center justify-center">
                  <Bell className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-700 mb-2 md:mb-3">
                  {searchTerm
                    ? "No Announcements Found"
                    : "No Announcements Yet"}
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
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
                          <div className="flex items-center gap-2 text-gray-600">
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
                                month: "short",
                                day: "numeric",
                                year: "numeric",
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

      case "grades":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                  My Grades
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  View your academic performance
                </p>
              </div>
              <button
                onClick={() => {
                  const data = {
                    student: user?.fullName || "Student",
                    gpa: calculateGPA(),
                    attendance: calculateAttendance(),
                    subjects: subjects,
                    date: new Date().toISOString(),
                  };
                  const json = JSON.stringify(data, null, 2);
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `grades-report-${(user?.fullName || "Student").replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
                  a.click();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 text-sm md:text-base"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
                Download Report
              </button>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100 mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
                Academic Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center p-3 md:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                  <div className="text-3xl md:text-4xl font-bold text-yellow-600">
                    {calculateGPA()}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">
                    Current GPA
                  </div>
                </div>
                <div className="text-center p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-3xl md:text-4xl font-bold text-green-600">
                    {calculateAttendance()}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">
                    Attendance Rate
                  </div>
                </div>
                <div className="text-center p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600">
                    {subjects.length}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">
                    Enrolled Subjects
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg border border-green-100 overflow-hidden">
              {subjects.length === 0 ? (
                <div className="bg-blue-50 rounded-2xl p-8 text-center border-2 border-dashed border-blue-300">
                  <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No enrolled subjects yet
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Grades and course data will appear here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                          Subject
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                          Attendance Rate
                        </th>
                        <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject) => (
                        <tr
                          key={subject.id}
                          className="border-t border-green-100 hover:bg-green-50"
                        >
                          <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-900">
                            <div className="font-semibold">{subject.name}</div>
                            <div className="text-xs text-gray-500">
                              {subject.teacher || "Teacher not set"}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-700">
                            {subject.attendance || "N/A"}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 text-sm font-bold text-green-700">
                            {subject.grade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case "schedule":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                My Schedule
              </h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                View your class schedule
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
                <h3 className="text-base md:text-lg font-bold text-gray-900">
                  Today's Classes
                </h3>
                <span className="px-3 md:px-4 py-2 bg-gradient-to-r from-green-100 to-yellow-100 text-green-700 rounded-full text-xs md:text-sm font-semibold">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="space-y-3 md:space-y-4">
                {classSchedule.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 md:p-5 border border-gray-200 rounded-xl md:rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-600 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-base md:text-lg truncate">
                          {item.subject}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          {item.teacher}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span>{item.time}</span>
                          </div>
                          <span className="text-xs md:text-sm text-gray-600">
                            {item.room}
                          </span>
                          <span className="text-xs md:text-sm text-gray-600">
                            {item.gradeLevel} • {item.section}
                            {item.strand ? ` • ${item.strand}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "assignments":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                  My Assignments
                </h2>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Track your assignments and submissions
                </p>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none pr-8 md:pr-10 text-sm md:text-base"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded</option>
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl md:rounded-2xl p-4 md:p-6 border border-orange-200">
                <div className="text-3xl md:text-4xl font-bold text-orange-600">
                  {assignments.filter((a) => a.status === "pending").length}
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-2 font-semibold">
                  Pending
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl md:rounded-2xl p-4 md:p-6 border border-blue-200">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">
                  {assignments.filter((a) => a.status === "submitted").length}
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-2 font-semibold">
                  Submitted
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl md:rounded-2xl p-4 md:p-6 border border-green-200">
                <div className="text-3xl md:text-4xl font-bold text-green-600">
                  {assignments.filter((a) => a.status === "graded").length}
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-2 font-semibold">
                  Graded
                </div>
              </div>
            </div>

            <div className="space-y-5 md:space-y-6">
              {filteredAssignments.length === 0 ? (
                <div className="bg-orange-50 rounded-2xl p-8 text-center border-2 border-dashed border-orange-300">
                  <FileText className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No assignments</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your assignments will appear here
                  </p>
                </div>
              ) : (
                groupedAssignmentSections.map((section) =>
                  section.items.length === 0 ? null : (
                    <div key={section.key} className="space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm md:text-base font-semibold text-gray-700">
                          {section.label}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {section.items.length}
                        </span>
                      </div>
                      {section.items.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100 hover:border-green-300 transition-all cursor-pointer"
                          onClick={() => {
                            setAssignmentFile(null);
                            setShowAssignmentModal(assignment);
                          }}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-3">
                            <div className="flex-1 w-full sm:w-auto">
                              <h3 className="text-base md:text-lg font-bold text-gray-900">
                                {assignment.title}
                              </h3>
                              <p className="text-xs md:text-sm text-gray-600 mt-1">
                                {assignment.subject}
                              </p>
                              {assignment.className && (
                                <p className="text-xs md:text-sm text-gray-500">
                                  Class: {assignment.className}
                                </p>
                              )}
                              <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                                {assignment.description ||
                                  "No instructions provided by teacher."}
                              </p>
                            </div>
                            <span
                              className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
                                assignment.status === "pending"
                                  ? "bg-orange-100 text-orange-700"
                                  : assignment.status === "submitted"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {assignment.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 md:pt-4 border-t border-gray-100 gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>
                                  Due:{" "}
                                  {new Date(
                                    assignment.dueDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              {assignment.attachmentPath && (
                                <a
                                  href={assignment.attachmentPath}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-2 text-xs md:text-sm text-green-700 hover:text-green-800 underline"
                                >
                                  <Download className="w-4 h-4" />
                                  {assignment.attachmentName ||
                                    "Download attachment"}
                                </a>
                              )}
                              {assignment.points && (
                                <div className="text-xs md:text-sm text-gray-600">
                                  Points: {assignment.points}
                                </div>
                              )}
                            </div>

                            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                              {assignment.status === "pending" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAssignmentFile(null);
                                    setShowAssignmentModal(assignment);
                                  }}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 text-sm"
                                >
                                  <Upload className="w-4 h-4" />
                                  Submit File
                                </button>
                              )}
                              {assignment.status === "submitted" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDeleteSubmittedFile(
                                      assignment.id,
                                    );
                                  }}
                                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete File
                                </button>
                              )}
                            </div>

                            {assignment.status === "graded" &&
                              assignment.grade && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs md:text-sm text-gray-600">
                                    Grade:
                                  </span>
                                  <span className="text-lg md:text-xl font-bold text-green-600">
                                    {assignment.grade}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        );

      case "attendance":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                Attendance Overview
              </h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Track your attendance across all subjects
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs md:text-sm opacity-90">
                    Attendance Rate
                  </div>
                  <TrendingUpIcon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="text-2xl md:text-4xl font-bold">
                  {attendanceStats.rate}%
                </div>
                <div className="text-xs md:text-sm mt-2 opacity-90">
                  {parseFloat(attendanceStats.rate) >= 95
                    ? "Excellent Attendance"
                    : parseFloat(attendanceStats.rate) >= 90
                      ? "Good Attendance"
                      : "Needs Improvement"}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs md:text-sm opacity-90">Present</div>
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="text-2xl md:text-4xl font-bold">
                  {attendanceStats.present}
                </div>
                <div className="text-xs md:text-sm mt-2 opacity-90">
                  Classes attended
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs md:text-sm opacity-90">Late</div>
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="text-2xl md:text-4xl font-bold">
                  {attendanceStats.late}
                </div>
                <div className="text-xs md:text-sm mt-2 opacity-90">
                  Late arrivals
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs md:text-sm opacity-90">Absent</div>
                  <XCircle className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="text-2xl md:text-4xl font-bold">
                  {attendanceStats.absent}
                </div>
                <div className="text-xs md:text-sm mt-2 opacity-90">
                  Missed classes
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">
                Attendance by Subject
              </h3>
              <div className="space-y-3 md:space-y-4">
                {subjects.map((subject) => {
                  const attendancePercentage = parseFloat(
                    subject.attendance.replace("%", ""),
                  );
                  return (
                    <div
                      key={subject.id}
                      className="p-3 md:p-4 border border-gray-200 rounded-xl md:rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer"
                      onClick={() => openAttendanceModal(subject)}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 md:mb-3 gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm md:text-base">
                            {subject.name}
                          </h4>
                          <p className="text-xs md:text-sm text-gray-600">
                            {subject.teacher}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <div
                            className={`text-xl md:text-2xl font-bold ${
                              attendancePercentage >= 95
                                ? "text-green-600"
                                : attendancePercentage >= 90
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {subject.attendance}
                          </div>
                          <div
                            className={`text-xs font-semibold ${
                              attendancePercentage >= 95
                                ? "text-green-600"
                                : attendancePercentage >= 90
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {attendancePercentage >= 95
                              ? "Excellent"
                              : attendancePercentage >= 90
                                ? "Good"
                                : "Needs Improvement"}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Attendance Progress</span>
                          <span>{subject.attendance}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              attendancePercentage >= 95
                                ? "bg-green-500"
                                : attendancePercentage >= 90
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${attendancePercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <div className="text-sm md:text-lg font-bold text-green-600">
                            {subject.attendanceRecords.present}
                          </div>
                          <div className="text-xs text-gray-600">Present</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg">
                          <div className="text-sm md:text-lg font-bold text-yellow-600">
                            {subject.attendanceRecords.late}
                          </div>
                          <div className="text-xs text-gray-600">Late</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <div className="text-sm md:text-lg font-bold text-red-600">
                            {subject.attendanceRecords.absent}
                          </div>
                          <div className="text-xs text-gray-600">Absent</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "profile":
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
                        alt="Student profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user?.fullName?.charAt(0) || "S"}</span>
                    )}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900">
                    {user?.fullName || "Student"}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    {user?.email || "student@pnhs.edu.ph"}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs md:text-sm text-gray-600">
                      Student ID
                    </div>
                    <div className="font-semibold text-gray-900">
                      {user?.studentId || "STU-2024-001"}
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
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Grade Level
                      </label>
                      <input
                        type="text"
                        value={user?.gradeLevel || "Not set"}
                        className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                        disabled
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Section
                      </label>
                      <input
                        type="text"
                        value={user?.section || "Not set"}
                        className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                        disabled
                        readOnly
                      />
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 mt-3">
                        Strand
                      </label>
                      <input
                        type="text"
                        value={user?.strand || "Not set"}
                        className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                        disabled
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "teachers":
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                My Teachers
              </h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                View your teachers and send them a message
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                value={teacherSearchTerm}
                onChange={(e) => setTeacherSearchTerm(e.target.value)}
              />
            </div>

            {filteredTeachers.length === 0 ? (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-8 md:p-12 border border-green-100 text-center">
                <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm md:text-base">
                  {teacherSearchTerm
                    ? "No teachers found for your search."
                    : "No teacher records available yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="text-left bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100 hover:border-green-300 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">
                            {teacher.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 truncate">
                            {teacher.department || "Teacher"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {teacher.email || "No email available"}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                        <Mail className="w-3 h-3" />
                        Message
                      </span>
                    </div>
                    {teacher.classNames.length > 0 && (
                      <p className="text-xs md:text-sm text-gray-600 truncate mb-2">
                        Classes: {teacher.classNames.join(", ")}
                      </p>
                    )}
                    {teacher.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects.slice(0, 3).map((subject) => (
                          <span
                            key={subject}
                            className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                    {(() => {
                      const latest = getLatestTeacherMessage(teacher.id);
                      const total = getMessagesWithTeacher(teacher.id).length;
                      const unread = getTeacherUnreadCount(teacher.id);
                      return (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 mb-3">
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
                                onClick={() => {
                                  markTeacherMessagesAsSeen(teacher.id);
                                  openTeacherMessage(teacher);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 text-xs md:text-sm font-semibold"
                              >
                                <Eye className="w-4 h-4" />
                                View Messages
                              </button>
                              <button
                                onClick={() => openTeacherMessage(teacher)}
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
                ))}
              </div>
            )}
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
                    Welcome back, {user?.fullName || "Student"}! 👋
                  </h1>
                  <p className="text-green-100 text-base md:text-lg mb-4 md:mb-6">
                    Here's your academic overview for today.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                    <button
                      onClick={() => handleNavigation("schedule")}
                      className="px-4 md:px-5 py-2 md:py-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <Calendar className="w-4 h-4" />
                      View Schedule
                    </button>
                    <button
                      onClick={() => handleNavigation("attendance")}
                      className="px-4 md:px-5 py-2 md:py-2.5 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-colors font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <PieChart className="w-4 h-4" />
                      View Attendance
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
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-all duration-300 border border-green-100"
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div
                      className={`p-2 md:p-3 rounded-xl ${stat.color} shadow-md`}
                    >
                      <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    {stat.trend === "up" && (
                      <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <TrendingUpIcon className="w-3 h-3" />
                        {stat.change}
                      </div>
                    )}
                    {stat.trend === "down" && (
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
                  <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold text-green-800">
                    {stat.value}
                  </p>

                  {stat.label === "Attendance Rate" && (
                    <div className="mt-3 md:mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{stat.value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(attendanceStats.rate) >= 95
                              ? "bg-green-500"
                              : parseFloat(attendanceStats.rate) >= 90
                                ? "bg-yellow-500"
                                : "bg-red-500"
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

            {/* Main Content Grid */}
            <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
              {/* My Subjects with Attendance */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-green-900">
                      My Subjects & Attendance
                    </h2>
                    <p className="text-gray-600 mt-1 text-xs md:text-sm">
                      Subject-wise attendance overview
                    </p>
                  </div>
                  <button
                    onClick={() => handleNavigation("attendance")}
                    className="text-green-700 hover:text-green-900 font-semibold text-xs md:text-sm flex items-center gap-1"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 md:space-y-4">
                  {subjects.slice(0, 4).map((subject) => {
                    const attendancePercentage = parseFloat(
                      subject.attendance.replace("%", ""),
                    );
                    return (
                      <div
                        key={subject.id}
                        className="p-3 md:p-4 border border-gray-200 rounded-xl md:rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer"
                        onClick={() => handleNavigation("attendance")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">
                              {subject.name}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-600 truncate">
                              {subject.teacher}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                              {subject.grade}
                            </div>
                            <div
                              className={`text-xs md:text-sm font-semibold ${
                                attendancePercentage >= 95
                                  ? "text-green-600"
                                  : attendancePercentage >= 90
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
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
                                attendancePercentage >= 95
                                  ? "bg-green-500"
                                  : attendancePercentage >= 90
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${attendancePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6 border border-green-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-2">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-green-900">
                      Today's Schedule
                    </h2>
                    <p className="text-gray-600 mt-1 text-xs md:text-sm">
                      Your classes for today
                    </p>
                  </div>
                  <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-green-100 to-yellow-100 text-green-700 rounded-full text-xs md:text-sm font-semibold">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </span>
                </div>
                <div className="space-y-3">
                  {classSchedule.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 md:p-4 border border-gray-200 rounded-xl md:rounded-2xl hover:border-green-300 hover:bg-green-50/50 transition-all"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-yellow-500 rounded-lg flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                        <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                          {item.subject}
                        </p>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mt-1">
                          <Clock className="w-3 h-3" />
                          <span className="truncate">{item.time}</span>
                        </div>
                      </div>
                      <span className="text-xs md:text-sm text-gray-600 ml-2">
                        {item.room}
                      </span>
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
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
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
    }
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
                  <p className="text-xs text-green-200">Student Portal</p>
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
                    alt="Student avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.fullName?.charAt(0) || "S"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm md:text-base truncate">
                  {user?.fullName || "Student"}
                </h3>
                <p className="text-xs text-green-200 truncate">
                  Attendance: {attendanceStats.rate}%
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
                <div className="relative group hidden sm:block">
                  <button
                    onClick={() => handleNavigation("attendance")}
                    className="p-2 hover:bg-gray-100 rounded-full relative"
                  >
                    <PieChart className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                    {parseFloat(attendanceStats.rate) < 90 && (
                      <span className="absolute top-1 right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-40 md:w-48 bg-white rounded-xl shadow-lg border border-gray-200 p-2 md:p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="text-xs md:text-sm font-semibold text-gray-900 mb-2">
                      Attendance Summary
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-semibold text-green-600">
                          {attendanceStats.rate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-600">Present:</span>
                        <span className="font-semibold">
                          {attendanceStats.present}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-600">Late:</span>
                        <span className="font-semibold text-yellow-600">
                          {attendanceStats.late}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-600">Absent:</span>
                        <span className="font-semibold text-red-600">
                          {attendanceStats.absent}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleNavigation("announcements")}
                  className="relative p-2 hover:bg-gray-100 rounded-full"
                >
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                  {announcementUnreadCount > 0 || messageUnreadCount > 0 ? (
                    <span className="absolute top-1 right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full"></span>
                  ) : null}
                </button>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Student avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.fullName?.charAt(0) || "S"}</span>
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
              © {new Date().getFullYear()} PNHS Student Portal. All rights
              reserved.
            </p>
            <p className="text-center md:text-left">
              Pantabangan National High School
            </p>
          </div>
        </footer>
      </div>

      {/* Message Teacher Modal */}
      {messageTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-green-900">
                  Message Teacher
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  To: {messageTeacher.name}
                  {messageTeacher.email ? ` (${messageTeacher.email})` : ""}
                </p>
              </div>
              <button
                onClick={() => setMessageTeacher(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 max-h-52 overflow-y-auto">
                {getMessagesWithTeacher(messageTeacher.id).length === 0 ? (
                  <p className="text-xs text-gray-500">No conversation yet.</p>
                ) : (
                  <div className="space-y-2">
                    {getMessagesWithTeacher(messageTeacher.id)
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
                onClick={handleSendTeacherMessage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 text-sm md:text-base disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
              <button
                onClick={() => setMessageTeacher(null)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Detail Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-green-900">
                {showAttendanceModal.name} Attendance
              </h3>
              <button
                onClick={() => setShowAttendanceModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6 rounded-xl">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                    {showAttendanceModal.attendance}
                  </div>
                  <div className="text-base md:text-lg font-semibold text-gray-900">
                    Overall Attendance Rate
                  </div>
                  <div className="text-sm md:text-base text-gray-600">
                    Teacher: {showAttendanceModal.teacher}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl md:text-3xl font-bold text-green-600">
                    {showAttendanceModal.attendanceRecords.present}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">
                    Present
                  </div>
                </div>
                <div className="text-center p-3 md:p-4 bg-yellow-50 rounded-xl">
                  <div className="text-2xl md:text-3xl font-bold text-yellow-600">
                    {showAttendanceModal.attendanceRecords.late}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">
                    Late
                  </div>
                </div>
                <div className="text-center p-3 md:p-4 bg-red-50 rounded-xl">
                  <div className="text-2xl md:text-3xl font-bold text-red-600">
                    {showAttendanceModal.attendanceRecords.absent}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">
                    Absent
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs md:text-sm font-medium text-gray-700 mb-2">
                  <span>Attendance Progress</span>
                  <span>{showAttendanceModal.attendance}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                  <div
                    className={`h-2 md:h-3 rounded-full ${
                      parseFloat(showAttendanceModal.attendance) >= 95
                        ? "bg-green-500"
                        : parseFloat(showAttendanceModal.attendance) >= 90
                          ? "bg-yellow-500"
                          : "bg-red-500"
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

              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm md:text-base">
                  Recent Attendance History
                </h4>
                <div className="space-y-2">
                  {showAttendanceModal.attendanceHistory.map(
                    (record, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 md:gap-3">
                          <div
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 ${
                              record.status === "present"
                                ? "bg-green-500"
                                : record.status === "late"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          ></div>
                          <span className="text-gray-900 text-xs md:text-sm">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <span
                          className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                            record.status === "present"
                              ? "bg-green-100 text-green-700"
                              : record.status === "late"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowAttendanceModal(null)}
                  className="w-full py-2.5 md:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm md:text-base"
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
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-green-900">
                {showAssignmentModal.title}
              </h3>
              <button
                onClick={() => {
                  setAssignmentFile(null);
                  setShowAssignmentModal(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-sm md:text-base">
                    {showAssignmentModal.subject}
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Section / Class
                  </label>
                  <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-sm md:text-base">
                    {showAssignmentModal.className || "N/A"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-sm md:text-base">
                    {new Date(showAssignmentModal.dueDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Points / Score
                  </label>
                  <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-sm md:text-base">
                    {showAssignmentModal.points || "N/A"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <div
                  className={`px-3 md:px-4 py-2 md:py-3 rounded-xl inline-block text-sm md:text-base ${
                    showAssignmentModal.status === "pending"
                      ? "bg-orange-100 text-orange-700"
                      : showAssignmentModal.status === "submitted"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {showAssignmentModal.status.toUpperCase()}
                </div>
              </div>

              {showAssignmentModal.description && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-sm md:text-base">
                    {showAssignmentModal.description}
                  </div>
                </div>
              )}
              {!showAssignmentModal.description && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-sm md:text-base text-gray-500">
                    No instructions provided by teacher.
                  </div>
                </div>
              )}

              {showAssignmentModal.attachmentPath && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Attachment
                  </label>
                  <a
                    href={showAssignmentModal.attachmentPath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    {showAssignmentModal.attachmentName ||
                      "Download attached file"}
                  </a>
                </div>
              )}
              {!showAssignmentModal.attachmentPath && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Attachment
                  </label>
                  <div className="px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-xl text-sm md:text-base text-gray-500">
                    No file attached by teacher.
                  </div>
                </div>
              )}

              {showAssignmentModal.filePath && (
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Your Submitted File
                  </label>
                  <a
                    href={showAssignmentModal.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Open your uploaded file
                  </a>
                </div>
              )}

              {showAssignmentModal.status === "graded" &&
                showAssignmentModal.grade && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-green-800 text-sm md:text-base">
                          Grade Received
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Your assignment has been graded
                        </p>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-green-600">
                        {showAssignmentModal.grade}
                      </div>
                    </div>
                  </div>
                )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {showAssignmentModal.status === "pending" && (
                  <div className="flex-1 space-y-3">
                    <p className="text-xs text-gray-600">
                      Upload file first. Assignment will be marked as submitted
                      only after file upload.
                    </p>
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
                          setAssignmentFile(null);
                          return;
                        }
                        setAssignmentFile(file);
                      }}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
                    />
                    <p className="text-xs text-gray-500">
                      Max file size:{" "}
                      {uploadMaxMB === 0 ? "No limit" : `${uploadMaxMB}MB`}
                    </p>
                    <button
                      onClick={() =>
                        handleSubmitAssignment(showAssignmentModal.id)
                      }
                      disabled={submittingAssignment}
                      className="w-full flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm md:text-base disabled:opacity-60"
                    >
                      <Upload className="w-4 h-4 md:w-5 md:h-5" />
                      {submittingAssignment
                        ? "Submitting..."
                        : "Submit Assignment"}
                    </button>
                  </div>
                )}
                {showAssignmentModal.status === "submitted" && (
                  <button
                    onClick={() =>
                      handleDeleteSubmittedFile(showAssignmentModal.id)
                    }
                    className="px-4 md:px-6 py-2.5 md:py-3 border border-red-200 text-red-700 rounded-xl hover:bg-red-50 font-semibold text-sm md:text-base"
                  >
                    Delete Submitted File
                  </button>
                )}
                <button
                  onClick={() => {
                    setAssignmentFile(null);
                    setShowAssignmentModal(null);
                  }}
                  className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm md:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
