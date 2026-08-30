// Core domain types shared between the client and the API routes.
// Everything lives in memory for the lifetime of a single grading session —
// no database, no persisted files (per the project's "no DB" constraint).

/** A single page of a document, rendered to an image on the client. */
export interface PageImage {
  /** 0-based page index within the document. */
  index: number;
  /** data URL, e.g. "data:image/jpeg;base64,...." */
  dataUrl: string;
  /** pixel dimensions of the rendered page, used to keep overlay boxes aligned. */
  width: number;
  height: number;
}

/** A question extracted from the question paper, in printed order. */
export interface Question {
  id: string; // stable id, e.g. "q11a"
  /** printed question number, e.g. "11" */
  number: string;
  /** printed sub-part label, e.g. "a" — undefined if the question has no sub-parts */
  subpart?: string;
  /** the question text, transcribed as printed */
  text: string;
  /** marks the question is worth. Inferred if not printed on the paper. */
  maxMarks: number;
}

export type Correctness =
  | "correct"
  | "partially_correct"
  | "incorrect"
  | "unanswered";

/** Normalized bounding box, relative to the page image (0..1 on each axis). */
export interface NormalizedBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnswerRegion {
  pageIndex: number;
  box: NormalizedBox;
}

/** The mapping + grading result for a single question. */
export interface AnswerMapping {
  questionId: string;
  found: boolean;
  /** primary region shown when the question is first selected */
  primaryRegion: AnswerRegion | null;
  /** additional regions, used when an answer continues across pages */
  additionalRegions: AnswerRegion[];
  transcribedText: string;
  score: number;
  maxMarks: number;
  correctness: Correctness;
  feedback: string;
}

/** Handwritten content on the answer sheet that couldn't be matched to any question. */
export interface UnmatchedAnswer {
  pageIndex: number;
  box: NormalizedBox;
  transcribedText: string;
  note: string;
}

export interface GradingResult {
  answers: AnswerMapping[];
  unmatched: UnmatchedAnswer[];
  overallFeedback: string;
  totalScore: number;
  totalMaxMarks: number;
}

export type ProcessingStep =
  | "idle"
  | "rendering"
  | "extracting-questions"
  | "mapping-answers"
  | "done"
  | "error";
