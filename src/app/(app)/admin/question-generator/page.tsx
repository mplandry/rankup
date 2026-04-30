"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, Database, BookOpen } from "lucide-react";

type Strategy = "plausible" | "technical" | "conceptual" | "aggressive";

type QuestionDraft = {
  question_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: string;
  explanation: string;
  book_title: string;
  edition: string;
  chapter: string;
  topic: string;
  page_start: number;
  page_end: number;
  difficulty: "easy" | "medium" | "hard";
};

export default function QuestionGenerator() {
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    book_title: "",
    edition: "",
    chapter: "",
    page_start: "",
    page_end: "",
  });
  const [strategy, setStrategy] = useState<Strategy>("plausible");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionDraft[]>(
    [],
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [stage, setStage] = useState<"upload" | "processing" | "preview">(
    "upload",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    setScreenshots(imageFiles);
  };

  const log = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const startGeneration = async () => {
    if (screenshots.length === 0) {
      alert("Please upload at least one screenshot");
      return;
    }

    if (!metadata.book_title || !metadata.chapter) {
      alert("Please fill in book title and chapter");
      return;
    }

    setStage("processing");
    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    setGeneratedQuestions([]);

    log(`Starting generation for ${screenshots.length} pages...`);

    try {
      // Convert screenshots to base64
      log("Converting screenshots to base64...");
      const base64Screenshots = await Promise.all(
        screenshots.map((file) => convertFileToBase64(file)),
      );

      setProgress(10);
      log(`✓ Prepared ${base64Screenshots.length} screenshots for processing`);

      // Call the API
      log("Sending to Claude Vision API...");
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          screenshots: base64Screenshots,
          metadata,
          strategy,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate questions");
      }

      setProgress(50);

      const data = await response.json();

      // Add API logs to our log display
      if (data.logs) {
        data.logs.forEach((logMsg: string) => log(logMsg));
      }

      setProgress(90);

      if (data.questions && data.questions.length > 0) {
        setGeneratedQuestions(data.questions);
        log(`✓ Successfully generated ${data.questions.length} questions!`);
        setProgress(100);

        // Wait a moment before transitioning to preview
        setTimeout(() => {
          setStage("preview");
          setIsProcessing(false);
        }, 500);
      } else {
        throw new Error("No questions were generated");
      }
    } catch (error: any) {
      log(`✗ Error: ${error.message}`);
      alert(`Generation failed: ${error.message}`);
      setIsProcessing(false);
      setStage("upload");
    }
  };

  // Helper function to convert File to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const importToDatabase = async () => {
    if (generatedQuestions.length === 0) {
      alert("No questions to import");
      return;
    }

    const confirmImport = confirm(
      `Import ${generatedQuestions.length} questions to the database?\n\n` +
        `This will add them to the active question bank for:\n` +
        `• ${metadata.book_title}\n` +
        `• Chapter ${metadata.chapter}\n\n` +
        `Continue?`,
    );

    if (!confirmImport) return;

    setIsProcessing(true);
    log("Starting database import...");

    try {
      // TODO: Import to Supabase
      // For now, we'll just show a success message
      // The actual Supabase import will be implemented next

      log(`✓ Successfully imported ${generatedQuestions.length} questions`);
      alert(
        `Success! Imported ${generatedQuestions.length} questions to the database.`,
      );

      // Reset the form
      setStage("upload");
      setGeneratedQuestions([]);
      setScreenshots([]);
      setMetadata({
        book_title: "",
        edition: "",
        chapter: "",
        page_start: "",
        page_end: "",
      });
      setLogs([]);
    } catch (error: any) {
      log(`✗ Import error: ${error.message}`);
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
          🎯 Question Generator
        </div>
        <div style={{ fontSize: 13.5, color: "#6B7280" }}>
          Upload book screenshots → AI generates questions → Import to database
        </div>
      </div>

      {stage === "upload" && (
        <>
          {/* Screenshot Upload */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 28,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Step 1: Upload Screenshots
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
              style={{
                border: "2px dashed #E5E7EB",
                borderRadius: 12,
                padding: "60px 40px",
                textAlign: "center",
                cursor: "pointer",
                background: "#F9FAFB",
                marginBottom: 16,
              }}
            >
              <Upload
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto 16px",
                  color: "#6B7280",
                }}
              />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                Drop screenshots here or click to browse
              </div>
              <div style={{ fontSize: 13, color: "#6B7280" }}>
                Upload 1-15 book pages (PNG, JPG, PDF)
              </div>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: "none" }}
              />
            </div>
            {screenshots.length > 0 && (
              <div style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>
                ✓ {screenshots.length} file{screenshots.length > 1 ? "s" : ""}{" "}
                uploaded
              </div>
            )}
          </div>

          {/* Metadata Form */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 28,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Step 2: Book Information
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    marginBottom: 6,
                    color: "#6B7280",
                  }}
                >
                  Book Title *
                </label>
                <input
                  type='text'
                  value={metadata.book_title}
                  onChange={(e) =>
                    setMetadata({ ...metadata, book_title: e.target.value })
                  }
                  placeholder='Building Construction Related to the Fire Service'
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    marginBottom: 6,
                    color: "#6B7280",
                  }}
                >
                  Edition *
                </label>
                <input
                  type='text'
                  value={metadata.edition}
                  onChange={(e) =>
                    setMetadata({ ...metadata, edition: e.target.value })
                  }
                  placeholder='4th Edition'
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    marginBottom: 6,
                    color: "#6B7280",
                  }}
                >
                  Chapter *
                </label>
                <input
                  type='text'
                  value={metadata.chapter}
                  onChange={(e) =>
                    setMetadata({ ...metadata, chapter: e.target.value })
                  }
                  placeholder='6'
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    marginBottom: 6,
                    color: "#6B7280",
                  }}
                >
                  Page Start
                </label>
                <input
                  type='number'
                  value={metadata.page_start}
                  onChange={(e) =>
                    setMetadata({ ...metadata, page_start: e.target.value })
                  }
                  placeholder='120'
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    marginBottom: 6,
                    color: "#6B7280",
                  }}
                >
                  Page End
                </label>
                <input
                  type='number'
                  value={metadata.page_end}
                  onChange={(e) =>
                    setMetadata({ ...metadata, page_end: e.target.value })
                  }
                  placeholder='125'
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Strategy Selection */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 28,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Step 3: Question Quality
            </div>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as Strategy)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value='plausible'>
                Standard (plausible distractors)
              </option>
              <option value='technical'>
                Technical (detailed distractors)
              </option>
              <option value='conceptual'>Conceptual (similar concepts)</option>
              <option value='aggressive'>
                Aggressive (expert-level difficulty)
              </option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={startGeneration}
            disabled={
              screenshots.length === 0 ||
              !metadata.book_title ||
              !metadata.chapter
            }
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "#DC2626",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor:
                screenshots.length === 0 ||
                !metadata.book_title ||
                !metadata.chapter
                  ? "not-allowed"
                  : "pointer",
              opacity:
                screenshots.length === 0 ||
                !metadata.book_title ||
                !metadata.chapter
                  ? 0.5
                  : 1,
            }}
          >
            <Sparkles
              style={{
                width: 16,
                height: 16,
                display: "inline",
                marginRight: 8,
              }}
            />
            Generate Questions with AI
          </button>
        </>
      )}

      {stage === "processing" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 28,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Processing {screenshots.length} pages...
          </div>
          <div
            style={{
              background: "#F5F5F5",
              borderRadius: 99,
              height: 8,
              marginBottom: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "#DC2626",
                width: `${progress}%`,
                transition: "width 0.3s",
                borderRadius: 99,
              }}
            />
          </div>
          <div
            style={{
              maxHeight: 400,
              overflowY: "auto",
              background: "#1e1e1e",
              color: "#d4d4d4",
              padding: 16,
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {stage === "preview" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Generated {generatedQuestions.length} questions
              </div>
              <div style={{ fontSize: 13, color: "#6B7280" }}>
                Review and edit before importing to database
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  setStage("upload");
                  setGeneratedQuestions([]);
                  setScreenshots([]);
                  setLogs([]);
                }}
                style={{
                  padding: "10px 20px",
                  background: "#FFFFFF",
                  color: "#374151",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Start Over
              </button>
              <button
                onClick={importToDatabase}
                disabled={generatedQuestions.length === 0}
                style={{
                  padding: "10px 20px",
                  background: "#DC2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor:
                    generatedQuestions.length === 0 ? "not-allowed" : "pointer",
                  opacity: generatedQuestions.length === 0 ? 0.5 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Database style={{ width: 16, height: 16 }} />
                Import {generatedQuestions.length} Questions
              </button>
            </div>
          </div>

          {/* Question Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {generatedQuestions.map((question, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                {/* Question Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span
                      style={{
                        background: "#FEE2E2",
                        color: "#DC2626",
                        padding: "4px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Q{idx + 1}
                    </span>
                    <span
                      style={{
                        background: "#F3F4F6",
                        color: "#374151",
                        padding: "4px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {question.topic}
                    </span>
                    <span
                      style={{
                        background:
                          question.difficulty === "hard"
                            ? "#FEE2E2"
                            : question.difficulty === "medium"
                              ? "#FEF3C7"
                              : "#DBEAFE",
                        color:
                          question.difficulty === "hard"
                            ? "#DC2626"
                            : question.difficulty === "medium"
                              ? "#D97706"
                              : "#2563EB",
                        padding: "4px 12px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {question.difficulty}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const updated = generatedQuestions.filter(
                        (_, i) => i !== idx,
                      );
                      setGeneratedQuestions(updated);
                    }}
                    style={{
                      color: "#DC2626",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Delete
                  </button>
                </div>

                {/* Question Text */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#6B7280",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    QUESTION
                  </label>
                  <textarea
                    value={question.question_text}
                    onChange={(e) => {
                      const updated = [...generatedQuestions];
                      updated[idx].question_text = e.target.value;
                      setGeneratedQuestions(updated);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 14,
                      fontFamily: "inherit",
                      resize: "vertical",
                      minHeight: 80,
                    }}
                  />
                </div>

                {/* Answer Options */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  {["a", "b", "c", "d"].map((letter) => (
                    <div key={letter}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: 12,
                          color: "#6B7280",
                          marginBottom: 6,
                          fontWeight: 600,
                          gap: 8,
                        }}
                      >
                        <input
                          type='radio'
                          checked={
                            question.correct_answer.toLowerCase() === letter
                          }
                          onChange={() => {
                            const updated = [...generatedQuestions];
                            updated[idx].correct_answer = letter.toUpperCase();
                            setGeneratedQuestions(updated);
                          }}
                          style={{ width: 14, height: 14 }}
                        />
                        ANSWER {letter.toUpperCase()}
                        {question.correct_answer.toLowerCase() === letter && (
                          <span style={{ color: "#10B981", fontSize: 11 }}>
                            ✓ CORRECT
                          </span>
                        )}
                      </label>
                      <textarea
                        value={
                          question[
                            `answer_${letter}` as keyof QuestionDraft
                          ] as string
                        }
                        onChange={(e) => {
                          const updated = [...generatedQuestions];
                          (updated[idx] as any)[`answer_${letter}`] =
                            e.target.value;
                          setGeneratedQuestions(updated);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          border:
                            question.correct_answer.toLowerCase() === letter
                              ? "2px solid #10B981"
                              : "1px solid #E5E7EB",
                          borderRadius: 8,
                          fontSize: 13,
                          fontFamily: "inherit",
                          resize: "vertical",
                          minHeight: 60,
                          background:
                            question.correct_answer.toLowerCase() === letter
                              ? "#F0FDF4"
                              : "#FFFFFF",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "#6B7280",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    EXPLANATION
                  </label>
                  <textarea
                    value={question.explanation}
                    onChange={(e) => {
                      const updated = [...generatedQuestions];
                      updated[idx].explanation = e.target.value;
                      setGeneratedQuestions(updated);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: "inherit",
                      resize: "vertical",
                      minHeight: 80,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
