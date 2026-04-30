import { useForeignWriteCue } from "../utils/crossTabWriteWatcher";

/**
 * Soft inline cue that another tab just saved progress.
 *
 * Used on Progress + Lesson where seeing stale data could confuse the user.
 * Renders only briefly (~10 s after the foreign write); collapses completely
 * when no recent cross-tab write has happened.
 */
export default function ForeignWriteCue() {
  const cue = useForeignWriteCue();
  if (!cue) return null;
  return (
    <p
      className="text-xs text-amber-100/95 leading-relaxed rounded-lg border border-amber-700/55 bg-amber-950/30 px-3 py-2.5"
      role="status"
      aria-live="polite"
    >
      <strong className="text-amber-50">Heads up:</strong> another tab just saved progress on this device.
      Refresh this tab to see the latest, or close the other tab to keep editing here.
    </p>
  );
}
