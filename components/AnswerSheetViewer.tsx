"use client";

import { useState } from "react";
import { Minus, Plus, ChevronLeft, ChevronRight, FileWarning } from "lucide-react";
import type { AnswerRegion, PageImage } from "@/lib/types";

interface Props {
  pages: PageImage[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  regions: AnswerRegion[];
  regionColorVar: string; // css var name, e.g. "--green"
  regionLabel?: string;
}

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

export function AnswerSheetViewer({
  pages,
  currentPageIndex,
  onPageChange,
  regions,
  regionColorVar,
  regionLabel,
}: Props) {
  const [zoom, setZoom] = useState(1);
  const page = pages[currentPageIndex];
  const regionsOnPage = regions.filter((r) => r.pageIndex === currentPageIndex);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5 md:px-5">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Answer Sheet</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-1 py-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              className="rounded p-1 text-[var(--muted)] hover:bg-gray-100"
              aria-label="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center text-xs font-medium text-[var(--ink)]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              className="rounded p-1 text-[var(--muted)] hover:bg-gray-100"
              aria-label="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {pages.length > 1 && (
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-1 py-1">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                className="rounded p-1 text-[var(--muted)] hover:bg-gray-100 disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="whitespace-nowrap px-1 text-xs font-medium text-[var(--ink)]">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(pages.length - 1, currentPageIndex + 1))}
                disabled={currentPageIndex === pages.length - 1}
                className="rounded p-1 text-[var(--muted)] hover:bg-gray-100 disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 px-4 py-6 md:px-8">
        {page ? (
          <div
            className="relative mx-auto shadow-sm"
            style={{
              width: page.width * zoom,
              height: page.height * zoom,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.dataUrl}
              alt={`Answer sheet page ${currentPageIndex + 1}`}
              width={page.width * zoom}
              height={page.height * zoom}
              className="block rounded-sm border border-[var(--border)] bg-white select-none"
              draggable={false}
            />
            {regionsOnPage.map((r, i) => (
              <div
                key={i}
                className="absolute rounded-sm"
                style={{
                  left: `${r.box.x * 100}%`,
                  top: `${r.box.y * 100}%`,
                  width: `${r.box.w * 100}%`,
                  height: `${r.box.h * 100}%`,
                  border: `2.5px solid var(${regionColorVar})`,
                  backgroundColor: `color-mix(in srgb, var(${regionColorVar}) 14%, transparent)`,
                }}
              >
                {regionLabel && i === 0 && (
                  <span
                    className="absolute -top-6 left-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: `var(${regionColorVar})` }}
                  >
                    {regionLabel}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--muted)]">
            <FileWarning className="h-6 w-6" />
            <p className="text-sm">No page to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
