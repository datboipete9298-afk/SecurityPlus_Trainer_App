import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { lessons, getNextSectionId, ORDERED_LESSON_IDS } from "../data/lessons";
import { lessonAnticipationLine } from "../utils/stickinessCopy";
import { useProgress, getNotesTodayCount } from "../context/ProgressContext";
import { isLessonUnlocked } from "../utils/adaptive";
import { questionsByLesson } from "../data/quizzes";
import { getLabsForLesson } from "../data/labs";
import type { BrainNote } from "../types";
import { isLessonProgressComplete, isSimpleLessonProgressComplete } from "../types/beginner";
import { isLessonHandsOnComplete } from "../core/trainingProgress";
import TrainingPlatformBlock from "../components/training/TrainingPlatformBlock";
import LessonStepper from "../components/LessonStepper";
import ExplainSimplerModal from "../components/ExplainSimplerModal";
import GlossaryChips from "../components/GlossaryChips";
import ContinueButton from "../components/ContinueButton";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import CurrentStepView from "../components/CurrentStepView";
import { getVideoForLesson } from "../data/videoMap";
import { PROFESSOR_MESSER_COURSE_INDEX, PROFESSOR_MESSER_YOUTUBE_PLAYLIST } from "../data/videoConstants";
import { getBeginnerContent } from "../utils/beginnerLayer";
import { getHighlightBuckets } from "../utils/highlightBuckets";
import { getExamIntelligence } from "../utils/examIntelFromLesson";
import { LESSON_BLOCK_ORDER, LESSON_STEP_FOCUS, getLessonDoNowHint } from "../core/learningFlow";
import { emptyLessonNoteIntelligence, getLessonNoteIntelligence } from "../utils/lessonNoteIntelligence";
import { analyzeDraftNote, overNotingMessage } from "../core/noteAnalyzer";
import { buildLearningProfile, getAntiPassiveWarnings } from "../core/learningObserver";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import AITutorPanel from "../components/AITutorPanel";
import DailyMinimumCard from "../components/DailyMinimumCard";
import { flashExtensionIdentityForDashboard } from "../utils/outsideQuizIdentity";
import { buildLessonCompleteIdentityLine } from "../utils/identityPersonalization";
import VideoStudyMode, { type PauseContextPayload } from "../components/video/VideoStudyMode";
import { buildPausePromptPoolFromLesson } from "../utils/pausePrompts";
import LessonStepIndicator from "../components/LessonStepIndicator";
import { pickConfidenceLine, pickNextLine } from "../utils/microEncouragement";
import { markUsage, markUsageOnce } from "../utils/localUsageSignals";
import MultiTabHint from "../components/MultiTabHint";

export default function LessonPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const {
    state,
    addNote,
    completeLesson,
    saveTeachBack,
    touchStreak,
    skipLab,
    patchLessonProgress,
    setBeginnerMode,
    setSimpleLessonMode,
    seedHighlightMemory,
    nextStep,
    takeExtensionIdentity,
    readiness,
    bumpStudyResume,
  } = useProgress();
  const t0 = useRef(Date.now());
  const L = id ? lessons[id] : null;

  useEffect(() => {
    if (!id) return;
    bumpStudyResume({ lessonId: id });
    markUsage("lesson_started");
  }, [id, bumpStudyResume]);
  const [note, setNote] = useState({
    topic: "",
    whatItMeans: "",
    realLife: "",
    whyMatters: "",
    examKeyword: "",
    memory: "",
  });
  const [teach, setTeach] = useState("");
  const [explainOpen, setExplainOpen] = useState(false);
  const [flowStep, setFlowStep] = useState(1);
  /** Full lesson pacing: single visible step unless user disables (beginner mode always paces). */
  const [lessonOneStepUi, setLessonOneStepUi] = useState(true);
  const [encourageMsg, setEncourageMsg] = useState<string | null>(null);
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [noteAiMsg, setNoteAiMsg] = useState<string | null>(null);
  /** Mirrors VideoStudyMode’s active pause so the sidebar tutor matches the on-page prompt. */
  const [fusionPauseCtx, setFusionPauseCtx] = useState<PauseContextPayload | null>(null);

  useEffect(() => {
    t0.current = Date.now();
    touchStreak();
  }, [id, touchStreak]);

  useEffect(() => {
    if (id) setTeach(state.teachBack[id] ?? "");
  }, [id, state.teachBack]);

  useEffect(() => {
    setFlowStep(1);
  }, [id]);

  useEffect(() => {
    if (!state.simpleLessonMode && flowStep !== 1) setFusionPauseCtx(null);
  }, [state.simpleLessonMode, flowStep]);

  const noteIntel = useMemo(
    () => (L && L.hasFullContent ? getLessonNoteIntelligence(L) : emptyLessonNoteIntelligence()),
    [L],
  );
  const draftAnalysis = useMemo(() => {
    if (!L || !L.hasFullContent) {
      return { severity: "ok" as const, messages: [""], likelyCopied: false, missingKeywords: [] as string[] };
    }
    return analyzeDraftNote(note, L);
  }, [note, L]);
  const observer = useMemo(() => buildLearningProfile(state), [state]);
  const antiPassive: string[] = id && L?.hasFullContent ? getAntiPassiveWarnings(id, state) : [];

  if (!id) return <p>Missing id</p>;
  if (!L || !L.hasFullContent) {
    return (
      <div className="card max-w-2xl">
        <h1 className="h1">Section {id}</h1>
        <p className="text-slate-400 mt-2">
          The full guided lesson for this section is not available in the app yet. Open the{" "}
          <Link to="/roadmap" className="text-emerald-400 underline">
            lesson path
          </Link>{" "}
          to choose another section, or use{" "}
          <Link to="/import" className="text-emerald-400 underline">
            Import
          </Link>{" "}
          if you are merging your own study file.
        </p>
        <Link to="/roadmap" className="btn mt-4 inline-block">
          Lesson path
        </Link>
      </div>
    );
  }

  if (!isLessonUnlocked(id, state)) {
    const idx = ORDERED_LESSON_IDS.indexOf(id);
    const prevId = idx > 0 ? ORDERED_LESSON_IDS[idx - 1]! : null;
    const prevTitle = prevId ? lessons[prevId]?.title ?? prevId : null;
    return (
      <div className="card max-w-2xl space-y-4">
        <h1 className="h1">Lesson locked</h1>
        <p className="text-slate-300">
          You need to complete the previous lesson in Messer order before this one opens.
        </p>
        {prevTitle && prevId && (
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
            <p className="text-xs uppercase text-amber-200/90 font-semibold">Complete first</p>
            <p className="text-lg font-semibold text-white mt-1">{prevTitle}</p>
            <Link to={`/lesson/${prevId}`} className="btn mt-4 inline-block text-center w-full sm:w-auto">
              Go to previous lesson →
            </Link>
          </div>
        )}
        <Link to="/roadmap" className="btn-ghost inline-block">
          Full lesson path
        </Link>
      </div>
    );
  }

  const quizCount = questionsByLesson(id).length;
  const labs = getLabsForLesson(id);
  const notes = state.notes.filter((n) => n.lessonId === id);
  const notesToday = getNotesTodayCount(state.notes);
  const noteLimitWarning = overNotingMessage(notes.length, notesToday);

  const weakAreas = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d} (score ${state.domainScore[d]})`),
    [state.domainScore],
  );

  const hb = getHighlightBuckets(L);
  const lessonPageVideoFusion = useMemo(() => {
    if (!L.hasFullContent) return undefined;
    if (!state.simpleLessonMode && flowStep !== 1) return undefined;
    const first = buildPausePromptPoolFromLesson(L)[0];
    const live = fusionPauseCtx?.item;
    return {
      pausePrompt: live?.prompt ?? first?.prompt ?? "Pause the video once and write what matters most for the exam.",
      sectionLabel: `${L.title}${L.sectionNumber ? ` (${L.sectionNumber})` : ""}`,
      highlightTargets: hb.mustHighlight.map((x) => x.replace(/\*\*/g, "")).slice(0, 8),
    };
  }, [L, state.simpleLessonMode, flowStep, fusionPauseCtx, hb]);
  const aiLessonCtx = useMemo(
    () => ({
      id,
      title: L.title,
      sectionNumber: L.sectionNumber,
      domain: L.domain,
      mustHighlights: hb.mustHighlight.map((x) => x.replace(/\*\*/g, "")),
      examTraps: L.examTraps,
      instantRecognition: L.instantRecognition,
      noteIntelLines: [
        ...noteIntel.whatToHighlight.slice(0, 6),
        noteIntel.writeThisDown,
        ...noteIntel.examSnapshot.slice(0, 4),
      ],
      userNoteRows: notes.map((n) => `${n.topic}: ${n.examKeyword}`),
      simpleExplanation: L.simpleExplanation,
    }),
    [id, L.title, L.sectionNumber, L.domain, L.examTraps, L.instantRecognition, L.simpleExplanation, hb, noteIntel, notes],
  );

  const saveBrain = () => {
    const limitMsg = overNotingMessage(notes.length, notesToday);
    if (limitMsg) {
      setNoteAiMsg(limitMsg);
      return;
    }
    if (notes.length >= 5) return;
    if (!note.topic.trim()) return;
    const analysis = analyzeDraftNote(note, L);
    if (analysis.severity === "block") {
      setNoteAiMsg(analysis.messages.join(" "));
      return;
    }
    const b: BrainNote = {
      id: crypto.randomUUID(),
      lessonId: id,
      ...note,
      created: Date.now(),
    };
    addNote(b);
    markUsage("video_note_saved");
    setNote({ topic: "", whatItMeans: "", realLife: "", whyMatters: "", examKeyword: "", memory: "" });
    if (analysis.severity === "warn") {
      setNoteAiMsg(analysis.messages.join(" "));
    } else {
      const seed = `${id}:${b.id}`;
      const confidence = pickConfidenceLine(seed);
      const next = pickNextLine("after-note", seed);
      setNoteAiMsg(`Saved — tight note. ${confidence} ${next}`);
    }
  };

  const nxt = getNextSectionId(id) ?? null;
  const vMeta = getVideoForLesson(id);
  const hasMesserNotesPdf = !!state.pdfLibrary?.localFileMeta?.["messer-course-notes-v107"];
  const messerPdfGuideHref = `/pdf-guides/messer-course-notes-v107/${id}`;
  const beg = getBeginnerContent(L);
  const examI = getExamIntelligence(L);
  const lp = state.lessonProgress[id] ?? {};
  const teachOk = teach.trim().length >= 20 || (state.teachBack[id]?.trim().length ?? 0) >= 20;
  const handsOnOk = isLessonHandsOnComplete(id, state);
  const canMark = isLessonProgressComplete({ ...lp, teachBackDone: teachOk }, { hasLab: labs.length > 0, handsOnComplete: handsOnOk });
  const doNowHint = useMemo(
    () => getLessonDoNowHint(lp, { hasLab: labs.length > 0, handsOnComplete: handsOnOk }),
    [lp, labs.length, handsOnOk],
  );
  const glossarySource = `${L.title} ${L.simpleExplanation} ${beg.plainEnglish}`;

  const runComplete = (force: boolean) => {
    if (!id) return;
    if (canMark && !force) {
      const elapsed = Date.now() - t0.current;
      if (elapsed < 45_000) {
        if (
          !window.confirm(
            "You’re finishing very fast. Slow down — are you sure you engaged highlights, hands-on, and quiz? Cancel to review.",
          )
        ) {
          return;
        }
      }
    }
    if (!canMark && !force) return;
    if (!canMark && force) {
      if (!window.confirm("The stepper is not all checked. Mark this lesson complete anyway? (You can still review later.)")) {
        return;
      }
    }
    const wasNewCompletion = !state.completedLessons.includes(id);
    const sec = Math.max(1, Math.round((Date.now() - t0.current) / 1000));
    saveTeachBack(id, teach);
    patchLessonProgress(id, { teachBackDone: teachOk });
    completeLesson(id, sec);
    if (wasNewCompletion && L) {
      markUsage("lesson_completed");
      markUsageOnce("first_win");
      const seed = `${id}:${state.completedLessons.length}`;
      const fallback = `${pickConfidenceLine(seed)} ${pickNextLine("after-lesson", seed)}`;
      const line = takeExtensionIdentity("lesson_complete")
        ? buildLessonCompleteIdentityLine(L.title, readiness.label)
        : fallback;
      flashExtensionIdentityForDashboard(line);
    }
    nav("/");
  };

  const canMarkSimple = isSimpleLessonProgressComplete(lp);

  const runCompleteSimple = (force: boolean) => {
    if (!id) return;
    if (!canMarkSimple && !force) return;
    if (!canMarkSimple && force) {
      if (!window.confirm("Mark complete without every simple step finished? You can open the full lesson anytime.")) return;
    }
    const wasNewCompletion = !state.completedLessons.includes(id);
    const sec = Math.max(1, Math.round((Date.now() - t0.current) / 1000));
    saveTeachBack(id, teach);
    patchLessonProgress(id, {
      teachBackDone: teach.trim().length >= 12 || !!lp.teachBackDone,
      flashcardsReviewed: true,
    });
    completeLesson(id, sec);
    if (wasNewCompletion && L) {
      markUsage("lesson_completed");
      markUsageOnce("first_win");
      const seed = `${id}:${state.completedLessons.length}:simple`;
      const fallback = `${pickConfidenceLine(seed)} ${pickNextLine("after-lesson", seed)}`;
      const line = takeExtensionIdentity("lesson_complete")
        ? buildLessonCompleteIdentityLine(L.title, readiness.label)
        : fallback;
      flashExtensionIdentityForDashboard(line);
    }
    nav("/");
  };

  const block = (k: (typeof LESSON_BLOCK_ORDER)[number]["key"]) => LESSON_BLOCK_ORDER.find((b) => b.key === k);
  const titleOf = (k: (typeof LESSON_BLOCK_ORDER)[number]["key"]) => {
    const b0 = block(k);
    return b0 ? `${b0.emoji} ${b0.title}` : k;
  };

  const StepSection = ({ stepIndex, k, className, children }: { stepIndex: number; k: (typeof LESSON_BLOCK_ORDER)[number]["key"]; className?: string; children: React.ReactNode }) => {
    const t = titleOf(k);
    const phase = LESSON_STEP_FOCUS[stepIndex] ?? "This step";
    const strict = lessonOneStepUi || state.beginnerMode;
    const unlockPhase = LESSON_STEP_FOCUS[flowStep] ?? `step ${flowStep}`;
    const lockedCard = (
      <div className="card border-slate-700 border-dashed">
        <p className="text-slate-500 text-sm font-medium">
          Step {stepIndex}: {phase}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{t}</p>
        <p className="text-amber-200/90 text-sm mt-2">
          Finish <strong className="text-amber-100">step {flowStep}: {unlockPhase}</strong> to unlock this.
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          {state.beginnerMode
            ? "Beginner mode shows one layer at a time so you do not get lost."
            : "One step at a time is on — finish the current step above first."}
        </p>
      </div>
    );
    const doneFooter =
      strict && stepIndex < 10 && stepIndex === flowStep ? (
        <button
          type="button"
          className="btn mt-4 w-full touch-manipulation min-h-[48px]"
          onClick={() => {
            setFlowStep((s) => Math.max(s, stepIndex + 1));
            setEncourageMsg("You're doing good — one step at a time.");
            window.setTimeout(() => setEncourageMsg(null), 4500);
          }}
        >
          Done with this step — show next
        </button>
      ) : null;

    return (
      <CurrentStepView
        stepIndex={stepIndex}
        flowStep={flowStep}
        oneStepAtATime={lessonOneStepUi}
        beginnerMode={state.beginnerMode}
        phaseLabel={phase}
        stepTitleLine={t}
        className={className}
        lockedContent={lockedCard}
        doneFooter={doneFooter}
      >
        {state.beginnerMode && stepIndex === 1 && <p className="text-[10px] text-amber-200/80 mt-2">Do this first — the rest of the page builds on the video.</p>}
        {state.beginnerMode && stepIndex === 2 && <p className="text-[10px] text-amber-200/80 mt-2">Three to eight exam hooks, not whole paragraphs — recognition beats highlighting everything.</p>}
        {state.beginnerMode && (stepIndex === 7 || stepIndex === 8) && (
          <p className="text-[10px] text-amber-200/80 mt-2">Quiz, then flashcards — same rhythm every lesson.</p>
        )}
        {state.beginnerMode && stepIndex === 9 && <p className="text-[10px] text-amber-200/80 mt-2">How CompTIA likes to phrase traps and best answers.</p>}
        {children}
      </CurrentStepView>
    );
  };

  if (state.simpleLessonMode) {
    return (
      <AppShell>
        <div className="lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-8 items-start">
          <div className="space-y-10 min-w-0 pb-8">
            <FlowPrimaryStrip>
              <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />
            </FlowPrimaryStrip>
            <DailyMinimumCard lessonId={id} />
            <details className="rounded-2xl border border-emerald-800/45 bg-emerald-950/25 px-4 py-2 group">
              <summary className="cursor-pointer list-none text-sm text-emerald-200 font-medium touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                <span className="mr-2 text-emerald-400/80 group-open:rotate-90 transition-transform inline-block">▸</span>
                Simple mode — switch to full lesson
              </summary>
              <p className="text-sm text-slate-300 mt-2 pl-1">
                Full lesson adds labs, exam intel, and more blocks.
              </p>
              <button type="button" className="btn w-full sm:w-auto mt-3 touch-manipulation min-h-[48px]" onClick={() => setSimpleLessonMode(false)}>
                Show full lesson
              </button>
            </details>
            <nav className="text-xs text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-1" aria-label="Breadcrumb">
              <Link to="/roadmap" className="text-emerald-400 hover:underline">
                Lesson path
              </Link>
              <span aria-hidden>/</span>
              <span className="text-slate-400">Domain {L.domain}</span>
              <span aria-hidden>/</span>
              <span className="text-slate-300 truncate max-w-[min(100%,14rem)] sm:max-w-md">{L.title}</span>
            </nav>
            <PageHeader
              eyebrow={`Domain ${L.domain}${L.sectionNumber ? ` · Section ${L.sectionNumber}` : ""}`}
              title={L.title}
              purpose="Fusion watch: video → one pause → one note → quick check — then finish the actions and quiz below."
            />
            <section className="card border-cyan-800/35 space-y-4" id="lesson-simple-fusion">
              <h2 className="text-cyan-300 font-bold text-sm uppercase">Watch · pause · prove it</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Same fusion strip as guided watch:{" "}
                <strong className="text-slate-300">watch first</strong>, pause on the cue, save one retrieval note, then answer the quick check. Expand the tutor below only if you want AI help —
                it hears the pause line you see on screen.
              </p>
              <VideoStudyMode
                minimal
                variant="lesson-step"
                lessonId={id}
                lesson={L}
                embedUrl={vMeta.embedUrl}
                videoTitle={vMeta.videoTitle}
                youtubeUrl={vMeta.youtubeUrl}
                professorMesserPageUrl={vMeta.professorMesserPageUrl}
                estimatedWatchTimeMin={vMeta.estimatedWatchTimeMin ?? null}
                needsVideoUrl={!!vMeta.needsVideoUrl}
                continueHref={`/quiz/${id}?quick=3`}
                continueLabel="Continue to quick quiz →"
                pdfGuideHref={hasMesserNotesPdf ? messerPdfGuideHref : undefined}
                pdfSearchPhrase={L.title}
                pdfGuideEyebrow={
                  hasMesserNotesPdf ? "Your Messer notes PDF is on file — optional link below." : undefined
                }
                showTutorPanel={false}
                onPauseContextChange={setFusionPauseCtx}
              />
            </section>
            <section className="card border-slate-700 space-y-3">
              <h2 className="text-slate-200 font-bold text-sm uppercase">Do this once</h2>
              <p className="text-slate-300 text-sm">{L.quickAction}</p>
              <button type="button" className="btn text-sm touch-manipulation" onClick={() => patchLessonProgress(id, { quickActionDone: true })}>
                I did the quick action
              </button>
            </section>
            <section className="card border-slate-700 space-y-3">
              <h2 className="text-slate-200 font-bold text-sm uppercase">Mini-quiz</h2>
              <p className="text-sm text-slate-400">Three questions — low pressure. Wrong answers still build flashcards automatically.</p>
              <Link to={`/quiz/${id}?quick=3`} className="btn inline-block text-center touch-manipulation">
                Open quick quiz (3 questions)
              </Link>
              <Link to={`/quiz/${id}`} className="btn-ghost text-sm block text-center touch-manipulation">
                Full quiz ({quizCount} questions)
              </Link>
            </section>
            <section className="card border-slate-700 space-y-3">
              <h2 className="text-slate-200 font-bold text-sm uppercase">Optional: say it in one breath</h2>
              <textarea
                className="w-full min-h-[72px] bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm"
                placeholder="Optional — 12+ characters helps lock it in"
                value={teach}
                onChange={(e) => setTeach(e.target.value)}
              />
            </section>
            {encourageMsg && (
              <p className="text-sm text-emerald-300/95 text-center rounded-xl border border-emerald-800/35 bg-emerald-950/20 px-3 py-2" role="status">
                {encourageMsg}
              </p>
            )}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <button
                type="button"
                className="btn touch-manipulation flex-1 min-h-[48px]"
                disabled={!canMarkSimple}
                onClick={() => runCompleteSimple(false)}
              >
                Mark lesson complete
              </button>
              {!canMarkSimple && (
                <button type="button" className="btn-ghost touch-manipulation min-h-[48px]" onClick={() => runCompleteSimple(true)}>
                  Mark complete anyway…
                </button>
              )}
            </div>
          </div>
          <details className="rounded-2xl border border-violet-900/45 bg-violet-950/15 lg:sticky lg:top-4 lg:self-start order-first lg:order-none mb-4 lg:mb-0 group">
            <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-violet-100 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="text-violet-400/90 mr-2 group-open:rotate-90 transition-transform inline-block">▸</span>
              Ask something (optional)
            </summary>
            <div className="p-2 pt-0">
              <AITutorPanel
                className="!border-0 rounded-xl bg-violet-950/20"
                context={{
                  surface: "lesson",
                  lesson: aiLessonCtx,
                  userProgress: { lessonProgress: lp, simpleLesson: true },
                  weakAreas,
                  noteDraft: note,
                  noteHeuristic: draftAnalysis.messages,
                  coachLines: ["Simple fusion: same pause prompt as above — tutor matches what you paused on."],
                  videoFusion: lessonPageVideoFusion,
                }}
              />
            </div>
          </details>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-8 items-start">
        <div className="space-y-10 min-w-0">
          <FlowPrimaryStrip>
            <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />
          </FlowPrimaryStrip>
          <section
            className="rounded-2xl border border-emerald-800/55 bg-gradient-to-br from-emerald-950/50 to-slate-950/40 px-4 py-4 space-y-2 shadow-lg shadow-emerald-950/20"
            aria-labelledby="lesson-do-now-heading"
          >
            <h2 id="lesson-do-now-heading" className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/95">
              Do this now
            </h2>
            <p className="text-lg font-semibold text-white leading-snug">{doNowHint.headline}</p>
            <p className="text-sm text-slate-300 leading-relaxed">{doNowHint.detail}</p>
            <p className="text-xs text-emerald-200/80 border-t border-emerald-900/40 pt-2">
              <span className="text-emerald-300/95 font-semibold">Loop:</span> Watch → pause → write one note → answer 3 questions.
            </p>
            <p className="text-xs text-slate-500">{doNowHint.then}</p>
          </section>

          <LessonStepIndicator currentStep={flowStep} strict={lessonOneStepUi || state.beginnerMode} />

          <MultiTabHint />

          <PageHeader
            eyebrow={`Domain ${L.domain}${L.sectionNumber ? ` · Section ${L.sectionNumber}` : ""}`}
            title={L.title}
            purpose="Follow the green Do this now line — the steps below scroll in order."
          />

          <details className="rounded-xl border border-slate-700 bg-slate-900/30 group mb-8">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm text-slate-400 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
              Lesson reference &amp; settings <span className="ml-1 text-slate-600">(optional)</span>
            </summary>
            <div className="px-3 pb-3 pt-0 border-t border-slate-800 space-y-3">
              <details className="rounded-lg border border-slate-700/70 bg-slate-900/40 group/inner">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-slate-300 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                  <span className="mr-2 text-slate-500 group-open/inner:text-emerald-400">▸</span>
                  Path, display, coach
                </summary>
                <div className="px-3 pb-3 pt-0 border-t border-slate-800 space-y-3">
                  {!state.beginnerMode && (
                    <label className="flex flex-wrap items-center gap-3 text-sm text-slate-300 touch-manipulation cursor-pointer min-h-[44px]">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-11 w-11 sm:h-5 sm:w-5 rounded border-slate-600 shrink-0"
                          checked={lessonOneStepUi}
                          onChange={(e) => setLessonOneStepUi(e.target.checked)}
                          aria-label="Show one lesson step at a time"
                        />
                        One step at a time
                      </span>
                      <span className="text-[11px] text-slate-500">Off = preview the whole lesson (more scrolling).</span>
                    </label>
                  )}
                  <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500" aria-label="Breadcrumb">
                    <Link to="/roadmap" className="text-emerald-400 hover:underline">
                      Lesson path
                    </Link>
                    <span aria-hidden>/</span>
                    <span className="text-slate-400">Domain {L.domain}</span>
                    <span aria-hidden>/</span>
                    <span className="text-slate-300 truncate max-w-[min(100%,14rem)] sm:max-w-md">{L.title}</span>
                  </nav>
                  <button type="button" className="btn-ghost text-sm w-full min-h-[44px] touch-manipulation" onClick={() => setSimpleLessonMode(true)}>
                    Simple lesson view (shorter pass)
                  </button>
                  {antiPassive.length > 0 && (
                    <div className="rounded-xl border border-amber-800/50 bg-amber-950/25 p-3 text-sm text-amber-100/95">
                      <p className="text-[10px] uppercase text-amber-200/90 font-semibold">Coach</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {antiPassive.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500">
                    Recall {observer.recallStrength} · Notes {observer.noteQualityScore} · Readiness {observer.examReadiness}
                  </p>
                </div>
              </details>

              <details className="rounded-lg border border-slate-700/70 bg-slate-900/40 group/inner">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                  <span className="mr-2 text-slate-600 group-open/inner:text-emerald-400">▸</span>
                  How the blocks fit together
                </summary>
                <div className="px-3 pb-3 pt-0 border-t border-slate-800 text-sm text-slate-300 space-y-2">
                  {!state.simpleLessonMode && (
                    <p className="text-xs text-slate-500 leading-relaxed pt-2">
                      <span className="text-emerald-200/90 font-medium">Fast path: </span>
                      video → mini-quiz → flashcards → complete.
                    </p>
                  )}
                  <ul className="space-y-1.5 list-none text-slate-200">
                    <li><span className="text-emerald-300 font-medium">Watch: </span>Step 1 video.</li>
                    <li><span className="text-emerald-300 font-medium">Highlight: </span>Short hooks in step 2 — not paragraphs.</li>
                    <li><span className="text-emerald-300 font-medium">Write: </span>One Brain Book row.</li>
                    <li><span className="text-emerald-300 font-medium">Do: </span>{L.quickAction}</li>
                    <li><span className="text-emerald-300 font-medium">Quiz: </span>{quizCount} questions · same topic as this section.</li>
                    <li><span className="text-emerald-300 font-medium">Next: </span>Flashcards, then complete — Continue on Home picks what&apos;s next.</li>
                  </ul>
                </div>
              </details>

              <details className="rounded-lg border border-slate-700/70 bg-slate-900/40 group/inner">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                  <span className="mr-2 text-slate-600 group-open/inner:text-emerald-400">▸</span>
                  Pipeline checklist (same as coach)
                </summary>
                <div className="px-3 pb-3 pt-0 border-t border-slate-800">
                  <LessonStepper
                    lessonId={id}
                    p={lp}
                    hasLab={labs.length > 0}
                    labDone={lp.labDone}
                    handsOnComplete={handsOnOk}
                    nextHref={nxt && lessons[nxt!] ? `/lesson/${nxt}` : undefined}
                  />
                </div>
              </details>
            </div>
          </details>

      {encourageMsg && (
        <p className="text-sm text-emerald-300/95 text-center rounded-xl border border-emerald-800/35 bg-emerald-950/20 px-3 py-2" role="status">
          {encourageMsg}
        </p>
      )}

      {state.beginnerMode && (
        <div className="card border-violet-800/40 bg-violet-950/20 text-sm text-slate-300">
          <strong className="text-violet-200">Beginner mode on:</strong> you unlock the next block only after you click “Done with this step” on the
          current one. Turn it off in the sidebar to see the full page at once.
        </div>
      )}

      <StepSection stepIndex={1} k="watch" className="card border-cyan-800/30">
        <div className="flex flex-wrap items-start justify-between gap-2 mt-2">
          <p className="text-xs text-slate-500">Step 1 of 10</p>
          {vMeta.needsVideoUrl && (
            <span className="text-xs font-semibold rounded-full bg-amber-900/50 text-amber-200 px-2 py-0.5 border border-amber-600/50">Video link needs verification</span>
          )}
        </div>
        {vMeta.estimatedWatchTimeMin != null && <p className="text-xs text-slate-500 mt-1">~{vMeta.estimatedWatchTimeMin} min (estimate)</p>}

        <div className="mt-3 space-y-2">
          {hasMesserNotesPdf ?
            <Link
              to={messerPdfGuideHref}
              className="btn w-full text-center min-h-[52px] touch-manipulation text-base inline-flex items-center justify-center"
            >
              Start with your PDF + video
            </Link>
          : <button
              type="button"
              className="btn w-full min-h-[52px] touch-manipulation text-base"
              onClick={() => {
                document.getElementById("lesson-step1-video")?.scrollIntoView({ behavior: "smooth", block: "start" });
                setEncourageMsg("Press play on the embed — pauses are fine.");
                window.setTimeout(() => setEncourageMsg(null), 5000);
              }}
            >
              Start this lesson
            </button>}
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {hasMesserNotesPdf
              ? "Default path: guided PDF for this section (your file, highlights, checkpoints). The video embed stays on this page if you prefer it first."
              : "Default path: jumps to the embed below. Add your Messer notes PDF in PDF setup to unlock the combined PDF + guide flow."}
          </p>
        </div>

        <div id="lesson-step1-video" className="scroll-mt-28 mt-4">
          <VideoStudyMode
            dense
            showTutorPanel={false}
            lessonId={id}
            lesson={L}
            variant="lesson-step"
            embedUrl={vMeta.embedUrl}
            videoTitle={vMeta.videoTitle}
            youtubeUrl={vMeta.youtubeUrl}
            professorMesserPageUrl={vMeta.professorMesserPageUrl}
            estimatedWatchTimeMin={vMeta.estimatedWatchTimeMin ?? null}
            needsVideoUrl={!!vMeta.needsVideoUrl}
            continueHref={`/watch/${id}`}
            continueLabel="Guided watch · pause + note →"
            pdfGuideHref={messerPdfGuideHref}
            pdfSearchPhrase={L.title}
            pdfGuideEyebrow={hasMesserNotesPdf ? "Your Messer notes PDF is on file — search matches this file." : "Add your PDF in PDF setup to align search + highlights."}
            onPauseContextChange={setFusionPauseCtx}
          />
        </div>
        <ul className="mt-3 space-y-1 text-sm text-slate-300 list-disc pl-4">
          <li>Skim the first 2 minutes, then watch with pauses for highlights in step 2.</li>
          {!state.beginnerMode && (
            <>
              <li>Pause and highlight 3–8 terms in your notes in step 2.</li>
              <li>Optional: one Brain Book row in the final block.</li>
            </>
          )}
        </ul>

        <details className="mt-4 rounded-xl border border-slate-700 bg-slate-900/35 group">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-300 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
            <span className="text-slate-500 mr-2 group-open:text-emerald-400">▸</span>
            More ways to learn
          </summary>
          <div className="px-4 pb-4 pt-0 border-t border-slate-800/90 space-y-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">PDFs &amp; guides</p>
              <div className="flex flex-col gap-2">
                <Link to={messerPdfGuideHref} className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm">
                  Open PDF guide (Messer notes)
                </Link>
                <Link
                  to={`/pdf-guides/sy0-701-study-guide/${id}`}
                  className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm"
                >
                  Open PDF guide (Study guide)
                </Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Video &amp; session</p>
              <div className="flex flex-col gap-2">
                {vMeta.youtubeUrl && (
                  <a href={vMeta.youtubeUrl} className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm" target="_blank" rel="noreferrer">
                    Watch on YouTube
                  </a>
                )}
                <a
                  href={PROFESSOR_MESSER_YOUTUBE_PLAYLIST}
                  className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open playlist
                </a>
                <Link to="/session" className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm">
                  Start 30-min session
                </Link>
                <Link to={`/watch/${id}`} className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm">
                  Guided watch
                </Link>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Reference</p>
              <div className="flex flex-col gap-2">
                {vMeta.professorMesserPageUrl && (
                  <a
                    href={vMeta.professorMesserPageUrl}
                    className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Messer course page
                  </a>
                )}
                <a
                  href={PROFESSOR_MESSER_COURSE_INDEX}
                  className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Course index
                </a>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Stuck?</p>
              <button
                type="button"
                className="btn-ghost w-full text-sm min-h-[44px] touch-manipulation"
                onClick={() => {
                  setBeginnerMode(true);
                  setExplainOpen(true);
                }}
              >
                Need a simpler explanation
              </button>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Progress</p>
              <button
                type="button"
                className="btn w-full text-sm min-h-[44px] touch-manipulation"
                onClick={() => {
                  patchLessonProgress(id, { videoWatched: true, videoWatchedAt: Date.now() });
                  setEncourageMsg("You're doing good — short wins add up.");
                  window.setTimeout(() => setEncourageMsg(null), 4000);
                }}
              >
                Mark video watched
              </button>
            </div>
          </div>
        </details>
        <GlossaryChips textSource={glossarySource} />
      </StepSection>

      <StepSection stepIndex={2} k="highlight" className="card border-amber-800/40">
        <p className="text-xs text-slate-500 mt-2">Max 3–8 hooks in your notes — terms and short lines only.</p>
        <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-rose-800/50 bg-rose-950/20 p-3">
            <p className="text-rose-300 font-semibold text-xs uppercase mb-2">MUST</p>
            <ul className="space-y-2 text-slate-200 list-disc pl-4">
              {hb.mustHighlight.map((x, i) => (
                <li key={i} className="text-xs leading-snug">
                  {x.replace(/\*\*/g, "")}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/15 p-3">
            <p className="text-emerald-300 font-semibold text-xs uppercase mb-2">GOOD</p>
            <ul className="space-y-2 text-slate-200 list-disc pl-4">
              {hb.shouldHighlight.map((x, i) => (
                <li key={i} className="text-xs leading-snug">
                  {x.replace(/\*\*/g, "")}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-600/50 bg-slate-900/40 p-3">
            <p className="text-slate-400 font-semibold text-xs uppercase mb-2">SKIP</p>
            <ul className="space-y-2 text-slate-400 list-disc pl-4">
              {hb.skipHighlight.map((x, i) => (
                <li key={i} className="text-xs leading-snug">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn text-sm"
            onClick={() => {
              patchLessonProgress(id, { highlightsDone: true });
              seedHighlightMemory(id);
            }}
          >
            I finished my highlights
          </button>
          <button type="button" className="btn-ghost text-sm" onClick={() => setExplainOpen(true)}>
            Explain simpler
          </button>
        </div>
        <GlossaryChips textSource={glossarySource} />
      </StepSection>

      <ExplainSimplerModal open={explainOpen} onClose={() => setExplainOpen(false)} b={beg} />

      <StepSection stepIndex={3} k="understand" className="card border-emerald-800/30">
        {state.beginnerMode ? (
          <div className="mt-2 space-y-2 text-slate-300 text-sm">
            <p>
              <span className="text-emerald-200 font-semibold">ELI5: </span>
              {beg.plainEnglish}
            </p>
            <p>
              <span className="text-emerald-200 font-semibold">One line: </span>
              {beg.oneSentenceSummary}
            </p>
            <p className="text-xs text-slate-500">Listen for: {beg.watchFor.slice(0, 2).join(" · ")}</p>
            <div className="pt-1">
              <button
                type="button"
                className="text-xs text-cyan-300 hover:underline"
                onClick={() => setShowFullDetail((v) => !v)}
              >
                {showFullDetail ? "Hide full detail" : "Show full detail (more examples & glossary help)"}
              </button>
            </div>
            {showFullDetail && (
              <div className="mt-2 space-y-2 border-t border-slate-800 pt-3 text-slate-300">
                <p>
                  <span className="text-emerald-200 font-semibold">Why it matters: </span>
                  {beg.whyItMatters}
                </p>
                <p>
                  <span className="text-emerald-200 font-semibold">Don’t overthink: </span>
                  {beg.dontOverthink}
                </p>
                <p>
                  <span className="text-emerald-200 font-semibold">Real-life: </span>
                  {beg.realLifeExample}
                </p>
                <p className="text-xs text-slate-500">Glossary and term chips: use the same lesson’s chips below the video block.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            <p className="text-slate-300 text-sm">
              <span className="text-emerald-200 font-semibold">Plain English: </span>
              {beg.plainEnglish}
            </p>
            <details className="rounded-lg border border-slate-700/80 bg-slate-900/30">
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-300 select-none [&::-webkit-details-marker]:hidden list-none">
                More explanation &amp; video focus (optional)
              </summary>
              <div className="px-3 pb-3 pt-0 space-y-3 border-t border-slate-800/80">
                <p className="text-slate-300 text-sm pt-2">{L.simpleExplanation}</p>
                <div>
                  <h3 className="text-xs text-slate-500 font-semibold">Video — what to listen for</h3>
                  <ul className="list-disc list-inside mt-1 text-slate-200 text-sm space-y-1">
                    {L.videoFocus.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
                <p className="text-slate-300 text-sm">
                  <span className="text-emerald-200 font-semibold">Why it matters: </span>
                  {beg.whyItMatters}
                </p>
              </div>
            </details>
          </div>
        )}
      </StepSection>

      {state.beginnerMode ? (
        <>
          <StepSection stepIndex={4} k="hackers" className="card border-rose-900/40">
            <p className="text-slate-300 text-sm mt-2">
              <span className="text-rose-200 font-semibold">Why hackers care: </span>
              {L.examTraps[0]
                ? `Attacks that exploit ${L.examTraps[0]!.a} or confuse ${L.examTraps[0]!.b} show up on the test.`
                : "The exam tests whether you can spot the real control gap, not a product name."}
            </p>
            <h3 className="text-xs text-rose-300/90 font-semibold mt-3">Don&apos;t confuse (exam)</h3>
            <ul className="mt-2 space-y-1">
              {L.examTraps.map((t, i) => (
                <li key={i} className="text-slate-300 text-sm">
                  <strong className="text-amber-300/90">{t.a}</strong> vs <strong className="text-cyan-300/90">{t.b}</strong>
                </li>
              ))}
            </ul>
          </StepSection>

          <StepSection stepIndex={5} k="defend" className="card">
            <p className="text-slate-300 text-sm mt-2">
              <span className="text-cyan-200 font-semibold">How it&apos;s defended: </span>
              {L.writeDown.split(".")[0] ?? "Layer controls, log, and verify critical changes."}
            </p>
            <h3 className="text-xs text-slate-500 font-semibold mt-3">What to write down (read-only here — you save a row in the last block)</h3>
            <p className="text-slate-300 text-sm mt-1">{L.writeDown}</p>
            <h3 className="text-xs text-slate-500 font-semibold mt-3">Instant recognition</h3>
            <ul className="mt-2 text-sm">
              {L.instantRecognition.map((x, i) => (
                <li key={i} className="border-b border-slate-800 py-1">
                  <span className="text-slate-500">&quot;{x.keyword}&quot;</span> → <span className="text-white">{x.answer}</span>
                </li>
              ))}
            </ul>
            <h3 className="text-xs text-slate-500 font-semibold mt-2">3-second recall</h3>
            <ul className="list-disc list-inside text-slate-200 text-sm">
              {L.threeSecondRecall.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </StepSection>
        </>
      ) : (
        <details className="rounded-2xl border border-slate-700/80 bg-slate-900/25 mb-2">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-slate-200 select-none list-none [&::-webkit-details-marker]:hidden flex flex-wrap items-center justify-between gap-2">
            <span>Show exam traps &amp; deeper context (optional)</span>
            <span className="text-[10px] font-normal text-slate-500">Skip until after video + highlights if you want less noise</span>
          </summary>
          <div className="px-2 pb-4 space-y-6 border-t border-slate-800 sm:px-3">
            <StepSection stepIndex={4} k="hackers" className="card border-rose-900/40">
              <p className="text-slate-300 text-sm mt-2">
                <span className="text-rose-200 font-semibold">Why hackers care: </span>
                {L.examTraps[0]
                  ? `Attacks that exploit ${L.examTraps[0]!.a} or confuse ${L.examTraps[0]!.b} show up on the test.`
                  : "The exam tests whether you can spot the real control gap, not a product name."}
              </p>
              <h3 className="text-xs text-rose-300/90 font-semibold mt-3">Don&apos;t confuse (exam)</h3>
              <ul className="mt-2 space-y-1">
                {L.examTraps.map((t, i) => (
                  <li key={i} className="text-slate-300 text-sm">
                    <strong className="text-amber-300/90">{t.a}</strong> vs <strong className="text-cyan-300/90">{t.b}</strong>
                  </li>
                ))}
              </ul>
              <p className="text-slate-400 text-sm mt-3">
                <span className="text-cyan-300 font-medium">ELI10: </span>
                {beg.explainLike10}
              </p>
            </StepSection>

            <StepSection stepIndex={5} k="defend" className="card">
              <p className="text-slate-300 text-sm mt-2">
                <span className="text-cyan-200 font-semibold">How it&apos;s defended: </span>
                {L.writeDown.split(".")[0] ?? "Layer controls, log, and verify critical changes."}
              </p>
              <h3 className="text-xs text-slate-500 font-semibold mt-3">What to write down (read-only here — you save a row in the last block)</h3>
              <p className="text-slate-300 text-sm mt-1">{L.writeDown}</p>
              <h3 className="text-xs text-slate-500 font-semibold mt-3">Instant recognition</h3>
              <ul className="mt-2 text-sm">
                {L.instantRecognition.map((x, i) => (
                  <li key={i} className="border-b border-slate-800 py-1">
                    <span className="text-slate-500">&quot;{x.keyword}&quot;</span> → <span className="text-white">{x.answer}</span>
                  </li>
                ))}
              </ul>
              <h3 className="text-xs text-slate-500 font-semibold mt-2">3-second recall</h3>
              <ul className="list-disc list-inside text-slate-200 text-sm">
                {L.threeSecondRecall.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </StepSection>
          </div>
        </details>
      )}

      <StepSection stepIndex={6} k="handsOn" className="card border-cyan-900/40">
        <p className="text-slate-200 text-sm mt-2">{L.quickAction}</p>
        <button type="button" className="btn-ghost text-xs mt-2" onClick={() => patchLessonProgress(id, { quickActionDone: true })}>
          I did the quick action (safe, local)
        </button>
        {state.beginnerMode && (
          <p className="text-[10px] text-amber-200/80 mt-2">
            Learn → Do → Decide: finish every checkpoint below before quiz/flashcards — you need this for “Mark lesson complete.”
          </p>
        )}
        <TrainingPlatformBlock lessonId={id} />
        {labs[0] && (
          <div className="text-xs text-slate-500 mt-6 space-y-2 border-t border-slate-800 pt-3">
            <p>
              <strong className="text-slate-300">Extra guided lab (steps page):</strong> {labs[0]!.title} — {labs[0]!.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to={`/sim?lesson=${id}`} className="btn text-xs">
                Open lab walkthrough
              </Link>
              <button type="button" className="btn text-xs" onClick={() => patchLessonProgress(id, { labDone: true })}>
                I completed the walkthrough lab
              </button>
            </div>
            <button type="button" className="text-amber-400/90 underline" onClick={() => skipLab(labs[0]!.id)}>
              Skip walkthrough for now
            </button>
          </div>
        )}
        {!labs[0] && (
          <p className="text-xs text-slate-500 mt-3">
            More scenarios: <Link to="/sim" className="text-emerald-400 underline">Simulations hub</Link>
          </p>
        )}
      </StepSection>

      <StepSection stepIndex={7} k="quiz" className="card">
        <p className="text-slate-400 text-sm mt-1">Prove recognition under a little pressure — questions are tagged to this lesson.</p>
        <p className="text-xs text-slate-500 mt-2">
          <span className="text-emerald-200/90 font-medium">First win: </span>
          three low-pressure questions (~2 minutes). Full set is optional after.
        </p>
        <div className="mt-3 flex flex-col sm:flex-row flex-wrap gap-2">
          <Link to={`/quiz/${id}?quick=3`} className="btn text-center touch-manipulation min-h-[48px]">
            3-question quick quiz
          </Link>
          <Link to={`/quiz/${id}`} className="btn-ghost text-center touch-manipulation min-h-[48px] border border-slate-600">
            Full quiz ({quizCount} questions)
          </Link>
        </div>
      </StepSection>

      <StepSection stepIndex={8} k="flashcards" className="card">
        <p className="text-slate-400 text-sm mt-1">Spaced recall for this section — use ?lesson= for focus.</p>
        <div className="mt-3">
          <Link to={`/flashcards?lesson=${id}`} className="btn-ghost">
            Flashcard recall (this lesson)
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-2">Wrong answers auto-add cards and update weak areas.</p>
      </StepSection>

      {state.beginnerMode ? (
        <StepSection stepIndex={9} k="examIntel" className="card border-rose-900/40">
          <dl className="mt-2 space-y-2 text-sm text-slate-300">
            <div>
              <dt className="text-xs text-rose-300/90 font-semibold">EXAM TRAP</dt>
              <dd>{examI.examTrap.replace(/\*\*/g, "")}</dd>
            </div>
            <div>
              <dt className="text-xs text-rose-300/90 font-semibold">WHAT THEY ASK</dt>
              <dd>{examI.whatTheyAsk.replace(/\*\*/g, "")}</dd>
            </div>
            <div>
              <dt className="text-xs text-rose-300/90 font-semibold">HOW TO PICK (FAST)</dt>
              <dd>{examI.howToPick}</dd>
            </div>
            <div>
              <dt className="text-xs text-rose-300/90 font-semibold">KEYWORD TRIGGERS</dt>
              <dd className="flex flex-wrap gap-1 mt-1">
                {examI.triggerKeywords.map((k0) => (
                  <span key={k0} className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-amber-100/90">
                    {k0}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
          <div className="mt-6 border-t border-slate-800 pt-4 space-y-4 text-sm text-slate-300">
            <p className="text-xs font-bold text-violet-200/90 uppercase tracking-wide">AI note intelligence (this lesson)</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-800/40 bg-amber-950/15 p-3">
                <p className="text-[10px] text-amber-200/90 font-semibold uppercase mb-2">🟡 What to highlight</p>
                <ul className="list-disc pl-4 text-xs space-y-1">
                  {noteIntel.whatToHighlight.slice(0, 8).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/15 p-3">
                <p className="text-[10px] text-emerald-200/90 font-semibold uppercase mb-2">🧠 Write this down</p>
                <p className="text-xs leading-relaxed">{noteIntel.writeThisDown}</p>
              </div>
              <div className="rounded-xl border border-rose-800/40 bg-rose-950/15 p-3">
                <p className="text-[10px] text-rose-200/90 font-semibold uppercase mb-2">❌ Do not write</p>
                <ul className="list-disc pl-4 text-xs space-y-1">
                  {noteIntel.doNotWrite.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/15 p-3">
                <p className="text-[10px] text-cyan-200/90 font-semibold uppercase mb-2">🎯 Exam snapshot</p>
                <ul className="list-disc pl-4 text-xs space-y-1">
                  {noteIntel.examSnapshot.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-violet-800/40 bg-violet-950/15 p-3">
                <p className="text-[10px] text-violet-200/90 font-semibold uppercase mb-2">🧩 Memory trick</p>
                <p className="text-xs">{noteIntel.memoryTrick}</p>
              </div>
              <div className="rounded-xl border border-slate-600 bg-slate-900/40 p-3">
                <p className="text-[10px] text-slate-300 font-semibold uppercase mb-2">🧠 Say it out loud</p>
                <p className="text-xs italic">{noteIntel.sayItOutLoud}</p>
              </div>
            </div>
            <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/20 p-3">
              <p className="text-[10px] text-indigo-200/90 font-semibold uppercase mb-2">🎤 Teach it</p>
              <p className="text-xs">{noteIntel.teachIt}</p>
            </div>
            <div className="rounded-xl border border-rose-900/50 bg-rose-950/15 p-3 space-y-2">
              <p className="text-[10px] text-rose-200/90 font-semibold uppercase">🎯 How this shows on the exam</p>
              <p className="text-xs">
                <span className="text-slate-500">Story pattern: </span>
                {noteIntel.examMindset.howThisShowsOnExam}
              </p>
              <p className="text-xs">
                <span className="text-slate-500">Keyword recognition: </span>
                {noteIntel.examMindset.keywordRecognition}
              </p>
              <p className="text-xs">
                <span className="text-slate-500">Elimination: </span>
                {noteIntel.examMindset.eliminationStrategy}
              </p>
              <p className="text-xs">
                <span className="text-slate-500">Fast decision: </span>
                {noteIntel.examMindset.fastDecision}
              </p>
            </div>
          </div>
        </StepSection>
      ) : (
        <details className="rounded-2xl border border-rose-900/35 bg-rose-950/10 mb-2">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-rose-100/95 select-none list-none [&::-webkit-details-marker]:hidden">
            Show exam intel &amp; note grids (optional — open after quiz if you want cram detail)
          </summary>
          <div className="px-2 pb-3 border-t border-rose-900/30 sm:px-3">
            <StepSection stepIndex={9} k="examIntel" className="card border-rose-900/40 border-t-0 mt-0">
              <dl className="mt-2 space-y-2 text-sm text-slate-300">
                <div>
                  <dt className="text-xs text-rose-300/90 font-semibold">EXAM TRAP</dt>
                  <dd>{examI.examTrap.replace(/\*\*/g, "")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-rose-300/90 font-semibold">WHAT THEY ASK</dt>
                  <dd>{examI.whatTheyAsk.replace(/\*\*/g, "")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-rose-300/90 font-semibold">HOW TO PICK (FAST)</dt>
                  <dd>{examI.howToPick}</dd>
                </div>
                <div>
                  <dt className="text-xs text-rose-300/90 font-semibold">KEYWORD TRIGGERS</dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {examI.triggerKeywords.map((k0) => (
                      <span key={k0} className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-amber-100/90">
                        {k0}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 border-t border-slate-800 pt-4 space-y-4 text-sm text-slate-300">
                <p className="text-xs font-bold text-violet-200/90 uppercase tracking-wide">AI note intelligence (this lesson)</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-amber-800/40 bg-amber-950/15 p-3">
                    <p className="text-[10px] text-amber-200/90 font-semibold uppercase mb-2">🟡 What to highlight</p>
                    <ul className="list-disc pl-4 text-xs space-y-1">
                      {noteIntel.whatToHighlight.slice(0, 8).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/15 p-3">
                    <p className="text-[10px] text-emerald-200/90 font-semibold uppercase mb-2">🧠 Write this down</p>
                    <p className="text-xs leading-relaxed">{noteIntel.writeThisDown}</p>
                  </div>
                  <div className="rounded-xl border border-rose-800/40 bg-rose-950/15 p-3">
                    <p className="text-[10px] text-rose-200/90 font-semibold uppercase mb-2">❌ Do not write</p>
                    <ul className="list-disc pl-4 text-xs space-y-1">
                      {noteIntel.doNotWrite.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/15 p-3">
                    <p className="text-[10px] text-cyan-200/90 font-semibold uppercase mb-2">🎯 Exam snapshot</p>
                    <ul className="list-disc pl-4 text-xs space-y-1">
                      {noteIntel.examSnapshot.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-violet-800/40 bg-violet-950/15 p-3">
                    <p className="text-[10px] text-violet-200/90 font-semibold uppercase mb-2">🧩 Memory trick</p>
                    <p className="text-xs">{noteIntel.memoryTrick}</p>
                  </div>
                  <div className="rounded-xl border border-slate-600 bg-slate-900/40 p-3">
                    <p className="text-[10px] text-slate-300 font-semibold uppercase mb-2">🧠 Say it out loud</p>
                    <p className="text-xs italic">{noteIntel.sayItOutLoud}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/20 p-3">
                  <p className="text-[10px] text-indigo-200/90 font-semibold uppercase mb-2">🎤 Teach it</p>
                  <p className="text-xs">{noteIntel.teachIt}</p>
                </div>
                <div className="rounded-xl border border-rose-900/50 bg-rose-950/15 p-3 space-y-2">
                  <p className="text-[10px] text-rose-200/90 font-semibold uppercase">🎯 How this shows on the exam</p>
                  <p className="text-xs">
                    <span className="text-slate-500">Story pattern: </span>
                    {noteIntel.examMindset.howThisShowsOnExam}
                  </p>
                  <p className="text-xs">
                    <span className="text-slate-500">Keyword recognition: </span>
                    {noteIntel.examMindset.keywordRecognition}
                  </p>
                  <p className="text-xs">
                    <span className="text-slate-500">Elimination: </span>
                    {noteIntel.examMindset.eliminationStrategy}
                  </p>
                  <p className="text-xs">
                    <span className="text-slate-500">Fast decision: </span>
                    {noteIntel.examMindset.fastDecision}
                  </p>
                </div>
              </div>
            </StepSection>
          </div>
        </details>
      )}

      <StepSection stepIndex={10} k="complete" className="card border-slate-700">
        <p className="text-slate-500 text-sm mt-1">Last step: one Brain Book row, teach-back, then mark the lesson done.</p>
        <h3 id="brain-book" className="text-sm font-semibold text-white mt-3">
          Brain Book
        </h3>
        <p className="text-slate-500 text-xs">Max 5 rows this lesson · {notesToday} / 10 today</p>
        {noteLimitWarning && <p className="text-amber-200/90 text-xs mt-2 font-medium">{noteLimitWarning}</p>}
        <div className="rounded-xl border border-violet-800/35 bg-violet-950/15 p-2 mt-2 text-xs text-slate-400">
          <span className="text-violet-200/90 font-semibold">AI note check: </span>
          {draftAnalysis.messages.filter(Boolean).join(" · ") ||
            "Start typing — checks length, exam keywords, and copy-paste risk before save."}
        </div>
        <div className="mt-2 grid gap-2 text-sm">
          <input
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            placeholder="Topic"
            value={note.topic}
            onChange={(e) => setNote((n) => ({ ...n, topic: e.target.value }))}
          />
          <input
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            placeholder="What it means (simple)"
            value={note.whatItMeans}
            onChange={(e) => setNote((n) => ({ ...n, whatItMeans: e.target.value }))}
          />
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              placeholder="Exam keyword"
              value={note.examKeyword}
              onChange={(e) => setNote((n) => ({ ...n, examKeyword: e.target.value }))}
            />
            <input
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              placeholder="Memory trick (optional)"
              value={note.memory}
              onChange={(e) => setNote((n) => ({ ...n, memory: e.target.value }))}
            />
          </div>
          {!state.beginnerMode && (
            <>
              <input
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                placeholder="Real-life example"
                value={note.realLife}
                onChange={(e) => setNote((n) => ({ ...n, realLife: e.target.value }))}
              />
              <input
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                placeholder="Why it matters"
                value={note.whyMatters}
                onChange={(e) => setNote((n) => ({ ...n, whyMatters: e.target.value }))}
              />
            </>
          )}
          <button type="button" className="btn-ghost" disabled={notes.length >= 5 || notesToday >= 10} onClick={saveBrain}>
            Save row
          </button>
        </div>
        {noteAiMsg && (
          <p className={`text-xs mt-2 font-medium ${noteAiMsg.includes("over-noting") ? "text-amber-200" : "text-cyan-200/90"}`}>
            {noteAiMsg}
          </p>
        )}
        {notes.length > 0 && (
          <ul className="mt-2 text-xs text-slate-400 list-disc pl-4">
            {notes.map((n) => (
              <li key={n.id}>
                {n.topic} — {n.examKeyword}
              </li>
            ))}
          </ul>
        )}

        <h3 className="text-sm font-semibold text-white mt-4">Teach-back</h3>
        <textarea
          className="w-full min-h-[100px] bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm mt-1"
          placeholder="20+ chars: one breath summary + an exam keyword + one confusion to avoid"
          value={teach}
          onChange={(e) => setTeach(e.target.value)}
          onBlur={(e) => {
            const ok = e.target.value.trim().length >= 20;
            if (!ok) return;
            const wasAlreadyDone = !!lp.teachBackDone;
            patchLessonProgress(id, { teachBackDone: true });
            if (!wasAlreadyDone) {
              setEncourageMsg("Teach-back saved — that’s the move that locks it in.");
              window.setTimeout(() => setEncourageMsg(null), 4000);
            }
          }}
        />

        {nxt && lessons[nxt] && (
          <p className="text-xs text-slate-500 mt-6 leading-relaxed border-l-2 border-slate-700 pl-3 italic">
            {lessonAnticipationLine(L, lessons[nxt]!)}
          </p>
        )}

        <h3 className="text-sm font-semibold text-white mt-4">End of section</h3>
        <ul className="list-disc pl-4 mt-1 text-slate-300 text-sm space-y-1">
          {(L.endChecks ?? [
            "Can you explain this simply (one breath)?",
            "Can you pick the right answer in ~20s on a close stem?",
            "Are your highlights 3–8 short hooks, not paragraphs?",
          ]).map((line, j) => (
            <li key={j}>{line}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            className="btn"
            disabled={!canMark}
            title={
              canMark
                ? "Mark this lesson done for the course chain"
                : "Finish the stepper (watch, highlight, notes, quick action, platform labs/sims/decision, quiz, cards, teach-back) first, or use “anyway”"
            }
            onClick={() => runComplete(false)}
          >
            Mark lesson complete
          </button>
          {!canMark && (
            <button type="button" className="btn-ghost text-sm" onClick={() => runComplete(true)}>
              Mark complete anyway…
            </button>
          )}
          {nxt && lessons[nxt] ? (
            <Link to={`/lesson/${nxt}`} className="btn-ghost">
              Or next in chain: {lessons[nxt]!.title}
            </Link>
          ) : (
            <Link to="/roadmap" className="btn-ghost">
              Roadmap
            </Link>
          )}
        </div>
      </StepSection>
        </div>

        <details className="rounded-2xl border border-violet-900/45 bg-violet-950/15 lg:sticky lg:top-4 lg:self-start order-first lg:order-none mb-4 lg:mb-0 group">
          <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-violet-100 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
            <span className="text-violet-400/90 mr-2 group-open:rotate-90 transition-transform inline-block">▸</span>
            Ask something (optional)
          </summary>
          <div className="p-2 pt-0">
            <AITutorPanel
              className="!border-0 rounded-xl bg-violet-950/20"
              context={{
                surface: "lesson",
                lesson: aiLessonCtx,
                userProgress: { lessonProgress: lp, teachBackLen: teach.length },
                weakAreas,
                noteDraft: note,
                noteHeuristic: draftAnalysis.messages,
                coachLines: [...antiPassive, ...draftAnalysis.messages].slice(0, 6),
                videoFusion: lessonPageVideoFusion,
              }}
            />
          </div>
        </details>
      </div>
    </AppShell>
  );
}
