'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PASSING_SCORE_PCT } from '@/lib/constants'
import { cn } from '@/lib/utils/cn'
import type { Answer } from '@/types'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  RotateCcw,
  Timer,
  Trophy,
  XCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types (shapes returned by the game_* Postgres functions)
// ---------------------------------------------------------------------------
interface GameQuestion {
  done: false
  row_id: string
  question_id: string
  question_text: string
  answer_a: string
  answer_b: string
  answer_c: string
  answer_d: string
  book_title: string
  chapter: string
  is_requeue: boolean
  alarm_level: number
  timer_secs: number
  air: number
  streak: number
  points: number
  level_answered: number
}

interface SubmitResult {
  correct: boolean
  correct_answer: Answer
  explanation: string | null
  points_awarded: number
  time_bonus: number
  streak: number
  air: number
  points: number
  alarm_level: number
  level_advanced: boolean
  level_answered: number
  run_status: 'in_progress' | 'failed' | 'cleared'
}

interface RunStats {
  alarm: number
  air: number
  streak: number
  points: number
  levelAnswered: number
}

interface RunRow {
  id: string
  started_at: string
  alarm_level: number | null
  air_remaining: number | null
  streak: number
  points: number
  score: number | null
  total_questions: number
  score_percent: number | null
  best_streak: number
  filters: { end_reason?: string } | null
}

type Phase = 'idle' | 'loading' | 'question' | 'feedback' | 'over'

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------
const LABELS: Answer[] = ['A', 'B', 'C', 'D']
const OPTION_FIELD: Record<Answer, 'answer_a' | 'answer_b' | 'answer_c' | 'answer_d'> = {
  A: 'answer_a',
  B: 'answer_b',
  C: 'answer_c',
  D: 'answer_d',
}
const ALARM_NAMES = ['1st Alarm', '2nd Alarm', '3rd Alarm', '4th Alarm', '5th Alarm']
const ALARM_SCOPE = [
  'One chapter',
  'Whole book',
  'Two books',
  'All books',
  'All books · 30 s timer',
]
const REVIEW_DELAY_MS = 3200
const MAX_AIR = 5

// Same algorithm as QuestionCard / AnswerFeedback so a question shows its
// options in the same order here as it does in Study mode.
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

function alarmName(level: number) {
  return ALARM_NAMES[Math.min(Math.max(level, 1), 5) - 1]
}

function AirBar({ air }: { air: number }) {
  return (
    <div className='flex items-center gap-2' aria-label={`Air supply ${air} of ${MAX_AIR}`}>
      <span className='text-xs font-semibold text-gray-500 dark:text-gray-400'>AIR</span>
      <div className='flex gap-1'>
        {Array.from({ length: MAX_AIR }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-3 w-5 rounded-sm transition-colors',
              i < air ? 'bg-[#C0392B]' : 'bg-gray-200 dark:bg-gray-700',
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AlarmGame() {
  const supabase = useMemo(() => createClient(), [])

  const [phase, setPhase] = useState<Phase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [stats, setStats] = useState<RunStats>({ alarm: 1, air: MAX_AIR, streak: 0, points: 0, levelAnswered: 0 })
  const [q, setQ] = useState<GameQuestion | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [picked, setPicked] = useState<Answer | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsUpgrade, setNeedsUpgrade] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [questionShownAt, setQuestionShownAt] = useState(0)
  const [reviewReady, setReviewReady] = useState(false)
  const [bonusAwarded, setBonusAwarded] = useState(0)
  const [summary, setSummary] = useState<RunRow | null>(null)
  const [openRun, setOpenRun] = useState<RunRow | null>(null)
  const [recentRuns, setRecentRuns] = useState<RunRow[]>([])

  const RUN_COLUMNS =
    'id, started_at, alarm_level, air_remaining, streak, points, score, total_questions, score_percent, best_streak, filters'

  // Display order for the current question: display slot i shows original answer keys[i].
  const keys = useMemo<Answer[]>(
    () => (q ? seededShuffle<Answer>(['A', 'B', 'C', 'D'], String(q.question_id)) : []),
    [q],
  )

  // ---- load any open run + recent runs on mount ---------------------------
  const loadRuns = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const [open, recent] = await Promise.all([
      supabase
        .from('exam_sessions')
        .select(RUN_COLUMNS)
        .eq('user_id', user.id)
        .eq('mode', 'alarm')
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1),
      supabase
        .from('exam_sessions')
        .select(RUN_COLUMNS)
        .eq('user_id', user.id)
        .eq('mode', 'alarm')
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(3),
    ])
    setOpenRun(((open.data as RunRow[] | null) ?? [])[0] ?? null)
    setRecentRuns((recent.data as RunRow[] | null) ?? [])
  }, [supabase])

  useEffect(() => {
    void loadRuns()
  }, [loadRuns])

  // ---- per-question countdown (visual only; the server measures real time) -
  useEffect(() => {
    if (phase !== 'question' || !q) return
    const id = setInterval(() => setElapsed((Date.now() - questionShownAt) / 1000), 250)
    return () => clearInterval(id)
  }, [phase, q, questionShownAt])

  // ---- "I get it" unlocks 3 s after a miss --------------------------------
  useEffect(() => {
    if (phase !== 'feedback' || !result || result.correct) return
    setReviewReady(false)
    const id = setTimeout(() => setReviewReady(true), REVIEW_DELAY_MS)
    return () => clearTimeout(id)
  }, [phase, result])

  // ---- server calls --------------------------------------------------------
  const showSummary = useCallback(
    async (sid: string) => {
      const { data } = await supabase.from('exam_sessions').select(RUN_COLUMNS).eq('id', sid).single()
      setSummary((data as RunRow | null) ?? null)
      setPhase('over')
      void loadRuns()
    },
    [supabase, loadRuns],
  )

  const fetchNext = useCallback(
    async (sid: string) => {
      setPhase('loading')
      setError(null)
      const { data, error: err } = await supabase.rpc('game_next_question', { p_session_id: sid })
      if (err || !data) {
        setError(err?.message ?? 'Could not load the next question.')
        setPhase('idle')
        return
      }
      if ((data as { done: boolean }).done) {
        await showSummary(sid)
        return
      }
      const nq = data as GameQuestion
      setQ(nq)
      setResult(null)
      setPicked(null)
      setBonusAwarded(0)
      setElapsed(0)
      setQuestionShownAt(Date.now())
      setStats({
        alarm: nq.alarm_level,
        air: nq.air,
        streak: nq.streak,
        points: nq.points,
        levelAnswered: nq.level_answered,
      })
      setPhase('question')
    },
    [supabase, showSummary],
  )

  const startRun = useCallback(async () => {
    setQ(null)
    setResult(null)
    setSummary(null)
    setPhase('loading')
    setError(null)
    setNeedsUpgrade(false)
    const { data, error: err } = await supabase.rpc('game_start_run')
    if (err || !data) {
      const msg = err?.message ?? 'Could not start a run.'
      if (msg.includes('ACCESS_REQUIRED')) setNeedsUpgrade(true)
      else setError(msg)
      setPhase('idle')
      return
    }
    const sid = (data as { session_id: string }).session_id
    setSessionId(sid)
    setSummary(null)
    await fetchNext(sid)
  }, [supabase, fetchNext])

  const resumeRun = useCallback(async () => {
    if (!openRun) return
    setSessionId(openRun.id)
    setQ(null)
    setResult(null)
    setSummary(null)
    await fetchNext(openRun.id)
  }, [openRun, fetchNext])

  const choose = useCallback(
    async (displayIndex: number) => {
      if (!q || submitting || phase !== 'question') return
      const original = keys[displayIndex]
      if (!original) return
      setSubmitting(true)
      setError(null)
      const { data, error: err } = await supabase.rpc('game_submit_answer', {
        p_row_id: q.row_id,
        p_answer: original,
      })
      setSubmitting(false)
      if (err || !data) {
        setError(err?.message ?? 'Could not submit your answer.')
        return
      }
      const res = data as SubmitResult
      setPicked(original)
      setResult(res)
      setStats({
        alarm: res.alarm_level,
        air: res.air,
        streak: res.streak,
        points: res.points,
        levelAnswered: res.level_answered,
      })
      setPhase('feedback')
    },
    [q, keys, submitting, phase, supabase],
  )

  const goNext = useCallback(async () => {
    if (!result || !sessionId) return
    if (result.run_status !== 'in_progress') {
      await showSummary(sessionId)
      return
    }
    await fetchNext(sessionId)
  }, [result, sessionId, showSummary, fetchNext])

  const claimBonus = useCallback(async () => {
    if (!q || bonusAwarded > 0) return
    const { data } = await supabase.rpc('game_claim_review_bonus', { p_row_id: q.row_id })
    const awarded = (data as { awarded?: number } | null)?.awarded ?? 0
    if (awarded > 0) {
      setBonusAwarded(awarded)
      setStats((s) => ({ ...s, points: s.points + awarded }))
    }
  }, [q, bonusAwarded, supabase])

  const endRun = useCallback(async () => {
    if (!sessionId) return
    await supabase.rpc('game_finish_run', { p_session_id: sessionId, p_reason: 'quit' })
    await showSummary(sessionId)
  }, [sessionId, supabase, showSummary])

  // ---- keyboard: A-D / 1-4 answer, Enter continues -------------------------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'question') {
        const map: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 }
        const i = map[e.key.toLowerCase()]
        if (i !== undefined) {
          e.preventDefault()
          void choose(i)
        }
      } else if (phase === 'feedback' && e.key === 'Enter') {
        e.preventDefault()
        void goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, choose, goNext])

  // ---------------------------------------------------------------------------
  // Render: idle / start screen
  // ---------------------------------------------------------------------------
  if (phase === 'idle' || (phase === 'loading' && !q)) {
    return (
      <div className='p-8 max-w-2xl mx-auto'>
        <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-8'>
          <div className='flex items-center gap-3 mb-2'>
            <div className='w-11 h-11 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center'>
              <Flame className='w-6 h-6 text-[#C0392B]' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>Alarm Levels</h1>
              <p className='text-sm text-gray-500 dark:text-gray-400'>Work your way up from a 1st alarm to a 5th alarm.</p>
            </div>
          </div>

          <ul className='text-sm text-gray-700 dark:text-gray-300 space-y-2 my-6 list-disc pl-5'>
            <li>Each alarm is 10 questions. Get 7 right to move up.</li>
            <li>You have 5 air. A miss costs 1; every 5 in a row gives 1 back. Out of air ends the run.</li>
            <li>Questions you miss come back a few questions later.</li>
            <li>Accuracy comes first: answering faster adds bonus points, but slow answers still score.</li>
          </ul>

          {needsUpgrade && (
            <div className='mb-4 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 p-4 text-sm text-yellow-800 dark:text-yellow-300'>
              Alarm Levels is part of full access. Your trial has ended.{' '}
              <Link href='/pricing' className='font-semibold underline'>
                See plans
              </Link>
              .
            </div>
          )}
          {error && (
            <div className='mb-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300'>
              {error}
            </div>
          )}

          <div className='flex flex-col sm:flex-row gap-3'>
            {openRun && (
              <button
                onClick={resumeRun}
                disabled={phase === 'loading'}
                className='flex-1 bg-[#1B2A4A] hover:bg-[#243660] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60'
              >
                Resume run · {alarmName(openRun.alarm_level ?? 1)} · {openRun.points} pts
              </button>
            )}
            <button
              onClick={startRun}
              disabled={phase === 'loading'}
              className={cn(
                'flex-1 font-semibold py-3 rounded-lg transition-colors disabled:opacity-60',
                openRun
                  ? 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                  : 'bg-[#C0392B] hover:bg-[#a93226] text-white',
              )}
            >
              {phase === 'loading' ? 'Loading…' : openRun ? 'Start a new run' : 'Start run'}
            </button>
          </div>
        </div>

        {recentRuns.length > 0 && (
          <div className='mt-6 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
            <h2 className='text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3'>Recent runs</h2>
            <div className='divide-y divide-gray-100 dark:divide-gray-800'>
              {recentRuns.map((r) => (
                <div key={r.id} className='flex items-center justify-between py-2 text-sm'>
                  <span className='text-gray-700 dark:text-gray-300'>
                    {new Date(r.started_at).toLocaleDateString()} · {alarmName(r.alarm_level ?? 1)}
                    {r.filters?.end_reason === 'cleared' && ' · cleared'}
                  </span>
                  <span className='font-medium text-[#1B2A4A] dark:text-[#e2e8f0]'>
                    {r.score_percent ?? 0}% · {r.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: summary
  // ---------------------------------------------------------------------------
  if (phase === 'over') {
    const cleared = summary?.filters?.end_reason === 'cleared'
    const pct = summary?.score_percent ?? 0
    return (
      <div className='p-8 max-w-2xl mx-auto'>
        <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center'>
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              cleared ? 'bg-green-100 dark:bg-green-950/40' : 'bg-red-50 dark:bg-red-950/40',
            )}
          >
            {cleared ? (
              <Trophy className='w-8 h-8 text-green-600 dark:text-green-400' />
            ) : (
              <Flame className='w-8 h-8 text-[#C0392B]' />
            )}
          </div>
          <h2 className='text-2xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0] mb-1'>
            {cleared
              ? 'All five alarms cleared!'
              : summary?.filters?.end_reason === 'quit'
                ? `You called it off on the ${alarmName(summary?.alarm_level ?? stats.alarm)}`
                : `Out of air on the ${alarmName(summary?.alarm_level ?? stats.alarm)}`}
          </h2>
          <p className='text-gray-500 dark:text-gray-400 mb-6'>
            {cleared
              ? 'Strong work.'
              : `You got ${summary?.score ?? 0} of ${summary?.total_questions ?? 0} right. Review what you missed in Study mode, then go again.`}
          </p>

          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
            {[
              ['Points', String(summary?.points ?? stats.points)],
              ['Accuracy', `${pct}%`],
              ['Best streak', String(summary?.best_streak ?? 0)],
              ['Answered', String(summary?.total_questions ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className='rounded-lg bg-gray-50 dark:bg-gray-900 p-3'>
                <div className='text-xl font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>{value}</div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>{label}</div>
              </div>
            ))}
          </div>

          <p className='text-xs text-gray-500 dark:text-gray-400 mb-6'>
            The real exam pass line is {PASSING_SCORE_PCT}%. Your accuracy this run was {pct}%.
          </p>

          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <button
              onClick={() => {
                setPhase('idle')
                setQ(null)
                setSummary(null)
                void loadRuns()
              }}
              className='px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900'
            >
              Back
            </button>
            <button
              onClick={startRun}
              className='px-6 py-2.5 bg-[#C0392B] text-white rounded-lg text-sm font-medium hover:bg-[#a93226] flex items-center justify-center gap-2'
            >
              <RotateCcw className='w-4 h-4' />
              Play again
            </button>
            <Link
              href='/study'
              className='px-6 py-2.5 bg-[#1B2A4A] text-white rounded-lg text-sm font-medium hover:bg-[#243660] flex items-center justify-center gap-2'
            >
              <BookOpen className='w-4 h-4' />
              Study mode
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: question / feedback
  // ---------------------------------------------------------------------------
  if (!q) return null
  if (phase === 'loading') {
    return (
      <div className='p-8 max-w-2xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400'>Loading next question…</div>
    )
  }
  const inFeedback = phase === 'feedback' && result !== null
  const timerSecs = q.timer_secs
  const remaining = Math.max(timerSecs - elapsed, 0)
  const fastWindow = elapsed <= timerSecs / 2
  const correctDisplayIndex = result ? keys.indexOf(result.correct_answer) : -1

  return (
    <div className='p-8 max-w-2xl mx-auto'>
      {/* HUD */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <div>
          <div className='text-sm font-bold text-[#C0392B]'>{alarmName(stats.alarm)}</div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>
            {ALARM_SCOPE[Math.min(Math.max(stats.alarm, 1), 5) - 1]} · {Math.min(stats.levelAnswered + (inFeedback ? 0 : 1), 10)}/10
          </div>
        </div>
        <AirBar air={stats.air} />
        <div className='text-right'>
          <div className='text-lg font-bold text-[#1B2A4A] dark:text-[#e2e8f0]'>{stats.points} pts</div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>
            {stats.streak > 0 ? `${stats.streak} in a row · x${(1 + 0.1 * Math.min(stats.streak, 10)).toFixed(1)}` : 'no streak'}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      {!inFeedback && (
        <div className='mb-4'>
          <div className='h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden'>
            <div
              className={cn('h-full transition-all duration-200', fastWindow ? 'bg-green-500' : remaining > 0 ? 'bg-yellow-500' : 'bg-gray-400')}
              style={{ width: `${(remaining / timerSecs) * 100}%` }}
            />
          </div>
          <div className='flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400'>
            <Timer className='w-3 h-3' />
            {remaining > 0 ? `${Math.ceil(remaining)}s · ${fastWindow ? '+50 speed bonus' : '+25 speed bonus'}` : 'No speed bonus — take your time'}
          </div>
        </div>
      )}

      {/* Question */}
      <div className='bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4'>
        {q.is_requeue && (
          <div className='inline-block mb-3 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400'>
            Second chance — you missed this one earlier
          </div>
        )}
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

      {/* Feedback */}
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
                      Incorrect — correct answer: <strong>{correctDisplayIndex >= 0 ? LABELS[correctDisplayIndex] : ''}</strong>
                    </span>
                  </>
                )}
              </div>
              <div className='text-sm font-semibold text-[#1B2A4A] dark:text-[#e2e8f0]'>
                {result.correct ? `+${result.points_awarded}` : '0'} pts
                {result.correct && result.time_bonus > 0 && (
                  <span className='font-normal text-xs text-gray-500 dark:text-gray-400'> (speed +{result.time_bonus})</span>
                )}
              </div>
            </div>

            {result.explanation && (
              <p className='text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed'>{result.explanation}</p>
            )}
            <div className='text-xs text-gray-600 dark:text-gray-400'>
              {q.book_title} · Chapter {q.chapter}
            </div>

            {!result.correct && (
              <div className='mt-3'>
                <button
                  onClick={claimBonus}
                  disabled={!reviewReady || bonusAwarded > 0}
                  className='text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800 disabled:opacity-60'
                >
                  {bonusAwarded > 0
                    ? `+${bonusAwarded} for reviewing`
                    : reviewReady
                      ? "I get it  (+50)"
                      : 'Read the explanation…'}
                </button>
              </div>
            )}
          </div>

          {result.level_advanced && result.run_status === 'in_progress' && (
            <div className='mt-3 rounded-lg bg-[#1B2A4A] text-white p-3 text-sm font-medium text-center'>
              {alarmName(result.alarm_level - 1)} cleared. Moving up to the {alarmName(result.alarm_level)}.
            </div>
          )}
          {result.run_status === 'failed' && (
            <div className='mt-3 rounded-lg bg-[#C0392B] text-white p-3 text-sm font-medium text-center'>
              Out of air. That ends the run.
            </div>
          )}
          {result.run_status === 'cleared' && (
            <div className='mt-3 rounded-lg bg-green-600 text-white p-3 text-sm font-medium text-center'>
              5th Alarm cleared!
            </div>
          )}

          <button
            onClick={() => void goNext()}
            className='w-full mt-4 bg-[#1B2A4A] hover:bg-[#243660] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2'
          >
            {result.run_status === 'in_progress' ? 'Next question' : 'See results'}
            <ArrowRight className='w-4 h-4' />
          </button>
        </div>
      )}

      {!inFeedback && (
        <div className='flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400'>
          <span>Tip: press A–D or 1–4 to answer.</span>
          <button onClick={() => void endRun()} className='underline hover:text-gray-700 dark:hover:text-gray-200'>
            End run
          </button>
        </div>
      )}
    </div>
  )
}
