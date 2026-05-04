export type UserRole = "student" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department: string | null;
  exam_type: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null; // ← ADDED THIS LINE
}

export interface UserStatsCache {
  user_id: string;
  total_sessions: number;
  total_questions: number;
  total_correct: number;
  avg_score_percent: number;
  best_score_percent: number;
  last_session_at: string | null;
  updated_at: string;
}

export interface Question {
  id: string;
  question_number: number;
  book_title: string;
  edition: string;
  chapter: string;
  topic: string;
  page_start: number;
  page_end: number;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  explanation: string;
  study_eligible: boolean;
  exam_eligible: boolean;
  difficulty: "easy" | "medium" | "hard";
  is_active: boolean;
  exam_type: string;
  created_at: string;
  updated_at: string;
}

export interface ExamSession {
  id: string;
  user_id: string;
  mode: "study" | "exam";
  score: number;
  total_questions: number;
  completed_at: string;
  created_at: string;
  export interface ExamSessionQuestion {
  id: string;
  session_id: string;
  question_id: string;
  user_answer: string | null;
  is_correct: boolean;
  question: Question;
}

export interface CategoryBreakdown {
  category: string;
  correct: number;
  total: number;
  percentage: number;
}

