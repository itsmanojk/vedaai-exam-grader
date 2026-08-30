"use client";

import { Sparkles, Check } from "lucide-react";
import type { ProcessingStep } from "@/lib/types";

const STEPS: { key: ProcessingStep; label: string }[] = [
  { key: "rendering", label: "Reading uploaded pages" },
  { key: "extracting-questions", label: "Extracting questions from the question paper" },
  { key: "mapping-answers", label: "Mapping and grading the student's answers" },
];

const ORDER: ProcessingStep[] = ["rendering", "extracting-questions", "mapping-answers", "done"];

export function ExtractingScreen({ step }: { step: ProcessingStep }) {
  const currentIndex = ORDER.indexOf(step);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="animate-sparkle flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-tint)] text-[var(--brand)]">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-[var(--ink)]">Extracting...</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">This may take a while</p>

      <ol className="mt-8 flex w-full max-w-sm flex-col gap-3">
        {STEPS.map((s, i) => {
          const done = currentIndex > i;
          const active = currentIndex === i;
          return (
            <li
              key={s.key}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                active
                  ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)] font-medium"
                  : done
                  ? "border-[var(--green-border)] bg-[var(--green-tint)] text-[var(--green)]"
                  : "border-[var(--border)] bg-white text-[var(--muted)]"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-[var(--green)] text-white" : active ? "bg-[var(--brand)] text-white" : "bg-gray-200"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="text-[10px] font-semibold">{i + 1}</span>
                )}
              </span>
              {s.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
