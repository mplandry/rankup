import { NextRequest, NextResponse } from "next/server";

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

type GenerateQuestionsRequest = {
  screenshots: string[]; // base64 encoded images
  metadata: {
    book_title: string;
    edition: string;
    chapter: string;
    page_start: string;
    page_end: string;
  };
  strategy: Strategy;
};

export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuestionsRequest = await request.json();
    const { screenshots, metadata, strategy } = body;

    if (!screenshots || screenshots.length === 0) {
      return NextResponse.json(
        { error: "No screenshots provided" },
        { status: 400 },
      );
    }

    if (screenshots.length > 15) {
      return NextResponse.json(
        { error: "Maximum 15 screenshots allowed" },
        { status: 400 },
      );
    }

    const questions: QuestionDraft[] = [];
    const logs: string[] = [];

    // Process each screenshot
    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];
      logs.push(`Processing page ${i + 1}/${screenshots.length}...`);

      // Generate questions from this screenshot using Claude Vision
      const generatedQuestions = await generateQuestionsFromScreenshot(
        screenshot,
        metadata,
        strategy,
        logs,
      );

      questions.push(...generatedQuestions);
    }

    logs.push(`✓ Generated ${questions.length} questions total`);

    return NextResponse.json({
      questions,
      logs,
      success: true,
    });
  } catch (error: any) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate questions" },
      { status: 500 },
    );
  }
}

async function generateQuestionsFromScreenshot(
  base64Image: string,
  metadata: GenerateQuestionsRequest["metadata"],
  strategy: Strategy,
  logs: string[],
): Promise<QuestionDraft[]> {
  // Build the strategy-specific prompt guidance
  const strategyGuidance = {
    plausible:
      "Create plausible wrong answers that a student who hasn't studied might choose. Make incorrect options sound reasonable but clearly wrong to someone who knows the material.",
    technical:
      "Create technical distractors with specific numbers, terms, or procedures that are close to correct but subtly wrong. Test precise knowledge.",
    conceptual:
      "Create distractors based on related but incorrect concepts. Test conceptual understanding rather than memorization.",
    aggressive:
      "Create expert-level distractors that would challenge even experienced firefighters. Include subtle distinctions and edge cases.",
  };

  const systemPrompt = `You are an expert firefighter training question generator for Massachusetts Captain promotional exams.

CRITICAL COPYRIGHT RULES (NON-NEGOTIABLE):
- NEVER reproduce verbatim content from the book
- NEVER copy exact sentences, paragraphs, or procedures
- Generate ORIGINAL questions that test the same concepts
- Maximum 15-word quotes only if absolutely necessary for context
- Paraphrase all content - use your own words entirely

Your task is to:
1. Analyze the book page screenshot
2. Identify 2-4 testable concepts from this page
3. Generate original multiple-choice questions that test these concepts
4. Create high-quality distractors following the "${strategy}" strategy

DISTRACTOR STRATEGY: ${strategyGuidance[strategy]}

Question requirements:
- Original wording (not copied from source)
- Clear, unambiguous questions
- One definitively correct answer
- Three convincing distractors
- Detailed explanations citing principles (not page numbers)
- Appropriate difficulty level
- Professional tone

OUTPUT FORMAT (JSON only, no markdown):
{
  "questions": [
    {
      "question_text": "string",
      "answer_a": "string",
      "answer_b": "string", 
      "answer_c": "string",
      "answer_d": "string",
      "correct_answer": "A|B|C|D",
      "explanation": "string (why correct answer is right, why others are wrong)",
      "topic": "string (specific topic from this page)",
      "difficulty": "easy|medium|hard"
    }
  ]
}`;

  const userPrompt = `Generate 2-4 original multiple-choice questions from this firefighter training book page.

Book: ${metadata.book_title}
Edition: ${metadata.edition}
Chapter: ${metadata.chapter}
Pages: ${metadata.page_start || "N/A"} - ${metadata.page_end || "N/A"}

Remember: Generate ORIGINAL questions in your own words. Never copy text from the source material.

Return ONLY the JSON object with the questions array. No markdown, no backticks, no preamble.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: base64Image,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textContent =
      data.content.find((c: any) => c.type === "text")?.text || "";

    logs.push("✓ Claude analyzed the page");

    // Parse the JSON response
    let parsedResponse;
    try {
      // Remove any markdown code fences if present
      const cleanJson = textContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("JSON parse error:", textContent);
      throw new Error("Failed to parse Claude response as JSON");
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error("Invalid response structure from Claude");
    }

    logs.push(
      `✓ Generated ${parsedResponse.questions.length} questions from this page`,
    );

    // Transform to QuestionDraft format and add metadata
    const questions: QuestionDraft[] = parsedResponse.questions.map(
      (q: any) => ({
        question_text: q.question_text,
        answer_a: q.answer_a,
        answer_b: q.answer_b,
        answer_c: q.answer_c,
        answer_d: q.answer_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        topic: q.topic || "General",
        difficulty: q.difficulty || "medium",
        book_title: metadata.book_title,
        edition: metadata.edition || "",
        chapter: metadata.chapter,
        page_start: parseInt(metadata.page_start) || 0,
        page_end: parseInt(metadata.page_end) || 0,
      }),
    );

    return questions;
  } catch (error: any) {
    logs.push(`✗ Error processing page: ${error.message}`);
    throw error;
  }
}
