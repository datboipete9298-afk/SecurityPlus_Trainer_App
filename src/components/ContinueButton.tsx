import { Link } from "react-router-dom";
import type { NextStep } from "../core/nextStepEngine";

const DEFAULT_COACH_HINT = "This is your next step to improve.";

export default function ContinueButton({
  step,
  className = "btn",
  coachHint = DEFAULT_COACH_HINT,
}: {
  step: NextStep;
  className?: string;
  /** Set to empty string to hide the hint line */
  coachHint?: string;
}) {
  return (
    <div className="inline-flex flex-col gap-1 w-full sm:w-auto items-stretch sm:items-end">
      {coachHint ? <p className="text-[11px] text-slate-500 text-right order-2 sm:order-1">{coachHint}</p> : null}
      <Link
        to={step.href}
        className={`${className} order-1 sm:order-2 text-center inline-flex text-base font-semibold px-6 py-3 min-h-[48px] w-full sm:w-auto sm:min-w-[200px] touch-manipulation justify-center`}
      >
        {step.buttonLabel} →
      </Link>
    </div>
  );
}
