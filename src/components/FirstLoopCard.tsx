import { Link } from "react-router-dom";
import { COURSE_TOUR_LINKS } from "../data/beginnerPath";

const FIRST_LESSON_HREF = COURSE_TOUR_LINKS.firstLesson;

/**
 * First-time user landing — replaces the dashboard option soup with a single
 * obvious 10-minute loop. Returning users never see this card.
 */
export default function FirstLoopCard() {
  return (
    <section
      className="rounded-2xl border border-emerald-700/50 bg-gradient-to-br from-emerald-950/45 to-slate-950/40 px-5 py-5 sm:px-6 sm:py-6 shadow-lg shadow-emerald-950/30 space-y-4"
      aria-labelledby="first-loop-h"
    >
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/95">First time? Start here</p>
        <h2 id="first-loop-h" className="text-xl sm:text-2xl font-bold text-white leading-snug">
          Start your first 10-minute study loop
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          This guides you step by step — the green bar on Home always names your next move.
        </p>
      </div>

      <ol className="space-y-2.5 text-sm text-slate-200 leading-relaxed">
        <li className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-900/60 text-emerald-200 text-[11px] font-bold">
            1
          </span>
          <span>Watch a short section of the video.</span>
        </li>
        <li className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-900/60 text-emerald-200 text-[11px] font-bold">
            2
          </span>
          <span>Add your course PDF on Import when you can — lessons will show the matching page next to the video.</span>
        </li>
        <li className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-900/60 text-emerald-200 text-[11px] font-bold">
            3
          </span>
          <span>Pause and write one note in your own words.</span>
        </li>
        <li className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-900/60 text-emerald-200 text-[11px] font-bold">
            4
          </span>
          <span>Answer a few quick questions to lock it in.</span>
        </li>
      </ol>

      <Link
        to={FIRST_LESSON_HREF}
        className="btn w-full text-center text-base font-semibold py-3.5 min-h-[52px] touch-manipulation inline-flex items-center justify-center"
      >
        Start now →
      </Link>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Video + PDF + note + quiz = one study loop. Labs and practice exams are in <strong className="text-slate-400">More study tools</strong> below when you need them.
      </p>
    </section>
  );
}
