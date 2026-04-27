import { Link } from "react-router-dom";
import { examReadiness } from "../utils/adaptive";
import type { DomainId } from "../types";
import type { PersistedState } from "../utils/storage";

export type ExamResultRow = { qid: string; domain: DomainId; correct: boolean };

type Props = {
  examLabel: string;
  results: ExamResultRow[];
  persisted: PersistedState;
};

const DOMAIN_LABEL: Record<string, string> = {
  "1": "General Security Concepts",
  "2": "Threats, Vulnerabilities & Mitigations",
  "3": "Security Architecture",
  "4": "Security Operations",
  "5": "Security Program Management",
};

export default function ExamReport({ examLabel, results, persisted }: Props) {
  const byDom: Record<string, { c: number; w: number }> = {};
  for (const r of results) {
    const d = r.domain;
    if (!byDom[d]) byDom[d] = { c: 0, w: 0 };
    if (r.correct) byDom[d].c += 1;
    else byDom[d].w += 1;
  }
  const domains = Object.keys(byDom).sort();
  const pct = results.length ? Math.round((results.filter((r) => r.correct).length / results.length) * 100) : 0;
  const readiness = examReadiness(persisted);
  const weak = (["1", "2", "3", "4", "5"] as const)
    .map((d) => ({ domain: d, score: persisted.domainScore[d] ?? 50 }))
    .filter((x) => x.score < 60)
    .sort((a, b) => a.score - b.score);

  return (
    <div className="rounded-2xl border border-amber-800/40 bg-amber-950/15 p-4 space-y-4">
      <h2 className="text-lg font-bold text-white">Exam report · {examLabel}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-600 bg-slate-900/40 p-3">
          <p className="text-xs uppercase text-slate-500 font-semibold mb-2">This attempt</p>
          <p className="text-3xl font-bold text-emerald-300">{pct}%</p>
          <p className="text-xs text-slate-400 mt-1">
            {results.filter((r) => r.correct).length} / {results.length} correct
          </p>
        </div>
        <div className="rounded-xl border border-slate-600 bg-slate-900/40 p-3">
          <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Overall readiness (app model)</p>
          <p className="text-3xl font-bold text-amber-200">{readiness.score}%</p>
          <p className="text-xs text-slate-400 mt-1 capitalize">Status: {readiness.label.split("_").join(" ")}</p>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Domain breakdown (this exam)</p>
        <ul className="space-y-2 text-sm">
          {domains.map((d) => {
            const { c, w } = byDom[d]!;
            const t = c + w;
            const p = t ? Math.round((c / t) * 100) : 0;
            return (
              <li key={d} className="flex justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-slate-300">{DOMAIN_LABEL[d] ?? `Domain ${d}`}</span>
                <span className={p >= 70 ? "text-emerald-300" : "text-rose-300"}>
                  {p}% ({c}/{t})
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="text-xs uppercase text-rose-300/90 font-semibold mb-2">Weakest domains (rolling scores)</p>
        {weak.length === 0 ? (
          <p className="text-xs text-slate-500">No domain under 60 in your rolling scores.</p>
        ) : (
          <ul className="list-disc pl-4 text-sm text-slate-300 space-y-1">
            {weak.slice(0, 3).map((w) => (
              <li key={w.domain}>
                {DOMAIN_LABEL[w.domain] ?? `Domain ${w.domain}`}: {w.score}%
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="text-sm text-slate-300 border-t border-slate-700 pt-3">
        <p className="font-medium text-white mb-2">Recommended actions</p>
        <ul className="list-disc pl-4 space-y-1 text-slate-400">
          {pct < 80 && <li>Re-run missed stems in study mode until tutor feedback feels repetitive.</li>}
          {weak[0] && (
            <li>
              <Link className="text-emerald-400 underline" to="/weak">
                Repair weak queue
              </Link>{" "}
              — domain {weak[0].domain} needs volume.
            </li>
          )}
          <li>
            <Link className="text-emerald-400 underline" to="/flashcards">
              Priority flashcards
            </Link>{" "}
            (sorted by mistake heat).
          </li>
          <li>
            <Link className="text-emerald-400 underline" to="/practice-exams">
              Another exam form
            </Link>{" "}
            after a short break.
          </li>
        </ul>
      </div>
    </div>
  );
}
