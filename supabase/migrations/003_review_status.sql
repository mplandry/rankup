-- supabase/migrations/003_review_status.sql
-- Add content quality review fields to questions

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS review_status          text        NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'needs_revision')),
  ADD COLUMN IF NOT EXISTS review_notes           text,
  ADD COLUMN IF NOT EXISTS distractor_score       integer
    CHECK (distractor_score >= 0 AND distractor_score <= 100),
  ADD COLUMN IF NOT EXISTS distractor_notes       text,
  ADD COLUMN IF NOT EXISTS originality_reviewed   boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS originality_reviewed_by text,
  ADD COLUMN IF NOT EXISTS originality_reviewed_at timestamptz;

-- Index for the review queue (pending/needs_revision queries)
CREATE INDEX IF NOT EXISTS idx_questions_review_status
  ON questions (review_status)
  WHERE is_active = true;
