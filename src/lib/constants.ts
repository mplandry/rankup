export const EXAM_QUESTION_COUNT = 90
export const EXAM_TIME_LIMIT_SECS = 90 * 60 // 90 minutes
export const PASSING_SCORE_PCT = 70
export const DEFAULT_STUDY_COUNT = 20

// Questions/day allowed once a user's trial has expired and they haven't subscribed
export const FREE_DAILY_QUESTION_LIMIT = 1

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400',
}

export const ANSWER_LABELS: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
}

export const FIRE_RED = '#C0392B'
export const FIRE_ORANGE = '#E67E22'
export const FIRE_NAVY = '#1B2A4A'

// ============================================================
// Referral program — 10% both ways, tiered by plan.
// Referrer gets a credit, referred user gets a discount on their
// first payment. Referrer credit unlocks 30 days after the
// referred user's payment clears (chargeback/refund protection).
// Every 3rd unlocked referral earns the referrer a free month.
// ============================================================
export const REFERRAL_TIERS: Record<
  'monthly' | 'exam_prep',
  { referrerCreditCents: number; referredDiscountCents: number }
> = {
  monthly: { referrerCreditCents: 1000, referredDiscountCents: 1000 }, // $10 / $10
  exam_prep: { referrerCreditCents: 3000, referredDiscountCents: 3000 }, // $30 / $30
}

export const REFERRAL_UNLOCK_DAYS = 30
export const CREW_BONUS_MILESTONE = 3
export const CREW_BONUS_CREDIT_CENTS = 4000 // free month, matches monthly plan price
