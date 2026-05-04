import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBatch } from "@/lib/utils/distractor-check";
import { findDuplicates } from "@/lib/utils/duplicate-detect";
type ImportQualityResult = any;

export const maxDuration = 300; // 5 minutes – AI distractor checks can be slow on large CSVs

// CSV Import Route with Enhanced Quality Checks
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin check
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const examType = formData.get("exam_type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!examType || !["lieutenant", "captain"].includes(examType)) {
      return NextResponse.json(
        { error: "Invalid exam_type. Must be 'lieutenant' or 'captain'" },
        { status: 400 },
      );
    }

    const text = await file.text();
    const rows = text.split("\n").filter((r) => r.trim());
    const headers = rows[0].split(",").map((h) => h.trim());

    const requiredFields = [
      "book_title",
      "edition",
      "chapter",
      "topic",
      "question_text",
      "answer_a",
      "answer_b",
      "answer_c",
      "answer_d",
      "correct_answer",
      "explanation",
    ];

    const missingFields = requiredFields.filter((f) => !headers.includes(f));
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // 1. Parse questions
    const questions = rows.slice(1).map((row, i) => {
      const values = row.split(",").map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || "";
      });
      obj.row = i + 2; // row number in CSV
      return obj;
    });

    // 2. Run AI distractor quality checks
    const distractorResults = await checkBatch(questions);

    // 3. Run duplicate detection
    const duplicateResults = await findDuplicates(questions);

    // 4. Build combined quality report
    const errors: Array<{ row: number; message: string }> = [];
    const warnings: Array<{ row: number; message: string }> = [];

    // 5. Low-score distractor warnings
    const LOW_SCORE_THRESHOLD = 60;
    const flagged_questions: ImportQualityResult["flagged_questions"] = [];

    questions.forEach((q, i) => {
      const score = distractorResults[i]?.score;
      if (score !== undefined && score < LOW_SCORE_THRESHOLD) {
        warnings.push({
          row: q.row,
          message: `Low distractor quality (${score}/100). ${distractorResults[i]?.reasoning}`,
        });
        flagged_questions.push({
          row: q.row,
          question: q.question_text,
          score,
          reasoning: distractorResults[i]?.reasoning,
        });
      }
    });

    // 6. Duplicate warnings
    duplicateResults.forEach((dup) => {
      warnings.push({
        row: dup.row,
        message: `Possible duplicate of row ${dup.matchRow}`,
      });
    });

    // 7. Basic validation errors
    questions.forEach((q) => {
      if (!["A", "B", "C", "D"].includes(q.correct_answer.toUpperCase())) {
        errors.push({
          row: q.row,
          message: "Invalid correct_answer (must be A, B, C, or D)",
        });
      }
      if (!q.question_text || q.question_text.length < 10) {
        errors.push({ row: q.row, message: "Question text too short" });
      }
    });

    const passed = errors.length === 0;
    const qualityResult: ImportQualityResult = {
      total: questions.length,
      passed: passed ? questions.length : 0,
      failed: errors.length,
      errors,
      warnings,
      flagged_questions,
    };

    // If there are blocking errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        quality: qualityResult,
        message: `Import blocked: ${errors.length} validation error(s)`,
      });
    }

    // 8. Insert questions
    const insertData = questions.map((q) => ({
      book_title: q.book_title,
      edition: q.edition,
      chapter: parseInt(q.chapter) || null,
      topic: q.topic || null,
      page_start: parseInt(q.page_start) || null,
      page_end: parseInt(q.page_end) || null,
      question_text: q.question_text,
      answer_a: q.answer_a,
      answer_b: q.answer_b,
      answer_c: q.answer_c,
      answer_d: q.answer_d,
      correct_answer: q.correct_answer.toUpperCase(),
      explanation: q.explanation || null,
      study_eligible:
        q.study_eligible === "TRUE" || q.study_eligible === "true",
      exam_eligible: q.exam_eligible === "TRUE" || q.exam_eligible === "true",
      difficulty: q.difficulty || "medium",
      exam_type: examType,
    }));

    const { error: insertError } = await supabase
      .from("questions")
      .insert(insertData);

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Database insert failed", details: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      inserted: questions.length,
      quality: qualityResult,
      message: `Successfully imported ${questions.length} questions for ${examType} exam`,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed", details: error.message },
      { status: 500 },
    );
  }
}
