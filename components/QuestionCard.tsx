"use client";

import { ChevronDown, Sparkles, PenLine } from "lucide-react";
import type { AnswerMapping, Question } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

const FEEDBACK_BORDER: Record<string, string> = {
  correct: "border-l-[var(--green)]",
  partially_correct: "border-l-[var(--amber)]",
  incorrect: "border-l-[var(--red)]",
  unanswered: "border-l-gray-300",
};

interface Props {
  question: Question;
  mapping?: AnswerMapping;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

export function QuestionCard({ question, mapping, selected, expanded, onSelect, onToggleExpand }: Props) {
  const correctness = mapping?.correctness ?? "unanswered";

  return (
    <div
      className={`rounded-xl border transition-colors ${
        selected
          ? "border-[var(--brand)] bg-[var(--brand-tint)]/40"
          : "border-[var(--border)] bg-white hover:border-gray-300"
      }`}
    >
      <button
        type="button"
        onClick={() => {
          onSelect();
          onToggleExpand();
        }}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
      >
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
            selected ? "bg-[var(--brand)] text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {question.number}
          {question.subpart}
        </span>

        <span className="min-w-0 flex-1">
          <p className={`text-sm text-[var(--ink)] ${expanded ? "" : "line-clamp-2"}`}>
            {question.subpart && (
              <span className="font-semibold text-[var(--muted)]">({question.subpart}) </span>
            )}
            {question.text}
          </p>
        </span>

        {mapping ? (
          <ScoreBadge score={mapping.score} maxMarks={mapping.maxMarks} correctness={correctness} />
        ) : (
          <span className="text-xs text-[var(--muted)]">…</span>
        )}

        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="space-y-3 px-3.5 pb-4">
          {mapping?.found ? (
            <div className="rounded-lg border border-[var(--border)] bg-gray-50 px-3 py-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
                <PenLine className="h-3.5 w-3.5" /> Student&apos;s answer
              </p>
              <p className="whitespace-pre-line text-sm text-[var(--ink)]">{mapping.transcribedText}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm text-[var(--muted)]">
              No matching answer was found on the answer sheet for this question.
            </div>
          )}

          {mapping?.feedback && (
            <div
              className={`rounded-lg border border-l-4 bg-white px-3 py-2.5 ${
                FEEDBACK_BORDER[correctness] ?? FEEDBACK_BORDER.unanswered
              } border-[var(--border)]`}
            >
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--brand)]" /> AI Feedback
              </p>
              <p className="text-sm text-[var(--ink)]">{mapping.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
