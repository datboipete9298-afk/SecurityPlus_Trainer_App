import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { getPbq } from "../data/pbqCatalog";
import { SECTION_ORDER } from "../data/sectionOrder";
import { useProgress } from "../context/ProgressContext";
import { buildPbqFirstIdentityLine } from "../utils/identityPersonalization";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import NextActionCard from "../components/NextActionCard";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";
import FailureRecoveryPanel from "../components/FailureRecoveryPanel";

function shuffledOrder(correct: number[]): number[] {
  const a = [...correct];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  const ok = a.every((v, i) => v === correct[i]);
  return ok ? [...a].sort((x, y) => (x - y === 0 ? 0 : y - x)) : a;
}

export default function PbqRunnerPage() {
  const { id } = useParams();
  const def = id ? getPbq(id) : undefined;
  const { recordPbqMiss, recordPbqPass, grantXp, state, nextStep, takeExtensionIdentity, readiness, bumpStudyResume } =
    useProgress();
  const alreadyPassedThisPbq = useMemo(
    () => !!(id && state.pbqPassedIds?.includes(id)),
    [id, state.pbqPassedIds],
  );
  const [order, setOrder] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [pbqIdentityAside, setPbqIdentityAside] = useState<string | null>(null);

  const weakAreas = useMemo(
    () =>
      (["1", "2", "3", "4", "5"] as const)
        .filter((d) => (state.domainScore[d] ?? 50) < 47)
        .map((d) => `Domain ${d}`),
    [state.domainScore],
  );

  useEffect(() => {
    if (!def) return;
    setOrder(shuffledOrder(def.correctOrder));
    setSubmitted(false);
  }, [def, retryKey]);

  useEffect(() => {
    if (!def) return;
    bumpStudyResume({ pbqId: def.id });
  }, [def?.id, bumpStudyResume]);

  if (!def) {
    return (
      <AppShell>
        <PageHeader title="PBQ lab" purpose="Unknown scenario id." />
        <Link to="/practice-exams/pbq" className="btn w-full sm:w-auto text-center inline-block">
          PBQ hub
        </Link>
      </AppShell>
    );
  }

  if (!order.length) {
    return (
      <AppShell>
        <PageHeader title={def.title} purpose="Loading lab…" />
      </AppShell>
    );
  }

  const currentOrder = order;
  const labels = currentOrder.map((idx) => def.items[idx]!);

  const move = (pos: number, dir: -1 | 1) => {
    if (submitted) return;
    const next = [...currentOrder];
    const j = pos + dir;
    if (j < 0 || j >= next.length) return;
    [next[pos], next[j]] = [next[j]!, next[pos]!];
    setOrder(next);
  };

  const grade = () => {
    const ok = currentOrder.every((v, i) => v === def.correctOrder[i]);
    const isFirstPbqEver = (state.pbqPassedIds?.length ?? 0) === 0;
    setSubmitted(true);
    setPbqIdentityAside(null);
    if (ok) {
      if (isFirstPbqEver && takeExtensionIdentity("pbq_first")) {
        setPbqIdentityAside(buildPbqFirstIdentityLine(def.domain, readiness.label, def.id));
      }
      if (!alreadyPassedThisPbq) grantXp(15);
      recordPbqPass(def.domain, def.id);
    } else recordPbqMiss(def.domain, def.id);
  };

  const reset = () => {
    setSubmitted(false);
    setPbqIdentityAside(null);
    setRetryKey((k) => k + 1);
  };

  const correct = submitted && currentOrder.every((v, i) => v === def.correctOrder[i]);
  const repairLessonId = SECTION_ORDER.find((x) => x.domain === def.domain)?.id ?? "1-1";

  return (
    <AppShell>
      <div className="max-w-5xl lg:grid lg:grid-cols-[1fr_minmax(280px,340px)] gap-6 items-start">
        <div className="min-w-0 space-y-6 max-w-2xl">
          <PageHeader
            eyebrow={`Domain ${def.domain} · PBQ-style drill`}
            title={def.title}
            purpose="Reorder steps to match a secure process. Wrong submit nudges weak signals for this domain — same thinking as performance-based items, original wording."
            badge={<StatusBadge tone="accent">Hands-on</StatusBadge>}
          />

          <SectionCard title="Scenario" subtitle="Read before you drag">
            <p className="text-sm text-slate-300 leading-relaxed">{def.scenario}</p>
          </SectionCard>

          <SectionCard title="Task" subtitle="Use Up / Down, then Submit">
            <p className="text-slate-200 font-medium text-sm">{def.task}</p>
            <ol className="space-y-2 mt-4" key={retryKey}>
              {labels.map((text, pos) => (
                <li
                  key={`${pos}-${text.slice(0, 12)}`}
                  className={`flex flex-col sm:flex-row gap-2 sm:items-start rounded-lg border px-3 py-3 text-[15px] sm:text-sm ${
                    submitted
                      ? currentOrder[pos] === def.correctOrder[pos]
                        ? "border-emerald-700 bg-emerald-950/30"
                        : "border-rose-800 bg-rose-950/20"
                      : "border-slate-700 bg-slate-800/40"
                  }`}
                >
                  <div className="flex gap-2 flex-1 min-w-0">
                    <span className="text-slate-500 w-6 shrink-0 pt-0.5">{pos + 1}.</span>
                    <span className="text-slate-200 flex-1 leading-snug">{text}</span>
                  </div>
                  {!submitted && (
                    <div className="flex gap-2 w-full sm:w-auto sm:shrink-0">
                      <button
                        type="button"
                        className="btn-ghost flex-1 sm:flex-none min-h-[48px] text-sm px-3 touch-manipulation"
                        onClick={() => move(pos, -1)}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="btn-ghost flex-1 sm:flex-none min-h-[48px] text-sm px-3 touch-manipulation"
                        onClick={() => move(pos, 1)}
                      >
                        Down
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
            {!submitted && (
              <button type="button" className="btn w-full sm:w-auto mt-4" onClick={grade}>
                Submit for scoring
              </button>
            )}
            {submitted && (
              <div className="text-sm space-y-2 border-t border-slate-800 pt-4 mt-4">
                <p className={correct ? "text-emerald-300" : "text-rose-300"}>
                  {correct ? "Correct — nice ordering." : "Not quite — read the rationale, then retry."}
                </p>
                {correct && pbqIdentityAside && (
                  <p className="text-xs text-slate-400 italic leading-relaxed border-l border-slate-600 pl-3">
                    {pbqIdentityAside}
                  </p>
                )}
                <p className="text-slate-300">{def.explanation}</p>
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-400">What Security+ is testing:</strong> {def.examTests}
                </p>
                {!correct && (
                  <FailureRecoveryPanel
                    tone="sky"
                    title="Order didn’t match — here’s your repair lane"
                    whatHappened="Your submitted sequence didn’t match the secure process this lab is teaching."
                    whyItMatters="PBQs reward procedure memory. One short repair pass now beats guessing on exam day."
                    nextStep="Pick one action, skim the rationale above, then use Retry lab."
                    ariaLabel="PBQ lab recovery"
                    actions={
                      <>
                        <Link to="/weak" className="btn text-sm min-h-[44px] justify-center touch-manipulation text-center">
                          Weak areas
                        </Link>
                        <Link
                          to={`/flashcards?lesson=${encodeURIComponent(repairLessonId)}`}
                          className="btn text-sm min-h-[44px] justify-center touch-manipulation text-center"
                        >
                          Flashcards
                        </Link>
                        <Link
                          to={`/quiz/${repairLessonId}?quick=5`}
                          className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation text-center"
                        >
                          Quick quiz
                        </Link>
                        <Link
                          to={`/lesson/${repairLessonId}`}
                          className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation text-center"
                        >
                          Open lesson
                        </Link>
                        <Link to="/practice-exams/pbq" className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation text-center">
                          PBQ hub
                        </Link>
                      </>
                    }
                  />
                )}
                <button type="button" className="btn-ghost w-full sm:w-auto mt-2" onClick={reset}>
                  Retry lab
                </button>
              </div>
            )}
          </SectionCard>

          <NextActionCard
            label="Next step"
            description={correct ? "Take a quiz in this domain or return to the PBQ list." : "Use AI for hints, or retry after reading the explanation."}
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/practice-exams/pbq" className="btn-ghost w-full sm:w-auto text-center">
                PBQ hub
              </Link>
              <Link to={nextStep.href} className="btn w-full sm:w-auto text-center">
                {nextStep.buttonLabel} →
              </Link>
            </div>
          </NextActionCard>
        </div>

        <AITutorPanel
          className="lg:sticky lg:top-4 order-first lg:order-none"
          context={{
            surface: "lab",
            weakAreas,
            lab: {
              objective: def.task,
              category: "PBQ_ORDERING",
              checkpoints: labels,
            },
            userProgress: { pbqId: def.id, submitted, correct: !!correct },
            coachLines: [def.examTests, def.scenario.slice(0, 120)].filter(Boolean),
          }}
        />
      </div>
    </AppShell>
  );
}
