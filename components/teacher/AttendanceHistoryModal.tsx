"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Edit,
  Save,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";

interface AttendanceRow {
  studentId: string;
  name: string;
  status: "present" | "late" | "absent" | "excused";
  remarks?: string;
}

interface StudentRecord {
  id: string;
  name: string;
  enrolledClassIds: string[];
}

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  studentRecords: StudentRecord[];
  showToast: (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => void;
  refreshData: () => Promise<void>;
}

export default function AttendanceHistoryModal({
  isOpen,
  onClose,
  classId,
  className,
  studentRecords,
  showToast,
  refreshData,
}: AttendanceHistoryModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [pastDates, setPastDates] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Load past attendance dates for this class
  useEffect(() => {
    if (isOpen && classId) {
      loadPastDates();
    }
  }, [isOpen, classId]);

  // Load attendance when date changes
  useEffect(() => {
    if (isOpen && classId && selectedDate) {
      loadAttendanceForDate();
    }
  }, [isOpen, classId, selectedDate]);

  const loadPastDates = async () => {
    try {
      const res = await fetch(`/api/attendance?classId=${classId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // Extract unique dates
        const dateStrings = data.map((d: any) => d.date.split("T")[0]);
        const uniqueDates = [...new Set(dateStrings as string[])]
          .sort()
          .reverse();
        setPastDates(uniqueDates);
      }
    } catch (e) {
      console.error("Failed to load past dates:", e);
    }
  };

  const loadAttendanceForDate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance?classId=${classId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const allData = await res.json();
        // Filter by selected date
        const dateData = allData.filter(
          (d: any) => d.date.split("T")[0] === selectedDate,
        );

        // Get enrolled students for this class
        const enrolledStudents = studentRecords.filter((s) =>
          s.enrolledClassIds.includes(classId),
        );

        // Create attendance rows with existing data or defaults
        const rows = enrolledStudents.map((student) => {
          const existingAttendance = dateData.find(
            (a: any) => a.studentId === student.id,
          );
          return {
            studentId: student.id,
            name: student.name,
            status: (existingAttendance?.status as any) || "present",
            remarks: existingAttendance?.remarks || "",
          };
        });

        setAttendanceRows(rows);
      }
    } catch (e) {
      console.error("Failed to load attendance:", e);
      showToast("Failed to load attendance data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const saveAttendance = async () => {
    try {
      const results = await Promise.all(
        attendanceRows.map(async (student) => {
          // Check if attendance already exists for this student/date
          const checkRes = await fetch(
            `/api/attendance?studentId=${student.studentId}&classId=${classId}`,
            { credentials: "include" },
          );

          let existingId: string | null = null;
          if (checkRes.ok) {
            const existingData = await checkRes.json();
            const existing = existingData.find(
              (d: any) => d.date.split("T")[0] === selectedDate,
            );
            existingId = existing?.id;
          }

          if (existingId) {
            // Update existing record
            const res = await fetch(`/api/attendance/${existingId}`, {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: student.status,
                remarks: student.remarks,
              }),
            });
            return { ok: res.ok };
          } else {
            // Create new record
            const res = await fetch("/api/attendance", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentId: student.studentId,
                classId: classId,
                date: new Date(selectedDate).toISOString(),
                status: student.status,
                remarks: student.remarks,
              }),
            });
            return { ok: res.ok };
          }
        }),
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        showToast(
          `Saved ${results.length - failed.length}/${results.length} records`,
          "warning",
        );
      } else {
        showToast("Attendance saved successfully", "success");
      }

      setIsEditing(false);
      await loadPastDates();
      await refreshData();
    } catch (e) {
      console.error("Failed to save attendance:", e);
      showToast("Failed to save attendance records", "error");
    }
  };

  const updateStatus = (studentId: string, status: string) => {
    setAttendanceRows((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, status: status as any } : row,
      ),
    );
  };

  const updateRemarks = (studentId: string, remarks: string) => {
    setAttendanceRows((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, remarks } : row,
      ),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700 border-green-300";
      case "late":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "absent":
        return "bg-red-100 text-red-700 border-red-300";
      case "excused":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusStats = () => {
    const present = attendanceRows.filter((r) => r.status === "present").length;
    const late = attendanceRows.filter((r) => r.status === "late").length;
    const absent = attendanceRows.filter((r) => r.status === "absent").length;
    const excused = attendanceRows.filter((r) => r.status === "excused").length;
    return { present, late, absent, excused, total: attendanceRows.length };
  };

  if (!isOpen) return null;

  const stats = getStatusStats();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-green-900">
              Attendance History
            </h3>
            <p className="text-sm text-gray-600 mt-1">{className}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Date
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsEditing(false);
              }}
              max={new Date().toISOString().split("T")[0]}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={loadAttendanceForDate}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Past Dates Quick Access */}
        {pastDates.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Past Attendance Dates
            </label>
            <div className="flex flex-wrap gap-2">
              {pastDates.slice(0, 10).map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setIsEditing(false);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    date === selectedDate
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-green-100"
                  }`}
                >
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          <div className="p-3 bg-green-50 rounded-lg text-center border-l-4 border-green-500">
            <div className="font-bold text-green-600 text-lg">
              {stats.present}
            </div>
            <div className="text-xs text-gray-600">Present</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg text-center border-l-4 border-yellow-500">
            <div className="font-bold text-yellow-600 text-lg">
              {stats.late}
            </div>
            <div className="text-xs text-gray-600">Late</div>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center border-l-4 border-red-500">
            <div className="font-bold text-red-600 text-lg">{stats.absent}</div>
            <div className="text-xs text-gray-600">Absent</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center border-l-4 border-blue-500">
            <div className="font-bold text-blue-600 text-lg">
              {stats.excused}
            </div>
            <div className="text-xs text-gray-600">Excused</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center border-l-4 border-gray-400">
            <div className="font-bold text-gray-600 text-lg">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading attendance...</p>
          </div>
        ) : (
          /* Attendance Table */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700">
                    Student
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700">
                    Remarks
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.map((row) => (
                  <tr
                    key={row.studentId}
                    className="border-t border-green-100 hover:bg-gray-50"
                  >
                    <td className="px-3 py-3 text-sm text-gray-900 font-medium">
                      {row.name}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={row.status}
                        onChange={(e) =>
                          updateStatus(row.studentId, e.target.value)
                        }
                        className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${getStatusColor(row.status)}`}
                      >
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.remarks || ""}
                        onChange={(e) =>
                          updateRemarks(row.studentId, e.target.value)
                        }
                        placeholder="Add remarks..."
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(row.studentId, "present")}
                          className={`p-1.5 rounded transition-colors ${
                            row.status === "present"
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-green-200"
                          }`}
                          title="Mark Present"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(row.studentId, "late")}
                          className={`p-1.5 rounded transition-colors ${
                            row.status === "late"
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-yellow-200"
                          }`}
                          title="Mark Late"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(row.studentId, "absent")}
                          className={`p-1.5 rounded transition-colors ${
                            row.status === "absent"
                              ? "bg-red-500 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-red-200"
                          }`}
                          title="Mark Absent"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {attendanceRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No students found for this class</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Close
          </button>
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadAttendanceForDate();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveAttendance}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Attendance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
