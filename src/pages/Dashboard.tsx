import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useProgress, getNotesTodayCount } from "../context/ProgressContext";
import { buildLearningProfile } from "../core/learningObserver";
import { COURSE_TOUR_LINKS } from "../data/beginnerPath";
import { ORDERED_LESSON_IDS } from "../data/lessons";
import ContinueButton from "../components/ContinueButton";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import AITutorPanel from "../components/AITutorPanel";
import DailyMinimumCard from "../components/DailyMinimumCard";
import ProgressSafetyCard from "../components/ProgressSafetyCard";
import RetentionStreakCard from "../components/RetentionStreakCard";
import MicroConfidenceLine from "../components/MicroConfidenceLine";
import IdentityReinforcementLine from "../components/IdentityReinforcementLine";
import SessionMomentumCard from "../components/SessionMomentumCard";
import { getYouAreHereIndex, getDashboardResumeCue } from "../utils/sessionResume";
import { readinessTrack, weakestDomainHintFromScores } from "../utils/readinessBand";
import { PBQ_SCENARIOS } from "../data/pbqCatalog";
import { readAndClearFlashExtensionIdentity } from "../utils/outsideQuizIdentity";
import { examDomainShortTitle } from "../utils/identityPersonalization";
import OnboardingHintBanner from "../components/OnboardingHintBanner";
import ResumeWhereCard from "../components/ResumeWhereCard";
import PracticeExamDraftResume from "../components/PracticeExamDraftResume";
import SectionCard from "../components/SectionCard";
import TrustReminderStrip from "../components/TrustReminderStrip";
import FirstLoopCard from "../components/FirstLoopCard";
import CoachLine from "../components/CoachLine";

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

  const weakestDomainHint = useMemo(() => weakestDomainHintFromScores(state.domainScore), [state.domainScore]);
  const resumeCue = useMemo(() => getDashboardResumeCue(state), [state]);

  const track = useMemo(
    () => readinessTrack(readiness.score, readiness.label, { weakestDomainHint }),
    [readiness.score, readiness.label, weakestDomainHint],
  );

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
  /** True for brand-new users — no completions, no quiz attempts, no notes — show the simple 10-minute loop hero only. */
  const isFreshUser = done === 0 && quizAttempts === 0 && state.notes.length === 0;
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
      ? "Open any lesson for a few minutes."
      : notesToday < 1
        ? "Add one short note in Brain Book."
        : quizToday < 2
          ? "Answer one or two more quiz questions."
          : null
    : null;

  return (
    <AppShell>
      <div className="lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <PageHeader
            title="Home"
            purpose={
              isFreshUser
                ? "Welcome. Local-first study app for Security+ — your progress saves on this device."
                : "Use Do this next on Home — it picks the smartest move. Readiness reflects your practice here, not a real CompTIA score."
            }
          />

          {extensionFlashLine && (
            <div
              className="rounded-xl border border-emerald-800/45 bg-emerald-950/25 px-4 py-3"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm text-emerald-100/95 leading-relaxed">{extensionFlashLine}</p>
            </div>
          )}

          <PracticeExamDraftResume />

          {isFreshUser ? (
            <>
              <FirstLoopCard />
              {!state.onboarding.hasSeenStartHere && <OnboardingHintBanner onDismiss={() => markStartHereSeen()} />}
            </>
          ) : (
            <>
              {!state.onboarding.hasSeenStartHere && <OnboardingHintBanner onDismiss={() => markStartHereSeen()} />}
              <FlowPrimaryStrip>
                <ContinueButton step={nextStep} className="btn w-full text-center text-lg py-4 min-h-[52px]" coachHint="" />
              </FlowPrimaryStrip>
              <p className="text-[11px] text-slate-500 text-center leading-snug">
                The green box above always says what happens when you tap.
              </p>
              <div className="rounded-xl border border-slate-700/85 bg-slate-900/40 px-4 py-3 text-center">
                {resumeCue ? (
                  <>
                    <Link
                      to={resumeCue.href}
                      className="text-sm font-medium text-violet-200 hover:text-white underline underline-offset-2 touch-manipulation inline-block min-h-[44px]"
                    >
                      {resumeCue.line}
                    </Link>
                    {resumeCue.sub ? <p className="text-xs text-slate-500 mt-1.5 leading-snug">{resumeCue.sub}</p> : null}
                  </>
                ) : (
                  <p className="text-sm text-slate-400 leading-snug">Resume: bookmark a spot by opening any lesson, quiz, or PDF guide — it will appear here.</p>
                )}
              </div>
              <p className="text-xs text-slate-500 text-center" aria-live="polite">
                {pct}% course · {done}/{totalSections} sections
                {here.title ? <span className="text-slate-600"> · {here.title}</span> : null}
              </p>
              <CoachLine k="sessionPacing" className="justify-center text-center" />
            </>
          )}

          <details className="rounded-2xl border border-slate-700 bg-slate-900/25 group">
            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-medium text-slate-200 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="text-slate-500 mr-2 group-open:text-emerald-400">▸</span>
              More study tools
            </summary>
            <div className="px-4 pb-5 pt-0 space-y-6 border-t border-slate-800/80">
              <TrustReminderStrip dense />
              <section className="rounded-2xl border border-emerald-800/40 bg-slate-900/50 px-4 py-4">
                <h2 className="text-xs font-bold text-emerald-200/90 uppercase tracking-wide">Why this next</h2>
                <p className="text-sm text-white mt-2 leading-snug">{coachV2.todaysBestMove.replace(/\*\*/g, "")}</p>
                <details className="mt-3 group">
                  <summary className="cursor-pointer text-xs text-slate-500 list-none [&::-webkit-details-marker]:hidden flex items-center gap-1.5 touch-manipulation min-h-[44px] sm:min-h-0 py-2 sm:py-0">
                    <span className="text-emerald-400/90 group-open:rotate-90 transition-transform inline-block">▸</span>
                    See coach steps
                  </summary>
                  <div className="mt-1 pl-3 border-l border-slate-700 space-y-2 text-sm text-slate-300">
                    <p className="text-slate-400 text-xs">{coachV2.why}</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {coachV2.doThisNext.slice(0, 3).map((line, i) => (
                        <li key={i}>{line?.replace(/\*\*/g, "")}</li>
                      ))}
                    </ol>
                  </div>
                </details>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-900/35 px-3 py-3">
                <span className="text-sm text-slate-300 min-w-0">
                  {pct}% · {here.index}/{here.total}
                  {here.title ? <span className="text-slate-500"> · {here.title}</span> : null}
                </span>
                <Link to="/progress" className="btn-ghost text-sm px-3 py-2.5 min-h-[44px] border border-slate-600 shrink-0">
                  Progress →
                </Link>
              </div>

              <ResumeWhereCard state={state} />

              {!(done >= 4 && hasTodayActivity) && (
                <SectionCard title="One quick question" subtitle="Optional. Do this next above is still your main path.">
                  <Link
                    to={`/quiz/${firstLessonId}?quick=1`}
                    className="btn w-full text-center min-h-[48px] touch-manipulation"
                  >
                    Answer 1 question →
                  </Link>
                </SectionCard>
              )}

              <DailyMinimumCard lessonId={nextLesson ?? undefined} />

              <ProgressSafetyCard />

              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/35 px-4 py-4 space-y-3">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Today</h2>
                {!hasTodayActivity ? (
                  <p className="text-sm text-slate-500">Nothing yet — Home will pick where to start.</p>
                ) : (
                  <ul className="text-sm text-slate-300 space-y-1.5 list-none">
                    <li>
                      <span className="text-emerald-400/90">·</span>{" "}
                      {lessonsTouched === 0
                        ? "No lesson yet today"
                        : `${lessonsTouched} lesson${lessonsTouched === 1 ? "" : "s"}`}
                    </li>
                    <li>
                      <span className="text-emerald-400/90">·</span> {quizToday} quiz Q
                    </li>
                    <li>
                      <span className="text-emerald-400/90">·</span> {flashToday} flashcards
                    </li>
                    <li>
                      <span className="text-emerald-400/90">·</span> {pbqToday} labs
                    </li>
                    {notesToday > 0 && (
                      <li>
                        <span className="text-emerald-400/90">·</span> {notesToday} note{notesToday === 1 ? "" : "s"}
                      </li>
                    )}
                  </ul>
                )}
                {dailyMinimumMet ? (
                  <p className="text-sm text-emerald-200/90 border-t border-slate-800 pt-3">Enough for today.</p>
                ) : (
                  oneStepAwayCopy && (
                    <p className="text-sm text-amber-100/85 border-t border-slate-800 pt-3">{oneStepAwayCopy}</p>
                  )
                )}
                <MicroConfidenceLine streak={state.streak} dayIso={dayStr} hasActivityToday={hasTodayActivity} />
                <IdentityReinforcementLine state={state} dayIso={dayStr} hasActivityToday={hasTodayActivity} />
              </div>

              <SessionMomentumCard hasTodayActivity={hasTodayActivity} />

              {showFirstSessionsPath && (
                <div className="card border-sky-700/45 bg-sky-950/30">
                  <p className="text-xs text-sky-200/90 uppercase tracking-wide">First-time path</p>
                  <ol className="mt-2 text-sm text-slate-200 space-y-2 list-decimal list-inside marker:text-sky-300">
                    <li>
                      <Link to={COURSE_TOUR_LINKS.startHere} className="text-emerald-400 hover:underline">
                        Start here
                      </Link>
                    </li>
                    <li>
                      <Link to={COURSE_TOUR_LINKS.firstLesson} className="text-emerald-400 hover:underline">
                        First lesson
                      </Link>
                    </li>
                    <li>
                      <Link to={`/quiz/${firstLessonId}`} className="text-emerald-400 hover:underline">
                        Lesson quiz
                      </Link>
                    </li>
                    <li>
                      <Link to="/weak" className="text-emerald-400 hover:underline">
                        Review misses
                      </Link>
                    </li>
                  </ol>
                </div>
              )}

              {(aiProfile.thinkingAlerts[0] || aiProfile.noteQualityScore < 45) && (
                <div className="card border-violet-800/40 bg-violet-950/20">
                  <p className="text-xs text-violet-200/90 uppercase tracking-wide">Study habits</p>
                  {aiProfile.thinkingAlerts[0] && (
                    <p className="text-sm text-amber-100/90 mt-2">{aiProfile.thinkingAlerts[0].replace(/\*\*/g, "")}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2 hidden sm:block">
                    Recall {aiProfile.recallStrength} · Notes {aiProfile.noteQualityScore} · Readiness {aiProfile.examReadiness}
                  </p>
                  {aiProfile.noteQualityScore < 45 && !aiProfile.thinkingAlerts[0] && (
                    <p className="text-xs text-slate-400 mt-1">Add a few keywords to your notes.</p>
                  )}
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="card">
                  <div className="text-slate-500 text-xs uppercase">Lessons</div>
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
                        {done} / {totalSections} done
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Mastery {masteryLessons} · Labs {pbqPassed}/{pbqTotal}
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
                <div className="card sm:col-span-2 lg:col-span-1">
                  <div className="text-slate-500 text-xs uppercase">Shortcuts</div>
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
                <h2 className="text-sm font-semibold text-amber-200/90">Today’s summary</h2>
                <ul className="mt-2 text-sm text-slate-300 space-y-1 list-disc list-inside">
                  <li>Lessons done today: {lessonsDoneToday}</li>
                  <li>Notes: {notesToday} / 10</li>
                  <li>Your flashcards: {state.userFlashcards.length}</li>
                  <li>Miss journal: {state.missedJournal.length}</li>
                </ul>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {dailyGoalMet ? (
                    <span className="text-emerald-400 text-sm">Goal marked done.</span>
                  ) : (
                    <button type="button" className="btn-ghost text-sm" onClick={markDailyTrainingDone}>
                      I finished my goal today
                    </button>
                  )}
                </div>
                {hasSmallWinToday && (
                  <p className="text-xs text-slate-500 mt-3 border-t border-slate-800 pt-2">You moved forward today.</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="card">
                  <h2 className="font-semibold text-white">Readiness</h2>
                  <p className="text-xs text-emerald-300/90 font-medium mt-2 uppercase tracking-wide">From practice here only</p>
                  <p className="text-lg font-semibold text-white mt-1">{track.headline}</p>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{track.sub}</p>
                  <p className="text-xs text-amber-200/90 mt-3">Not a pass guarantee.</p>
                  <div className="mt-2 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all"
                      style={{ width: `${r.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {r.score} · {r.label.replace("_", " ")}
                  </p>
                </div>
                <div className="card">
                  <h2 className="font-semibold text-white">Weak spots</h2>
                  <ul className="mt-2 text-sm text-slate-300 space-y-1">
                    {Object.entries(state.domainScore)
                      .filter(([, v]) => v < 55)
                      .map(([d, v]) => (
                        <li key={d}>
                          Domain {d}: {v}
                        </li>
                      ))}
                    {Object.values(state.domainScore).every((v) => v >= 55) && <li>Balanced for now.</li>}
                  </ul>
                  <Link to="/weak" className="btn mt-3 w-full text-center">
                    Fix weak areas
                  </Link>
                </div>
              </div>
            </div>
          </details>
        </div>

        <details className="rounded-2xl border border-violet-900/45 bg-violet-950/15 lg:sticky lg:top-4 group open:shadow-lg open:shadow-violet-950/20">
          <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-medium text-violet-100 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden border-b border-transparent group-open:border-violet-900/40">
            <span className="text-violet-400/90 mr-2 group-open:rotate-90 transition-transform inline-block">▸</span>
            Ask something (optional)
          </summary>
          <div className="p-2 pt-0">
            <AITutorPanel
              className="!border-0 rounded-xl bg-violet-950/20"
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
        </details>
      </div>
    </AppShell>
  );
}
