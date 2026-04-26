import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPbq } from "../data/pbqCatalog";
import { useProgress } from "../context/ProgressContext";

function shuffledOrder(correct: number[]): number[] {
  const a = [...correct];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  const ok = a.every((v, i) => v === correct[i]);
  return ok ? [...a].sort((x, y) => (x - y === 0 ? 0 : y - x)) : a;
}

export default function PbqRunnerPage() {
  const { id } = useParams();
  const def = id ? getPbq(id) : undefined;
  const { recordPbqMiss, grantXp } = useProgress();
  const [order, setOrder] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!def) return;
    setOrder(shuffledOrder(def.correctOrder));
    setSubmitted(false);
  }, [def, retryKey]);

  if (!def) {
    return (
      <div className="card">
        <p>Unknown PBQ lab.</p>
        <Link to="/practice-exams/pbq" className="btn mt-2 inline-block">
          PBQ hub
        </Link>
      </div>
    );
  }

  if (!order.length) {
    return (
      <div className="card">
        <p className="text-slate-400">Loading lab…</p>
      </div>
    );
  }

  const currentOrder = order;
  const labels = currentOrder.map((idx) => def.items[idx]!);

  const move = (pos: number, dir: -1 | 1) => {
    if (submitted) return;
    const next = [...currentOrder];
    const j = pos + dir;
    if (j < 0 || j >= next.length) return;
    [next[pos], next[j]] = [next[j]!, next[pos]!];
    setOrder(next);
  };

  const grade = () => {
    const ok = currentOrder.every((v, i) => v === def.correctOrder[i]);
    setSubmitted(true);
    if (ok) grantXp(15);
    else recordPbqMiss(def.domain, def.id);
  };

  const reset = () => {
    setSubmitted(false);
    setRetryKey((k) => k + 1);
  };

  const correct = submitted && currentOrder.every((v, i) => v === def.correctOrder[i]);

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/practice-exams/pbq" className="text-sm text-emerald-400 hover:underline">
        ← PBQ hub
      </Link>
      <div>
        <h1 className="h1 mt-2">{def.title}</h1>
        <p className="text-slate-400 text-sm mt-2">{def.scenario}</p>
      </div>
      <div className="card space-y-3">
        <p className="text-slate-200 font-medium">{def.task}</p>
        <ol className="space-y-2" key={retryKey}>
          {labels.map((text, pos) => (
            <li
              key={`${pos}-${text.slice(0, 12)}`}
              className={`flex flex-col sm:flex-row gap-2 sm:items-start rounded-lg border px-3 py-3 text-[15px] sm:text-sm ${
                submitted
                  ? currentOrder[pos] === def.correctOrder[pos]
                    ? "border-emerald-700 bg-emerald-950/30"
                    : "border-rose-800 bg-rose-950/20"
                  : "border-slate-700 bg-slate-800/40"
              }`}
            >
              <div className="flex gap-2 flex-1 min-w-0">
                <span className="text-slate-500 w-6 shrink-0 pt-0.5">{pos + 1}.</span>
                <span className="text-slate-200 flex-1 leading-snug">{text}</span>
              </div>
              {!submitted && (
                <div className="flex gap-2 w-full sm:w-auto sm:shrink-0">
                  <button
                    type="button"
                    className="btn-ghost flex-1 sm:flex-none min-h-[48px] text-sm px-3 touch-manipulation"
                    onClick={() => move(pos, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="btn-ghost flex-1 sm:flex-none min-h-[48px] text-sm px-3 touch-manipulation"
                    onClick={() => move(pos, 1)}
                  >
                    Down
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
        {!submitted && (
          <button type="button" className="btn" onClick={grade}>
            Submit
          </button>
        )}
        {submitted && (
          <div className="text-sm space-y-2 border-t border-slate-800 pt-4">
            <p className={correct ? "text-emerald-300" : "text-rose-300"}>{correct ? "Correct — nice work." : "Not quite — compare to the rationale below."}</p>
            <p className="text-slate-300">{def.explanation}</p>
            <p className="text-xs text-slate-500">
              <strong className="text-slate-400">What Security+ is testing:</strong> {def.examTests}
            </p>
            <button type="button" className="btn-ghost mt-2" onClick={reset}>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
