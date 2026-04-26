import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getBossDef } from "../data/bossFights";
import { useProgress } from "../context/ProgressContext";
import type { DomainId } from "../types";

export default function BossFight() {
  const { id } = useParams();
  const boss = id ? getBossDef(id) : undefined;
  const { recordQuiz, completeBoss } = useProgress();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const applied = useRef(false);
  const qs = boss?.questions ?? [];
  const qLen = qs.length;
  const q = qs[i];

  useEffect(() => {
    applied.current = false;
  }, [id]);

  useEffect(() => {
    if (!showResult || !boss || applied.current) return;
    applied.current = true;
    const pct = Math.round((score / Math.max(qLen, 1)) * 100);
    const pass = pct >= 70;
    const rel = boss.relatedLessons[0] ?? "1-1";
    completeBoss(boss.id, pass, pass ? boss.xpReward : 0, rel, boss.domain as DomainId);
  }, [showResult, boss, score, qLen, completeBoss]);

  if (!boss || !q) {
    return (
      <div className="card">
        <p>Unknown boss.</p>
        <Link to="/boss" className="btn mt-2">
          Back
        </Link>
      </div>
    );
  }

  const pick = (idx: number) => {
    if (show) return;
    setSel(idx);
    setShow(true);
    const ok = idx === q.correctIndex;
    if (ok) setScore((s) => s + 1);
    recordQuiz(q.id, q.lessonId, q.domain, ok);
  };

  const goNext = () => {
    if (i < qs.length - 1) {
      setI(i + 1);
      setSel(null);
      setShow(false);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    const pct = Math.round((score / qs.length) * 100);
    const pass = pct >= 70;
    const rel = boss.relatedLessons[0] ?? "1-1";
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="h1">{boss.name} — result</h1>
        <div className="card">
          <p className="text-3xl font-bold text-white">{pct}%</p>
          <p className="text-slate-400 text-sm">
            {score} / {qs.length} correct · pass ≥ 70%
          </p>
          {pass ? (
            <p className="text-emerald-400 mt-2">Victory! +{boss.xpReward} XP granted.</p>
          ) : (
            <p className="text-amber-300 mt-2">Weak area nudged (domain + journal) — review the related lesson, then rematch.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/boss" className="btn-ghost">
              All bosses
            </Link>
            <Link to={`/lesson/${rel}`} className="btn">
              Related lesson
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-xs text-slate-500">
        {i + 1} / {qs.length} · {boss.name}
      </p>
      <h1 className="h1 text-xl sm:text-2xl">{boss.name}</h1>
      <p className="text-slate-300 text-sm leading-relaxed">{boss.scenario}</p>
      <div className="card">
        <p className="text-slate-100 font-medium leading-snug">{q.text}</p>
        <ul className="mt-3 space-y-2">
          {q.options.map((o, j) => (
            <li key={j}>
              <button
                type="button"
                disabled={show}
                onClick={() => pick(j)}
                className={`w-full text-left rounded-xl px-4 py-3 border text-sm ${
                  !show
                    ? "border-slate-600 hover:border-emerald-600 bg-slate-800/50"
                    : j === q.correctIndex
                      ? "border-emerald-500 bg-emerald-900/30"
                      : j === sel
                        ? "border-rose-500 bg-rose-900/20"
                        : "border-slate-700 opacity-50"
                }`}
              >
                {o}
              </button>
            </li>
          ))}
        </ul>
        {show && (
          <div className="mt-4 text-sm text-slate-300 border-t border-slate-800 pt-3">
            <p>
              <strong className="text-white">Explanation:</strong> {q.explanation}
            </p>
            <button type="button" className="btn mt-3" onClick={goNext}>
              {i < qs.length - 1 ? "Next" : "See score"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
