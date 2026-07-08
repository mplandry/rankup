// Core Types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  exam_type: "lieutenant" | "captain";
  is_admin: boolean;
  role: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_tier: string | null;
  trial_ends_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  last_active_at: string | null;
}

export interface Question {
  id: string;
  question_number: number;
  book_title: string;
  edition: string;
  chapter: number | null;
  topic: string | null;
  page_start: number | null;
  page_end: number | null;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  study_eligible: boolean;
  exam_eligible: boolean;
  is_active: boolean;
  exam_type: "lieutenant" | "captain";
  created_at: string;
  updated_at: string;
}

export interface ExamSession {
  id: string;
  user_id: string;
  mode: "study" | "exam";
  score: number;
  score_percent: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface ExamSessionQuestion {
  id: string;
  session_id: string;
  question_id: string;
  user_answer: string | null;
  is_correct: boolean;
  flagged?: boolean;
  question: Question;
}

export interface CategoryBreakdown {
  category: string;
  correct: number;
  total: number;
  percentage: number;
}
export interface WeakArea {
  book_title?: string | null;
  chapter?: string | number | null;
  topic?: string | null;
  pct?: number | null;
  attempts?: number | null;
  correct?: number | null;
}

// CSV Import Types
export interface CsvRowError {
  row: number;
  field: string;
  message: string;
}

export interface CsvQuestionRow {
  question_id?: string;
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  book_title: string;
  edition?: string;
  chapter: string;
  topic?: string;
  page_start?: string;
  page_end?: string;
  explanation?: string;
  difficulty?: string;
  study_eligible?: string | boolean;
  exam_eligible?: string | boolean;
}

export interface CsvParseResult {
  valid: Array<{
    source_id: string | null;
    book_title: string;
    edition: string | null;
    chapter: string;
    topic: string | null;
    page_start: number | null;
    page_end: number | null;
    question_text: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string;
    correct_answer: Answer;
    explanation: string | null;
    study_eligible: boolean;
    exam_eligible: boolean;
    difficulty: Difficulty;
  }>;
  errors: CsvRowError[];
}

export interface ImportQualityResult {
  total: number;
  passed: number;
  failed: number;
  inserted: number;
  low_distractor_count: number;
  duplicate_count: number;
  errors: Array<{ row: number; message: string; field?: string }>;
  warnings?: Array<{ row: number; message: string }>;
  flagged_questions?: Array<any>;
  answer_distribution?: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}

// Utility Types
export type ExamType = "lieutenant" | "captain";
export type Difficulty = "easy" | "medium" | "hard";
export type Mode = "study" | "exam";
export type UserRole = "student" | "admin";
export type ExamQuestion = Question;
export type Answer = "A" | "B" | "C" | "D";
