"use client";

import { ArrowRight, GraduationCap } from "lucide-react";
import { FileDropzone, type PickedFile } from "./FileDropzone";

interface Props {
  questionPaperFiles: PickedFile[];
  setQuestionPaperFiles: (f: PickedFile[]) => void;
  answerSheetFiles: PickedFile[];
  setAnswerSheetFiles: (f: PickedFile[]) => void;
  onStartMapping: () => void;
  errorMessage?: string | null;
}

export function UploadPanel({
  questionPaperFiles,
  setQuestionPaperFiles,
  answerSheetFiles,
  setAnswerSheetFiles,
  onStartMapping,
  errorMessage,
}: Props) {
  const ready = questionPaperFiles.length > 0 && answerSheetFiles.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-10 md:py-16">
      <h1 className="text-center text-2xl font-semibold leading-snug text-[var(--ink)] md:text-[28px]">
        Upload{" "}
        <span className="rounded-md bg-[var(--brand-tint)] px-2 py-0.5 text-[var(--brand-dark)] underline decoration-2 underline-offset-4">
          Question Paper &amp; Answer Sheets
        </span>
      </h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Upload both files to get started</p>

      <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-tint)] ring-8 ring-orange-50">
        <GraduationCap className="h-8 w-8 text-[var(--brand)]" />
      </div>

      <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <FileDropzone
          label="Upload Question Paper"
          files={questionPaperFiles}
          onChange={setQuestionPaperFiles}
          multiple
        />
        <FileDropzone
          label="Upload Answer Sheet"
          files={answerSheetFiles}
          onChange={setAnswerSheetFiles}
          multiple
        />
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={onStartMapping}
        className="mt-8 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
        style={{ backgroundColor: ready ? "var(--ink)" : undefined }}
      >
        Start Mapping
        <ArrowRight className="h-4 w-4" />
      </button>

      <p className="mt-3 text-center text-xs text-[var(--muted)]">
        Once both files are uploaded, you&apos;ll be able to map answers with questions
      </p>

      {errorMessage && (
        <div className="mt-6 w-full rounded-xl border border-[var(--red-border)] bg-[var(--red-tint)] px-4 py-3 text-sm text-[var(--red)]">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
