import { useBodyScrollLock } from "./useBodyScrollLock";
import type { BeginnerContent } from "../types/beginner";

export default function ExplainSimplerModal({ open, onClose, b }: { open: boolean; onClose: () => void; b: BeginnerContent }) {
  useBodyScrollLock(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70" role="dialog" aria-modal onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-600 bg-slate-900 p-5 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-white">Explain this simpler</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          <p>
            <span className="text-emerald-400 font-semibold">Like I’m 10:</span> {b.explainLike10}
          </p>
          <p>
            <span className="text-emerald-400 font-semibold">Real-world analogy:</span> {b.realWorldAnalogy}
          </p>
          <p>
            <span className="text-emerald-400 font-semibold">What the exam wants:</span> {b.examWants}
          </p>
          <p>
            <span className="text-emerald-400 font-semibold">One sentence:</span> {b.oneSentenceForExam}
          </p>
          {b.scenarioExample && (
            <p>
              <span className="text-emerald-400 font-semibold">Example scenario:</span> {b.scenarioExample}
            </p>
          )}
        </div>
        <button type="button" className="btn mt-5 w-full" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
