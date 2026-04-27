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
import { getPdfRegistryEntry } from "../data/pdfRegistry";
import { getPdfGuideSection, pdfGuideSectionKey } from "../data/pdfGuides";
import { getPdfPageMapEntry } from "../data/pdfGuides/pdfPageMap";
import { lessons } from "../data/lessons";
import { flashcards } from "../data/flashcards";
import { useProgress } from "../context/ProgressContext";
import { examReadiness } from "../utils/adaptive";

export default function PdfLessonGuidePage() {
  const { pdfId = "", lessonId = "" } = useParams<{ pdfId: string; lessonId: string }>();
  const entry = getPdfRegistryEntry(pdfId);
  const guide = getPdfGuideSection(pdfId, lessonId);
  const {
    state,
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
  const pdfAdded = !!state.pdfLibrary?.localFileMeta?.[pdfId];
  const pageMap = useMemo(() => getPdfPageMapEntry(pdfId, lessonId), [pdfId, lessonId]);
  const searchPhrase = pageMap?.searchPhrase ?? guide?.sectionTitle ?? "";

  const [quizI, setQuizI] = useState(0);
  const [quizReveal, setQuizReveal] = useState(false);
  const [flashFront, setFlashFront] = useState("");
  const [flashBack, setFlashBack] = useState("");
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
      <p className="text-xs text-cyan-100/90 max-w-6xl mb-3 md:hidden rounded-lg border border-cyan-800/40 bg-cyan-950/25 px-3 py-2 leading-relaxed">
        <strong className="text-cyan-50">Phone flow:</strong> tap <strong>Open PDF</strong> (new tab) → use the <strong>sticky bar</strong> below to jump to Hooks / Mini-check →
        switch back to this tab after marking ideas (don’t close it).
      </p>
      <div className="max-w-6xl grid lg:grid-cols-2 gap-6 items-start pb-32 lg:pb-6">
        <div className="min-w-0 space-y-4 order-2 lg:order-1">
          <PageHeader
            title={guide.sectionTitle}
            purpose={`${entry.title} · Domain ${guide.domain} · Open your PDF in another tab, then use this page as your coach — left: map & summary, right: highlights, notes, AI, checkpoints.`}
            actions={
              <div className="flex flex-col gap-2 items-stretch sm:items-end">
                <LocalPdfOpenButton pdfId={pdfId} page={pageMap?.startPage} className="w-full sm:w-auto">
                  Open local PDF
                </LocalPdfOpenButton>
                {!pdfAdded && (
                  <Link to={`/pdf-setup?need=${encodeURIComponent(pdfId)}`} className="btn-ghost text-xs text-center border border-amber-700/50 min-h-[40px]">
                    Add this PDF first →
                  </Link>
                )}
              </div>
            }
          />

          <section className="rounded-xl border border-cyan-800/35 bg-cyan-950/15 p-4 space-y-2">
            <h2 className="text-xs font-bold text-cyan-200 uppercase tracking-wide">Find this in your PDF</h2>
            <p className="text-sm text-slate-200">
              Search this phrase in your PDF:{" "}
              <span className="font-medium text-white">&quot;{searchPhrase}&quot;</span>
            </p>
            {pageMap ?
              <p className="text-xs text-slate-400">
                Optional page map: pp. {pageMap.startPage}–{pageMap.endPage} (your edition may differ — use search if off).
              </p>
            : <p className="text-xs text-slate-500">{guide.locatorHint}</p>}
          </section>

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

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn text-sm min-h-[44px] touch-manipulation" onClick={() => completePdfGuideSection(pdfId, lessonId)}>
              Mark section complete
            </button>
            <Link to={`/pdf-guides/${pdfId}`} className="btn-ghost text-sm min-h-[44px] border border-slate-600 touch-manipulation">
              All sections
            </Link>
          </div>

          <AITutorPanel
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
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700/90 bg-slate-950/95 backdrop-blur-md px-3 py-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        <p className="text-[10px] text-cyan-200/95 font-semibold uppercase tracking-wide mb-1.5">
          PDF + guide: open file → return here
        </p>
        <div className="flex flex-wrap gap-2">
          <LocalPdfOpenButton pdfId={pdfId} page={pageMap?.startPage} className="flex-1 min-w-[130px] text-xs">
            Open PDF (new tab)
          </LocalPdfOpenButton>
          <a
            href="#highlight-coach"
            className="btn-ghost text-xs min-h-[44px] border border-slate-600 inline-flex items-center justify-center px-2.5"
          >
            Hooks
          </a>
          <a
            href="#pdf-mini-check"
            className="btn-ghost text-xs min-h-[44px] border border-slate-600 inline-flex items-center justify-center px-2.5"
          >
            Check
          </a>
          <Link
            to={`/pdf-setup?need=${encodeURIComponent(pdfId)}`}
            className="btn-ghost text-xs min-h-[44px] border border-amber-700/45 inline-flex items-center justify-center px-2.5"
          >
            Setup
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
