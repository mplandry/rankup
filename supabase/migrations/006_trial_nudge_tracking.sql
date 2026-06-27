-- supabase/migrations/006_trial_nudge_tracking.sql
-- Tracks when we've sent the "subscribe now" trial-nudge emails, so the
-- daily cron (src/app/api/cron/trial-nudge/route.ts) sends each milestone
-- exactly once per user instead of re-sending on every run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_nudge_3day_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_nudge_expired_sent_at timestamptz;
