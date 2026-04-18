# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
```

No test runner or lint scripts are configured.

## What This Is

RankUp is an exam prep platform for the 2026 Massachusetts Firefighter Promotional Exam (Lieutenant & Captain tracks). It provides study sessions, timed practice exams, flashcards, and progress tracking built around the official MA reading list (~1,500 questions across 5 books).

## Tech Stack

- **Next.js 16 App Router** + React 19, TypeScript
- **Supabase** for auth (email/password) and PostgreSQL database
- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **Resend** for transactional email (new student welcome)
- **PapaParse** for CSV bulk import of questions

## Architecture

### Route Groups

- `(auth)` — public login/signup pages
- `(app)` — protected routes: `/dashboard`, `/study`, `/exam`, `/flashcards`, `/progress`, `/admin`

Middleware in `src/proxy.ts` refreshes Supabase sessions and enforces redirects.

### Supabase Client Pattern

- Server components / API routes: `createClient()` from `@/lib/supabase/server` (cookie-based)
- Client components: `createBrowserClient()` from `@/lib/supabase/client`

### Core Data Model

```
User (Supabase Auth)
  └─> profiles (role: student|admin, exam_type: lieutenant|captain|both)
      └─> exam_sessions (mode: study|exam, status: in_progress|completed|abandoned)
          └─> exam_session_questions (user_answer, is_correct, time_spent, flagged)
              └─> questions (text, 4 answer choices, explanation, difficulty, book/chapter)
      └─> user_stats_cache (denormalized metrics: total sessions, avg score, weak topics)
      └─> flashcard_progress (per-card mastery levels)
```

### Session Flow

1. `POST /api/sessions` — filters questions by `active`, `study_eligible`, user's `exam_type`, and any filters; shuffles and creates `exam_session` + `exam_session_questions` rows
2. Client renders study/exam UI; answers written to `exam_session_questions.user_answer`
3. `POST /api/sessions/[id]/complete` — scores session, updates `user_stats_cache`

### Key Constants (`src/lib/constants.ts`)

- Exam: 90 questions, 90-minute limit, 70% pass threshold
- Default study session: 20 questions
- Brand colors: `FIRE_RED: #C0392B`, `FIRE_ORANGE: #E67E22`, `FIRE_NAVY: #1B2A4A`

### Answer Key / Shuffle

Questions are served with shuffled answer order. The original answer key is stored as `originalKey` so grading always compares against the canonical correct answer, not the display position. Both `QuestionCard` and `AnswerFeedback` components depend on `originalKey` being passed consistently — changing this breaks grading.

## Path Aliases

`@/*` resolves to `src/*` (configured in `tsconfig.json`).
