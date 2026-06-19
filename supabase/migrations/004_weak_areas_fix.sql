-- Fixes weak_chapters/weak_topics produced by refresh_user_stats() so the
-- Progress page's weak-areas breakdown has the data it actually needs:
--   - weak_chapters now includes book_title (and is grouped by
--     book_title + chapter, so identically-numbered chapters in different
--     books aren't conflated) — needed for the "Study this" deep link.
--   - weak_chapters and weak_topics both include a `correct` count —
--     needed to show an accurate incorrect count, not "all attempts wrong".
-- Also pins search_path per Supabase security advisor guidance for
-- SECURITY DEFINER functions.

CREATE OR REPLACE FUNCTION refresh_user_stats(p_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_stats_cache (
    user_id, total_sessions, total_questions,
    total_correct, avg_score_percent, best_score_percent,
    last_session_at, weak_topics, weak_chapters, updated_at
  )
  SELECT
    p_user_id,
    COUNT(DISTINCT es.id),
    COUNT(esq.id),
    COUNT(esq.id) FILTER (WHERE esq.is_correct),
    ROUND(AVG(es.score_percent), 2),
    ROUND(MAX(es.score_percent), 2),
    MAX(es.completed_at),
    -- weak topics (lowest scoring, min 3 answers)
    (
      SELECT jsonb_agg(t ORDER BY t.pct ASC) FROM (
        SELECT
          q.topic,
          ROUND(100.0 * SUM(CASE WHEN esq2.is_correct THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct,
          COUNT(*) AS attempts,
          SUM(CASE WHEN esq2.is_correct THEN 1 ELSE 0 END) AS correct
        FROM exam_session_questions esq2
        JOIN questions q ON q.id = esq2.question_id
        JOIN exam_sessions es2 ON es2.id = esq2.session_id
        WHERE es2.user_id = p_user_id AND es2.status = 'completed'
          AND q.topic IS NOT NULL
        GROUP BY q.topic
        HAVING COUNT(*) >= 3
        ORDER BY pct ASC LIMIT 8
      ) t
    ),
    -- weak chapters (grouped by book + chapter)
    (
      SELECT jsonb_agg(c ORDER BY c.pct ASC) FROM (
        SELECT
          q.book_title,
          q.chapter,
          ROUND(100.0 * SUM(CASE WHEN esq2.is_correct THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct,
          COUNT(*) AS attempts,
          SUM(CASE WHEN esq2.is_correct THEN 1 ELSE 0 END) AS correct
        FROM exam_session_questions esq2
        JOIN questions q ON q.id = esq2.question_id
        JOIN exam_sessions es2 ON es2.id = esq2.session_id
        WHERE es2.user_id = p_user_id AND es2.status = 'completed'
        GROUP BY q.book_title, q.chapter
        HAVING COUNT(*) >= 3
        ORDER BY pct ASC LIMIT 8
      ) c
    ),
    now()
  FROM exam_sessions es
  JOIN exam_session_questions esq ON esq.session_id = es.id
  WHERE es.user_id = p_user_id AND es.status = 'completed'
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions    = EXCLUDED.total_sessions,
    total_questions   = EXCLUDED.total_questions,
    total_correct     = EXCLUDED.total_correct,
    avg_score_percent = EXCLUDED.avg_score_percent,
    best_score_percent = EXCLUDED.best_score_percent,
    last_session_at   = EXCLUDED.last_session_at,
    weak_topics       = EXCLUDED.weak_topics,
    weak_chapters     = EXCLUDED.weak_chapters,
    updated_at        = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
