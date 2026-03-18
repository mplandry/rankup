// ============================================================
// Database Types (matching Supabase schema)
// ============================================================

export type UserRole = 'student' | 'admin'
export type SessionMode = 'study' | 'exam'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type Answer = 'A' | 'B' | 'C' | 'D'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  department: string | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  source_id: string | null
  book_title: string
  edition: string | null
  chapter: string
  topic: string | null
  page_start: number | null
  page_end: number | null
  question_text: string
  answer_a: string
  answer_b: string
  answer_c: string
  answer_d: string
  correct_answer: Answer
  explanation: string | null
  study_eligible: boolean
  exam_eligible: boolean
  difficulty: Difficulty
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// Safe version — correct_answer stripped for exam mode client delivery
export type ExamQuestion = Omit<Question, 'correct_answer' | 'explanation'>

export interface ExamSession {
  id: string
  user_id: string
  mode: SessionMode
  status: SessionStatus
  total_questions: number
  score: number | null
  score_percent: number | null
  time_limit_secs: number | null
  time_elapsed_secs: number | null
  filters: StudyFilters | null
  started_at: string
  completed_at: string | null
}

export interface ExamSessionQuestion {
  id: string
  session_id: string
  question_id: string
  question_order: number
  user_answer: Answer | null
  is_correct: boolean | null
  flagged: boolean
  answered_at: string | null
  time_spent_secs: number | null
}

export interface UserStatsCache {
  user_id: string
  total_sessions: number
  total_questions: number
  total_correct: number
  avg_score_percent: number | null
  best_score_percent: number | null
  last_session_at: string | null
  weak_topics: WeakArea[] | null
  weak_chapters: WeakArea[] | null
  updated_at: string
}

export interface WeakArea {
  topic?: string
  chapter?: string
  pct: number
  attempts: number
}

// ============================================================
// App-level Types
// ============================================================

export interface StudyFilters {
  book_title?: string
  chapter?: string
  topic?: string
  difficulty?: Difficulty
  question_count?: number
}

export interface SessionWithQuestions extends ExamSession {
  exam_session_questions: (ExamSessionQuestion & { questions: Question })[]
}

export interface StudySessionQuestion extends ExamSessionQuestion {
  question: Question
}

export interface ExamSessionResult {
  session: ExamSession
  questions: (ExamSessionQuestion & { question: Question })[]
  categoryBreakdown: CategoryBreakdown[]
}

export interface CategoryBreakdown {
  chapter: string
  topic: string | null
  total: number
  correct: number
  pct: number
}

// CSV import row (matches exact CSV columns)
export interface CsvQuestionRow {
  question_id?: string
  book_title: string
  edition?: string
  chapter: string
  topic?: string
  page_start?: string | number
  page_end?: string | number
  question_text: string
  answer_a: string
  answer_b: string
  answer_c: string
  answer_d: string
  correct_answer: string
  explanation?: string
  study_eligible?: string | boolean
  exam_eligible?: string | boolean
  difficulty?: string
}

export interface CsvParseResult {
  valid: Omit<Question, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'created_by'>[]
  errors: CsvRowError[]
}

export interface CsvRowError {
  row: number
  field: string
  message: string
}

// For the answer submission during a session
export interface AnswerSubmission {
  question_id: string
  user_answer: Answer
  time_spent_secs?: number
}
