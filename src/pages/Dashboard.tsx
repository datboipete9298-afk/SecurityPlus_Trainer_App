import { Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useProgress, getNotesTodayCount } from "../context/ProgressContext";
import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import ContinueButton from "../components/ContinueButton";
import { getResumeLabel, getYouAreHereIndex } from "../utils/sessionResume";

export default function Dashboard() {
  const { state, coachV2, nextStep, nextLesson, readiness, levelInfo, touchStreak, markDailyTrainingDone } = useProgress();

  useEffect(() => {
    touchStreak();
  }, [touchStreak]);

  const dayStr = new Date().toISOString().slice(0, 10);

  const nextLabel = nextLesson && lessons[nextLesson] ? lessons[nextLesson].title : "—";
  const totalSections = ORDERED_LESSON_IDS.length;
  const done = useMemo(
    () => state.completedLessons.filter((id) => ORDERED_LESSON_IDS.includes(id)).length,
    [state.completedLessons]
  );
  const notesToday = useMemo(() => getNotesTodayCount(state.notes), [state.notes]);
  const lessonsDoneToday = useMemo(
    () => Object.values(state.lessonCompletedOn ?? {}).filter((d) => d === dayStr).length,
    [state.lessonCompletedOn, dayStr]
  );
  const r = readiness;
  const pct = Math.min(100, Math.round((done / Math.max(totalSections, 1)) * 100));
  const resume = useMemo(() => getResumeLabel(state), [state]);
  const here = useMemo(() => getYouAreHereIndex(state), [state]);
  const dailyGoalMet = state.dailyMissionDate === dayStr && state.dailyMissionDone;

  return (
    <div className="space-y-6">
      <h1 className="h1">Dashboard</h1>
      <p className="text-slate-400 text-sm max-w-2xl">
        Open the app → press <strong className="text-slate-200">Start today’s session</strong> or <strong className="text-slate-200">Continue</strong> — same
        queue as Smart Coach. You don’t need to remember routes.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card border-cyan-800/40 bg-cyan-950/20">
          <p className="text-xs text-cyan-200/80 uppercase tracking-wide">Start today’s session</p>
          <p className="text-sm text-slate-400 mt-1">Jump to the next best block (video, repair, or review — decided for you).</p>
          <div className="mt-3">
            <ContinueButton step={nextStep} className="btn w-full text-center" />
          </div>
        </div>
        {resume && (
          <div className="card border-violet-800/40 bg-violet-950/20">
            <p className="text-xs text-violet-200/80 uppercase tracking-wide">Resume where you left off</p>
            <p className="text-sm text-slate-300 mt-1">{resume.sub}</p>
            <Link to={resume.href} className="btn w-full mt-3 text-center inline-block">
              {resume.text}
            </Link>
          </div>
        )}
      </div>

      <div className="card border-slate-700 bg-slate-900/40">
        <p className="text-xs text-slate-500 uppercase tracking-wide">You are here</p>
        <p className="text-lg font-semibold text-white mt-1">
          {here.index} / {here.total}
          {here.title && (
            <span className="text-slate-400 font-normal text-base block sm:inline sm:ml-2">· {here.title}</span>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-2">Messer-ordered chain. See the full list on the lesson path.</p>
        <Link to="/roadmap" className="text-emerald-400 text-sm mt-2 inline-block hover:underline">
          Open lesson path
        </Link>
      </div>

      <div className="card border-emerald-800/50 bg-emerald-950/20 ring-1 ring-emerald-800/50">
        <p className="text-xs text-emerald-200/80 uppercase tracking-wide">Next best action</p>
        <p className="text-lg font-semibold mt-1 text-white">{nextStep.nextAction.replace(/\*\*/g, "")}</p>
        <p className="text-sm text-amber-100/80 mt-2">Why this matters: {nextStep.why}</p>
        <div className="mt-4">
          <ContinueButton step={nextStep} className="btn w-full sm:w-auto text-center" />
        </div>
        <p className="text-xs text-slate-500 mt-2">Reference (next in order): {nextLabel}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-slate-500 text-xs uppercase">Course progress</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0" aria-hidden>
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-emerald-500 transition-all"
                  strokeWidth="3"
                  strokeDasharray={`${(pct / 100) * 100.5} 100`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{pct}%</span>
            </div>
            <div>
              <p className="text-sm text-slate-300">
                {done} / {totalSections} lessons in Messer order
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="text-slate-500 text-xs uppercase">Streak / XP / Level</div>
          <p className="text-xl font-bold mt-1">
            🔥 {state.streak} day{state.streak === 1 ? "" : "s"} · {state.xp} XP
          </p>
          <p className="text-sm text-slate-400">
            {levelInfo.name} → next tier at {levelInfo.next} XP
          </p>
        </div>
        <div className="card">
          <div className="text-slate-500 text-xs uppercase">Quick links</div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Link to="/roadmap" className="text-emerald-400 hover:underline">
              Lesson path
            </Link>
            <span className="text-slate-600">·</span>
            <Link to="/practice" className="text-emerald-400 hover:underline">
              Practice
            </Link>
            <span className="text-slate-600">·</span>
            <Link to="/progress" className="text-emerald-400 hover:underline">
              Progress
            </Link>
          </div>
        </div>
      </div>

      <div className="card border-amber-900/30 bg-amber-950/10">
        <h2 className="text-sm font-semibold text-amber-200/90">End of session summary (today)</h2>
        <ul className="mt-2 text-sm text-slate-300 space-y-1 list-disc list-inside">
          <li>Lessons marked complete today: {lessonsDoneToday}</li>
          <li>Brain Book notes today: {notesToday} / 10</li>
          <li>User flashcards: {state.userFlashcards.length}</li>
          <li>Open misses in journal: {state.missedJournal.length}</li>
        </ul>
        <p className="text-xs text-slate-500 mt-3">When you’re done studying, use this box to see what moved today.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {dailyGoalMet ? (
            <span className="text-emerald-400 text-sm font-medium">You said you met today’s training goal. Nice work.</span>
          ) : (
            <button type="button" className="btn-ghost text-sm" onClick={markDailyTrainingDone}>
              I met my training goal for today
            </button>
          )}
        </div>
      </div>

      <div className="card border-emerald-700/50 bg-emerald-950/20">
        <h2 className="text-lg font-bold text-emerald-300">Smart Coach</h2>
        <p className="text-xs text-emerald-200/80 uppercase tracking-wide mt-2">TODAY&apos;S BEST MOVE</p>
        <p className="mt-1 text-white font-medium text-sm leading-relaxed">{coachV2.todaysBestMove.replace(/\*\*/g, "")}</p>
        <p className="text-xs text-emerald-200/80 uppercase tracking-wide mt-3">WHY</p>
        <p className="text-slate-300 text-sm mt-1">{coachV2.why}</p>
        <p className="text-xs text-emerald-200/80 uppercase tracking-wide mt-3">DO THIS NEXT (MAX 3)</p>
        <ol className="mt-2 list-decimal list-inside text-slate-200 text-sm space-y-1">
          <li>{coachV2.doThisNext[0]?.replace(/\*\*/g, "")}</li>
          <li>{coachV2.doThisNext[1]?.replace(/\*\*/g, "")}</li>
          <li>{coachV2.doThisNext[2]?.replace(/\*\*/g, "")}</li>
        </ol>
        <div className="mt-4">
          <ContinueButton step={nextStep} className="btn" />
        </div>
        <p className="text-xs text-slate-500 mt-3 border-t border-slate-800 pt-2">
          Notes today: {notesToday} / 10 · User flashcards: {state.userFlashcards.length} · Missed in journal: {state.missedJournal.length}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-white">Exam readiness</h2>
          <div className="mt-2 h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all"
              style={{ width: `${r.score}%` }}
            />
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{r.score}</p>
          <p className="text-slate-400 capitalize">{r.label.replace("_", " ")}</p>
        </div>
        <div className="card">
          <h2 className="font-semibold text-white">Weak signals</h2>
          <ul className="mt-2 text-sm text-slate-300 space-y-1">
            {Object.entries(state.domainScore)
              .filter(([, v]) => v < 55)
              .map(([d, v]) => (
                <li key={d}>
                  Domain {d}: {v} / 100
                </li>
              ))}
            {Object.values(state.domainScore).every((v) => v >= 55) && <li>Looking balanced — add harder quizzes as you add content.</li>}
          </ul>
          <Link to="/weak" className="btn mt-3 w-full text-center">
            Fix my weak areas
          </Link>
        </div>
      </div>
    </div>
  );
}
