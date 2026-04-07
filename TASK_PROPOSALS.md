# Codebase Task Proposals

## 1) Typo fix task
**Title:** Fix exam rules copy typo in Exam Mode

- **Issue found:** In the exam rules list, the text reads `90 minute time limit` (singular) instead of `90 minutes time limit` or `90-minute time limit`.
- **Location:** `app/exam/page.tsx`.
- **Proposed task:** Update the rule copy to grammatically correct wording (`90-minute time limit`), and quickly scan nearby strings for similar copy issues.
- **Acceptance criteria:**
  - The exam rules text is corrected.
  - No layout regressions in the rules card.

## 2) Bug fix task
**Title:** Prevent timer interval leak in Exam Mode

- **Issue found:** `startExam` creates a `setInterval`, and `handleSubmit` clears it, but there is no cleanup on component unmount or route change while a session is active.
- **Risk:** Background timer can continue after navigation and attempt state updates on an unmounted component.
- **Location:** `app/exam/page.tsx`.
- **Proposed task:** Add effect cleanup that clears `timerRef.current` on unmount and before starting a new interval.
- **Acceptance criteria:**
  - Interval is always cleared on unmount and when replacing an active timer.
  - No duplicate timer behavior after starting/restarting an exam.

## 3) Comment/documentation discrepancy task
**Title:** Align README with actual product behavior

- **Issue found:** `README.md` is the default Next.js starter content and does not describe this app’s real features, auth requirements, or Supabase setup.
- **Location:** `README.md`.
- **Proposed task:** Replace boilerplate sections with project-specific documentation (purpose, env vars, Supabase dependencies, and local run steps).
- **Acceptance criteria:**
  - README explains what RankUp does and key routes/modes.
  - Setup steps include required environment variables and database assumptions.

## 4) Test improvement task
**Title:** Add unit tests for CSV parsing and answer shuffling invariants

- **Issue found:** Utility logic in `lib/utils.ts` has no tests despite being critical to importing question banks and exam correctness.
- **Location:** `lib/utils.ts`.
- **Proposed task:** Introduce a test runner (e.g., Vitest) and add tests for:
  - `parseCSV` with quoted commas, blank lines, and malformed rows.
  - `shuffleAnswers` invariants (all options preserved, exactly one correct mapping, valid output letters).
- **Acceptance criteria:**
  - Tests fail on regressions and pass in CI/local.
  - At least one malformed CSV case is asserted.
