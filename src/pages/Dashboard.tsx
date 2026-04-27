import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useProgress, getNotesTodayCount } from "../context/ProgressContext";
import { buildLearningProfile } from "../core/learningObserver";
import { COURSE_TOUR_LINKS } from "../data/beginnerPath";
import { ORDERED_LESSON_IDS } from "../data/lessons";
import ContinueButton from "../components/ContinueButton";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import AITutorPanel from "../components/AITutorPanel";
import DailyMinimumCard from "../components/DailyMinimumCard";
import ProgressSafetyCard from "../components/ProgressSafetyCard";
import RetentionStreakCard from "../components/RetentionStreakCard";
import MicroConfidenceLine from "../components/MicroConfidenceLine";
import IdentityReinforcementLine from "../components/IdentityReinforcementLine";
import SessionMomentumCard from "../components/SessionMomentumCard";
import { getResumeLabel, getYouAreHereIndex } from "../utils/sessionResume";
import { readinessTrack } from "../utils/readinessBand";
import { PBQ_SCENARIOS } from "../data/pbqCatalog";
import { readAndClearFlashExtensionIdentity } from "../utils/outsideQuizIdentity";
import { examDomainShortTitle } from "../utils/identityPersonalization";
import OnboardingHintBanner from "../components/OnboardingHintBanner";
import ResumeWhereCard from "../components/ResumeWhereCard";
import PracticeExamDraftResume from "../components/PracticeExamDraftResume";
import SectionCard from "../components/SectionCard";

export default function Dashboard() {
  const {
    state,
    coachV2,
    nextStep,
    nextLesson,
    readiness,
    levelInfo,
    touchStreak,
    markDailyTrainingDone,
    acknowledgeStreakMilestone,
    markStartHereSeen,
  } = useProgress();
  const track = useMemo(() => readinessTrack(readiness.score, readiness.label), [readiness.score, readiness.label]);

  useEffect(() => {
    touchStreak();
  }, [touchStreak]);

  const [extensionFlashLine, setExtensionFlashLine] = useState<string | null>(null);
  useEffect(() => {
    const line = readAndClearFlashExtensionIdentity();
    if (line) setExtensionFlashLine(line);
  }, []);

  const dayStr = new Date().toISOString().slice(0, 10);

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
  const aiProfile = useMemo(() => buildLearningProfile(state), [state]);
  const weakAreasDashboard = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `${examDomainShortTitle(d)} · Domain ${d} (${state.domainScore[d]})`),
    [state.domainScore],
  );

  const quizAttempts = useMemo(
    () => Object.values(state.questionStats).reduce((a, st) => a + st.c + st.w, 0),
    [state.questionStats],
  );
  const showFirstSessionsPath = done < 4 || (r.score < 48 && quizAttempts < 24);
  const firstLessonId = COURSE_TOUR_LINKS.firstLesson.replace(/^\/lesson\//, "");
  const masteryLessons = state.trainingMasteryLessonIds?.length ?? 0;
  const pbqPassed = state.pbqPassedIds?.length ?? 0;
  const pbqTotal = PBQ_SCENARIOS.length;
  const hasSmallWinToday = lessonsDoneToday > 0 || notesToday > 0;

  const touchToday = state.todayActivity?.date === dayStr ? state.todayActivity : null;
  const lessonsTouched = touchToday?.lessonIds.length ?? 0;
  const quizToday = touchToday?.quizQuestionsAnswered ?? 0;
  const flashToday = touchToday?.flashcardsReviewed ?? 0;
  const pbqToday = touchToday?.pbqAttempts ?? 0;
  const hasTodayActivity =
    lessonsTouched > 0 || quizToday > 0 || flashToday > 0 || pbqToday > 0 || notesToday > 0 || lessonsDoneToday > 0;
  const dailyMinimumMet =
    (state.dailyMissionDate === dayStr && state.dailyMissionDone) ||
    (lessonsTouched >= 1 && notesToday >= 1 && quizToday >= 2);
  const oneStepAwayCopy = !dailyMinimumMet
    ? lessonsTouched < 1
      ? "You're one step away from today's minimum: open any lesson for a few minutes."
      : notesToday < 1
        ? "You're one step away: add one Brain Book row."
        : quizToday < 2
          ? "You're one step away: answer one or two more quiz questions (quick quiz counts)."
          : null
    : null;

  return (
    <AppShell>
      <div className="lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="space-y-8 min-w-0">
          <PageHeader
            title="Dashboard"
            purpose={
              <>
                Open the app → press <strong className="text-slate-200">Start today’s session</strong> or{" "}
                <strong className="text-slate-200">Continue</strong> — same queue as Smart Coach. You don’t need to remember routes.
              </>
            }
          />

          {!state.onboarding.hasSeenStartHere && <OnboardingHintBanner onDismiss={() => markStartHereSeen()} />}

          <PracticeExamDraftResume />
          <ResumeWhereCard state={state} />

          {!(done >= 4 && hasTodayActivity) && (
            <SectionCard title="Quick first win (under 2 minutes)" subtitle="One question from your first section — then explore the full lesson when you’re ready.">
              <Link
                to={`/quiz/${firstLessonId}?quick=1`}
                className="btn w-full text-center min-h-[48px] touch-manipulation"
              >
                Answer 1 practice question →
              </Link>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Tiny quiz only — your full path and Smart Coach stay on this dashboard.
              </p>
            </SectionCard>
          )}

          <DailyMinimumCard lessonId={nextLesson ?? undefined} />

          <ProgressSafetyCard />

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/35 px-4 py-4 space-y-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Today you&apos;ve done</h2>
            {!hasTodayActivity ? (
              <p className="text-sm text-slate-500 leading-relaxed">
                Nothing logged yet today — open a lesson, a quiz, flashcards, or a PBQ lab. Even one small block counts.
              </p>
            ) : (
              <ul className="text-sm text-slate-300 space-y-1.5 list-none">
                <li>
                  <span className="text-emerald-400/90">·</span>{" "}
                  {lessonsTouched === 0
                    ? "No lesson progress yet today"
                    : `${lessonsTouched} lesson${lessonsTouched === 1 ? "" : "s"} touched`}
                </li>
                <li>
                  <span className="text-emerald-400/90">·</span> {quizToday} quiz question{quizToday === 1 ? "" : "s"} answered
                </li>
                <li>
                  <span className="text-emerald-400/90">·</span> {flashToday} flashcard{flashToday === 1 ? "" : "s"} reviewed
                </li>
                <li>
                  <span className="text-emerald-400/90">·</span> {pbqToday} PBQ attempt{pbqToday === 1 ? "" : "s"}
                </li>
                {notesToday > 0 && (
                  <li>
                    <span className="text-emerald-400/90">·</span> {notesToday} Brain Book note{notesToday === 1 ? "" : "s"} today
                  </li>
                )}
              </ul>
            )}
            {dailyMinimumMet ? (
              <p className="text-sm text-emerald-200/90 leading-relaxed border-t border-slate-800 pt-3">
                You&apos;ve done enough for today — anything extra is a bonus.
              </p>
            ) : (
              oneStepAwayCopy && (
                <p className="text-sm text-amber-100/85 leading-relaxed border-t border-slate-800 pt-3">{oneStepAwayCopy}</p>
              )
            )}
            <MicroConfidenceLine streak={state.streak} dayIso={dayStr} hasActivityToday={hasTodayActivity} />
            {extensionFlashLine ? (
              <p className="text-xs text-slate-500 italic leading-relaxed border-l-2 border-slate-700 pl-3 mt-2">
                {extensionFlashLine}
              </p>
            ) : (
              <IdentityReinforcementLine state={state} dayIso={dayStr} hasActivityToday={hasTodayActivity} />
            )}
          </div>

          <SessionMomentumCard hasTodayActivity={hasTodayActivity} />

      {showFirstSessionsPath && (
        <div className="card border-sky-700/45 bg-sky-950/30 ring-1 ring-sky-500/25">
          <p className="text-xs text-sky-200/90 uppercase tracking-wide">Start here → First lesson → Quiz → Review</p>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            New or early in the course? Follow this loop once or twice. The green <strong className="text-white">Continue</strong> and{" "}
            <strong className="text-white">Next best action</strong> cards below always mirror Smart Coach — you cannot “fall off” the path.
          </p>
          <ol className="mt-3 text-sm text-slate-200 space-y-2.5 list-decimal list-inside marker:text-sky-300">
            <li className="pl-1">
              <Link to={COURSE_TOUR_LINKS.startHere} className="text-emerald-400 hover:underline font-medium">
                Start here
              </Link>
              <span className="text-slate-400"> — what this app is and how Messer fits in</span>
            </li>
            <li className="pl-1">
              <Link to={COURSE_TOUR_LINKS.firstLesson} className="text-emerald-400 hover:underline font-medium">
                First lesson
              </Link>
              <span className="text-slate-400"> — watch → must highlights → Brain Book (short notes)</span>
            </li>
            <li className="pl-1">
              <Link to={`/quiz/${firstLessonId}`} className="text-emerald-400 hover:underline font-medium">
                Lesson quiz
              </Link>
              <span className="text-slate-400"> — same section; read every wrong-answer explanation</span>
            </li>
            <li className="pl-1">
              <Link to="/weak" className="text-emerald-400 hover:underline font-medium">
                Review
              </Link>
              <span className="text-slate-400"> or </span>
              <Link to="/flashcards" className="text-emerald-400 hover:underline font-medium">
                flashcards
              </Link>
              <span className="text-slate-400"> — turn misses into recall</span>
            </li>
          </ol>
        </div>
      )}

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

      {(aiProfile.thinkingAlerts[0] || aiProfile.noteQualityScore < 45) && (
        <div className="card border-violet-800/40 bg-violet-950/20">
          <p className="text-xs text-violet-200/90 uppercase tracking-wide">AI learning observer</p>
          {aiProfile.thinkingAlerts[0] && (
            <p className="text-sm text-amber-100/90 mt-2">{aiProfile.thinkingAlerts[0].replace(/\*\*/g, "")}</p>
          )}
          <p className="text-xs text-slate-400 mt-2 hidden sm:block">
            Recall strength: <span className="text-slate-200">{aiProfile.recallStrength}</span>/100 · Note quality:{" "}
            <span className="text-slate-200">{aiProfile.noteQualityScore}</span>/100 · Readiness model:{" "}
            <span className="text-slate-200">{aiProfile.examReadiness}</span>/100
          </p>
          {aiProfile.noteQualityScore < 45 && !aiProfile.thinkingAlerts[0] && (
            <p className="text-xs text-slate-400 mt-1">Brain Book rows look thin across completed lessons — add hooks, not paragraphs.</p>
          )}
        </div>
      )}

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
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Hands-on mastery: <span className="text-slate-300">{masteryLessons}</span> lesson{masteryLessons === 1 ? "" : "s"} · PBQ labs passed
                once: <span className="text-slate-300">{pbqPassed}</span>/{pbqTotal}
              </p>
            </div>
          </div>
        </div>
        <RetentionStreakCard
          state={state}
          todayIso={dayStr}
          levelInfo={levelInfo}
          onAcknowledgeMilestone={acknowledgeStreakMilestone}
        />
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
        {hasSmallWinToday && (
          <p className="text-xs text-slate-500 mt-3 leading-relaxed border-t border-slate-800 pt-2">
            Small wins add up: you moved notes or lessons today — that&apos;s the same rhythm serious candidates keep.
          </p>
        )}
      </div>

      <div className="card border-emerald-700/50 bg-emerald-950/20">
        <h2 className="text-lg font-bold text-emerald-300">Smart Coach</h2>
        <p className="text-xs text-emerald-200/80 uppercase tracking-wide mt-2">TODAY&apos;S BEST MOVE</p>
        <p className="mt-1 text-white font-medium text-sm leading-relaxed">{coachV2.todaysBestMove.replace(/\*\*/g, "")}</p>
        <p className="text-xs text-emerald-200/80 uppercase tracking-wide mt-3">WHY</p>
        <p className="text-slate-300 text-sm mt-1">{coachV2.why}</p>
        <p className="text-xs text-emerald-200/80 uppercase tracking-wide mt-3">Do this next (primary + up to 2 more)</p>
        <ol className="mt-2 list-decimal list-inside text-slate-200 text-sm space-y-1 [&>li:nth-child(n+4)]:hidden [&>li:nth-child(n+3)]:max-md:hidden">
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
          <p className="text-xs text-emerald-300/90 font-medium mt-2 uppercase tracking-wide">You&apos;re on track</p>
          <p className="text-lg font-semibold text-white mt-1">{track.headline}</p>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">{track.sub}</p>
          <p className="text-xs text-amber-200/90 mt-3 leading-relaxed">
            <strong className="text-amber-100/95">Not a pass guarantee:</strong> the percentage below is only from your activity in this trainer. CompTIA
            scores your real exam independently.
          </p>
          <div className="mt-2 h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all"
              style={{ width: `${r.score}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Model score: <span className="text-slate-300 font-mono">{r.score}</span> ·{" "}
            <span className="capitalize">{r.label.replace("_", " ")}</span>
          </p>
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
        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "dashboard",
            weakAreas: weakAreasDashboard,
            userProgress: {
              streak: state.streak,
              xp: state.xp,
              lessonsDone: done,
              readiness: r.score,
            },
            coachLines: [coachV2.todaysBestMove, aiProfile.thinkingAlerts[0]].filter(Boolean) as string[],
          }}
        />
      </div>
    </AppShell>
  );
}
