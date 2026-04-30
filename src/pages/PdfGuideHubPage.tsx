import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { PDF_REGISTRY } from "../data/pdfRegistry";
import { useProgress } from "../context/ProgressContext";
import { usePdfLibrary } from "../context/PdfLibraryContext";
import {
  classifyImportedPdfCategory,
  IMPORTED_PDF_CATEGORY_LABEL,
  IMPORTED_PDF_CATEGORY_HELP,
  type ImportedPdfCategory,
} from "../utils/pdfCategory";
import { topLessonsForImportedPdf } from "../utils/pdfToLessonMatch";
import { enrichMesserCourseNotesToc } from "../utils/messerTocVideoEnrichment";
import { EXAM_STUDY_GUIDE_TOC } from "../data/examStudyGuideToc";
import { PRACTICE_EXAMS_BOOK_TOC } from "../data/practiceExamsBookToc";
import { lessons } from "../data/lessons";

const REGISTRY_KIND_LABEL: Record<string, string> = {
  notes: "Professor Messer Course Notes",
  study: "Exam Study Guide",
  exams: "Practice Exams",
};

const REGISTRY_KIND_HELP: Record<string, string> = {
  notes: "Quick notes that follow the videos.",
  study: "Deeper explanations than slide-style notes — separate TOC from Course Notes.",
  exams: "Exam-style questions and review — not the same as daily lesson notes.",
};

type HubTab = "messer_notes" | "study_guide" | "practice_exams" | "user_imported" | "unknown";

const HUB_TABS: readonly { id: HubTab; label: string; hint: string }[] = [
  { id: "messer_notes", label: "Messer Course Notes", hint: "Expected PDF outline + lesson links (structure only in the app)." },
  { id: "study_guide", label: "Exam Study Guide", hint: "Official-style study guide outline — never mixed with Messer notes." },
  { id: "practice_exams", label: "Practice Exams", hint: "Exam A/B/C structure in the book + app practice hub." },
  { id: "user_imported", label: "My imported PDFs", hint: "Files you added — local text only." },
  { id: "unknown", label: "Unknown / Uncategorized", hint: "Rename on re-import or pick a category so Search + lessons stay clear." },
];

export default function PdfGuideHubPage() {
  const [tab, setTab] = useState<HubTab>("messer_notes");
  const { state } = useProgress();
  const { pdfs, removePdf } = usePdfLibrary();
  const meta = state.pdfLibrary?.localFileMeta ?? {};

  const pdfLessonHints = useMemo(() => {
    const map = new Map<string, ReturnType<typeof topLessonsForImportedPdf>>();
    for (const p of pdfs.slice(0, 24)) {
      map.set(p.id, topLessonsForImportedPdf(p, 4));
    }
    return map;
  }, [pdfs]);

  const pdfsByCategory = useMemo(() => {
    const buckets: Record<ImportedPdfCategory, typeof pdfs> = {
      messer_course_notes: [],
      study_guide: [],
      practice_exams: [],
      user_imported: [],
      unknown: [],
    };
    for (const p of pdfs) {
      buckets[classifyImportedPdfCategory(p.fileName)].push(p);
    }
    return buckets;
  }, [pdfs]);

  const notesRegistry = PDF_REGISTRY.find((p) => p.type === "notes");
  const studyRegistry = PDF_REGISTRY.find((p) => p.type === "study");
  const examsRegistry = PDF_REGISTRY.find((p) => p.type === "exams");

  const enrichedCourseNotesToc = useMemo(() => enrichMesserCourseNotesToc(), []);

  const tabHint = HUB_TABS.find((t) => t.id === tab)?.hint ?? null;

  function importedFileRow(p: (typeof pdfs)[0], showRemove: boolean) {
    const hints = pdfLessonHints.get(p.id) ?? [];
    const base = p.fileName.replace(/\.pdf$/i, "");
    const cat = classifyImportedPdfCategory(p.fileName);
    return (
      <li key={p.id} className="border-b border-slate-800/80 pb-3 last:border-0 last:pb-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-200 truncate" title={p.fileName}>
            {p.fileName}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500">{p.pages.length} pp.</span>
            <span className="text-[10px] text-slate-500 rounded border border-slate-700 px-1.5 py-0.5">{IMPORTED_PDF_CATEGORY_LABEL[cat]}</span>
            {showRemove ?
              <button type="button" className="text-rose-400 text-xs touch-manipulation" onClick={() => void removePdf(p.id)}>
                Remove
              </button>
            : null}
          </div>
        </div>
        {hints.length > 0 ?
          <ul className="text-xs text-slate-400 space-y-1 pl-1 border-l border-slate-700">
            {hints.map((row) => (
              <li key={row.lessonId} className="flex flex-wrap items-center gap-2">
                <span className="truncate">
                  {row.title} <span className="text-slate-500">· D{row.domain}</span>
                </span>
                <Link to={`/lesson/${row.lessonId}`} className="text-emerald-400 underline shrink-0">
                  Open lesson
                </Link>
              </li>
            ))}
          </ul>
        : (
          <p className="text-[11px] text-slate-500">
            No auto lesson list — try <Link to={`/search?q=${encodeURIComponent(base.slice(0, 36))}`} className="text-emerald-400 underline">Search inside</Link>.
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          <Link to={`/import?pdf=${encodeURIComponent(p.id)}&page=1#local-text-pdfs`} className="text-emerald-400 underline">
            Open in Import
          </Link>
          <Link to={`/search?q=${encodeURIComponent(base.slice(0, 40))}`} className="text-emerald-400 underline">
            Search inside
          </Link>
          <Link to="/roadmap" className="text-emerald-400 underline">
            Lesson path
          </Link>
        </div>
      </li>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <PageHeader
          eyebrow="PDF library"
          title="PDF study guides"
          purpose="Five shelves — pick the book you mean. Everything opens on this device; nothing syncs unless you choose optional cloud later."
          actions={
            <Link to="/pdf-setup" className="btn text-sm min-h-[44px] text-center">
              Add PDF files
            </Link>
          }
        />
        <p className="text-ds-helper text-slate-500 leading-relaxed -mt-4">
          Your files stay local. Add once under <strong className="text-slate-300">Add PDF files</strong> if you haven’t.
        </p>
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-1.5 shadow-ds-soft">
          <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 snap-x snap-mandatory" aria-label="PDF library sections">
          {HUB_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 snap-start rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium touch-manipulation min-h-[44px] border transition-[color,background-color,border-color,box-shadow,opacity] duration-200 ease-ds-out ${
                tab === t.id
                  ? "border-emerald-500/70 bg-emerald-950/45 text-white shadow-sm ring-1 ring-emerald-500/25"
                  : "border-transparent bg-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 opacity-95 hover:opacity-100"
              }`}
            >
              {t.label}
            </button>
          ))}
          </div>
        </div>
        <div key={tab} className="ds-tab-panel-enter space-y-4">
        {tabHint ? <p className="text-ds-helper text-slate-500 leading-relaxed">{tabHint}</p> : null}

        {tab === "messer_notes" && (
          <div className="space-y-4">
            {notesRegistry ?
              <div className="card border-slate-800/90 p-5">
                <p className="text-xs uppercase text-slate-500">{REGISTRY_KIND_LABEL.notes}</p>
                <p className="text-[11px] text-slate-500 mt-1">{REGISTRY_KIND_HELP.notes}</p>
                <h2 className="text-lg font-semibold text-white mt-1">{notesRegistry.title}</h2>
                <p className="text-sm text-slate-400 mt-2">{notesRegistry.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!meta[notesRegistry.id] ?
                    <Link to={`/pdf-setup?need=${encodeURIComponent(notesRegistry.id)}`} className="btn text-sm min-h-[44px] text-center">
                      Add this PDF →
                    </Link>
                  : <Link to={`/pdf-guides/${notesRegistry.id}`} className="btn text-sm min-h-[44px] text-center">
                      Open PDF guide →
                    </Link>}
                  <Link to="/search" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center">
                    Search PDFs
                  </Link>
                </div>
              </div>
            : null}
            <div className="card border-slate-800/90 p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
                <p className="text-ds-micro font-bold uppercase tracking-wider text-slate-500">Course Notes · outline</p>
                <p className="text-ds-helper text-slate-500 mt-1">Page = start in your PDF. Status = how the app links each row to Messer clips.</p>
              </div>
              <ul className="max-h-[min(60vh,28rem)] overflow-y-auto divide-y divide-slate-800/80">
                {enrichedCourseNotesToc.map((r) => (
                  <li key={r.tocId} className="px-4 py-3 hover:bg-slate-900/50 transition-colors duration-150">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-ds-micro text-slate-500 shrink-0 tabular-nums">{r.objective}</span>
                      <span className="text-ds-body text-slate-100 min-w-0 flex-1">{r.title}</span>
                      <span className="text-ds-micro text-emerald-400/90 shrink-0">p.{r.pdfPage}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-ds-helper">
                      {r.matchedVideoId ?
                        <a
                          href={`https://www.youtube.com/watch?v=${r.matchedVideoId}`}
                          className="text-cyan-300 hover:text-cyan-200 underline-offset-2 min-h-[44px] inline-flex items-center touch-manipulation"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open clip
                        </a>
                      : (
                        <span className="text-slate-600">No clip linked</span>
                      )}
                      <span className="rounded-full border border-slate-700/90 px-2 py-0.5 text-ds-micro text-amber-200/90 capitalize">
                        {r.videoMatchStatus.replace(/_/g, " ")}
                      </span>
                      {r.lessonId ?
                        <Link to={`/lesson/${r.lessonId}`} className="text-emerald-400 hover:text-emerald-300 underline-offset-2 min-h-[44px] inline-flex items-center touch-manipulation">
                          {lessons[r.lessonId]?.title ?? r.lessonId}
                        </Link>
                      : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {pdfsByCategory.messer_course_notes.length > 0 ?
              <div className="rounded-xl border border-slate-700 bg-slate-900/35 p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Imported files tagged as Course Notes</p>
                <ul className="mt-2 space-y-3">{pdfsByCategory.messer_course_notes.map((p) => importedFileRow(p, true))}</ul>
              </div>
            : null}
          </div>
        )}

        {tab === "study_guide" && (
          <div className="space-y-4">
            {studyRegistry ?
              <div className="card border-slate-800/90 p-5">
                <p className="text-xs uppercase text-slate-500">{REGISTRY_KIND_LABEL.study}</p>
                <p className="text-[11px] text-slate-500 mt-1">{REGISTRY_KIND_HELP.study}</p>
                <h2 className="text-lg font-semibold text-white mt-1">{studyRegistry.title}</h2>
                <p className="text-sm text-slate-400 mt-2">{studyRegistry.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!meta[studyRegistry.id] ?
                    <Link to={`/pdf-setup?need=${encodeURIComponent(studyRegistry.id)}`} className="btn text-sm min-h-[44px] text-center">
                      Add this PDF →
                    </Link>
                  : <Link to={`/pdf-guides/${studyRegistry.id}`} className="btn text-sm min-h-[44px] text-center">
                      Open PDF guide →
                    </Link>}
                  <Link to="/search" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center">
                    Search PDFs
                  </Link>
                </div>
              </div>
            : null}
            <div className="card border-slate-800/90 p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
                <p className="text-ds-micro font-bold uppercase tracking-wider text-slate-500">Study Guide · outline</p>
              </div>
              <ul className="max-h-[min(55vh,26rem)] overflow-y-auto divide-y divide-slate-800/80">
                {EXAM_STUDY_GUIDE_TOC.map((r) => (
                  <li key={r.tocId} className="px-4 py-3 hover:bg-slate-900/45 transition-colors">
                    <span className="text-ds-helper text-slate-500 block">{r.sectionPath}</span>
                    <span className="text-ds-body text-slate-100">{r.title}</span>
                    {r.lessonId ?
                      <Link to={`/lesson/${r.lessonId}`} className="mt-2 inline-flex min-h-[44px] items-center text-ds-helper text-emerald-400 hover:text-emerald-300 underline-offset-2 touch-manipulation">
                        Open lesson · {lessons[r.lessonId]?.title ?? r.lessonId}
                      </Link>
                    : null}
                  </li>
                ))}
              </ul>
            </div>
            {pdfsByCategory.study_guide.length > 0 ?
              <div className="rounded-xl border border-slate-700 bg-slate-900/35 p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Imported files tagged as Study Guide</p>
                <ul className="mt-2 space-y-3">{pdfsByCategory.study_guide.map((p) => importedFileRow(p, true))}</ul>
              </div>
            : null}
          </div>
        )}

        {tab === "practice_exams" && (
          <div className="space-y-4">
            {examsRegistry ?
              <div className="card border-slate-800/90 p-5">
                <p className="text-xs uppercase text-amber-300/90">{REGISTRY_KIND_LABEL.exams}</p>
                <p className="text-[11px] text-slate-500 mt-1">{REGISTRY_KIND_HELP.exams}</p>
                <h2 className="text-lg font-semibold text-white mt-1">{examsRegistry.title}</h2>
                <p className="text-sm text-slate-400 mt-2">{examsRegistry.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!meta[examsRegistry.id] ?
                    <Link to={`/pdf-setup?need=${encodeURIComponent(examsRegistry.id)}`} className="btn text-sm min-h-[44px] text-center">
                      Add this PDF →
                    </Link>
                  : <Link to={`/pdf-guides/${examsRegistry.id}`} className="btn text-sm min-h-[44px] text-center">
                      Open PDF guide →
                    </Link>}
                </div>
              </div>
            : null}
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 text-sm text-amber-100/95">
              <p className="font-semibold text-white">Practice exams are not lesson notes</p>
              <p className="text-xs mt-1 text-amber-100/85">
                Use the hub for timed runs, review, PBQs, and weak-area repair — then cross-check the book’s quick/detailed answer sections.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link to="/practice-exams" className="btn text-sm min-h-[44px] text-center">
                  Practice exam hub
                </Link>
                <div className="flex flex-wrap gap-2">
                  <Link to="/quiz/messer-exam-a?mode=study" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center flex-1 min-w-[8rem]">
                    Exam A
                  </Link>
                  <Link to="/quiz/messer-exam-b?mode=study" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center flex-1 min-w-[8rem]">
                    Exam B
                  </Link>
                  <Link to="/quiz/messer-exam-c?mode=study" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center flex-1 min-w-[8rem]">
                    Exam C
                  </Link>
                </div>
                <Link to="/practice-exams/pbq" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center">
                  PBQ ordering drills
                </Link>
                <Link to="/weak" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center">
                  Weak area repair
                </Link>
              </div>
            </div>
            <div className="card border-slate-800/90 p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
                <p className="text-ds-micro font-bold uppercase tracking-wider text-slate-500">Practice Exams book · TOC</p>
              </div>
              <ul className="divide-y divide-slate-800/80 text-ds-body text-slate-300">
                {PRACTICE_EXAMS_BOOK_TOC.map((r) => (
                  <li key={r.tocId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-900/40 transition-colors">
                    <span className="text-slate-200">{r.title}</span>
                    <span className="text-ds-helper text-slate-500 tabular-nums">p.{r.pdfPage}</span>
                  </li>
                ))}
              </ul>
            </div>
            {pdfsByCategory.practice_exams.length > 0 ?
              <div className="rounded-xl border border-slate-700 bg-slate-900/35 p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">Imported files tagged as Practice Exams</p>
                <ul className="mt-2 space-y-3">{pdfsByCategory.practice_exams.map((p) => importedFileRow(p, true))}</ul>
              </div>
            : null}
          </div>
        )}

        {tab === "user_imported" && (
          <div className="card border-slate-800/90 p-5">
            <p className="text-xs font-semibold text-slate-300">{IMPORTED_PDF_CATEGORY_LABEL.user_imported}</p>
            <p className="text-[11px] text-slate-500 mt-1">{IMPORTED_PDF_CATEGORY_HELP.user_imported}</p>
            {pdfsByCategory.user_imported.length === 0 ?
              <div className="mt-3 space-y-2 text-ds-body text-slate-500 leading-relaxed ds-soft-in" role="status">
                <p className="text-slate-400">No imported files tagged here — this shelf stays empty until you add PDFs under Import.</p>
                <p className="text-ds-helper text-slate-500">Go to Import → choose files; they stay on-device and show up here by category.</p>
                <p className="text-ds-helper text-slate-600">That is expected if you have not imported yet — nothing is broken.</p>
              </div>
            : <ul className="mt-3 space-y-3">{pdfsByCategory.user_imported.map((p) => importedFileRow(p, true))}</ul>}
          </div>
        )}

        {tab === "unknown" && (
          <div className="card border-slate-800/90 p-5">
            <p className="text-xs font-semibold text-slate-300">{IMPORTED_PDF_CATEGORY_LABEL.unknown}</p>
            <p className="text-[11px] text-slate-500 mt-1">{IMPORTED_PDF_CATEGORY_HELP.unknown}</p>
            {pdfsByCategory.unknown.length === 0 ?
              <div className="mt-3 space-y-2 text-ds-body text-slate-500 leading-relaxed ds-soft-in" role="status">
                <p className="text-slate-400">Nothing uncategorized — filenames matched a known book pattern.</p>
                <p className="text-ds-helper text-slate-500">If a file lands here later, rename on re-import or pick a category on Import.</p>
                <p className="text-ds-helper text-slate-600">An empty unknown tab is a good sign your library is tidy.</p>
              </div>
            : <ul className="mt-3 space-y-3">{pdfsByCategory.unknown.map((p) => importedFileRow(p, true))}</ul>}
          </div>
        )}

        </div>

        <p className="text-[11px] text-slate-600">
          <Link to="/import#local-text-pdfs" className="text-emerald-400 underline">
            Import more PDFs
          </Link>{" "}
          ·{" "}
          <Link to="/pdf-setup" className="text-emerald-400 underline">
            Manage registry slots
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
