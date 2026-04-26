import { Link } from "react-router-dom";
import { SECTION_ORDER } from "../data/sectionOrder";
import { lessons } from "../data/lessons";
import { useProgress } from "../context/ProgressContext";
import { isLessonUnlocked } from "../utils/adaptive";
import { nextLessonId } from "../utils/lessonOrder";

export default function Roadmap() {
  const { state } = useProgress();
  const currentId = nextLessonId(state);
  return (
    <div>
      <h1 className="h1">Course roadmap (Messer order)</h1>
      <p className="text-slate-400 text-sm sm:text-base mt-1 mb-6 max-w-2xl leading-relaxed">
        Follow top to bottom. Each row unlocks when the <strong className="text-slate-200">previous</strong> item in this Messer-ordered list is marked complete. Your &quot;Next action&quot; on the dashboard is always the first incomplete lesson.
      </p>
      <ol className="space-y-3">
        {SECTION_ORDER.map((s, i) => {
          const L = lessons[s.id];
          const unlocked = isLessonUnlocked(s.id, state);
          const done = state.completedLessons.includes(s.id);
          const youHere = s.id === currentId && !done;
          return (
            <li
              key={s.id}
              className={`card flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 ${
                !unlocked ? "opacity-50" : ""
              } ${youHere ? "ring-2 ring-emerald-600/50 bg-emerald-950/15" : ""}`}
            >
              <div className="min-w-0 text-[15px] sm:text-sm leading-snug">
                <span className="text-slate-500 text-xs w-7 inline-block align-top">{i + 1}.</span>
                <span className="text-slate-200 font-medium">{s.label}</span>
                {L && (
                  <span
                    className={`mt-1 sm:mt-0 sm:ml-2 block sm:inline text-xs rounded px-2 py-0.5 ${
                      L.hasFullContent ? "bg-emerald-900/50 text-emerald-300" : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {L.hasFullContent ? "content ready" : "scaffold — add data"}
                  </span>
                )}
                {youHere && (
                  <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2 text-xs text-emerald-300 font-semibold">· you are here</span>
                )}
                {!L && <span className="block sm:inline mt-1 text-xs text-amber-400/80">import JSON to enable rich lesson</span>}
              </div>
              <div className="flex flex-wrap gap-2 items-center sm:shrink-0">
                {done && <span className="text-xs text-emerald-400">done</span>}
                {unlocked ? (
                  <Link to={`/lesson/${s.id}`} className="btn text-sm w-full sm:w-auto">
                    Open lesson
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500 py-2">locked</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
