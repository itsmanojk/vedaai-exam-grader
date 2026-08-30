"use client";

import { ArrowLeft, ClipboardList, HelpCircle, Bell, Sparkles } from "lucide-react";

export function TopBar({ onBack }: { onBack?: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3 md:px-6">
      <div className="flex items-center gap-3 text-sm text-[var(--ink)]">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          className="rounded-md p-1 text-[var(--muted)] hover:bg-gray-100 disabled:opacity-40"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <ClipboardList className="h-4 w-4 text-[var(--muted)]" />
        <span className="font-medium">Exams</span>
      </div>

      <div className="flex items-center gap-4">
        <HelpCircle className="hidden h-4.5 w-4.5 text-[var(--muted)] sm:block" />
        <div className="relative hidden sm:block">
          <Bell className="h-4.5 w-4.5 text-[var(--muted)]" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--brand)]" />
        </div>
        <Sparkles className="hidden h-4.5 w-4.5 text-[var(--muted)] sm:block" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
            MR
          </div>
          <span className="hidden text-sm font-medium text-[var(--ink)] md:inline">
            Madhur Rastogi
          </span>
        </div>
      </div>
    </header>
  );
}
