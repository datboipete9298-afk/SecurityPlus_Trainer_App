import { Link } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { BOSS_FIGHTS } from "../data/bossFights";
import { useProgress } from "../context/ProgressContext";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import StatusBadge from "../components/StatusBadge";

export default function BossHub() {
  const { state, nextStep, bumpStudyResume } = useProgress();
  const cleared = useMemo(() => BOSS_FIGHTS.filter((b) => state.bossWins[b.id]).length, [state.bossWins]);

  useEffect(() => {
    bumpStudyResume({ bossHub: true });
  }, [bumpStudyResume]);

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="Boss fights"
          purpose="Milestone challenges: longer scenario chains with instant feedback. Pass for XP; fail nudges weak domains — retry after reviewing the related lessons."
          badge={
            <StatusBadge tone="ok">
              {cleared}/{BOSS_FIGHTS.length} cleared
            </StatusBadge>
          }
        />

        <SectionCard title="How bosses work" subtitle="Capstone difficulty">
          <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
            <li>Each boss ties to lessons and a domain — complete those sections first for a fair fight.</li>
            <li>Pass threshold is 70% — confidence and teach-back patterns match the normal quiz flow.</li>
            <li>Replay anytime; XP is granted on passes per app rules.</li>
          </ul>
        </SectionCard>

        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Challenges</h2>
          <ul className="space-y-3">
            {BOSS_FIGHTS.map((b) => {
              const won = state.bossWins[b.id];
              return (
                <li key={b.id} className="card flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{b.name}</div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl line-clamp-2">{b.scenario}</p>
                    <p className="text-xs text-amber-400/90 mt-2">+{b.xpReward} XP · {b.questions.length} questions · Domain {b.domain}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-stretch sm:items-end w-full sm:w-auto">
                    {won && <span className="text-xs text-emerald-400 text-center sm:text-right">Cleared</span>}
                    <Link to={`/boss/${b.id}`} className="btn text-sm w-full sm:w-auto text-center">
                      {won ? "Replay" : "Start boss"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <NextActionCard label="Next step" description="Pick a boss you are prepared for, or follow Smart Coach.">
          <Link to={nextStep.href} className="btn w-full text-center">
            {nextStep.buttonLabel} →
          </Link>
        </NextActionCard>
      </div>
    </AppShell>
  );
}
