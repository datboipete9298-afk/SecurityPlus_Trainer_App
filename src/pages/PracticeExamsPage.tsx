import { Link } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { questionsByLesson } from "../data/quizzes";
import { useProgress } from "../context/ProgressContext";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";
import { readinessTrack } from "../utils/readinessBand";
import PracticeExamDraftResume from "../components/PracticeExamDraftResume";
import { readPracticeExamDraft } from "../utils/practiceExamDraft";

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
  const { state, readiness, addMistakeFlashcards, bumpStudyResume } = useProgress();
  const attempts = state.practiceExamAttempts ?? [];
  const track = useMemo(() => readinessTrack(readiness.score, readiness.label), [readiness.score, readiness.label]);

  useEffect(() => {
    bumpStudyResume({ practiceExamsHub: true });
  }, [bumpStudyResume]);

  const weakAreas = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d}`),
    [state.domainScore],
  );

  return (
    <AppShell>
      <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="min-w-0 space-y-8 max-w-2xl">
          <PracticeExamDraftResume />
          <PageHeader
            title="Practice exam hub"
            purpose="Train like test day: Exam mode hides explanations until the end; Study mode gives feedback after each question. Misses feed weak domains and can become flashcards."
            badge={<StatusBadge tone="accent">A · B · C</StatusBadge>}
          />

          <SectionCard
            title="Exam mode vs study mode"
            subtitle="Pick the discipline you need today"
          >
            <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
              <li>
                <strong className="text-white">Exam mode:</strong> no per-question grading until you finish — AI help stays off until the review screen (same discipline as the real exam).
              </li>
              <li>
                <strong className="text-white">Study mode:</strong> check each answer, read the explanation, then use AI for traps and keywords.
              </li>
              <li>
                <strong className="text-white">Review mistakes:</strong> after an exam attempt, open &quot;Review misses&quot; to study only what you missed.
              </li>
              <li>
                <strong className="text-white">Readiness:</strong> completing exams and fixing weak domains nudges your readiness score — it is a heuristic from local progress, not a guarantee.
              </li>
            </ul>
          </SectionCard>

          <div className="card border-slate-700 space-y-2">
            <p className="text-xs uppercase text-slate-500">Exam readiness (local)</p>
            <p className="text-xs text-emerald-300/90 font-medium uppercase tracking-wide">You&apos;re on track</p>
            <p className="text-lg font-semibold text-white">{track.headline}</p>
            <p className="text-sm text-slate-400 leading-relaxed">{track.sub}</p>
            <p className="text-2xl font-semibold text-white pt-1">{readiness.score}%</p>
            <p className="text-sm text-slate-500 capitalize">{readiness.label.replace("_", " ")}</p>
          </div>

          <SectionCard title="Quick practice (5 questions)" subtitle="No need for a full exam today">
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">
              Same bank as Exam A–C, but only five items in study mode — explanations after each answer. Use this when a full timed run feels like too much.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
              <Link to="/quiz/messer-exam-a?mode=study&quick=5" className="btn w-full sm:w-auto text-center">
                Quick practice (5) — Exam A bank
              </Link>
              <Link to="/quiz/messer-exam-b?mode=study&quick=5" className="btn-ghost w-full sm:w-auto text-center">
                Exam B mix
              </Link>
              <Link to="/quiz/messer-exam-c?mode=study&quick=5" className="btn-ghost w-full sm:w-auto text-center">
                Exam C mix
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Disclaimer" subtitle="Personal study only">
            <p className="text-sm text-slate-400">
              These banks are for <strong className="text-slate-200">personal study</strong> with in-app content. For live-accurate PBQs and policy-bound exams, use official CompTIA materials. PBQ-style ordering drills:{" "}
              <Link to="/practice-exams/pbq" className="text-emerald-400 underline">
                skill labs
              </Link>
              .
            </p>
          </SectionCard>

          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Full exams</h2>
            <ul className="space-y-4">
              {EXAMS.map((e) => {
                const qs = questionsByLesson(e.id);
                const n = qs.length;
                const est = Math.max(15, Math.round(n * 1.1));
                const lastAttempts = attempts.filter((a) => a.examId === e.id);
                const last = lastAttempts[lastAttempts.length - 1];
                const draft = readPracticeExamDraft(e.id);

                return (
                  <li key={e.id} className="card flex flex-col gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{e.label}</h3>
                      <p className="text-xs text-slate-500 mt-1">{e.blurb}</p>
                      <ul className="mt-3 text-sm text-slate-400 space-y-1">
                        <li>
                          <strong className="text-slate-300">{n}</strong> questions
                        </li>
                        <li>
                          Time estimate: <strong className="text-slate-300">{fmtMin(est)}</strong>
                        </li>
                        <li>Includes select-all-that-apply style items</li>
                        {last && (
                          <li className="text-emerald-200/80">
                            Last exam: {last.correct}/{last.total} ({Math.round((last.correct / last.total) * 100)}%)
                          </li>
                        )}
                        {draft && (
                          <li className="text-amber-200/90">
                            Session-only draft in this browser (not in backup) — use Resume exam or the dashboard card
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                      <Link to={`/quiz/${e.id}?mode=exam`} className="btn w-full sm:w-auto text-center">
                        Exam mode
                      </Link>
                      <Link to={`/quiz/${e.id}?mode=study`} className="btn-ghost w-full sm:w-auto text-center">
                        Study mode
                      </Link>
                      <Link to={`/quiz/${e.id}?mode=study&quick=5`} className="btn-ghost w-full sm:w-auto text-center text-sky-200 border-sky-800/40">
                        Quick practice (5)
                      </Link>
                      {draft && (
                        <Link to={`/quiz/${e.id}?mode=exam`} className="btn-ghost w-full sm:w-auto text-center text-amber-300 border-amber-800/50">
                          Resume exam
                        </Link>
                      )}
                      {last && last.wrongIds.length > 0 && (
                        <Link to={`/quiz/${e.id}?mode=study&wrongOnly=1`} className="btn-ghost w-full sm:w-auto text-center text-rose-200">
                          Review misses ({last.wrongIds.length})
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <SectionCard title="After a miss" subtitle="Flashcards + weak areas">
            <p className="text-sm text-slate-400">
              Wrong answers already nudge domain scores. Batch-create flashcards from your missed-question journal:
            </p>
            <button type="button" className="btn-ghost w-full sm:w-auto mt-3 text-sm" onClick={() => addMistakeFlashcards()}>
              Convert recent misses to flashcards
            </button>
            <p className="text-xs text-slate-500 mt-3">
              Playlist:{" "}
              <a
                href="https://www.youtube.com/playlist?list=PLG49S3nxzAnl4QDVqK-hOnoqcSKEIDDuv"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline"
              >
                Professor Messer SY0-701
              </a>
            </p>
          </SectionCard>

          <NextActionCard label="Next step" description="Run one exam in exam mode, then review every miss in study mode or flashcards.">
            <Link to="/flashcards" className="btn-ghost w-full sm:w-auto text-center inline-block">
              Open flashcards →
            </Link>
          </NextActionCard>
        </div>

        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "quiz",
            weakAreas,
            userProgress: { readiness: readiness.score, attempts: attempts.length },
            quiz: {
              stem: "Practice exams hub — ask about exam strategy, timing, or how to review misses.",
              options: [],
              explanation: `Readiness about ${readiness.score}% (${readiness.label.replace("_", " ")}).`,
            },
            coachLines: [`Last attempts stored: ${attempts.length}`],
          }}
        />
      </div>
    </AppShell>
  );
}
