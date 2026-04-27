import { Link } from "react-router-dom";

/** Trust + backup — keep messaging honest and non-alarming. */
export default function ProgressSafetyCard() {
  return (
    <section
      className="rounded-2xl border border-teal-800/45 bg-teal-950/25 px-4 py-4 space-y-2"
      aria-labelledby="progress-safety-h"
    >
      <h2 id="progress-safety-h" className="text-sm font-bold text-teal-100 uppercase tracking-wide">
        Your progress is yours — keep a copy
      </h2>
      <p className="text-sm text-slate-300 leading-relaxed">
        Everything saves in <strong className="text-slate-100">this browser only</strong>. Clearing site data, another device, or another browser starts fresh — use{" "}
        <strong className="text-slate-100">Progress → Backup &amp; export</strong> (not the Import menu item, which is for lesson authors).
      </p>
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Link to="/progress#backup" className="btn w-full sm:w-auto text-center text-sm min-h-[44px] touch-manipulation">
          Backup &amp; export →
        </Link>
        <p className="text-xs text-slate-500 sm:self-center sm:pl-2">
          Takes seconds. No account required.
        </p>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed border-t border-teal-900/40 pt-2">
        Percentages and readiness in the app are <strong className="text-slate-400">honest signals from your practice here</strong> — useful for steering, not a promise about the real CompTIA exam.
      </p>
    </section>
  );
}
