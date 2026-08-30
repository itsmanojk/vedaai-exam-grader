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

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.pages?.length) {
    return NextResponse.json({ error: "No question paper pages provided" }, { status: 400 });
  }

  try {
    const result = await generateJson<ExtractionResponse>({
      systemInstruction: QUESTION_EXTRACTION_SYSTEM,
      prompt: questionExtractionPrompt(body.pages.length),
      images: body.pages.map((p, i) => ({
        label: `Question paper page ${i + 1}:`,
        image: p,
      })),
      responseSchema: questionExtractionSchema,
    });

    const seen = new Map<string, number>();
    const questions: Question[] = (result.questions ?? []).map((q) => {
      let id = makeQuestionId(q.number, q.subpart);
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`; // guard against duplicate numbering
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
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof GeminiRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 429 ? 429 : 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Unexpected error extracting questions." }, { status: 500 });
  }
}
