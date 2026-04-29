import { Link } from "react-router-dom";
import { useMemo } from "react";
import type { PersistedState } from "../utils/storage";
import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import { buildResumeLinkList, formatResumeTimestamp, resumeKindIcon } from "../utils/studyResume";

export default function ResumeWhereCard({ state }: { state: PersistedState }) {
  const items = useMemo(() => buildResumeLinkList(state.studyResume, lessons), [state.studyResume]);
  const firstLessonId = ORDERED_LESSON_IDS[0] ?? "1-1";

  return (
    <section
      className="rounded-2xl border border-cyan-800/45 bg-cyan-950/20 px-4 py-4 space-y-3"
      aria-labelledby="resume-where-h"
    >
      <h2 id="resume-where-h" className="text-sm font-bold text-cyan-100 uppercase tracking-wide">
        Resume where you left off
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 leading-relaxed">
          No saved activity yet — start your first lesson and the app will remember your last spot automatically.
        </p>
      ) : (
        <p className="text-xs text-slate-400 leading-relaxed">Newest first — study rows stay above roadmap, search, and tools.</p>
      )}
      {items.length > 0 && (
        <ul className="space-y-1.5 list-none">
          {items.slice(0, 4).map((it) => (
            <li key={`${it.kind}-${it.at}-${it.to}`}>
              <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 px-3 py-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex gap-2 items-start">
                  <span className="text-cyan-300/90 shrink-0 w-6 text-center select-none" aria-hidden>
                    {resumeKindIcon(it.kind)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{it.typeLabel}</p>
                    <p className="text-sm text-slate-100 leading-snug break-words">{it.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{formatResumeTimestamp(it.at)}</p>
                  </div>
                </div>
                <Link
                  to={it.to}
                  className="btn text-sm shrink-0 w-full sm:w-auto text-center min-h-[44px] touch-manipulation py-2.5"
                  aria-label={`Open: ${it.label}`}
                >
                  Jump back in →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && (
        <Link
          to={`/lesson/${firstLessonId}`}
          className="btn w-full text-center min-h-[44px] touch-manipulation inline-block"
        >
          Start your first lesson →
        </Link>
      )}
    </section>
  );
}
