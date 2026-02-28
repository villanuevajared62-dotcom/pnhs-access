# SHS Report Card Download Fix Plan

## Problem

Hindi ma-download ng SHS students ang Report Card dahil hindi na-finalize ng teacher ang grades.

## Root Cause

1. Teacher Dashboard: Walang "Finalize Grades" button
2. Teacher encoding lang ang grades pero hindi pinapafinalize
3. Report Card API: Kinokontrol ang download batay sa `grades_finalized` audit log
4. SHS students: Kailangan ng BOTH quarters approved bago ma-download

## Solution Plan (COMPLETED)

1. ✅ Add "Finalize Grades" button sa Teacher Dashboard Grades section - Admin na may button
2. ✅ Button should call `/api/grades/finalize` API
3. ✅ For SHS (Grade 11-12): Finalize BOTH quarters:
   - Semester 1: Finalize Q1 AND Q2
   - Semester 2: Finalize Q3 AND Q4
4. ✅ Show toast message after finalizing

## Files Modified

1. `app/admin/dashboard/page.tsx` - Updated handleFinalizeGrades function

## Implementation Details

### Fix Applied

The key fix was in the `handleFinalizeGrades` function:

```
javascript
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

  // Finalize all required periods...
};
```

Now when Admin selects "Semester 1 (S1)" and clicks Finalize:

- It creates audit logs for BOTH Q1 and Q2
- This matches what the Report Card API expects

## Status: ✅ FIXED

- [x] Admin can now properly finalize SHS grades
- [x] Students can download report cards after proper finalization
