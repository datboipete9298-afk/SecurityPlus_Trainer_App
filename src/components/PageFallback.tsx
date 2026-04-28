/** Lightweight route-chunk loading UI — keeps first paint small. */
export default function PageFallback() {
  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400 text-sm px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-9 w-9 border-2 border-emerald-700/50 border-t-emerald-400 rounded-full animate-spin"
        aria-hidden
      />
      <p>One moment…</p>
    </div>
  );
}
