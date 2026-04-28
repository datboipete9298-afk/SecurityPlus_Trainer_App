import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { PDF_REGISTRY } from "../data/pdfRegistry";
import { useProgress } from "../context/ProgressContext";
import {
  clearPdfLibrary,
  deletePdfFile,
  isIndexedDbAvailable,
  listSavedPdfs,
  MAX_PDF_BYTES,
  savePdfFile,
} from "../utils/localPdfStore";
import { verifyPdfFile, type PdfVerifyResult } from "../utils/pdfFileVerifier";
import type { PdfLocalFileMeta } from "../types/pdfLibrary";
import { markUsage } from "../utils/localUsageSignals";

function pdfRegistryTitle(pdfId: string): string {
  return PDF_REGISTRY.find((p) => p.id === pdfId)?.title ?? pdfId;
}

type RowState = { status: "empty" } | { status: "ok"; meta: PdfLocalFileMeta };
type BatchRow = { kind: "ok" | "err" | "info"; text: string };

export default function PdfSetupPage() {
  const [params] = useSearchParams();
  const needId = params.get("need") ?? "";
  const { state, registerLocalPdfFile, removeLocalPdfFile, touchPdfSetupVisit, markPdfSetupComplete, clearAllLocalPdfMeta } = useProgress();
  const [idbOk, setIdbOk] = useState(true);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lowConfidenceQueue = useRef<{ file: File; v: PdfVerifyResult }[]>([]);
  const [pendingLowConfidence, setPendingLowConfidence] = useState<{ file: File; v: PdfVerifyResult } | null>(null);

  const meta = state.pdfLibrary?.localFileMeta ?? {};

  const refreshRows = useCallback(async () => {
    if (!isIndexedDbAvailable()) {
      setIdbOk(false);
      return;
    }
    const list = await listSavedPdfs();
    const next: Record<string, RowState> = {};
    for (const p of PDF_REGISTRY) {
      const row = list.find((x) => x.pdfId === p.id);
      const m = meta[p.id];
      if (row || m) {
        next[p.id] = {
          status: "ok",
          meta: {
            addedAt: row?.savedAt ?? m?.addedAt ?? Date.now(),
            name: row?.name ?? m?.name ?? p.fileName,
            size: row?.size ?? m?.size ?? 0,
          },
        };
      } else {
        next[p.id] = { status: "empty" };
      }
    }
    setRows(next);
  }, [meta]);

  useEffect(() => {
    void refreshRows();
  }, [refreshRows]);

  useEffect(() => {
    touchPdfSetupVisit();
  }, [touchPdfSetupVisit]);

  const flushLowConfidenceQueue = useCallback(() => {
    const next = lowConfidenceQueue.current.shift();
    setPendingLowConfidence(next ?? null);
  }, []);

  const saveVerified = useCallback(
    async (file: File, v: PdfVerifyResult) => {
      const pdfId = v.pdfId!;
      try {
        await savePdfFile(pdfId, file);
        await registerLocalPdfFile(pdfId, file);
        markUsage("pdf_added");
        setRows((r) => ({
          ...r,
          [pdfId]: {
            status: "ok",
            meta: { addedAt: Date.now(), name: file.name, size: file.size },
          },
        }));
        const matchedAs = pdfRegistryTitle(pdfId);
        return `Saved "${matchedAs}" — filename match: ${v.confidence}.`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg === "quota_exceeded") {
          throw new Error("Storage quota exceeded — remove a large PDF or free browser space.");
        }
        if (msg === "pdf_too_large") {
          throw new Error(
            `This file is over ${(MAX_PDF_BYTES / (1024 * 1024)).toFixed(0)} MB — split or use a lighter export, then try again.`,
          );
        }
        throw new Error("Could not save the file. Try a smaller PDF or another browser.");
      }
    },
    [registerLocalPdfFile],
  );

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      setBatchRows([]);
      const arr = [...files];
      const rows: BatchRow[] = [];
      for (const file of arr) {
        if (file.size > MAX_PDF_BYTES) {
          rows.push({
            kind: "err",
            text: `Skipped “${file.name}”: exceeds ${(MAX_PDF_BYTES / (1024 * 1024)).toFixed(0)} MB limit.`,
          });
          continue;
        }
        const v = await verifyPdfFile(file);
        if (!v.pdfId) {
          rows.push({ kind: "err", text: v.reason });
          continue;
        }
        if (v.confidence === "low") {
          lowConfidenceQueue.current.push({ file, v });
          continue;
        }
        try {
          rows.push({ kind: "ok", text: await saveVerified(file, v) });
        } catch (e) {
          rows.push({ kind: "err", text: e instanceof Error ? e.message : "Save failed." });
        }
      }
      await refreshRows();
      setBatchRows(rows);
      if (lowConfidenceQueue.current.length) {
        setPendingLowConfidence((cur) => {
          if (cur != null) return cur;
          return lowConfidenceQueue.current.shift() ?? null;
        });
      }
    },
    [refreshRows, saveVerified],
  );

  const remove = async (pdfId: string) => {
    try {
      await deletePdfFile(pdfId);
      await removeLocalPdfFile(pdfId);
      await refreshRows();
      setBatchRows([{ kind: "info", text: `Removed "${pdfRegistryTitle(pdfId)}" from this browser.` }]);
    } catch {
      setBatchRows([{ kind: "err", text: "Could not remove — try again." }]);
    }
  };

  const requiredN = PDF_REGISTRY.filter((p) => p.required).length;
  const savedRequired = PDF_REGISTRY.filter((p) => p.required && rows[p.id]?.status === "ok").length;

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="Add your PDF files"
          purpose="Drop each file in its row. Stays on this device — never uploaded."
          actions={
            <Link to="/pdf-guides" className="btn-ghost text-sm min-h-[44px] border border-slate-600">
              PDF study guides →
            </Link>
          }
        />

        {!idbOk && (
          <div className="rounded-xl border border-rose-700/50 bg-rose-950/30 p-4 text-sm text-rose-100">
            This browser won’t let the app save files (common in private mode or strict settings). Try a normal window in Chrome, Edge, or Firefox, or
            allow site storage, then use “Choose files”.
          </div>
        )}

        <div className="rounded-xl border border-slate-700/80 bg-slate-900/40 p-4 text-xs text-slate-300 leading-relaxed space-y-2">
          <p>
            <strong className="text-slate-100">PDFs stay on this device.</strong> Your notes and quiz stats export to JSON on Progress —
            PDFs themselves don’t. If you switch devices or reset this browser, just re-add the same files here.
          </p>
          <p className="text-slate-400">
            On phone, drag-and-drop isn’t always available — tap <strong className="text-slate-200">Choose files</strong> and pick from Files or Downloads.
          </p>
        </div>

        {needId && (
          <p className="text-sm text-cyan-200/90 rounded-lg border border-cyan-800/40 bg-cyan-950/25 px-3 py-2">
            Add this file first — <strong className="text-cyan-100">{pdfRegistryTitle(needId)}</strong> — then go back to the guide.
          </p>
        )}

        <p className="text-sm text-slate-400">
          Checklist: <strong className="text-slate-200">{savedRequired}</strong> / {requiredN} required files added.
        </p>

        {pendingLowConfidence && (
          <div className="rounded-xl border border-amber-600/50 bg-amber-950/30 p-4 space-y-3 text-sm text-amber-50/95">
            <p className="font-semibold text-amber-100">Low-confidence match</p>
            <p className="text-xs text-slate-300 leading-relaxed">{pendingLowConfidence.v.reason}</p>
            <p className="text-xs text-slate-400">
              File: <span className="font-mono break-all">{pendingLowConfidence.file.name}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn text-sm min-h-[44px]"
                onClick={() => {
                  const { file, v } = pendingLowConfidence;
                  setPendingLowConfidence(null);
                  void (async () => {
                    try {
                      const line = await saveVerified(file, v);
                      setBatchRows((prev) => [...prev, { kind: "ok", text: line }]);
                    } catch (e) {
                      setBatchRows((prev) => [...prev, { kind: "err", text: e instanceof Error ? e.message : "Save failed." }]);
                    }
                    await refreshRows();
                    flushLowConfidenceQueue();
                  })();
                }}
              >
                Save as matched PDF
              </button>
              <button
                type="button"
                className="btn-ghost text-sm min-h-[44px] border border-slate-600"
                onClick={() => {
                  setPendingLowConfidence(null);
                  flushLowConfidenceQueue();
                }}
              >
                Skip this file
              </button>
            </div>
          </div>
        )}

        <div
          className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver ? "border-emerald-500 bg-emerald-950/25" : "border-slate-600 bg-slate-900/40"
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void onFiles(e.dataTransfer.files);
          }}
        >
          <p className="text-slate-200 font-medium">Drop PDF files here</p>
          <p className="text-xs text-slate-500 mt-2">or</p>
          <button
            type="button"
            className="btn mt-3 min-h-[44px] touch-manipulation"
            onClick={() => inputRef.current?.click()}
          >
            Choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            aria-label="Choose PDF files to add to this browser"
            onChange={(e) => {
              const f = e.target.files;
              if (f?.length) void onFiles(f);
              e.target.value = "";
            }}
          />
        </div>

        {batchRows.length > 0 && (
          <ul className="space-y-2 list-none" aria-live="polite">
            {batchRows.map((r, i) => (
              <li
                key={`${r.kind}-${i}-${r.text.slice(0, 24)}`}
                className={`text-sm rounded-lg px-3 py-2 border leading-relaxed ${
                  r.kind === "ok"
                    ? "border-emerald-700/50 bg-emerald-950/25 text-emerald-50/95"
                    : r.kind === "err"
                      ? "border-rose-700/45 bg-rose-950/25 text-rose-50/95"
                      : "border-slate-600 bg-slate-900/50 text-slate-200"
                }`}
              >
                {r.text}
              </li>
            ))}
          </ul>
        )}

        <ul className="space-y-3 list-none">
          {PDF_REGISTRY.map((p) => {
            const row = rows[p.id] ?? { status: "empty" as const };
            const isOk = row.status === "ok";
            return (
              <li key={p.id} className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase text-slate-500">Required · {p.type}</p>
                    <h2 className="text-base font-semibold text-white">{p.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">{p.setupInstructions}</p>
                    <p className="text-[11px] text-slate-500 mt-2">{p.purchaseOrDownloadNote}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                      isOk ? "border-emerald-600 text-emerald-200 bg-emerald-950/40" : "border-amber-700 text-amber-200 bg-amber-950/30"
                    }`}
                  >
                    {isOk ? "Ready" : "Not added"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 font-mono break-all">Expected names include: {p.expectedFileNames.join(" · ")}</p>
                {isOk && (
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>
                      <span className="text-slate-500">File:</span> {row.meta.name}
                    </p>
                    <p>
                      <span className="text-slate-500">Size:</span> {(row.meta.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {isOk ?
                    <>
                      <button type="button" className="btn-ghost text-sm min-h-[44px] border border-slate-600" onClick={() => void remove(p.id)}>
                        Remove / replace
                      </button>
                      <Link to={`/pdf-guides/${p.id}`} className="btn text-sm min-h-[44px] text-center">
                        Open PDF guide →
                      </Link>
                    </>
                  : <Link to={`/pdf-guides/${p.id}`} className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center">
                      See guide (add PDF first) →
                    </Link>
                  }
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            className="btn-ghost text-sm min-h-[44px] border border-slate-700"
            onClick={() => {
              void clearPdfLibrary().then(() => {
                clearAllLocalPdfMeta();
                void refreshRows();
                setBatchRows([{ kind: "info", text: "Cleared all PDFs from this browser." }]);
              });
            }}
          >
            Clear all PDFs from browser
          </button>
          <button type="button" className="btn text-sm min-h-[44px]" onClick={() => markPdfSetupComplete()}>
            I’ve added my PDFs
          </button>
        </div>
      </div>
    </AppShell>
  );
}
