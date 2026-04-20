'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function WelcomePage() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email) {
        setEmail(user.email)
      } else {
        router.push('/signup')
      }
    }
    
    getUser()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1B2A4A 0%, #2C3E5F 100%)' }}>
      <div style={{ width: '100%', maxWidth: 550, padding: '0 20px' }}>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 48, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          
          <div style={{ width: 80, height: 80, margin: '0 auto 24px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(196, 30, 58, 0.2)' }}>
            <Image src="/icon.png" alt="RankUp" width={80} height={80} className="object-cover" priority />
          </div>

          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1B2A4A', marginBottom: 12, lineHeight: 1.2 }}>
            Welcome to RankUp!
          </h1>

          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
            Your account has been created successfully.
          </p>

          <div style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%)', border: '2px solid #C41E3A', borderRadius: 12, padding: 24, marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2A4A', marginBottom: 8 }}>
              Check Your Email
            </h2>
            <p style={{ fontSize: 14, color: '#1e293b', marginBottom: 16, lineHeight: 1.5 }}>
              We've sent a confirmation email to:<br />
              <strong style={{ color: '#C41E3A' }}>{email}</strong>
            </p>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Click the link in the email to activate your account and start studying!
            </p>
          </div>

          <div style={{ textAlign: 'left', background: '#f8f9fa', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B2A4A', marginBottom: 16 }}>
              What's Next?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '1️⃣', text: 'Check your email inbox (and spam folder)' },
                { icon: '2️⃣', text: 'Click the confirmation link in the email' },
                { icon: '3️⃣', text: 'Start studying with 1,500+ practice questions' },
                { icon: '4️⃣', text: 'Ace your promotional exam on April 7, 2026!' }
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 14, color: '#1e293b' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', margin: '24px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 13 }}>
            <Link href="/login" style={{ color: '#C41E3A', textDecoration: 'none', fontWeight: 600 }}>
              Already confirmed? Log in →
            </Link>
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 20, lineHeight: 1.5 }}>
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 24 }}>
          🔥 Get ready to rank up and earn your promotion!
        </p>
      </div>
    </div>
  )
}
