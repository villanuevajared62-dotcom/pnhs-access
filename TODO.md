# TODO: Show Grade Level, Section, and Strand in Class Display

## Problem

When admin adds a class, the grade level, section, and strand are saved but not displayed in the class cards. Users can only see the class name.

## Plan

### Information Gathered:

- `Class` interface in `lib/shared-data.ts` already has `gradeLevel`, `section`, and `strand` properties
- Admin dashboard's "Add/Edit Class" modal already has fields for these values
- The classes ARE being saved with these values
- The issue is only in the DISPLAY of class cards in the "Classes" tab

### Files to Edit:

1. `app/admin/dashboard/page.tsx`
   - Update the class card display in the "classes" case to show:
     - `cls.gradeLevel`
     - `cls.section`
     - `cls.strand` (for Grade 11-12)

### Implementation:

Add display items in the class card showing:

- Grade Level with BookOpen icon
- Section with Users icon
- Strand (conditionally, only for Grade 11-12) with GraduationCap icon

### Changes:

- Find the classes display section (around line 1080-1117)
- Add gradeLevel, section, and strand display items to the card
