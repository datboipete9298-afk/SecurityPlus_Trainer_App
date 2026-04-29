import { Link, useLocation } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";

/** Fixed bottom CTA on small screens — thumb-friendly, full width. */
export default function MobileStickyContinue() {
  const { nextStep } = useProgress();
  const loc = useLocation();
  if (loc.pathname === "/import") return null;
  /** Lesson quizzes have their own primary actions — avoid competing sticky CTAs. */
  if (loc.pathname.startsWith("/quiz/")) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.4)]"
      role="navigation"
      aria-label="Go to your next study step"
    >
      <p className="text-[10px] text-center text-emerald-200/80 mb-1 px-1 leading-tight">Same as Home — your queued next move.</p>
      <Link
        to={nextStep.href}
        className="btn w-full min-h-[52px] text-base font-semibold touch-manipulation active:scale-[0.99] transition-transform"
      >
        Do this next: {nextStep.buttonLabel} →
      </Link>
      <p className="text-[10px] text-center text-slate-500 mt-1.5 px-1 leading-tight">Progress stays on this device — same queue as Home.</p>
    </div>
  );
}
