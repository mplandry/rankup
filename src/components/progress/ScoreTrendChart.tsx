'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer
} from 'recharts'
import type { ExamSession } from '@/types'

interface Props {
  sessions: ExamSession[]
}

export default function ScoreTrendChart({ sessions }: Props) {
  const data = sessions.map((s, i) => ({
    label: `#${i + 1}`,
    date: new Date(s.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: s.score_percent ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(val) => [`${val}%`, 'Score']}
        />
        <ReferenceLine y={70} stroke="#C0392B" strokeDasharray="4 4" label={{ value: '70% Pass', fill: '#C0392B', fontSize: 11 }} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#1B2A4A"
          strokeWidth={2}
          dot={{ fill: '#1B2A4A', r: 4 }}
          activeDot={{ r: 6, fill: '#C0392B' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
