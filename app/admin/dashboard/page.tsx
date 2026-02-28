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
  RefreshCw,
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
  const parseGradeLevelNumber = (value: string): number | null => {
    const m = String(value || "").match(/grade\s*(\d+)/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };
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

  const [studentSelectedClassIds, setStudentSelectedClassIds] = useState<
    string[]
  >([]);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "success",
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [finalizePeriodByClassId, setFinalizePeriodByClassId] = useState<
    Record<string, string>
  >({});
  const [finalizeStatusByKey, setFinalizeStatusByKey] = useState<
    Record<string, { approved: boolean; approvedAt: string | null }>
  >({});
  const [finalizingKey, setFinalizingKey] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    schoolName: "PNHS",
    schoolYear: "2025-2026",
    emailNotifications: true,
    smsNotifications: false,
    classNotifications: true,
  });

  const [matchedStudentCount, setMatchedStudentCount] = useState<number>(0);
  const lastAutoAppliedMatchedRef = useRef<number | null>(null);
  const manualStudentsEditedRef = useRef<boolean>(false);
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

  const getFinalizeOptionsForClass = (cls: Class) => {
    const gradeNum = parseGradeLevelNumber(cls.gradeLevel) ?? 0;
    if (gradeNum >= 11) {
      return [
        { value: "S1", label: "Semester 1 (S1)" },
        { value: "S2", label: "Semester 2 (S2)" },
      ];
    }
    return [
      { value: "Q1", label: "Quarter 1 (Q1)" },
      { value: "Q2", label: "Quarter 2 (Q2)" },
      { value: "Q3", label: "Quarter 3 (Q3)" },
      { value: "Q4", label: "Quarter 4 (Q4)" },
    ];
  };

  const getSelectedFinalizePeriod = (cls: Class) => {
    const saved = String(finalizePeriodByClassId[String(cls.id)] || "").trim();
    if (saved) return saved;
    const opts = getFinalizeOptionsForClass(cls);
    return opts[0]?.value || "Q1";
  };

  const ensureFinalizeStatus = async (classId: string, period: string) => {
    const key = `${classId}:${period}`;
    if (finalizeStatusByKey[key]) return finalizeStatusByKey[key];
    const res = await fetch(
      `/api/grades/finalize?classId=${encodeURIComponent(classId)}&period=${encodeURIComponent(period)}`,
      { credentials: "include" },
    );
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return null;
    }
    if (!res.ok) return null;
    const body = await res.json().catch(() => ({}));
    const next = {
      approved: Boolean(body?.approved),
      approvedAt: body?.approvedAt ? String(body.approvedAt) : null,
    };
    setFinalizeStatusByKey((prev) => ({ ...prev, [key]: next }));
    return next;
  };

  const handleFinalizeGrades = async (cls: Class) => {
    const period = getSelectedFinalizePeriod(cls);
    const gradeNum = parseGradeLevelNumber(cls.gradeLevel) ?? 0;
    const isSeniorHigh = gradeNum >= 11;

    // For SHS, we need to finalize both quarters in the semester
    let periodsToFinalize: string[] = [];
    if (isSeniorHigh && period === "S1") {
      periodsToFinalize = ["Q1", "Q2"];
    } else if (isSeniorHigh && period === "S2") {
      periodsToFinalize = ["Q3", "Q4"];
    } else {
      periodsToFinalize = [period];
    }

    if (finalizingKey) return;
    try {
      // Finalize all required periods
      for (const p of periodsToFinalize) {
        const key = `${cls.id}:${p}`;
        setFinalizingKey(key);
        const res = await fetch("/api/grades/finalize", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId: cls.id, period: p }),
        });
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          showToast(
            body.message || `Failed to finalize grades for ${p}`,
            "error",
          );
          setFinalizingKey(null);
          return;
        }
        setFinalizeStatusByKey((prev) => ({
          ...prev,
          [key]: { approved: true, approvedAt: new Date().toISOString() },
        }));
      }

      // Show success message
      if (isSeniorHigh) {
        showToast(
          `Grades finalized for Semester ${period === "S1" ? "1" : "2"} (${periodsToFinalize.join(" & ")})`,
          "success",
        );
      } else {
        showToast(`Grades finalized for ${period}`, "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to finalize grades", "error");
    } finally {
      setFinalizingKey(null);
    }
  };

  const parseSchedule = (schedule: string) => {
    if (!schedule) return { days: "", start: "", end: "" };
    const s = schedule.trim();
    const re =
      /^(.+?)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))$/i;
    const m = s.match(re);
    if (m) return { days: m[1].trim(), start: m[2].trim(), end: m[3].trim() };
    const timeToken = s.match(/\b\d{1,2}:\d{2}\s*(AM|PM)\b/i);
    if (timeToken && timeToken.index !== undefined) {
      const days = s.slice(0, timeToken.index).trim();
      const timeStr = s.slice(timeToken.index).trim();
      const dashIdx = timeStr.indexOf(" - ");
      if (dashIdx !== -1)
        return {
          days,
          start: timeStr.slice(0, dashIdx).trim(),
          end: timeStr.slice(dashIdx + 3).trim(),
        };
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
          saveUserToStorage(sessionUser as User);
          await loadData();
          return;
        }
        const localUser = getUserFromStorage();
        if (localUser && localUser.role === "admin") {
          setUser(localUser);
          await loadData();
          return;
        }
        router.push("/login");
      } catch (e) {
        const localUser = getUserFromStorage();
        if (localUser && localUser.role === "admin") {
          setUser(localUser);
          await loadData();
          return;
        }
        router.push("/login");
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

  useEffect(() => {
    if (!showAddModal) return;
    const matching = classes
      .filter((c) => {
        const classGrade = (c.gradeLevel || "").trim();
        const formGrade = (studentForm.gradeLevel || "").trim();
        if (classGrade !== formGrade) return false;
        if (formGrade === "Grade 11" || formGrade === "Grade 12") {
          const sectionMatch =
            (c.section || "").trim().toUpperCase() ===
            (studentForm.section || "").trim().toUpperCase();
          const strandMatch =
            (c.strand || "").trim().toUpperCase() ===
            (studentForm.strand || "").trim().toUpperCase();
          return sectionMatch && strandMatch;
        }
        return (
          (c.section || "").trim().toUpperCase() ===
          (studentForm.section || "").trim().toUpperCase()
        );
      })
      .map((c) => c.id);
    setStudentSelectedClassIds(matching);
  }, [
    showAddModal,
    studentForm.gradeLevel,
    studentForm.section,
    studentForm.strand,
    classes,
  ]);

  useEffect(() => {
    if (!showAddModal) setStudentSelectedClassIds([]);
  }, [showAddModal]);

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
  }, []);

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
    manualStudentsEditedRef.current = false;
  }, [editingClass?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setStudents(studentsRes.ok ? await studentsRes.json() : []);
      setTeachers(teachersRes.ok ? await teachersRes.json() : []);
      setClasses(classesRes.ok ? await classesRes.json() : []);
      setAnnouncements(
        announcementsRes.ok ? await announcementsRes.json() : [],
      );
      if (settingsRes.ok) setSettings((await settingsRes.json()) || {});
    } catch (error) {
      console.error("Error loading data", error);
      setStudents([]);
      setTeachers([]);
      setClasses([]);
      setAnnouncements([]);
    }
  };

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
      const dates = rows.map((r: any) => new Date(r.date));
      const from = dates.length
        ? new Date(Math.min(...dates)).toISOString().slice(0, 10)
        : undefined;
      const to = dates.length
        ? new Date(Math.max(...dates)).toISOString().slice(0, 10)
        : undefined;
      setShowStudentAttendance({ student, rows, from, to });
    } catch (e) {
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
      return (await res.json()) as Attendance[];
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
    } catch (e) {}
    removeUserFromStorage();
    router.push("/login");
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
      if (studentSelectedClassIds.length > 0) {
        await Promise.all(
          studentSelectedClassIds.map((classId) =>
            fetch("/api/enrollments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ studentId: newStudent.id, classId }),
            }),
          ),
        );
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
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    try {
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
      if (
        editingStudent.password &&
        editingStudent.password !== "" &&
        !editingStudent.password.startsWith("$2")
      )
        payload.password = editingStudent.password;
      const juniorSections = ["A", "B", "C", "D", "E"];
      if (
        editingStudent.gradeLevel !== "Grade 11" &&
        editingStudent.gradeLevel !== "Grade 12"
      ) {
        if (!juniorSections.includes(payload.section)) payload.section = "A";
        payload.strand = "";
      }
      const idForUrl =
        editingStudent.id ||
        students.find((s) => s.studentId === editingStudent.studentId)?.id;
      if (!idForUrl) {
        showToast("Failed to update student: missing identifier", "error");
        return;
      }
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
      showToast("An error occurred while updating the student.", "error");
    }
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editingTeacher.email)) {
          showToast("Please enter a valid email address", "warning");
          return;
        }
        const subjects = editingTeacher.subjects || [];
        const payload: any = {
          ...editingTeacher,
          subjects,
          email: editingTeacher.email.trim().toLowerCase(),
          name: editingTeacher.name.trim(),
        };
        if (typeof payload.__newSubject !== "undefined")
          delete payload.__newSubject;
        if (payload.username) payload.username = payload.username.trim();
        if (payload.password === "") delete payload.password;
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

  const handleNavigation = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined" && window.innerWidth < 1024)
      setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "announcements":
        return (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900">
                Announcements Management
              </h2>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> New Announcement
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
                    className={`bg-white rounded-2xl shadow-md p-4 md:p-6 border-l-4 ${announcement.type === "info" ? "border-blue-500" : announcement.type === "warning" ? "border-yellow-500" : "border-green-500"}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base md:text-lg font-bold text-gray-900 break-words">
                            {announcement.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${announcement.type === "info" ? "bg-blue-100 text-blue-700" : announcement.type === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                          >
                            {announcement.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm md:text-base text-gray-700 mb-3">
                          {announcement.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-500">
                          <span>By: {announcement.author}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatDate(announcement.date)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteAnnouncement(announcement.id)
                        }
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors self-start"
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900">
                Students Management
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex-1 sm:flex-none"
                >
                  <Plus className="w-4 h-4" /> Add Student
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden">
              <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                <table className="w-full" style={{ minWidth: "600px" }}>
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-green-900 whitespace-nowrap">
                        Student ID
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-green-900 whitespace-nowrap">
                        Name
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-green-900 whitespace-nowrap hidden sm:table-cell">
                        Email
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-green-900 whitespace-nowrap hidden md:table-cell">
                        Username
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-green-900 whitespace-nowrap">
                        Grade
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-green-900 whitespace-nowrap hidden sm:table-cell">
                        Section
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-green-900 whitespace-nowrap hidden md:table-cell">
                        Strand
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-semibold text-green-900 whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
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
                          <td className="px-3 md:px-6 py-3 text-xs text-gray-900 font-mono whitespace-nowrap">
                            {student.studentId}
                          </td>
                          <td className="px-3 md:px-6 py-3 text-xs text-gray-900">
                            <button
                              onClick={() => openStudentAttendance(student)}
                              className="text-left text-green-700 hover:underline font-medium"
                            >
                              {student.name}
                            </button>
                          </td>
                          <td className="px-3 md:px-6 py-3 text-xs text-gray-600 hidden sm:table-cell max-w-[150px] truncate">
                            {student.email}
                          </td>
                          <td className="px-3 md:px-6 py-3 text-xs text-gray-900 font-mono hidden md:table-cell">
                            {student.username}
                          </td>
                          <td className="px-3 md:px-6 py-3 text-xs text-gray-900 whitespace-nowrap">
                            {student.gradeLevel}
                          </td>
                          <td className="px-3 md:px-6 py-3 text-xs text-gray-900 hidden sm:table-cell">
                            {student.section || "-"}
                          </td>
                          <td className="px-3 md:px-6 py-3 text-xs text-gray-900 hidden md:table-cell">
                            {student.strand || "-"}
                          </td>
                          <td className="px-3 md:px-6 py-3 text-xs">
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  setEditingStudent({
                                    ...student,
                                    password: "",
                                  })
                                }
                                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900">
                Teachers Management
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() =>
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
                    } as any)
                  }
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex-1 sm:flex-none"
                >
                  <Plus className="w-4 h-4" /> Add Teacher
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>
            <div className="grid gap-4">
              {filteredTeachers.length === 0 ? (
                <div className="bg-purple-50 rounded-2xl p-8 text-center border-2 border-dashed border-purple-300">
                  <GraduationCap className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No teachers found</p>
                </div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-green-100"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex gap-3 md:gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {teacher.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {teacher.name}
                          </h3>
                          <p className="text-xs text-gray-600 break-all">
                            {teacher.email}
                          </p>
                          {teacher.username && (
                            <p className="text-xs text-gray-600 mt-1">
                              Username:{" "}
                              <span className="font-mono text-gray-800">
                                {teacher.username}
                              </span>
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {teacher.department}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {teacher.subjects.map((subject, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium"
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
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
                      <span className="text-gray-600">
                        Students:{" "}
                        <span className="font-semibold text-gray-900">
                          {teacher.students}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Status:{" "}
                        <span
                          className={`font-semibold ${teacher.status === "active" ? "text-green-600" : "text-gray-600"}`}
                        >
                          {teacher.status}
                        </span>
                      </span>
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-green-900">
                Classes Management
              </h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => {
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
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex-1 sm:flex-none"
                >
                  <Plus className="w-4 h-4" /> Add Class
                </button>
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex-1 sm:flex-none"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.length === 0 ? (
                <div className="md:col-span-2 bg-indigo-50 rounded-2xl p-8 text-center border-2 border-dashed border-indigo-300">
                  <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No classes yet</p>
                </div>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-green-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 flex-1 mr-3">
                        <h3 className="text-lg font-bold text-gray-900 break-words">
                          {cls.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Teacher: {cls.teacher}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
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
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span>{cls.students} students</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="break-words">{cls.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4 flex-shrink-0" />
                        <span>{cls.room}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <GraduationCap className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {cls.gradeLevel} • Sec {cls.section}
                        </span>
                      </div>
                      {(cls.gradeLevel === "Grade 11" ||
                        cls.gradeLevel === "Grade 12") &&
                        cls.strand && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span>{cls.strand}</span>
                          </div>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            Finalize Grades
                          </p>
                          <p className="text-xs text-gray-500">
                            Required before students can download report cards.
                          </p>
                        </div>
                        {(() => {
                          const period = getSelectedFinalizePeriod(cls);
                          const status =
                            finalizeStatusByKey[`${cls.id}:${period}`];
                          const approved = status?.approved;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}
                            >
                              {approved ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5" />
                              )}
                              {approved ? "Finalized" : "Not Finalized"}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col xs:flex-row gap-2">
                        <select
                          value={getSelectedFinalizePeriod(cls)}
                          onChange={(e) =>
                            setFinalizePeriodByClassId((prev) => ({
                              ...prev,
                              [String(cls.id)]: e.target.value,
                            }))
                          }
                          onFocus={() =>
                            void ensureFinalizeStatus(
                              String(cls.id),
                              getSelectedFinalizePeriod(cls),
                            )
                          }
                          disabled={finalizingKey !== null}
                          className="flex-1 min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50"
                        >
                          {getFinalizeOptionsForClass(cls).map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void ensureFinalizeStatus(
                                String(cls.id),
                                getSelectedFinalizePeriod(cls),
                              )
                            }
                            disabled={finalizingKey !== null}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm inline-flex items-center justify-center gap-1 flex-1 xs:flex-none"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span className="xs:hidden">Check</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleFinalizeGrades(cls)}
                            disabled={finalizingKey !== null}
                            className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm inline-flex items-center justify-center gap-1 disabled:bg-green-400 flex-1 xs:flex-none"
                          >
                            {finalizingKey ===
                            `${cls.id}:${getSelectedFinalizePeriod(cls)}` ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span>Finalize</span>
                          </button>
                        </div>
                      </div>
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
            <h2 className="text-xl sm:text-2xl font-bold text-green-900 mb-6">
              Reports & Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Student Performance
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Excellent (90-100)",
                      pct: 45,
                      color: "bg-green-600",
                      textColor: "text-green-600",
                    },
                    {
                      label: "Good (80-89)",
                      pct: 35,
                      color: "bg-blue-600",
                      textColor: "text-blue-600",
                    },
                    {
                      label: "Average (70-79)",
                      pct: 15,
                      color: "bg-yellow-600",
                      textColor: "text-yellow-600",
                    },
                    {
                      label: "Below Average (<70)",
                      pct: 5,
                      color: "bg-red-600",
                      textColor: "text-red-600",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">
                          {item.label}
                        </span>
                        <span
                          className={`font-semibold ${item.textColor} text-sm`}
                        >
                          {item.pct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${item.pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  System Statistics
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Total Students",
                      val: students.length,
                      bg: "bg-green-50",
                      color: "text-green-600",
                    },
                    {
                      label: "Total Teachers",
                      val: teachers.length,
                      bg: "bg-emerald-50",
                      color: "text-emerald-600",
                    },
                    {
                      label: "Total Classes",
                      val: classes.length,
                      bg: "bg-teal-50",
                      color: "text-teal-600",
                    },
                    {
                      label: "Announcements",
                      val: announcements.length,
                      bg: "bg-blue-50",
                      color: "text-blue-600",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex justify-between items-center p-3 ${item.bg} rounded-lg`}
                    >
                      <span className="text-sm text-gray-700">
                        {item.label}
                      </span>
                      <span className={`text-xl font-bold ${item.color}`}>
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-900 mb-6">
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
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full sm:w-auto"
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
                  {[
                    {
                      label: "Email notifications for new enrollments",
                      key: "emailNotifications" as const,
                    },
                    {
                      label: "Daily attendance reports",
                      key: "classNotifications" as const,
                    },
                    {
                      label: "Grade submission reminders",
                      key: "smsNotifications" as const,
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(settings as any)[item.key] || false}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSaveSettings}
                  className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full sm:w-auto"
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-md p-3 md:p-6 border border-green-100 hover:border-teal-400 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${stat.color} p-2 md:p-4 rounded-xl`}>
                      <stat.icon className="w-4 h-4 md:w-7 md:h-7 text-white" />
                    </div>
                    <span className="text-green-600 font-semibold text-xs">
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-xs font-medium text-gray-600 mb-1 leading-tight">
                    {stat.label}
                  </h3>
                  <p className="text-xl md:text-3xl font-bold text-teal-800">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-green-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
                {[
                  {
                    key: "announcements",
                    icon: Bell,
                    title: "Announcements",
                    sub: "Post updates & news",
                    gradient: "from-blue-600 to-blue-700",
                    textColor: "text-blue-100",
                  },
                  {
                    key: "students",
                    icon: UserPlus,
                    title: "Manage Students",
                    sub: "View all students",
                    gradient: "from-teal-700 to-green-700",
                    textColor: "text-teal-100",
                  },
                  {
                    key: "teachers",
                    icon: GraduationCap,
                    title: "Manage Teachers",
                    sub: "View all teachers",
                    gradient: "from-emerald-700 to-green-700",
                    textColor: "text-emerald-100",
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleNavigation(item.key)}
                    className={`bg-gradient-to-r ${item.gradient} text-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-3 md:gap-5 text-left`}
                  >
                    <item.icon className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate">
                        {item.title}
                      </h3>
                      <p className={`${item.textColor} text-xs mt-1`}>
                        {item.sub}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-7 border border-green-100">
              <h2 className="text-lg font-bold text-green-900 mb-4 md:mb-6">
                Recent Announcements
              </h2>
              <div className="space-y-3">
                {announcements.slice(0, 5).map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between py-3 border-b last:border-b-0 hover:bg-green-50 px-3 rounded-lg gap-2"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${announcement.type === "success" ? "bg-green-500" : announcement.type === "warning" ? "bg-yellow-500" : "bg-blue-500"}`}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {announcement.message.substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
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
        <div className="fixed top-4 right-4 z-[100] max-w-xs sm:max-w-sm">
          <div
            className={`rounded-xl shadow-xl border px-4 py-3 text-sm font-medium whitespace-pre-line ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" : toast.type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}
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

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-green-900 to-green-800 text-white transition-all duration-300 z-50 shadow-2xl ${sidebarOpen ? "w-64 sm:w-72" : "w-0 lg:w-20"} overflow-hidden`}
      >
        <div className="p-4 sm:p-6 h-full flex flex-col">
          <div
            className={`flex items-center mb-8 sm:mb-10 ${sidebarOpen ? "justify-between" : "justify-center"}`}
          >
            <div
              className={`flex items-center gap-3 ${!sidebarOpen && "justify-center"}`}
            >
              <div
                className={`flex items-center justify-center rounded-xl overflow-hidden shadow-lg flex-shrink-0 ${sidebarOpen ? "w-10 h-10" : "w-10 h-10"}`}
              >
                <img
                  src="/pnhs-logo.png"
                  alt="PNHS Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-lg sm:text-xl">PNHS</h1>
                  <p className="text-xs text-green-200">Admin Panel</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.key)}
                className={`w-full flex items-center ${sidebarOpen ? "justify-start gap-3 px-3 sm:px-4" : "justify-center"} py-2.5 rounded-xl ${activeTab === item.key ? "bg-white/20 font-semibold" : "hover:bg-white/10 text-green-100"} ${!sidebarOpen && "hidden lg:flex"}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm truncate">{item.label}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="border-t border-white/15 pt-4">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${sidebarOpen ? "gap-3 px-3 sm:px-4" : "justify-center"} py-2.5 rounded-xl hover:bg-white/10 text-green-100 ${!sidebarOpen && "hidden lg:flex"}`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-72" : "lg:ml-20"} ml-0`}
      >
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40 border-b border-green-100">
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="flex-1 max-w-xs sm:max-w-md md:max-w-2xl mx-2 hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === "students" && (
                  <div className="relative hidden sm:block">
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none text-sm"
                    >
                      <option value="all">All Grades</option>
                      {[
                        "Grade 7",
                        "Grade 8",
                        "Grade 9",
                        "Grade 10",
                        "Grade 11",
                        "Grade 12",
                      ].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
                <button className="relative p-2 hover:bg-gray-100 rounded-full">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-br from-green-800 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
                  {user?.fullName?.charAt(0) || "A"}
                </div>
              </div>
            </div>
            {/* Mobile search */}
            <div className="mt-2 sm:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 md:p-6 lg:p-8">{renderContent()}</main>
      </div>

      {/* Student Attendance Modal */}
      {showStudentAttendance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h3 className="text-lg md:text-2xl font-bold text-green-900 truncate mr-3">
                {showStudentAttendance.student.name} — Attendance
              </h3>
              <button
                onClick={() => setShowStudentAttendance(null)}
                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 gap-3">
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm self-end"
                >
                  Refresh
                </button>
              </div>
              {(() => {
                const rows = showStudentAttendance.rows || [];
                const total = rows.length;
                const present = rows.filter(
                  (r) => r.status === "present",
                ).length;
                const late = rows.filter((r) => r.status === "late").length;
                const absent = rows.filter((r) => r.status === "absent").length;
                const percent = total
                  ? `${Math.round(((present + late * 0.5) / total) * 100)}%`
                  : "0%";
                return (
                  <>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {percent}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        Overall Attendance Rate
                      </div>
                      <div className="text-sm text-gray-600">
                        {showStudentAttendance.student.gradeLevel} • Section{" "}
                        {showStudentAttendance.student.section}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">
                          {present}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Present
                        </div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-xl">
                        <div className="text-2xl font-bold text-yellow-600">
                          {late}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Late</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-xl">
                        <div className="text-2xl font-bold text-red-600">
                          {absent}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Absent</div>
                      </div>
                    </div>
                  </>
                );
              })()}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm">
                  Daily records
                </h4>
                <div className="space-y-2">
                  {(showStudentAttendance.rows || []).map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${row.status === "present" ? "bg-green-500" : row.status === "late" ? "bg-yellow-500" : "bg-red-500"}`}
                        />
                        <div className="text-gray-900 text-xs">
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
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === "present" ? "bg-green-100 text-green-700" : row.status === "late" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                      >
                        {row.status.charAt(0).toUpperCase() +
                          row.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowStudentAttendance(null)}
                className="w-full py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-900">
                New Announcement
              </h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none resize-none"
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
                      type: e.target.value as any,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                >
                  <option value="info">Information</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddAnnouncement}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm"
                >
                  <Send className="w-4 h-4" /> Publish
                </button>
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-900">
                Add New Student
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: "Full Name *",
                  type: "text",
                  field: "name",
                  placeholder: "Enter student name",
                },
                {
                  label: "Email *",
                  type: "email",
                  field: "email",
                  placeholder: "student@pnhs.edu.ph",
                },
                {
                  label: "Username *",
                  type: "text",
                  field: "username",
                  placeholder: "Login username",
                },
                {
                  label: "Password *",
                  type: "password",
                  field: "password",
                  placeholder: "Login password",
                },
              ].map((item) => (
                <div key={item.field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {item.label}
                  </label>
                  <input
                    type={item.type}
                    value={(studentForm as any)[item.field]}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        [item.field]: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Grade
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
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                  >
                    {[
                      "Grade 7",
                      "Grade 8",
                      "Grade 9",
                      "Grade 10",
                      "Grade 11",
                      "Grade 12",
                    ].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                  >
                    {["A", "B", "C", "D", "E"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm disabled:opacity-60"
                  >
                    <option value="">(none)</option>
                    {STRANDS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subjects
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-md p-3 bg-gray-50">
                  {(() => {
                    const filteredClasses = classes.filter((c) => {
                      if (c.gradeLevel !== studentForm.gradeLevel) return false;
                      if (
                        studentForm.gradeLevel === "Grade 11" ||
                        studentForm.gradeLevel === "Grade 12"
                      ) {
                        return (
                          (c.section || "").toUpperCase() ===
                            (studentForm.section || "").toUpperCase() &&
                          (c.strand || "").toUpperCase() ===
                            (studentForm.strand || "").toUpperCase()
                        );
                      }
                      return (c.section || "") === (studentForm.section || "");
                    });
                    if (filteredClasses.length === 0)
                      return (
                        <p className="text-xs text-gray-500">
                          No matching subjects.
                        </p>
                      );
                    return filteredClasses.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={studentSelectedClassIds.includes(c.id)}
                          onChange={(e) => {
                            setStudentSelectedClassIds((cur) =>
                              e.target.checked
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                  placeholder="Leave blank to auto-generate"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddStudent}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Student
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-900">Edit Student</h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-5 h-5" />
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-sm"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Grade
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
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                  >
                    {[
                      "Grade 7",
                      "Grade 8",
                      "Grade 9",
                      "Grade 10",
                      "Grade 11",
                      "Grade 12",
                    ].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                  >
                    {["A", "B", "C", "D", "E"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                  >
                    <option value="">(none)</option>
                    {STRANDS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleUpdateStudent}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-900">
                {editingTeacher.id ? "Edit Teacher" : "Add Teacher"}
              </h3>
              <button
                onClick={() => setEditingTeacher(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: "Full Name *",
                  type: "text",
                  field: "name",
                  placeholder: "Enter teacher name",
                },
                {
                  label: "Email *",
                  type: "email",
                  field: "email",
                  placeholder: "teacher@pnhs.edu.ph",
                },
                {
                  label: "Username",
                  type: "text",
                  field: "username",
                  placeholder: "Login username",
                },
                {
                  label: "Password",
                  type: "password",
                  field: "password",
                  placeholder: "Login password",
                },
                {
                  label: "Department",
                  type: "text",
                  field: "department",
                  placeholder: "e.g., Mathematics",
                },
              ].map((item) => (
                <div key={item.field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {item.label}
                  </label>
                  <input
                    type={item.type}
                    value={(editingTeacher as any)[item.field] || ""}
                    onChange={(e) =>
                      setEditingTeacher({
                        ...(editingTeacher as any),
                        [item.field]: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                    placeholder={item.placeholder}
                  />
                </div>
              ))}
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
                        if (!val) return;
                        const existing = (editingTeacher.subjects ||
                          []) as string[];
                        if (!existing.includes(val)) {
                          setEditingTeacher({
                            ...(editingTeacher as any),
                            subjects: [...existing, val],
                            __newSubject: "",
                          } as any);
                        } else {
                          setEditingTeacher({
                            ...(editingTeacher as any),
                            __newSubject: "",
                          } as any);
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                    placeholder="Type subject & press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (
                        (editingTeacher as any).__newSubject || ""
                      ).trim();
                      if (!val) return;
                      const existing = (editingTeacher.subjects ||
                        []) as string[];
                      if (!existing.includes(val))
                        setEditingTeacher({
                          ...(editingTeacher as any),
                          subjects: [...existing, val],
                          __newSubject: "",
                        } as any);
                    }}
                    className="px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 hover:bg-green-100 text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  {(editingTeacher.subjects || []).map((sub, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTeacher({
                            ...(editingTeacher as any),
                            subjects: (editingTeacher.subjects || []).filter(
                              (s) => s !== sub,
                            ),
                          } as any)
                        }
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleUpdateTeacher}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold text-sm"
                >
                  <Check className="w-4 h-4" />{" "}
                  {editingTeacher.id ? "Save Changes" : "Add Teacher"}
                </button>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-900">
                {editingClass.id ? "Edit Class" : "Add Class"}
              </h3>
              <button
                onClick={() => setEditingClass(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XIcon className="w-5 h-5" />
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm disabled:opacity-60"
                  placeholder="e.g., Grade 10 - Mathematics"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Grade
                  </label>
                  <select
                    value={editingClass.gradeLevel}
                    onChange={(e) => {
                      const grade = e.target.value;
                      setEditingClass({
                        ...editingClass,
                        gradeLevel: grade,
                        section: "A",
                        strand:
                          grade === "Grade 11" || grade === "Grade 12"
                            ? STRANDS[0]
                            : "",
                      });
                    }}
                    disabled={teacherMustBeSelectedFirst}
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm disabled:opacity-60"
                  >
                    {[
                      "Grade 7",
                      "Grade 8",
                      "Grade 9",
                      "Grade 10",
                      "Grade 11",
                      "Grade 12",
                    ].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                    className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm disabled:opacity-60"
                  >
                    {["A", "B", "C", "D", "E"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
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
                      className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm disabled:opacity-60"
                    >
                      {STRANDS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-gray-400 py-3">
                      Senior only
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Schedule
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                      className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-xs disabled:opacity-60"
                    />
                    <datalist id="admin-day-opts">
                      {DAY_OPTIONS.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Start</p>
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
                      className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-xs disabled:opacity-60"
                    />
                    <datalist id="admin-start-opts">
                      {TIME_SLOTS.slice(0, -1).map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">End</p>
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
                      className="w-full px-2 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-xs disabled:opacity-60"
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
                {scheduleConflict && (
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{scheduleConflict}</span>
                  </div>
                )}
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
              <div className="text-sm text-gray-600">
                Matches: <strong>{matchedStudentCount}</strong> student
                {matchedStudentCount !== 1 ? "s" : ""} for{" "}
                {editingClass.gradeLevel} • Sec {editingClass.section || "-"}
                {editingClass.gradeLevel === "Grade 11" ||
                editingClass.gradeLevel === "Grade 12"
                  ? ` • ${editingClass.strand || "-"}`
                  : ""}
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none text-sm disabled:opacity-60"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleUpdateClass}
                  disabled={teacherMustBeSelectedFirst && !editingClass?.id}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm ${teacherMustBeSelectedFirst && !editingClass?.id ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
                >
                  <Check className="w-4 h-4" />{" "}
                  {editingClass.id ? "Save Changes" : "Add Class"}
                </button>
                <button
                  onClick={() => setEditingClass(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold text-sm"
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
