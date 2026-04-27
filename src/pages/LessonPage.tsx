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
import VideoEmbed from "../components/VideoEmbed";
import LessonStepper from "../components/LessonStepper";
import ExplainSimplerModal from "../components/ExplainSimplerModal";
import GlossaryChips from "../components/GlossaryChips";
import ContinueButton from "../components/ContinueButton";
import { getVideoForLesson } from "../data/videoMap";
import { PROFESSOR_MESSER_COURSE_INDEX, PROFESSOR_MESSER_YOUTUBE_PLAYLIST } from "../data/videoConstants";
import { getBeginnerContent } from "../utils/beginnerLayer";
import { getHighlightBuckets } from "../utils/highlightBuckets";
import { getExamIntelligence } from "../utils/examIntelFromLesson";
import { LESSON_BLOCK_ORDER, LESSON_STEP_FOCUS } from "../core/learningFlow";
import { emptyLessonNoteIntelligence, getLessonNoteIntelligence } from "../utils/lessonNoteIntelligence";
import { analyzeDraftNote, overNotingMessage } from "../core/noteAnalyzer";
import { buildLearningProfile, getAntiPassiveWarnings } from "../core/learningObserver";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import AITutorPanel from "../components/AITutorPanel";
import DailyMinimumCard from "../components/DailyMinimumCard";
import { flashExtensionIdentityForDashboard } from "../utils/outsideQuizIdentity";
import { buildLessonCompleteIdentityLine } from "../utils/identityPersonalization";

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
  const [encourageMsg, setEncourageMsg] = useState<string | null>(null);
  const [showFullDetail, setShowFullDetail] = useState(false);
  const [noteAiMsg, setNoteAiMsg] = useState<string | null>(null);

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
    setNote({ topic: "", whatItMeans: "", realLife: "", whyMatters: "", examKeyword: "", memory: "" });
    setNoteAiMsg(
      analysis.severity === "warn" ? analysis.messages.join(" ") : "Saved — tight note. Teach it once out loud.",
    );
  };

  const nxt = getNextSectionId(id) ?? null;
  const vMeta = getVideoForLesson(id);
  const beg = getBeginnerContent(L);
  const examI = getExamIntelligence(L);
  const lp = state.lessonProgress[id] ?? {};
  const teachOk = teach.trim().length >= 20 || (state.teachBack[id]?.trim().length ?? 0) >= 20;
  const handsOnOk = isLessonHandsOnComplete(id, state);
  const canMark = isLessonProgressComplete({ ...lp, teachBackDone: teachOk }, { hasLab: labs.length > 0, handsOnComplete: handsOnOk });
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
    if (wasNewCompletion && takeExtensionIdentity("lesson_complete") && L) {
      flashExtensionIdentityForDashboard(buildLessonCompleteIdentityLine(L.title, readiness.label));
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
    if (wasNewCompletion && takeExtensionIdentity("lesson_complete") && L) {
      flashExtensionIdentityForDashboard(buildLessonCompleteIdentityLine(L.title, readiness.label));
    }
    nav("/");
  };

  const twoHooks = hb.mustHighlight.slice(0, 2);

  const block = (k: (typeof LESSON_BLOCK_ORDER)[number]["key"]) => LESSON_BLOCK_ORDER.find((b) => b.key === k);
  const titleOf = (k: (typeof LESSON_BLOCK_ORDER)[number]["key"]) => {
    const b0 = block(k);
    return b0 ? `${b0.emoji} ${b0.title}` : k;
  };

  const StepSection = ({ stepIndex, k, className, children }: { stepIndex: number; k: (typeof LESSON_BLOCK_ORDER)[number]["key"]; className?: string; children: React.ReactNode }) => {
    const t = titleOf(k);
    const phase = LESSON_STEP_FOCUS[stepIndex] ?? "This step";
    const locked = state.beginnerMode && stepIndex > flowStep;
    const unlockPhase = LESSON_STEP_FOCUS[flowStep] ?? `step ${flowStep}`;
    if (locked) {
      return (
        <div className="card border-slate-700 border-dashed">
          <p className="text-slate-500 text-sm font-medium">
            Step {stepIndex}: {phase}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{t}</p>
          <p className="text-amber-200/90 text-sm mt-2">
            Finish <strong className="text-amber-100">step {flowStep}: {unlockPhase}</strong> to unlock this.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Just focus on the step above — beginner mode shows one layer at a time so you do not get lost.</p>
        </div>
      );
    }
    return (
      <section className={className ?? "card border-slate-800"} data-step={stepIndex}>
        <h2 className="text-cyan-300 font-bold text-sm uppercase">
          Step {stepIndex}: {phase}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">{t}</p>
        <p className="text-[11px] text-slate-400 mt-2 italic">Just focus on this step — scroll only when you are ready.</p>
        {state.beginnerMode && stepIndex === 1 && <p className="text-[10px] text-amber-200/80 mt-2">Do this first — the rest of the page builds on the video.</p>}
        {state.beginnerMode && stepIndex === 2 && <p className="text-[10px] text-amber-200/80 mt-2">Three to eight exam hooks, not whole paragraphs — recognition beats highlighting everything.</p>}
        {state.beginnerMode && (stepIndex === 7 || stepIndex === 8) && (
          <p className="text-[10px] text-amber-200/80 mt-2">Quiz, then flashcards — same rhythm every lesson.</p>
        )}
        {state.beginnerMode && stepIndex === 9 && <p className="text-[10px] text-amber-200/80 mt-2">How CompTIA likes to phrase traps and best answers.</p>}
        {children}
        {state.beginnerMode && stepIndex < 10 && stepIndex === flowStep && (
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
        )}
      </section>
    );
  };

  if (state.simpleLessonMode) {
    return (
      <AppShell>
        <div className="lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-8 items-start">
          <div className="space-y-10 min-w-0 pb-8">
            <DailyMinimumCard lessonId={id} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-emerald-800/45 bg-emerald-950/25 px-4 py-4">
              <div>
                <p className="text-xs uppercase text-emerald-300/90 font-bold tracking-wide">Simple lesson mode</p>
                <p className="text-sm text-slate-300 mt-1 max-w-prose">
                  Essentials only — same Messer content, less scrolling. Labs, flashcards, and exam intelligence are one tap away in the full lesson.
                </p>
              </div>
              <button type="button" className="btn w-full sm:w-auto shrink-0 touch-manipulation min-h-[48px]" onClick={() => setSimpleLessonMode(false)}>
                Show full lesson
              </button>
            </div>
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
              purpose="Short path: watch a few minutes → copy two hooks → one note → the action → a tiny quiz. Switch to the full lesson anytime for depth."
              actions={
                <div className="flex flex-wrap gap-2 justify-end">
                  <ContinueButton step={nextStep} />
                </div>
              }
            />
            <section className="card border-cyan-800/35 space-y-4">
              <h2 className="text-cyan-300 font-bold text-sm uppercase">Watch</h2>
              <VideoEmbed embedUrl={vMeta.embedUrl} title={vMeta.videoTitle} />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn text-sm touch-manipulation"
                  onClick={() => {
                    patchLessonProgress(id, { videoWatched: true, videoWatchedAt: Date.now() });
                    setEncourageMsg("Nice — video step done.");
                    window.setTimeout(() => setEncourageMsg(null), 3500);
                  }}
                >
                  Mark video watched
                </button>
                {vMeta.youtubeUrl && (
                  <a href={vMeta.youtubeUrl} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
                    Open on YouTube
                  </a>
                )}
              </div>
            </section>
            <section className="card border-amber-800/35 space-y-3">
              <h2 className="text-amber-200 font-bold text-sm uppercase">Two hooks to remember</h2>
              <p className="text-xs text-slate-500">Copy these to your notes — that is enough for this pass.</p>
              <ul className="list-disc pl-5 text-sm text-slate-200 space-y-2">
                {twoHooks.length ? twoHooks.map((x, i) => <li key={i}>{x.replace(/\*\*/g, "")}</li>) : <li className="text-slate-500">Open the full lesson for the full MUST list.</li>}
              </ul>
              <button
                type="button"
                className="btn text-sm touch-manipulation"
                onClick={() => {
                  patchLessonProgress(id, { highlightsDone: true });
                  seedHighlightMemory(id);
                  setEncourageMsg("Great — highlights checked off.");
                  window.setTimeout(() => setEncourageMsg(null), 3500);
                }}
              >
                I saved these hooks in my notes
              </button>
            </section>
            <section className="card border-violet-800/35 space-y-3">
              <h2 className="text-violet-200 font-bold text-sm uppercase">One note</h2>
              <p className="text-xs text-slate-400">{noteIntel.writeThisDown || "One row: topic, plain meaning, one exam keyword."}</p>
              <div className="grid gap-2 text-sm">
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
                <input
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                  placeholder="Exam keyword"
                  value={note.examKeyword}
                  onChange={(e) => setNote((n) => ({ ...n, examKeyword: e.target.value }))}
                />
                <button type="button" className="btn-ghost text-sm touch-manipulation" disabled={notes.length >= 5 || notesToday >= 10} onClick={saveBrain}>
                  Save note row
                </button>
              </div>
              {noteAiMsg && <p className="text-xs text-cyan-200/90">{noteAiMsg}</p>}
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
          <AITutorPanel
            className="lg:sticky lg:top-4 lg:self-start order-first lg:order-none mb-4 lg:mb-0"
            context={{
              surface: "lesson",
              lesson: aiLessonCtx,
              userProgress: { lessonProgress: lp, simpleLesson: true },
              weakAreas,
              noteDraft: note,
              noteHeuristic: draftAnalysis.messages,
              coachLines: ["Simple mode: video → two hooks → one note → action → 3-question quiz."],
            }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-8 items-start">
        <div className="space-y-10 min-w-0">
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
            purpose="Follow the numbered blocks in order. One path: video → notes → understand → test → remember."
            actions={
              <div className="flex flex-wrap gap-2 justify-end items-start">
                <button type="button" className="btn-ghost text-sm min-h-[48px] touch-manipulation" onClick={() => setSimpleLessonMode(true)}>
                  Simple lesson view
                </button>
                <ContinueButton step={nextStep} />
              </div>
            }
          >
            {antiPassive.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-800/50 bg-amber-950/25 p-3 text-sm text-amber-100/95">
                <p className="text-[10px] uppercase text-amber-200/90 font-semibold">Smart Coach — engagement</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  {antiPassive.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {!state.beginnerMode ? (
              <details className="mt-2 text-[10px] text-slate-500">
                <summary className="cursor-pointer text-slate-400 hover:text-slate-300 select-none [&::-webkit-details-marker]:hidden list-none">
                  Coach metrics (optional)
                </summary>
                <p className="mt-1 pl-1 border-l border-slate-700">
                  Observer: recall {observer.recallStrength}/100 · note quality {observer.noteQualityScore}/100 · readiness{" "}
                  {observer.examReadiness}/100
                </p>
              </details>
            ) : (
              <p className="text-[10px] text-slate-500 mt-2">
                Observer: recall {observer.recallStrength}/100 · note quality {observer.noteQualityScore}/100 · readiness{" "}
                {observer.examReadiness}/100
              </p>
            )}
          </PageHeader>

      <div className="card border-slate-700 text-sm text-slate-300">
        <h2 className="text-xs text-slate-500 uppercase tracking-wide">This lesson, in six answers</h2>
        {!state.simpleLessonMode && (
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            <span className="text-emerald-200/90 font-medium">Fast path: </span>
            step 1 video → step 7 three-question quiz (~2 min) → flashcards → complete. Optional &quot;Show more&quot; blocks are for depth, not required
            first.
          </p>
        )}
        <ul className="mt-2 space-y-1.5 list-none text-slate-200">
          <li>
            <span className="text-emerald-300 font-medium">What do I watch? </span>
            The Messer video in step 1 (pause when you add highlights in step 2).
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I highlight? </span>
            3–8 short hooks from the MUST/GOOD/SKIP list — not paragraphs.
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I write? </span>
            At least one Brain Book row in the last block; optional extra fields in full mode.
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I do? </span>
            {L.quickAction}
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I quiz? </span>
            {quizCount} mini-quiz questions tagged to this section ({id}).
          </li>
          <li>
            <span className="text-emerald-300 font-medium">What do I review next? </span>
            Flashcards for this lesson, then mark complete — the home screen Continue picks your next best move.
          </li>
        </ul>
      </div>

      <LessonStepper
        lessonId={id}
        p={lp}
        hasLab={labs.length > 0}
        labDone={lp.labDone}
        handsOnComplete={handsOnOk}
        nextHref={nxt && lessons[nxt!] ? `/lesson/${nxt}` : undefined}
      />

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
        <VideoEmbed embedUrl={vMeta.embedUrl} title={vMeta.videoTitle} />
        <ul className="mt-3 space-y-1 text-sm text-slate-300 list-disc pl-4">
          <li>Skim the first 2 minutes, then watch with pauses for highlights in step 2.</li>
          {!state.beginnerMode && (
            <>
              <li>Pause and highlight 3–8 terms in your notes in step 2.</li>
              <li>Optional: one Brain Book row in the final block.</li>
            </>
          )}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/session" className="btn-ghost text-sm">
            30-min session
          </Link>
          <button
            type="button"
            className="btn text-sm"
            onClick={() => {
              patchLessonProgress(id, { videoWatched: true, videoWatchedAt: Date.now() });
              setEncourageMsg("You're doing good — short wins add up.");
              window.setTimeout(() => setEncourageMsg(null), 4000);
            }}
          >
            Mark video watched
          </button>
          {vMeta.youtubeUrl && (
            <a href={vMeta.youtubeUrl} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
              YouTube
            </a>
          )}
          {vMeta.professorMesserPageUrl && (
            <a href={vMeta.professorMesserPageUrl} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
              Messer page
            </a>
          )}
          <a href={PROFESSOR_MESSER_COURSE_INDEX} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
            Course index
          </a>
          <a href={PROFESSOR_MESSER_YOUTUBE_PLAYLIST} className="btn-ghost text-sm" target="_blank" rel="noreferrer">
            Playlist
          </a>
          <Link to={`/watch/${id}`} className="btn-ghost text-sm">
            Guided watch
          </Link>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => {
              setBeginnerMode(true);
              setExplainOpen(true);
            }}
          >
            Need simpler explanation
          </button>
        </div>
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
            if (e.target.value.trim().length >= 20) patchLessonProgress(id, { teachBackDone: true });
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
        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2">System pick (same as Smart Coach + Continue everywhere):</p>
          <ContinueButton step={nextStep} />
        </div>
      </StepSection>
        </div>

        <AITutorPanel
          className="lg:sticky lg:top-4 lg:self-start order-first lg:order-none mb-4 lg:mb-0"
          context={{
            surface: "lesson",
            lesson: aiLessonCtx,
            userProgress: { lessonProgress: lp, teachBackLen: teach.length },
            weakAreas,
            noteDraft: note,
            noteHeuristic: draftAnalysis.messages,
            coachLines: [...antiPassive, ...draftAnalysis.messages].slice(0, 6),
          }}
        />
      </div>
    </AppShell>
  );
}
