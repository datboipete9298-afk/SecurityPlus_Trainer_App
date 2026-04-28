import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Screen-reader / layout id */
  id?: string;
  className?: string;
};

/**
 * Single “next step” surface — matches Home hero pattern.
 * Pass exactly one primary control as children (button or Continue link).
 */
export default function FlowPrimaryStrip({ children, id = "flow-primary-strip", className = "" }: Props) {
  return (
    <section
      id={id}
      className={`rounded-2xl border-2 border-emerald-500/55 bg-emerald-950/35 px-4 py-4 shadow-lg shadow-emerald-950/25 ${className}`}
      aria-labelledby={`${id}-label`}
    >
      <p id={`${id}-label`} className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
        Next step
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}
