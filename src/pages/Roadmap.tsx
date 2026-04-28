import { Link } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { SECTION_ORDER } from "../data/sectionOrder";
import { lessons } from "../data/lessons";
import { useProgress } from "../context/ProgressContext";
import { isLessonUnlocked } from "../utils/adaptive";
import { nextLessonId } from "../utils/lessonOrder";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import AITutorPanel from "../components/AITutorPanel";

export default function Roadmap() {
  const { state, bumpStudyResume } = useProgress();
  useEffect(() => {
    bumpStudyResume({ roadmap: true });
  }, [bumpStudyResume]);
  const currentId = nextLessonId(state);
  const weakAreasRoadmap = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d}`),
    [state.domainScore],
  );
  return (
    <AppShell>
      <div className="lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="min-w-0">
          <PageHeader
            title="Course roadmap (Messer order)"
            purpose="Follow top to bottom. Each row unlocks when the previous item is marked complete. The green Continue on Home always matches the first incomplete lesson in this list."
          />
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
                {L?.hasFullContent && (
                  <span className="mt-1 sm:mt-0 sm:ml-2 block sm:inline text-xs rounded px-2 py-0.5 bg-emerald-900/50 text-emerald-300">
                    Ready
                  </span>
                )}
                {L && !L.hasFullContent && (
                  <span className="mt-1 sm:mt-0 sm:ml-2 block sm:inline text-xs rounded px-2 py-0.5 bg-slate-800 text-slate-400">
                    Coming soon
                  </span>
                )}
                {youHere && (
                  <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2 text-xs text-emerald-300 font-semibold">· you are here</span>
                )}
                {!L && <span className="block sm:inline mt-1 text-xs text-slate-500">Coming soon</span>}
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
        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "dashboard",
            weakAreas: weakAreasRoadmap,
            userProgress: { currentLessonId: currentId, completed: state.completedLessons.length },
            coachLines: currentId && lessons[currentId] ? [`Next in path: ${lessons[currentId]!.title}`] : undefined,
          }}
        />
      </div>
    </AppShell>
  );
}
