/**
 * Vertical step rail for watch / fusion flows — reinforces forward motion without gamification.
 * Respects prefers-reduced-motion via parent CSS utilities.
 */
const STEPS = ["Watch", "Write", "Save", "Check", "Keep moving"] as const;

type Props = {
  /** Current step index 0–4 (Watch → Write → Save → Check → Keep moving). */
  currentStep: number;
  className?: string;
};

export default function StudyFlowTimeline({ currentStep, className = "" }: Props) {
  const current = Math.max(0, Math.min(4, currentStep));
  return (
    <div className={`rounded-xl border border-slate-800/90 bg-slate-950/50 px-3 py-3 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Your rhythm</p>
      <ol className="relative space-y-0" aria-label="Study flow steps">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="relative flex gap-3 pb-3 last:pb-0" role="listitem">
              {i < STEPS.length - 1 && (
                <span
                  className={`absolute left-[11px] top-[22px] w-px h-[calc(100%-6px)] ${
                    done ? "bg-emerald-600/50" : "bg-slate-800"
                  }`}
                  aria-hidden
                />
              )}
              <span
                className={`relative z-[1] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors duration-200 ease-out ${
                  done ?
                    "border-emerald-500/70 bg-emerald-950/60 text-emerald-200"
                  : active ?
                    "border-amber-400/80 bg-amber-950/40 text-amber-100 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]"
                  : "border-slate-700 bg-slate-900 text-slate-500"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-xs font-medium leading-tight ${active ? "text-white" : done ? "text-emerald-200/90" : "text-slate-500"}`}>
                  {label}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
