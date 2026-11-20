-- Student-submitted "Report this question" flags.
-- One row per (student, question); re-reporting updates the note.
-- user_answer is the canonical original key (A-D), same as exam_session_questions.
create table if not exists public.question_reports (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  user_answer text check (user_answer in ('A','B','C','D')),
  note        text check (char_length(note) <= 1000),
  status      text not null default 'open' check (status in ('open','fixed','dismissed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists question_reports_status_idx
  on public.question_reports (status, created_at desc);
create index if not exists question_reports_question_idx
  on public.question_reports (question_id);

alter table public.question_reports enable row level security;

-- Students may file and update their own reports, and see their own.
-- Admins read/triage through the service-role client (bypasses RLS).
create policy "students insert own reports" on public.question_reports
  for insert to authenticated with check (user_id = auth.uid());
create policy "students update own reports" on public.question_reports
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "students read own reports" on public.question_reports
  for select to authenticated using (user_id = auth.uid());
