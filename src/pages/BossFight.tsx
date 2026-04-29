import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import FailureRecoveryPanel from "../components/FailureRecoveryPanel";
import { getBossDef } from "../data/bossFights";
import { lessons } from "../data/lessons";
import { useProgress } from "../context/ProgressContext";
import type { DomainId } from "../types";
import FeedbackPanel from "../components/FeedbackPanel";
import ConfidenceSelector from "../components/ConfidenceSelector";
import { buildQuizTutorFeedback } from "../core/feedbackEngine";
import { conceptKey } from "../core/adaptiveEngine";
import type { UserConfidenceLevel } from "../utils/storage";
import { emptyFeedbackLoop } from "../utils/storage";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";

export default function BossFight() {
  const { id } = useParams();
  const boss = id ? getBossDef(id) : undefined;
  const {
    recordQuiz,
    completeBoss,
    state,
    recordQuizConfidence,
    markQuestionConfusing,
    bumpQuizRetryCount,
    addFlashcardFromQuizQuestion,
    nextStep,
    bumpStudyResume,
  } = useProgress();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [show, setShow] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [confidenceGate, setConfidenceGate] = useState<UserConfidenceLevel | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);
  const applied = useRef(false);
  const qs = boss?.questions ?? [];
  const qLen = qs.length;
  const q = qs[i];

  const weakAreas = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d}`),
    [state.domainScore],
  );

  const aiLesson = useMemo(() => {
    if (!boss) return undefined;
    const lid = boss.relatedLessons[0] ?? "1-1";
    const L = lessons[lid];
    return L ? { id: lid, title: L.title, domain: boss.domain } : { id: lid, title: lid, domain: boss.domain };
  }, [boss]);

  useEffect(() => {
    applied.current = false;
  }, [id]);

  useEffect(() => {
    if (boss?.id) bumpStudyResume({ bossId: boss.id });
  }, [boss?.id, bumpStudyResume]);

  useEffect(() => {
    if (!showResult || !boss || applied.current) return;
    applied.current = true;
    const pct = Math.round((score / Math.max(qLen, 1)) * 100);
    const pass = pct >= 70;
    const rel = boss.relatedLessons[0] ?? "1-1";
    completeBoss(boss.id, pass, pass ? boss.xpReward : 0, rel, boss.domain as DomainId);
  }, [showResult, boss, score, qLen, completeBoss]);

  const tutorFeedback = useMemo(() => {
    if (!show || !q) return null;
    const correct = sel === q.correctIndex;
    const w = state.questionStats[q.id]?.w ?? 0;
    const missBefore = correct ? w : Math.max(0, w - 1);
    const fl = state.feedbackLoop ?? emptyFeedbackLoop();
    const fc = fl.falseConfidenceHitsByQuestionId[q.id] ?? 0;
    const ck = conceptKey(q.lessonId, q.examKeyword);
    const confusionHits = fl.confusionSignalByConcept[ck] ?? 0;
    return buildQuizTutorFeedback(q, sel, [], {
      missStreakBefore: missBefore,
      falseConfidenceHitsAfterAttempt: fc,
      confusionHits,
      feedbackLoop: fl,
    });
  }, [show, q, sel, state.questionStats, state.feedbackLoop]);

  if (!boss || !q) {
    return (
      <AppShell>
        <div className="max-w-xl space-y-4">
          <PageHeader
            title="Boss not found"
            purpose="That URL doesn’t map to a boss fight anymore — pick one from the hub. Your progress is safe."
          />
          <Link to="/boss" className="btn w-full sm:w-auto text-center inline-block min-h-[48px] touch-manipulation">
            All bosses →
          </Link>
        </div>
      </AppShell>
    );
  }

  const pick = (idx: number) => {
    if (show) return;
    setSel(idx);
  };

  const confirmAnswer = () => {
    if (show || sel == null) return;
    setShow(true);
    const ok = sel === q.correctIndex;
    if (ok) setScore((s) => s + 1);
    recordQuiz(q.id, q.lessonId, q.domain, ok, q.examKeyword);
  };

  const resetQ = () => {
    bumpQuizRetryCount(q.id);
    setShow(false);
    setSel(null);
    setConfidenceGate(null);
    setDetailOpen(false);
  };

  const goNext = () => {
    if (confidenceGate == null) return;
    recordQuizConfidence(q.id, confidenceGate, sel === q.correctIndex);
    setConfidenceGate(null);
    setDetailOpen(true);
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
      <AppShell>
        <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
          <div className="min-w-0 space-y-6 max-w-xl">
            <PageHeader
              title={`${boss.name} — result`}
              purpose={
                pass
                  ? "You cleared the milestone — XP granted. Replay anytime for speed."
                  : "Below 70% — weak domain nudged and misses logged. Review the related lesson, then rematch."
              }
              badge={<StatusBadge tone={pass ? "ok" : "warn"}>{pct}%</StatusBadge>}
            />

            <SectionCard title="Score" subtitle={`Pass ≥ 70% · ${score} / ${qs.length} correct`}>
              <p className="text-3xl font-bold text-white">{pct}%</p>
              {pass ? (
                <p className="text-emerald-400 mt-2 text-sm">Victory! +{boss.xpReward} XP granted.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  <FailureRecoveryPanel
                    tone="amber"
                    title="Boss not cleared — that’s normal on a first pass"
                    whatHappened={`You finished at ${pct}%; this boss needs 70% to clear.`}
                    whyItMatters="Boss items chain scenarios like the real exam. Each miss is a cheap lesson about which objective family still needs volume."
                    nextStep="Repair, then rematch — same boss, sharper pattern recognition."
                    ariaLabel="Boss fight recovery"
                    actions={
                      <>
                        <Link to={`/boss/${boss.id}`} reloadDocument className="btn text-sm min-h-[44px] justify-center touch-manipulation">
                          Retry boss
                        </Link>
                        <Link to={`/lesson/${rel}`} className="btn text-sm min-h-[44px] justify-center touch-manipulation">
                          Related lesson
                        </Link>
                        <Link to="/weak" className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation">
                          Weak areas
                        </Link>
                        <Link to={`/flashcards?lesson=${rel}`} className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation">
                          Flashcards
                        </Link>
                        <Link to={`/quiz/${rel}?quick=5`} className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation">
                          Quick quiz (5)
                        </Link>
                      </>
                    }
                  />
                </div>
              )}
              <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
                <Link to="/boss" className="btn-ghost w-full sm:w-auto text-center">
                  All bosses
                </Link>
                {pass && (
                  <>
                    <Link to={`/lesson/${rel}`} className="btn w-full sm:w-auto text-center">
                      Related lesson
                    </Link>
                    <Link to={`/boss/${boss.id}`} reloadDocument className="btn-ghost w-full sm:w-auto text-center">
                      Replay boss
                    </Link>
                  </>
                )}
              </div>
            </SectionCard>

            <NextActionCard label="Suggested next" description="Keep your lesson path, or drill weak areas before another boss.">
              <Link to={nextStep.href} className="btn w-full text-center">
                {nextStep.buttonLabel} →
              </Link>
            </NextActionCard>
          </div>

          <AITutorPanel
            className="lg:sticky lg:top-4 order-first lg:order-none"
            context={{
              surface: "quiz",
              lesson: aiLesson,
              weakAreas,
              quiz: {
                stem: `${boss.name} result: ${pct}% (${pass ? "pass" : "fail"})`,
                options: [],
                explanation: boss.scenario.slice(0, 200),
              },
              coachLines: pass
                ? ["Nice work — schedule the next boss after related lessons stick."]
                : ["Read related lesson highlights, then retry with the same stem discipline."],
            }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="min-w-0 space-y-4 max-w-2xl">
          <PageHeader
            eyebrow={`Question ${i + 1} / ${qs.length} · Domain ${boss.domain}`}
            title={boss.name}
            purpose={boss.scenario}
            badge={<StatusBadge tone="accent">+{boss.xpReward} XP</StatusBadge>}
          />

          <SectionCard title="Requirement" subtitle="Answer each item with Check my answer — 70%+ to pass">
            <p className="text-xs text-slate-500">
              Topics draw from: {boss.relatedLessons.map((lid) => lessons[lid]?.title ?? lid).join(" · ")}
            </p>
          </SectionCard>

          <div className="card">
            <p className="text-slate-100 font-medium leading-snug">{q.text}</p>
            <ul className="mt-3 space-y-2">
              {q.options.map((o, j) => (
                <li key={j}>
                  <button
                    type="button"
                    disabled={show}
                    onClick={() => pick(j)}
                    className={`w-full text-left rounded-xl px-4 py-3 border text-sm min-h-[52px] touch-manipulation ${
                      !show
                        ? sel === j
                          ? "border-sky-500 bg-sky-900/25"
                          : "border-slate-600 hover:border-emerald-600 bg-slate-800/50"
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
            {!show && (
              <p className="text-xs text-slate-500 mt-3">
                Choose an answer, then <strong className="text-slate-300">Check my answer</strong>.
              </p>
            )}
            {!show && sel != null && (
              <button type="button" className="btn w-full sm:w-auto mt-3" onClick={confirmAnswer}>
                Check my answer
              </button>
            )}
            {show && tutorFeedback && (
              <div className="mt-4">
                <FeedbackPanel
                  feedback={tutorFeedback}
                  quizQuestion={q}
                  singleSel={sel}
                  multiSel={[]}
                  keywordLine={q.examKeyword}
                  detailOpen={detailOpen}
                  onDetailOpenChange={setDetailOpen}
                />
                <ConfidenceSelector value={confidenceGate} onChange={setConfidenceGate} />
                <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
                  <button type="button" className="btn w-full sm:w-auto" disabled={confidenceGate == null} onClick={goNext}>
                    {i < qs.length - 1 ? "Save answer · next question →" : "View score & recap →"}
                  </button>
                  <button type="button" className="btn-ghost text-sm w-full sm:w-auto" onClick={resetQ}>
                    Retry this question
                  </button>
                  <button type="button" className="btn-ghost text-sm w-full sm:w-auto" onClick={() => addFlashcardFromQuizQuestion(q)}>
                    Add to flashcards
                  </button>
                  <button type="button" className="btn-ghost text-sm w-full sm:w-auto" onClick={() => markQuestionConfusing(q.id)}>
                    Mark as confusing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "quiz",
            lesson: aiLesson,
            weakAreas,
            quiz: {
              stem: q.text,
              options: q.options,
              examKeyword: q.examKeyword,
              explanation: q.explanation,
              userWasCorrect: show ? sel === q.correctIndex : undefined,
              selectedLabel: sel != null ? q.options[sel] : undefined,
              correctLabel: q.options[q.correctIndex],
            },
            coachLines: tutorFeedback
              ? [tutorFeedback.explanationSimple, tutorFeedback.examRecognitionRule]
              : [boss.scenario.slice(0, 120)],
          }}
        />
      </div>
    </AppShell>
  );
}
