'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ phone: '', email: '' })
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      await loadStudents()
      setLoading(false)
    }
    init()
  }, [])

  const loadStudents = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const studentsWithStats = await Promise.all(
      (profiles || []).map(async (p) => {
        const { data: sessions } = await supabase
          .from('exam_sessions')
          .select('score, completed_at')
          .eq('user_id', p.id)
          .eq('mode', 'exam')
          .order('completed_at', { ascending: false })

        const scores = (sessions || []).map((s: any) => s.score).filter((s: any) => s !== null)
        const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null
        const bestScore = scores.length ? Math.max(...scores) : null
        const lastActive = sessions && sessions.length > 0
          ? new Date(sessions[0].completed_at).toLocaleDateString()
          : 'Never'

        return {
          ...p,
          exams: scores.length,
          avg_score: avgScore !== null ? `${avgScore}%` : '—',
          best_score: bestScore !== null ? `${bestScore}%` : '—',
          last_active: lastActive,
        }
      })
    )
    setStudents(studentsWithStats)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system?`)) return
    await supabase.from('profiles').delete().eq('id', id)
    await loadStudents()
  }

  const handleEdit = (s: any) => {
    setEditingId(s.id)
    setEditForm({ phone: s.phone || '', email: s.email || '' })
  }

  const handleSave = async (id: string) => {
    await supabase.from('profiles').update({
      phone: editForm.phone,
      email: editForm.email,
    }).eq('id', id)
    setEditingId(null)
    await loadStudents()
  }

  if (loading) return null
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Firefighter'

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName={userName} userEmail={user?.email || ''} />
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, padding: '36px 40px', maxWidth: 1200 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Students</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 28 }}>
          {students.length} registered students
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow