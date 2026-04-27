// src/lib/utils/duplicate-detect.ts

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)  // skip short words like "is", "a", "to"
  )
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  const intersection = [...a].filter((x) => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return intersection / union
}

export interface DuplicateMatch {
  newQuestionText: string
  matchPct: number
  existingQuestionText: string
}

export function findDuplicates(
  newTexts: string[],
  existingTexts: string[],
  threshold = 0.75
): DuplicateMatch[] {
  const existingTokens = existingTexts.map((t) => ({ text: t, tokens: tokenize(t) }))
  const matches: DuplicateMatch[] = []

  for (const newText of newTexts) {
    const newTokens = tokenize(newText)
    let bestMatch = 0
    let bestText = ''

    for (const existing of existingTokens) {
      const sim = jaccardSimilarity(newTokens, existing.tokens)
      if (sim > bestMatch) {
        bestMatch = sim
        bestText = existing.text
      }
    }

    if (bestMatch >= threshold) {
      matches.push({
        newQuestionText: newText,
        matchPct: Math.round(bestMatch * 100),
        existingQuestionText: bestText,
      })
    }
  }

  return matches
}
