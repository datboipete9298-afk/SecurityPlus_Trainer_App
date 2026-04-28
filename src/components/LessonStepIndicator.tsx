import { LESSON_STEP_FOCUS } from "../core/learningFlow";

const TOTAL_STEPS = Object.keys(LESSON_STEP_FOCUS).length;

type Props = {
  /** 1-based current step (matches LessonPage flowStep). */
  currentStep: number;
  /** Whether single-step pacing is on — when false the indicator is a soft hint, not a position. */
  strict: boolean;
};

/**
 * Calm, deterministic "You are here" strip for lessons.
 * Not a CTA — pure orientation so users don't ask "where am I?"
 */
export default function LessonStepIndicator({ currentStep, strict }: Props) {
  const step = Math.max(1, Math.min(currentStep, TOTAL_STEPS));
  const label = LESSON_STEP_FOCUS[step] ?? "This step";
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div
      className="rounded-xl border border-slate-700/80 bg-slate-900/40 px-3 py-2.5"
      role="status"
      aria-live="polite"
      aria-label={`Lesson progress: step ${step} of ${TOTAL_STEPS}, ${label}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] text-slate-400">
          <span className="text-emerald-300/95 font-semibold">You are here:</span>{" "}
          <span className="text-slate-200 font-medium">
            Step {step} of {TOTAL_STEPS}
          </span>{" "}
          · <span className="text-slate-300">{label}</span>
        </p>
        <p className="text-[10px] text-slate-500">
          {strict ? "One step at a time" : "Free scroll on"}
        </p>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden" aria-hidden>
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
