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
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionDraft[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [stage, setStage] = useState<"upload" | "processing" | "preview">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter(f => 
      f.type.startsWith("image/")
    );
    setScreenshots(imageFiles);
  };

  const log = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
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

    log(`Starting generation for ${screenshots.length} pages...`);

    // TODO: Call API to process screenshots
    // This will be implemented in the next step

    log("Generation complete!");
    setStage("preview");
    setIsProcessing(false);
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
              <Upload style={{ width: 48, height: 48, margin: "0 auto 16px", color: "#6B7280" }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                Drop screenshots here or click to browse
              </div>
              <div style={{ fontSize: 13, color: "#6B7280" }}>
                Upload 1-15 book pages (PNG, JPG, PDF)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: "none" }}
              />
            </div>
            {screenshots.length > 0 && (
              <div style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>
                ✓ {screenshots.length} file{screenshots.length > 1 ? "s" : ""} uploaded
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#6B7280" }}>
                  Book Title *
                </label>
                <input
                  type="text"
                  value={metadata.book_title}
                  onChange={(e) => setMetadata({ ...metadata, book_title: e.target.value })}
                  placeholder="Building Construction Related to the Fire Service"
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
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#6B7280" }}>
                  Edition *
                </label>
                <input
                  type="text"
                  value={metadata.edition}
                  onChange={(e) => setMetadata({ ...metadata, edition: e.target.value })}
                  placeholder="4th Edition"
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#6B7280" }}>
                  Chapter *
                </label>
                <input
                  type="text"
                  value={metadata.chapter}
                  onChange={(e) => setMetadata({ ...metadata, chapter: e.target.value })}
                  placeholder="6"
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
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#6B7280" }}>
                  Page Start
                </label>
                <input
                  type="number"
                  value={metadata.page_start}
                  onChange={(e) => setMetadata({ ...metadata, page_start: e.target.value })}
                  placeholder="120"
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
                <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#6B7280" }}>
                  Page End
                </label>
                <input
                  type="number"
                  value={metadata.page_end}
                  onChange={(e) => setMetadata({ ...metadata, page_end: e.target.value })}
                  placeholder="125"
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
              <option value="plausible">Standard (plausible distractors)</option>
              <option value="technical">Technical (detailed distractors)</option>
              <option value="conceptual">Conceptual (similar concepts)</option>
              <option value="aggressive">Aggressive (expert-level difficulty)</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={startGeneration}
            disabled={screenshots.length === 0 || !metadata.book_title || !metadata.chapter}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "#DC2626",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: screenshots.length === 0 || !metadata.book_title || !metadata.chapter ? "not-allowed" : "pointer",
              opacity: screenshots.length === 0 || !metadata.book_title || !metadata.chapter ? 0.5 : 1,
            }}
          >
            <Sparkles style={{ width: 16, height: 16, display: "inline", marginRight: 8 }} />
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
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Generated {generatedQuestions.length} questions - Ready to import
          </div>
          {/* Preview UI will go here */}
        </div>
      )}
    </div>
  );
}
