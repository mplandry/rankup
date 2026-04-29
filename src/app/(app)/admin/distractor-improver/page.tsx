"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

type Strategy = "plausible" | "technical" | "conceptual" | "aggressive";

type Question = {
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  [key: string]: any;
};

type Stats = {
  processed: number;
  improved: number;
  skipped: number;
  errors: number;
};

type LogEntry = {
  message: string;
  type: "info" | "success" | "error";
  timestamp: Date;
};

export default function DistractorImprover() {
  const [uploadedData, setUploadedData] = useState<Question[] | null>(null);
  const [improvedData, setImprovedData] = useState<Question[]>([]);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    processed: 0,
    improved: 0,
    skipped: 0,
    errors: 0,
  });
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [strategy, setStrategy] = useState<Strategy>("plausible");
  const [batchSize, setBatchSize] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logPanelRef = useRef<HTMLDivElement>(null);

  const strategies: Record<Strategy, string> = {
    plausible:
      "Make the incorrect answers more plausible and realistic. They should be close enough to the correct answer that a test-taker who partially understands the material might choose them. Avoid obviously wrong answers.",
    technical:
      "Make the incorrect answers technically detailed and sophisticated. Use proper terminology and concepts from the same domain. The distractors should sound authoritative.",
    conceptual:
      "Make the incorrect answers conceptually similar to the correct answer. Use related concepts, similar processes, or adjacent topics that a student might confuse with the correct answer.",
    aggressive:
      "Make this question significantly harder. The incorrect answers should be extremely plausible, using subtle distinctions, edge cases, or commonly confused concepts. Only expert-level knowledge should distinguish them from the correct answer.",
  };

  const log = (
    message: string,
    type: "info" | "success" | "error" = "info",
  ) => {
    const newLog: LogEntry = { message, type, timestamp: new Date() };
    setLogs((prev) => [...prev, newLog]);
    setTimeout(() => {
      if (logPanelRef.current) {
        logPanelRef.current.scrollTop = logPanelRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Question[];

        const requiredCols = [
          "question_text",
          "answer_a",
          "answer_b",
          "answer_c",
          "answer_d",
          "correct_answer",
        ];
        const headers = Object.keys(data[0] || {});
        const missing = requiredCols.filter((col) => !headers.includes(col));

        if (missing.length > 0) {
          alert(`Missing required columns: ${missing.join(", ")}`);
          return;
        }

        setUploadedData(data);
        setFileName(file.name);
        setShowSettings(true);
        setShowProgress(false);
        setLogs([]);
        setStats({ processed: 0, improved: 0, skipped: 0, errors: 0 });
        setImprovedData([]);
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const improveQuestion = async (
    question: Question,
    selectedStrategy: Strategy,
  ): Promise<Question> => {
    const prompt = `You are improving a firefighter promotional exam question to make it more challenging and realistic.

ORIGINAL QUESTION:
${question.question_text}

CURRENT ANSWERS:
A) ${question.answer_a}
B) ${question.answer_b}
C) ${question.answer_c}
D) ${question.answer_d}

CORRECT ANSWER: ${question.correct_answer}

IMPROVEMENT STRATEGY: ${strategies[selectedStrategy]}

CRITICAL REQUIREMENTS:
1. Keep the question text EXACTLY the same
2. Keep the correct answer EXACTLY the same
3. Only improve the THREE incorrect answers (distractors)
4. The improved distractors must be factually incorrect but plausible
5. Maintain the same length and format as the original answers
6. Do not change which letter (A/B/C/D) is correct

Respond with ONLY a JSON object in this exact format:
{
  "answer_a": "improved answer A text",
  "answer_b": "improved answer B text", 
  "answer_c": "improved answer C text",
  "answer_d": "improved answer D text"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text =
      data.content.find((item: any) => item.type === "text")?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const improved = JSON.parse(jsonMatch[0]);

    return {
      ...question,
      answer_a: improved.answer_a,
      answer_b: improved.answer_b,
      answer_c: improved.answer_c,
      answer_d: improved.answer_d,
    };
  };

  const startImprovement = async () => {
    if (!uploadedData) return;

    setShowSettings(false);
    setShowProgress(true);
    setIsProcessing(true);

    const total = uploadedData.length;
    const newStats: Stats = {
      processed: 0,
      improved: 0,
      skipped: 0,
      errors: 0,
    };
    const improved: Question[] = [];

    log(
      `Starting improvement of ${total} questions using "${strategy}" strategy`,
      "info",
    );

    for (let i = 0; i < total; i += batchSize) {
      const batch = uploadedData.slice(i, Math.min(i + batchSize, total));
      const promises = batch.map(async (q) => {
        try {
          const improvedQ = await improveQuestion(q, strategy);
          newStats.improved++;
          newStats.processed++;
          log(`✓ Improved: ${q.question_text.substring(0, 60)}...`, "success");
          return improvedQ;
        } catch (error) {
          newStats.errors++;
          newStats.processed++;
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          log(`✗ Error: ${errorMsg}`, "error");
          return q;
        }
      });

      const results = await Promise.all(promises);
      improved.push(...results);

      setProgress(Math.round((newStats.processed / total) * 100));
      setStats({ ...newStats });

      if (i + batchSize < total) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setImprovedData(improved);
    setIsProcessing(false);
    log(`✓ Complete! Improved ${newStats.improved} questions`, "success");
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(improvedData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `improved_questions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    log("✓ Downloaded improved CSV", "success");
  };

  const reset = () => {
    setUploadedData(null);
    setImprovedData([]);
    setFileName("");
    setShowSettings(false);
    setShowProgress(false);
    setLogs([]);
    setStats({ processed: 0, improved: 0, skipped: 0, errors: 0 });
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
          🎯 Distractor Improver
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
          Upload CSV files to make question distractors more challenging and
          realistic
        </div>
      </div>

      {!uploadedData && (
        <div
          style={{
            background: "var(--white)",
            border: "2px dashed var(--border)",
            borderRadius: 12,
            padding: "60px 40px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "var(--blue)";
            e.currentTarget.style.background = "#E8F4FD";
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--white)";
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--white)";
            if (e.dataTransfer.files.length) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Drop CSV file here or click to browse
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Supports standard RankUp CSV format with question_text and answer
            columns
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept='.csv'
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
      />

      {uploadedData && !showProgress && (
        <div
          style={{
            background: "#E8F4FD",
            border: "1px solid #9DCEF5",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 13.5, color: "#0066CC", fontWeight: 600 }}>
            ✓ Loaded {uploadedData.length} questions from {fileName}
          </div>
        </div>
      )}

      {showSettings && (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 28,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
            Improvement Settings
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Improvement Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as Strategy)}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <option value='plausible'>More plausible (default)</option>
              <option value='technical'>More technical depth</option>
              <option value='conceptual'>Similar concepts</option>
              <option value='aggressive'>Aggressive (hardest)</option>
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Batch size: {batchSize} questions at a time
            </label>
            <input
              type='range'
              min='1'
              max='10'
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={startImprovement}
              style={{
                flex: 1,
                padding: "12px 24px",
                background: "var(--red)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Start Improvement
            </button>
            <button
              onClick={reset}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Upload Different File
            </button>
          </div>
        </div>
      )}

      {showProgress && (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 28,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 12,
            }}
          >
            Processing {stats.processed} of {uploadedData?.length || 0}{" "}
            questions ({progress}%)
          </div>
          <div
            style={{
              background: "#F5F5F5",
              height: 8,
              borderRadius: 99,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                height: "100%",
                background: "var(--red)",
                borderRadius: 99,
                width: `${progress}%`,
                transition: "width 0.3s",
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              { label: "Processed", value: stats.processed },
              { label: "Improved", value: stats.improved },
              { label: "Skipped", value: stats.skipped },
              { label: "Errors", value: stats.errors },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{ background: "#F8F9FA", borderRadius: 8, padding: 16 }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginBottom: 4,
                  }}
                >
                  {stat.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div
            ref={logPanelRef}
            style={{
              background: "#F8F9FA",
              borderRadius: 8,
              padding: 12,
              maxHeight: 200,
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            {logs.map((log, i) => (
              <div
                key={i}
                style={{
                  color:
                    log.type === "success"
                      ? "#16A34A"
                      : log.type === "error"
                        ? "#DC2626"
                        : "#6B7280",
                  marginBottom: 2,
                }}
              >
                [{log.timestamp.toLocaleTimeString()}] {log.message}
              </div>
            ))}
          </div>

          {!isProcessing && improvedData.length > 0 && (
            <button
              onClick={downloadCSV}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: "var(--red)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Download Improved CSV
            </button>
          )}
        </div>
      )}
    </div>
  );
}
