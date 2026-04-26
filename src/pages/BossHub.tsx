import { Link } from "react-router-dom";
import { BOSS_FIGHTS } from "../data/bossFights";
import { useProgress } from "../context/ProgressContext";

export default function BossHub() {
  const { state } = useProgress();
  return (
    <div className="space-y-6">
      <h1 className="h1">Boss fights</h1>
      <p className="text-slate-400 text-sm max-w-2xl">
        Scenario chains (5–10 decisions), instant feedback, XP on pass. Fail = domain nudge + journal entry — use as a capstone after the related lessons.
      </p>
      <ul className="space-y-3">
        {BOSS_FIGHTS.map((b) => {
          const won = state.bossWins[b.id];
          return (
            <li key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-white">{b.name}</div>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">{b.scenario.slice(0, 160)}…</p>
                <p className="text-xs text-amber-400/90 mt-1">+{b.xpReward} XP · {b.questions.length} questions</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {won && <span className="text-xs text-emerald-400">cleared</span>}
                <Link to={`/boss/${b.id}`} className="btn text-sm">
                  {won ? "Replay" : "Fight"}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
