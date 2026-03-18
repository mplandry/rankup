import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Find duplicate IDs (keep oldest, delete newer)
  const { data: dupes, error } = await supabase.rpc('find_duplicate_questions')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!dupes || dupes.length === 0) {
    return NextResponse.json({ removed: 0 })
  }

  const ids = dupes.map((d: { id: string }) => d.id)
  const { error: delErr } = await supabase
    .from('questions')
    .update({ is_active: false })
    .in('id', ids)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ removed: ids.length })
}
