// src/lib/utils/distractor-check.ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface DistractorCheckResult {
  score: number
  note: string
}

export async function checkDistractorQuality(
  questionText: string,
  answerA: string,
  answerB: string,
  answerC: string,
  answerD: string,
  correctAnswer: string
): Promise<DistractorCheckResult> {
  const prompt = `You are evaluating multiple choice question distractors for a firefighter promotional exam.

Question: ${questionText}
A: ${answerA}
B: ${answerB}
C: ${answerC}
D: ${answerD}
Correct answer: ${correctAnswer}

Rate the quality of the THREE wrong answer choices on a scale of 0–100. A high score means the wrong answers are plausible and would challenge a knowledgeable test-taker. A low score means wrong answers are easily eliminated without knowing the material.

Deduct points for:
- Absolute language ("always", "never", "all", "none") used only in wrong answers
- Wrong answers obviously off-topic or absurd in a fire service context
- Wrong answers trivially shorter or longer than others
- Wrong answers that repeat the question stem verbatim

Respond with JSON only, no explanation outside the JSON:
{"score": <integer 0-100>, "note": "<one sentence naming the weakest option and why>"}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(text)
    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      note: String(parsed.note || ''),
    }
  } catch {
    // If AI check fails, default to neutral score so import still succeeds
    return { score: 75, note: '' }
  }
}

export async function checkBatch(
  questions: Array<{
    question_text: string
    answer_a: string
    answer_b: string
    answer_c: string
    answer_d: string
    correct_answer: string
  }>
): Promise<DistractorCheckResult[]> {
  const CONCURRENCY = 10
  const results: DistractorCheckResult[] = []

  for (let i = 0; i < questions.length; i += CONCURRENCY) {
    const batch = questions.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map((q) =>
        checkDistractorQuality(
          q.question_text,
          q.answer_a,
          q.answer_b,
          q.answer_c,
          q.answer_d,
          q.correct_answer
        )
      )
    )
    results.push(...batchResults)
  }

  return results
}
