"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { parseCSV } from "@/lib/utils";

const CSV_TEMPLATE = [
  "question_text,answer_a,answer_b,answer_c,answer_d,correct_answer,book_title,chapter,question_id,edition,topic,page_start,page_end,explanation,study_eligible,exam_eligible,difficulty",
  '"What is the primary purpose of a fire sprinkler system?","Extinguish all fires automatically","Control fire spread and suppress","Alert occupants only","Provide water for firefighters","B","Fire Protection Handbook","12","Q001","21st","Suppression","145","146","Sprinkler systems are designed to control fire spread.","true","true","easy"',
].join("\n");

export default function ImportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (!profile || profile.role !== "admin") { router.push("/dashboard"); return; }

      setUser(session.user);
      setLoading(false);
    };
    init();
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setPreview(parseCSV(text).slice(0, 5));
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText) return;
    setImporting(true);
    const rows = parseCSV(csvText);
    const errors: string[] = [];
    let success = 0;

    for (const row of rows) {
      try {
        const { error } = await supabase.from("questions").insert({
          question_text: row.question_text,
          answer_a: row.answer_a,
          answer_b: row.answer_b,
          answer_c: row.answer_c,
          answer_d: row.answer_d,
          correct_answer: row.correct_answer?.toUpperCase(),
          book_title: row.book_title || "Unknown",
          chapter: row.chapter || "1",
          source_id: row.question_id || null,
          edition: row.edition || null,
          topic: row.topic || null,
          page_start: row.page_start ? parseInt(row.page_start) : null,
          page_end: row.page_end ? parseInt(row.page_end) : null,
          explanation: row.explanation || null,
          study_eligible: row.study_eligible !== "false",
          exam_eligible: row.exam_eligible !== "false",
          difficulty: row.difficulty || "medium",
          is_active: true,
          created_by: user?.id,
        });
        if (error) errors.push(`Row "${row.question_text?.slice(0, 40)}...": ${error.message}`);
        else success++;
      } catch (e: any) {
        errors.push(e.message);
      }
    }
    setResult({ success, errors });
    setImporting(false);
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Loading...</div>;

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";

  return (
    <div style={{ display: "flex" }}>
      <Sidebar userName={userName} userEmail={user?.email || ""} userRole="admin" />
      <div style={{ marginLeft: "var(--sidebar-w)", flex: 1, padding: "36px 40px", maxWidth: 900 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Import Questions</div>
        <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 28 }}>Upload a CSV file to bulk import questions.</div>

        {/* Template download */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>CSV Template</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Required columns: question_text, answer_a–d, correct_answer (A/B/C/D), book_title, chapter</div>
          <button
            onClick={() => { const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "questions_template.csv"; a.click(); }}
            style={{ padding: "8px 16px", background: "var(--navy)", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            ↓ Download Template
          </button>
        </div>

        {/* Upload */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Upload CSV</div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
          <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: "32px", textAlign: "center", cursor: "pointer", color: "var(--text-muted)", fontSize: 14 }}>
            {csvText ? `✓ File loaded — ${parseCSV(csvText).length} rows found` : "Click to select a CSV file"}
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Preview (first 5 rows)</div>
            {preview.map((row, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < preview.length - 1 ? "1px solid var(--border)" : "none", fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{i + 1}. </span>{row.question_text?.slice(0, 80)}...
                <span style={{ marginLeft: 12, color: "var(--text-muted)" }}>{row.book_title} Ch.{row.chapter}</span>
              </div>
            ))}
          </div>
        )}

        {/* Import button */}
        {csvText && (
          <button
            onClick={handleImport}
            disabled={importing}
            style={{ padding: "12px 28px", background: "var(--red)", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.7 : 1 }}>
            {importing ? "Importing..." : `Import ${parseCSV(csvText).length} Questions`}
          </button>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop: 20, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "var(--green)" }}>✓ {result.success} questions imported successfully</div>
            {result.errors.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--red)", marginBottom: 6 }}>{result.errors.length} errors:</div>
                {result.errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>• {e}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
