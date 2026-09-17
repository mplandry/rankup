import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Code was invalid, expired, or already used — this is the common case
    // when an email client (e.g. Gmail's link-scanning) opens the link
    // before the user does, or the user taps an old link twice. Send them
    // back to request a fresh one instead of landing on a page with a
    // silent "no session" error.
    const fallbackPath = next.startsWith('/reset-password') ? '/reset-password' : '/login'
    const redirectUrl = new URL(fallbackPath, origin)
    redirectUrl.searchParams.set('error', 'link_expired')
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
