"use client";

import { useMemo, useState } from "react";
import type { GradingResult, PageImage, Question } from "@/lib/types";
import { QuestionList } from "./QuestionList";
import { AnswerSheetViewer } from "./AnswerSheetViewer";
import { SummaryBar } from "./SummaryBar";

interface Props {
  questions: Question[];
  grading: GradingResult;
  answerPages: PageImage[];
}

const COLOR_BY_CORRECTNESS: Record<string, string> = {
  correct: "--green",
  partially_correct: "--amber",
  incorrect: "--red",
  unanswered: "--muted",
};

export function ReviewScreen({ questions, grading, answerPages }: Props) {
  const mappingByQuestionId = useMemo(
    () => new Map(grading.answers.map((a) => [a.questionId, a])),
    [grading.answers]
  );

  const [selectedId, setSelectedId] = useState<string | null>(questions[0]?.id ?? null);
  const [selectedUnmatchedIndex, setSelectedUnmatchedIndex] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(questions[0] ? [questions[0].id] : [])
  );
  const [allExpanded, setAllExpanded] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(
    () => mappingByQuestionId.get(questions[0]?.id ?? "")?.primaryRegion?.pageIndex ?? 0
  );
  const [mobileTab, setMobileTab] = useState<"questions" | "sheet">("questions");

  const selectedMapping = selectedId ? mappingByQuestionId.get(selectedId) : undefined;
  const selectedUnmatched =
    selectedUnmatchedIndex !== null ? grading.unmatched[selectedUnmatchedIndex] : undefined;

  const regions = selectedUnmatched
    ? [{ pageIndex: selectedUnmatched.pageIndex, box: selectedUnmatched.box }]
    : selectedMapping?.primaryRegion
    ? [selectedMapping.primaryRegion, ...selectedMapping.additionalRegions]
    : [];

  const regionColorVar = selectedUnmatched
    ? "--amber"
    : COLOR_BY_CORRECTNESS[selectedMapping?.correctness ?? "unanswered"];

  const regionLabel = selectedUnmatched
    ? "Unmatched"
    : (() => {
        const q = questions.find((q) => q.id === selectedId);
        return q ? `Q${q.number}${q.subpart ?? ""}` : undefined;
      })();

  function handleSelect(id: string) {
    setSelectedUnmatchedIndex(null);
    setSelectedId(id);
    setMobileTab("sheet");
    const region = mappingByQuestionId.get(id)?.primaryRegion;
    if (region) setCurrentPageIndex(region.pageIndex);
  }

  function handleToggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleExpandAll() {
    if (allExpanded) {
      setExpandedIds(new Set());
      setAllExpanded(false);
    } else {
      setExpandedIds(new Set(questions.map((q) => q.id)));
      setAllExpanded(true);
    }
  }

  function handleSelectUnmatched(index: number) {
    setSelectedId(null);
    setSelectedUnmatchedIndex(index);
    setMobileTab("sheet");
    setCurrentPageIndex(grading.unmatched[index].pageIndex);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SummaryBar
        totalScore={grading.totalScore}
        totalMaxMarks={grading.totalMaxMarks}
        overallFeedback={grading.overallFeedback}
        studentLabel="Student's Answer Sheet"
      />

      {/* Mobile tab switcher */}
      <div className="flex border-b border-[var(--border)] bg-[var(--panel)] md:hidden">
        {(["questions", "sheet"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 border-b-2 py-2.5 text-sm font-medium ${
              mobileTab === tab
                ? "border-[var(--ink)] text-[var(--ink)]"
                : "border-transparent text-[var(--muted)]"
            }`}
          >
            {tab === "questions" ? "Questions" : "Answer Sheet"}
          </button>
        ))}
      </div>

      <div className="grid flex-1 overflow-hidden md:grid-cols-[minmax(0,420px)_1fr]">
        <div className={`overflow-hidden border-r border-[var(--border)] bg-[var(--panel)] ${
          mobileTab === "questions" ? "block" : "hidden"
        } md:block`}
        >
          <QuestionList
            questions={questions}
            mappingByQuestionId={mappingByQuestionId}
            unmatched={grading.unmatched}
            selectedId={selectedId}
            expandedIds={expandedIds}
            allExpanded={allExpanded}
            onSelect={handleSelect}
            onToggleExpand={handleToggleExpand}
            onToggleExpandAll={handleToggleExpandAll}
            onSelectUnmatched={handleSelectUnmatched}
            selectedUnmatchedIndex={selectedUnmatchedIndex}
          />
        </div>

        <div className={`overflow-hidden ${mobileTab === "sheet" ? "block" : "hidden"} md:block`}>
          <AnswerSheetViewer
            pages={answerPages}
            currentPageIndex={currentPageIndex}
            onPageChange={setCurrentPageIndex}
            regions={regions}
            regionColorVar={regionColorVar}
            regionLabel={regionLabel}
          />
        </div>
      </div>
    </div>
  );
}
