import { NextRequest, NextResponse } from "next/server";
import { generateJson, GeminiConfigError, GeminiRequestError } from "@/lib/gemini";
import {
  QUESTION_EXTRACTION_SYSTEM,
  questionExtractionPrompt,
  questionExtractionSchema,
} from "@/lib/prompts";
import { makeQuestionId } from "@/lib/boxes";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RequestBody {
  pages: { mimeType: string; data: string }[];
}

interface ExtractionResponse {
  questions: { number: string; subpart?: string; text: string; maxMarks: number }[];
}

// Helper to pause execution during retries
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body provided in request." }, { status: 400 });
  }

  if (!body.pages?.length) {
    return NextResponse.json({ error: "No question paper pages provided." }, { status: 400 });
  }

  try {
    let result: ExtractionResponse | null = null;
    let attempts = 0;
    const maxRetries = 3;

    // Retry loop to gracefully recover from temporary 503 high-demand errors
    while (attempts < maxRetries) {
      try {
        attempts++;
        result = await generateJson<ExtractionResponse>({
          systemInstruction: QUESTION_EXTRACTION_SYSTEM,
          prompt: questionExtractionPrompt(body.pages.length),
          images: body.pages.map((p, i) => ({
            label: `Question paper page ${i + 1}:`,
            image: p,
          })),
          responseSchema: questionExtractionSchema,
        });
        break; // Request succeeded, exit retry loop
      } catch (err) {
        const is503 =
          err instanceof GeminiRequestError &&
          (err.status === 503 || err.message?.includes("503") || err.message?.includes("high demand"));

        if (is503 && attempts < maxRetries) {
          console.warn(`Gemini 503 high demand spike detected. Retry attempt ${attempts}/${maxRetries} in ${2 * attempts}s...`);
          await sleep(2000 * attempts); // Wait 2s, then 4s if needed
          continue;
        }
        throw err; // Re-throw if it's a non-503 error or max retries exceeded
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "Model is currently experiencing high demand. Please try again in a few moments." },
        { status: 503 }
      );
    }

    const seen = new Map<string, number>();
    const questions: Question[] = (result.questions ?? []).map((q) => {
      let id = makeQuestionId(q.number, q.subpart);
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`; // Guard against duplicate numbering
      return {
        id,
        number: q.number,
        subpart: q.subpart || undefined,
        text: q.text,
        maxMarks: typeof q.maxMarks === "number" && q.maxMarks > 0 ? q.maxMarks : 1,
      };
    });

    if (!questions.length) {
      return NextResponse.json(
        { error: "No questions could be found in the uploaded question paper." },
        { status: 422 }
      );
    }

    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error("Error in extract-questions route:", err);

    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    
    if (err instanceof GeminiRequestError) {
      const is503 = err.status === 503 || err.message?.includes("503");
      const errorMessage = is503
        ? "The AI model is currently experiencing high demand on Google's end. Please try again shortly."
        : err.message;
        
      return NextResponse.json(
        { error: errorMessage },
        { status: err.status === 429 ? 429 : is503 ? 503 : 502 }
      );
    }

    // Fallback to guarantee JSON error response format
    const fallbackMessage = err?.message || "An unexpected error occurred while extracting questions.";
    return NextResponse.json({ error: fallbackMessage }, { status: 500 });
  }
}