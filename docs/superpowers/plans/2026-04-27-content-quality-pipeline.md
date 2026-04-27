# Content Quality Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an end-to-end admin content quality pipeline: CSV import runs AI distractor scoring + duplicate detection, then a review queue lets the admin approve/flag questions before they reach students.

**Architecture:** All new admin pages are server components that load data and pass it to client components for interactivity. The distractor quality check calls the Claude Haiku API server-side during import. The review queue uses optimistic UI updates with a PATCH endpoint. Questions with `review_status != 'approved'` are filtered from all student-facing session queries.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL), TypeScript, Tailwind CSS, `@anthropic-ai/sdk`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/003_review_status.sql` | Create | Adds 7 review-related columns to `questions` |
| `src/types/index.ts` | Modify | Add new fields to `Question` interface |
| `src/lib/utils/distractor-check.ts` | Create | Claude Haiku API call to score distractor quality |
| `src/lib/utils/duplicate-detect.ts` | Create | Jaccard similarity duplicate detection |
| `src/app/api/import/route.ts` | Modify | Run quality checks post-insert, return rich results |
| `src/app/api/questions/[id]/route.ts` | Modify | Add PATCH handler for review actions |
| `src/app/api/sessions/route.ts` | Modify | Filter by `review_status = 'approved'` |
| `src/components/admin/CsvImporter.tsx` | Modify | Enhanced import results screen |
| `src/app/(app)/admin/review/page.tsx` | Create | Server component: load review queue data |
| `src/components/admin/ReviewQueue.tsx` | Create | Client component: interactive review UI |
| `src/app/(app)/admin/questions/page.tsx` | Modify | Add answer distribution panel at top |
| `src/app/(app)/admin/page.tsx` | Modify | Add Review Queue link + pending count badge |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/003_review_status.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/003_review_status.sql
-- Add content quality review fields to questions

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS review_status          text        NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'needs_revision')),
  ADD COLUMN IF NOT EXISTS review_notes           text,
  ADD COLUMN IF NOT EXISTS distractor_score       integer
    CHECK (distractor_score >= 0 AND distractor_score <= 100),
  ADD COLUMN IF NOT EXISTS distractor_notes       text,
  ADD COLUMN IF NOT EXISTS originality_reviewed   boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS originality_reviewed_by text,
  ADD COLUMN IF NOT EXISTS originality_reviewed_at timestamptz;

-- Index for the review queue (pending/needs_revision queries)
CREATE INDEX IF NOT EXISTS idx_questions_review_status
  ON questions (review_status)
  WHERE is_active = true;
```

- [ ] **Step 2: Apply the migration**

Option A — Supabase MCP (preferred):
Use the `mcp__claude_ai_Supabase__apply_migration` tool with the SQL above.

Option B — Supabase CLI:
```bash
npx supabase db push
```

Option C — Supabase Dashboard:
Copy the SQL into the SQL Editor at https://app.supabase.com → SQL Editor → Run.

- [ ] **Step 3: Verify columns exist**

Run in Supabase SQL Editor:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'questions'
  AND column_name IN ('review_status','distractor_score','originality_reviewed')
ORDER BY column_name;
```

Expected: 3 rows returned with correct defaults.

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the new fields to the Question interface**

In `src/types/index.ts`, replace the `Question` interface with:

```typescript
export interface Question {
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
  correct_answer: Answer;
  explanation: string | null;
  study_eligible: boolean;
  exam_eligible: boolean;
  difficulty: Difficulty;
  is_active: boolean;
  review_status: 'pending' | 'approved' | 'needs_revision';
  review_notes: string | null;
  distractor_score: number | null;
  distractor_notes: string | null;
  originality_reviewed: boolean;
  originality_reviewed_by: string | null;
  originality_reviewed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

Also add this interface for the enhanced import response (add after `CsvRowError`):

```typescript
export interface ImportQualityResult {
  inserted: number;
  skipped: number;
  message: string;
  low_distractor_count: number;
  duplicate_count: number;
  answer_distribution: { A: number; B: number; C: number; D: number };
  flagged_questions: Array<{
    question_text: string;
    flag_type: 'distractor' | 'duplicate';
    score?: number;
    match_pct?: number;
  }>;
}
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -40
```

Expected: No new errors (any pre-existing errors are fine; none should be about `Question`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/003_review_status.sql src/types/index.ts
git commit -m "feat: add review status columns to questions + update types"
```

---

## Task 3: Install Anthropic SDK and Set API Key

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Step 1: Install the SDK**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npm install @anthropic-ai/sdk
```

Expected: `@anthropic-ai/sdk` appears in `package.json` dependencies.

- [ ] **Step 2: Add API key to .env.local**

Open `.env.local` and add:
```
ANTHROPIC_API_KEY=your_key_here
```

Get your key from https://console.anthropic.com/settings/keys

- [ ] **Step 3: Verify SDK imports correctly**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors about `@anthropic-ai/sdk`.

- [ ] **Step 4: Commit package files (not .env.local)**

```bash
git add package.json package-lock.json
git commit -m "feat: add @anthropic-ai/sdk dependency"
```

---

## Task 4: Distractor Quality Check Utility

**Files:**
- Create: `src/lib/utils/distractor-check.ts`

- [ ] **Step 1: Create the utility**

```typescript
// src/lib/utils/distractor-check.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface DistractorCheckResult {
  score: number
  note: string
}

export async function checkDistractorQuality(
  questionText: string,
  answerA: string,
  answerB: string,
  answerC: string,
  answerD: string,
  correctAnswer: string
): Promise<DistractorCheckResult> {
  const prompt = `You are evaluating multiple choice question distractors for a firefighter promotional exam.

Question: ${questionText}
A: ${answerA}
B: ${answerB}
C: ${answerC}
D: ${answerD}
Correct answer: ${correctAnswer}

Rate the quality of the THREE wrong answer choices on a scale of 0–100. A high score means the wrong answers are plausible and would challenge a knowledgeable test-taker. A low score means wrong answers are easily eliminated without knowing the material.

Deduct points for:
- Absolute language ("always", "never", "all", "none") used only in wrong answers
- Wrong answers obviously off-topic or absurd in a fire service context
- Wrong answers trivially shorter or longer than others
- Wrong answers that repeat the question stem verbatim

Respond with JSON only, no explanation outside the JSON:
{"score": <integer 0-100>, "note": "<one sentence naming the weakest option and why>"}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text.trim())
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      note: String(parsed.note || ''),
    }
  } catch {
    // If AI check fails, default to neutral score so import still succeeds
    return { score: 75, note: '' }
  }
}

export async function checkBatch(
  questions: Array<{
    question_text: string
    answer_a: string
    answer_b: string
    answer_c: string
    answer_d: string
    correct_answer: string
  }>
): Promise<DistractorCheckResult[]> {
  const CONCURRENCY = 10
  const results: DistractorCheckResult[] = []

  for (let i = 0; i < questions.length; i += CONCURRENCY) {
    const batch = questions.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map((q) =>
        checkDistractorQuality(
          q.question_text,
          q.answer_a,
          q.answer_b,
          q.answer_c,
          q.answer_d,
          q.correct_answer
        )
      )
    )
    results.push(...batchResults)
  }

  return results
}
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors in `distractor-check.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/distractor-check.ts
git commit -m "feat: add Claude Haiku distractor quality check utility"
```

---

## Task 5: Duplicate Detection Utility

**Files:**
- Create: `src/lib/utils/duplicate-detect.ts`

- [ ] **Step 1: Create the utility**

```typescript
// src/lib/utils/duplicate-detect.ts

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)  // skip short words like "is", "a", "to"
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  const intersection = [...a].filter((x) => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return intersection / union
}

export interface DuplicateMatch {
  newQuestionText: string
  matchPct: number
  existingQuestionText: string
}

export function findDuplicates(
  newTexts: string[],
  existingTexts: string[],
  threshold = 0.75
): DuplicateMatch[] {
  const existingTokens = existingTexts.map((t) => ({ text: t, tokens: tokenize(t) }))
  const matches: DuplicateMatch[] = []

  for (const newText of newTexts) {
    const newTokens = tokenize(newText)
    let bestMatch = 0
    let bestText = ''

    for (const existing of existingTokens) {
      const sim = jaccardSimilarity(newTokens, existing.tokens)
      if (sim > bestMatch) {
        bestMatch = sim
        bestText = existing.text
      }
    }

    if (bestMatch >= threshold) {
      matches.push({
        newQuestionText: newText,
        matchPct: Math.round(bestMatch * 100),
        existingQuestionText: bestText,
      })
    }
  }

  return matches
}
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors in `duplicate-detect.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/duplicate-detect.ts
git commit -m "feat: add Jaccard similarity duplicate detection utility"
```

---

## Task 6: Enhance Import API Route

**Files:**
- Modify: `src/app/api/import/route.ts`

- [ ] **Step 1: Replace the import route**

Replace the entire contents of `src/app/api/import/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkBatch } from '@/lib/utils/distractor-check'
import { findDuplicates } from '@/lib/utils/duplicate-detect'
import type { ImportQualityResult } from '@/types'

const CHUNK_SIZE = 100

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { questions } = await request.json()
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'No questions provided' }, { status: 400 })
  }

  // 1. Run distractor quality check via Claude API
  const distractorResults = await checkBatch(questions)

  // 2. Fetch existing question texts for duplicate detection
  const { data: existingRows } = await supabase
    .from('questions')
    .select('question_text')
    .eq('is_active', true)

  const existingTexts = (existingRows ?? []).map((r) => r.question_text as string)
  const duplicates = findDuplicates(
    questions.map((q) => q.question_text as string),
    existingTexts
  )
  const duplicateTexts = new Set(duplicates.map((d) => d.newQuestionText))

  // 3. Enrich questions with review data before insert
  const enriched = questions.map((q, i) => ({
    ...q,
    created_by: user.id,
    review_status: 'pending',
    distractor_score: distractorResults[i].score,
    distractor_notes: distractorResults[i].note || null,
  }))

  // 4. Insert in chunks
  let inserted = 0
  let skipped = 0
  const errors: string[] = []
  const insertedIds: string[] = []

  for (let i = 0; i < enriched.length; i += CHUNK_SIZE) {
    const chunk = enriched.slice(i, i + CHUNK_SIZE)
    const { data, error } = await supabase
      .from('questions')
      .upsert(chunk, { onConflict: 'question_text', ignoreDuplicates: true })
      .select('id')

    if (error) {
      errors.push(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${error.message}`)
    } else {
      inserted += data?.length ?? 0
      skipped += chunk.length - (data?.length ?? 0)
      insertedIds.push(...(data ?? []).map((r) => r.id as string))
    }
  }

  // 5. Build answer distribution for this batch
  const dist = { A: 0, B: 0, C: 0, D: 0 }
  for (const q of questions) {
    const key = String(q.correct_answer).toUpperCase() as keyof typeof dist
    if (key in dist) dist[key]++
  }
  const total = questions.length
  const answer_distribution = {
    A: total > 0 ? Math.round((dist.A / total) * 100) : 0,
    B: total > 0 ? Math.round((dist.B / total) * 100) : 0,
    C: total > 0 ? Math.round((dist.C / total) * 100) : 0,
    D: total > 0 ? Math.round((dist.D / total) * 100) : 0,
  }

  // 6. Build flagged questions list
  const LOW_SCORE_THRESHOLD = 60
  const flagged_questions: ImportQualityResult['flagged_questions'] = []

  questions.forEach((q, i) => {
    const score = distractorResults[i].score
    if (score < LOW_SCORE_THRESHOLD) {
      flagged_questions.push({
        question_text: q.question_text as string,
        flag_type: 'distractor',
        score,
      })
    } else if (duplicateTexts.has(q.question_text as string)) {
      const dup = duplicates.find((d) => d.newQuestionText === q.question_text)
      flagged_questions.push({
        question_text: q.question_text as string,
        flag_type: 'duplicate',
        match_pct: dup?.matchPct,
      })
    }
  })

  const result: ImportQualityResult = {
    inserted,
    skipped,
    message: errors.length > 0
      ? `Partially imported. ${errors.length} chunk(s) failed.`
      : skipped > 0
        ? `Imported ${inserted} questions, skipped ${skipped} duplicates`
        : `Successfully imported ${inserted} questions`,
    low_distractor_count: distractorResults.filter((r) => r.score < LOW_SCORE_THRESHOLD).length,
    duplicate_count: duplicates.length,
    answer_distribution,
    flagged_questions,
  }

  return NextResponse.json(result, { status: errors.length > 0 ? 207 : 200 })
}
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors in `import/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/import/route.ts
git commit -m "feat: enhance import route with distractor scoring and duplicate detection"
```

---

## Task 7: Enhance CsvImporter UI

**Files:**
- Modify: `src/components/admin/CsvImporter.tsx`

- [ ] **Step 1: Replace the CsvImporter component**

Replace entire `src/components/admin/CsvImporter.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseCsv } from "@/lib/utils/csv-parser";
import type { CsvParseResult, ImportQualityResult } from "@/types";
import { Upload, CheckCircle2, XCircle, FileText, Loader2, AlertTriangle } from "lucide-react";

const REQUIRED_COLUMNS = [
  "question_text", "answer_a", "answer_b", "answer_c", "answer_d",
  "correct_answer", "book_title", "chapter",
];
const OPTIONAL_COLUMNS = [
  "question_id", "edition", "topic", "page_start", "page_end",
  "explanation", "study_eligible", "exam_eligible", "difficulty",
];

export default function CsvImporter() {
  const router = useRouter();
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportQualityResult | null>(null);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    setImportError("");
    const result = await parseCsv(file);
    setParseResult(result);
  }

  async function handleImport() {
    if (!parseResult || parseResult.valid.length === 0) return;
    setImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parseResult.valid }),
      });
      const data: ImportQualityResult = await res.json();
      if (!res.ok && res.status !== 207) throw new Error((data as any).error || "Import failed");
      setImportResult(data);
      setParseResult(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  if (importResult) {
    const { A, B, C, D } = importResult.answer_distribution;
    const isSkewed = Math.max(A, B, C, D) > 30 || Math.min(A, B, C, D) < 20;
    const skewedLetter = isSkewed
      ? (["A", "B", "C", "D"] as const).find(
          (l) => importResult.answer_distribution[l] === Math.max(A, B, C, D)
        )
      : null;

    return (
      <div className="space-y-5">
        {/* Success header */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5 flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">
              {importResult.inserted} questions imported successfully
            </div>
            <div className="text-sm text-green-700 mt-0.5">
              All added as <strong>pending</strong> — none shown to students until reviewed
            </div>
          </div>
        </div>

        {/* Quality summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className={`text-3xl font-black ${importResult.low_distractor_count > 0 ? "text-red-600" : "text-green-600"}`}>
              {importResult.low_distractor_count}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
              Low Distractor Score
            </div>
            <div className={`text-xs mt-1 ${importResult.low_distractor_count > 0 ? "text-red-500" : "text-gray-400"}`}>
              score &lt; 60
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className={`text-3xl font-black ${importResult.duplicate_count > 0 ? "text-amber-500" : "text-green-600"}`}>
              {importResult.duplicate_count}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
              Possible Duplicates
            </div>
            <div className="text-xs text-gray-400 mt-1">≥75% similar</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-green-600">
              {importResult.inserted - importResult.low_distractor_count - importResult.duplicate_count}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
              Ready to Review
            </div>
            <div className="text-xs text-gray-400 mt-1">no flags</div>
          </div>
        </div>

        {/* Answer distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="font-semibold text-[#1B2A4A] text-sm mb-3">
            Answer Distribution — This Batch
          </div>
          <div className="flex gap-3 mb-3">
            {(["A", "B", "C", "D"] as const).map((l) => {
              const pct = importResult.answer_distribution[l];
              const isHigh = pct > 30;
              return (
                <div key={l} className="flex-1 text-center">
                  <div className={`text-sm font-bold ${isHigh ? "text-red-600" : "text-gray-700"}`}>
                    {pct}%
                  </div>
                  <div
                    className={`h-2 rounded mt-1 ${isHigh ? "bg-red-500" : "bg-blue-400"}`}
                    style={{ opacity: 0.4 + pct / 100 }}
                  />
                  <div className="text-xs font-bold text-gray-500 mt-1">{l}</div>
                </div>
              );
            })}
          </div>
          {isSkewed && skewedLetter && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              ⚠ <strong>{skewedLetter}</strong> is over-represented ({importResult.answer_distribution[skewedLetter]}%).
              When generating your next batch, ask the AI to vary correct answer placement more evenly.
            </div>
          )}
        </div>

        {/* Flagged questions */}
        {importResult.flagged_questions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="font-semibold text-[#1B2A4A] text-sm mb-3">
              Flagged Questions Preview
            </div>
            <div className="space-y-2">
              {importResult.flagged_questions.slice(0, 3).map((q, i) => (
                <div key={i} className="border border-red-100 bg-red-50 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                      q.flag_type === "distractor"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {q.flag_type === "distractor" ? "DISTRACTOR" : "DUPLICATE"}
                    </span>
                    <span className="text-xs text-gray-700 truncate">{q.question_text}</span>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${
                    q.flag_type === "distractor" ? "text-red-600" : "text-amber-600"
                  }`}>
                    {q.flag_type === "distractor" ? `Score: ${q.score}` : `${q.match_pct}% match`}
                  </span>
                </div>
              ))}
              {importResult.flagged_questions.length > 3 && (
                <div className="text-xs text-gray-400 text-center py-1">
                  + {importResult.flagged_questions.length - 3} more flagged questions in the review queue
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setImportResult(null)}
            className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Import Another CSV
          </button>
          <button
            onClick={() => router.push("/admin/review")}
            className="flex-[2] py-3 bg-[#1B2A4A] text-white rounded-lg text-sm font-bold hover:bg-[#243660]"
          >
            Go to Review Queue → {importResult.inserted} pending
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSV Format Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-800 mb-2 text-sm">Required CSV Format</h3>
        <div className="text-xs text-blue-700 font-mono bg-blue-100 rounded p-3 overflow-x-auto">
          {REQUIRED_COLUMNS.join(",")}
        </div>
        <p className="text-xs text-blue-600 mt-2">Optional columns: {OPTIONAL_COLUMNS.join(", ")}</p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>correct_answer</strong> must be A, B, C, or D. Headers are case-insensitive.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          setFileName(file.name);
          setImportResult(null);
          setImportError("");
          parseCsv(file).then(setParseResult);
        }}
      >
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">{fileName || "Click to select a CSV file"}</p>
        <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
      </div>

      {/* Parse results */}
      {parseResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">{parseResult.valid.length}</div>
                <div className="text-xs text-green-700">Valid questions</div>
              </div>
            </div>
            <div className={`border rounded-lg p-4 flex items-center gap-3 ${parseResult.errors.length > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
              <XCircle className={`w-5 h-5 ${parseResult.errors.length > 0 ? "text-red-500" : "text-gray-400"}`} />
              <div>
                <div className={`font-semibold ${parseResult.errors.length > 0 ? "text-red-700" : "text-gray-600"}`}>
                  {parseResult.errors.length}
                </div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
          </div>

          {parseResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="font-semibold text-red-800 text-sm mb-2">Validation Errors</h4>
              <div className="space-y-1 max-h-48 overflow-auto">
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-700">
                    Row {err.row} · <strong>{err.field}</strong>: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parseResult.valid.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Import will run AI distractor quality checks on all {parseResult.valid.length} questions.
                This may take 30–60 seconds for large batches.
              </p>
            </div>
          )}

          {parseResult.valid.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Preview (first 3 rows)</span>
              </div>
              <div className="divide-y divide-gray-100">
                {parseResult.valid.slice(0, 3).map((q, i) => (
                  <div key={i} className="px-4 py-3 text-xs">
                    <div className="font-medium text-gray-800 mb-1">{q.question_text.substring(0, 100)}…</div>
                    <div className="text-gray-500">{q.book_title} · {q.chapter}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {importError}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing || parseResult.valid.length === 0}
            className="w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running quality checks & importing…
              </>
            ) : (
              `Import ${parseResult.valid.length} Question${parseResult.valid.length !== 1 ? "s" : ""}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors in `CsvImporter.tsx`.

- [ ] **Step 3: Smoke test in browser**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npm run dev
```

Navigate to `http://localhost:3000/admin/import`. Upload a small CSV (2–3 rows). Verify the spinner shows during import and the enhanced results screen appears afterward.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/CsvImporter.tsx
git commit -m "feat: enhanced import UI with quality results screen"
```

---

## Task 8: Add Review PATCH Endpoint

**Files:**
- Modify: `src/app/api/questions/[id]/route.ts`

- [ ] **Step 1: Add the PATCH handler**

Add this at the end of `src/app/api/questions/[id]/route.ts` (after the DELETE handler):

```typescript
// PATCH /api/questions/[id] — update review status (admin only)
export async function PATCH(request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  const allowed = ['review_status', 'review_notes', 'originality_reviewed',
                   'originality_reviewed_by', 'originality_reviewed_at']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (body.review_status === 'approved' && !body.originality_reviewed) {
    // Auto-set originality fields when approving if not already set
    updates.originality_reviewed = body.originality_reviewed ?? false
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select('id, review_status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/questions/[id]/route.ts
git commit -m "feat: add PATCH /api/questions/[id] for review status updates"
```

---

## Task 9: Filter Sessions by Review Status

**Files:**
- Modify: `src/app/api/sessions/route.ts`

- [ ] **Step 1: Add the review_status filter**

In `src/app/api/sessions/route.ts`, find this block:

```typescript
  let query = supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .eq("study_eligible", true)
    .in("exam_type", examTypes);
```

Replace with:

```typescript
  let query = supabase
    .from("questions")
    .select("*")
    .eq("is_active", true)
    .eq("review_status", "approved")
    .eq("study_eligible", true)
    .in("exam_type", examTypes);
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/sessions/route.ts
git commit -m "feat: only serve approved questions to students in session creation"
```

---

## Task 10: Review Queue Client Component

**Files:**
- Create: `src/components/admin/ReviewQueue.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/admin/ReviewQueue.tsx
'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, XCircle, SkipForward, BookOpen, FileText, ToggleLeft, ToggleRight } from 'lucide-react'

export interface ReviewQuestion {
  id: string
  question_text: string
  answer_a: string
  answer_b: string
  answer_c: string
  answer_d: string
  correct_answer: string
  book_title: string
  edition: string | null
  chapter: string
  topic: string | null
  page_start: number | null
  page_end: number | null
  difficulty: string
  review_status: 'pending' | 'approved' | 'needs_revision'
  distractor_score: number | null
  distractor_notes: string | null
  originality_reviewed: boolean
}

interface Props {
  initialQuestions: ReviewQuestion[]
}

export default function ReviewQueue({ initialQuestions }: Props) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [index, setIndex] = useState(0)
  const [notes, setNotes] = useState('')
  const [originality, setOriginality] = useState(false)
  const [saving, setSaving] = useState(false)

  const current = questions[index] ?? null
  const total = questions.length

  const advanceOrEnd = useCallback((updatedId: string, newStatus: string) => {
    setQuestions((prev) =>
      prev.map((q) => q.id === updatedId ? { ...q, review_status: newStatus as any } : q)
    )
    setNotes('')
    setOriginality(false)
    setIndex((i) => Math.min(i + 1, total - 1))
  }, [total])

  const handleAction = useCallback(async (
    status: 'approved' | 'needs_revision',
    skipOnly = false
  ) => {
    if (!current || saving) return
    if (skipOnly) {
      setNotes('')
      setOriginality(false)
      setIndex((i) => Math.min(i + 1, total - 1))
      return
    }

    setSaving(true)
    try {
      await fetch(`/api/questions/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_status: status,
          review_notes: notes || null,
          originality_reviewed: originality,
          ...(originality ? { originality_reviewed_at: new Date().toISOString() } : {}),
        }),
      })
      advanceOrEnd(current.id, status)
    } finally {
      setSaving(false)
    }
  }, [current, saving, notes, originality, advanceOrEnd])

  if (!current) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="font-medium text-gray-600">Queue is empty</p>
          <p className="text-sm mt-1">All questions have been reviewed</p>
        </div>
      </div>
    )
  }

  const pendingCount = questions.filter((q) => q.review_status === 'pending').length
  const flaggedCount = questions.filter((q) => q.review_status === 'needs_revision').length
  const isLowScore = (current.distractor_score ?? 100) < 60

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left: Queue list */}
      <div className="w-56 shrink-0 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        <div className="px-3 py-3 border-b border-gray-200 bg-white">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Review Queue</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {pendingCount} pending · {flaggedCount} flagged
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => { setIndex(i); setNotes(''); setOriginality(false); }}
              className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                i === index
                  ? 'bg-[#1B2A4A] text-white'
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-xs font-semibold mb-1 ${
                i === index
                  ? q.review_status === 'needs_revision' ? 'text-amber-300' : 'text-blue-300'
                  : q.review_status === 'needs_revision' ? 'text-amber-500' : 'text-gray-400'
              }`}>
                {q.review_status === 'needs_revision' ? 'NEEDS REVISION' : 'PENDING'}
                {q.distractor_score !== null && q.distractor_score < 60 && (
                  <span className="ml-1">· Score: {q.distractor_score}</span>
                )}
              </div>
              <div className={`text-xs leading-tight line-clamp-2 ${i === index ? 'text-white/90' : 'text-gray-600'}`}>
                {q.question_text}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Question detail */}
      <div className="flex-1 min-w-0 space-y-3 overflow-auto">
        {/* Source reference */}
        <div className="bg-[#1B2A4A] rounded-xl px-5 py-4 flex items-center gap-4">
          <BookOpen className="w-6 h-6 text-blue-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">
              {current.book_title}{current.edition ? `, ${current.edition}` : ''}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wide">Chapter </span>
                <span className="text-xs font-semibold text-blue-300">{current.chapter}</span>
              </div>
              {(current.page_start || current.page_end) && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Pages </span>
                  <span className="text-xs font-semibold text-blue-300">
                    {current.page_start}
                    {current.page_end && current.page_end !== current.page_start
                      ? `–${current.page_end}` : ''}
                  </span>
                </div>
              )}
              {current.topic && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Topic </span>
                  <span className="text-xs font-semibold text-blue-300">{current.topic}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Distractor warning */}
        {isLowScore && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex gap-3">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <div className="text-xs font-bold text-amber-800">
                Low Distractor Score: {current.distractor_score}/100
              </div>
              {current.distractor_notes && (
                <div className="text-xs text-amber-700 mt-1">{current.distractor_notes}</div>
              )}
            </div>
          </div>
        )}

        {/* Question card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              current.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              current.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>{current.difficulty}</span>
          </div>
          <p className="text-[#1B2A4A] font-semibold text-sm leading-relaxed mb-4">
            {current.question_text}
          </p>
          <div className="space-y-2">
            {(['a', 'b', 'c', 'd'] as const).map((letter) => {
              const key = letter.toUpperCase()
              const text = current[`answer_${letter}` as keyof ReviewQuestion] as string
              const isCorrect = key === current.correct_answer
              const isFlagged = isLowScore && current.distractor_notes
                ?.toLowerCase().includes(`option ${key.toLowerCase()}`)
              return (
                <div
                  key={letter}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 ${
                    isCorrect
                      ? 'border-green-400 bg-green-50'
                      : isFlagged
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCorrect ? 'bg-green-500 text-white' : 'border-2 border-gray-400 text-gray-600'
                  }`}>{key}</span>
                  <span className="text-sm text-gray-800 flex-1">{text}</span>
                  {isCorrect && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-bold">CORRECT</span>}
                  {isFlagged && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-semibold">⚠ FLAGGED</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Originality toggle */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[#1B2A4A]">Originality Verified</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Confirm not verbatim from
              {current.page_start ? ` pp. ${current.page_start}${current.page_end && current.page_end !== current.page_start ? `–${current.page_end}` : ''}` : ' source'}
            </div>
          </div>
          <button
            onClick={() => setOriginality((v) => !v)}
            className="flex items-center gap-2"
          >
            {originality
              ? <ToggleRight className="w-8 h-8 text-green-500" />
              : <ToggleLeft className="w-8 h-8 text-gray-400" />
            }
            <span className={`text-xs font-medium ${originality ? 'text-green-600' : 'text-gray-400'}`}>
              {originality ? 'Verified' : 'Not verified'}
            </span>
          </button>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="text-xs font-semibold text-gray-500 block mb-2">
            Review Notes (required if marking Needs Revision)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note about why this needs revision..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none min-h-[60px] focus:outline-none focus:border-[#1B2A4A]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handleAction('needs_revision')}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Needs Revision
          </button>
          <button
            onClick={() => handleAction('approved', true)}
            disabled={saving}
            className="flex-1 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 font-semibold text-sm hover:bg-gray-100 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4" /> Skip
          </button>
          <button
            onClick={() => handleAction('approved')}
            disabled={saving}
            className="flex-[2] py-3 rounded-lg bg-[#1B2A4A] text-white font-bold text-sm hover:bg-[#243660] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve
          </button>
        </div>

        {/* Progress */}
        <div className="text-xs text-gray-400 text-center">
          Question {index + 1} of {total}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors in `ReviewQueue.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/ReviewQueue.tsx
git commit -m "feat: add ReviewQueue interactive client component"
```

---

## Task 11: Review Queue Server Page

**Files:**
- Create: `src/app/(app)/admin/review/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(app)/admin/review/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewQueue, { type ReviewQuestion } from '@/components/admin/ReviewQueue'

export default async function ReviewQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: questions, error } = await supabase
    .from('questions')
    .select(
      'id, question_text, answer_a, answer_b, answer_c, answer_d, correct_answer, ' +
      'book_title, edition, chapter, topic, page_start, page_end, difficulty, ' +
      'review_status, distractor_score, distractor_notes, originality_reviewed'
    )
    .eq('is_active', true)
    .in('review_status', ['pending', 'needs_revision'])
    .order('review_status', { ascending: false })   // needs_revision first
    .order('distractor_score', { ascending: true, nullsFirst: false })  // lowest score first
    .limit(200)

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Failed to load review queue: {error.message}
      </div>
    )
  }

  const pending = questions?.filter((q) => q.review_status === 'pending').length ?? 0
  const flagged = questions?.filter((q) => q.review_status === 'needs_revision').length ?? 0

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Review Queue</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pending} pending · {flagged} needs revision — approve questions to make them available to students
          </p>
        </div>
      </div>

      {!questions || questions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-5xl mb-3">✓</div>
            <p className="font-medium text-gray-600">Queue is empty</p>
            <p className="text-sm mt-1">All questions have been reviewed</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ReviewQueue initialQuestions={questions as ReviewQuestion[]} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors in `review/page.tsx`.

- [ ] **Step 3: Smoke test in browser**

Start dev server if not running:
```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npm run dev
```

Navigate to `http://localhost:3000/admin/review`. Expected: page loads, shows empty queue (or pending questions if any were imported). Clicking Approve/Needs Revision on a question should advance to the next one.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/admin/review/page.tsx
git commit -m "feat: add /admin/review queue server page"
```

---

## Task 12: Answer Distribution Panel

**Files:**
- Modify: `src/app/(app)/admin/questions/page.tsx`

- [ ] **Step 1: Read the current questions page**

Read `src/app/(app)/admin/questions/page.tsx` to see what's there before modifying.

- [ ] **Step 2: Add distribution query and panel**

In `src/app/(app)/admin/questions/page.tsx`, add the distribution query alongside existing queries (in whatever `Promise.all` or top-level fetches exist), then render the panel above the question table.

Add the distribution query:
```typescript
const { data: distRows } = await supabase
  .from('questions')
  .select('correct_answer')
  .eq('is_active', true)
  .eq('review_status', 'approved')
```
```typescript
const dist = { A: 0, B: 0, C: 0, D: 0 } as Record<string, number>
for (const row of distRows ?? []) {
  const key = String(row.correct_answer).toUpperCase()
  if (key in dist) dist[key]++
}
const distTotal = Object.values(dist).reduce((a, b) => a + b, 0)
const distPct = Object.fromEntries(
  Object.entries(dist).map(([k, v]) => [k, distTotal > 0 ? Math.round((v / distTotal) * 100) : 0])
) as Record<string, number>
const isSkewed = Object.values(distPct).some((p) => p > 30 || p < 20) && distTotal > 0
```

Add the distribution panel JSX before the question table (adapt indentation to match file):
```tsx
{distTotal > 0 && (
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-semibold text-[#1B2A4A]">Answer Distribution</h2>
        <p className="text-xs text-gray-400 mt-0.5">{distTotal} approved questions · target 20–30% each</p>
      </div>
      {isSkewed && (
        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
          ⚠ Imbalance Detected
        </span>
      )}
    </div>
    <div className="flex gap-4 mb-3">
      {(['A','B','C','D'] as const).map((l) => {
        const pct = distPct[l] ?? 0
        const isHigh = pct > 30
        const isLow = pct < 20 && distTotal > 0
        return (
          <div key={l} className="flex-1 text-center">
            <div className={`text-lg font-black ${isHigh ? 'text-red-600' : isLow ? 'text-amber-500' : 'text-[#1B2A4A]'}`}>
              {pct}%
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-1 mb-1">
              <div
                className={`h-full rounded-full ${isHigh ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-sm font-bold text-gray-500">{l}</div>
            <div className="text-xs text-gray-400">{dist[l]}</div>
          </div>
        )
      })}
    </div>
    {isSkewed && (
      <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-800">
        Ask your AI tool to vary correct answer placement more evenly in the next batch.
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Verify in browser**

Navigate to `http://localhost:3000/admin/questions`. Expected: Distribution panel appears above the question list (shows "—" or empty state if no approved questions yet).

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/admin/questions/page.tsx
git commit -m "feat: add answer distribution panel to admin questions page"
```

---

## Task 13: Update Admin Dashboard

**Files:**
- Modify: `src/app/(app)/admin/page.tsx`

- [ ] **Step 1: Add pending count query and Review Queue link**

In `src/app/(app)/admin/page.tsx`, add a pending count query to the existing `Promise.all`:

```typescript
supabase
  .from('questions')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true)
  .in('review_status', ['pending', 'needs_revision']),
```

Then destructure it: `const pendingReview = pendingRes?.count ?? 0`

Add a Review Queue card to the quick links grid (alongside the existing View Questions / Add Question / Import CSV links). Add `import { ClipboardCheck } from 'lucide-react'` to the imports:

```tsx
<Link
  href="/admin/review"
  className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:border-red-300 hover:shadow-sm transition-all"
>
  <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center">
    <ClipboardCheck className="w-5 h-5 text-amber-600" />
  </div>
  <div className="flex-1">
    <div className="font-semibold text-[#1B2A4A]">Review Queue</div>
    <div className="text-sm text-gray-500">Approve questions for students</div>
  </div>
  {pendingReview > 0 && (
    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
      {pendingReview}
    </span>
  )}
</Link>
```

- [ ] **Step 2: Type-check**

```bash
source ~/.nvm/nvm.sh && nvm use 20 && cd /Users/michaellandry/fire-promo-prep && npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/admin`. Expected: Review Queue card appears in the quick links. If there are pending questions, an amber badge shows the count.

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/admin/page.tsx
git commit -m "feat: add review queue link with pending badge to admin dashboard"
```

---

## Self-Review Checklist

Spec section → Task mapping:
- ✅ DB migration (Task 1)
- ✅ Types update (Task 2)
- ✅ Sessions filter (Task 9)
- ✅ Distractor quality check utility (Task 4)
- ✅ Duplicate detection utility (Task 5)
- ✅ Import route — distractor scores + duplicate detection + rich response (Task 6)
- ✅ Import UI — enhanced results screen (Task 7)
- ✅ Review PATCH API (Task 8)
- ✅ Review queue page (Task 11)
- ✅ ReviewQueue client component — source banner, distractor warning, originality toggle, approve/flag/skip actions (Task 10)
- ✅ Answer distribution panel (Task 12)
- ✅ Admin dashboard link + pending badge (Task 13)
