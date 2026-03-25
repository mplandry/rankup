"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { parseCSV } from "@/lib/utils";

const CSV_TEMPLATE = [
  "question_text,answer_a,answer_b,answer_c,answer_d,correct_answer,book_title,chapter,question_id,edition,topic,page_start,page_end,explanation,study_eligible,exam_eligible,difficulty,is_active",
  "What part of an I-beam resists most bending?,Web,Flange,Column,Joint,B,Building Construction Related to the Fire Service,3,,,Structural Systems,80,80,Flanges resist bending stress.,TRUE,TRUE,easy,TRUE",
].join("\n");

export default function ImportPage() {
  const [user, setUser] = useState<any>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
    };
    init();
  }, []);

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rankup_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = async (file: File) => {
    if (!file || !file.name.endsWith(".csv")) {
      setStatus({ type: "error", msg: "Please select a valid CSV file." });
      return;
    }
    setImporting(true);
    setStatus(null);
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) {
      setStatus({
        type: "error",
        msg: "No valid questions found. Check the CSV format.",
      });
      setImporting(false);
      return;
    }

    const questions = rows.map((r) => ({
      source_id: r.question_id || r.source_id || null,
      book_title: r.book_title || "",
      edition: r.edition || null,
      chapter: r.chapter || "",
      topic: r.topic || null,
      page_start: r.page_start ? parseInt(r.page_start) : null,
      page_end: r.page_end ? parseInt(r.page_end) : null,
      question_text: r.question_text || "",
      answer_a: r.answer_a || "",
      answer_b: r.answer_b || "",
      answer_c: r.answer_c || "",
      answer_d: r.answer_d || "",
      correct_answer: (r.correct_answer || "").toUpperCase(),
      explanation: r.explanation || null,
      study_eligible: ["true", "yes", "1"].includes(
        (r.study_eligible || "true").toLowerCase()
      ),
      exam_eligible: ["true", "yes", "1"].includes(
        (r.exam_eligible || "true").toLowerCase()
      ),
      difficulty: r.difficulty || "medium",
      is_active: true,
      created_by: user.id,
    }));

    let imported = 0;
    let skipped = 0;
    const batchSize = 50;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      const { error } = await supabase.from("questions").upsert(batch, {
        onConflict: "question_text",
        ignoreDuplicates: true,
      });
      if (!error) imported += batch.length;
      else skipped += batch.length;
    }

    setStatus({
      type: "success",
      msg: `Successfully imported ${imported} questions!${
        skipped > 0 ? ` (${skipped} skipped as duplicates)` : ""
      }`,
    });
    setImporting(false);
  };

  if (!user) return null;

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Firefighter";

  return (
    <div style={{ display: "flex" }}>
      <Sidebar userName={userName} userEmail={user?.email || ""} />
      <div
        style={{
          marginLeft: "var(--sidebar-w)",
          flex: 1,
          padding: "36px 40px",
          maxWidth: 1100,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
          Import Questions from CSV
        </div>
        <div
          style={{
            fontSize: 13.5,
            color: "var(--text-muted)",
            marginBottom: 28,
          }}
        >
          Upload a CSV file to bulk-import questions into the question bank
        </div>

        {/* Format box */}
        <div
          style={{
            background: "var(--blue-light)",
            border: "1px solid #b3d7f0",
            borderRadius: 10,
            padding: "16px 18px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--blue)" }}>
              Required CSV Format
            </div>
            <button
              onClick={handleDownloadTemplate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--blue)",
                background: "white",
                border: "1px solid #b3d7f0",
                borderRadius: 6,
                padding: "5px 12px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--blue)";
                (e.currentTarget as HTMLButtonElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "white";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--blue)";
              }}
            >
              ⬇ Download Template
            </button>
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              background: "rgba(0,0,0,0.06)",
              padding: "8px 10px",
              borderRadius: 6,
              marginBottom: 8,
              wordBreak: "break-all",
            }}
          >
            question_text,answer_a,answer_b,answer_c,answer_d,correct_answer,book_title,chapter
          </div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
            Optional columns: question_id, edition, topic, page_start, page_end,
            explanation, study_eligible, exam_eligible, difficulty, is_active
            <br />
            <strong style={{ color: "var(--red)" }}>correct_answer</strong> must
            be A, B, C, or D. Headers are case-insensitive.
            <br />
            <strong style={{ color: "var(--green)" }}>
              Duplicates are automatically skipped
            </strong>{" "}
            — safe to re-upload files.
          </div>
        </div>

        {/* Status */}
        {status && (
          <div
            style={{
              background:
                status.type === "success"
                  ? "var(--green-light)"
                  : "var(--red-light)",
              border: `1px solid ${status.type === "success" ? "#a9dfbf" : "#f1948a"}`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
              fontSize: 14,
              color: status.type === "success" ? "var(--green)" : "var(--red)",
              fontWeight: 600,
            }}
          >
            {status.msg}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) processFile(f);
          }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${drag ? "var(--red)" : "var(--border)"}`,
            borderRadius: 12,
            padding: "50px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: drag ? "var(--red-light)" : "#fafbfc",
            transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12, color: "var(--text-muted)" }}>
            ⬆️
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            {importing ? "Importing..." : "Click to select a CSV file"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            or drag and drop
          </div>
          <input
            ref={fileRef}
            type='file'
            accept='.csv'
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
            }}
          />
        </div>
      </div>
    </div>
  );
                    }
