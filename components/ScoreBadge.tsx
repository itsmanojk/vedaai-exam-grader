"use client";

import type { Correctness } from "@/lib/types";

const STYLES: Record<Correctness, string> = {
  correct: "bg-[var(--green-tint)] text-[var(--green)] border-[var(--green-border)]",
  partially_correct: "bg-[var(--amber-tint)] text-[var(--amber)] border-[var(--amber-border)]",
  incorrect: "bg-[var(--red-tint)] text-[var(--red)] border-[var(--red-border)]",
  unanswered: "bg-gray-100 text-gray-500 border-gray-200",
};

export function ScoreBadge({
  score,
  maxMarks,
  correctness,
}: {
  score: number;
  maxMarks: number;
  correctness: Correctness;
}) {
  if (correctness === "unanswered") {
    return (
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[correctness]}`}>
        Not answered
      </span>
    );
  }
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[correctness]}`}>
      {score}/{maxMarks}
    </span>
  );
}
