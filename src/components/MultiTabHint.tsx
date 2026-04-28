import { useMultiTabPresence } from "../utils/multiTabPresence";

/**
 * Calm inline note rendered only when another tab of this app is detected.
 * Used on Progress + Lesson pages — surfaces alongside existing trust copy
 * without scaring anyone. Hidden completely when no peer tab exists.
 */
export default function MultiTabHint() {
  const peer = useMultiTabPresence();
  if (!peer) return null;
  return (
    <p
      className="text-[11px] text-slate-400 leading-relaxed rounded-lg border border-slate-700/70 bg-slate-900/40 px-3 py-2"
      role="note"
    >
      <strong className="text-slate-200">Heads up:</strong> another tab of this app is open. Use one tab while studying so progress saves cleanly.
    </p>
  );
}
