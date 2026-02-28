# SHS Grades Module Implementation Plan

## Overview

Update the Grades module to correctly handle Senior High School (Grade 11-12) grading using quarter-based inputs grouped by semester, while keeping Grade 7-10 logic unchanged.

---

## Current State Analysis

### Already Implemented ✅

1. **Teacher Dashboard** (`app/teacher/dashboard/page.tsx`)
   - Semester selector for Grade 11-12 (1st Sem, 2nd Sem buttons)
   - Shows Q1/Q2 for 1st Semester, Q3/Q4 for 2nd Semester
   - Semester grade calculation: (Q1+Q2)/2 for S1, (Q3+Q4)/2 for S2
   - Edit Grade modal with quarter selection

2. **Student Dashboard** (`app/student/dashboard/page.tsx`)
   - Grade level detection: `isSeniorHigh = gradeLevel >= 11`
   - Semester selector (S1, S2) for SHS students
   - Shows quarter breakdown in table (Q1, Q2 for S1; Q3, Q4 for S2)
   - Download Report functionality with period selection

3. **Report Card API** (`app/api/reports/report-card/route.ts`)
   - Quarter-based approval validation (both Q1 AND Q2 must be approved for S1)
   - Semester grade computation
   - PDF generation with correct semester labels

4. **Database Schema** (`prisma/schema.prisma`)
   - Grade model has `quarter` field (Q1, Q2, Q3, Q4)
   - Semester is computed, not stored

---

## Verification Tasks

### Teacher Dashboard

- [ ] Verify semester selector appears only for Grade 11-12
- [ ] Verify quarter input fields are correct (Q1+Q2 for Sem 1, Q3+Q4 for Sem 2)
- [ ] Verify semester grade auto-computation works
- [ ] Verify grades are saved per quarter (not per semester)

### Student Dashboard

- [ ] Verify semester view shows for Grade 11-12
- [ ] Verify quarter view shows for Grade 7-10
- [ ] Verify Download Report validates approval status

### Report Card API

- [ ] Verify S1 validates Q1 AND Q2 approval
- [ ] Verify S2 validates Q3 AND Q4 approval
- [ ] Verify PDF shows correct columns per semester

---

## Implementation Details

### Teacher Dashboard Flow

```
1. Teacher selects class
2. System detects grade level (parseGradeLevelNumber from class name)
3. If Grade 11-12:
   - Show semester selector (1st Sem / 2nd Sem)
   - 1st Sem → Display Q1 & Q2 input fields
   - 2nd Sem → Display Q3 & Q4 input fields
4. Teacher encodes grades per quarter
5. System auto-saves to database with quarter field
6. System computes: Semester Grade = average of two quarters
```

### Student Dashboard Flow

```
1. Student opens Grades tab
2. System detects grade level
3. If Grade 7-10:
   - Display quarters (Q1, Q2, Q3, Q4)
4. If Grade 11-12:
   - Display semesters (1st Sem, 2nd Sem)
   - 1st Sem → Show Q1, Q2, Semester Grade
   - 2nd Sem → Show Q3, Q4, Semester Grade
5. Click Download Report:
   - Validate required quarters are approved
   - If approved → Generate PDF
   - If not → Show "Grades not yet finalized"
```

### Report Card PDF

- **Grade 7-10**: Quarterly Report Card
  - Columns: Subject, Grade, Remarks
- **Grade 11-12**: Semester Report Card
  - Semester 1: Subject, 1st Qtr, 2nd Qtr, Sem Avg
  - Semester 2: Subject, 3rd Qtr, 4th Qtr, Sem Avg

---

## Key Functions

### Frontend (Teacher Dashboard)

- `parseGradeLevelNumber()` - Extract grade level from class name
- `selectedClassGradeLevel` - Memoized grade level for selected class
- `gradePeriodOptions` - Quarter options (Q1-Q4)
- `getSemesterGrade()` - Calculate semester average

### Frontend (Student Dashboard)

- `parseGradeLevelNumber()` - Extract grade level
- `isSeniorHigh` - Boolean: gradeLevel >= 11
- `getGradeForPeriod()` - Get grade for specific quarter

### Backend (Report Card API)

- `parseGradeLevelNumber()` - Server-side grade parsing
- `isApprovedForClassPeriod()` - Check quarter approval
- `computeGeneralAverage()` - Calculate overall average

---

## Files to Modify

1. **app/teacher/dashboard/page.tsx** - Verify semester UI
2. **app/student/dashboard/page.tsx** - Verify grades display
3. **app/api/reports/report-card/route.ts** - Verify approval logic
4. **prisma/schema.prisma** - No changes needed (already has quarter field)

---

## Summary

The SHS Grades Module appears to be **already implemented** in the codebase. The key components are:

1. Quarter-based grade storage (Q1, Q2, Q3, Q4)
2. Semester computation (S1 = Q1+Q2, S2 = Q3+Q4)
3. Grade level detection for UI adaptation
4. Approval validation for report card download

This implementation follows the requirements:

- ✅ Teachers encode quarter grades only
- ✅ Semesters are computed, not manually encoded
- ✅ Students see semester view for SHS
- ✅ Download depends on approved quarter pairs
