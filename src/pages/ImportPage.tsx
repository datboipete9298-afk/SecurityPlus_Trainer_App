import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { usePdfLibrary, PRIVACY_LINE } from "../context/PdfLibraryContext";
import { Link } from "react-router-dom";
import type { Lesson } from "../types";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import { classifyImportedPdfCategory, IMPORTED_PDF_CATEGORY_LABEL, IMPORTED_PDF_CATEGORY_HELP, type ImportedPdfCategory } from "../utils/pdfCategory";
import { topLessonsForImportedPdf } from "../utils/pdfToLessonMatch";

const REQUIRED: (keyof Lesson)[] = [
  "id",
  "title",
  "domain",
  "order",
  "hasFullContent",
  "videoFocus",
  "simpleExplanation",
  "highlightRules",
  "writeDown",
  "examTraps",
  "instantRecognition",
  "threeSecondRecall",
  "quickAction",
  "miniQuizIntro",
  "teachBackPrompt",
];

function validate(obj: unknown): { ok: boolean; missing: string[]; lesson?: Lesson } {
  if (!obj || typeof obj !== "object") return { ok: false, missing: ["(root must be a JSON object)"] };
  const o = obj as Record<string, unknown>;
  const missing: string[] = [];
  for (const k of REQUIRED) {
    if (o[k] === undefined || o[k] === null) missing.push(String(k));
  }
  if (o.highlightRules && !Array.isArray(o.highlightRules)) missing.push("highlightRules (array)");
  if (o.examTraps && !Array.isArray(o.examTraps)) missing.push("examTraps (array)");
  if (o.videoFocus && !Array.isArray(o.videoFocus)) missing.push("videoFocus (array)");
  return { ok: missing.length === 0, missing, lesson: missing.length ? undefined : (o as unknown as Lesson) };
}

function toTsLiteral(lesson: Lesson): string {
  return `  "${lesson.id}": ${JSON.stringify(lesson, null, 2).replace(/"([^"]+)":/g, '"$1":')},`;
}

export default function ImportPage() {
  const { bumpStudyResume } = useProgress();
  const { pdfs, loading, importing, importError, totalChars, addFiles, removePdf } = usePdfLibrary();
  const [params] = useSearchParams();
  const focusPdfId = params.get("pdf") ?? "";
  const focusPage = params.get("page") ?? "";
  const pdfSectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bumpStudyResume({ import: true });
  }, [bumpStudyResume]);

  useEffect(() => {
    if (focusPdfId && pdfSectionRef.current) {
      pdfSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusPdfId]);

  const [raw, setRaw] = useState("");

  const parsed = useMemo(() => {
    if (!raw.trim()) return { err: null as string | null, result: null as ReturnType<typeof validate> | null };
    try {
      const j = JSON.parse(raw) as unknown;
      return { err: null, result: validate(j) };
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Invalid JSON", result: null };
    }
  }, [raw]);

  const pdfLessonHints = useMemo(() => {
    const map = new Map<string, ReturnType<typeof topLessonsForImportedPdf>>();
    const slice = pdfs.slice(0, 15);
    for (const p of slice) {
      map.set(p.id, topLessonsForImportedPdf(p, 5));
    }
    return { map, capped: pdfs.length > 15 };
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

  return (
    <AppShell>
      <div className="max-w-3xl space-y-8">
        <PageHeader
          eyebrow="Authors & power users"
          title="Lesson JSON import"
          purpose="Validate lesson JSON before merging into source — not for backups. Progress lives under Progress → Backup & export."
        />

        <section ref={pdfSectionRef} id="local-text-pdfs" className="scroll-mt-24 space-y-4">
          <SectionCard title="Your PDF library" subtitle="Local text only — connects to Search & lessons">
            <div className="rounded-xl border-l-[3px] border-l-emerald-500/50 border border-slate-800/80 bg-slate-950/30 px-4 py-3 space-y-2 mb-4">
              <p className="text-ds-body text-slate-300 leading-relaxed">{PRIVACY_LINE}</p>
              <p className="text-ds-helper text-slate-500 leading-relaxed">
                Files stay in IndexedDB on this device. The app extracts text with pdf.js, groups books from the filename, and suggests lessons — no upload.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={(e) => void addFiles(e.target.files ?? [])}
              />
              <button type="button" className="btn touch-manipulation min-h-[48px]" disabled={importing} onClick={() => inputRef.current?.click()}>
                {importing ? "Reading PDFs…" : "Choose PDF"}
              </button>
              {loading ? <span className="text-xs text-slate-500">Loading library…</span> : null}
              {!loading && pdfs.length > 0 ?
                <span className="text-xs text-slate-400">
                  {pdfs.length} file{pdfs.length === 1 ? "" : "s"} · {Math.round(totalChars / 1000)}k characters
                </span>
              : null}
            </div>
            {importError ? <p className="text-rose-400 text-sm mt-2">{importError}</p> : null}
            {!loading && pdfs.length === 0 && (
              <div className="card border-slate-800/85 mt-4 ds-soft-in" role="status">
                <p className="text-ds-body text-slate-300 leading-relaxed">No PDFs in your library yet — the shelf is empty on purpose until you add files.</p>
                <p className="text-ds-helper text-slate-500 mt-2 leading-relaxed">Tap Choose PDF above; text stays on this device and powers Search + lesson hints.</p>
                <p className="text-ds-helper text-slate-500 mt-2 leading-relaxed">That is normal for a first visit — nothing is wrong with your progress.</p>
              </div>
            )}
            {focusPdfId && (
              <p className="text-xs text-emerald-300/95 mt-2">
                Focus from search: PDF id <code className="text-amber-200">{focusPdfId}</code>
                {focusPage ? ` · page ${focusPage}` : ""} — expand your file below if needed.
              </p>
            )}
            {pdfs.length > 0 && (
              <div className="mt-4 space-y-4">
                {pdfLessonHints.capped ?
                  <p className="text-xs text-amber-200/90 rounded-lg border border-amber-800/40 bg-amber-950/20 px-3 py-2">
                    Lesson suggestions are computed for your <strong className="text-amber-100">15 most recent</strong> imports to keep this page fast. Use Search for older files.
                  </p>
                : null}
                {(Object.keys(IMPORTED_PDF_CATEGORY_LABEL) as ImportedPdfCategory[]).map((cat) => {
                  const list = pdfsByCategory[cat];
                  if (list.length === 0) return null;
                  const label = IMPORTED_PDF_CATEGORY_LABEL[cat];
                  return (
                    <div key={cat} className="card border-slate-800/90 overflow-hidden p-0 shadow-none">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 px-3 py-2 bg-slate-950/80 border-b border-slate-800">
                        {label}
                      </p>
                      <p className="text-xs text-slate-500 px-3 py-2 bg-slate-950/40 border-b border-slate-800 leading-relaxed">
                        {IMPORTED_PDF_CATEGORY_HELP[cat]}
                      </p>
                      <ul className="text-sm divide-y divide-slate-800">
                        {list.map((p) => {
                          const base = p.fileName.replace(/\.pdf$/i, "");
                          const hints = pdfLessonHints.map.get(p.id) ?? [];
                          return (
                            <li
                              key={p.id}
                              className={`flex flex-col gap-2 px-3 py-3 bg-slate-900/50 ${focusPdfId === p.id ? "ring-1 ring-emerald-600/60" : ""}`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-slate-200 truncate font-medium" title={p.fileName}>
                                  {p.fileName}
                                </span>
                                <span className="text-xs text-slate-500 shrink-0">{p.pages.length} pp.</span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Added {new Date(p.addedAt).toLocaleString()} · text library (local)
                              </p>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                <strong className="text-slate-400">Match to lessons</strong> scans this PDF&apos;s text against lesson titles on your device (no upload). Use the suggestions, or browse the lesson path.
                              </p>
                              <details className="rounded-lg border border-slate-800 bg-slate-950/50">
                                <summary className="cursor-pointer text-xs text-emerald-300 font-medium px-2 py-2 touch-manipulation min-h-[40px] flex items-center list-none [&::-webkit-details-marker]:hidden">
                                  Lessons that may connect to this PDF
                                </summary>
                                {hints.length > 0 ?
                                  <ul className="px-2 pb-2 space-y-2 border-t border-slate-800/80 pt-2">
                                    {hints.map((row) => (
                                      <li
                                        key={row.lessonId}
                                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300"
                                      >
                                        <span className="min-w-0 truncate">
                                          {row.title}{" "}
                                          <span className="text-slate-500">· Domain {row.domain}</span>
                                        </span>
                                        <span className="text-slate-500 shrink-0 tabular-nums">{Math.round(row.score)}</span>
                                        <Link
                                          to={`/lesson/${row.lessonId}`}
                                          className="btn-ghost text-[11px] px-2 py-1 border border-slate-600 shrink-0 min-h-[36px] inline-flex items-center"
                                        >
                                          Open lesson
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                : (
                                  <p className="text-xs text-slate-500 px-2 pb-2 border-t border-slate-800/80 pt-2">
                                    No clear title overlap yet — try <Link to={`/search?q=${encodeURIComponent(base.slice(0, 40))}`} className="text-emerald-400 underline">Search</Link> with your own term.
                                  </p>
                                )}
                              </details>
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  to={`/import?pdf=${encodeURIComponent(p.id)}&page=1#local-text-pdfs`}
                                  className="btn-ghost text-xs border border-slate-600 min-h-[40px] px-2 inline-flex items-center"
                                >
                                  Open
                                </Link>
                                <Link
                                  to={`/search?q=${encodeURIComponent(base.slice(0, 48))}`}
                                  className="btn-ghost text-xs border border-slate-600 min-h-[40px] px-2 inline-flex items-center"
                                >
                                  Search inside
                                </Link>
                                <Link to="/roadmap" className="btn-ghost text-xs border border-slate-600 min-h-[40px] px-2 inline-flex items-center">
                                  Lesson path
                                </Link>
                                <button
                                  type="button"
                                  className="text-rose-400 text-xs shrink-0 touch-manipulation min-h-[40px] px-2"
                                  onClick={() => void removePdf(p.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </section>

        <SectionCard title="Progress vs lesson content" subtitle="Please read before pasting">
          <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
            <li>
              <strong className="text-white">Progress backup</strong> (streak, notes, quiz history) lives on{" "}
              <Link to="/progress" className="text-emerald-400 underline">
                Progress → Export
              </Link>
              . This import page is <strong className="text-white">not</strong> for that file.
            </li>
            <li>
              <strong className="text-white">Lesson content</strong> is one lesson JSON matching the app&apos;s Lesson shape. Valid output is copy-pasted into{" "}
              <code className="text-amber-300 text-xs">src/data/lessons.ts</code> by a developer.
            </li>
            <li>
              <strong className="text-amber-200">Overwrite warning:</strong> merging bad JSON into source can break the build — always run{" "}
              <code className="text-xs">npm run build</code> after edits.
            </li>
          </ul>
        </SectionCard>

        <SectionCard title="Lesson JSON" subtitle="Paste below — validation runs locally">
          <textarea
            className="mt-2 w-full min-h-[200px] bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-200"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder='{ "id": "1-1", "title": "...", ... }'
          />
          {parsed.err && <p className="text-rose-400 text-sm mt-2">JSON parse: {parsed.err}</p>}
          {raw.trim() && !parsed.err && parsed.result && (
            <div className="mt-3 space-y-2">
              <p className={parsed.result.ok ? "text-emerald-400 font-semibold" : "text-amber-300 font-semibold"}>
                {parsed.result.ok ? "Valid — all required fields present" : "Invalid — missing or wrong shape"}
              </p>
              {!parsed.result.ok && parsed.result.missing.length > 0 && (
                <ul className="text-sm text-rose-200/90 list-disc pl-4">
                  {parsed.result.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
              {parsed.result.lesson && (
                <div className="text-sm text-slate-300 border border-slate-700 rounded-lg p-3 bg-slate-950/80">
                  <p>
                    <strong className="text-white">{parsed.result.lesson.title}</strong> · domain {parsed.result.lesson.domain} · order{" "}
                    {parsed.result.lesson.order}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">{parsed.result.lesson.simpleExplanation}</p>
                </div>
              )}
              {parsed.result.lesson && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Copy for lessons merge (one entry)</p>
                  <pre className="text-xs text-slate-300 overflow-x-auto p-3 bg-slate-950 rounded-xl border border-slate-800 max-h-64 overflow-y-auto">
                    {toTsLiteral(parsed.result.lesson)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        <NextActionCard label="Suggested next" description="After merging content in source, add matching quiz rows and run a full build.">
          <Link to="/roadmap" className="btn-ghost w-full text-center inline-block">
            Lesson path →
          </Link>
        </NextActionCard>
      </div>
    </AppShell>
  );
}
