import { Link } from "react-router-dom";

export type SessionEntry = { qid: string; correct: boolean; keyword: string; textSnippet: string };

type Props = {
  entries: SessionEntry[];
  lessonId?: string;
  title?: string;
};

export default function SessionSummary({ entries, lessonId, title }: Props) {
  const learned = entries.filter((e) => e.correct);
  const struggled = entries.filter((e) => !e.correct);
  return (
    <div className="rounded-2xl border border-slate-600 bg-slate-900/50 p-4 space-y-4">
      <h2 className="text-sm font-bold text-white">{title ?? "Session summary"}</h2>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/15 p-3">
          <p className="text-emerald-300 font-semibold text-xs uppercase mb-2">What went well</p>
          {learned.length === 0 ? (
            <p className="text-slate-500 text-xs">No graded items yet.</p>
          ) : (
            <ul className="space-y-1 text-slate-300 text-xs list-disc pl-4">
              {learned.slice(-8).map((e) => (
                <li key={e.qid}>
                  <span className="text-slate-500">{e.keyword}</span> — {e.textSnippet}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-rose-800/40 bg-rose-950/15 p-3">
          <p className="text-rose-300 font-semibold text-xs uppercase mb-2">Needs reinforcement</p>
          {struggled.length === 0 ? (
            <p className="text-slate-500 text-xs">No misses logged this run.</p>
          ) : (
            <ul className="space-y-1 text-slate-300 text-xs list-disc pl-4">
              {struggled.slice(-8).map((e) => (
                <li key={e.qid}>
                  <span className="text-slate-500">{e.keyword}</span> — {e.textSnippet}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="text-xs text-slate-400 border-t border-slate-800 pt-3">
        <p className="font-medium text-slate-300 mb-1">Suggested next moves</p>
        <ul className="list-disc pl-4 space-y-1">
          {struggled.length > 0 && lessonId && (
            <li>
              <Link className="text-emerald-400 underline" to={`/flashcards?lesson=${lessonId}`}>
                Priority flashcards for this lesson
              </Link>
            </li>
          )}
          {struggled.length > 0 && lessonId && (
            <li>
              <Link className="text-emerald-400 underline" to={`/lesson/${lessonId}`}>
                Redo hands-on labs for this section
              </Link>
            </li>
          )}
          <li>Re-run missed items in study mode until the tutor breakdown feels boring.</li>
        </ul>
      </div>
    </div>
  );
}
