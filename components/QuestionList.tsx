"use client";

import { AlertTriangle } from "lucide-react";
import type { AnswerMapping, Question, UnmatchedAnswer } from "@/lib/types";
import { QuestionCard } from "./QuestionCard";

interface Props {
  questions: Question[];
  mappingByQuestionId: Map<string, AnswerMapping>;
  unmatched: UnmatchedAnswer[];
  selectedId: string | null;
  expandedIds: Set<string>;
  allExpanded: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleExpandAll: () => void;
  onSelectUnmatched: (index: number) => void;
  selectedUnmatchedIndex: number | null;
}

export function QuestionList({
  questions,
  mappingByQuestionId,
  unmatched,
  selectedId,
  expandedIds,
  allExpanded,
  onSelect,
  onToggleExpand,
  onToggleExpandAll,
  onSelectUnmatched,
  selectedUnmatchedIndex,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-3 pt-4 md:px-5">
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          Extracted Questions <span className="font-normal text-[var(--muted)]">(from question paper)</span>
        </h2>
        <button
          type="button"
          onClick={onToggleExpandAll}
          className="text-xs font-medium text-[var(--brand)] hover:underline"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 pb-6 md:px-5">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            mapping={mappingByQuestionId.get(q.id)}
            selected={selectedId === q.id}
            expanded={expandedIds.has(q.id)}
            onSelect={() => onSelect(q.id)}
            onToggleExpand={() => onToggleExpand(q.id)}
          />
        ))}

        {unmatched.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-[var(--muted)]">
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--amber)]" />
              Unmatched handwriting ({unmatched.length})
            </p>
            <div className="space-y-2">
              {unmatched.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectUnmatched(i)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                    selectedUnmatchedIndex === i
                      ? "border-[var(--amber-border)] bg-[var(--amber-tint)]"
                      : "border-[var(--border)] bg-white hover:border-gray-300"
                  }`}
                >
                  <p className="line-clamp-2 text-[var(--ink)]">{u.transcribedText || "(illegible)"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{u.note}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
