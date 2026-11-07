'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { PASSING_SCORE_PCT } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
import type { Answer } from '@/types'
import { ArrowRight, CheckCircle2, Flame, RotateCcw, Timer, Trophy, XCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Public, no-login preview of Alarm Levels: one 10-question round.
// Questions come from a small curated pool via game_preview_round(); each
// answer is checked server-side by game_preview_check(). Nothing here is saved
// except the email the visitor chooses to leave at the end.
// ---------------------------------------------------------------------------
interface PreviewQuestion {
  question_id: string
  question_text: string
  answer_a: string
  answer_b: string
  answer_c: string
  answer_d: string
  book_title: string
  chapter: string
}

interface CheckResult {
  correct: boolean
  correct_answer: Answer
  explanation: string | null
}

interface Missed {
  q: PreviewQuestion
  picked: Answer
  result: CheckResult
}

type Phase = 'intro' | 'loading' | 'question' | 'feedback' | 'over'

const LABELS: Answer[] = ['A', 'B', 'C', 'D']
const OPTION_FIELD: Record<Answer, 'answer_a' | 'answer_b' | 'answer_c' | 'answer_d'> = {
  A: 'answer_a',
  B: 'answer_b',
  C: 'answer_c',
  D: 'answer_d',
}
const MAX_AIR = 5
const ROUND_SIZE = 10
const CLEAR_AT = 7
const TIMER_SECS = 45

// Same algorithm as the logged-in game and Study mode.
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash << 5) - hash + i
    hash |= 0
    const j = Math.abs(hash) % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function AirBar({ air }: { air: number }) {
  return (
    <div className='flex items-center gap-2' aria-label={`Air supply ${air} of ${MAX_AIR}`}>
      <span className='text-xs font-semibold text-gray-500 dark:text-gray-400'>AIR</span>
      <div className='flex gap-1'>
        {Array.from({ length: MAX_AIR }).map((_, i) => (
          <div
            key={i}
            className={cn('h-3 w-5 rounded-sm transition-colors', i < air ? 'bg-[#C0392B]' : 'bg-gray-200 dark:bg-gray-700')}
          />
        ))}
      </div>
    </div>
  )
}

export default function PlayPreview() {
  const supabase = useMemo(() => createClient(), [])

  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState<PreviewQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [air, setAir] = useState(MAX_AIR)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [points, setPoints] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [missed, setMissed] = useState<Missed[]>([])
  const [picked, setPicked] = useState<Answer | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [lastPoints, setLastPoints] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const shownAt = useRef(0)

  // lead form
  const [email, setEmail] = useState('')
  const [examType, setExamType] = useState<'lieutenant' | 'captain'>('lieutenant')
  const [department, setDepartment] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [leadState, setLeadState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [leadError, setLeadError] = useState<string | null>(null)

  const q = round[idx] ?? null
  const keys = useMemo<Answer[]>(
    () => (q ? seededShuffle<Answer>(['A', 'B', 'C', 'D'], String(q.question_id)) : []),
    [q],
  )

  // visual countdown only
  useEffect(() => {
    if (phase !== 'question') return
    const id = setInterval(() => setElapsed((Date.now() - shownAt.current) / 1000), 250)
    return () => clearInterval(id)
  }, [phase, idx])

  const startRound = useCallback(async () => {
    setPhase('loading')
    setError(null)
    const { data, error: err } = await supabase.rpc('game_preview_round')
    const qs = (data as PreviewQuestion[] | null) ?? []
    if (err || qs.length === 0) {
      setError('Could not load the round. Please try again in a moment.')
      setPhase('intro')
      return
    }
    setRound(qs)
    setIdx(0)
    setAir(MAX_AIR)
    setStreak(0)
    setBestStreak(0)
    setPoints(0)
    setCorrectCount(0)
    setAnswered(0)
    setMissed([])
    setPicked(null)
    setResult(null)
    setLeadState('idle')
    setLeadError(null)
    setElapsed(0)
    shownAt.current = Date.now()
    setPhase('question')
  }, [supabase])

  const choose = useCallback(
    async (displayIndex: number) => {
      if (!q || submitting || phase !== 'question') return
      const original = keys[displayIndex]
      if (!original) return
      setSubmitting(true)
      setError(null)
      const secs = (Date.now() - shownAt.current) / 1000
      const { data, error: err } = await supabase.rpc('game_preview_check', {
        p_question_id: q.question_id,
        p_answer: original,
      })
      setSubmitting(false)
      if (err || !data) {
        setError('Could not check that answer. Please try again.')
        return
      }
      const res = data as CheckResult
      setPicked(original)
      setResult(res)
      setAnswered((n) => n + 1)
      if (res.correct) {
        const bonus = secs <= TIMER_SECS / 2 ? 50 : secs <= TIMER_SECS ? 25 : 0
        const gained = Math.round((100 + bonus) * (1 + 0.1 * Math.min(streak, 10)))
        const nextStreak = streak + 1
        setLastPoints(gained)
        setPoints((p) => p + gained)
        setCorrectCount((c) => c + 1)
        setStreak(nextStreak)
        setBestStreak((b) => Math.max(b, nextStreak))
        if (nextStreak % 5 === 0) setAir((a) => Math.min(MAX_AIR, a + 1))
      } else {
        setLastPoints(0)
        setStreak(0)
        setAir((a) => a - 1)
        setMissed((m) => [...m, { q, picked: original, result: res }])
      }
      setPhase('feedback')
    },
    [q, keys, submitting, phase, streak, supabase],
  )

  const goNext = useCallback(() => {
    if (air <= 0 || idx + 1 >= round.length) {
      setPhase('over')
      return
    }
    setIdx((i) => i + 1)
    setPicked(null)
    setResult(null)
    setElapsed(0)
    shownAt.current = Date.now()
    setPhase('question')
  }, [air, idx, round.length])

  // keyboard: A-D / 1-4 answer, Enter continues
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
      if (phase === 'question') {
        const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 }
        const i = map[e.key.toLowerCase()]
        if (i !== undefined) {
          e.preventDefault()
          void choose(i)
        }
      } else if (phase === 'feedback' && e.key === 'Enter') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, choose, goNext])

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    setLeadState('sending')
    setLeadError(null)
    try {
      const res = await fetch('/api/play/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          exam_type: examType,
          department,
          score_percent: answered > 0 ? Math.round((correctCount / answered) * 1000) / 10 : 0,
          answered,
          website: honeypot,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Something went wrong. Please try again.')
      }
      setLeadState('done')
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLeadState('idle')
    }
  }

  // ---------------------------------------------------------------------------
  // Shell
  // ---------------------------------------------------------------------------
  const header = (
    <header className='border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827]'>
      <div className='max-w-2xl mx-auto px-6 h-16 flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg overflow-hidden'>
            <Image src='/icon.png' alt='RankUp' width={32} height={32} className='object-cover' priority />
          </div>
          <span className='font-bold text-lg text-[#1B2A4A] dark:text-[#e2e8f0]'>RankUp</span>
        </Link>
        <Link href='/login' className='text-sm font-medium text-gray-600 dark:text-gray-300 hover:underline'>
          Log in
        </Link>
      </div>
    </header>
  )

  const shell = (children: React.ReactNode) => (
    <div className='min-h-screen bg-[#f8f9fb] dark:bg-[#0b1220]'>
      {header}
      <main className='px-6 py-8 max-w-2xl mx-auto'>{children}</main>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Intro / loading
  // ---------------------------------------------------------------------------
  if (phase === 'intro' || phase === 'loading') {
    return shell(
      <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-8'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-11 h-11 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center'>
            <Flame className='w-6 h-6 text-[#C0392B]' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>Try a 1st Alarm</h1>
            <p className='text-sm text-gray-500 dark:text-gray-400'>Ten promotional-exam questions. Free, no account needed.</p>
          </div>
        </div>
        <ul className='text-sm text-gray-700 dark:text-gray-300 space-y-2 my-6 list-disc pl-5'>
          <li>Answer 10 questions from the Lieutenant and Captain reading lists.</li>
          <li>You have 5 air. A miss costs 1, and every 5 in a row gives 1 back.</li>
          <li>Get {CLEAR_AT} of 10 to clear the alarm. Faster answers earn bonus points.</li>
          <li>Every answer comes with the explanation, so you learn even when you miss.</li>
        </ul>
        {error && (
          <div className='mb-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300'>
            {error}
          </div>
        )}
        <button
          onClick={startRound}
          disabled={phase === 'loading'}
          className='w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60'
        >
          {phase === 'loading' ? 'Loading…' : 'Start the round'}
        </button>
        <p className='text-xs text-gray-500 dark:text-gray-400 mt-4 text-center'>
          This is a small sample of the full game: five alarms, thousands of questions, and missed questions that come back until you know them.
        </p>
      </div>,
    )
  }

  // ---------------------------------------------------------------------------
  // Summary + email capture
  // ---------------------------------------------------------------------------
  if (phase === 'over') {
    const cleared = air > 0 && correctCount >= CLEAR_AT
    const pct = answered > 0 ? Math.round((correctCount / answered) * 1000) / 10 : 0
    return shell(
      <>
        <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center'>
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              cleared ? 'bg-green-100 dark:bg-green-950/40' : 'bg-red-50 dark:bg-red-950/40',
            )}
          >
            {cleared ? <Trophy className='w-8 h-8 text-green-600 dark:text-green-400' /> : <Flame className='w-8 h-8 text-[#C0392B]' />}
          </div>
          <h2 className='text-2xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0] mb-1'>
            {cleared ? '1st Alarm cleared!' : air <= 0 ? 'Out of air on the 1st Alarm' : '1st Alarm complete'}
          </h2>
          <p className='text-gray-500 dark:text-gray-400 mb-6'>
            {cleared ? 'Four alarms to go in the full game.' : `You got ${correctCount} of ${answered} right. Clearing takes ${CLEAR_AT} of ${ROUND_SIZE}.`}
          </p>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4'>
            {[
              ['Points', String(points)],
              ['Accuracy', `${pct}%`],
              ['Best streak', String(bestStreak)],
              ['Answered', String(answered)],
            ].map(([label, value]) => (
              <div key={label} className='rounded-lg bg-gray-50 dark:bg-gray-900 p-3'>
                <div className='text-xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>{value}</div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>{label}</div>
              </div>
            ))}
          </div>
          <p className='text-xs text-gray-500 dark:text-gray-400'>The real exam pass line is {PASSING_SCORE_PCT}%.</p>
        </div>

        {missed.length > 0 && (
          <details className='mt-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-5'>
            <summary className='cursor-pointer text-sm font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]'>
              Review the {missed.length} you missed
            </summary>
            <div className='mt-4 space-y-5'>
              {missed.map((m) => {
                const text = m.q[OPTION_FIELD[m.result.correct_answer]]
                return (
                  <div key={m.q.question_id} className='text-sm'>
                    <p className='font-medium text-[#1B2A4A] dark:text-[#e2e8f0] mb-1'>{m.q.question_text}</p>
                    <p className='text-green-700 dark:text-green-400 mb-1'>Correct answer: {text}</p>
                    {m.result.explanation && <p className='text-gray-600 dark:text-gray-400'>{m.result.explanation}</p>}
                    <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
                      {m.q.book_title} · Chapter {m.q.chapter}
                    </p>
                  </div>
                )
              })}
            </div>
          </details>
        )}

        <div className='mt-4 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
          {leadState === 'done' ? (
            <div className='text-center'>
              <CheckCircle2 className='w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2' />
              <h3 className='font-bold text-[#1B2A4A] dark:text-[#e2e8f0] mb-1'>You&apos;re on the list.</h3>
              <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>Ready for the real thing? Start your free trial and play all five alarms.</p>
              <Link
                href='/signup'
                className='inline-flex items-center gap-2 px-6 py-2.5 bg-[#C0392B] text-white rounded-lg text-sm font-semibold hover:bg-[#a93226]'
              >
                Start your free trial <ArrowRight className='w-4 h-4' />
              </Link>
            </div>
          ) : (
            <form onSubmit={submitLead} className='space-y-3'>
              <div>
                <h3 className='font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>Want the other four alarms?</h3>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Leave your email and we&apos;ll send exam-prep tips and updates from RankUp.
                </p>
              </div>
              {/* honeypot: real people never see or fill this */}
              <input
                type='text'
                name='website'
                tabIndex={-1}
                autoComplete='off'
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className='hidden'
                aria-hidden='true'
              />
              <input
                type='email'
                required
                maxLength={254}
                placeholder='you@department.gov'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100'
              />
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as 'lieutenant' | 'captain')}
                  className='px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100'
                  aria-label='Which exam are you studying for?'
                >
                  <option value='lieutenant'>Studying for Lieutenant</option>
                  <option value='captain'>Studying for Captain</option>
                </select>
                <input
                  type='text'
                  maxLength={80}
                  placeholder='Department (optional)'
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className='px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100'
                />
              </div>
              {leadError && <p className='text-sm text-red-600 dark:text-red-400'>{leadError}</p>}
              <button
                type='submit'
                disabled={leadState === 'sending'}
                className='w-full bg-[#1B2A4A] hover:bg-[#243660] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60'
              >
                {leadState === 'sending' ? 'Saving…' : 'Keep me posted'}
              </button>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                By submitting you agree to receive emails from RankUp. Unsubscribe anytime. We never share your email.
              </p>
            </form>
          )}
        </div>

        <div className='mt-4 flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={startRound}
            className='px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center gap-2'
          >
            <RotateCcw className='w-4 h-4' /> Play another round
          </button>
          <Link
            href='/signup'
            className='px-6 py-2.5 bg-[#C0392B] text-white rounded-lg text-sm font-medium hover:bg-[#a93226] flex items-center justify-center gap-2'
          >
            Create a free account
          </Link>
        </div>
      </>,
    )
  }

  // ---------------------------------------------------------------------------
  // Question / feedback
  // ---------------------------------------------------------------------------
  if (!q) return null
  const inFeedback = phase === 'feedback' && result !== null
  const remaining = Math.max(TIMER_SECS - elapsed, 0)
  const fastWindow = elapsed <= TIMER_SECS / 2
  const correctDisplayIndex = result ? keys.indexOf(result.correct_answer) : -1

  return shell(
    <>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <div className='text-sm font-bold text-[#C0392B]'>1st Alarm · Preview</div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>
            Question {idx + 1} of {round.length}
          </div>
        </div>
        <AirBar air={Math.max(air, 0)} />
        <div className='text-right'>
          <div className='text-lg font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>{points} pts</div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>
            {streak > 0 ? `${streak} in a row · x${(1 + 0.1 * Math.min(streak, 10)).toFixed(1)}` : 'no streak'}
          </div>
        </div>
      </div>

      {!inFeedback && (
        <div className='mb-4'>
          <div className='h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden'>
            <div
              className={cn('h-full transition-all duration-200', fastWindow ? 'bg-green-500' : remaining > 0 ? 'bg-yellow-500' : 'bg-gray-400')}
              style={{ width: `${(remaining / TIMER_SECS) * 100}%` }}
            />
          </div>
          <div className='flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400'>
            <Timer className='w-3 h-3' />
            {remaining > 0 ? `${Math.ceil(remaining)}s · ${fastWindow ? '+50 speed bonus' : '+25 speed bonus'}` : 'No speed bonus. Take your time.'}
          </div>
        </div>
      )}

      <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4'>
        <p className='text-[#1B2A4A] dark:text-[#e2e8f0] font-medium text-lg leading-relaxed mb-6'>{q.question_text}</p>
        <div className='space-y-3'>
          {LABELS.map((label, i) => {
            const original = keys[i]
            if (!original) return null
            const text = q[OPTION_FIELD[original]]
            const isPicked = picked === original
            const isCorrectOpt = inFeedback && original === result!.correct_answer

            let optClass =
              'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
            let icon = null
            if (inFeedback) {
              if (isCorrectOpt) {
                optClass = 'border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default'
                icon = <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-400 shrink-0' />
              } else if (isPicked) {
                optClass = 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/30 cursor-default'
                icon = <XCircle className='w-5 h-5 text-red-500 dark:text-red-400 shrink-0' />
              } else {
                optClass = 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60 cursor-default'
              }
            }

            return (
              <button
                key={label}
                onClick={() => void choose(i)}
                disabled={inFeedback || submitting}
                className={cn('w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all', optClass)}
              >
                <span
                  className={cn(
                    'w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0',
                    inFeedback && isCorrectOpt && 'border-green-500 bg-green-500 text-white',
                    inFeedback && isPicked && !isCorrectOpt && 'border-red-400 dark:border-red-600 bg-red-400 text-white',
                    !(inFeedback && (isCorrectOpt || isPicked)) && 'border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-400',
                  )}
                >
                  {label}
                </span>
                <span className='flex-1 text-sm text-gray-800 dark:text-gray-200'>{text}</span>
                {icon}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className='mb-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300'>
          {error}
        </div>
      )}

      {inFeedback && result && (
        <div aria-live='polite'>
          <div
            className={cn(
              'rounded-xl border-2 p-4 sm:p-5',
              result.correct
                ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/30'
                : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30',
            )}
          >
            <div className='flex items-center justify-between gap-2 mb-3'>
              <div className='flex items-center gap-2'>
                {result.correct ? (
                  <>
                    <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-400 shrink-0' />
                    <span className='font-semibold text-green-700 dark:text-green-400'>Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className='w-5 h-5 text-red-500 dark:text-red-400 shrink-0' />
                    <span className='font-semibold text-red-700 dark:text-red-400'>
                      Incorrect. Correct answer: <strong>{correctDisplayIndex >= 0 ? LABELS[correctDisplayIndex] : ''}</strong>
                    </span>
                  </>
                )}
              </div>
              <div className='text-sm font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]'>{result.correct ? `+${lastPoints}` : '0'} pts</div>
            </div>
            {result.explanation && <p className='text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed'>{result.explanation}</p>}
            <div className='text-xs text-gray-600 dark:text-gray-400'>
              {q.book_title} · Chapter {q.chapter}
            </div>
          </div>
          {air <= 0 && (
            <div className='mt-3 rounded-lg bg-[#C0392B] text-white p-3 text-sm font-medium text-center'>Out of air. That ends the round.</div>
          )}
          <button
            onClick={goNext}
            className='w-full mt-4 bg-[#1B2A4A] hover:bg-[#243660] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2'
          >
            {air <= 0 || idx + 1 >= round.length ? 'See results' : 'Next question'}
            <ArrowRight className='w-4 h-4' />
          </button>
        </div>
      )}

      {!inFeedback && <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>Tip: press A–D or 1–4 to answer.</p>}
    </>,
  )
}
