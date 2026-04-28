import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Lesson, QuizQuestion } from "../../types";
import type { PausePromptItem } from "../../types/videoFusion";
import VideoEmbed from "../VideoEmbed";
import AITutorPanel, { type AITutorLessonContext, type AITutorPanelContext } from "../AITutorPanel";
import StatusBadge from "../StatusBadge";
import { useProgress } from "../../context/ProgressContext";
import { buildPausePromptPoolFromLesson } from "../../utils/pausePrompts";
import { questionsByLesson } from "../../data/quizzes";
import { correctAnswerLabel } from "../../utils/quizHelpers";
import { getNextSectionId } from "../../data/lessons";

export type PauseContextPayload = {
  index: number;
  item: PausePromptItem;
};

export type VideoStudyModeProps = {
  lessonId: string;
  lesson: Lesson;
  embedUrl: string;
  videoTitle: string;
  youtubeUrl?: string;
  professorMesserPageUrl?: string;
  estimatedWatchTimeMin?: number | null;
  needsVideoUrl?: boolean;
  /** Primary CTA after this block */
  continueHref: string;
  continueLabel: string;
  /** Optional PDF guide — same window, different route */
  pdfGuideHref?: string;
  pdfSearchPhrase?: string;
  pdfGuideButtonLabel?: string;
  showTutorPanel?: boolean;
  pdfGuideEyebrow?: string;
  variant: "watch-page" | "lesson-step" | "pdf-guide";
  dense?: boolean;
  /**
   * Simple lesson path — single column stack: video, one pause prompt, one note row, proof line, quick check, Continue.
   * Tutor stays on the lesson page sidebar (showTutorPanel false).
   */
  minimal?: boolean;
  /** Fires whenever the active pause prompt changes — keep Study tutor prompts in sync. */
  onPauseContextChange?: (ctx: PauseContextPayload) => void;
};

function pickQuickCheck(lessonId: string): QuizQuestion | null {
  const qs = questionsByLesson(lessonId);
  if (!qs.length) return null;
  let h = 0;
  for (let i = 0; i < lessonId.length; i++) h = (h + lessonId.charCodeAt(i) * (i + 1)) % qs.length;
  return qs[h] ?? qs[0]!;
}

export default function VideoStudyMode({
  lessonId,
  lesson,
  embedUrl,
  videoTitle,
  youtubeUrl,
  professorMesserPageUrl,
  estimatedWatchTimeMin,
  needsVideoUrl,
  continueHref,
  continueLabel,
  pdfGuideHref,
  pdfSearchPhrase,
  pdfGuideEyebrow,
  pdfGuideButtonLabel = "Open PDF guide for this lesson",
  variant,
  dense,
  showTutorPanel = true,
  minimal = false,
  onPauseContextChange,
}: VideoStudyModeProps) {
  const {
    state,
    addNote,
    patchLessonProgress,
    bumpStudyResume,
    addFlashcardFromPdfSelection,
    recordVideoFusionActivity,
  } = useProgress();

  const pausePool = useMemo(() => buildPausePromptPoolFromLesson(lesson), [lesson]);

  const [promptI, setPromptI] = useState(0);
  /** In minimal mode rotation is disabled — stays on prompt index 0 for UI + AI parity. */
  const effectiveIx = minimal ? 0 : promptI % Math.max(pausePool.length, 1);
  const currentPause: PausePromptItem = pausePool[effectiveIx] ?? {
    label: "Pause",
    prompt: pausePool[0]?.prompt ?? "Pause the video once and write what matters most for the exam.",
  };

  useEffect(() => {
    const item = pausePool[effectiveIx] ?? pausePool[0];
    if (!item) return;
    onPauseContextChange?.({ index: effectiveIx, item });
  }, [lessonId, pausePool, effectiveIx, onPauseContextChange]);

  const [mainIdea, setMainIdea] = useState("");
  const [keyword, setKeyword] = useState("");
  const [trap, setTrap] = useState("");
  const [explainAloud, setExplainAloud] = useState("");

  const notesForLesson = useMemo(() => state.notes.filter((n) => n.lessonId === lessonId), [state.notes, lessonId]);
  const lp = state.lessonProgress[lessonId] ?? {};
  const checklist = lp.videoFusionChecklist ?? {};

  const qc = useMemo(() => pickQuickCheck(lessonId), [lessonId]);
  const qcBoxRef = useRef<HTMLDivElement>(null);
  const prevQcDoneRef = useRef(false);
  const [selectedQ, setSelectedQ] = useState<number | null>(null);
  const [qcDone, setQcDone] = useState(false);
  const [qcFeedback, setQcFeedback] = useState<string | null>(null);
  const [proofBanner, setProofBanner] = useState<string | null>(null);
  const [pendingFlash, setPendingFlash] = useState<{ front: string; back: string } | null>(null);

  const [flashOpen, setFlashOpen] = useState(false);
  const [fcFront, setFcFront] = useState("");
  const [fcBack, setFcBack] = useState("");

  const [isXl, setIsXl] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const fn = () => setIsXl(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const highlightTargets = useMemo(
    () => lesson.highlightRules.slice(0, 6).map((h) => h.term),
    [lesson.highlightRules],
  );

  const weakAreas = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d}`),
    [state.domainScore],
  );

  const missedLesson = useMemo(
    () => state.missedJournal.filter((m) => m.lessonId === lessonId).slice(-4).map((m) => m.qid),
    [state.missedJournal, lessonId],
  );

  const aiLesson: AITutorLessonContext = useMemo(
    () => ({
      id: lessonId,
      title: lesson.title,
      sectionNumber: lesson.sectionNumber,
      domain: lesson.domain,
      mustHighlights: highlightTargets,
      simpleExplanation: lesson.simpleExplanation,
      instantRecognition: lesson.instantRecognition,
    }),
    [lessonId, lesson, highlightTargets],
  );

  const noteDraftCompact = useMemo(
    () => ({
      topic: keyword || "(keyword)",
      whatItMeans: mainIdea,
      realLife: explainAloud,
      whyMatters: trap,
      examKeyword: keyword,
      memory: explainAloud,
    }),
    [keyword, mainIdea, trap, explainAloud],
  );

  const tutorCtx: AITutorPanelContext = useMemo(() => {
    const sectionLabel = `${lesson.title}${lesson.sectionNumber ? ` (${lesson.sectionNumber})` : ""}`;
    return {
      surface: "lesson" as const,
      lesson: aiLesson,
      weakAreas,
      coachLines: [
        `Pause · ${currentPause.label}: ${currentPause.prompt}`,
        `Hooks: ${highlightTargets.slice(0, 4).join(" · ")}`,
        missedLesson.length ? `Recent quiz misses in this lesson: ${missedLesson.length}` : "",
      ].filter(Boolean),
      noteDraft: noteDraftCompact,
      userProgress: {
        lessonProgress: lp,
        videoFusionMode: true,
        pausePromptIndex: effectiveIx,
        currentPauseLabel: currentPause.label,
        currentPausePrompt: currentPause.prompt,
        optionalTimecodePlaceholder: currentPause.optionalTimecode,
        highlightTargets,
        ...(missedLesson.length ? { recentMissQuestionIds: missedLesson } : {}),
      },
      videoFusion: {
        pausePrompt: currentPause.prompt,
        sectionLabel,
        highlightTargets,
      },
    };
  }, [
    aiLesson,
    weakAreas,
    currentPause,
    highlightTargets,
    lesson.title,
    lesson.sectionNumber,
    noteDraftCompact,
    lp,
    effectiveIx,
    missedLesson,
  ]);

  const saveFusionNote = useCallback(() => {
    const trimmedK = keyword.trim();
    const trimmedMain = mainIdea.trim();
    if (!trimmedK || trimmedMain.length < 8) {
      setProofBanner(null);
      setQcFeedback("Add a keyword and a short main idea (your words, ≥8 chars).");
      return;
    }
    addNote({
      id: crypto.randomUUID(),
      lessonId,
      topic: trimmedK.slice(0, 80),
      whatItMeans: trimmedMain.slice(0, 500),
      realLife: "Video fusion note",
      whyMatters: trap.trim().slice(0, 240) || "Exam trap awareness",
      examKeyword: trimmedK.slice(0, 120),
      memory: explainAloud.trim().slice(0, 240) || "Say it plainly",
      created: Date.now(),
    });
    patchLessonProgress(lessonId, {
      videoFusionChecklist: { ...checklist, wroteOneNote: true },
      highlightsDone: true,
      ...(minimal ?
        {
          notesSaved: true,
          videoWatched: true,
          videoWatchedAt: Date.now(),
        }
      : {}),
    });
    bumpStudyResume({ watchLessonId: lessonId, videoNotesLessonId: lessonId });
    recordVideoFusionActivity(lessonId, "note_saved", { notePreview: `${trimmedK}: ${trimmedMain.slice(0, 120)}` });
    const sugFront = `What does ${trimmedK} mean?`;
    const sugBack = trimmedMain.slice(0, 400);
    setPendingFlash({ front: sugFront, back: sugBack });
    setFcFront(sugFront);
    setFcBack(sugBack);
    setQcFeedback(null);
    setProofBanner("Good — now prove it with one question.");
    window.requestAnimationFrame(() => {
      qcBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [
    addNote,
    bumpStudyResume,
    checklist,
    explainAloud,
    keyword,
    lessonId,
    mainIdea,
    minimal,
    patchLessonProgress,
    recordVideoFusionActivity,
    trap,
  ]);

  /** After first quick-check submit, offer flashcard with saved suggestion — proof before cards. */
  useEffect(() => {
    const becameDone = qcDone && !prevQcDoneRef.current;
    prevQcDoneRef.current = qcDone;
    if (!becameDone || !pendingFlash) return;
    setFlashOpen(true);
    setProofBanner(null);
  }, [qcDone, pendingFlash]);

  const submitQuickCheck = useCallback(() => {
    if (!qc || selectedQ === null) return;
    setProofBanner(null);
    const ok = selectedQ === qc.correctIndex;
    patchLessonProgress(lessonId, {
      videoFusionChecklist: { ...checklist, quickCheckAttempted: true, quickCheckPassed: ok },
    });
    recordVideoFusionActivity(lessonId, ok ? "quick_check_pass" : "quick_check_wrong", { qid: qc.id });
    setQcDone(true);
    if (ok) {
      setQcFeedback("You captured the right idea.");
    } else {
      setQcFeedback("Review your note — add the missing keyword.");
    }
  }, [checklist, lessonId, patchLessonProgress, qc, recordVideoFusionActivity, selectedQ]);

  const allCheckComplete =
    !!(
      checklist.paused &&
      (checklist.wroteOneNote || notesForLesson.length > 0) &&
      checklist.saidAloud &&
      checklist.quickCheckAttempted
    );

  const finishFusionLoop = useCallback(() => {
    patchLessonProgress(lessonId, {
      videoWatched: true,
      videoWatchedAt: Date.now(),
      notesSaved: true,
      highlightsDone: true,
    });
    recordVideoFusionActivity(lessonId, "fusion_loop_complete");
    bumpStudyResume({ videoNotesLessonId: lessonId, watchLessonId: lessonId });
  }, [bumpStudyResume, lessonId, patchLessonProgress, recordVideoFusionActivity]);

  const nextAfterWatch = variant === "watch-page" && getNextSectionId(lessonId);

  const pauseHeader = (
    <>
      {!minimal ? (
        <p className="text-[11px] text-slate-500 mb-1">
          Prompt <span className="text-emerald-200/95 font-semibold">{currentPause.label}</span>
          {currentPause.optionalTimecode != null && (
            <span className="text-slate-600"> · time sync later</span>
          )}
        </p>
      ) : (
        <p className="text-[11px] font-bold uppercase text-emerald-200/95 tracking-wide">Pause prompt</p>
      )}
      <p className="text-sm font-medium text-white border-l-2 border-amber-400/90 pl-2">Pause here and answer this:</p>
      <p className="text-slate-200 text-sm leading-relaxed">{currentPause.prompt}</p>
    </>
  );

  const showNextRotate = !minimal && pausePool.length > 1;

  const outerGrid = minimal ? "flex flex-col gap-4 max-w-2xl" : "grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] xl:gap-8 xl:items-start";

  const mobileCue =
    minimal ? (
      <p className="text-xs text-slate-500 rounded-lg border border-emerald-800/35 bg-emerald-950/20 px-3 py-2 leading-snug xl:hidden">
        <strong className="text-emerald-200/95">Phone:</strong> Watch first. Then pause and write{" "}
        <span className="text-white font-medium">one</span> note below. AI tutor stays collapsed until you open it (sidebar optional).
      </p>
    ) : (
      <p className="text-xs text-slate-500 xl:hidden rounded-lg border border-cyan-800/35 bg-cyan-950/20 px-3 py-2 leading-relaxed">
        <strong className="text-white/95">Phone:</strong> Watch first. Then pause and write{" "}
        <strong className="text-emerald-200/95 font-semibold">one</strong> note. Tutor collapses unless you open it below.
      </p>
    );

  return (
    <>
      <div className={outerGrid}>
        <div className={`min-w-0 ${dense ? "space-y-3" : "space-y-4"} ${minimal ? "" : "order-1"}`}>
          {mobileCue}
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50">
            <VideoEmbed embedUrl={embedUrl} title={videoTitle} />
          </div>
          {(needsVideoUrl || estimatedWatchTimeMin != null) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {needsVideoUrl ? <StatusBadge tone="warn">Verify video URL</StatusBadge> : null}
              {estimatedWatchTimeMin != null ?
                <span className="text-slate-500">~{estimatedWatchTimeMin} min · Professor Messer</span>
              : null}
            </div>
          )}
          {!minimal && (
            <div className="flex flex-wrap gap-2">
              {youtubeUrl && (
                <a href={youtubeUrl} className="btn-ghost text-sm min-h-[44px] touch-manipulation" target="_blank" rel="noreferrer">
                  Open on YouTube
                </a>
              )}
              {professorMesserPageUrl && (
                <a href={professorMesserPageUrl} className="btn-ghost text-sm min-h-[44px] touch-manipulation" target="_blank" rel="noreferrer">
                  Messer course page
                </a>
              )}
              <button
                type="button"
                className="btn-ghost text-sm min-h-[44px] touch-manipulation"
                onClick={() => {
                  patchLessonProgress(lessonId, { videoWatched: true, videoWatchedAt: Date.now() });
                  bumpStudyResume({ watchLessonId: lessonId });
                }}
              >
                Mark video watched (quick)
              </button>
            </div>
          )}
          {/* Mobile: stacked pause when not minimal — minimal pauses inline in column below */}
          {!minimal && (
            <section className="xl:hidden rounded-xl border border-emerald-800/35 bg-emerald-950/15 px-3 py-3 space-y-2">
              {pauseHeader}
              {showNextRotate && (
                <button
                  type="button"
                  className="btn-ghost text-sm min-h-[44px] w-full touch-manipulation"
                  onClick={() => setPromptI((i) => i + 1)}
                >
                  Next pause prompt →
                </button>
              )}
            </section>
          )}
        </div>

        <aside className={`min-w-0 space-y-4 ${minimal ? "" : "order-2 xl:sticky xl:top-4 xl:self-start"}`}>
          {minimal && (
            <section className="rounded-xl border border-emerald-800/35 bg-emerald-950/15 px-3 py-3 space-y-2">
              {pauseHeader}
              {minimal && <p className="text-[11px] text-slate-500">Stay on this cue — full lesson rotates prompts.</p>}
            </section>
          )}

          {!minimal && (
            <div className="hidden xl:block rounded-xl border border-emerald-800/35 bg-emerald-950/15 px-3 py-3 space-y-2">
              <p className="text-[11px] font-bold uppercase text-emerald-200/95 tracking-wide">Pause here and answer this</p>
              {pauseHeader}
              {showNextRotate && (
                <button type="button" className="btn-ghost text-sm min-h-[44px] w-full touch-manipulation" onClick={() => setPromptI((i) => i + 1)}>
                  Next pause prompt →
                </button>
              )}
            </div>
          )}

          {pdfGuideHref && !minimal ?
            <div className="rounded-xl border border-cyan-800/35 bg-cyan-950/20 px-3 py-3 space-y-2">
              <p className="text-[11px] font-bold uppercase text-cyan-200/90 tracking-wide">Follow this in your PDF</p>
              {pdfGuideEyebrow && <p className="text-xs text-slate-500">{pdfGuideEyebrow}</p>}
              <p className="text-xs text-slate-400">
                Suggested PDF search:&nbsp;
                <span className="text-white font-medium">&quot;{pdfSearchPhrase ?? lesson.title}&quot;</span>
              </p>
              <Link to={pdfGuideHref} className="btn w-full text-center min-h-[48px] touch-manipulation inline-flex items-center justify-center">
                {pdfGuideButtonLabel}
              </Link>
            </div>
          : pdfGuideHref && minimal ?
            <div className="rounded-xl border border-cyan-800/35 bg-cyan-950/20 px-3 py-2 space-y-1">
              <Link to={pdfGuideHref} className="btn-ghost text-sm w-full text-center min-h-[44px] touch-manipulation">
                PDF guide (optional) →
              </Link>
              <p className="text-[10px] text-slate-500">Thin path — fusion is note + quiz first.</p>
            </div>
          : null}

          <div className="rounded-xl border border-slate-700 bg-slate-900/45 p-3 space-y-3">
            <p className="text-[11px] font-bold uppercase text-amber-200/95 tracking-wide">Write ONE note</p>
            <p className="text-xs text-slate-500 italic">Don’t write everything. Catch the trigger.</p>

            {!minimal && (
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                <li>What did Messer just explain?</li>
                <li>What keyword matters?</li>
                <li>What exam trap could show up?</li>
                <li>Can you explain it without looking?</li>
              </ul>
            )}

            <label className="block text-xs text-slate-500">Main idea (your words)</label>
            <textarea
              className={minimal ? "w-full min-h-[56px] rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm text-slate-100" : "w-full min-h-[72px] rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm text-slate-100"}
              placeholder={minimal ? "One short retrieval line." : "One or two sentences — recognition, not transcription."}
              value={mainIdea}
              onChange={(e) => setMainIdea(e.target.value)}
              autoComplete="off"
            />

            <label className="block text-xs text-slate-500">Exam keyword</label>
            <input
              className="w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm"
              placeholder={minimal ? "One trigger word / acronym" : "Exact word STEM might use"}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              autoComplete="off"
            />

            {!minimal ?
              <>
                <label className="block text-xs text-slate-500">Likely trap / confusion</label>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm"
                  placeholder="e.g. vs similar control / port / protocol"
                  value={trap}
                  onChange={(e) => setTrap(e.target.value)}
                  autoComplete="off"
                />
                <label className="block text-xs text-slate-500">Say it simply (no looking)</label>
                <textarea
                  className="w-full min-h-[56px] rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm"
                  placeholder="One breath — optional but powerful"
                  value={explainAloud}
                  onChange={(e) => setExplainAloud(e.target.value)}
                  autoComplete="off"
                />
              </>
            : (
              <details className="text-xs text-slate-500 rounded-lg border border-slate-800 bg-slate-950/40">
                <summary className="cursor-pointer px-2 py-2 touch-manipulation min-h-[40px] list-none [&::-webkit-details-marker]:hidden text-slate-400">
                  More (trap / say aloud) — optional
                </summary>
                <div className="space-y-2 pb-2">
                  <input
                    className="w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm"
                    placeholder="Trap / confusion pair"
                    value={trap}
                    onChange={(e) => setTrap(e.target.value)}
                  />
                  <textarea
                    className="w-full min-h-[48px] rounded-lg bg-slate-950 border border-slate-600 px-3 py-2 text-sm"
                    placeholder="Say it in one breath"
                    value={explainAloud}
                    onChange={(e) => setExplainAloud(e.target.value)}
                  />
                </div>
              </details>
            )}

            <button type="button" className="btn w-full min-h-[48px] touch-manipulation" onClick={saveFusionNote}>
              {minimal ? "Save note · then prove it" : "Save this video note → proof question"}
            </button>

            {proofBanner && (
              <p className="text-sm text-emerald-200/95 border border-emerald-700/35 bg-emerald-950/25 rounded-lg px-3 py-2" role="status">
                {proofBanner}
              </p>
            )}

            {!minimal && (
              <details className="text-xs text-slate-500 rounded-lg border border-slate-800 bg-slate-950/40">
                <summary className="cursor-pointer px-2 py-2 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden list-none font-medium text-slate-400">
                  Smart note rules
                </summary>
                <div className="px-3 pb-3 pt-1 border-t border-slate-800 space-y-2">
                  <div>
                    <p className="font-semibold text-emerald-200/95">Good note</p>
                    <ul className="list-disc pl-4 text-slate-400 mt-1 space-y-0.5">
                      <li>Short</li>
                      <li>In your own words</li>
                      <li>Contains keyword</li>
                      <li>Contains exam trigger</li>
                      <li>Can become flashcard</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-rose-200/90">Weak note</p>
                    <ul className="list-disc pl-4 text-slate-500 mt-1 space-y-0.5">
                      <li>Copied sentence</li>
                      <li>Too long</li>
                      <li>Vague — no keyword</li>
                      <li>No exam use</li>
                    </ul>
                  </div>
                </div>
              </details>
            )}
          </div>

          {qc && (
            <div ref={qcBoxRef} className="rounded-xl border border-slate-700 bg-slate-900/35 p-3 space-y-2 scroll-mt-24">
              <p className="text-[11px] font-bold uppercase text-slate-300 tracking-wide">Quick check</p>
              <p className="text-sm text-slate-400">One retrieval question — same lesson bank as quizzes.</p>
              <p className="text-sm text-slate-200">{qc.text}</p>
              <ul className="space-y-1">
                {qc.options.map((opt, i) => (
                  <li key={`${qc.id}-${i}`}>
                    <button
                      type="button"
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg border min-h-[44px] touch-manipulation ${
                        selectedQ === i ?
                          "border-emerald-500 bg-emerald-950/30 text-white"
                        : "border-slate-700 bg-slate-950/40 text-slate-200"
                      }`}
                      onClick={() => !qcDone && setSelectedQ(i)}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
              {!qcDone && (
                <button type="button" className="btn text-sm min-h-[48px] w-full touch-manipulation" disabled={selectedQ === null} onClick={submitQuickCheck}>
                  Check answer
                </button>
              )}
              {qcDone && qcFeedback && (
                <p className={`text-sm mt-2 ${qcFeedback.startsWith("You") ? "text-emerald-200/95" : "text-amber-200/95"}`} role="status">
                  {qcFeedback}
                  {qcDone && checklist.quickCheckPassed && (
                    <>
                      {" "}
                      Correct:&nbsp;
                      <span className="text-white font-medium">{correctAnswerLabel(qc)}</span>
                    </>
                  )}
                  {qcDone && !checklist.quickCheckPassed && (
                    <span className="block text-[11px] text-slate-500 mt-1">Peek at wording, then tighten your keyword line.</span>
                  )}
                </p>
              )}
            </div>
          )}

          {!minimal && (
            <div className="rounded-xl border border-violet-800/35 bg-violet-950/15 px-3 py-3 space-y-2">
              <p className="text-[11px] font-bold uppercase text-violet-200/95 tracking-wide">Video pause checklist</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="vf-pause"
                    className="mt-1 h-5 w-5 shrink-0 touch-manipulation"
                    checked={!!checklist.paused}
                    aria-checked={checklist.paused ? "true" : "false"}
                    onChange={(e) =>
                      patchLessonProgress(lessonId, { videoFusionChecklist: { ...checklist, paused: e.target.checked } })
                    }
                  />
                  <label htmlFor="vf-pause" className="text-slate-200">
                    I paused to think
                  </label>
                </li>
                <li className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="vf-note"
                    className="mt-1 h-5 w-5 shrink-0 touch-manipulation pointer-events-none opacity-90"
                    checked={!!checklist.wroteOneNote || notesForLesson.length > 0}
                    readOnly
                    tabIndex={-1}
                    aria-checked={checklist.wroteOneNote || notesForLesson.length > 0 ? "true" : "false"}
                  />
                  <label htmlFor="vf-note" className="text-slate-200">
                    I wrote one note
                    <span className="block text-[11px] text-slate-500">Checked when you save a video note above.</span>
                  </label>
                </li>
                <li className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="vf-say"
                    className="mt-1 h-5 w-5 shrink-0 touch-manipulation"
                    checked={!!checklist.saidAloud}
                    aria-checked={checklist.saidAloud ? "true" : "false"}
                    onChange={(e) =>
                      patchLessonProgress(lessonId, { videoFusionChecklist: { ...checklist, saidAloud: e.target.checked } })
                    }
                  />
                  <label htmlFor="vf-say" className="text-slate-200">
                    I said it out loud once
                  </label>
                </li>
                <li className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="vf-qc"
                    className="mt-1 h-5 w-5 shrink-0 touch-manipulation pointer-events-none opacity-90"
                    checked={!!checklist.quickCheckAttempted}
                    readOnly
                    tabIndex={-1}
                    aria-checked={checklist.quickCheckAttempted ? "true" : "false"}
                  />
                  <label htmlFor="vf-qc" className="text-slate-200">
                    I answered the quick check
                    <span className="block text-[11px] text-slate-500">Checked after you tap Check answer.</span>
                  </label>
                </li>
              </ul>
              {allCheckComplete && (
                <button type="button" className="btn w-full mt-2 min-h-[48px] touch-manipulation" onClick={finishFusionLoop}>
                  Save video study progress · update lesson checkpoints
                </button>
              )}
            </div>
          )}

          <div className="rounded-xl border border-slate-700 bg-slate-900/35 p-3 flex flex-col gap-2">
            <Link className="btn w-full text-center min-h-[48px] touch-manipulation inline-flex items-center justify-center" to={continueHref}>
              {continueLabel}
            </Link>
            {variant === "watch-page" && nextAfterWatch ?
              <Link className="btn-ghost text-sm text-center min-h-[44px] touch-manipulation" to={`/watch/${nextAfterWatch}`}>
                Next guided watch →
              </Link>
            : null}
            {!minimal && (
              <Link to={`/quiz/${lessonId}`} className="btn-ghost text-sm text-center min-h-[44px] touch-manipulation border border-slate-600">
                Full lesson quiz →
              </Link>
            )}
            {minimal && (
              <Link to={`/quiz/${lessonId}?quick=3`} className="btn-ghost text-sm text-center min-h-[44px] touch-manipulation border border-slate-600">
                Quick quiz (3) →
              </Link>
            )}
          </div>

          {showTutorPanel ?
            isXl ?
              <AITutorPanel
                variant={variant === "pdf-guide" ? "compact" : "full"}
                className="shadow-lg"
                context={tutorCtx}
              />
            : <details className="rounded-2xl border border-violet-900/45 bg-violet-950/15 shadow-lg">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-violet-100 touch-manipulation min-h-[52px] flex items-center [&::-webkit-details-marker]:hidden list-none">
                  Study tutor (optional AI — collapsed on phone)
                </summary>
                <div className="px-2 pb-3">
                  <AITutorPanel variant="compact" className="!border-0" context={tutorCtx} />
                </div>
              </details>
          : null}
        </aside>
      </div>

      {flashOpen && pendingFlash && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" role="dialog" aria-labelledby="vf-fl-title" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <p id="vf-fl-title" className="font-semibold text-white text-lg">
              Turn this into a flashcard?
            </p>
            <p className="text-xs text-slate-400">After your proof check — tighten wording, then save.</p>
            <label className="block text-xs text-slate-500">Front</label>
            <input className="w-full rounded-lg bg-slate-950 border px-3 py-2 text-sm" value={fcFront} onChange={(e) => setFcFront(e.target.value)} />
            <label className="block text-xs text-slate-500">Back</label>
            <textarea className="w-full rounded-lg bg-slate-950 border px-3 py-2 text-sm min-h-[72px]" value={fcBack} onChange={(e) => setFcBack(e.target.value)} />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                className="btn flex-1 min-h-[48px]"
                onClick={() => {
                  if (fcFront.trim() && fcBack.trim()) {
                    addFlashcardFromPdfSelection(lessonId, fcFront.trim(), fcBack.trim());
                    recordVideoFusionActivity(lessonId, "flashcard_from_note");
                  }
                  setFlashOpen(false);
                  setPendingFlash(null);
                }}
              >
                Save flashcard
              </button>
              <button
                type="button"
                className="btn-ghost flex-1 min-h-[48px]"
                onClick={() => {
                  setFlashOpen(false);
                  setPendingFlash(null);
                }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
