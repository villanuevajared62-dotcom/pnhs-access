-- AlterTable: Add class-based assignment support
-- Add fields to support class-based assignment creation
-- Keep studentId as optional for backward compatibility

-- Add new columns to Assignment table
ALTER TABLE "Assignment" ADD COLUMN "classId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "gradingCriteria" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "submissionRequirements" TEXT;

-- Make existing studentId optional
-- Note: SQLite doesn't support ALTER COLUMN, so we rely on the schema update to reflect this

-- Create foreign key for classId
CREATE INDEX "Assignment_classId_idx" ON "Assignment"("classId");

-- Add constraint to require either classId or studentId (for backward compatibility)
-- This is enforced at application level since SQLite has limited CHECK support
