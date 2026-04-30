import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Screen-reader / layout id */
  id?: string;
  className?: string;
};

/**
 * Single “next step” surface — matches Home hero pattern.
 * Pass exactly one primary control as children (button or `ContinueButton` link).
 */
export default function FlowPrimaryStrip({ children, id = "flow-primary-strip", className = "" }: Props) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/45 to-slate-950/30 px-4 py-4 sm:px-5 sm:py-5 shadow-ds-soft border-l-[3px] border-l-emerald-400/70 transition-[box-shadow,transform] duration-200 ease-ds-out hover:shadow-ds-glow ${className}`}
      aria-labelledby={`${id}-label`}
    >
      <p id={`${id}-label`} className="text-ds-micro font-bold text-emerald-200/95 uppercase tracking-wider">
        Do this next
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}
