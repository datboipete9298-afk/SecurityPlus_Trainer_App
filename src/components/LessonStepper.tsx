import { Link } from "react-router-dom";
import { LEARNING_PIPELINE } from "../core/learningFlow";
import type { LessonProgress } from "../types/beginner";

const STEPS: { key: keyof LessonProgress; label: string }[] = [
  { key: "videoWatched", label: `${LEARNING_PIPELINE[0]!.order}. ${LEARNING_PIPELINE[0]!.label}` },
  { key: "highlightsDone", label: `${LEARNING_PIPELINE[1]!.order}. ${LEARNING_PIPELINE[1]!.label}` },
  { key: "notesSaved", label: "3. Write (notes)" },
  { key: "quickActionDone", label: `${LEARNING_PIPELINE[3]!.order}. ${LEARNING_PIPELINE[3]!.label}` },
  { key: "quizCompleted", label: `${LEARNING_PIPELINE[4]!.order}. ${LEARNING_PIPELINE[4]!.label}` },
  { key: "flashcardsReviewed", label: `${LEARNING_PIPELINE[5]!.order}. ${LEARNING_PIPELINE[5]!.label}` },
  { key: "teachBackDone", label: `${LEARNING_PIPELINE[6]!.order}. ${LEARNING_PIPELINE[6]!.label}` },
];

type Props = {
  lessonId: string;
  p: LessonProgress;
  hasLab: boolean;
  labDone?: boolean;
  /** Two labs + two sims + decision (training platform) */
  handsOnComplete?: boolean;
  nextHref?: string;
};

export default function LessonStepper({ lessonId, p, hasLab, labDone, handsOnComplete, nextHref }: Props) {
  const done = (k: keyof LessonProgress) => !!p[k];
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4" aria-label={`Lesson checklist for section ${lessonId}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">Checklist (ties to the same 8-step pipeline as the coach)</p>
      <p className="text-xs text-slate-500 mb-3">Watch → highlight → understand → apply → test → recall → track → next lesson</p>
      <ol className="flex flex-wrap gap-2 text-xs">
        {STEPS.map((s) => {
          const ok = done(s.key);
          return (
            <li
              key={s.key}
              className={`rounded-lg px-2 py-1 border ${ok ? "border-emerald-600/60 text-emerald-200 bg-emerald-950/30" : "border-slate-600 text-slate-400"}`}
            >
              {s.label}
            </li>
          );
        })}
        {hasLab && (
          <li
            className={`rounded-lg px-2 py-1 border ${labDone ? "border-cyan-600/50 text-cyan-200" : "border-slate-600 text-slate-500"}`}
          >
            Lab
          </li>
        )}
        <li
          className={`rounded-lg px-2 py-1 border ${
            handsOnComplete ? "border-emerald-600/50 text-emerald-200" : "border-slate-600 text-slate-500"
          }`}
        >
          Platform (2 labs · 2 sims · decision)
        </li>
        {nextHref && (
          <li className="rounded-lg px-2 py-1 border border-violet-600/50 text-violet-200">
            <Link to={nextHref} className="hover:underline">
              7. Next
            </Link>
          </li>
        )}
      </ol>
    </div>
  );
}
