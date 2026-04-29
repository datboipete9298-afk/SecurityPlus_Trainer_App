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
    return { lessons: L.map((l) => l.id), qu: Q, fc: F, lab: Lab, sec, pdf };
  }, [q, pdfs]);

  const sendPdfHitToBrainBook = useCallback(
    async (h: PdfSearchHit) => {
      const line = pdfNoteLineFromHit(q, h.snippet);
      const prefill = { line, fileName: h.fileName, page: h.pageIndex, snippet: h.snippet };
      const lessonId = results.lessons[0] ?? results.sec[0]?.id ?? null;
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
    [q, results.lessons, results.sec, navigate],
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
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="Search"
          purpose="Type a term, port number, or acronym. Jumps straight to the lessons, questions, cards, labs, or roadmap section that mentions it."
        />

        <SectionCard title="Search" subtitle="Terms, ports, controls, acronyms…">
          <input
            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-base text-slate-100 placeholder:text-slate-600 min-h-[48px]"
            placeholder="e.g. phishing, ACL, zero trust…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search curriculum"
          />
        </SectionCard>

        {q.length > 0 && q.length < 2 && (
          <p className="text-sm text-slate-500">Type at least 2 characters to search.</p>
        )}

        {q.length >= 2 && !hasResults && (
          <SectionCard title="No matches" subtitle="Try a shorter word or browse">
            <p className="text-sm text-slate-400">
              No lessons, questions, cards, labs, roadmap labels, or your saved PDF text matched <strong className="text-slate-200">{q}</strong>.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/roadmap" className="btn w-full text-center">
                Lesson path
              </Link>
              <Link to="/weak" className="btn-ghost w-full text-center">
                Weak areas
              </Link>
              <Link to="/flashcards" className="btn-ghost w-full text-center">
                Flashcards
              </Link>
            </div>
          </SectionCard>
        )}

        {hasResults && (
          <div className="space-y-6 text-sm">
            {results.sec.length > 0 && (
              <SectionCard title="Roadmap" subtitle="Messer-ordered sections">
                <ul className="space-y-2">
                  {results.sec.map((x) => (
                    <li key={x.id}>
                      <Link to={`/lesson/${x.id}`} className="text-slate-200 hover:text-emerald-300 underline-offset-2">
                        {x.label}
                      </Link>
                      <span className="text-slate-600 text-xs ml-2">Domain {x.domain}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {results.lessons.length > 0 && (
              <SectionCard title="Lessons" subtitle="Loaded content">
                <ul className="space-y-2">
                  {results.lessons.map((id) => (
                    <li key={id}>
                      <Link to={`/lesson/${id}`} className="text-emerald-400 hover:underline">
                        {lessons[id]?.title ?? id}
                      </Link>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Link to={`/watch/${id}`} className="text-xs text-slate-500 hover:text-slate-300">
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
              <SectionCard title="Your PDFs (saved on this device)" subtitle="Extracted text from Import">
                {pdfSendHint ? <p className="text-sm text-emerald-200/95 mb-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2">{pdfSendHint}</p> : null}
                <ul className="space-y-3">
                  {results.pdf.map((h, i) => (
                    <li key={`${h.pdfId}-${h.pageIndex}-${i}`} className="border-b border-slate-800 pb-2 text-slate-400">
                      <p className="text-xs text-slate-200 font-medium">Found in your PDF.</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="text-slate-300">{h.fileName}</span> · page {h.pageIndex}
                      </p>
                      <p className="text-slate-200 text-sm mt-2">{h.snippet}</p>
                      <p className="text-sm text-slate-300 mt-2">Use this as one note.</p>
                      <p className="text-sm text-white font-medium mt-1 rounded border border-emerald-800/50 bg-emerald-950/30 px-2 py-1.5">
                        {pdfNoteLineFromHit(q, h.snippet)}
                      </p>
                      <button
                        type="button"
                        className="btn w-full mt-2 text-sm min-h-[44px] touch-manipulation"
                        onClick={() => void sendPdfHitToBrainBook(h)}
                      >
                        Send to lesson note
                      </button>
                      <p className="text-xs text-slate-500 mt-1.5">Take me to where I can save it.</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Link
                          to={`/import?pdf=${encodeURIComponent(h.pdfId)}&page=${h.pageIndex}#local-text-pdfs`}
                          className="text-emerald-400 text-xs underline-offset-2 hover:underline"
                        >
                          Open Import &amp; focus
                        </Link>
                        {results.lessons[0] && (
                          <Link to={`/lesson/${results.lessons[0]}`} className="text-slate-400 text-xs underline-offset-2 hover:underline">
                            Open lesson hit
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {results.qu.length > 0 && (
              <SectionCard title="Questions" subtitle="Jump to the lesson quiz">
                <ul className="space-y-2">
                  {results.qu.map((x) => (
                    <li key={x.id} className="border-b border-slate-800 pb-2 text-slate-400">
                      <p className="text-slate-200 line-clamp-2">{x.text}</p>
                      <Link to={`/quiz/${x.lessonId}`} className="text-emerald-400 text-xs mt-1 inline-block">
                        Open quiz →
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
