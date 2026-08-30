// Prompts + response schemas for the two Gemini calls in the pipeline:
//   1. extract questions from the question paper
//   2. map + grade + locate the student's answers on the answer sheet
//
// Bounding boxes are requested in Gemini's native spatial convention —
// [ymin, xmin, ymax, xmax], integers normalized 0-1000 against the *whole*
// image regardless of its aspect ratio. We convert to a plain 0-1 x/y/w/h
// box server-side (see lib/boxes.ts) so the client never has to know about
// Gemini's convention.

export const QUESTION_EXTRACTION_SYSTEM = `You are an exam-paper parser. You read scanned/photographed question papers and
output every question exactly as printed, in printed order. You are precise about
numbering and never merge or invent content.`;

export function questionExtractionPrompt(pageCount: number): string {
  return `The images above are the ${pageCount} page(s) of a question paper, in order.

Extract every question in the exact order they are printed. Rules:
- Preserve the original printed question numbering (e.g. "1", "2", "11").
- If a question has labelled sub-parts (e.g. 11(a), 11(b), or 4.i / 4.ii), treat EACH
  sub-part as its own separate entry. Put the parent number in "number" and the
  sub-part label in "subpart" (just the letter/roman numeral, e.g. "a").
- If a question has no sub-parts, leave "subpart" empty.
- "text" should be the question as printed, transcribed faithfully (you may lightly
  clean up OCR noise, but do not paraphrase or summarize).
- If marks for a question are printed on the paper (e.g. "[2 marks]", "(5)"), use that
  number for "maxMarks". If no marks are printed anywhere on the paper, use 1 for
  every question. If marks are printed for some questions but not others, infer a
  reasonable value for the missing ones from context (e.g. similar question types).
- Skip headers, instructions, and non-question text (e.g. "Section A", "Time: 1hr").
- Do not skip or merge any question, even short ones.`;
}

export const questionExtractionSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          number: { type: "string" },
          subpart: { type: "string" },
          text: { type: "string" },
          maxMarks: { type: "number" },
        },
        required: ["number", "text", "maxMarks"],
      },
    },
  },
  required: ["questions"],
};

export interface RawQuestion {
  id: string;
  number: string;
  subpart?: string;
  text: string;
  maxMarks: number;
}

export const ANSWER_MAPPING_SYSTEM = `You are grading a student's handwritten exam answers. You are shown the full list of
questions and every page of the student's answer sheet as images. For each question you
must locate the student's answer (it may be out of order, may be missing, and may span
more than one page), transcribe it, grade it, give feedback, and report exactly where on
the page image the answer is written so it can be highlighted for a teacher. You act as
a fair, knowledgeable subject-matter grader using your own understanding of the subject
as the answer key, since no separate answer key was provided. Be precise about pixel
regions: a bounding box should tightly wrap only that question's handwritten answer
(and any diagram that is part of it), not the whole page.`;

export function answerMappingPrompt(questions: RawQuestion[], pageCount: number): string {
  const questionList = questions
    .map(
      (q, i) =>
        `${i + 1}. id="${q.id}" Q${q.number}${q.subpart ? `(${q.subpart})` : ""} [${q.maxMarks} mark(s)]: ${q.text}`
    )
    .join("\n");

  return `QUESTIONS (in printed order):
${questionList}

The images above, after the questions, are the ${pageCount} page(s) of the student's answer
sheet, labelled "Answer sheet page 0", "Answer sheet page 1", etc. (0-indexed).

For EVERY question in the list above, produce one entry in "answers" with matching
"questionId". Rules:
- "found": true if you can locate an answer for this question anywhere on the answer
  sheet, even if it's on a page out of order or answered before/after other questions.
  false if there is no attempt at all.
- "transcribedText": your best-effort transcription of the handwritten answer. Empty
  string if not found.
- If found, "regions" must contain at least one bounding box locating the answer, as
  [ymin, xmin, ymax, xmax] integers normalized 0-1000 against that page image's full
  width/height, plus the 0-indexed "pageIndex" it belongs to. If the same answer
  continues on more than one page, include one region per page it appears on, in order.
  Keep boxes tight around just that answer (text + any diagrams for it), not the full
  page. If not found, "regions" must be an empty array.
- "correctness": "correct" (fully right), "partially_correct" (partly right / partial
  credit), "incorrect" (attempted but wrong), or "unanswered" (no attempt found).
- "score": a number from 0 to that question's maxMarks, consistent with "correctness".
- "feedback": one or two sentences of specific, constructive feedback for the student
  about THIS answer. If unanswered, briefly note that and what a good answer would cover.

Also report:
- "unmatched": any handwritten content on the answer sheet that is clearly an attempted
  answer but does NOT correspond to any question in the list (e.g. answered to a
  question number that doesn't exist, or stray notes). Empty array if none. Each entry
  needs pageIndex, a [ymin,xmin,ymax,xmax] region, your transcription, and a short note
  explaining why it didn't match.
- "overallFeedback": 2-4 sentences summarizing the student's overall performance across
  the whole answer sheet — strengths, weaknesses, and one concrete suggestion.`;
}

export const answerMappingSchema = {
  type: "object",
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: { type: "string" },
          found: { type: "boolean" },
          transcribedText: { type: "string" },
          correctness: {
            type: "string",
            enum: ["correct", "partially_correct", "incorrect", "unanswered"],
          },
          score: { type: "number" },
          feedback: { type: "string" },
          regions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pageIndex: { type: "number" },
                ymin: { type: "number" },
                xmin: { type: "number" },
                ymax: { type: "number" },
                xmax: { type: "number" },
              },
              required: ["pageIndex", "ymin", "xmin", "ymax", "xmax"],
            },
          },
        },
        required: ["questionId", "found", "transcribedText", "correctness", "score", "feedback", "regions"],
      },
    },
    unmatched: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pageIndex: { type: "number" },
          ymin: { type: "number" },
          xmin: { type: "number" },
          ymax: { type: "number" },
          xmax: { type: "number" },
          transcribedText: { type: "string" },
          note: { type: "string" },
        },
        required: ["pageIndex", "ymin", "xmin", "ymax", "xmax", "transcribedText", "note"],
      },
    },
    overallFeedback: { type: "string" },
  },
  required: ["answers", "unmatched", "overallFeedback"],
};
