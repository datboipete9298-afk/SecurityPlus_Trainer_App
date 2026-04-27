import type { ReactNode } from "react";

type Props = {
  title: string;
  whatHappened: string;
  whyItMatters: string;
  nextStep?: string;
  /** Links / buttons — keep to a small row of 1-click repairs */
  actions: ReactNode;
  tone?: "rose" | "amber" | "sky";
  ariaLabel?: string;
};

const toneClass: Record<NonNullable<Props["tone"]>, string> = {
  rose: "border-rose-700/50 bg-rose-950/30 text-rose-100",
  amber: "border-amber-700/50 bg-amber-950/25 text-amber-100",
  sky: "border-sky-700/45 bg-sky-950/25 text-sky-100",
};

export default function FailureRecoveryPanel({
  title,
  whatHappened,
  whyItMatters,
  nextStep,
  actions,
  tone = "rose",
  ariaLabel,
}: Props) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm space-y-2 ${toneClass[tone]}`}
      role="region"
      aria-label={ariaLabel ?? title}
    >
      <p className="font-semibold text-white">{title}</p>
      <p className="text-xs leading-relaxed opacity-95">{whatHappened}</p>
      <p className="text-xs leading-relaxed text-slate-200/90">{whyItMatters}</p>
      {nextStep && <p className="text-xs font-medium text-white/90 pt-1">{nextStep}</p>}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">{actions}</div>
    </div>
  );
}
