import { Link } from "react-router-dom";

/**
 * Cloud sync — UI stub. Backend is not implemented and this component
 * MUST NEVER fake a working connection. Buttons are disabled with a clear
 * "not connected" state. Local-first export/import is the source of truth.
 *
 * See: CLOUD_SYNC_IMPLEMENTATION_PLAN.md
 */
export default function CloudSyncStub() {
  return (
    <section
      className="rounded-2xl border border-slate-700/85 bg-slate-900/50 px-4 py-5 space-y-3"
      aria-labelledby="cloud-sync-stub-h"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="cloud-sync-stub-h" className="text-sm font-bold text-slate-100 uppercase tracking-wide">
          Optional cloud sync
        </h2>
        <span className="text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 bg-slate-800/80 text-slate-400 border border-slate-700">
          Not connected
        </span>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">
        Local still works without sync.{" "}
        <strong className="text-white">Nothing leaves this browser today</strong> — your{" "}
        <Link to="/progress#backup" className="text-emerald-400 underline">
          Export progress
        </Link>{" "}
        button above is the source of truth.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <p className="font-semibold text-emerald-300/90 uppercase tracking-wide text-[10px]">Would sync</p>
          <ul className="mt-1.5 space-y-0.5 text-slate-300 list-disc pl-4">
            <li>Notes &amp; teach-back text</li>
            <li>Quiz / lab stats &amp; streak</li>
            <li>Readiness &amp; weak-area journal</li>
            <li>Lesson completion checkmarks</li>
          </ul>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
          <p className="font-semibold text-amber-200/90 uppercase tracking-wide text-[10px]">Would NOT sync</p>
          <ul className="mt-1.5 space-y-0.5 text-slate-300 list-disc pl-4">
            <li>PDF binaries (stay on each device)</li>
            <li>Browser cache &amp; service-worker assets</li>
            <li>Private session sketches (e.g. quiz draft tab)</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          className="btn-ghost text-sm w-full sm:w-auto min-h-[44px] touch-manipulation border border-slate-700 opacity-60 cursor-not-allowed"
          disabled
          aria-disabled="true"
          title="Cloud sync backend is not connected on this build."
        >
          Connect cloud sync (planned)
        </button>
        <Link
          to="/progress#backup"
          className="btn w-full sm:w-auto text-center text-sm min-h-[44px] touch-manipulation"
        >
          Use local export instead →
        </Link>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800 pt-2">
        Privacy: when sync is enabled in a future build, you’ll choose your own provider key (e.g. passkey + your storage).
        You can disconnect any time and stay local-only — your JSON export shape will not change.
      </p>
    </section>
  );
}
