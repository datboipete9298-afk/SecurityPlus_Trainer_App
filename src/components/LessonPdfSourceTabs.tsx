import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePdfLibrary } from "../context/PdfLibraryContext";
import { classifyImportedPdfCategory } from "../utils/pdfCategory";
import { topLessonsForImportedPdf } from "../utils/pdfToLessonMatch";
import { courseNotesTocPrimaryRow, courseNotesTocRowsForLesson } from "../data/messerCourseNotesToc";
import { studyGuideTocRowsBestForLesson } from "../data/examStudyGuideToc";
import { PRACTICE_EXAMS_BOOK_TOC } from "../data/practiceExamsBookToc";
import type { PracticeExamsBookTocRow } from "../data/tocTypes";
import { snippetsForLesson, pdfMatchHeadline } from "../utils/lessonPdfMatch";
import { lessons } from "../data/lessons";

type Tab = "messer" | "study" | "practice" | "mypdfs";

function practiceRowHref(h: PracticeExamsBookTocRow["routeHint"]): string {
  switch (h) {
    case "exam_a":
      return "/quiz/messer-exam-a?mode=study";
    case "exam_b":
      return "/quiz/messer-exam-b?mode=study";
    case "exam_c":
      return "/quiz/messer-exam-c?mode=study";
    case "pbq_hub":
      return "/practice-exams/pbq";
    case "practice_hub":
      return "/practice-exams";
    default:
      return "/practice-exams";
  }
}

const TAB_META: readonly { id: Tab; label: string; hint: string }[] = [
  {
    id: "messer",
    label: "Messer notes",
    hint: "Professor Messer Course Notes — quick lines that track the videos (your legal PDF on this device).",
  },
  {
    id: "study",
    label: "Study guide",
    hint: "Official-style study guide sections — deeper framing than slide notes (separate book from Messer notes).",
  },
  {
    id: "practice",
    label: "Practice exams",
    hint: "Timed exams and review — not the same as lesson notes; pair with Exam A/B/C here.",
  },
  {
    id: "mypdfs",
    label: "My PDFs",
    hint: "Files you imported — matched to this lesson when the title overlaps your PDF text.",
  },
] as const;

export default function LessonPdfSourceTabs({
  lessonId,
  domain,
  messerGuideHref,
  studyGuideHref,
  hasMesserPdf,
}: {
  lessonId: string;
  domain: string;
  messerGuideHref: string;
  studyGuideHref: string;
  hasMesserPdf: boolean;
}) {
  const [tab, setTab] = useState<Tab>("messer");
  const { pdfs, removePdf } = usePdfLibrary();
  const L = lessons[lessonId];
  const title = L?.title ?? lessonId;

  const userPdfs = useMemo(
    () => pdfs.filter((p) => ["user_imported", "unknown"].includes(classifyImportedPdfCategory(p.fileName))),
    [pdfs],
  );

  const cnRows = useMemo(() => courseNotesTocRowsForLesson(lessonId), [lessonId]);
  const primaryCn = courseNotesTocPrimaryRow(lessonId);
  const sgRows = useMemo(() => studyGuideTocRowsBestForLesson(lessonId, domain, 10), [lessonId, domain]);

  const mySnippets = useMemo(
    () => snippetsForLesson(lessonId, title, userPdfs, 4, 400, 3500, domain),
    [lessonId, title, userPdfs, domain],
  );

  const meta = TAB_META.find((t) => t.id === tab);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 sm:p-4 space-y-3" aria-label="PDF sources by book">
      <p className="text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-200">Which book?</strong> Each tab is a different PDF purpose — you always know what you are aligning to this
        lesson.
      </p>
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scroll-pb-1">
        {TAB_META.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium touch-manipulation min-h-[44px] border transition-colors ${
              tab === t.id ? "border-emerald-500 bg-emerald-950/40 text-white" : "border-slate-600 bg-slate-950/50 text-slate-300 hover:bg-slate-800/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {meta ? <p className="text-[11px] text-slate-500 leading-relaxed">{meta.hint}</p> : null}

      {tab === "messer" && (
        <div className="space-y-3 text-sm text-slate-300">
          {primaryCn ?
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-1">
              <p className="text-xs text-emerald-200/90 font-semibold">Course notes TOC match</p>
              <p className="text-slate-200">
                <span className="text-slate-400">{primaryCn.objective}</span> — {primaryCn.title}
              </p>
              <p className="text-xs text-slate-500">Expected PDF start page: {primaryCn.pdfPage}</p>
            </div>
          : cnRows.length ?
            <ul className="space-y-1 text-xs text-slate-400">
              {cnRows.slice(0, 6).map((r) => (
                <li key={r.tocId}>
                  <span className="text-slate-500">{r.objective}</span> {r.title} · p.{r.pdfPage}{" "}
                  <span className="text-amber-200/80">({r.mapStatus.replace(/_/g, " ")})</span>
                </li>
              ))}
            </ul>
          : (
            <p className="text-xs text-slate-500">
              No single primary row — open your Course Notes PDF and use{" "}
              <Link to="/search" className="text-emerald-400 underline">
                Search
              </Link>{" "}
              with a heading you see.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Link to={messerGuideHref} className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm border border-slate-600">
              Open PDF guide (Messer notes) →
            </Link>
            <Link to={`/search?q=${encodeURIComponent(title.slice(0, 48))}`} className="btn-ghost w-full text-center min-h-[44px] text-sm border border-slate-600">
              Search your saved PDFs for this lesson
            </Link>
            {!hasMesserPdf ?
              <Link to="/pdf-setup?need=messer-course-notes-v107" className="text-xs text-amber-200/90 underline">
                Add Course Notes under PDF setup to unlock guided highlights.
              </Link>
            : null}
          </div>
        </div>
      )}

      {tab === "study" && (
        <div className="space-y-3 text-sm text-slate-300">
          <ul className="max-h-56 overflow-y-auto space-y-2 text-xs border border-slate-800 rounded-lg p-2 bg-slate-950/30">
            {sgRows.map((r) => (
              <li key={r.tocId} className="leading-snug">
                <span className="text-slate-500">{r.title}</span>
              </li>
            ))}
          </ul>
          <Link to={studyGuideHref} className="btn-ghost w-full text-center min-h-[44px] touch-manipulation justify-center text-sm border border-slate-600">
            Open PDF guide (Study guide) →
          </Link>
          <Link to={`/search?q=${encodeURIComponent(title.slice(0, 40))}`} className="text-xs text-emerald-400 underline">
            Search study guide text (local)
          </Link>
        </div>
      )}

      {tab === "practice" && (
        <div className="space-y-3 text-sm text-slate-300">
          <p className="text-xs text-amber-100/90 rounded-lg border border-amber-800/40 bg-amber-950/25 px-3 py-2">
            Practice exam <strong className="text-white">PDF</strong> is for questions and review — not the same flow as daily lesson notes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/practice-exams" className="btn text-sm min-h-[44px] touch-manipulation text-center">
              Practice exam hub
            </Link>
            <Link to="/weak" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center">
              Weak areas
            </Link>
          </div>
          <ul className="text-xs text-slate-400 space-y-1 max-h-48 overflow-y-auto">
            {PRACTICE_EXAMS_BOOK_TOC.map((r) => (
              <li key={r.tocId}>
                <Link to={practiceRowHref(r.routeHint)} className="text-emerald-400 hover:underline">
                  {r.title}
                </Link>{" "}
                · book p.{r.pdfPage}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "mypdfs" && (
        <div className="space-y-3 text-sm text-slate-300">
          {userPdfs.length === 0 ?
            <p className="text-xs text-slate-500">
              No imported PDFs yet —{" "}
              <Link to="/import#local-text-pdfs" className="text-emerald-400 underline">
                Import PDFs
              </Link>{" "}
              (stays on this device).
            </p>
          : (
            <ul className="space-y-3">
              {userPdfs.map((p) => {
                const hints = topLessonsForImportedPdf(p, 3);
                const hit = mySnippets.find((s) => s.pdfId === p.id);
                return (
                  <li key={p.id} className="rounded-lg border border-slate-800 p-2 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="text-slate-200 text-sm truncate">{p.fileName}</span>
                      <button type="button" className="text-rose-400 text-xs shrink-0 touch-manipulation" onClick={() => void removePdf(p.id)}>
                        Remove
                      </button>
                    </div>
                    {hit ?
                      <p className="text-xs text-slate-400">
                        {pdfMatchHeadline(hit.matchStrength)} · p.{hit.pageIndex}
                        <span className="block mt-1 text-slate-500 line-clamp-3">{hit.excerpt}</span>
                      </p>
                    : (
                      <p className="text-xs text-slate-500">No strong auto-snippet for this lesson title — try Search.</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link to={`/search?q=${encodeURIComponent(title.slice(0, 36))}`} className="text-emerald-400 underline">
                        Search inside
                      </Link>
                      {hints.map((h) => (
                        <Link key={h.lessonId} to={`/lesson/${h.lessonId}`} className="text-slate-400 underline">
                          {h.lessonId === lessonId ? "This lesson" : h.title}
                        </Link>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
