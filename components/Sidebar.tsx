"use client";

import {
  Sparkles,
  LayoutGrid,
  Presentation,
  FileText,
  ClipboardList,
  Clock,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", icon: LayoutGrid, active: false },
  { label: "My Classroom", icon: Presentation, active: false },
  { label: "Assignments", icon: FileText, active: false },
  { label: "Exams", icon: ClipboardList, active: true },
  { label: "My Library", icon: Clock, active: false },
];

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <aside className="hidden md:flex w-16 shrink-0 flex-col items-center gap-4 border-r border-[var(--border)] bg-[var(--panel)] py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ink)] text-white font-bold">
          V
        </div>
        <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-tint)] text-[var(--brand)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <nav className="mt-2 flex flex-col gap-3 text-[var(--muted)]">
          {NAV_ITEMS.map(({ icon: Icon, active }, i) => (
            <div
              key={i}
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                active ? "bg-[var(--ink)] text-white" : "hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)] px-4 py-5">
      <div className="flex items-center gap-2 px-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ink)] text-white font-bold">
          V
        </div>
        <span className="text-[15px] font-semibold tracking-tight">VedaAI</span>
      </div>

      <button
        type="button"
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white"
      >
        <Sparkles className="h-4 w-4 text-[var(--brand)]" />
        AI Teacher&apos;s Toolkit
      </button>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
              active
                ? "bg-gray-100 font-medium text-[var(--ink)]"
                : "text-[var(--muted)] hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-sm font-semibold text-green-800">
          DPS
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--ink)]">Delhi Public School</p>
          <p className="truncate text-xs text-[var(--muted)]">Bokaro Steel City</p>
        </div>
      </div>
    </aside>
  );
}
