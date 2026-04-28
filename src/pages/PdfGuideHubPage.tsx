import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import { PDF_REGISTRY } from "../data/pdfRegistry";
import { useProgress } from "../context/ProgressContext";

export default function PdfGuideHubPage() {
  const { state } = useProgress();
  const meta = state.pdfLibrary?.localFileMeta ?? {};

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title="PDF study guides"
          purpose="Tap your book, then follow the screen."
          actions={
            <Link to="/pdf-setup" className="btn text-sm min-h-[44px] text-center">
              Add PDF files →
            </Link>
          }
        />
        <p className="text-xs text-slate-500 leading-relaxed">
          Your PDF stays on this device. Add it once under <strong className="text-slate-300">Add PDF files</strong> if you haven’t.
        </p>
        <p className="text-xs text-cyan-200/85 rounded-lg border border-cyan-800/35 bg-cyan-950/20 px-3 py-2 leading-relaxed">
          <strong className="text-cyan-100">Do this:</strong> open PDF → find the section → highlight what we list → write one note → tap Continue on Home.
        </p>
        <ul className="space-y-3 list-none">
          {PDF_REGISTRY.map((p) => {
            const ready = !!meta[p.id];
            return (
              <li key={p.id} className="rounded-2xl border border-slate-700 bg-slate-900/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-slate-500">{p.type}</p>
                    <h2 className="text-lg font-semibold text-white mt-0.5">{p.title}</h2>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{p.description}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full border shrink-0 ${
                      ready ? "border-emerald-600 text-emerald-200 bg-emerald-950/40" : "border-amber-700 text-amber-200 bg-amber-950/30"
                    }`}
                  >
                    {ready ? "Ready" : "PDF not added yet"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!ready ?
                    <Link to={`/pdf-setup?need=${encodeURIComponent(p.id)}`} className="btn text-sm min-h-[44px] touch-manipulation text-center">
                      Add this PDF →
                    </Link>
                  : <Link to={`/pdf-guides/${p.id}`} className="btn text-sm min-h-[44px] touch-manipulation text-center">
                      Open PDF guide →
                    </Link>
                  }
                  <Link to="/pdf-setup" className="btn-ghost text-sm min-h-[44px] border border-slate-600 text-center">
                    Manage files
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
