"use client";

import { useState, useRef } from "react";
import { parseCsv } from "@/lib/utils/csv-parser";
import type { CsvParseResult } from "@/types";
import { Upload, CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";

const REQUIRED_COLUMNS = [
  "question_text",
  "answer_a",
  "answer_b",
  "answer_c",
  "answer_d",
  "correct_answer",
  "book_title",
  "chapter",
];
const OPTIONAL_COLUMNS = [
  "question_id",
  "edition",
  "topic",
  "page_start",
  "page_end",
  "explanation",
  "study_eligible",
  "exam_eligible",
  "difficulty",
];

export default function CsvImporter() {
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ inserted: number } | null>(
    null,
  );
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportResult({ inserted: data.inserted });
      setParseResult(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className='space-y-6'>
      {/* CSV Format Reference */}
      <div className='bg-blue-50 border border-blue-200 rounded-xl p-5'>
        <h3 className='font-semibold text-blue-800 mb-2 text-sm'>
          Required CSV Format
        </h3>
        <div className='text-xs text-blue-700 font-mono bg-blue-100 rounded p-3 overflow-x-auto'>
          {REQUIRED_COLUMNS.join(",")}
        </div>
        <p className='text-xs text-blue-600 mt-2'>
          Optional columns: {OPTIONAL_COLUMNS.join(", ")}
        </p>
        <p className='text-xs text-blue-600 mt-1'>
          <strong>correct_answer</strong> must be A, B, C, or D. Headers are
          case-insensitive.
        </p>
      </div>

      {/* Upload Zone */}
      {/* Upload Zone */}
      <div
        className='border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors cursor-pointer'
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
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
        <input
          ref={fileRef}
          type='file'
          accept='.csv'
          onChange={handleFile}
          className='hidden'
        />
        <Upload className='w-8 h-8 text-gray-400 mx-auto mb-3' />
        <p className='text-gray-600 font-medium'>
          {fileName || "Click to select a CSV file"}
        </p>
        <p className='text-sm text-gray-400 mt-1'>or drag and drop</p>
      </div>

      {/* Import success */}
      {importResult && (
        <div className='bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3'>
          <CheckCircle2 className='w-6 h-6 text-green-600 shrink-0' />
          <div>
            <div className='font-semibold text-green-800'>Import Complete</div>
            <div className='text-sm text-green-700'>
              Successfully imported <strong>{importResult.inserted}</strong>{" "}
              questions
            </div>
          </div>
        </div>
      )}

      {/* Parse results */}
      {parseResult && (
        <div className='space-y-4'>
          {/* Summary */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3'>
              <CheckCircle2 className='w-5 h-5 text-green-600' />
              <div>
                <div className='font-semibold text-green-800'>
                  {parseResult.valid.length}
                </div>
                <div className='text-xs text-green-700'>Valid questions</div>
              </div>
            </div>
            <div
              className={`border rounded-lg p-4 flex items-center gap-3 ${
                parseResult.errors.length > 0
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <XCircle
                className={`w-5 h-5 ${parseResult.errors.length > 0 ? "text-red-500" : "text-gray-400"}`}
              />
              <div>
                <div
                  className={`font-semibold ${parseResult.errors.length > 0 ? "text-red-700" : "text-gray-600"}`}
                >
                  {parseResult.errors.length}
                </div>
                <div className='text-xs text-gray-500'>Errors</div>
              </div>
            </div>
          </div>

          {/* Errors */}
          {parseResult.errors.length > 0 && (
            <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
              <h4 className='font-semibold text-red-800 text-sm mb-2'>
                Validation Errors
              </h4>
              <div className='space-y-1 max-h-48 overflow-auto'>
                {parseResult.errors.map((err, i) => (
                  <div key={i} className='text-xs text-red-700'>
                    Row {err.row} · <strong>{err.field}</strong>: {err.message}
                  </div>
                ))}
              </div>
              <p className='text-xs text-red-600 mt-2'>
                Fix these errors in your CSV and re-upload. Only valid rows are
                shown above.
              </p>
            </div>
          )}

          {/* Preview */}
          {parseResult.valid.length > 0 && (
            <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
              <div className='px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2'>
                <FileText className='w-4 h-4 text-gray-400' />
                <span className='text-sm font-medium text-gray-700'>
                  Preview (first 3 rows)
                </span>
              </div>
              <div className='divide-y divide-gray-100'>
                {parseResult.valid.slice(0, 3).map((q, i) => (
                  <div key={i} className='px-4 py-3 text-xs'>
                    <div className='font-medium text-gray-800 mb-1'>
                      {q.question_text.substring(0, 100)}…
                    </div>
                    <div className='text-gray-500'>
                      {q.book_title} · {q.chapter}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importError && (
            <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3'>
              {importError}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing || parseResult.valid.length === 0}
            className='w-full bg-[#C0392B] hover:bg-[#a93226] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
          >
            {importing ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' /> Importing…
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
