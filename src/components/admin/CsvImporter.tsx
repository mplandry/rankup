"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseCsv } from "@/lib/utils/csv-parser";
import type { CsvParseResult, ImportQualityResult } from "@/types";
import { Upload, CheckCircle2, XCircle, FileText, Loader2, AlertTriangle } from "lucide-react";

const REQUIRED_COLUMNS = [
  "question_text", "answer_a", "answer_b", "answer_c", "answer_d",
  "correct_answer", "book_title", "chapter",
];
const OPTIONAL_COLUMNS = [
  "question_id", "edition", "topic", "page_start", "page_end",
  "explanation", "study_eligible", "exam_eligible", "difficulty",
];

export default function CsvImporter() {
  const router = useRouter();
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportQualityResult | null>(null);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);
    setImportError("");
    const result = await parseCsv(file);
    setParseResult(result);
  }

  async function handleImport() {
    if (!parseResult || parseResult.valid.length === 0) return;
    setImporting(true);
    setImportError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parseResult.valid }),
      });
      const data: ImportQualityResult = await res.json();
      if (!res.ok && res.status !== 207) throw new Error((data as any).error || "Import failed");
      setImportResult(data);
      setParseResult(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  if (importResult) {
    const { A, B, C, D } = importResult.answer_distribution;
    const isSkewed = Math.max(A, B, C, D) > 30 || Math.min(A, B, C, D) < 20;
    const skewedLetter = isSkewed
      ? (["A", "B", "C", "D"] as const).find(
          (l) => importResult.answer_distribution[l] === Math.max(A, B, C, D)
        )
      : null;

    return (
      <div className="space-y-5">
        {/* Success header */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5 flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">
              {importResult.inserted} questions imported successfully
            </div>
            <div className="text-sm text-green-700 mt-0.5">
              All added as <strong>pending</strong> — none shown to students until reviewed
            </div>
          </div>
        </div>

        {/* Quality summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className={`text-3xl font-black ${importResult.low_distractor_count > 0 ? "text-red-600" : "text-green-600"}`}>
              {importResult.low_distractor_count}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
              Low Distractor Score
            </div>
            <div className={`text-xs mt-1 ${importResult.low_distractor_count > 0 ? "text-red-500" : "text-gray-400"}`}>
              score &lt; 60
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className={`text-3xl font-black ${importResult.duplicate_count > 0 ? "text-amber-500" : "text-green-600"}`}>
              {importResult.duplicate_count}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
              Possible Duplicates
            </div>
            <div className="text-xs text-gray-400 mt-1">≥75% similar</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-green-600">
              {Math.max(0, importResult.inserted - importResult.low_distractor_count)}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
              Ready to Review
            </div>
            <div className="text-xs text-gray-400 mt-1">no flags</div>
          </div>
        </div>

        {/* Answer distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="font-semibold text-[#1B2A4A] text-sm mb-3">
            Answer Distribution — This Batch
          </div>
          <div className="flex gap-3 mb-3">
            {(["A", "B", "C", "D"] as const).map((l) => {
              const pct = importResult.answer_distribution[l];
              const isHigh = pct > 30;
              return (
                <div key={l} className="flex-1 text-center">
                  <div className={`text-sm font-bold ${isHigh ? "text-red-600" : "text-gray-700"}`}>
                    {pct}%
                  </div>
                  <div
                    className={`h-2 rounded mt-1 ${isHigh ? "bg-red-500" : "bg-blue-400"}`}
                    style={{ opacity: 0.4 + pct / 100 }}
                  />
                  <div className="text-xs font-bold text-gray-500 mt-1">{l}</div>
                </div>
              );
            })}
          </div>
          {isSkewed && skewedLetter && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              ⚠ <strong>{skewedLetter}</strong> is over-represented ({importResult.answer_distribution[skewedLetter]}%).
              When generating your next batch, ask the AI to vary correct answer placement more evenly.
            </div>
          )}
        </div>

        {/* Flagged questions */}
        {importResult.flagged_questions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="font-semibold text-[#1B2A4A] text-sm mb-3">
              Flagged Questions Preview
            </div>
            <div className="space-y-2">
              {importResult.flagged_questions.slice(0, 3).map((q, i) => (
                <div key={i} className="border border-red-100 bg-red-50 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                      q.flag_type === "distractor"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {q.flag_type === "distractor" ? "DISTRACTOR" : "DUPLICATE"}
                    </span>
                    <span className="text-xs text-gray-700 truncate">{q.question_text}</span>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${
                    q.flag_type === "distractor" ? "text-red-600" : "text-amber-600"
                  }`}>
                    {q.flag_type === "distractor" ? `Score: ${q.score}` : `${q.match_pct}% match`}
                  </span>
                </div>
              ))}
              {importResult.flagged_questions.length > 3 && (
                <div className="text-xs text-gray-400 text-center py-1">
                  + {importResult.flagged_questions.length - 3} more flagged questions in the review queue
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setImportResult(null)}
            className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Import Another CSV
          </button>
          <button
            onClick={() => router.push("/admin/review")}
            className="flex-[2] py-3 bg-[#1B2A4A] text-white rounded-lg text-sm font-bold hover:bg-[#243660]"
          >
            Go to Review Queue → {importResult.inserted} pending
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CSV Format Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-800 mb-2 text-sm">Required CSV Format</h3>
        <div className="text-xs text-blue-700 font-mono bg-blue-100 rounded p-3 overflow-x-auto">
          {REQUIRED_COLUMNS.join(",")}
        </div>
        <p className="text-xs text-blue-600 mt-2">Optional columns: {OPTIONAL_COLUMNS.join(", ")}</p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>correct_answer</strong> must be A, B, C, or D. Headers are case-insensitive.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          setFileName(file.name);
          setImportResult(null);
          setImportError("");
          parseCsv(file).then(setParseResult);
        }}
      >
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">{fileName || "Click to select a CSV file"}</p>
        <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
      </div>

      {/* Parse results */}
      {parseResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">{parseResult.valid.length}</div>
                <div className="text-xs text-green-700">Valid questions</div>
              </div>
            </div>
            <div className={`border rounded-lg p-4 flex items-center gap-3 ${parseResult.errors.length > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
              <XCircle className={`w-5 h-5 ${parseResult.errors.length > 0 ? "text-red-500" : "text-gray-400"}`} />
              <div>
                <div className={`font-semibold ${parseResult.errors.length > 0 ? "text-red-700" : "text-gray-600"}`}>
                  {parseResult.errors.length}
                </div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>
          </div>

          {parseResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="font-semibold text-red-800 text-sm mb-2">Validation Errors</h4>
              <div className="space-y-1 max-h-48 overflow-auto">
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="text-xs text-red-700">
                    Row {err.row} · <strong>{err.field}</strong>: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parseResult.valid.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Import will run AI distractor quality checks on all {parseResult.valid.length} questions.
                This may take 30–60 seconds for large batches.
              </p>
            </div>
          )}

          {parseResult.valid.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Preview (first 3 rows)</span>
              </div>
              <div className="divide-y divide-gray-100">
                {parseResult.valid.slice(0, 3).map((q, i) => (
                  <div key={i} className="px-4 py-3 text-xs">
                    <div className="font-medium text-gray-800 mb-1">{q.question_text.substring(0, 100)}…</div>
                    <div className="text-gray-500">{q.book_title} · {q.chapter}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {importError}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing || parseResult.valid.length === 0}
            className="w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running quality checks & importing…
              </>
            ) : (
              `Import ${parseResult.valid.length} Question${parseResult.valid.length !== 1 ? "s" : ""}`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
