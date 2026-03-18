'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { formatTime } from '@/lib/utils/score'

interface Props {
  initialSecs: number
  onExpire: () => void
}

export default function ExamTimer({ initialSecs, onExpire }: Props) {
  const [secs, setSecs] = useState(initialSecs)

  useEffect(() => {
    if (secs <= 0) {
      onExpire()
      return
    }
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(id)
          onExpire()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const critical = secs < 300 // under 5 minutes
  const warning = secs < 900  // under 15 minutes

  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${
      critical ? 'text-red-400 animate-pulse' : warning ? 'text-amber-300' : 'text-white'
    }`}>
      <Clock className="w-4 h-4" />
      {formatTime(secs)}
    </div>
  )
}
