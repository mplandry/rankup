import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'mplandry77@gmail.com'

export async function POST(request: Request) {
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
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #1B2A4A; padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0; font-size: 20px;">New Student Enrolled</h2>
          </div>
          <div style="background: #f8f9fb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Name</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Department</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${department}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Joined</td>
                <td style="padding: 8px 0; color: #111827; font-size: 14px;">${joinedAt}</td>
              </tr>
            </table>
          </div>
        </div>
      `,
    }),
  })

  const emailData = await emailRes.json()
  if (!emailRes.ok) {
    console.error('Resend error:', emailData)
    return NextResponse.json({ error: 'Email failed', details: emailData }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
