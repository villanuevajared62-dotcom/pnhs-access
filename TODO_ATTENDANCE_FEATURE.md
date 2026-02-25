# Teacher Attendance Feature Implementation Plan

## Phase 1: Database Schema Updates

- [ ] Add `remarks` field to Attendance model (optional text for notes)
- [ ] Add `locked` field to Attendance model (admin can lock records)
- [ ] Add `updatedBy` field to Attendance model (track who last edited)
- [ ] Add `updatedAt` field to Attendance model (track when last edited)

## Phase 2: API Route Updates

- [ ] Update `app/api/attendance/route.ts`:
  - [ ] Accept `remarks` field in POST
  - [ ] Return updated fields in responses
- [ ] Update `app/api/attendance/[id]/route.ts`:
  - [ ] Support updating `remarks` field
  - [ ] Support updating `locked` field (admin only)
  - [ ] Track and return `updatedBy` and `updatedAt`

## Phase 3: Frontend - Class Cards with Actions

- [ ] Update class cards in dashboard to show:
  - [ ] "Set Attendance" button (primary action)
  - [ ] "View Attendance History" button (secondary action)

## Phase 4: Frontend - Set Attendance Flow

- [ ] Update attendance modal to:
  - [ ] Show date picker (default to today)
  - [ ] Load students based on selected class and date
  - [ ] Support Present/Late/Absent/Excused statuses
  - [ ] Add remarks field for each student

## Phase 5: Frontend - Attendance History Modal

- [ ] Create new modal with:
  - [ ] List of past attendance dates for selected class
  - [ ] Each date shows summary (present/late/absent counts)
  - [ ] "Edit" button for each date
  - [ ] Clicking Edit loads that date's attendance for editing

## Phase 6: Frontend - Edit Attendance Flow

- [ ] When editing:
  - [ ] Load attendance for selected date
  - [ ] Allow changing status for any student
  - [ ] Allow adding/editing remarks
  - [ ] Save immediately with confirmation toast
  - [ ] Show who last edited each record

## Phase 7: Permissions & Security

- [ ] Teachers can only view/edit their own classes
- [ ] Students can only view (read-only)
- [ ] Admin can lock attendance records
- [ ] All edits tracked with user info

## Implementation Order:

1. Update Prisma schema
2. Update API routes
3. Update teacher dashboard class cards
4. Update Set Attendance modal
5. Create Attendance History modal
6. Add edit tracking UI
