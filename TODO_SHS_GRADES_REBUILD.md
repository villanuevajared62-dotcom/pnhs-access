# SHS Grades Module - Rebuild Implementation Plan

## Task: Build Grades Module From Scratch (JHS & SHS)

Act as a system analyst and full-stack developer.
Design and implement a Grades Management Module for a school portal system with separate Teacher Dashboard and Student Dashboard, starting from zero.

---

## Grade Level Rules

### Grade 7–10 (Junior High School)

- Grades are managed per quarter (Q1, Q2, Q3, Q4)

### Grade 11–12 (Senior High School)

- Grades are still encoded per quarter, but are grouped by semester:
  - 1st Semester → 1st Quarter + 2nd Quarter
  - 2nd Semester → 3rd Quarter + 4th Quarter

---

## Implementation Checklist

### Phase 1: Teacher Dashboard - Grades Section

- [ ] 1.1 Teacher selects Class / Subject / Section
- [ ] 1.2 System detects grade level
- [ ] 1.3 If Grade 7-10: Show Q1–Q4 input fields
- [ ] 1.4 If Grade 11-12: Show Semester selector
- [ ] 1.5 Display two quarter inputs per semester:
  - [ ] 1st Sem → Q1 & Q2
  - [ ] 2nd Sem → Q3 & Q4
- [ ] 1.6 Teacher encodes grades per quarter only
- [ ] 1.7 System auto-saves and validates inputs
- [ ] 1.8 Teacher submits grades
- [ ] 1.9 Adviser/Admin reviews and approves
- [ ] 1.10 System locks approved grades

### Phase 2: Student Dashboard - Grades Section

- [ ] 2.1 Student opens Dashboard → Grades
- [ ] 2.2 System detects grade level
- [ ] 2.3 If Grade 7-10: Display grades per quarter
- [ ] 2.4 If Grade 11-12: Display grades per semester
- [ ] 2.5 System displays:
  - [ ] Subject list
  - [ ] Quarter breakdown (read-only)
  - [ ] Semester grade
  - [ ] Remarks
  - [ ] General average
- [ ] 2.6 Grades are visible only after approval

### Phase 3: Download Report Card Flow

- [ ] 3.1 Student clicks Download Report
- [ ] 3.2 System checks grade level
- [ ] 3.3 If Grade 7-10: Generate Quarterly Report Card PDF
- [ ] 3.4 If Grade 11-12: Generate Semester Report Card PDF using:
  - [ ] Q1 + Q2 (1st Sem)
  - [ ] Q3 + Q4 (2nd Sem)
- [ ] 3.5 Validate that all required quarters are approved
- [ ] 3.6 If not approved → block download
- [ ] 3.7 If approved → generate and auto-download PDF

### Phase 4: System Rules

- [ ] 4.1 Teachers cannot edit approved grades
- [ ] 4.2 Students have read-only access
- [ ] 4.3 Semester grades are computed, not manually encoded
- [ ] 4.4 Report cards must be print-ready PDF format

---

## Files to Modify

1. **app/teacher/dashboard/page.tsx**
   - Update grades tab to handle SHS semester grouping
   - Add semester selector for Grade 11-12
   - Update quarter selection logic

2. **app/student/dashboard/page.tsx**
   - Update grades tab to display semester view for SHS
   - Update period selector (Quarter vs Semester)
   - Update download report flow

3. **app/api/grades/route.ts**
   - Ensure quarter-based storage
   - Add semester computation logic

4. **app/api/reports/report-card/route.ts**
   - Update PDF generation for SHS
   - Update approval validation for quarters

---

## Implementation Notes

### Database (Already Ready)

The Grade model has:

- `quarter` field (Q1, Q2, Q3, Q4) - ✅ Already exists
- Semester is computed, not stored - ✅ Already implemented

### Key Functions to Implement/Update

1. **parseGradeLevelNumber()** - Extract numeric grade level
2. **isSeniorHigh()** - Check if grade >= 11
3. **getSemesterQuarters()** - Map semester to quarters
4. **computeSemesterGrade()** - Average of two quarters
5. **isApprovedForPeriod()** - Check if grades are approved
