export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

export type ShuffledAnswer = { letter: "A" | "B" | "C" | "D"; text: string };

/** Shuffles answer choices for display and returns the new correct letter. */
export function shuffleAnswers(
  answers: { a: string; b: string; c: string; d: string },
  correctLetter: string
): { choices: ShuffledAnswer[]; correctLetter: "A" | "B" | "C" | "D" } {
  const labels = ["A", "B", "C", "D"] as const;
  const original = [
    { letter: "A" as const, text: answers.a },
    { letter: "B" as const, text: answers.b },
    { letter: "C" as const, text: answers.c },
    { letter: "D" as const, text: answers.d },
  ];
  const correctText = original.find(
    (o) => o.letter === correctLetter.toUpperCase()
  )?.text ?? "";

  const shuffled = shuffleArray(original);
  const choices: ShuffledAnswer[] = shuffled.map((item, i) => ({
    letter: labels[i],
    text: item.text,
  }));
  const newCorrect = choices.find((c) => c.text === correctText)?.letter ?? "A";
  return { choices, correctLetter: newCorrect };
}

export function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
    } else if (ch === "\n" && !inQuote) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cell = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === "," && !inQ) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map((h) =>
    h.replace(/^"|"$/g, "").toLowerCase().trim()
  );
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (vals[idx] || "").replace(/^"|"$/g, "").trim();
    });
    if (obj.question_text && obj.answer_a && obj.correct_answer) {
      rows.push(obj);
    }
  }
  return rows;
}
