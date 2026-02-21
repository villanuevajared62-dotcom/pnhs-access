-- AlterTable: Add unique constraint to prevent duplicate attendance records
-- Constraint: A student can only have one attendance record per class per day

CREATE UNIQUE INDEX "Attendance_studentId_classId_date_key" ON "Attendance"("studentId", "classId", "date");
