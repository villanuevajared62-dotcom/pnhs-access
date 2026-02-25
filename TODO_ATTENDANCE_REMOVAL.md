# TODO: Remove Attendance Edit/Set Capability from My Classes

## Task

Remove the ability to edit or set attendance from the My Classes section of the teacher dashboard.

## Changes Required

### 1. app/teacher/dashboard/page.tsx

- [ ] My Classes tab: Remove "Set Attendance" button from each class card
- [ ] My Classes tab: Remove "History" button from each class card
- [ ] Attendance tab: Remove "Take Attendance" button
- [ ] Attendance tab: Remove Quick Mark dropdown and "Save Today" button for each student
- [ ] Student Attendance History Modal: Remove edit buttons (✓, ⏱, ✗)
- [ ] Student Attendance History Modal: Remove "Add / Edit Today's Attendance" section
- [ ] Remove Take Attendance Modal functionality

### 2. components/teacher/AttendanceHistoryModal.tsx

- [ ] Remove "Edit Attendance" button
- [ ] Remove status change buttons
- [ ] Make modal read-only
