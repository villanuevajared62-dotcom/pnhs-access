"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  UserPlus,
  FileText,
  TrendingUp,
  Calendar,
  Bell,
  Search,
  Menu,
  X,
  Edit,
  Trash2,
  Download,
  Filter,
  ChevronDown,
  Check,
  X as XIcon,
  Plus,
  Send,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  removeUserFromStorage,
  getUserFromStorage,
  saveUserToStorage,
  type User,
} from "@/lib/auth";
import {
  formatDate,
  STRANDS,
  type Announcement,
  type Student,
  type Teacher,
  type Class,
  type Attendance,
} from "@/lib/shared-data";

// 7:30 AM → 5:00 PM in 30-min steps
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  let totalMin = 7 * 60 + 30;
  const endMin = 17 * 60;
  while (totalMin <= endMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const ampm = h < 12 ? "AM" : "PM";
    const displayH = h > 12 ? h - 12 : h;
    slots.push(`${displayH}:${m === 0 ? "00" : m} ${ampm}`);
    totalMin += 30;
  }
  return slots;
})();

const DAY_OPTIONS = [
  "Mon to Fri",
  "Mon/Wed/Fri",
  "Tue/Thu",
  "Mon/Tue/Wed/Thu/Fri",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
];

export default function AdminDashboard() {
  type ToastType = "success" | "error" | "warning" | "info";
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Editing states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // student attendance modal state (admin)
  const [showStudentAttendance, setShowStudentAttendance] = useState<{
    student: Student;
    rows: Attendance[];
    from?: string;
    to?: string;
  } | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Form states
  const [studentForm, setStudentForm] = useState<
    Omit<Student, "id"> & { username: string; password: string }
  >({
    name: "",
    email: "",
    gradeLevel: "Grade 10",
    section: "A",
    strand: "",
    gpa: "0",
    status: "active",
    studentId: "",
    username: "",
    password: "",
  });

  const [teacherForm, setTeacherForm] = useState<
    Omit<Teacher, "id"> & { username: string; password: string }
  >({
    name: "",
    email: "",
    department: "",
    subjects: [""],
    status: "active",
    students: 0,
    username: "",
    password: "",
  });

  const [classForm, setClassForm] = useState({
    name: "",
    teacher: "",
    students: 0,
    schedule: "",
    room: "",
  });

  // Selected classes to auto-enroll when adding a student
  const [studentSelectedClassIds, setStudentSelectedClassIds] = useState<
    string[]
  >([]);

  // Announcement form state
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success",
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState({
    schoolName: "PNHS",
    schoolYear: "2025-2026",
    emailNotifications: true,
    smsNotifications: false,
    classNotifications: true,
  });

  // matched students helper for Add/Edit Class modal
  const [matchedStudentCount, setMatchedStudentCount] = useState<number>(0);
  const lastAutoAppliedMatchedRef = useRef<number | null>(null);
  const manualStudentsEditedRef = useRef<boolean>(false);
  // Schedule split state
  const [scheduleDays, setScheduleDays] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleConflict, setScheduleConflict] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    type: ToastType;
  }>({ open: false, message: "", type: "info" });

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ open: true, message, type });
  };
  const [confirmDelete, setConfirmDelete] = useState<{
    key: string;
    id: string;
    deadline: number;
  } | null>(null);
  const requestConfirm = (key: string, id: string) => {
    const now = Date.now();
    if (
      confirmDelete &&
      confirmDelete.key === key &&
      confirmDelete.id === id &&
      now < confirmDelete.deadline
    ) {
      setConfirmDelete(null);
      return true;
    }
    setConfirmDelete({ key, id, deadline: now + 5000 });
    showToast("Tap delete again to confirm", "warning");
    return false;
  };

  // ---------- Schedule helpers ----------
  const parseSchedule = (schedule: string) => {
    if (!schedule) return { days: "", start: "", end: "" };
    const s = schedule.trim();
    // Robust pattern: "<days> <start> - <end>", where days may contain spaces (e.g., "Mon to Fri")
    const re =
      /^(.+?)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))$/i;
    const m = s.match(re);
    if (m) {
      const days = m[1].trim();
      const start = m[2].trim();
      const end = m[3].trim();
      return { days, start, end };
    }
    // Fallback: try to find the first time token and split before it
    const timeToken = s.match(/\b\d{1,2}:\d{2}\s*(AM|PM)\b/i);
    if (timeToken && timeToken.index !== undefined) {
      const days = s.slice(0, timeToken.index).trim();
      const timeStr = s.slice(timeToken.index).trim();
      const dashIdx = timeStr.indexOf(" - ");
      if (dashIdx !== -1) {
        return {
          days,
          start: timeStr.slice(0, dashIdx).trim(),
          end: timeStr.slice(dashIdx + 3).trim(),
        };
      }
      return { days, start: timeStr, end: "" };
    }
    return { days: s, start: "", end: "" };
  };

  const timeToMinutes = (t: string): number => {
    const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return -1;
    let h = parseInt(match[1]);
    const min = parseInt(match[2]);
    const ap = match[3].toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return h * 60 + min;
  };

  const expandDays = (dayStr: string): string[] =>
    dayStr
      .replace(/Mon to Fri/i, "Mon/Tue/Wed/Thu/Fri")
      .replace(/Mon-Fri/i, "Mon/Tue/Wed/Thu/Fri")
      .split(/[\/\s,]+/)
      .map((d) => d.trim())
      .filter(Boolean);

  const checkScheduleConflict = (
    teacherId: string,
    days: string,
    start: string,
    end: string,
    excludeId?: string,
  ): string | null => {
    if (!teacherId || !days || !start || !end) return null;
    const newStart = timeToMinutes(start);
    const newEnd = timeToMinutes(end);
    if (newStart < 0 || newEnd < 0 || newStart >= newEnd) return null;
    const newDays = expandDays(days);
    const conflicts = classes.filter((c) => {
      if (c.teacherId !== teacherId) return false;
      if (excludeId && c.id === excludeId) return false;
      const parsed = parseSchedule(c.schedule || "");
      const cStart = timeToMinutes(parsed.start);
      const cEnd = timeToMinutes(parsed.end);
      if (cStart < 0 || cEnd < 0) return false;
      const clsDays = expandDays(parsed.days);
      return (
        newDays.some((d) => clsDays.includes(d)) &&
        newStart < cEnd &&
        newEnd > cStart
      );
    });
    if (conflicts.length === 0) return null;
    return `Schedule conflict: ${conflicts.map((c) => `"${c.name}" (${c.schedule})`).join(", ")}`;
  };

  const handleScheduleChange = (days: string, start: string, end: string) => {
    setScheduleDays(days);
    setScheduleStart(start);
    setScheduleEnd(end);
    const combined =
      `${days}${start ? " " + start : ""}${end ? " - " + end : ""}`.trim();
    setEditingClass((prev) => (prev ? { ...prev, schedule: combined } : prev));
    if (editingClass?.teacherId) {
      setScheduleConflict(
        checkScheduleConflict(
          editingClass.teacherId,
          days,
          start,
          end,
          editingClass.id,
        ),
      );
    }
  };
  // ---------- End schedule helpers ----------

  const isNewClass = Boolean(editingClass && !editingClass.id);
  const teacherMustBeSelectedFirst = Boolean(
    isNewClass && !editingClass?.teacherId,
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const sessionUser = data?.user;
          if (!sessionUser || sessionUser.role !== "admin") {
            router.push("/login");
            return;
          }
          setUser(sessionUser as User);
          // keep localStorage in sync for page-refresh fallback
          saveUserToStorage(sessionUser as User);
          await loadData();
          return;
        }

        // If server session check failed, fall back to localStorage so a
        // soft refresh doesn't immediately kick the user back to /login.
        const localUser = getUserFromStorage();
        if (localUser && localUser.role === "admin") {
          setUser(localUser);
          // try to load data; if backend rejects, loadData will redirect later
          await loadData();
          return;
        }

        router.push("/login");
        return;
      } catch (e) {
        console.error("Error validating session", e);
        const localUser = getUserFromStorage();
        if (localUser && localUser.role === "admin") {
          setUser(localUser);
          await loadData();
          return;
        }
        router.push("/login");
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(
      () => setToast((prev) => ({ ...prev, open: false })),
      2800,
    );
    return () => clearTimeout(t);
  }, [toast.open]);

  // When Add Student modal opens or grade/section/strand change, pre-select matching classes
  useEffect(() => {
    if (!showAddModal) return;

    const matching = classes
      .filter((c) => {
        // Normalize comparison - trim whitespace and convert to uppercase for section/strand
        const classGrade = (c.gradeLevel || "").trim();
        const formGrade = (studentForm.gradeLevel || "").trim();

        // First check if grade level matches
        if (classGrade !== formGrade) {
          return false;
        }

        // For Senior High (Grade 11-12), match both section AND strand
        if (formGrade === "Grade 11" || formGrade === "Grade 12") {
          const classSection = (c.section || "").trim().toUpperCase();
          const formSection = (studentForm.section || "").trim().toUpperCase();
          const classStrand = (c.strand || "").trim().toUpperCase();
          const formStrand = (studentForm.strand || "").trim().toUpperCase();

          const sectionMatch = classSection === formSection;
          const strandMatch = classStrand === formStrand;

          return sectionMatch && strandMatch;
        }

        // For Junior High (Grade 7-10), match section only
        const classSection = (c.section || "").trim().toUpperCase();
        const formSection = (studentForm.section || "").trim().toUpperCase();

        const sectionMatch = classSection === formSection;

        return sectionMatch;
      })
      .map((c) => c.id);
  }, [
    showAddModal,
    studentForm.gradeLevel,
    studentForm.section,
    studentForm.strand,
    classes,
  ]);

  // clear selected classes when the Add modal closes
  useEffect(() => {
    if (!showAddModal) setStudentSelectedClassIds([]);
  }, [showAddModal]);

  // Recompute how many students match the currently-selected grade/section/strand
  useEffect(() => {
    if (!editingClass) {
      setMatchedStudentCount(0);
      return;
    }

    const isSenior =
      editingClass.gradeLevel === "Grade 11" ||
      editingClass.gradeLevel === "Grade 12";

    const count = students.filter((s) => {
      if (s.gradeLevel !== editingClass.gradeLevel) return false;
      const sectionMatch =
        (editingClass.section || "") === ""
          ? true
          : (s.section || "") === (editingClass.section || "");
      const strandMatch = isSenior
        ? (editingClass.strand || "") === ""
          ? true
          : (s.strand || "") === (editingClass.strand || "")
        : true;
      return sectionMatch && strandMatch;
    }).length;

    setMatchedStudentCount(count);

    // Auto-fill `students` from matches for NEW classes unless the user edited it manually.
    const shouldAutoFill =
      !manualStudentsEditedRef.current && editingClass.id === "";

    if (shouldAutoFill) {
      setEditingClass({ ...editingClass, students: count });
      lastAutoAppliedMatchedRef.current = count;
    }
  }, [
    editingClass?.gradeLevel,
    editingClass?.section,
    editingClass?.strand,
    students,
    editingClass?.students,
    editingClass?.id,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLarge = window.innerWidth >= 1024;
      setSidebarOpen(isLarge);

      const onResize = () => setSidebarOpen(window.innerWidth >= 1024);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    return;
  }, []);

  // Parse existing schedule string into parts when a class modal opens
  useEffect(() => {
    if (!editingClass) {
      setScheduleDays("");
      setScheduleStart("");
      setScheduleEnd("");
      setScheduleConflict(null);
      manualStudentsEditedRef.current = false;
      return;
    }
    const parsed = parseSchedule(editingClass.schedule || "");
    setScheduleDays(parsed.days);
    setScheduleStart(parsed.start);
    setScheduleEnd(parsed.end);
    // Reset manual flag when switching between add/edit contexts
    manualStudentsEditedRef.current = false;
  }, [editingClass?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-check conflict whenever teacher or schedule parts change
  useEffect(() => {
    if (!editingClass?.teacherId) {
      setScheduleConflict(null);
      return;
    }
    setScheduleConflict(
      checkScheduleConflict(
        editingClass.teacherId,
        scheduleDays,
        scheduleStart,
        scheduleEnd,
        editingClass.id,
      ),
    );
  }, [
    editingClass?.teacherId,
    scheduleDays,
    scheduleStart,
    scheduleEnd,
    editingClass?.id,
    classes,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [
        studentsRes,
        teachersRes,
        classesRes,
        announcementsRes,
        settingsRes,
      ] = await Promise.all([
        fetch("/api/students", { credentials: "include" }),
        fetch("/api/teachers", { credentials: "include" }),
        fetch("/api/classes", { credentials: "include" }),
        fetch("/api/announcements", { credentials: "include" }),
        fetch("/api/settings", { credentials: "include" }),
      ]);

      // If any API returns 401 the session is invalid — redirect to login
      if (
        studentsRes.status === 401 ||
        teachersRes.status === 401 ||
        classesRes.status === 401 ||
        announcementsRes.status === 401 ||
        settingsRes.status === 401
      ) {
        router.push("/login");
        return;
      }

      if (!studentsRes.ok) {
        console.error("Failed to load students:", studentsRes.status);
        setStudents([]);
      } else {
        const studentsData = await studentsRes.json();
        setStudents(studentsData || []);
      }
      if (!teachersRes.ok) {
        console.error("Failed to load teachers:", teachersRes.status);
        setTeachers([]);
      } else {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData || []);
      }
      if (!classesRes.ok) {
        console.error("Failed to load classes:", classesRes.status);
        setClasses([]);
      } else {
        const classesData = await classesRes.json();
        setClasses(classesData || []);
      }
      if (!announcementsRes.ok) {
        console.error("Failed to load announcements:", announcementsRes.status);
        setAnnouncements([]);
      } else {
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData || []);
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData || {});
      }
    } catch (error) {
      console.error("Error loading data", error);
      setStudents([]);
      setTeachers([]);
      setClasses([]);
      setAnnouncements([]);
    }
  };

  // Open modal and fetch attendance rows for a specific student (admin)
  const openStudentAttendance = async (student: Student) => {
    setAttendanceLoading(true);
    try {
      const res = await fetch(`/api/attendance?studentId=${student.id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setShowStudentAttendance({
          student,
          rows: [],
          from: undefined,
          to: undefined,
        });
        return;
      }
      const rows = await res.json();
      // derive default range from rows
      const dates = rows.map((r: any) => new Date(r.date));
      const from = dates.length
        ? new Date(Math.min(...dates)).toISOString().slice(0, 10)
        : undefined;
      const to = dates.length
        ? new Date(Math.max(...dates)).toISOString().slice(0, 10)
        : undefined;
      setShowStudentAttendance({ student, rows, from, to });
    } catch (e) {
      console.error("Failed to load student attendance", e);
      setShowStudentAttendance({
        student,
        rows: [],
        from: undefined,
        to: undefined,
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchStudentAttendanceRange = async (
    studentId: string,
    from?: string,
    to?: string,
  ) => {
    setAttendanceLoading(true);
    try {
      const params = new URLSearchParams();
      if (studentId) params.set("studentId", studentId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/attendance?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const rows = await res.json();
      return rows as Attendance[];
    } catch (e) {
      return [] as Attendance[];
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore
    }
    removeUserFromStorage();
    router.push("/login");
  };

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!requestConfirm("student", id)) return;
    const res = await fetch(`/api/students/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      showToast("Failed to delete student", "error");
      return;
    }
    showToast("Student deleted", "success");
    await loadData();
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!requestConfirm("teacher", id)) return;
    const res = await fetch(`/api/teachers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      showToast("Failed to delete teacher", "error");
      return;
    }
    showToast("Teacher deleted", "success");
    await loadData();
  };

  const handleDeleteClass = async (id: string) => {
    if (!requestConfirm("class", id)) return;
    const res = await fetch(`/api/classes/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      showToast("Failed to delete class", "error");
      return;
    }
    showToast("Class deleted", "success");
    await loadData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!requestConfirm("announcement", id)) return;
    const res = await fetch(`/api/announcements/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      showToast("Failed to delete announcement", "error");
      return;
    }
    showToast("Announcement deleted", "success");
    await loadData();
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        showToast("Failed to save settings", "error");
        return;
      }

      showToast("Settings saved successfully!", "success");
      await loadData();
    } catch (error) {
      showToast("Error saving settings", "error");
      console.error(error);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.message) {
      showToast("Please fill in all fields", "warning");
      return;
    }
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: announcementForm.title,
        message: announcementForm.message,
        type: announcementForm.type,
        author: user?.fullName || "Admin",
        date: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      showToast("Failed to add announcement", "error");
      return;
    }
    setAnnouncementForm({ title: "", message: "", type: "info" });
    setShowAnnouncementModal(false);
    showToast("Announcement added successfully!", "success");
    await loadData();
  };

  const handleAddStudent = async () => {
    if (
      !studentForm.name ||
      !studentForm.email ||
      !studentForm.username ||
      !studentForm.password
    ) {
      showToast(
        "Please fill in all required fields (Name, Email, Username, Password)",
        "warning",
      );
      return;
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: studentForm.name,
          email: studentForm.email,
          username: studentForm.username,
          password: studentForm.password,
          gradeLevel: studentForm.gradeLevel,
          section: studentForm.section,
          strand: studentForm.strand,
          gpa: "0",
          status: studentForm.status,
          studentId: studentForm.studentId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showToast(
          `Failed to add student: ${err.message || "Unknown error"}`,
          "error",
        );
        return;
      }

      const newStudent = await res.json();

      // Auto-enroll into selected classes (if any)
      if (studentSelectedClassIds.length > 0) {
        try {
          await Promise.all(
            studentSelectedClassIds.map((classId) =>
              fetch("/api/enrollments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ studentId: newStudent.id, classId }),
              }).then(async (r) => {
                if (!r.ok) {
                  const e = await r.json().catch(() => ({}));
                  console.warn("Failed to enroll into class", classId, e);
                }
              }),
            ),
          );
        } catch (e) {
          console.error("Error enrolling student into classes:", e);
        }
      }

      showToast("Student added successfully!", "success");
      setStudentForm({
        name: "",
        email: "",
        gradeLevel: "Grade 10",
        section: "A",
        strand: "",
        gpa: "0",
        status: "active",
        studentId: "",
        username: "",
        password: "",
      });
      setStudentSelectedClassIds([]);
      setShowAddModal(false);
      await loadData();
    } catch (error) {
      showToast("Error creating student account", "error");
      console.error(error);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    try {
      // Build payload with only the allowed fields — never include id, deletedAt, or relations
      const payload: Record<string, any> = {
        name: editingStudent.name,
        email: editingStudent.email,
        username: editingStudent.username,
        gradeLevel: editingStudent.gradeLevel,
        section: editingStudent.section,
        strand: editingStudent.strand ?? "",
        gpa: editingStudent.gpa,
        status: editingStudent.status,
        studentId: editingStudent.studentId,
      };

      // FIX: Only include password if it's a new plain-text value
      // Bcrypt hashes start with $2a$ or $2b$ — skip those to prevent double-hashing
      if (
        editingStudent.password &&
        editingStudent.password !== "" &&
        !editingStudent.password.startsWith("$2")
      ) {
        payload.password = editingStudent.password;
      }

      // Sanitize section for junior grades
      const juniorSections = ["A", "B", "C", "D", "E"];
      if (
        editingStudent.gradeLevel !== "Grade 11" &&
        editingStudent.gradeLevel !== "Grade 12"
      ) {
        if (!juniorSections.includes(payload.section)) payload.section = "A";
        payload.strand = ""; // clear strand for non-senior grades
      }

      // Resolve the DB primary key
      const idForUrl =
        editingStudent.id ||
        students.find((s) => s.studentId === editingStudent.studentId)?.id;
      if (!idForUrl) {
        showToast("Failed to update student: missing identifier", "error");
        return;
      }

      console.debug("Updating student", { idForUrl, payload });

      const res = await fetch(`/api/students/${encodeURIComponent(idForUrl)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        showToast(
          `Failed to update student: ${error.message || "Unknown error"}`,
          "error",
        );
        return;
      }

      showToast("Student updated successfully!", "success");
      setEditingStudent(null);
      await loadData();
    } catch (error) {
      console.error("Error updating student:", error);
      showToast("An error occurred while updating the student.", "error");
    }
  };

  const addSubjectToTeacher = (subject: string) => {
    if (!editingTeacher || !subject.trim()) return;

    const currentSubjects = editingTeacher.subjects || [];
    const trimmedSubject = subject.trim();

    if (currentSubjects.includes(trimmedSubject)) {
      showToast("Subject already added", "warning");
      return;
    }

    setEditingTeacher({
      ...editingTeacher,
      subjects: [...currentSubjects, trimmedSubject],
    });
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;
    try {
      if (editingTeacher.id) {
        const payload: any = { ...editingTeacher };
        if (typeof payload.__newSubject !== "undefined")
          delete payload.__newSubject;
        if (payload.password === "") delete payload.password;
        const res = await fetch(`/api/teachers/${editingTeacher.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update teacher");
        showToast("Teacher updated successfully!", "success");
      } else {
        if (!editingTeacher.name || !editingTeacher.email) {
          showToast("Please fill in Name and Email", "warning");
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editingTeacher.email)) {
          showToast("Please enter a valid email address", "warning");
          return;
        }

        // Prepare subjects array properly
        const subjects = editingTeacher.subjects || [];
        if (!Array.isArray(subjects)) {
          showToast("Subjects must be formatted correctly", "warning");
          return;
        }

        const payload: any = {
          ...editingTeacher,
          subjects: subjects,
          email: editingTeacher.email.trim().toLowerCase(),
          name: editingTeacher.name.trim(),
        };

        // Clean up payload
        if (typeof payload.__newSubject !== "undefined")
          delete payload.__newSubject;
        if (payload.username) {
          payload.username = payload.username.trim();
        }
        if (payload.password === "") {
          delete payload.password;
        }

        const res = await fetch("/api/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.message || "Failed to add teacher");
        }
        showToast("Teacher added successfully!", "success");
      }
      setEditingTeacher(null);
      await loadData();
    } catch (error) {
      console.error("Error updating teacher:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to update teacher",
        "error",
      );
    }
  };

  const handleUpdateClass = async () => {
    if (!editingClass) return;

    const isSenior =
      editingClass.gradeLevel === "Grade 11" ||
      editingClass.gradeLevel === "Grade 12";

    // require common fields; section is required for all grades, strand required for seniors
    if (
      !editingClass.name ||
      !editingClass.teacher ||
      !editingClass.teacherId ||
      !editingClass.schedule ||
      !editingClass.gradeLevel ||
      !editingClass.section ||
      (isSenior && !editingClass.strand)
    ) {
      showToast("Please fill in all required class fields", "warning");
      return;
    }
    if (scheduleConflict) {
      showToast(
        "Cannot save: teacher already has a class at this time slot.",
        "error",
      );
      return;
    }
    try {
      if (editingClass.id) {
        const res = await fetch(`/api/classes/${editingClass.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editingClass),
        });
        if (!res.ok) throw new Error("Failed to update class");
        showToast("Class updated successfully!", "success");
      } else {
        const { id, ...payload } = editingClass;
        const res = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to add class");
        showToast("Class added successfully!", "success");
      }
      setEditingClass(null);
      await loadData();
    } catch (error) {
      console.error("Error updating class:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to update class",
        "error",
      );
    }
  };

  const handleExportData = () => {
    const data =
      activeTab === "students"
        ? students
        : activeTab === "teachers"
          ? teachers
          : activeTab === "classes"
            ? classes
            : announcements;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const filteredStudents = students.filter(
    (s) =>
      (selectedFilter === "all" || s.gradeLevel.includes(selectedFilter)) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      (selectedFilter === "all" ||
        t.department.toLowerCase().includes(selectedFilter.toLowerCase())) &&
      (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Students",
      value: students.length.toString(),
      icon: Users,
      color: "bg-teal-700",
      change: "+12%",
    },
    {
      label: "Active Teachers",
      value: teachers.filter((t) => t.status === "active").length.toString(),
      icon: GraduationCap,
      color: "bg-green-700",
      change: "+3%",
    },
    {
      label: "Total Classes",
      value: classes.length.toString(),
      icon: BookOpen,
      color: "bg-emerald-700",
      change: "+5%",
    },
    {
      label: "Announcements",
      value: announcements.length.toString(),
      icon: Bell,
      color: "bg-green-600",
      change: "+2",
    },
  ];

  const navigationItems = [
    { icon: BarChart3, label: "Dashboard", key: "dashboard" },
    { icon: Bell, label: "Announcements", key: "announcements" },
    { icon: Users, label: "Students", key: "students" },
    { icon: GraduationCap, label: "Teachers", key: "teachers" },
    { icon: BookOpen, label: "Classes", key: "classes" },
    { icon: FileText, label: "Reports", key: "reports" },
    { icon: Settings, label: "Settings", key: "settings" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "announcements":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">
                Announcements Management
              </h2>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-5 h-5" />
                New Announcement
              </button>
            </div>

            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="bg-blue-50 rounded-2xl p-6 md:p-8 text-center border-2 border-dashed border-blue-300">
                  <Bell className="w-10 h-10 md:w-12 md:h-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium text-sm md:text-base">
                    No announcements yet
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    Create your first announcement by clicking "New
                    Announcement"
                  </p>
                </div>
              ) : (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`bg-white rounded-2xl shadow-md p-4 md:p-6 border-l-4 ${
                      announcement.type === "info"
                        ? "border-blue-500"
                        : announcement.type === "warning"
                          ? "border-yellow-500"
                          : "border-green-500"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                            {announcement.title}
                          </h3>
                          <span
                            className={`px-2 py-1 md:px-3 rounded-full text-xs font-semibold flex-shrink-0 ${
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
                        <p className="text-sm md:text-base text-gray-700 mb-3">
                          {announcement.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-500">
                          <span>By: {announcement.author}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatDate(announcement.date)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteAnnouncement(announcement.id)
                        }
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors self-start sm:self-auto"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "students":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">
                Students Management
              </h2>
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
                <table className="w-full min-w-[768px]">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Student ID
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Name
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900 hidden sm:table-cell">
                        Email
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900 hidden md:table-cell">
                        Username
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900 hidden lg:table-cell">
                        Password
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Grade
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900 hidden sm:table-cell">
                        Section
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900 hidden md:table-cell">
                        Strand
                      </th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-semibold text-green-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center">
                          <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 font-medium">
                            No students found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Add a new student to get started
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="border-t border-green-100 hover:bg-green-50"
                        >
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 font-mono">
                            {student.studentId}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900">
                            <button
                              onClick={() => openStudentAttendance(student)}
                              className="text-left text-green-700 hover:underline"
                            >
                              {student.name}
                            </button>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell">
                            {student.email}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 font-mono hidden md:table-cell">
                            {student.username}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 font-mono hidden lg:table-cell">
                            ••••••••
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900">
                            {student.gradeLevel}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 hidden sm:table-cell">
                            {student.section || "-"}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 hidden md:table-cell">
                            {student.strand || "-"}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                            <div className="flex gap-1 md:gap-2">
                              <button
                                onClick={() =>
                                  // FIX: Reset password to empty string so we never
                                  // send the stored bcrypt hash back to the API
                                  setEditingStudent({
                                    ...student,
                                    password: "",
                                  })
                                }
                                className="p-1 md:p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-1 md:p-2 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "teachers":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">
                Teachers Management
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTeacherForm({
                      name: "",
                      email: "",
                      department: "",
                      subjects: [""],
                      status: "active",
                      students: 0,
                      username: "",
                      password: "",
                    });
                    setEditingTeacher({
                      id: "",
                      name: "",
                      email: "",
                      department: "",
                      subjects: [],
                      status: "active",
                      students: 0,
                      username: "",
                      password: "",
                    } as any);
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
              {filteredTeachers.length === 0 ? (
                <div className="bg-purple-50 rounded-2xl p-6 md:p-8 text-center border-2 border-dashed border-purple-300">
                  <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No teachers found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add a new teacher to get started
                  </p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-green-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl flex-shrink-0">
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">
                            {teacher.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 break-all">
                            {teacher.email}
                          </p>
                          {teacher.username && (
                            <p className="text-xs md:text-sm text-gray-600 mt-1">
                              Username:{" "}
                              <span className="font-mono text-gray-800">
                                {teacher.username}
                              </span>
                            </p>
                          )}
                          <p className="text-xs md:text-sm text-gray-600 mt-1">
                            Password:{" "}
                            <span className="font-mono text-gray-800">
                              ••••••••
                            </span>
                          </p>
                          <p className="text-xs md:text-sm text-gray-600 mt-1">
                            {teacher.department}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {teacher.subjects.map((subject, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 md:px-3 md:py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-start">
                        <button
                          onClick={() => setEditingTeacher(teacher)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100 flex flex-wrap gap-4 md:gap-6">
                      <div className="text-xs md:text-sm">
                        <span className="text-gray-600">Students: </span>
                        <span className="font-semibold text-gray-900">
                          {teacher.students}
                        </span>
                      </div>
                      <div className="text-xs md:text-sm">
                        <span className="text-gray-600">Status: </span>
                        <span
                          className={`font-semibold ${teacher.status === "active" ? "text-green-600" : "text-gray-600"}`}
                        >
                          {teacher.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "classes":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-900">
                Classes Management
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setClassForm({
                      name: "",
                      teacher: "",
                      students: 0,
                      schedule: "",
                      room: "",
                    });
                    setEditingClass({
                      id: "",
                      name: "",
                      teacher: "",
                      teacherId: "",
                      students: 0,
                      schedule: "",
                      room: "",
                      gradeLevel: "Grade 10",
                      section: "A",
                      strand: "",
                    });
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
              {classes.length === 0 ? (
                <div className="md:col-span-2 bg-indigo-50 rounded-2xl p-8 text-center border-2 border-dashed border-indigo-300">
                  <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No classes yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add a new class to get started
                  </p>
                </div>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl shadow-md p-6 border border-green-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {cls.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Teacher: {cls.teacher}
                        </p>
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
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        <span>{cls.gradeLevel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">
                          Sec
                        </span>
                        <span>{cls.section}</span>
                      </div>
                      {(cls.gradeLevel === "Grade 11" ||
                        cls.gradeLevel === "Grade 12") &&
                        cls.strand && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{cls.strand}</span>
                          </div>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "reports":
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">
              Reports & Analytics
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Student Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Excellent (90-100)
                    </span>
                    <span className="font-semibold text-green-600">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Good (80-89)</span>
                    <span className="font-semibold text-blue-600">35%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: "35%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Average (70-79)
                    </span>
                    <span className="font-semibold text-yellow-600">15%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{ width: "15%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Below Average (&lt;70)
                    </span>
                    <span className="font-semibold text-red-600">5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{ width: "5%" }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  System Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">
                      Total Students
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {students.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-gray-700">
                      Total Teachers
                    </span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {teachers.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-teal-50 rounded-lg">
                    <span className="text-sm text-gray-700">Total Classes</span>
                    <span className="text-2xl font-bold text-teal-600">
                      {classes.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-700">Announcements</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {announcements.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div>
            <h2 className="text-2xl font-bold text-green-900 mb-6">
              System Settings
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  School Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name
                    </label>
                    <input
                      type="text"
                      value={settings.schoolName || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, schoolName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Year
                    </label>
                    <input
                      type="text"
                      value={settings.schoolYear || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, schoolYear: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Email notifications for new enrollments
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.classNotifications || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          classNotifications: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Daily attendance reports
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          smsNotifications: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-green-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Grade submission reminders
                    </span>
                  </label>
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-green-100 hover:border-teal-400 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div className={`${stat.color} p-3 md:p-4 rounded-xl`}>
                      <stat.icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                    </div>
                    <span className="text-green-600 font-semibold text-xs md:text-sm">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold text-teal-800">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-10">
              <h2 className="text-2xl font-bold text-green-900 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <button
                  onClick={() => handleNavigation("announcements")}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-3 md:gap-5"
                >
                  <Bell className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <h3 className="font-bold text-base md:text-lg truncate">
                      Announcements
                    </h3>
                    <p className="text-blue-100 text-xs md:text-sm mt-1">
                      Post updates & news
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleNavigation("students")}
                  className="bg-gradient-to-r from-teal-700 to-green-700 text-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-3 md:gap-5"
                >
                  <UserPlus className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <h3 className="font-bold text-base md:text-lg truncate">
                      Manage Students
                    </h3>
                    <p className="text-teal-100 text-xs md:text-sm mt-1">
                      View all students
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleNavigation("teachers")}
                  className="bg-gradient-to-r from-emerald-700 to-green-700 text-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-3 md:gap-5"
                >
                  <GraduationCap className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <h3 className="font-bold text-base md:text-lg truncate">
                      Manage Teachers
                    </h3>
                    <p className="text-emerald-100 text-xs md:text-sm mt-1">
                      View all teachers
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-4 md:p-7 border border-green-100">
              <h2 className="text-lg md:text-xl font-bold text-green-900 mb-4 md:mb-6">
                Recent Announcements
              </h2>
              <div className="space-y-4">
                {announcements.slice(0, 5).map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between py-3 md:py-4 border-b last:border-b-0 hover:bg-green-50 px-2 md:px-4 rounded-lg transition-colors gap-2 sm:gap-4"
                  >
                    <div className="flex items-start space-x-3 md:space-x-4 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full mt-1 md:mt-1.5 flex-shrink-0 ${
                          announcement.type === "success"
                            ? "bg-green-500"
                            : announcement.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                          {announcement.title}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                          {announcement.message.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-xs md:text-sm text-gray-500 flex-shrink-0">
                      {formatDate(announcement.date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-green-900 to-green-800 text-white transition-all duration-300 z-50 shadow-2xl ${
          sidebarOpen ? "w-72 lg:w-72" : "w-0 lg:w-20"
        } overflow-hidden lg:overflow-visible`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-10">
            <div
              className={`flex items-center gap-3 ${!sidebarOpen && "justify-center w-full"}`}
            >
              <div
                className={`flex items-center justify-center rounded-xl overflow-hidden shadow-lg ${sidebarOpen ? "w-12 h-12" : "w-10 h-10"}`}
              >
                <img
                  src="/pnhs-logo.png"
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
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          <nav className="space-y-1.5">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.key)}
                className={`w-full flex items-center ${sidebarOpen ? "justify-start gap-3 px-3 md:px-4" : "justify-center"} py-2.5 md:py-3 rounded-xl relative ${
                  activeTab === item.key
                    ? "bg-white/20 shadow-inner font-semibold"
                    : "hover:bg-white/10 text-green-100"
                } ${!sidebarOpen && "hidden lg:flex"}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm md:text-base truncate">
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/15">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-3 md:px-4" : "justify-center"} py-2.5 md:py-3 rounded-xl hover:bg-white/10 transition-colors text-green-100 ${!sidebarOpen && "hidden lg:flex"}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm md:text-base">Logout</span>
            )}
          </button>
        </div>
      </aside>

      <div
        className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-72" : "lg:ml-20"} ml-0`}
      >
        <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-green-100">
          <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="flex-1 max-w-md md:max-w-2xl mx-2 md:mx-4 hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                {activeTab === "students" && (
                  <div className="relative hidden sm:block">
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="px-3 md:px-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none pr-8 md:pr-10 text-sm md:text-base"
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
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                  <span className="absolute top-1 right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full"></span>
                </button>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-800 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md">
                  {user?.fullName?.charAt(0) || "A"}
                </div>
              </div>
            </div>

            {/* Mobile tabs removed to match student dashboard */}
          </div>
        </header>

        <main className="p-3 md:p-6 lg:p-10">{renderContent()}</main>
      </div>

      {/* Student Attendance Modal (Admin) */}
      {showStudentAttendance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full p-3 md:p-6 max-h-[90vh] overflow-y-auto mx-2">
            <div className="flex justify-between items-center mb-3 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-green-900 truncate">
                {showStudentAttendance.student.name} — Attendance
              </h3>
              <button
                onClick={() => setShowStudentAttendance(null)}
                className="p-1 md:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <X className="w-4 h-4 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-3 md:space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={showStudentAttendance.from || ""}
                      onChange={async (e) => {
                        const newFrom = e.target.value;
                        setShowStudentAttendance((prev) =>
                          prev ? { ...prev, from: newFrom } : prev,
                        );
                        const rows = await fetchStudentAttendanceRange(
                          showStudentAttendance.student.id,
                          newFrom,
                          showStudentAttendance.to,
                        );
                        setShowStudentAttendance((prev) =>
                          prev ? { ...prev, rows } : prev,
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={showStudentAttendance.to || ""}
                      onChange={async (e) => {
                        const newTo = e.target.value;
                        setShowStudentAttendance((prev) =>
                          prev ? { ...prev, to: newTo } : prev,
                        );
                        const rows = await fetchStudentAttendanceRange(
                          showStudentAttendance.student.id,
                          showStudentAttendance.from,
                          newTo,
                        );
                        setShowStudentAttendance((prev) =>
                          prev ? { ...prev, rows } : prev,
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      const rows = await fetchStudentAttendanceRange(
                        showStudentAttendance.student.id,
                        showStudentAttendance.from,
                        showStudentAttendance.to,
                      );
                      setShowStudentAttendance((prev) =>
                        prev ? { ...prev, rows } : prev,
                      );
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6 rounded-xl">
                <div className="text-center">
                  {/* aggregated counts */}
                  {(() => {
                    const rows = showStudentAttendance.rows || [];
                    const total = rows.length;
                    const present = rows.filter(
                      (r) => r.status === "present",
                    ).length;
                    const late = rows.filter((r) => r.status === "late").length;
                    const absent = rows.filter(
                      (r) => r.status === "absent",
                    ).length;
                    const percent = total
                      ? `${Math.round(((present + late * 0.5) / total) * 100)}%`
                      : "0%";
                    return (
                      <>
                        <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                          {percent}
                        </div>
                        <div className="text-base md:text-lg font-semibold text-gray-900">
                          Overall Attendance Rate
                        </div>
                        <div className="text-sm md:text-base text-gray-600">
                          Student ID: {showStudentAttendance.student.studentId}
                        </div>
                        <div className="text-sm md:text-base text-gray-600">
                          {showStudentAttendance.student.gradeLevel} • Section{" "}
                          {showStudentAttendance.student.section}
                          {(showStudentAttendance.student.gradeLevel ===
                            "Grade 11" ||
                            showStudentAttendance.student.gradeLevel ===
                              "Grade 12") &&
                            showStudentAttendance.student.strand && (
                              <> • {showStudentAttendance.student.strand}</>
                            )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {(() => {
                  const rows = showStudentAttendance.rows || [];
                  const present = rows.filter(
                    (r) => r.status === "present",
                  ).length;
                  const late = rows.filter((r) => r.status === "late").length;
                  const absent = rows.filter(
                    (r) => r.status === "absent",
                  ).length;
                  return (
                    <>
                      <div className="text-center p-3 md:p-4 bg-green-50 rounded-xl">
                        <div className="text-2xl md:text-3xl font-bold text-green-600">
                          {present}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">
                          Present
                        </div>
                      </div>
                      <div className="text-center p-3 md:p-4 bg-yellow-50 rounded-xl">
                        <div className="text-2xl md:text-3xl font-bold text-yellow-600">
                          {late}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">
                          Late
                        </div>
                      </div>
                      <div className="text-center p-3 md:p-4 bg-red-50 rounded-xl">
                        <div className="text-2xl md:text-3xl font-bold text-red-600">
                          {absent}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">
                          Absent
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm md:text-base">
                  Daily records
                </h4>
                <div className="space-y-2">
                  {(showStudentAttendance.rows || []).map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <div
                          className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                            row.status === "present"
                              ? "bg-green-500"
                              : row.status === "late"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <div className="text-gray-900 text-xs md:text-sm">
                          {new Date(row.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                          <div className="text-xs text-gray-500">
                            {classes.find((c) => c.id === row.classId)?.name ||
                              row.classId}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                          row.status === "present"
                            ? "bg-green-100 text-green-700"
                            : row.status === "late"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {row.status.charAt(0).toUpperCase() +
                          row.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowStudentAttendance(null)}
                  className="w-full py-2.5 md:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm md:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">
                New Announcement
              </h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      message: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none resize-none"
                  rows={5}
                  placeholder="Enter announcement message"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={announcementForm.type}
                  onChange={(e) =>
                    setAnnouncementForm({
                      ...announcementForm,
                      type: e.target.value as "info" | "warning" | "success",
                    })
                  }
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">
                Add New Student
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Enter student name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="student@pnhs.edu.ph"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={studentForm.username}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, username: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Login username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={studentForm.password}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Login password"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    value={studentForm.gradeLevel}
                    onChange={(e) => {
                      const grade = e.target.value;
                      setStudentForm({
                        ...studentForm,
                        gradeLevel: grade,
                        section: studentForm.section || "A",
                        strand:
                          grade === "Grade 11" || grade === "Grade 12"
                            ? studentForm.strand || STRANDS[0]
                            : "",
                      });
                    }}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section
                  </label>
                  <select
                    value={studentForm.section}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        section: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  >
                    {["A", "B", "C", "D", "E"].map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Strand
                  </label>
                  <select
                    value={studentForm.strand}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, strand: e.target.value })
                    }
                    disabled={
                      !(
                        studentForm.gradeLevel === "Grade 11" ||
                        studentForm.gradeLevel === "Grade 12"
                      )
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none disabled:opacity-60"
                  >
                    <option value="">(none)</option>
                    {STRANDS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Strand is used for Grade 11–12.
                  </p>
                </div>
              </div>

              {/* Auto-select subjects based on Grade / Section / Strand */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subjects
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-md p-3 bg-gray-50">
                  {(() => {
                    // Filter classes based on grade/section/strand
                    const filteredClasses = classes.filter((c) => {
                      if (c.gradeLevel !== studentForm.gradeLevel) return false;
                      if (
                        studentForm.gradeLevel === "Grade 11" ||
                        studentForm.gradeLevel === "Grade 12"
                      ) {
                        return (c.strand || "") === (studentForm.strand || "");
                      }
                      return (c.section || "") === (studentForm.section || "");
                    });

                    if (filteredClasses.length === 0) {
                      return (
                        <p className="text-xs text-gray-500">
                          No matching subjects for selected
                          grade/section/strand.
                        </p>
                      );
                    }

                    return filteredClasses.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={studentSelectedClassIds.includes(c.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setStudentSelectedClassIds((cur) =>
                              checked
                                ? [...cur, c.id]
                                : cur.filter((id) => id !== c.id),
                            );
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-gray-400">
                          {" "}
                          — {(c as any).teacherName || c.teacher}
                        </span>
                      </label>
                    ));
                  })()}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Selected subjects will be enrolled automatically when the
                  student is created.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student ID (Optional)
                </label>
                <input
                  type="text"
                  value={studentForm.studentId}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      studentId: e.target.value,
                    })
                  }
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">
                Edit Student
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  value={editingStudent.studentId}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingStudent.email}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username (for login)
                </label>
                <input
                  type="text"
                  value={editingStudent.username ?? ""}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      username: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password (for login)
                </label>
                <input
                  type="password"
                  value={editingStudent.password ?? ""}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      password: e.target.value,
                    })
                  }
                  placeholder="Leave blank to keep current password"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave blank to keep the current password unchanged.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    value={editingStudent.gradeLevel}
                    onChange={(e) => {
                      const grade = e.target.value;
                      setEditingStudent({
                        ...editingStudent,
                        gradeLevel: grade,
                        section: editingStudent.section || "A",
                        strand:
                          grade === "Grade 11" || grade === "Grade 12"
                            ? editingStudent.strand || STRANDS[0]
                            : "",
                      });
                    }}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section
                  </label>
                  <select
                    value={editingStudent.section}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        section: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  >
                    {["A", "B", "C", "D", "E"].map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Strand
                  </label>
                  <select
                    value={editingStudent.strand ?? ""}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        strand: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  >
                    <option value="">(none)</option>
                    {STRANDS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Strand is optional for non‑senior grades; set for Grade
                    11–12.
                  </p>
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-green-900">
                {editingTeacher.id ? "Edit Teacher" : "Add Teacher"}
              </h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editingTeacher.name}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...editingTeacher,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Enter teacher name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={editingTeacher.email}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...editingTeacher,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="teacher@pnhs.edu.ph"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username (for login)
                </label>
                <input
                  type="text"
                  value={(editingTeacher as any).username || ""}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...(editingTeacher as any),
                      username: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Login username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password (for login)
                </label>
                <input
                  type="password"
                  value={(editingTeacher as any).password || ""}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...(editingTeacher as any),
                      password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="Login password (leave blank to keep current)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={editingTeacher.department}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...editingTeacher,
                      department: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                  placeholder="e.g., Mathematics"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subjects
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={(editingTeacher as any).__newSubject || ""}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...(editingTeacher as any),
                        __newSubject: e.target.value,
                      } as any)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (
                          (editingTeacher as any).__newSubject || ""
                        ).trim();
                        if (!val) {
                          showToast("Please enter a subject name", "warning");
                          return;
                        }
                        const existing = (editingTeacher.subjects ||
                          []) as string[];
                        if (!existing.includes(val)) {
                          setEditingTeacher({
                            ...(editingTeacher as any),
                            subjects: [...existing, val],
                            __newSubject: "",
                          } as any);
                          showToast(`Subject "${val}" added`, "success");
                        } else {
                          showToast(
                            `Subject "${val}" is already added`,
                            "warning",
                          );
                          setEditingTeacher({
                            ...(editingTeacher as any),
                            __newSubject: "",
                          } as any);
                        }
                      }
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                    placeholder="Type subject and press Enter or click Add (e.g., Algebra)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (
                        (editingTeacher as any).__newSubject || ""
                      ).trim();
                      if (!val) {
                        showToast("Please enter a subject name", "warning");
                        return;
                      }
                      const existing = (editingTeacher.subjects ||
                        []) as string[];
                      if (!existing.includes(val)) {
                        setEditingTeacher({
                          ...(editingTeacher as any),
                          subjects: [...existing, val],
                          __newSubject: "",
                        } as any);
                        showToast(`Subject "${val}" added`, "success");
                      } else {
                        showToast(
                          `Subject "${val}" is already added`,
                          "warning",
                        );
                        setEditingTeacher({
                          ...(editingTeacher as any),
                          __newSubject: "",
                        } as any);
                      }
                    }}
                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 hover:bg-green-100"
                  >
                    Add
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap mt-3">
                  {(editingTeacher.subjects || []).map((sub, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-2"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeacher({
                            ...(editingTeacher as any),
                            subjects: (editingTeacher.subjects || []).filter(
                              (s) => s !== sub,
                            ),
                          } as any);
                        }}
                        className="p-1 rounded-full hover:bg-green-200"
                      >
                        <X className="w-3 h-3 text-green-700" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Assign subjects this teacher will handle. These are used when
                  creating classes and managing grades.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateTeacher}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
                >
                  <Check className="w-5 h-5" />
                  {editingTeacher.id ? "Save Changes" : "Add Teacher"}
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
              <h3 className="text-2xl font-bold text-green-900">
                {editingClass.id ? "Edit Class" : "Add Class"}
              </h3>
              <button
                onClick={() => setEditingClass(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teacher
                </label>
                <select
                  value={editingClass.teacherId || ""}
                  onChange={(e) => {
                    const selected = teachers.find(
                      (t) => t.id === e.target.value,
                    );
                    const subjectCandidate =
                      selected?.subjects?.[0] ?? selected?.department ?? "";
                    const shouldSetName =
                      !editingClass.name || editingClass.name.trim() === "";
                    setEditingClass({
                      ...editingClass,
                      teacherId: e.target.value,
                      teacher: selected ? selected.name : "",
                      name: shouldSetName
                        ? `${editingClass.gradeLevel || "Grade 10"} - ${subjectCandidate}`
                        : editingClass.name,
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                {isNewClass && !editingClass.teacherId && (
                  <div className="text-sm text-gray-500 mt-2">
                    Select a teacher first to prefill subject & suggested
                    students.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, name: e.target.value })
                  }
                  disabled={teacherMustBeSelectedFirst}
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none ${
                    teacherMustBeSelectedFirst ? "opacity-60" : ""
                  }`}
                  placeholder="e.g., Grade 10 - Mathematics"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Grade Level
                  </label>
                  <select
                    value={editingClass.gradeLevel}
                    onChange={(e) => {
                      const grade = e.target.value;
                      setEditingClass({
                        ...editingClass,
                        gradeLevel: grade,
                        // set sensible defaults when grade changes
                        section:
                          grade === "Grade 11" || grade === "Grade 12"
                            ? "A"
                            : "A",
                        strand:
                          grade === "Grade 11" || grade === "Grade 12"
                            ? STRANDS[0]
                            : "",
                      });
                    }}
                    disabled={teacherMustBeSelectedFirst}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none ${
                      teacherMustBeSelectedFirst ? "opacity-60" : ""
                    }`}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section
                  </label>
                  <select
                    value={editingClass.section}
                    onChange={(e) =>
                      setEditingClass({
                        ...editingClass,
                        section: e.target.value,
                      })
                    }
                    disabled={teacherMustBeSelectedFirst}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none ${
                      teacherMustBeSelectedFirst ? "opacity-60" : ""
                    }`}
                  >
                    {["A", "B", "C", "D", "E"].map((section) => (
                      <option key={section} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Strand
                  </label>
                  {editingClass.gradeLevel === "Grade 11" ||
                  editingClass.gradeLevel === "Grade 12" ? (
                    <select
                      value={editingClass.strand ?? ""}
                      onChange={(e) =>
                        setEditingClass({
                          ...editingClass,
                          strand: e.target.value,
                        })
                      }
                      disabled={teacherMustBeSelectedFirst}
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none ${
                        teacherMustBeSelectedFirst ? "opacity-60" : ""
                      }`}
                    >
                      {STRANDS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="opacity-60 text-sm text-gray-500">
                      Strand (senior only)
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Schedule
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Day combobox */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Day(s)</p>
                    <input
                      list="admin-day-opts"
                      value={scheduleDays}
                      onChange={(e) =>
                        handleScheduleChange(
                          e.target.value,
                          scheduleStart,
                          scheduleEnd,
                        )
                      }
                      disabled={teacherMustBeSelectedFirst}
                      placeholder="Mon/Wed/Fri"
                      className={`w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm ${
                        teacherMustBeSelectedFirst ? "opacity-60" : ""
                      }`}
                    />
                    <datalist id="admin-day-opts">
                      {DAY_OPTIONS.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>

                  {/* Start time combobox */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Start Time</p>
                    <input
                      list="admin-start-opts"
                      value={scheduleStart}
                      onChange={(e) =>
                        handleScheduleChange(
                          scheduleDays,
                          e.target.value,
                          scheduleEnd,
                        )
                      }
                      disabled={teacherMustBeSelectedFirst}
                      placeholder="7:30 AM"
                      className={`w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm ${
                        teacherMustBeSelectedFirst ? "opacity-60" : ""
                      }`}
                    />
                    <datalist id="admin-start-opts">
                      {TIME_SLOTS.slice(0, TIME_SLOTS.length - 1).map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>

                  {/* End time combobox */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">End Time</p>
                    <input
                      list="admin-end-opts"
                      value={scheduleEnd}
                      onChange={(e) =>
                        handleScheduleChange(
                          scheduleDays,
                          scheduleStart,
                          e.target.value,
                        )
                      }
                      disabled={teacherMustBeSelectedFirst}
                      placeholder="8:30 AM"
                      className={`w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm ${
                        teacherMustBeSelectedFirst ? "opacity-60" : ""
                      }`}
                    />
                    <datalist id="admin-end-opts">
                      {TIME_SLOTS.filter(
                        (t) =>
                          !scheduleStart ||
                          timeToMinutes(t) > timeToMinutes(scheduleStart),
                      ).map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Conflict warning */}
                {scheduleConflict && (
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{scheduleConflict}</span>
                  </div>
                )}

                {/* Preview */}
                {!scheduleConflict &&
                  scheduleDays &&
                  scheduleStart &&
                  scheduleEnd && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Preview:{" "}
                      <span className="font-medium text-gray-700">
                        {scheduleDays} {scheduleStart} – {scheduleEnd}
                      </span>
                    </p>
                  )}
              </div>

              <div className="text-sm text-gray-600 mt-2">
                Matches: <strong>{matchedStudentCount}</strong> active student
                {matchedStudentCount !== 1 ? "s" : ""} for selected{" "}
                {editingClass.gradeLevel}{" "}
                {editingClass.gradeLevel === "Grade 11" ||
                editingClass.gradeLevel === "Grade 12"
                  ? `• Section ${editingClass.section || "-"} • ${editingClass.strand || "-"}`
                  : `• Section ${editingClass.section || "-"}`}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Students
                </label>
                <input
                  type="number"
                  value={editingClass.students}
                  onChange={(e) => {
                    manualStudentsEditedRef.current = true;
                    setEditingClass({
                      ...editingClass,
                      students: parseInt(e.target.value),
                    });
                  }}
                  disabled={teacherMustBeSelectedFirst}
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none ${
                    teacherMustBeSelectedFirst ? "opacity-60" : ""
                  }`}
                  placeholder="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateClass}
                  disabled={teacherMustBeSelectedFirst && !editingClass?.id}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold ${
                    teacherMustBeSelectedFirst && !editingClass?.id
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <Check className="w-5 h-5" />
                  {editingClass.id ? "Save Changes" : "Add Class"}
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
  );
}
