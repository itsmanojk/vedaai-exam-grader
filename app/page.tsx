"use client";

import { useState } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { UploadPanel } from "@/components/UploadPanel";
import { ExtractingScreen } from "@/components/ExtractingScreen";
import { ReviewScreen } from "@/components/ReviewScreen";
import type { PickedFile } from "@/components/FileDropzone";
import { renderFilesToPages, dataUrlToInlineData } from "@/lib/renderPages";
import type { GradingResult, PageImage, ProcessingStep, Question } from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [questionPaperFiles, setQuestionPaperFiles] = useState<PickedFile[]>([]);
  const [answerSheetFiles, setAnswerSheetFiles] = useState<PickedFile[]>([]);

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answerPages, setAnswerPages] = useState<PageImage[] | null>(null);
  const [grading, setGrading] = useState<GradingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleStartMapping() {
    setErrorMessage(null);
    setStep("rendering");
    try {
      const [qPages, aPages] = await Promise.all([
        renderFilesToPages(questionPaperFiles.map((f) => f.file)),
        renderFilesToPages(answerSheetFiles.map((f) => f.file)),
      ]);
      setAnswerPages(aPages);

      // STEP 1: Extract Questions
      setStep("extracting-questions");
      const qRes = await fetch("/api/extract-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: qPages.map((p) => dataUrlToInlineData(p.dataUrl)),
        }),
      });

      const qRawText = await qRes.text();
      let qJson: any;
      try {
        qJson = JSON.parse(qRawText);
      } catch {
        if (qRes.status === 504 || qRes.status === 502) {
          throw new Error("Vercel timed out waiting for AI response (10s Hobby limit). Try processing fewer pages.");
        }
        if (qRes.status === 413 || qRawText.includes("Request Entity Too Large")) {
          throw new Error("File payload is too large for Vercel. Please upload smaller images.");
        }
        throw new Error(`Server returned non-JSON response (${qRes.status}): ${qRawText.slice(0, 100)}`);
      }

      if (!qRes.ok) {
        throw new Error(qJson.error || "Failed to extract questions.");
      }

      const extractedQuestions: Question[] = qJson.questions;
      setQuestions(extractedQuestions);

      // STEP 2: Process & Grade Answers
      setStep("mapping-answers");
      const aRes = await fetch("/api/process-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: extractedQuestions,
          pages: aPages.map((p) => dataUrlToInlineData(p.dataUrl)),
        }),
      });

      const aRawText = await aRes.text();
      let aJson: any;
      try {
        aJson = JSON.parse(aRawText);
      } catch {
        if (aRes.status === 504 || aRes.status === 502) {
          throw new Error("Vercel timed out during answer processing. Try uploading fewer pages at once.");
        }
        if (aRes.status === 413 || aRawText.includes("Request Entity Too Large")) {
          throw new Error("Answer sheet payload is too large for Vercel.");
        }
        throw new Error(`Server returned non-JSON response (${aRes.status}): ${aRawText.slice(0, 100)}`);
      }

      if (!aRes.ok) {
        throw new Error(aJson.error || "Failed to map & grade answers.");
      }

      setGrading(aJson as GradingResult);
      setStep("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStep("error");
    }
  }

  function handleReset() {
    setStep("idle");
    setQuestionPaperFiles([]);
    setAnswerSheetFiles([]);
    setQuestions(null);
    setAnswerPages(null);
    setGrading(null);
    setErrorMessage(null);
  }

  function handleRetry() {
    setErrorMessage(null);
    setStep("idle");
  }

  const processing =
    step === "rendering" || step === "extracting-questions" || step === "mapping-answers";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={step !== "idle"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onBack={step !== "idle" ? handleReset : undefined} />

        {step === "idle" && (
          <div className="flex flex-1 overflow-y-auto">
            <UploadPanel
              questionPaperFiles={questionPaperFiles}
              setQuestionPaperFiles={setQuestionPaperFiles}
              answerSheetFiles={answerSheetFiles}
              setAnswerSheetFiles={setAnswerSheetFiles}
              onStartMapping={handleStartMapping}
              errorMessage={null}
            />
          </div>
        )}

        {processing && <ExtractingScreen step={step} />}

        {step === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--red-tint)] text-[var(--red)]">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--ink)]">Something went wrong</h2>
              <p className="mt-1 max-w-md text-sm text-[var(--muted)]">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {step === "done" && questions && grading && answerPages && (
          <ReviewScreen questions={questions} grading={grading} answerPages={answerPages} />
        )}
      </div>
    </div>
  );
}