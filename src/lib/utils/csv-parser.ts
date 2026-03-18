import Papa from 'papaparse'
import type { CsvQuestionRow, CsvParseResult, CsvRowError, Answer, Difficulty } from '@/types'

const REQUIRED_FIELDS: (keyof CsvQuestionRow)[] = [
  'question_text',
  'answer_a',
  'answer_b',
  'answer_c',
  'answer_d',
  'correct_answer',
  'book_title',
  'chapter',
]

const VALID_ANSWERS = ['A', 'B', 'C', 'D']
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']

function parseBool(val: string | boolean | undefined, defaultVal = true): boolean {
  if (val === undefined || val === '') return defaultVal
  if (typeof val === 'boolean') return val
  const lower = String(val).toLowerCase().trim()
  return lower === 'true' || lower === '1' || lower === 'yes'
}

export function parseCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const valid: CsvParseResult['valid'] = []
        const errors: CsvRowError[] = []

        results.data.forEach((rawRow: unknown, index: number) => {
          const row = rawRow as Record<string, string>
          const rowNum = index + 2 // 1-based, +1 for header
          const rowErrors: CsvRowError[] = []

          // Check required fields
          for (const field of REQUIRED_FIELDS) {
            const key = field as string
            if (!row[key] || String(row[key]).trim() === '') {
              rowErrors.push({ row: rowNum, field: key, message: `"${key}" is required` })
            }
          }

          // Validate correct_answer
          const rawAnswer = String(row.correct_answer || '').trim().toUpperCase()
          if (!VALID_ANSWERS.includes(rawAnswer)) {
            rowErrors.push({
              row: rowNum,
              field: 'correct_answer',
              message: `Must be A, B, C, or D (got "${row.correct_answer}")`,
            })
          }

          // Validate difficulty
          const rawDifficulty = String(row.difficulty || 'medium').trim().toLowerCase()
          if (row.difficulty && !VALID_DIFFICULTIES.includes(rawDifficulty)) {
            rowErrors.push({
              row: rowNum,
              field: 'difficulty',
              message: `Must be easy, medium, or hard (got "${row.difficulty}")`,
            })
          }

          // Length checks
          if (row.question_text && row.question_text.length < 5) {
            rowErrors.push({ row: rowNum, field: 'question_text', message: 'Too short (min 5 chars)' })
          }

          if (rowErrors.length > 0) {
            errors.push(...rowErrors)
          } else {
            valid.push({
              source_id: row.question_id ? String(row.question_id).trim() : null,
              book_title: String(row.book_title).trim(),
              edition: row.edition ? String(row.edition).trim() : null,
              chapter: String(row.chapter).trim(),
              topic: row.topic ? String(row.topic).trim() : null,
              page_start: row.page_start ? parseInt(String(row.page_start), 10) || null : null,
              page_end: row.page_end ? parseInt(String(row.page_end), 10) || null : null,
              question_text: String(row.question_text).trim(),
              answer_a: String(row.answer_a).trim(),
              answer_b: String(row.answer_b).trim(),
              answer_c: String(row.answer_c).trim(),
              answer_d: String(row.answer_d).trim(),
              correct_answer: rawAnswer as Answer,
              explanation: row.explanation ? String(row.explanation).trim() : null,
              study_eligible: parseBool(row.study_eligible, true),
              exam_eligible: parseBool(row.exam_eligible, true),
              difficulty: (VALID_DIFFICULTIES.includes(rawDifficulty) ? rawDifficulty : 'medium') as Difficulty,
            })
          }
        })

        resolve({ valid, errors })
      },
      error: () => {
        resolve({
          valid: [],
          errors: [{ row: 0, field: 'file', message: 'Failed to parse CSV file' }],
        })
      },
    })
  })
}
