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
