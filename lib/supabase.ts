import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Question = {
  id: string;
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
  correct_answer: string;
  explanation: string | null;
  study_eligible: boolean;
  exam_eligible: boolean;
  difficulty: string;
  is_active: boolean;
  created_at: string;
  question_number: number | null;
  created_by: string | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
  created_at: string;
};

export type ExamSession = {
  id: string;
  user_id: string;
  mode: string;
  score: number;
  total_questions: number;
  completed_at: string;
  time_taken: number;
};
