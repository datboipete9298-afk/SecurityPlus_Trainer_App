/** Simple conceptual diagram — original, not exam-art. */
export default function InteractiveDiagram({ variant }: { variant: "network" | "zt" }) {
  if (variant === "zt") {
    return (
      <div className="rounded-xl border border-cyan-800/50 bg-slate-900/60 p-4 text-xs text-slate-300">
        <p className="text-cyan-300 font-semibold mb-3">Zero Trust flow (conceptual)</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <div className="rounded-lg border border-slate-600 px-3 py-2 bg-slate-800">User</div>
          <span className="text-slate-500">→</span>
          <div className="rounded-lg border border-emerald-700 px-3 py-2 bg-emerald-950/40">Verify ID</div>
          <span className="text-slate-500">→</span>
          <div className="rounded-lg border border-emerald-700 px-3 py-2 bg-emerald-950/40">Device posture</div>
          <span className="text-slate-500">→</span>
          <div className="rounded-lg border border-violet-700 px-3 py-2 bg-violet-950/40">Least access</div>
        </div>
        <p className="mt-3 text-slate-500">Tap each block in your notes — exam asks “what is verified each hop?”</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300">
      <p className="text-slate-400 font-semibold mb-3">Network path (conceptual)</p>
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <div className="rounded border border-slate-600 px-2 py-1">Client</div>
        <span>—</span>
        <div className="rounded border border-amber-700 px-2 py-1 bg-amber-950/30">Firewall</div>
        <span>—</span>
        <div className="rounded border border-slate-600 px-2 py-1">DMZ</div>
        <span>—</span>
        <div className="rounded border border-rose-800 px-2 py-1 bg-rose-950/20">Internal</div>
      </div>
      <p className="mt-3 text-slate-500">Where would you log first for lateral movement? (Think detective controls.)</p>
    </div>
  );
}
