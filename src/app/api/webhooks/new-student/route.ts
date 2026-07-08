import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'mplandry77@gmail.com'

export async function POST(request: Request) {
  try {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    const RESEND_API_KEY = process.env.RESEND_API_KEY

    // Supabase Database Webhooks can authenticate in two different ways
    // depending on how they're configured: a custom header ("x-webhook-secret")
    // or a "send service role JWT" auth header. The Supabase dashboard's
    // "Authorization header with service_role key" webhook option sends the
    // raw JWT with NO "Bearer " prefix — this previously required a "Bearer "
    // prefix and silently 401'd on every real signup as a result (confirmed
    // via net._http_response). Accept the token with or without that prefix.
    const providedSecret = request.headers.get('x-webhook-secret')
    const authHeader = request.headers.get('authorization')
    const providedBearer = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : authHeader

    const authorizedBySecret = !!providedSecret && providedSecret === WEBHOOK_SECRET
    const authorizedByServiceRole =
      !!providedBearer && !!SERVICE_ROLE_KEY && providedBearer === SERVICE_ROLE_KEY

    if (!authorizedBySecret && !authorizedByServiceRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const profile = payload?.record
    if (!profile) {
      return NextResponse.json({ error: 'No record' }, { status: 400 })
    }

    // This webhook fires on INSERT into auth.users, so the payload record is
    // the raw auth user row, not a public.profiles row. full_name/department
    // live under raw_user_meta_data (set at signup), not top-level fields.
    const metadata = profile.raw_user_meta_data || {}
    const name = metadata.full_name || 'Unknown'
    const email = profile.email || 'No email'
    const department = metadata.department || 'Not provided'
    const joinedAt = new Date(profile.created_at).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RankUp <support@rankupfire.com>',
        to: ADMIN_EMAIL,
        subject: `New student enrolled: ${name}`,
        html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Department: ${department}</p><p>Joined: ${joinedAt}</p>`,
      }),
    })

    const emailData = await emailRes.json()

    return NextResponse.json({
      ok: emailRes.ok,
      status: emailRes.status,
      resend: emailData,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
