import { NextRequest, NextResponse } from "next/server";
import { generateJson, GeminiConfigError, GeminiRequestError } from "@/lib/gemini";
import {
  ANSWER_MAPPING_SYSTEM,
  answerMappingPrompt,
  answerMappingSchema,
} from "@/lib/prompts";
import { fromGeminiBox } from "@/lib/boxes";
import type { AnswerMapping, GradingResult, Question, UnmatchedAnswer } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

interface RequestBody {
  questions: Question[];
  pages: { mimeType: string; data: string }[];
}

interface GeminiRegion {
  pageIndex: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

interface GeminiAnswer {
  questionId: string;
  found: boolean;
  transcribedText: string;
  correctness: AnswerMapping["correctness"];
  score: number;
  feedback: string;
  regions: GeminiRegion[];
}

interface GeminiUnmatched {
  pageIndex: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  transcribedText: string;
  note: string;
}

interface MappingResponse {
  answers: GeminiAnswer[];
  unmatched: GeminiUnmatched[];
  overallFeedback: string;
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.questions?.length) {
    return NextResponse.json({ error: "No questions provided" }, { status: 400 });
  }
  if (!body.pages?.length) {
    return NextResponse.json({ error: "No answer sheet pages provided" }, { status: 400 });
  }

  try {
    const result = await generateJson<MappingResponse>({
      systemInstruction: ANSWER_MAPPING_SYSTEM,
      prompt: answerMappingPrompt(body.questions, body.pages.length),
      images: body.pages.map((p, i) => ({
        label: `Answer sheet page ${i}:`,
        image: p,
      })),
      responseSchema: answerMappingSchema,
    });

    const byId = new Map(result.answers?.map((a) => [a.questionId, a]) ?? []);

    const answers: AnswerMapping[] = body.questions.map((q) => {
      const raw = byId.get(q.id);
      if (!raw) {
        // Model didn't return an entry for this question — treat as unanswered
        // rather than failing the whole request.
        return {
          questionId: q.id,
          found: false,
          primaryRegion: null,
          additionalRegions: [],
          transcribedText: "",
          score: 0,
          maxMarks: q.maxMarks,
          correctness: "unanswered",
          feedback: "No answer could be matched to this question.",
        };
      }

      const regions = (raw.regions ?? []).map((r) => ({
        pageIndex: r.pageIndex,
        box: fromGeminiBox(r),
      }));

      const score = Math.max(0, Math.min(q.maxMarks, Number(raw.score) || 0));

      return {
        questionId: q.id,
        found: Boolean(raw.found) && regions.length > 0,
        primaryRegion: regions[0] ?? null,
        additionalRegions: regions.slice(1),
        transcribedText: raw.transcribedText ?? "",
        score,
        maxMarks: q.maxMarks,
        correctness: raw.correctness ?? (score > 0 ? "partially_correct" : "unanswered"),
        feedback: raw.feedback ?? "",
      };
    });

    const unmatched: UnmatchedAnswer[] = (result.unmatched ?? []).map((u) => ({
      pageIndex: u.pageIndex,
      box: fromGeminiBox(u),
      transcribedText: u.transcribedText,
      note: u.note,
    }));

    const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
    const totalMaxMarks = answers.reduce((sum, a) => sum + a.maxMarks, 0);

    const response: GradingResult = {
      answers,
      unmatched,
      overallFeedback: result.overallFeedback ?? "",
      totalScore,
      totalMaxMarks,
    };

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof GeminiRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 429 ? 429 : 502 });
    }
    console.error(err);
    return NextResponse.json({ error: "Unexpected error mapping answers." }, { status: 500 });
  }
}
