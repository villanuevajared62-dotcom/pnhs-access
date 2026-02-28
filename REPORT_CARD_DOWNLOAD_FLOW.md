# Report Card Download - Functional Flow Design (Updated v2.0)

## Overview

This document describes the functional flow for downloading a student's Report Card in the PNHS ACCESS system, starting from the moment the student clicks "Download Report" in the Grades section of the Student Dashboard.

---

## Key Changes in v2.0

### Quarter-Based Approval Validation for Grade 11-12

**Previous Behavior (v1.0):**

- Only validated the semester period (S1 or S2) as a single approval entity
- Download was blocked only if the semester itself wasn't approved

**New Behavior (v2.0) - CURRENT:**

- **Semester 1 (S1):** Validates BOTH Quarter 1 (Q1) AND Quarter 2 (Q2) are approved
- **Semester 2 (S2):** Validates BOTH Quarter 3 (Q3) AND Quarter 4 (Q4) are approved
- If either quarter is not approved, the download is blocked with message: "Grades not yet finalized"
- Error response includes `quartersPending` array showing which quarters need approval

### PDF Column Labels (Updated)

- **Semester 1:** Shows "1st Qtr" and "2nd Qtr"
- **Semester 2:** Shows "3rd Qtr" and "4th Qtr"

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
│     - Returns 401 if unauthorized, 403 if not a student                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. BACKEND - GRADE LEVEL DETECTION                                        │
│     - Parses student.gradeLevel (e.g., "Grade 7", "Grade 11")             │
│     - Uses parseGradeLevelNumber() to extract numeric grade                │
│     - Determines: isSeniorHigh = gradeLevel >= 11                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. BACKEND - APPROVAL VALIDATION (GRADE FINALIZATION CHECK) - UPDATED     │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  For Senior High (Grade 11-12):                                │    │
│     │  - If Semester 1 (S1): Validate BOTH Q1 AND Q2 are approved   │    │
│     │  - If Semester 2 (S2): Validate BOTH Q3 AND Q4 are approved   │    │
│     │  - Block download if ANY quarter is not approved               │    │
│     ├─────────────────────────────────────────────────────────────────┤    │
│     │  For Junior High (Grade 7-10):                                 │    │
│     │  - Validate single quarter is approved                         │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│     Queries: auditLog                                                      │
│     - Where: { action: "grades_finalized", resource: "grades" }           │
│     - resourceId: `${classId}:${quarter}`                                 │
│                                                                             │
│     IF ANY CLASS IS NOT APPROVED:                                          │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  Returns 409 Conflict                                          │    │
│     │  {                                                            │    │
│     │    message: "Grades not yet finalized",                        │    │
│     │    period,                                                     │    │
│     │    unapprovedClasses: [{                                       │    │
│     │      id, name, gradeLevel, section, strand,                    │    │
│     │      quartersPending: ["Q1", "Q2"]  // for senior high         │    │
│     │    }]                                                          │    │
│     │  }                                                            │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│     ⚠️  BLOCKS THE PROCESS IF GRADES NOT APPROVED                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. BACKEND - FETCH GRADE DATA & COMPUTE                                  │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  Senior High (Grade 11-12):                                    │    │
│     │  - If S1: quarter: { in: ["Q1", "Q2"] }                      │    │
│     │  - If S2: quarter: { in: ["Q3", "Q4"] }                      │    │
│     │  - Semester Grade = average(Q1, Q2) or average(Q3, Q4)        │    │
│     └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. BACKEND - GENERATE PDF REPORT CARD                                      │
│                                                                             │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  SENIOR HIGH - SEMESTER 1 (S1):                                │     │
│     │  ┌──────────────┬───────┬───────┬────────┐                   │     │
│     │  │ Subject       │ 1st Qtr│ 2nd Qtr│Sem Avg │                   │     │
│     │  ├──────────────┼───────┼───────┼────────┤                   │     │
│     │  │ Math          │   85  │   88  │   87   │                   │     │
│     │  │ Science       │   90  │   92  │   91   │                   │     │
│     │  └──────────────┴───────┴───────┴────────┘                   │     │
│     │                                                                 │     │
│     │  SENIOR HIGH - SEMESTER 2 (S2):                                │     │
│     │  ┌──────────────┬───────┬───────┬────────┐                   │     │
│     │  │ Subject       │ 3rd Qtr│ 4th Qtr│Sem Avg │                   │     │
│     │  ├──────────────┼───────┼───────┼────────┤                   │     │
│     │  │ Math          │   85  │   88  │   87   │                   │     │
│     │  │ Science       │   90  │   92  │   91   │                   │     │
│     │  └──────────────┴───────┴───────┴────────┘                   │     │
│     └─────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  8. BACKEND - RESPONSE                                                     │
│     - Returns PDF binary data                                              │
│     - Saves download activity log                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Grade Computation Formulas

### Junior High (Grade 7-10)

```
Final Grade = Quarter Grade (Q1, Q2, Q3, or Q4)
General Average = Σ(Final Grades) / Number of Subjects
```

### Senior High (Grade 11-12) - Per Semester Logic (Updated)

```
Semester 1 (S1):
  Semester Grade = (Quarter 1 Grade + Quarter 2 Grade) / 2

Semester 2 (S2):
  Semester Grade = (Quarter 3 Grade + Quarter 4 Grade) / 2

General Average = Σ(Semester Grades) / Number of Subjects
```

---

## Error Handling

| Scenario                       | HTTP Status | Message                           | Action                                     |
| ------------------------------ | ----------- | --------------------------------- | ------------------------------------------ |
| Not logged in                  | 401         | "Unauthorized"                    | Redirect to login                          |
| Not a student                  | 403         | "Forbidden"                       | Show error                                 |
| No period specified            | 400         | "period is required"              | Show error                                 |
| Invalid period for grade level | 400         | "Invalid quarter/semester"        | Show error                                 |
| No enrollments                 | 400         | "No active enrollments found"     | Show error                                 |
| Grades not finalized           | 409         | "Grades not yet finalized" + list | Show unapproved classes + quarters pending |
| Server error                   | 500         | "Failed to generate report"       | Show error                                 |

---

## Implementation Status

✅ **COMPLETED** - All features from the requirements are implemented:

1. ✅ Automatic grade level detection
2. ✅ Per-quarter grading for Grade 7-10
3. ✅ Semester grouping for Grade 11-12 (Q1+Q2 = S1, Q3+Q4 = S2)
4. ✅ **Quarter-based approval validation** (both quarters must be approved)
5. ✅ Block if grades not approved ("Grades not yet finalized")
6. ✅ Fetch student and grade data
7. ✅ Auto-compute Semester Grade
8. ✅ Auto-compute General Average
9. ✅ PDF generation with correct quarter labels per semester
10. ✅ Academic layout with school details, student info, grades, signatures
11. ✅ Download activity logging
12. ✅ Automatic PDF download trigger
13. ✅ Enhanced error messages showing quarters pending approval
