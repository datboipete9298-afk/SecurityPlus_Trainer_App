import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import AITutorPanel from "../components/AITutorPanel";
import HighlightPanel from "../components/pdfGuide/HighlightPanel";
import NotePanel from "../components/pdfGuide/NotePanel";
import CheckpointPanel from "../components/pdfGuide/CheckpointPanel";
import PdfCoachPanel from "../components/pdfGuide/PdfCoachPanel";
import VoiceExplainPanel from "../components/pdfGuide/VoiceExplainPanel";
import LocalPdfOpenButton from "../components/pdfGuide/LocalPdfOpenButton";
import { getVideoForLesson } from "../data/videoMap";
import VideoStudyMode from "../components/video/VideoStudyMode";
import { getPdfRegistryEntry } from "../data/pdfRegistry";
import { getPdfGuideSection, pdfGuideSectionKey } from "../data/pdfGuides";
import { getPdfPageMapEntry } from "../data/pdfGuides/pdfPageMap";
import { lessons } from "../data/lessons";
import { flashcards } from "../data/flashcards";
import { useProgress } from "../context/ProgressContext";
import ContinueButton from "../components/ContinueButton";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import { examReadiness } from "../utils/adaptive";

export default function PdfLessonGuidePage() {
  const { pdfId = "", lessonId = "" } = useParams<{ pdfId: string; lessonId: string }>();
  const entry = getPdfRegistryEntry(pdfId);
  const guide = getPdfGuideSection(pdfId, lessonId);
  const {
    state,
    nextStep,
    touchPdfGuideSession,
    addPdfHighlight,
    removePdfHighlight,
    setPdfCheckpoint,
    markPdfInterruptSeen,
    completePdfGuideSection,
    addFlashcardFromPdfSelection,
    bumpStudyResume,
  } = useProgress();

  const sectionKey = pdfGuideSectionKey(pdfId, lessonId);
  const prog = state.pdfLibrary?.bySection[sectionKey];
  const pdfMetaForId = pdfId ? state.pdfLibrary?.localFileMeta?.[pdfId] : undefined;
  const pdfAdded = !!pdfMetaForId;
  const pageMap = useMemo(() => getPdfPageMapEntry(pdfId, lessonId), [pdfId, lessonId]);
  const searchPhrase = pageMap?.searchPhrase ?? guide?.sectionTitle ?? "";

  const [quizI, setQuizI] = useState(0);
  const [quizReveal, setQuizReveal] = useState(false);
  const [flashFront, setFlashFront] = useState("");
  const [flashBack, setFlashBack] = useState("");
  const vid = useMemo(() => getVideoForLesson(lessonId), [lessonId]);
  const mq = guide?.miniQuiz?.[quizI];

  useEffect(() => {
    if (entry && guide) touchPdfGuideSession(pdfId, lessonId);
  }, [entry, guide, pdfId, lessonId, touchPdfGuideSession]);

  useEffect(() => {
    if (!guide) return;
    bumpStudyResume({
      pdfGuidePdfId: pdfId,
      pdfGuideLessonId: lessonId,
      pdfGuideSectionTitle: guide.sectionTitle,
    });
  }, [bumpStudyResume, guide, pdfId, lessonId]);

  const prevQuizReveal = useRef(false);
  useEffect(() => {
    const already = !!prog?.checkpointsDone?.miniQuiz;
    if (quizReveal && !prevQuizReveal.current && mq && !already) {
      setPdfCheckpoint(pdfId, lessonId, "miniQuiz", true);
    }
    prevQuizReveal.current = quizReveal;
  }, [quizReveal, mq, quizI, pdfId, lessonId, setPdfCheckpoint, prog?.checkpointsDone?.miniQuiz]);

  const readiness = useMemo(() => examReadiness(state), [state]);

  const linkedCards = useMemo(() => {
    if (!guide) return [];
    return guide.linkedFlashcardIds.map((id) => flashcards.find((c) => c.id === id)).filter(Boolean);
  }, [guide]);

  if (!entry || entry.type === "exams") {
    return <Navigate to={`/pdf-guides/${pdfId}`} replace />;
  }
  if (!guide) {
    return (
      <AppShell>
        <p className="text-slate-400">No guide for this lesson in this PDF track.</p>
        <Link to={`/pdf-guides/${pdfId}`} className="text-emerald-400 underline mt-4 inline-block">
          Back
        </Link>
      </AppShell>
    );
  }

  const L = lessons[lessonId];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-4 pb-32 lg:pb-6">
      <FlowPrimaryStrip>
        {!pdfAdded ? (
          <Link
            to={`/pdf-setup?need=${encodeURIComponent(pdfId)}`}
            className="btn w-full text-center min-h-[48px] touch-manipulation inline-block"
          >
            Add PDF first →
          </Link>
        ) : (
          <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />
        )}
      </FlowPrimaryStrip>
      {pdfAdded && pdfMetaForId ?
        <p className="text-xs text-emerald-100/95 rounded-lg border border-emerald-800/45 bg-emerald-950/30 px-3 py-2.5 leading-relaxed" role="status">
          <strong className="text-emerald-200">This guide matches your uploaded PDF:</strong>{" "}
          <span className="text-white/95 font-medium">{pdfMetaForId.name}</span>
          <span className="text-emerald-200/90"> — search and highlights target this file.</span>
        </p>
      : !pdfAdded ?
        <p className="text-xs text-amber-100/95 rounded-lg border border-amber-800/45 bg-amber-950/25 px-3 py-2.5 leading-relaxed">
          <strong className="text-amber-200">No matching PDF on device yet:</strong> add the right Messer/Publisher file in PDF setup —
          searches feel wrong when the booklet doesn&apos;t match.
        </p>
      : null}
      <p className="text-xs text-cyan-100/90 md:hidden rounded-lg border border-cyan-800/40 bg-cyan-950/25 px-3 py-2 leading-relaxed">
        <strong className="text-cyan-50">Phone:</strong> Open PDF → Highlights bar below → back here.
      </p>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="min-w-0 space-y-4 order-2 lg:order-1">
          <PageHeader
            title={guide.sectionTitle}
            purpose={`${entry.title} · Domain ${guide.domain} · Copy the phrase below into your PDF search.`}
            actions={
              <div className="flex flex-col gap-2 items-stretch sm:items-end">
                <LocalPdfOpenButton pdfId={pdfId} page={pageMap?.startPage} className="w-full sm:w-auto">
                  Open PDF
                </LocalPdfOpenButton>
              </div>
            }
          />

          <section className="rounded-xl border border-cyan-800/35 bg-cyan-950/15 p-4 space-y-2">
            <h2 className="text-xs font-bold text-cyan-200 uppercase tracking-wide">Search in your PDF</h2>
            <p className="text-sm text-slate-200">
              <span className="font-medium text-white">&quot;{searchPhrase}&quot;</span>
            </p>
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer text-slate-400 touch-manipulation py-1 [&::-webkit-details-marker]:hidden list-none">
                ▸ Page hint
              </summary>
              {pageMap ?
                <p className="mt-1 text-slate-400">
                  About pp. {pageMap.startPage}–{pageMap.endPage} (editions vary).
                </p>
              : <p className="mt-1">{guide.locatorHint}</p>}
            </details>
          </section>

          {L?.hasFullContent && vid.embedUrl ?
            <div className="rounded-2xl border border-emerald-800/35 bg-emerald-950/10 p-2 sm:p-3">
              <VideoStudyMode
                dense
                showTutorPanel={false}
                lessonId={lessonId}
                lesson={L}
                variant="pdf-guide"
                embedUrl={vid.embedUrl}
                videoTitle={vid.videoTitle}
                youtubeUrl={vid.youtubeUrl}
                professorMesserPageUrl={vid.professorMesserPageUrl}
                estimatedWatchTimeMin={vid.estimatedWatchTimeMin ?? null}
                needsVideoUrl={!!vid.needsVideoUrl}
                pdfGuideHref={`/watch/${lessonId}`}
                pdfGuideButtonLabel="Open guided watch (fusion layout)"
                pdfSearchPhrase={searchPhrase}
                pdfGuideEyebrow="Same section — hear it, pause, jot one hook, then match it in PDF."
                continueHref={`/quiz/${lessonId}`}
                continueLabel="Lesson quiz → verify recall"
              />
            </div>
          : null}

          <div className="flex flex-wrap gap-2">
            <Link to={`/lesson/${lessonId}`} className="btn-ghost text-sm min-h-[44px]">
              Lesson →
            </Link>
            <Link to={`/watch/${lessonId}`} className="btn-ghost text-sm min-h-[44px]">
              Watch →
            </Link>
            <Link to={`/quiz/${lessonId}?quick=3`} className="btn-ghost text-sm min-h-[44px]">
              Quick quiz →
            </Link>
            <Link to={`/flashcards?lesson=${encodeURIComponent(lessonId)}`} className="btn-ghost text-sm min-h-[44px]">
              Flashcards →
            </Link>
          </div>

          <section className="card space-y-2">
            <h2 className="text-sm font-semibold text-white">Summary</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{guide.summary}</p>
            <div>
              <p className="text-xs text-slate-500 uppercase mb-1">Key concepts</p>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-0.5">
                {guide.keyConcepts.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="card space-y-2 text-sm text-slate-300">
            <h2 className="text-sm font-semibold text-white">Exam angle</h2>
            <p>
              <span className="text-rose-300/90 font-medium">Trap: </span>
              {guide.examTrap}
            </p>
            <p>
              <span className="text-cyan-300/90 font-medium">ELI10: </span>
              {guide.explainLikeImDumb}
            </p>
            <p>
              <span className="text-emerald-300/90 font-medium">Real world: </span>
              {guide.realWorldExample}
            </p>
            <p>
              <span className="text-violet-300/90 font-medium">Memory: </span>
              {guide.memoryTrick}
            </p>
            <p>
              <span className="text-amber-300/90 font-medium">Quick check: </span>
              {guide.quickCheck}
            </p>
          </section>
        </div>

        <div className="min-w-0 space-y-4 order-1 lg:order-2 lg:sticky lg:top-4">
          <PdfCoachPanel guide={guide} interruptSeen={prog?.interruptSeen ?? {}} onSeen={(k) => markPdfInterruptSeen(pdfId, lessonId, k)} />

          <div id="highlight-coach" className="scroll-mt-28">
            <HighlightPanel
              mustList={guide.mustHighlight}
              shouldList={guide.shouldHighlight}
              doNotList={guide.doNotHighlight}
              highlights={prog?.highlights ?? []}
              warnOverAt={6}
              onAdd={(s) => addPdfHighlight(pdfId, lessonId, s)}
              onRemove={(i) => removePdfHighlight(pdfId, lessonId, i)}
            />
          </div>

          <section className="rounded-xl border border-slate-700 bg-slate-900/35 p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Flashcard from highlight</h3>
            <p className="text-xs text-slate-500">Turn a saved hook into a user card (edit before save).</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                className="rounded-lg bg-slate-900 border border-slate-600 px-2 py-2 text-sm min-h-[44px]"
                placeholder="Front (term)"
                value={flashFront}
                onChange={(e) => setFlashFront(e.target.value)}
              />
              <input
                className="rounded-lg bg-slate-900 border border-slate-600 px-2 py-2 text-sm min-h-[44px]"
                placeholder="Back (meaning)"
                value={flashBack}
                onChange={(e) => setFlashBack(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn text-sm min-h-[44px]"
              onClick={() => {
                addFlashcardFromPdfSelection(lessonId, flashFront, flashBack);
                setFlashFront("");
                setFlashBack("");
              }}
            >
              Save flashcard
            </button>
          </section>

          <section id="pdf-mini-check" className="card space-y-2 scroll-mt-28">
            <h2 className="text-sm font-semibold text-white">Mini-check (in-app bank)</h2>
            {mq ? (
              <>
                <p className="text-sm text-slate-200">{mq.question}</p>
                <ul className="space-y-1 text-sm text-slate-300">
                  {mq.choices.map((c, i) => (
                    <li key={i}>
                      {String.fromCharCode(65 + i)}. {c}
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn-ghost text-sm min-h-[44px] touch-manipulation" onClick={() => setQuizReveal((r) => !r)}>
                  {quizReveal ? "Hide answer" : "Show answer"}
                </button>
                {quizReveal && (
                  <p className="text-emerald-200/90 text-sm">Keyed: {String.fromCharCode(65 + mq.correctIndex)} — open full quiz for explanation.</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn-ghost text-xs min-h-[44px]"
                    onClick={() => {
                      setQuizI((i) => Math.max(0, i - 1));
                      setQuizReveal(false);
                    }}
                  >
                    Prev Q
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs min-h-[44px]"
                    onClick={() => {
                      setQuizI((i) => Math.min(guide.miniQuiz.length - 1, i + 1));
                      setQuizReveal(false);
                    }}
                  >
                    Next Q
                  </button>
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm">No mapped questions — open lesson quiz.</p>
            )}
            <Link to={`/quiz/${lessonId}`} className="btn text-sm inline-block text-center min-h-[44px]">
              Full lesson quiz →
            </Link>
          </section>

          <section className="card space-y-2">
            <h2 className="text-sm font-semibold text-white">Linked flashcards</h2>
            <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
              {linkedCards.map((c) =>
                c ? (
                  <li key={c.id}>
                    {c.front} → <span className="text-slate-500">{c.id}</span>
                  </li>
                ) : null,
              )}
            </ul>
          </section>

          <NotePanel lessonId={lessonId} writeThisDown={guide.writeThisDown} />

          <CheckpointPanel checkpointsDone={prog?.checkpointsDone ?? {}} onSet={(id, d) => setPdfCheckpoint(pdfId, lessonId, id, d)} />

          <VoiceExplainPanel guide={guide} />

          <details className="rounded-2xl border border-violet-900/45 bg-violet-950/15 group">
            <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-violet-100 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="text-violet-400/90 mr-2 group-open:rotate-90 transition-transform inline-block">▸</span>
              Ask something (optional)
            </summary>
            <div className="p-2 pt-0">
              <AITutorPanel
                className="!border-0 rounded-xl bg-violet-950/20"
                context={{
                  surface: "lesson",
                  lesson: L
                    ? {
                        id: L.id,
                        title: L.title,
                        sectionNumber: L.sectionNumber,
                        domain: L.domain,
                        mustHighlights: guide.mustHighlight,
                        examTraps: L.examTraps?.map((t) => ({ a: t.a, b: t.b })),
                        instantRecognition: L.instantRecognition,
                        noteIntelLines: guide.keyConcepts,
                        simpleExplanation: guide.explainLikeImDumb,
                      }
                    : undefined,
                  userProgress: {
                    readiness: readiness.score,
                    pdfGuideKey: sectionKey,
                    pdfFileAddedForGuide: pdfAdded,
                  },
                  weakAreas: [],
                  coachLines: [guide.quickCheck, guide.examTrap],
                  pdfGuide: {
                    pdfId,
                    lessonId,
                    sectionTitle: guide.sectionTitle,
                    summary: guide.summary,
                    mustHighlight: guide.mustHighlight,
                    userHighlights: prog?.highlights ?? [],
                    pdfFileAvailable: pdfAdded,
                  },
                }}
              />
            </div>
          </details>

          <details className="rounded-xl border border-slate-700 bg-slate-900/30 group">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
              Section done / other links
            </summary>
            <div className="px-3 pb-3 border-t border-slate-800 pt-3 flex flex-wrap gap-2">
              <button type="button" className="btn text-sm min-h-[44px] touch-manipulation" onClick={() => completePdfGuideSection(pdfId, lessonId)}>
                Mark section complete
              </button>
              <Link to={`/pdf-guides/${pdfId}`} className="btn-ghost text-sm min-h-[44px] border border-slate-600 touch-manipulation inline-flex items-center justify-center">
                All sections
              </Link>
            </div>
          </details>
        </div>
      </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700/90 bg-slate-950/95 backdrop-blur-md px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        <p className="text-[10px] text-cyan-200/95 font-semibold uppercase tracking-wide mb-1.5">PDF study flow</p>
        <div className="flex gap-2">
          <LocalPdfOpenButton pdfId={pdfId} page={pageMap?.startPage} className="flex-1 min-w-[120px] text-xs justify-center touch-manipulation min-h-[48px]">
            Open PDF
          </LocalPdfOpenButton>
          <a
            href="#highlight-coach"
            className="btn flex-1 min-w-[120px] text-xs min-h-[48px] inline-flex items-center justify-center touch-manipulation px-2.5 text-center leading-tight"
          >
            Continue here
          </a>
        </div>
        <details className="mt-2 rounded-lg border border-slate-800 bg-slate-900/60 text-[11px] text-slate-400 overflow-hidden">
          <summary className="cursor-pointer list-none px-2 py-2 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden font-medium">
            ▸ Highlights · check · PDF setup
          </summary>
          <div className="px-2 pb-2 flex flex-wrap gap-2 border-t border-slate-800/90 pt-2">
            <a
              href="#pdf-mini-check"
              className="btn-ghost text-[11px] min-h-[40px] border border-slate-600 inline-flex flex-1 min-w-[100px] items-center justify-center touch-manipulation"
            >
              Mini-check
            </a>
            <Link
              to={`/pdf-setup?need=${encodeURIComponent(pdfId)}`}
              className="btn-ghost text-[11px] min-h-[40px] border border-amber-700/45 inline-flex flex-1 min-w-[100px] items-center justify-center touch-manipulation"
            >
              Add PDF
            </Link>
          </div>
        </details>
      </div>
    </AppShell>
  );
}
