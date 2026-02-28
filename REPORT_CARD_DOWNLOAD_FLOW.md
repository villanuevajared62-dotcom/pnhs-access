# Report Card Download - Functional Flow Design

## Overview

This document describes the functional flow for downloading a student's Report Card in the PNHS ACCESS system, starting from the moment the student clicks "Download Report" in the Grades section of the Student Dashboard.

---

## Functional Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STUDENT DASHBOARD - GRADES TAB                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. STUDENT CLICKS "DOWNLOAD REPORT" BUTTON                                 │
│     - Student selects period (Quarter for Grade 7-10, Semester for 11-12)  │
│     - Button triggers downloadReport() function                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. FRONTEND API CALL                                                       │
│     - Calls: GET /api/reports/report-card?period={period}                  │
│     - Includes user session credentials                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. BACKEND - AUTHENTICATION & AUTHORIZATION                               │
│     - Validates session via getSessionUser()                                │
│     - Ensures user.role === "student"                                       │
│     - Returns 401 if unauthorized, 403 if not a student                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. BACKEND - GRADE LEVEL DETECTION                                         │
│     - Parses student.gradeLevel (e.g., "Grade 7", "Grade 11")               │
│     - Uses parseGradeLevelNumber() to extract numeric grade                 │
│     - Determines: isSeniorHigh = gradeLevel >= 11                           │
│                                                                             │
│     ┌─────────────────────┐    ┌─────────────────────┐                    │
│     │   Grade 7-10        │    │   Grade 11-12        │                    │
│     │   (Junior High)    │    │   (Senior High)      │                    │
│     ├─────────────────────┤    ├─────────────────────┤                    │
│     │ Quarterly: Q1-Q4   │    │ Semester: S1, S2    │                    │
│     │                     │    │ S1 = Q1 + Q2         │                    │
│     │                     │    │ S2 = Q3 + Q4         │                    │
│     └─────────────────────┘    └─────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. BACKEND - PERIOD VALIDATION                                             │
│     - Junior High (Grade 7-10): Only accepts Q1, Q2, Q3, Q4                │
│     - Senior High (Grade 11-12): Only accepts S1, S2                       │
│     - Returns 400 if invalid period                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. BACKEND - FETCH STUDENT ENROLLMENTS                                     │
│     - Query: prisma.enrollment.findMany()                                   │
│     - Where: { studentId: student.id, class.deletedAt: null }              │
│     - Includes class information                                            │
│     - Returns error if no active enrollments                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. BACKEND - APPROVAL VALIDATION (GRADE FINALIZATION CHECK)               │
│                                                                             │
│     For EACH enrolled class:                                                │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  isApprovedForClassPeriod(classId, period)                   │     │
│     │  - Queries: auditLog                                           │     │
│     │  - Where: { action: "grades_finalized", resource: "grades" }  │     │
│     │  - resourceId: `${classId}:${period}`                         │     │
│     │  - Returns true if audit log exists                           │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│     IF ANY CLASS IS NOT APPROVED:                                           │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  Returns 409 Conflict                                          │     │
│     │  {                                                            │     │
│     │    message: "Grades not yet finalized",                        │     │
│     │    unapprovedClasses: [{ id, name, gradeLevel, section }]    │     │
│     │  }                                                            │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│     ⚠️  BLOCKS THE PROCESS IF GRADES NOT APPROVED                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  8. BACKEND - FETCH GRADE DATA                                              │
│     - Query: prisma.grade.findMany()                                       │
│     - Where: { studentId, classId: { in: classIds } }                     │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  Junior High (Grade 7-10):                                     │     │
│     │  - quarter: period  (Q1, Q2, Q3, or Q4)                       │     │
│     ├─────────────────────────────────────────────────────────────────┤     │
│     │  Senior High (Grade 11-12):                                   │     │
│     │  - If S1: quarter: { in: ["Q1", "Q2"] }                      │     │
│     │  - If S2: quarter: { in: ["Q3", "Q4"] }                      │     │
│     └─────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  9. BACKEND - AUTO-COMPUTE GRADES                                          │
│                                                                             │
│     A. QUARTERLY GRADE (Junior High - Grade 7-10):                         │
│        ┌──────────────────────────────────────────────────────────────┐    │
│        │  For each class:                                             │    │
│        │  - Get grade for selected quarter                            │    │
│        │  - Row: { subject, grade, final }                           │    │
│        └──────────────────────────────────────────────────────────────┘    │
│                                                                             │
│     B. SEMESTER GRADE (Senior High - Grade 11-12):                         │
│        ┌──────────────────────────────────────────────────────────────┐    │
│        │  For each class:                                             │    │
│        │  - p1 = Quarter 1 (for S1) or Quarter 3 (for S2)            │    │
│        │  - p2 = Quarter 2 (for S1) or Quarter 4 (for S2)            │    │
│        │  - Semester Grade = average(p1, p2)                          │    │
│        │  - Row: { subject, p1, p2, final }                         │    │
│        └──────────────────────────────────────────────────────────────┘    │
│                                                                             │
│     C. GENERAL AVERAGE:                                                      │
│        ┌──────────────────────────────────────────────────────────────┐    │
│        │  generalAverage = average of all (final) grades              │    │
│        └──────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  10. BACKEND - GENERATE PDF REPORT CARD                                     │
│                                                                             │
│     Uses: pdf-lib library                                                   │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  A4 Page Layout (595.28 x 841.89)                              │     │
│     ├─────────────────────────────────────────────────────────────────┤     │
│     │  Header Section:                                                │     │
│     │  - School Name (from Settings)                                 │     │
│     │  - "REPORT CARD" title                                         │     │
│     │  - School Year                                                 │     │
│     ├─────────────────────────────────────────────────────────────────┤     │
│     │  Student Info Section:                                          │     │
│     │  - Student Name                                                 │     │
│     │  - Student ID                                                   │     │
│     │  - Grade / Section                                              │     │
│     │  - Strand (for Senior High only)                               │     │
│     │  - Period (Quarter X or Semester X)                           │     │
│     ├─────────────────────────────────────────────────────────────────┤     │
│     │  Grades Table:                                                  │     │
│     │                                                                 │     │
│     │  JUNIOR HIGH (Quarterly):                                      │     │
│     │  ┌──────────────┬───────┬──────────┐                         │     │
│     │  │ Subject       │ Grade │ Remarks  │                         │     │
│     │  ├──────────────┼───────┼──────────┤                         │     │
│     │  │ Math          │  85   │ Satisfactory│                       │     │
│     │  │ Science       │  92   │ Outstanding│                       │     │
│     │  └──────────────┴───────┴──────────┘                         │     │
│     │                                                                 │     │
│     │  SENIOR HIGH (Semester):                                       │     │
│     │  ┌──────────────┬───────┬───────┬────────┐                   │     │
│     │  │ Subject       │ 1st Qtr│ 2nd Qtr│Sem Avg │                   │     │
│     │  ├──────────────┼───────┼───────┼────────┤                   │     │
│     │  │ Math          │   85  │   88  │   87   │                   │     │
│     │  │ Science       │   90  │   92  │   91   │                   │     │
│     │  └──────────────┴───────┴───────┴────────┘                   │     │
│     ├─────────────────────────────────────────────────────────────────┤     │
│     │  General Average: XX                                           │     │
│     ├─────────────────────────────────────────────────────────────────┤     │
│     │  Signature Placeholders:                                        │     │
│     │  - Class Adviser                                                │     │
│     │  - School Principal                                             │     │
│     │  - Parent / Guardian                                            │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│     Remarks Calculation:                                                     │
│     - 90+: Outstanding                                                      │
│     - 85-89: Very Satisfactory                                             │
│     - 80-84: Satisfactory                                                  │
│     - 75-79: Fairly Satisfactory                                           │
│     - <75: Did Not Meet Expectations                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  11. BACKEND - SAVE DOWNLOAD ACTIVITY LOG                                   │
│                                                                             │
│     Query: prisma.auditLog.create()                                        │
│     Data:                                                                   │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  {                                                              │     │
│     │    actorId: student.id,                                        │     │
│     │    actorRole: "student",                                       │     │
│     │    action: "report_download",                                  │     │
│     │    resource: "reportCard",                                     │     │
│     │    resourceId: `${student.id}:${period}`,                     │     │
│     │    metadata: JSON.stringify({                                  │     │
│     │      studentId,                                                │     │
│     │      period,                                                   │     │
│     │      downloadedAt: new Date().toISOString()                    │     │
│     │    })                                                           │     │
│     │  }                                                              │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│     ⚠️  Log failure is non-blocking (download continues)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  12. BACKEND - RESPONSE                                                     │
│                                                                             │
│     Returns:                                                                │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  Status: 200 OK                                                │     │
│     │  Headers:                                                      │     │
│     │  - Content-Type: application/pdf                             │     │
│     │  - Content-Disposition: attachment; filename="..."          │     │
│     │  - Cache-Control: no-store                                    │     │
│     │  Body: PDF binary data                                         │     │
│     └─────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  13. FRONTEND - HANDLE DOWNLOAD RESPONSE                                    │
│                                                                             │
│     - Check response status                                                 │
│     - If 409 (Grades not finalized):                                       │
│       ┌─────────────────────────────────────────────────────────────────┐   │
│       │  Display toast message:                                       │   │
│       │  "Grades not yet finalized for [Period].                      │   │
│       │  Not approved for: [Class List]"                             │   │
│       └─────────────────────────────────────────────────────────────────┘   │
│     - If other error: Display appropriate error message                   │
│     - If 200 OK:                                                           │
│       ┌─────────────────────────────────────────────────────────────────┐   │
│       │  1. Convert response to blob: await res.blob()               │   │
│       │  2. Create object URL: URL.createObjectURL(blob)             │   │
│       │  3. Create anchor element: document.createElement('a')       │   │
│       │  4. Set href to URL, download attribute to filename          │   │
│       │  5. Click anchor to trigger download                         │   │
│       │  6. Clean up: remove anchor, revoke URL                     │   │
│       └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOWNLOAD COMPLETE                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Frontend (Student Dashboard)

**File:** `app/student/dashboard/page.tsx`

- **State Variables:**
  - `selectedQuarter`: "Q1" | "Q2" | "Q3" | "Q4" (Junior High)
  - `selectedSemester`: "S1" | "S2" (Senior High)
  - `downloadingReport`: boolean flag for UI state

- **Key Functions:**
  - `parseGradeLevelNumber()`: Extracts numeric grade from string
  - `isSeniorHigh`: Computed property (grade >= 11)
  - Download button handler: Calls `/api/reports/report-card?period=X`

### 2. Backend (Report Card API)

**File:** `app/api/reports/report-card/route.ts`

- **GET Handler** - Main processing endpoint
  - Authentication check
  - Grade level detection
  - Period validation
  - Enrollment fetch
  - Approval validation
  - Grade data fetch
  - Grade computation
  - PDF generation
  - Activity logging

### 3. Database Schema

**File:** `prisma/schema.prisma`

- **Student Model:** Contains gradeLevel, section, strand
- **Class Model:** Contains subject, gradeLevel, section
- **Enrollment Model:** Links students to classes
- **Grade Model:** Contains student grades per quarter
- **AuditLog Model:** Tracks grade finalization and downloads

---

## Error Handling

| Scenario                       | HTTP Status | Message                           | Action                  |
| ------------------------------ | ----------- | --------------------------------- | ----------------------- |
| Not logged in                  | 401         | "Unauthorized"                    | Redirect to login       |
| Not a student                  | 403         | "Forbidden"                       | Show error              |
| No period specified            | 400         | "period is required"              | Show error              |
| Invalid period for grade level | 400         | "Invalid quarter/semester"        | Show error              |
| No enrollments                 | 400         | "No active enrollments found"     | Show error              |
| Grades not finalized           | 409         | "Grades not yet finalized" + list | Show unapproved classes |
| Server error                   | 500         | "Failed to generate report"       | Show error              |

---

## Grade Computation Formulas

### Junior High (Grade 7-10)

```
Final Grade = Quarter Grade (Q1, Q2, Q3, or Q4)
General Average = Σ(Final Grades) / Number of Subjects
```

### Senior High (Grade 11-12)

```
Semester Grade = (Quarter 1 Grade + Quarter 2 Grade) / 2  [for Semester 1]
              = (Quarter 3 Grade + Quarter 4 Grade) / 2  [for Semester 2]

General Average = Σ(Semester Grades) / Number of Subjects
```

---

## Implementation Status

✅ **COMPLETED** - All features from the requirements are implemented:

1. ✅ Automatic grade level detection
2. ✅ Per-quarter grading for Grade 7-10
3. ✅ Semester grouping for Grade 11-12
4. ✅ Validation of quarter/semester finalization
5. ✅ Block if grades not approved ("Grades not yet finalized")
6. ✅ Fetch student and grade data
7. ✅ Auto-compute Semester Grade
8. ✅ Auto-compute General Average
9. ✅ PDF generation with appropriate layout
10. ✅ Academic layout with school details, student info, grades, signatures
11. ✅ Download activity logging
12. ✅ Automatic PDF download trigger
