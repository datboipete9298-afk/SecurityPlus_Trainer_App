import { Link } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";

export default function PracticePage() {
  const { state, nextStep } = useProgress();
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="h1">Practice</h1>
      <p className="text-slate-400 text-sm">Quizzes and flashcards — same order as every lesson: test, then recall.</p>
      <div className="card space-y-3">
        <h2 className="font-semibold text-white">Jump in</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/practice-exams" className="btn">
            Practice exams (A/B/C)
          </Link>
          <Link to="/flashcards" className="btn">
            Flashcards
          </Link>
          <Link to="/search" className="btn-ghost">
            Search questions
          </Link>
          <Link to="/weak" className="btn-ghost">
            Weak areas
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Missed questions: {state.missedJournal.length} · User cards: {state.userFlashcards.length}
        </p>
      </div>
      <div className="card border-emerald-800/40">
        <p className="text-xs text-emerald-200/80 uppercase">Continue (system pick)</p>
        <Link to={nextStep.href} className="btn mt-2 inline-block w-full sm:w-auto text-center">
          {nextStep.buttonLabel} →
        </Link>
      </div>
    </div>
  );
}
