import type { PersistedState } from "../utils/storage";
import { pendingStreakMilestone, nextStreakMilestone, milestoneMessage, type StreakMilestone } from "../utils/streakMilestones";

type LevelInfo = { level: number; name: string; next: number };

type Props = {
  state: PersistedState;
  todayIso: string;
  levelInfo: LevelInfo;
  onAcknowledgeMilestone: (m: StreakMilestone) => void;
};

export default function RetentionStreakCard({ state, todayIso, levelInfo, onAcknowledgeMilestone }: Props) {
  const streak = state.streak;
  const ack = state.lastAcknowledgedStreakMilestone ?? 0;
  const pending = pendingStreakMilestone(streak, ack);
  const next = nextStreakMilestone(streak);
  const checkedInToday = state.lastActiveDay === todayIso;
  const progressPct = next ? Math.min(100, Math.round((streak / next) * 100)) : 100;

  return (
    <div className="card border-amber-900/35 bg-amber-950/15">
      <p className="text-slate-500 text-xs uppercase tracking-wide">Streak · momentum</p>
      <p className="text-xl font-bold mt-1 text-white">
        {streak > 0 ? `🔥 ${streak} day${streak === 1 ? "" : "s"}` : "Streak starts today"} · {state.xp} XP
      </p>
      <p className="text-sm text-slate-400 mt-1">
        {levelInfo.name} → next tier at {levelInfo.next} XP
      </p>
      {streak === 0 && (
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Do any lesson, quiz, or flashcard today — your streak begins automatically when you come back tomorrow.
        </p>
      )}

      {pending && (
        <div className="mt-3 rounded-xl border border-amber-500/35 bg-amber-950/40 px-3 py-3 space-y-2">
          <p className="text-sm font-semibold text-amber-100">{pending}-day milestone</p>
          <p className="text-sm text-amber-100/85 leading-relaxed">{milestoneMessage(pending)}</p>
          <button
            type="button"
            className="btn text-sm w-full sm:w-auto touch-manipulation min-h-[44px]"
            onClick={() => onAcknowledgeMilestone(pending)}
          >
            Nice — keep going
          </button>
        </div>
      )}

      {!pending && streak > 0 && next && (
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Next quiet milestone</span>
            <span>
              {streak} / {next} days
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden" aria-hidden>
            <div className="h-full bg-amber-500/80 transition-all rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-[11px] text-slate-500">Small daily sessions count — no need for marathon days.</p>
        </div>
      )}

      {checkedInToday && streak >= 1 && (
        <p className="text-xs text-slate-500 mt-3 leading-relaxed border-t border-slate-800/80 pt-2">
          You&apos;ve checked in today. <strong className="text-slate-400">Come back tomorrow</strong> — even the{" "}
          <strong className="text-slate-300">daily minimum</strong> keeps your streak and your memory warm.
        </p>
      )}
    </div>
  );
}
