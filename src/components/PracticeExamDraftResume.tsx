import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { listPracticeExamDraftExamIds, practiceExamDisplayLabel } from "../utils/practiceExamDraft";

/**
 * Session-only: shows in-progress Messer exam drafts. Re-renders on focus (returning to tab).
 */
export default function PracticeExamDraftResume({ className = "" }: { className?: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onVis = () => setTick((t) => t + 1);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const ids = useMemo(() => {
    void tick;
    return listPracticeExamDraftExamIds();
  }, [tick]);

  if (ids.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-amber-700/45 bg-amber-950/25 px-4 py-4 space-y-3 ${className}`}
      aria-labelledby="exam-draft-resume-h"
    >
      <h2 id="exam-draft-resume-h" className="text-sm font-bold text-amber-100 uppercase tracking-wide">
        Resume practice exam
      </h2>
      <p className="text-xs text-amber-200/85 leading-relaxed">
        Finish this run soon — it lives in this tab only, not in your backup.
      </p>
      <ul className="space-y-2 list-none">
        {ids.map((examId) => (
          <li key={examId}>
            <Link
              to={`/quiz/${examId}?mode=exam`}
              className="flex min-h-[44px] items-center justify-center rounded-lg border border-amber-800/60 bg-slate-900/50 px-3 py-2 text-sm font-medium text-amber-50 hover:bg-slate-800/60 touch-manipulation"
            >
              Continue {practiceExamDisplayLabel(examId)} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
