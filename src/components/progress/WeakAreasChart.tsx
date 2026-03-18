'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import type { WeakArea } from '@/types'

interface Props {
  items: WeakArea[]
  labelKey: 'chapter' | 'topic'
}

export default function WeakAreasChart({ items, labelKey }: Props) {
  const data = items.map((item) => ({
    label: (item[labelKey] as string) || 'Unknown',
    pct: item.pct,
    // Split into two keys so recharts can render each bar in its own color
    pctPass: item.pct >= 70 ? item.pct : 0,
    pctFail: item.pct < 70 ? item.pct : 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: '#374151' }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(val) => [`${val}%`, 'Score']}
        />
        <ReferenceLine x={70} stroke="#C0392B" strokeDasharray="4 4" />
        <Bar dataKey="pctPass" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
        <Bar dataKey="pctFail" stackId="b" fill="#ef4444" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
