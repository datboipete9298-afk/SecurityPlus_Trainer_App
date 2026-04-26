import { Link } from "react-router-dom";
import { questionsByLesson } from "../data/quizzes";
import { useProgress } from "../context/ProgressContext";

const EXAMS = [
  { id: "messer-exam-a", label: "Exam A", blurb: "Professor Messer SY0-701 practice set A (MCQ bank in app)." },
  { id: "messer-exam-b", label: "Exam B", blurb: "Practice set B — new stems, same exam objectives." },
  { id: "messer-exam-c", label: "Exam C", blurb: "Practice set C — third full pass through the objective mix." },
] as const;

function fmtMin(n: number) {
  if (n < 60) return `~${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}

export default function PracticeExamsPage() {
  const { state, readiness, addMistakeFlashcards } = useProgress();
  const attempts = state.practiceExamAttempts ?? [];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="h1">Practice exam hub</h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 leading-relaxed">
          Train like the real exam: use <strong className="text-slate-200">Exam mode</strong> for no hints until the end, or{" "}
          <strong className="text-slate-200">Study mode</strong> for instant explanations. PBQ screens on the exam are best practiced with
          official materials — we provide <Link to="/practice-exams/pbq" className="text-emerald-400 underline">original skill drills</Link>{" "}
          that teach the same thinking without copying proprietary layouts.
        </p>
      </div>

      <div className="card border-slate-700 space-y-2">
        <p className="text-xs uppercase text-slate-500">Readiness (from your local progress)</p>
        <p className="text-2xl font-semibold text-white">{readiness.score}%</p>
        <p className="text-sm text-slate-400">
          Label: <span className="text-emerald-300 capitalize">{readiness.label.replace("_", " ")}</span> — keep drilling weak domains after
          each exam review.
        </p>
      </div>

      <div className="card text-sm text-slate-400 space-y-2 border-amber-900/40 bg-amber-950/20">
        <p>
          These banks are for <strong className="text-slate-200">personal study</strong> with material you supplied in the app. Purchase
          official CompTIA / course resources for live-accurate PBQs and policy-bound practice.
        </p>
      </div>

      <ul className="space-y-4">
        {EXAMS.map((e) => {
          const qs = questionsByLesson(e.id);
          const n = qs.length;
          const est = Math.max(15, Math.round(n * 1.1));
          const lastAttempts = attempts.filter((a) => a.examId === e.id);
          const last = lastAttempts[lastAttempts.length - 1];
          const draft = typeof sessionStorage !== "undefined" && sessionStorage.getItem(`spt_exam_draft_v1_${e.id}`);

          return (
            <li key={e.id} className="card flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{e.label}</h2>
                <p className="text-xs text-slate-500 mt-1">{e.blurb}</p>
                <ul className="mt-3 text-sm text-slate-400 space-y-1">
                  <li>
                    <strong className="text-slate-300">{n}</strong> questions in app
                  </li>
                  <li>
                    Time estimate: <strong className="text-slate-300">{fmtMin(est)}</strong> (≈1 min/question + review)
                  </li>
                  <li>Difficulty: CompTIA-style multiple choice (including select-all-that-apply)</li>
                  {last && (
                    <li className="text-emerald-200/80">
                      Last Exam mode: {last.correct}/{last.total} (
                      {Math.round((last.correct / last.total) * 100)}%)
                    </li>
                  )}
                  {draft && <li className="text-amber-200/90">Resume: saved progress in this browser session</li>}
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                <Link to={`/quiz/${e.id}?mode=exam`} className="btn">
                  Start exam mode
                </Link>
                <Link to={`/quiz/${e.id}?mode=study`} className="btn-ghost">
                  Study mode
                </Link>
                {draft && (
                  <Link to={`/quiz/${e.id}?mode=exam`} className="btn-ghost text-amber-300 border-amber-800/50">
                    Resume exam
                  </Link>
                )}
                {last && last.wrongIds.length > 0 && (
                  <Link to={`/quiz/${e.id}?mode=study&wrongOnly=1`} className="btn-ghost text-rose-200">
                    Review misses ({last.wrongIds.length})
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="card space-y-3">
        <h3 className="font-medium text-white">After a miss</h3>
        <p className="text-sm text-slate-400">
          Wrong practice exam answers already feed weak areas and can become flashcards automatically. Batch-create cards from your recent
          journal:
        </p>
        <button type="button" className="btn-ghost text-sm" onClick={() => addMistakeFlashcards()}>
          Convert recent misses to flashcards
        </button>
        <p className="text-xs text-slate-500">
          Official playlist:{" "}
          <a
            href="https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 underline"
          >
            Professor Messer SY0-701
          </a>
          · Course index:{" "}
          <a
            href="https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 underline"
          >
            professormesser.com
          </a>
        </p>
      </div>

      <p className="text-sm">
        <Link to="/practice-exams/pbq" className="text-emerald-400 underline">
          PBQ-style skill labs →
        </Link>
      </p>
    </div>
  );
}
