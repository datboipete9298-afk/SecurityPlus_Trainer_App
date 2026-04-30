import { Link } from "react-router-dom";
import type { LessonOrderNudge } from "../utils/adaptive";

export default function OrderPathNudge({ nudge }: { nudge: LessonOrderNudge | null }) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 px-4 py-3 text-sm text-slate-200 space-y-3">
      <p className="text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-200">You can study any lesson now.</strong> The app still shows the recommended Messer order on Home and the lesson path.
      </p>
      {nudge ?
        <div
          className="rounded-lg border border-amber-700/45 bg-amber-950/25 px-3 py-3 text-sm text-amber-50/95 space-y-3"
          role="status"
        >
          <p>
            <strong className="text-amber-100">Suggested path:</strong> this usually comes after{" "}
            <strong className="text-white">{nudge.prevTitle}</strong>, but you can study it now.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="#lesson-study-focus"
              className="btn text-xs min-h-[44px] inline-flex items-center justify-center px-3 scroll-mt-28"
            >
              Study this lesson now
            </a>
            <Link
              to={`/lesson/${nudge.prevId}`}
              className="btn-ghost text-xs border border-amber-700/55 min-h-[44px] inline-flex items-center justify-center px-3"
            >
              Go to suggested previous lesson
            </Link>
          </div>
        </div>
      : null}
    </div>
  );
}
