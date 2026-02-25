# Task: Simplify Class Dropdowns in Attendance, Grades, and Students Sections

## Goal

Change dropdown filters from detailed format (e.g., "Grade 10 - Mathematics") to simplified format:

- `Grade X - Section Y` for regular classes
- `Grade X - Section Y • Strand` for Grade 11-12 with strand

## Changes Required

### Step 1: Add helper function for simplified class labels

Location: Around line ~200 (after attendanceContextOptions declaration)

### Step 2: Update Attendance section dropdowns

Locations:

- Line ~1830: `takeAttendanceClass` select dropdown options
- Line ~1865+: Filter class select dropdown options

### Step 3: Update Grades section dropdowns

Location:

- Line ~2100+: Filter class select dropdown options

### Step 4: Update Students section dropdowns

Location:

- Line ~2300+: Filter class select dropdown options

## Implementation Plan Status

✅ User confirmed simplified format across all tabs is desired.

⏳ In Progress...

---

Last Updated: $(date)
