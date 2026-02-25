# Student Data Flow - Problems Identified

## Executive Summary

After analyzing the codebase, I found **8 major problems** with how students receive class and subject data in the PNHS Access system.

---

## PROBLEMS DETAILED

### 1. **Subjects API - Returns ALL Subjects to ALL Users (Security & Data Leakage)**

**File:** `app/api/subjects/route.ts`

```
typescript
// PROBLEM: Returns ALL subjects to ANY authenticated user
const items = await prisma.subject.findMany({ orderBy: { name: "asc" } });
```

**Issue:** Students see ALL subjects in the system, not just the ones they're enrolled in.

---

### 2. **Classes API - Missing `subject` Field in Response**

**File:** `app/api/classes/route.ts`

```
typescript
// Current response - missing subject field!
const out = items.map((c) => ({
  ...c,
  students: (c as any)._count?.enrollments ?? c.students ?? 0,
  teacherName: (c as any).teacher || "",
  // ❌ MISSING: subject field!
}));
```

**Impact:** Students cannot see which SUBJECT their class is about.

---

### 3. **Inconsistent Class Interface in Shared Data**

**File:** `lib/shared-data.ts`

```
typescript
// Class interface is incomplete - missing subject field!
export interface Class {
  id: string;
  name: string;
  teacher: string;
  // ❌ Missing: subject field!
}
```

---

### 4. **Enrollment Response - Incomplete Class Data**

**File:** `app/api/enrollments/route.ts`

When students fetch their enrollments, the class data returned lacks critical information:

- Missing `subject` field
- Missing proper `teacherName`
- Missing `schedule` details

---

### 5. **Grades Not Properly Linked to Subjects**

**File:** `app/api/grades/route.ts`

```
typescript
// Student sees grades but can't correlate to subjects:
{
  name: g.subjectId || `Subject ${copy.length + 1}`,  // Uses ID as fallback name!
  grade: "92",
  // ❌ No proper subject name shown
}
```

**Issue:** Grade model has `subjectId` but API doesn't join with Subject table.

---

### 6. **Attendance Records - No Subject Information**

**File:** `app/student/dashboard/page.tsx`

```
typescript
// Attendance grouped by classId but shows:
{
  id: "class-id",
  name: "Subject 1",  // ❌ Just a fallback name!
  attendanceRecords: { present: 19, late: 1, absent: 0 },
}
```

---

### 7. **Silent API Failures - No Error Feedback**

Multiple API calls fail silently:

```
typescript
if (!res.ok) {
  setSubjects([]);  // ❌ Silent failure - student sees empty list
  return;
}
```

---

### 8. **Multiple Redundant Data Sources**

Student dashboard makes multiple separate API calls:

1. `loadEnrollments()` → Gets enrollments
2. `loadClasses()` → Gets classes separately
3. `loadGrades()` → Gets grades
4. `loadAttendance()` → Gets attendance

**Problem:** If data is inconsistent between sources, students see confusing information.

---

## IMPACT SUMMARY

| #   | Problem                          | Severity | User Impact                   |
| --- | -------------------------------- | -------- | ----------------------------- |
| 1   | All subjects exposed to students | HIGH     | Data leakage                  |
| 2   | Missing subject in class data    | MEDIUM   | Can't identify subject        |
| 3   | Incomplete TypeScript interface  | MEDIUM   | Type errors                   |
| 4   | Incomplete enrollment data       | MEDIUM   | Missing details               |
| 5   | Grades not linked to subjects    | MEDIUM   | Can't identify graded subject |
| 6   | Attendance lacks subject info    | MEDIUM   | Can't identify attendance     |
| 7   | Silent API failures              | LOW      | Poor UX                       |
| 8   | Redundant data sources           | LOW      | Potential inconsistency       |

---

## RECOMMENDED FIXES

### Fix 1: Secure Subjects API

Filter subjects based on student's enrolled classes.

### Fix 2: Include Subject in Class Response

Update `app/api/classes/route.ts` to field.

### Fix include `subject` 3: Update Class Interface

Add `subject` field to `lib/shared-data.ts` Class interface.

### Fix 4: Enhance Enrollment Response

Include full class details including subject, teacherName, schedule.

### Fix 5: Link Grades with Subjects

Join Grade table with Subject table in API.

### Fix 6: Add Subject to Attendance

Include subject information when grouping attendance.

### Fix 7: Add Error Feedback

Show proper error messages when API calls fail.

### Fix 8: Unify Data Flow

Create a single endpoint that returns all student data at once.

---

_Analysis completed: February 2026_
_System: PNHS Access - Student Data Flow_
