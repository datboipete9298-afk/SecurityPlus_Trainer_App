import { useState } from "react";
import type { TutorFeedback } from "../core/feedbackEngine";
import type { QuizQuestion } from "../types";
import ExamHintBox from "./ExamHintBox";
import MistakeInsight from "./MistakeInsight";
import AnswerBreakdown from "./AnswerBreakdown";

type Props = {
  feedback: TutorFeedback;
  /** When set, shows per-option breakdown (quizzes). */
  quizQuestion?: QuizQuestion;
  singleSel?: number | null;
  multiSel?: number[];
  keywordLine?: string;
  /** Start with full detail hidden (“see explanation again” expands). */
  startCollapsedDetail?: boolean;
  /** Controlled detail section (optional). */
  detailOpen?: boolean;
  onDetailOpenChange?: (open: boolean) => void;
  className?: string;
};

export default function FeedbackPanel({
  feedback,
  quizQuestion,
  singleSel = null,
  multiSel = [],
  keywordLine,
  startCollapsedDetail = false,
  detailOpen: detailOpenControlled,
  onDetailOpenChange,
  className = "",
}: Props) {
  const [detailOpenInternal, setDetailOpenInternal] = useState(!startCollapsedDetail);
  const detailOpen = detailOpenControlled ?? detailOpenInternal;
  const setDetailOpen = (v: boolean) => {
    onDetailOpenChange?.(v);
    if (detailOpenControlled === undefined) setDetailOpenInternal(v);
  };
  const ok = feedback.result === "correct";

  return (
    <div
      className={`mt-4 space-y-4 border-t border-slate-800 pt-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
          ok ? "border-emerald-600/60 bg-emerald-950/25" : "border-rose-600/50 bg-rose-950/20"
        }`}
      >
        <span className="text-2xl shrink-0" aria-hidden>
          {ok ? "✔" : "✗"}
        </span>
        <div>
          <p className={`text-sm font-bold ${ok ? "text-emerald-300" : "text-rose-200"}`}>
            {ok ? "Correct" : "Incorrect"}
          </p>
          <p className="text-sm text-slate-200 mt-2 leading-relaxed">{feedback.explanationSimple}</p>
          <p className="text-xs text-slate-400 mt-2 italic">{ok ? "This is correct because…" : "Here’s how to think about it…"}</p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-3 space-y-2">
        <p className="text-[10px] uppercase text-slate-500 font-semibold">Simple takeaway</p>
        <p className="text-sm text-slate-200 leading-relaxed">{feedback.whyCorrect}</p>
      </div>

      <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
        <p className="text-[10px] uppercase text-blue-200/90 font-semibold mb-2">How to think (not memorize)</p>
        {feedback.thinkingTraining}
      </div>

      {feedback.adaptiveAddendum.trim() !== "" && (
        <div className="rounded-xl border border-violet-800/45 bg-violet-950/20 p-3 text-sm text-violet-100/95 whitespace-pre-wrap leading-relaxed">
          <p className="text-[10px] uppercase text-violet-200/90 font-semibold mb-2">Adaptive tutor</p>
          {feedback.adaptiveAddendum}
        </div>
      )}

      <MistakeInsight feedback={feedback} />

      <ExamHintBox feedback={feedback} keywordLine={keywordLine} />

      <div className="rounded-xl border border-cyan-900/35 bg-cyan-950/15 p-3 text-sm text-slate-300">
        <p className="text-[10px] uppercase text-cyan-200/80 font-semibold mb-1">Real world</p>
        <p className="leading-relaxed">{feedback.realWorldMeaning}</p>
      </div>

      <div className="rounded-xl border border-slate-600 bg-slate-900/40 p-3">
        <p className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Memory trick</p>
        <p className="text-sm text-cyan-100/90">{feedback.memoryHook}</p>
      </div>

      <button
        type="button"
        onClick={() => setDetailOpen(!detailOpen)}
        className="text-sm text-emerald-400 hover:text-emerald-300 underline"
      >
        {detailOpen ? "Hide full explanation" : "See full explanation again"}
      </button>

      {detailOpen && (
        <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-300 leading-relaxed">
          {feedback.explanationDetailed}
        </div>
      )}

      {quizQuestion && <AnswerBreakdown q={quizQuestion} singleSel={singleSel} multiSel={multiSel} />}

      <p className="text-xs text-slate-500 border-t border-slate-800 pt-3">
        <span className="text-slate-400 font-medium">Suggested next step: </span>
        {feedback.nextActionSuggestion}
      </p>
    </div>
  );
}
