import { useMemo, useState, useEffect, useCallback } from "react";
import { useProgress } from "../context/ProgressContext";
import { Link, useNavigate } from "react-router-dom";
import { lessons } from "../data/lessons";
import { allQuestions } from "../data/quizzes";
import { flashcards } from "../data/flashcards";
import { labs } from "../data/labs";
import { SECTION_ORDER } from "../data/sectionOrder";
import { getVideoForLesson } from "../data/videoMap";
import { searchPdfLibrary } from "../utils/lessonPdfMatch";
import type { PdfSearchHit } from "../utils/lessonPdfMatch";
import { topLessonsForImportedPdf } from "../utils/pdfToLessonMatch";
import type { PdfLessonMatchRow } from "../utils/pdfToLessonMatch";
import { pdfNoteLineFromHit } from "../utils/pdfSearchNoteLine";
import { usePdfLibrary } from "../context/PdfLibraryContext";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";

export default function SearchPage() {
  const navigate = useNavigate();
  const { bumpStudyResume } = useProgress();
  const { pdfs } = usePdfLibrary();
  useEffect(() => {
    bumpStudyResume({ search: true });
  }, [bumpStudyResume]);

  const [q, setQ] = useState("");
  const [pdfSendHint, setPdfSendHint] = useState<string | null>(null);

  useEffect(() => {
    setPdfSendHint(null);
  }, [q]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2)
      return {
        lessons: [] as string[],
        qu: [] as import("../types").QuizQuestion[],
        fc: [] as import("../types").Flashcard[],
        lab: [] as import("../types").Lab[],
        sec: [] as { id: string; label: string; domain: string }[],
        pdf: [] as ReturnType<typeof searchPdfLibrary>,
        lessonForPdf: new Map<string, PdfLessonMatchRow | null>(),
      };
    const L = Object.values(lessons).filter(
      (l) =>
        l.title.toLowerCase().includes(s) ||
        l.simpleExplanation.toLowerCase().includes(s) ||
        l.writeDown.toLowerCase().includes(s),
    );
    const Q = allQuestions()
      .filter((x) => x.text.toLowerCase().includes(s) || x.examKeyword.toLowerCase().includes(s))
      .slice(0, 12);
    const F = flashcards
      .filter((c) => c.front.toLowerCase().includes(s) || c.back.toLowerCase().includes(s))
      .slice(0, 12);
    const Lab = labs.filter((l) => l.title.toLowerCase().includes(s) || l.description.toLowerCase().includes(s)).slice(0, 8);
    const sec = SECTION_ORDER.filter((x) => x.label.toLowerCase().includes(s));
    const pdf = searchPdfLibrary(q, pdfs, 20);
    const lessonForPdf = new Map<string, PdfLessonMatchRow | null>();
    const seenPdf = new Set<string>();
    for (const h of pdf) {
      if (seenPdf.has(h.pdfId)) continue;
      seenPdf.add(h.pdfId);
      const rec = pdfs.find((p) => p.id === h.pdfId);
      lessonForPdf.set(h.pdfId, rec ? topLessonsForImportedPdf(rec, 1)[0] ?? null : null);
    }
    return { lessons: L.map((l) => l.id), qu: Q, fc: F, lab: Lab, sec, pdf, lessonForPdf };
  }, [q, pdfs]);

  const sendPdfHitToBrainBook = useCallback(
    async (h: PdfSearchHit, lessonIdOverride?: string | null) => {
      const line = pdfNoteLineFromHit(q, h.snippet);
      const prefill = { line, fileName: h.fileName, page: h.pageIndex, snippet: h.snippet };
      const lessonId =
        lessonIdOverride ?? results.lessons[0] ?? results.lessonForPdf.get(h.pdfId)?.lessonId ?? results.sec[0]?.id ?? null;
      setPdfSendHint(null);
      if (lessonId) {
        navigate(`/lesson/${lessonId}`, { state: { sptPdfNotePrefill: prefill } });
        return;
      }
      try {
        await navigator.clipboard.writeText(line);
      } catch {
        /* user may deny clipboard */
      }
      setPdfSendHint("Take me to where I can save it.");
      navigate(`/import?pdf=${encodeURIComponent(h.pdfId)}&page=${h.pageIndex}#local-text-pdfs`);
    },
    [q, results.lessons, results.sec, results.lessonForPdf, navigate],
  );

  const hasResults =
    q.length >= 2 &&
    (results.sec.length > 0 ||
      results.lessons.length > 0 ||
      results.qu.length > 0 ||
      results.fc.length > 0 ||
      results.lab.length > 0 ||
      results.pdf.length > 0);

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <PageHeader
          eyebrow="Find anything"
          title="Search"
          purpose="Topics, ports, acronyms, or exam phrases — lessons, quizzes, flashcards, labs, your PDF text, and the lesson path."
        />

        <SectionCard title="Ask the library" subtitle="Everything below stays on this device.">
          <label htmlFor="spt-curriculum-search" className="sr-only">
            Search curriculum and PDFs
          </label>
          <input
            id="spt-curriculum-search"
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3.5 text-ds-body text-slate-100 placeholder:text-slate-600 min-h-[48px] shadow-inner transition-[border-color,box-shadow] duration-200 ease-ds-out focus:border-emerald-600/70 focus:ring-2 focus:ring-emerald-500/25 focus:outline-none"
            placeholder="e.g. phishing, ACL, zero trust…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search curriculum"
          />
        </SectionCard>

        {q.length === 0 && (
          <div className="card border-slate-800/90 border-l-[3px] border-l-amber-500/50 bg-slate-900/40">
            <p className="text-ds-body text-slate-300 leading-relaxed">
              Search a <strong className="text-white">topic</strong>, <strong className="text-white">keyword</strong>, or{" "}
              <strong className="text-white">exam phrase</strong>. Results group by type so you can jump straight into a lesson, quiz, or PDF
              line.
            </p>
            <p className="text-ds-helper text-slate-500 mt-3">Tip: after a PDF import, search pulls from extracted text too.</p>
          </div>
        )}

        {q.length > 0 && q.length < 2 && (
          <p className="text-ds-helper text-slate-500">Type at least two characters to search.</p>
        )}

        {q.length >= 2 && !hasResults && (
          <SectionCard title="Nothing matched yet" subtitle="That happens — try a shorter or broader term" className="ds-soft-in">
            <p className="text-ds-body text-slate-400 leading-relaxed">
              No lessons, questions, cards, labs, path labels, or PDF excerpts matched{" "}
              <strong className="text-slate-200">&quot;{q}&quot;</strong>.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link to="/roadmap" className="btn w-full text-center min-h-[44px] touch-manipulation">
                Browse lesson path
              </Link>
              <Link to="/weak" className="btn-ghost w-full text-center min-h-[44px] touch-manipulation">
                Weak areas
              </Link>
              <Link to="/flashcards" className="btn-ghost w-full text-center min-h-[44px] touch-manipulation">
                Flashcards
              </Link>
            </div>
          </SectionCard>
        )}

        {hasResults && (
          <div className="space-y-8 text-ds-body">
            {results.sec.length > 0 && (
              <SectionCard title="Lesson path" subtitle="Sections that match your search">
                <ul className="space-y-3">
                  {results.sec.map((x) => (
                    <li key={x.id} className="rounded-xl border border-slate-800/85 bg-slate-950/35 px-3 py-3">
                      <Link to={`/lesson/${x.id}`} className="text-ds-section text-slate-100 hover:text-emerald-300 font-medium">
                        {x.label}
                      </Link>
                      <p className="text-ds-helper text-slate-500 mt-1">Domain {x.domain}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {results.lessons.length > 0 && (
              <SectionCard title="Lessons" subtitle="In-app study units">
                <ul className="space-y-3">
                  {results.lessons.map((id) => (
                    <li key={id} className="rounded-xl border border-slate-800/80 bg-slate-950/35 px-3 py-3">
                      <Link to={`/lesson/${id}`} className="text-ds-section text-emerald-300 hover:text-emerald-200 font-medium">
                        {lessons[id]?.title ?? id}
                      </Link>
                      <p className="text-ds-helper text-slate-500 mt-1">Domain {lessons[id]?.domain ?? "—"}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Link to={`/watch/${id}`} className="text-ds-helper text-slate-400 hover:text-white underline-offset-2 min-h-[44px] inline-flex items-center touch-manipulation">
                          Guided watch
                        </Link>
                        {lessons[id]?.hasFullContent && getVideoForLesson(id).youtubeUrl && (
                          <a
                            href={getVideoForLesson(id).youtubeUrl!}
                            className="text-xs text-slate-500 hover:text-slate-300"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Video
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {results.pdf.length > 0 && (
              <SectionCard title="Your PDFs" subtitle="Text you imported — never leaves this device">
                {pdfSendHint ? (
                  <p className="text-ds-helper text-emerald-200/95 mb-4 rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2">{pdfSendHint}</p>
                ) : null}
                <ul className="space-y-4">
                  {results.pdf.map((h, i) => {
                    const matchLesson = results.lessonForPdf.get(h.pdfId) ?? null;
                    return (
                    <li key={`${h.pdfId}-${h.pageIndex}-${i}`} className="rounded-xl border border-slate-800/90 bg-slate-950/40 p-4 space-y-3">
                      <p className="text-ds-micro font-semibold uppercase tracking-wide text-slate-500">PDF match</p>
                      <p className="text-ds-helper text-slate-400">
                        <span className="text-emerald-300/95">{h.categoryLabel ?? "PDF category"}</span>
                        {" · "}
                        <span className="text-slate-200">{h.fileName}</span>
                        <span className="text-slate-500"> · page {h.pageIndex}</span>
                      </p>
                      <p className="text-ds-body text-slate-200 leading-relaxed">{h.snippet}</p>
                      <p className="text-ds-helper text-slate-500">Found in your PDF.</p>
                      <p className="text-ds-helper text-slate-400">Suggested one-line note:</p>
                      <p className="text-ds-body text-white font-medium rounded-lg border border-emerald-800/45 bg-emerald-950/25 px-3 py-2">
                        {pdfNoteLineFromHit(q, h.snippet)}
                      </p>
                      <button
                        type="button"
                        aria-label="Send to lesson note"
                        className="btn w-full text-sm min-h-[44px] touch-manipulation"
                        onClick={() => void sendPdfHitToBrainBook(h, matchLesson?.lessonId ?? null)}
                      >
                        Use this as one note
                      </button>
                      {matchLesson ?
                        <Link
                          to={`/lesson/${matchLesson.lessonId}`}
                          className="btn-ghost w-full text-sm min-h-[44px] text-center border border-slate-600 inline-flex items-center justify-center touch-manipulation"
                        >
                          Open matching lesson
                        </Link>
                      : (
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Use Search on a lesson keyword, or open any lesson and add this line as a Brain Book note from there.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Link
                          to={`/import?pdf=${encodeURIComponent(h.pdfId)}&page=${h.pageIndex}#local-text-pdfs`}
                          className="text-emerald-400 text-xs underline-offset-2 hover:underline"
                        >
                          Open Import &amp; focus
                        </Link>
                        {results.lessons[0] && (
                          <Link to={`/lesson/${results.lessons[0]}`} className="text-slate-400 text-xs underline-offset-2 hover:underline">
                            Open top lesson hit
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                  })}
                </ul>
              </SectionCard>
            )}

            {results.qu.length > 0 && (
              <SectionCard title="Questions" subtitle="Jump to the lesson quiz">
                <ul className="space-y-3">
                  {results.qu.map((x) => (
                    <li key={x.id} className="rounded-xl border border-slate-800/85 bg-slate-950/35 px-3 py-3 text-slate-400">
                      <p className="text-ds-body text-slate-200 line-clamp-3">{x.text}</p>
                      <Link to={`/quiz/${x.lessonId}`} className="text-ds-helper text-emerald-400 mt-2 inline-flex min-h-[44px] items-center touch-manipulation">
                        Open quiz
                      </Link>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {results.fc.length > 0 && (
              <SectionCard title="Flashcards" subtitle="Curriculum deck">
                <ul className="space-y-2 text-slate-300">
                  {results.fc.map((c) => (
                    <li key={c.id} className="line-clamp-2">
                      <span className="text-slate-500 text-xs">{c.cardType}</span> · {c.front}
                      <Link to={`/flashcards?lesson=${c.lessonId}`} className="text-emerald-400 text-xs ml-2">
                        deck
                      </Link>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {results.lab.length > 0 && (
              <SectionCard title="Labs" subtitle="From labs catalog">
                <ul className="space-y-2 text-slate-300">
                  {results.lab.map((l) => (
                    <li key={l.id}>
                      {l.title} — <span className="text-slate-500 text-xs">{l.description.slice(0, 80)}…</span>
                      <Link to="/sim" className="text-emerald-400 text-xs block mt-0.5">
                        Open labs hub →
                      </Link>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>
        )}

        <NextActionCard label="Suggested next" description="Open a result above or continue your lesson path.">
          <Link to="/roadmap" className="btn-ghost w-full text-center inline-block">
            Full lesson path →
          </Link>
        </NextActionCard>
      </div>
    </AppShell>
  );
}
