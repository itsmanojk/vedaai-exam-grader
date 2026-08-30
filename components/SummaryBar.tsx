"use client";

import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";

interface Props {
  totalScore: number;
  totalMaxMarks: number;
  overallFeedback: string;
  studentLabel: string;
}

export function SummaryBar({ totalScore, totalMaxMarks, overallFeedback, studentLabel }: Props) {
  const [open, setOpen] = useState(false);
  const pct = totalMaxMarks > 0 ? Math.round((totalScore / totalMaxMarks) * 100) : 0;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3 md:px-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-tint)] text-[var(--brand)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--ink)]">{studentLabel}</p>
            <p className="text-xs text-[var(--muted)]">Grading summary</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-base font-bold text-[var(--ink)]">
              {totalScore}
              <span className="font-normal text-[var(--muted)]"> / {totalMaxMarks}</span>
            </p>
            <p className="text-xs text-[var(--muted)]">{pct}%</p>
          </div>
          <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && overallFeedback && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-[var(--ink)]">{overallFeedback}</p>
      )}
    </div>
  );
}
