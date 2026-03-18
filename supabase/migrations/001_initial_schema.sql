-- ============================================================
-- Fire Promo Prep — Initial Schema
-- ============================================================

-- PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text        NOT NULL,
  full_name     text,
  role          text        NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  department    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       text,                                        -- question_id from CSV
  book_title      text        NOT NULL DEFAULT '',
  edition         text,
  chapter         text        NOT NULL DEFAULT '',
  topic           text,
  page_start      int,
  page_end        int,
  question_text   text        NOT NULL,
  answer_a        text        NOT NULL,
  answer_b        text        NOT NULL,
  answer_c        text        NOT NULL,
  answer_d        text        NOT NULL,
  correct_answer  char(1)     NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation     text,
  study_eligible  boolean     NOT NULL DEFAULT true,
  exam_eligible   boolean     NOT NULL DEFAULT true,
  difficulty      text        NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  is_active       boolean     NOT NULL DEFAULT true,
  created_by      uuid        REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- EXAM SESSIONS
CREATE TABLE IF NOT EXISTS exam_sessions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mode              text        NOT NULL CHECK (mode IN ('study','exam')),
  status            text        NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  total_questions   int         NOT NULL,
  score             int,
  score_percent     numeric(5,2),
  time_limit_secs   int,
  time_elapsed_secs int,
  filters           jsonb,      -- store study mode filters (book_title, chapter, topic, difficulty)
  started_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

-- EXAM SESSION QUESTIONS (the ordered question list per session)
CREATE TABLE IF NOT EXISTS exam_session_questions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id     uuid        NOT NULL REFERENCES questions(id),
  question_order  int         NOT NULL,
  user_answer     char(1)     CHECK (user_answer IN ('A','B','C','D')),
  is_correct      boolean,
  flagged         boolean     NOT NULL DEFAULT false,
  answered_at     timestamptz,
  time_spent_secs int
);

-- USER STATS CACHE (recomputed after each completed session)
CREATE TABLE IF NOT EXISTS user_stats_cache (
  user_id               uuid        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_sessions        int         NOT NULL DEFAULT 0,
  total_questions       int         NOT NULL DEFAULT 0,
  total_correct         int         NOT NULL DEFAULT 0,
  avg_score_percent     numeric(5,2),
  best_score_percent    numeric(5,2),
  last_session_at       timestamptz,
  weak_topics           jsonb,      -- [{"topic":"Ventilation","pct":42},...]
  weak_chapters         jsonb,      -- [{"chapter":"Chapter 5","pct":55},...]
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_questions_book ON questions (book_title);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions (chapter);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions (topic);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions (is_active);
CREATE INDEX IF NOT EXISTS idx_questions_exam_eligible ON questions (exam_eligible);
CREATE INDEX IF NOT EXISTS idx_questions_study_eligible ON questions (study_eligible);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions (status);
CREATE INDEX IF NOT EXISTS idx_session_questions_session ON exam_session_questions (session_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats_cache ENABLE ROW LEVEL SECURITY;

-- profiles: each user manages their own row; admins see all
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin_read" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- questions: anyone authenticated can read active questions; only admins write
CREATE POLICY "questions_read" ON questions FOR SELECT
  USING (auth.uid() IS NOT NULL AND (is_active = true OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')));
CREATE POLICY "questions_admin_write" ON questions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "questions_admin_update" ON questions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "questions_admin_delete" ON questions FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- exam_sessions: users own their sessions; admins read all
CREATE POLICY "sessions_own" ON exam_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sessions_admin_read" ON exam_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- exam_session_questions: access through session ownership
CREATE POLICY "session_questions_own" ON exam_session_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM exam_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE POLICY "session_questions_admin" ON exam_session_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- user_stats_cache: users own; admins read all
CREATE POLICY "stats_own" ON user_stats_cache FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "stats_admin_read" ON user_stats_cache FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Refresh user_stats_cache after a session completes
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
          COUNT(*) as attempts
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
    -- weak chapters
    (
      SELECT jsonb_agg(c ORDER BY c.pct ASC) FROM (
        SELECT
          q.chapter,
          ROUND(100.0 * SUM(CASE WHEN esq2.is_correct THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct,
          COUNT(*) as attempts
        FROM exam_session_questions esq2
        JOIN questions q ON q.id = esq2.question_id
        JOIN exam_sessions es2 ON es2.id = esq2.session_id
        WHERE es2.user_id = p_user_id AND es2.status = 'completed'
        GROUP BY q.chapter
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
