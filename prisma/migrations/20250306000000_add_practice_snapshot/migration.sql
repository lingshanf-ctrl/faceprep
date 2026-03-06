-- Add practice snapshot fields
-- This migration adds fields to store question snapshot at the time of practice

-- Add new columns to Practice table
ALTER TABLE "Practice" ADD COLUMN IF NOT EXISTS "questionTitle" TEXT;
ALTER TABLE "Practice" ADD COLUMN IF NOT EXISTS "questionCategory" "Category";
ALTER TABLE "Practice" ADD COLUMN IF NOT EXISTS "questionType" "QuestionType";
ALTER TABLE "Practice" ADD COLUMN IF NOT EXISTS "questionDifficulty" INTEGER;

-- Make questionId nullable to prevent data loss when question is deleted
ALTER TABLE "Practice" ALTER COLUMN "questionId" DROP NOT NULL;

-- Update foreign key constraint to SetNull instead of Cascade
-- First drop the existing constraint
ALTER TABLE "Practice" DROP CONSTRAINT IF EXISTS "Practice_questionId_fkey";

-- Add new constraint with SetNull
ALTER TABLE "Practice" ADD CONSTRAINT "Practice_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing data: copy current question data to snapshot fields
UPDATE "Practice" p
SET
    "questionTitle" = q.title,
    "questionCategory" = q.category,
    "questionType" = q.type,
    "questionDifficulty" = q.difficulty
FROM "Question" q
WHERE p."questionId" = q.id
AND p."questionTitle" IS NULL;
