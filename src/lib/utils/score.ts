import { PASSING_SCORE_PCT } from '@/lib/constants'

export function calcScorePercent(correct: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correct / total) * 1000) / 10 // one decimal
}

export function isPassing(pct: number): boolean {
  return pct >= PASSING_SCORE_PCT
}

export function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
