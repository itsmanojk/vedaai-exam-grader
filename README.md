# VedaAI Exam Grader

Upload a question paper and a student's handwritten answer sheet. The app extracts
every question, locates and transcribes the student's answer to each one, grades it,
and highlights the exact region of the answer sheet the answer came from.

**Live demo:** https://vedai-exam-grader.vercel.app/
**Repo:** https://github.com/itsmanojk/vedaai-exam-grader/

---

## Core flow

```
Upload (PDF/images) → Question Extraction → Answer Extraction/Mapping → Grading & Feedback
```

1. **Upload** — a teacher uploads a question paper and a student's answer sheet, each as
   a PDF or one/more images. Progress through each step below is shown live.
2. **Rendering** — every uploaded page (PDF pages and/or standalone images) is rasterized
   to an image *in the browser* using `pdf.js`. This is what both lets the pages be
   displayed later and gives the AI model something it can look at.
3. **Question extraction** — the question-paper page images are sent to Gemini, which
   returns every question as structured JSON, in printed order, with labelled sub-parts
   (e.g. `11(a)`, `11(b)`) split into separate entries.
4. **Answer mapping + grading** — the full question list and every answer-sheet page
   image are sent to Gemini in a single call. For each question it reports whether an
   answer was found (even out of order or on a later page), transcribes it, grades it,
   gives per-question feedback, and returns a bounding box (or one box per page, for
   answers spanning multiple pages) locating exactly where that answer is written.
   Handwritten content that doesn't match any question is returned separately as
   "unmatched".
5. **Review** — a two-panel screen shows the question list (with scores and expandable
   AI feedback) next to the answer sheet. Selecting a question jumps to the right page
   and draws a highlight box around that exact answer.

Everything after upload lives in browser/React state and two stateless API routes —
there's no database and nothing is written to disk, per the project's "no DB, in-memory
is fine" constraint. Reloading the page starts a fresh session.

## AI model / API used

**Google Gemini** (`gemini-3.6-flash` by default, configurable via `GEMINI_MODEL`),
called directly over its REST API (no SDK dependency) from two Next.js route handlers:

- `app/api/extract-questions/route.ts`
- `app/api/process-answers/route.ts`

Gemini was chosen because it has a genuinely free tier, is strong at reading handwriting
from images, accepts multiple images in one call (needed for multi-page documents), and
supports both **structured JSON output** (`responseSchema`) and **spatial/bounding-box
grounding** — which is what makes "highlight the exact region of the answer" possible
without a separate OCR/layout pipeline. Get a free key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey).

Bounding boxes come back from Gemini in its native format — integers 0–1000,
`[ymin, xmin, ymax, xmax]` normalized against the whole image — and are converted
server-side (`lib/boxes.ts`) into plain 0–1 `{x, y, w, h}` boxes so the client can
position a highlight `<div>` with plain CSS percentages, independent of the actual pixel
size the page is rendered at.

## Tech stack

- **Next.js 16** (App Router, TypeScript) — chosen per the brief's recommendation
- **Tailwind CSS v4** for styling
- **pdf.js** (`pdfjs-dist`), client-side, to rasterize PDF pages into images
- No database, no auth, no server-side file storage — API routes are stateless request/response

## Handling of edge cases

| Case | Handling |
|---|---|
| Labelled sub-parts (11a/11b) | Extracted as two separate question entries, sharing the parent number |
| Answers out of order | The whole answer sheet is given to the model in one call, so it can match answers regardless of the order they were written in |
| Unanswered questions | Reported as `found: false`, shown as "Not answered" with no highlight, and included in the grading total as 0 marks |
| Answers that don't match any question | Returned separately as `unmatched`, shown in their own section in the UI with a highlight and a short note on why they didn't match |
| Answers spanning multiple pages | The model can return one region per page for a single question; the UI shows the first region by default and the question list makes clear when more than one page is involved |
| Marks not printed on the paper | Falls back to 1 mark per question |
| Oversized/unsupported uploads | Rejected client-side before any upload happens (10MB cap, PDF/PNG/JPEG/WebP only) |

## Assumptions & limitations

- **No answer key is provided**, so Gemini grades using its own subject-matter
  knowledge of the question. This is fine for common school-level content but means
  grading quality depends on the model's own knowledge of the subject — for
  highly specific rubrics (e.g. "must mention these exact 4 keywords for full marks"),
  accuracy will be lower than with a real answer key. A natural extension would be an
  optional "upload answer key / marking scheme" input.
- **Single student, single session.** The brief asks for one student's answer sheet
  per run; there's no batch/roster mode.
- **Bounding-box accuracy** depends on Gemini's spatial grounding, which is generally
  good but not pixel-perfect on dense handwriting — boxes may occasionally be slightly
  loose or include a neighbouring line.
- **Handwriting legibility** is the single biggest factor in transcription/grading
  accuracy, as with any human grader.
- Very long question papers/answer sheets increase the size of a single Gemini call;
  this hasn't been load-tested beyond a normal-length school test/unit test.

## Running locally

```bash
npm install
cp .env.example .env.local   # then paste your Gemini API key into .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

The app is a standard Next.js app, so [Vercel](https://vercel.com) is the path of least
resistance:


