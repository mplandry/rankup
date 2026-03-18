import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CHUNK_SIZE = 100

// POST /api/import — bulk insert questions from parsed CSV (admin only)
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

  // Add created_by to each question
  const enriched = questions.map((q) => ({ ...q, created_by: user.id }))

  // Insert in chunks to avoid request timeout
  let inserted = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < enriched.length; i += CHUNK_SIZE) {
    const chunk = enriched.slice(i, i + CHUNK_SIZE)
    const { data, error } = await supabase
      .from('questions')
      .upsert(chunk, {
        onConflict: 'question_text',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      errors.push(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${error.message}`)
    } else {
      inserted += data?.length ?? 0
      skipped += chunk.length - (data?.length ?? 0)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({
      inserted,
      skipped,
      errors,
      message: `Partially imported. ${errors.length} chunk(s) failed.`
    }, { status: 207 })
  }

  return NextResponse.json({
    inserted,
    skipped,
    message: skipped > 0
      ? `Imported ${inserted} questions, skipped ${skipped} duplicates`
      : `Successfully imported ${inserted} questions`
  })
}
