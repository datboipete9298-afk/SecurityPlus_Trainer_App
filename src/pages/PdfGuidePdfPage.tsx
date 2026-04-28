import { Link, Navigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import LocalPdfOpenButton from "../components/pdfGuide/LocalPdfOpenButton";
import { getPdfRegistryEntry } from "../data/pdfRegistry";
import { listLessonIdsForPdf, PRACTICE_EXAM_STRATEGY } from "../data/pdfGuides";
import { lessons } from "../data/lessons";
import { useProgress } from "../context/ProgressContext";

export default function PdfGuidePdfPage() {
  const { pdfId = "" } = useParams<{ pdfId: string }>();
  const entry = getPdfRegistryEntry(pdfId);
  const { state } = useProgress();
  const pdfAdded = !!state.pdfLibrary?.localFileMeta?.[pdfId];

  if (!entry) return <Navigate to="/pdf-guides" replace />;

  if (entry.type === "exams") {
    return (
      <AppShell>
        <div className="max-w-3xl space-y-6">
          <PageHeader
            title={entry.title}
            purpose={entry.description}
            actions={
              <Link to="/pdf-setup" className="btn-ghost text-sm min-h-[44px] border border-slate-600">
                Add PDF files →
              </Link>
            }
          />
          {!pdfAdded ?
            <div className="rounded-xl border border-amber-700/45 bg-amber-950/20 p-4 text-sm text-amber-100">
              <p className="font-medium">PDF not added yet</p>
              <p className="text-xs text-amber-200/80 mt-1">Add your practice exams PDF under Add PDF files to open it on this device.</p>
              <Link to={`/pdf-setup?need=${encodeURIComponent(pdfId)}`} className="btn mt-3 inline-block text-center min-h-[44px]">
                Add this PDF →
              </Link>
            </div>
          : <LocalPdfOpenButton pdfId={pdfId} className="w-full sm:w-auto">
              Open local practice exams PDF →
            </LocalPdfOpenButton>
          }
          <section className="card space-y-3">
            <h2 className="text-sm font-semibold text-white">Timing strategy</h2>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
              {PRACTICE_EXAM_STRATEGY.timing.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>
          <section className="card space-y-3">
            <h2 className="text-sm font-semibold text-white">Review strategy</h2>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
              {PRACTICE_EXAM_STRATEGY.review.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>
          <section className="card space-y-3">
            <h2 className="text-sm font-semibold text-white">Mistake correction loop</h2>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
              {PRACTICE_EXAM_STRATEGY.mistakeLoop.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>
          <section className="card space-y-3">
            <h2 className="text-sm font-semibold text-white">Trap patterns</h2>
            <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
              {PRACTICE_EXAM_STRATEGY.traps.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Link to="/practice-exams" className="btn text-center min-h-[44px]">
              Practice exams hub →
            </Link>
            <Link to="/practice" className="btn-ghost text-center min-h-[44px] border border-slate-600">
              Practice hub →
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const ids = listLessonIdsForPdf(pdfId);

  return (
    <AppShell>
      <div className="max-w-3xl space-y-4">
        <PageHeader
          title={entry.title}
          purpose={entry.description}
          actions={
            <Link to="/pdf-setup" className="btn-ghost text-sm min-h-[44px] border border-slate-600">
              Add PDF files →
            </Link>
          }
        />
        {!pdfAdded ?
          <div className="rounded-xl border border-amber-700/45 bg-amber-950/20 p-4 text-sm text-amber-100">
            <p className="font-medium">PDF not added yet</p>
            <p className="text-xs text-amber-200/80 mt-1">Add this book or notes PDF once — it stays on this device only.</p>
            <Link to={`/pdf-setup?need=${encodeURIComponent(pdfId)}`} className="btn mt-3 inline-block text-center min-h-[44px]">
              Add this PDF →
            </Link>
          </div>
        : <>
            <LocalPdfOpenButton pdfId={pdfId} className="w-full sm:w-auto">
              Open local PDF →
            </LocalPdfOpenButton>
            <p className="text-xs text-slate-500">Then pick a section below for the interactive guide.</p>
          </>
        }
        <ul className="space-y-1.5 list-none max-h-[min(60vh,520px)] overflow-y-auto pr-1">
          {ids.map((id) => (
            <li key={id}>
              <Link
                to={`/pdf-guides/${pdfId}/${id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-200 hover:border-emerald-700/50 min-h-[48px]"
              >
                <span className="font-mono text-xs text-slate-500">{id}</span>
                <span className="text-right flex-1 min-w-0">{lessons[id]?.title ?? id}</span>
                <span className="text-emerald-400 text-xs shrink-0">Guide →</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/pdf-guides" className="text-sm text-slate-500 underline">
          ← All PDFs
        </Link>
      </div>
    </AppShell>
  );
}
