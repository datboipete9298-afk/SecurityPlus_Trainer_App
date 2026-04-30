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
      <strong className="text-slate-400 font-semibold">On this device:</strong> PDF text you import and your study progress stay in{" "}
      <strong className="text-slate-400">this browser</strong> until you export JSON on{" "}
      <strong className="text-slate-400">Progress</strong>. Readiness scores are a{" "}
      <strong className="text-slate-400">practice signal</strong> — not CompTIA’s official cut.{" "}
      <strong className="text-slate-400">Study tutor AI</strong> is optional; the{" "}
      <strong className="text-slate-400">built-in coach</strong> keeps lessons and quizzes usable when the API is off.
    </aside>
  );
}
