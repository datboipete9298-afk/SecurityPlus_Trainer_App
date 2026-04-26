import { Link } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { allQuestions } from "../data/quizzes";
import { labs } from "../data/labs";

export default function WeakPage() {
  const { state, addMistakeFlashcards } = useProgress();
  const missed = [...state.missedJournal].reverse().slice(0, 12);
  const weakDom = Object.entries(state.domainScore)
    .filter(([, v]) => v < 55)
    .sort((a, b) => a[1] - b[1]);

  return (
    <div>
      <h1 className="h1">Weak area repair</h1>
      <p className="text-slate-400 text-sm max-w-2xl">
        Built from missed quiz IDs, low domain scores, and (next) failed cards. Use the links — same order as Messer; repair, then move forward.
      </p>
      <div className="card mt-6">
        <h2 className="font-bold text-white">Missed question journal</h2>
        <ul className="mt-2 text-sm space-y-1">
          {missed.length === 0 && <li className="text-slate-500">No misses logged yet — take a quiz.</li>}
          {missed.map((m) => {
            const q = allQuestions().find((x) => x.id === m.qid);
            return (
              <li key={m.at} className="text-slate-300">
                {q?.text.slice(0, 80)}… →{" "}
                <Link className="text-emerald-400" to={`/quiz/${m.lessonId}`}>
                  retry lesson quiz
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="card mt-4">
        <h2 className="font-bold text-white">Domain scores</h2>
        <ul className="text-sm text-slate-300 mt-2">
          {weakDom.map(([d, v]) => (
            <li key={d}>
              Domain {d}: {v} — do 5 extra questions in that domain as you add them to data files.
            </li>
          ))}
        </ul>
      </div>
      <div className="card mt-4">
        <h2 className="font-bold text-white">Turn mistakes into flashcards</h2>
        <p className="text-sm text-slate-400 mt-1">
          Builds review cards from your missed-question journal (question, correct option, explanation, exam keyword) and stores them in localStorage with your other progress.
        </p>
        <button type="button" className="btn mt-3" onClick={() => addMistakeFlashcards()}>
          Turn mistakes into flashcards
        </button>
        <p className="text-xs text-slate-500 mt-2">User flashcards: {state.userFlashcards.length} — open Flashcards to study them.</p>
      </div>
      <div className="card mt-4">
        <h2 className="font-bold text-white">Safe labs (refresh)</h2>
        <ul className="list-disc pl-4 text-slate-400 text-sm">
          {labs.slice(0, 4).map((l) => (
            <li key={l.id}>
              {l.title} — {l.safeWarning}
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500 mt-2">Follow steps on your own machine; no real targets.</p>
      </div>
    </div>
  );
}
