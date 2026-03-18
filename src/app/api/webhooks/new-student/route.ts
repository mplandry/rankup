import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'mplandry77@gmail.com'

export async function POST(request: Request) {
  try {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
    const RESEND_API_KEY = process.env.RESEND_API_KEY

    const secret = request.headers.get('x-webhook-secret')
    if (!secret || secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const profile = payload?.record
    if (!profile) {
      return NextResponse.json({ error: 'No record' }, { status: 400 })
    }

    const name = profile.full_name || 'Unknown'
    const email = profile.email || 'No email'
    const department = profile.department || 'Not provided'
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
        from: 'RankUp <onboarding@resend.dev>',
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
