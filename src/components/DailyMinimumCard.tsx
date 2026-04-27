import { Link } from "react-router-dom";
import { COURSE_TOUR_LINKS } from "../data/beginnerPath";

type Props = {
  /** Link mini-quiz from a lesson id */
  lessonId?: string;
  className?: string;
};

/** Low-pressure daily target — same card can sit on dashboard, lesson, practice. */
export default function DailyMinimumCard({ lessonId, className = "" }: Props) {
  const defaultLessonId = COURSE_TOUR_LINKS.firstLesson.replace(/^\/lesson\//, "");
  const quizTo = `/quiz/${lessonId ?? defaultLessonId}?quick=3`;

  return (
    <section
      className={`rounded-2xl border border-sky-700/40 bg-sky-950/25 px-4 py-5 space-y-3 ${className}`}
      aria-labelledby="daily-min-hdg"
    >
      <h2 id="daily-min-hdg" className="text-sm font-bold text-sky-100 uppercase tracking-wide">
        Today’s minimum (5–10 min)
      </h2>
      <p className="text-sm text-slate-300 leading-relaxed">
        You can make progress without a long study block. Pick this when you’re tired or busy — it still counts.
      </p>
      <ul className="text-sm text-slate-200 space-y-2 list-none">
        <li className="flex gap-2">
          <span className="text-sky-400 shrink-0">1.</span>
          <span>
            Watch <strong className="text-white">2–3 minutes</strong> of the lesson video (pause is fine).
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-sky-400 shrink-0">2.</span>
          <span>
            Write <strong className="text-white">one</strong> Brain Book row (topic + what it means + one keyword).
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-sky-400 shrink-0">3.</span>
          <span>
            Answer <strong className="text-white">2–3 quick quiz</strong> questions — learn from every miss.
          </span>
        </li>
      </ul>
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Link to={lessonId ? `/lesson/${lessonId}` : COURSE_TOUR_LINKS.firstLesson} className="btn w-full sm:w-auto text-center text-sm min-h-[44px] touch-manipulation">
          Open lesson
        </Link>
        <Link to={quizTo} className="btn-ghost w-full sm:w-auto text-center text-sm min-h-[44px] touch-manipulation border border-sky-800/50">
          Quick quiz (3 Q)
        </Link>
      </div>
    </section>
  );
}
