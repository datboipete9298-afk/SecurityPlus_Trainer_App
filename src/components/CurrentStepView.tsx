import type { ReactNode } from "react";

type Props = {
  stepIndex: number;
  flowStep: number;
  /** When true with beginnerMode OR alone, enforce single-step pacing */
  oneStepAtATime: boolean;
  beginnerMode: boolean;
  phaseLabel: string;
  stepTitleLine: string;
  className?: string;
  lockedContent?: ReactNode;
  children: ReactNode;
  doneFooter?: ReactNode;
};

/**
 * One focal step per screen: completed steps collapse; future steps lock.
 */
export default function CurrentStepView({
  stepIndex,
  flowStep,
  oneStepAtATime,
  beginnerMode,
  phaseLabel,
  stepTitleLine,
  className = "card border-slate-800",
  lockedContent,
  children,
  doneFooter,
}: Props) {
  const strict = oneStepAtATime || beginnerMode;
  const isFuture = strict && stepIndex > flowStep;
  const isPast = strict && stepIndex < flowStep;
  const isCurrent = strict ? stepIndex === flowStep : true;

  if (isFuture) {
    return <>{lockedContent ?? null}</>;
  }

  if (strict && isPast) {
    return (
      <details className={`${className} border-slate-700/70 bg-slate-900/35 mb-2 group overflow-hidden`}>
        <summary className="cursor-pointer list-none px-4 py-3 text-sm text-slate-400 touch-manipulation min-h-[48px] flex flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
          <span className="text-emerald-400/95 font-semibold">✓</span>
          <span>
            Step {stepIndex}: {phaseLabel} — done ({stepTitleLine})
          </span>
        </summary>
        <div className="px-4 pb-4 border-t border-slate-800/90 pt-3 space-y-3 text-slate-300">{children}</div>
      </details>
    );
  }

  return (
    <section className={className ?? "card border-slate-800"} data-step={stepIndex}>
      {(isCurrent || !strict) && (
        <>
          <h2 className="text-cyan-300 font-bold text-sm uppercase">
            Step {stepIndex}: {phaseLabel}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{stepTitleLine}</p>
          <p className="text-[11px] text-slate-400 mt-2 italic">Focus on this block only.</p>
          {children}
          {doneFooter}
        </>
      )}
    </section>
  );
}
