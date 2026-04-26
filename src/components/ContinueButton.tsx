import { Link } from "react-router-dom";
import type { NextStep } from "../core/nextStepEngine";

export default function ContinueButton({ step, className = "btn" }: { step: NextStep; className?: string }) {
  return (
    <Link
      to={step.href}
      className={`${className} text-center inline-flex text-base font-semibold px-6 py-3 min-h-[48px] w-full sm:w-auto sm:min-w-[200px] touch-manipulation justify-center`}
    >
      {step.buttonLabel} →
    </Link>
  );
}
