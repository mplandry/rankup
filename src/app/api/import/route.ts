import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkBatch } from '@/lib/utils/distractor-check'
import { findDuplicates } from '@/lib/utils/duplicate-detect'
import type { ImportQualityResult } from '@/types'

export const maxDuration = 300 // 5 minutes — AI distractor checks can be slow on large CSVs

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
