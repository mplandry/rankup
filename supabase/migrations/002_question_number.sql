-- Add auto-incrementing question_number to questions table
-- This replaces the manual source_id tracking from CSV question_id column

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_number integer GENERATED ALWAYS AS IDENTITY;

-- Make it unique so it can be used as a display ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_number ON questions (question_number);
