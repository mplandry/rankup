-- Sessions left in_progress with no activity for 24h+ are effectively
-- abandoned (tab closed, never finished). Backfill existing stale rows so
-- exam_sessions.status accurately reflects reality, matching the
-- in_progress|completed|abandoned enum documented in CLAUDE.md.
update exam_sessions
set status = 'abandoned'
where status = 'in_progress'
  and started_at < now() - interval '24 hours';
