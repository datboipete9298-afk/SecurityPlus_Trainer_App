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

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="Lesson content import (authors / developers)"
          purpose="Not for study backups. Paste one lesson JSON to validate shape before merging into source. Your streak, quizzes, and notes are exported from Progress → Backup & export — never from this page."
        />

        <section ref={pdfSectionRef} id="local-text-pdfs" className="scroll-mt-24">
          <SectionCard title="Add your own PDFs for study" subtitle="Text library (separate from PDF setup file slots)">
            <p className="text-sm text-slate-300 leading-relaxed">{PRIVACY_LINE}</p>
            <p className="text-xs text-slate-500 mt-2">
              Choose PDF files on this device. Text is extracted here with pdf.js and saved locally in IndexedDB — not in this project folder, not on a server, and not in the service worker cache.
            </p>
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
            {focusPdfId && (
              <p className="text-xs text-emerald-300/95 mt-2">
                Focus from search: PDF id <code className="text-amber-200">{focusPdfId}</code>
                {focusPage ? ` · page ${focusPage}` : ""} — expand your file below if needed.
              </p>
            )}
            {pdfs.length > 0 && (
              <ul className="mt-4 text-sm divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden">
                {pdfs.map((p) => (
                  <li
                    key={p.id}
                    className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900/50 ${focusPdfId === p.id ? "ring-1 ring-emerald-600/60" : ""}`}
                  >
                    <span className="text-slate-200 truncate" title={p.fileName}>
                      {p.fileName}
                    </span>
                    <span className="text-xs text-slate-500">{p.pages.length} pp.</span>
                    <button type="button" className="text-rose-400 text-xs shrink-0 touch-manipulation" onClick={() => void removePdf(p.id)}>
                      Remove from this device
                    </button>
                  </li>
                ))}
              </ul>
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
