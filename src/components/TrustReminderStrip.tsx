/**
 * Single source of truth for local-data + readiness + tutor expectations — reused on key hubs.
 */
export default function TrustReminderStrip({ dense = false }: { dense?: boolean }) {
  return (
    <aside
      className={`rounded-xl border border-slate-700/85 bg-slate-900/50 text-slate-500 ${dense ? "text-[10px] leading-relaxed px-3 py-2.5" : "text-[11px] leading-relaxed px-4 py-3"}`}
      role="note"
      aria-label="How your study data works on this device"
    >
      <strong className="text-slate-400 font-semibold">Local &amp; optional:</strong> progress and PDF copies stay only in{" "}
      <strong className="text-slate-400">this browser</strong>. Export a JSON backup on{" "}
      <strong className="text-slate-400">Progress</strong> before reinstalling OS or clearing site data.
      {" "}
      <strong className="text-slate-400">Readiness scores</strong> reflect practice patterns here — not CompTIA&apos;s unpublished cut scores.
      {" "}
      <strong className="text-slate-400">Study tutor AI</strong> is optional; lessons and quizzes behave the same without it.
    </aside>
  );
}
