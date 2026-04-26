import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { simulations } from "../data/simulations";
import { getLabsForLesson } from "../data/labs";
import { useProgress } from "../context/ProgressContext";

export default function SimPage() {
  const { grantXp } = useProgress();
  const [search] = useSearchParams();
  const lesson = search.get("lesson");
  const lessonLabs = lesson ? getLabsForLesson(lesson) : [];
  const sim = simulations[0]!;
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [picked, setPicked] = useState(false);
  const st = sim.steps[step];
  const finished = step >= sim.steps.length;

  return (
    <div className="max-w-2xl">
      <h1 className="h1">Labs & simulations</h1>
      <p className="text-slate-500 text-sm mt-1">Safe, local hands-on — from your lesson’s “Do this now” block.</p>

      {lesson && lessonLabs.length > 0 && (
        <div className="card border-cyan-800/40 mt-4 space-y-3">
          <h2 className="text-sm font-semibold text-cyan-200">Real hands-on for this lesson ({lesson})</h2>
          {lessonLabs.map((lab) => (
            <div key={lab.id} className="border border-slate-700 rounded-lg p-3 text-sm">
              <p className="text-white font-medium">{lab.title}</p>
              <p className="text-slate-400 mt-1">{lab.description}</p>
              {lab.safeWarning && <p className="text-amber-200/80 text-xs mt-2">{lab.safeWarning}</p>}
              <ol className="list-decimal list-inside text-slate-300 mt-2 space-y-1">
                {lab.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
          {lesson && (
            <Link to={`/lesson/${lesson}`} className="btn-ghost text-sm">
              Back to lesson
            </Link>
          )}
        </div>
      )}

      <p className="text-slate-500 text-sm mt-6">{sim.title}</p>
      <p className="text-slate-300 mt-4 text-sm leading-relaxed">{sim.intro}</p>
      {!finished && st && (
        <div className="card mt-4">
          <p className="text-white font-medium">{st.prompt}</p>
          {feedback && <p className="text-xs text-amber-200/80 mt-2 whitespace-pre-line">{feedback}</p>}
          <ul className="mt-3 space-y-2">
            {st.choices.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={picked}
                  onClick={() => {
                    if (picked) return;
                    setPicked(true);
                    setFeedback(c.why);
                    if (c.isBest) grantXp(15);
                    setTimeout(() => {
                      setFeedback(null);
                      setPicked(false);
                      setStep((s) => s + 1);
                    }, 1200);
                  }}
                  className="w-full text-left btn-ghost text-sm"
                >
                  {c.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {finished && <p className="text-emerald-400 mt-4">Module complete. More scenarios: extend src/data/simulations.ts</p>}
    </div>
  );
}
