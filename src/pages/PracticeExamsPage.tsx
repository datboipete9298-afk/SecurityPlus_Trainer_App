import { Link } from "react-router-dom";
import { useMemo, useEffect } from "react";
import { questionsByLesson } from "../data/quizzes";
import { useProgress } from "../context/ProgressContext";
import ContinueButton from "../components/ContinueButton";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";
import { readinessTrack, weakestDomainHintFromScores } from "../utils/readinessBand";
import PracticeExamDraftResume from "../components/PracticeExamDraftResume";
import TrustReminderStrip from "../components/TrustReminderStrip";
import { readPracticeExamDraft } from "../utils/practiceExamDraft";
import CoachLine from "../components/CoachLine";

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
  const { state, readiness, addMistakeFlashcards, bumpStudyResume, nextStep } = useProgress();
  const attempts = state.practiceExamAttempts ?? [];
  const weakestHint = useMemo(() => weakestDomainHintFromScores(state.domainScore), [state.domainScore]);
  const track = useMemo(
    () => readinessTrack(readiness.score, readiness.label, { weakestDomainHint: weakestHint }),
    [readiness.score, readiness.label, weakestHint],
  );

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
          <FlowPrimaryStrip>
            <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />
          </FlowPrimaryStrip>
          <PageHeader
            title="Practice exam hub"
            purpose="Pick an exam below — Exam mode saves grading for the end; Study mode checks each question. A score only shows where to study next; it does not measure your worth as a student."
            badge={<StatusBadge tone="accent">A · B · C</StatusBadge>}
          />
          <CoachLine k="practiceExamWhen" />
          <TrustReminderStrip dense />

          <details className="rounded-2xl border border-slate-700 bg-slate-900/35 group">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-slate-100 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
              Exam vs study mode (read if unsure)
            </summary>
            <div className="px-4 pb-4 border-t border-slate-800 pt-3">
              <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5 leading-relaxed">
                <li>
                  <strong className="text-white">Exam mode:</strong> grading at the end; no AI until review.
                </li>
                <li>
                  <strong className="text-white">Study mode:</strong> check each answer as you go.
                </li>
                <li>
                  <strong className="text-white">Review misses:</strong> after a run, study only wrong items.
                </li>
                <li>
                  <strong className="text-white">Readiness:</strong> from your practice here only — not a pass promise.
                </li>
              </ul>
            </div>
          </details>

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

          <details className="rounded-2xl border border-slate-700 bg-slate-900/35 group">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm text-slate-400 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
              After a miss · flashcards · playlist
            </summary>
            <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-3">
              <p className="text-sm text-slate-400">Turn recent misses into cards:</p>
              <button type="button" className="btn-ghost w-full text-sm min-h-[44px]" onClick={() => addMistakeFlashcards()}>
                Convert misses to flashcards
              </button>
              <p className="text-xs text-slate-500">
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
              <Link to="/flashcards" className="btn-ghost w-full text-center inline-block min-h-[44px] border border-slate-600 leading-[44px]">
                Open flashcards
              </Link>
            </div>
          </details>
        </div>

        <details className="rounded-2xl border border-violet-900/45 bg-violet-950/15 lg:sticky lg:top-4 group">
          <summary className="cursor-pointer list-none px-3 py-3 text-sm font-medium text-violet-100 touch-manipulation min-h-[48px] flex items-center [&::-webkit-details-marker]:hidden">
            <span className="text-violet-400/90 mr-2 group-open:rotate-90 transition-transform inline-block">▸</span>
            Ask something (optional)
          </summary>
          <div className="p-2 pt-0">
            <AITutorPanel
              className="!border-0 rounded-xl bg-violet-950/20"
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
        </details>
      </div>
    </AppShell>
  );
}
