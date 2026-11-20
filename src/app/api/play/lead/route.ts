import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextRequest, NextResponse } from 'next/server'

// Public endpoint: saves an email left at the end of the /play preview.
// Writes go through the service role key; the play_leads table has no browser access.
export async function POST(request: NextRequest) {
  try {
    const raw = await request.text()
    if (raw.length > 2048) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }
    const body = JSON.parse(raw) as {
      email?: unknown
      exam_type?: unknown
      department?: unknown
      score_percent?: unknown
      answered?: unknown
      website?: unknown
    }

    // Honeypot: bots fill the hidden field. Pretend success and save nothing.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json({ success: true })
    }

    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
    }

    const examType = body.exam_type === 'lieutenant' || body.exam_type === 'captain' ? body.exam_type : null
    const department =
      typeof body.department === 'string' && body.department.trim() !== ''
        ? body.department.trim().slice(0, 80)
        : null
    const scorePercent =
      typeof body.score_percent === 'number' && body.score_percent >= 0 && body.score_percent <= 100
        ? body.score_percent
        : null
    const answered =
      typeof body.answered === 'number' && Number.isInteger(body.answered) && body.answered >= 0 && body.answered <= 10
        ? body.answered
        : null

    const supabase = createServiceRoleClient()
    const { error } = await supabase.from('play_leads').upsert(
      {
        email,
        exam_type: examType,
        department,
        score_percent: scorePercent,
        answered,
        marketing_opt_in: true,
        source: 'play_preview',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    )
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Play lead error:', error)
    return NextResponse.json({ error: 'Could not save your email. Please try again.' }, { status: 500 })
  }
}
