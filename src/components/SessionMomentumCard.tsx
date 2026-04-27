import type { ReactNode } from "react";
import { useProgress } from "../context/ProgressContext";
import {
  sessionEndHeadlines,
  buildProgressStory,
  buildMissJournalNarrative,
  buildDomainPulse,
  buildStreakNearMiss,
  buildReadinessNearMiss,
  buildNextSessionHook,
} from "../utils/stickinessCopy";

function emText(s: string, strongClass = "text-slate-100"): ReactNode {
  const parts = s.split(/\*\*/);
  if (parts.length === 1) return s;
  return parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className={strongClass}>{p}</strong> : <span key={i}>{p}</span>));
}

type Props = {
  /** From dashboard “today” detector or quiz session had activity */
  hasTodayActivity: boolean;
  compact?: boolean;
};

/**
 * Session-close / return motivation — emotional pull without arcade gamification.
 */
export default function SessionMomentumCard({ hasTodayActivity, compact = false }: Props) {
  const { state, readiness, nextStep, nextLesson, streak } = useProgress();
  const { primary, secondary } = sessionEndHeadlines(hasTodayActivity);
  const hook = buildNextSessionHook(state, nextStep, nextLesson);
  const story = buildProgressStory(state);
  const missLine = buildMissJournalNarrative(state);
  const domainLine = buildDomainPulse(state);
  const streakNear = buildStreakNearMiss(streak);
  const readyNear = buildReadinessNearMiss(readiness.score, readiness.label);

  return (
    <section
      className="rounded-2xl border border-indigo-900/40 bg-indigo-950/20 px-4 py-4 space-y-3"
      aria-labelledby="session-momentum-h"
    >
      <h2 id="session-momentum-h" className="text-sm font-bold text-indigo-100 uppercase tracking-wide">
        Before you go
      </h2>
      <p className="text-base text-white font-medium leading-snug">{primary}</p>
      <p className="text-sm text-indigo-100/90 leading-relaxed">{secondary}</p>

      {!compact && (
        <ul className="text-sm text-slate-300 space-y-2 list-none border-t border-slate-800/80 pt-3">
          {story.map((line, i) => (
            <li key={i} className="leading-relaxed">
              {emText(line)}
            </li>
          ))}
          {missLine && <li className="text-slate-400 leading-relaxed">{missLine}</li>}
          {domainLine && <li className="text-slate-400 leading-relaxed">{emText(domainLine, "text-slate-200")}</li>}
          {streakNear && <li className="text-amber-100/85 leading-relaxed">{emText(streakNear, "text-amber-50")}</li>}
          {readyNear && <li className="text-cyan-100/85 leading-relaxed">{emText(readyNear, "text-cyan-50")}</li>}
        </ul>
      )}

      <div className="border-t border-slate-800/80 pt-3 space-y-1.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Next session hook</p>
        <p className="text-sm text-white leading-relaxed">{emText(hook.headline, "text-emerald-200")}</p>
        <p className="text-sm text-slate-400 leading-relaxed">{hook.detail}</p>
      </div>
    </section>
  );
}
