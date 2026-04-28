import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { getPbq } from "../data/pbqCatalog";
import { SECTION_ORDER } from "../data/sectionOrder";
import { useProgress } from "../context/ProgressContext";
import { buildPbqFirstIdentityLine } from "../utils/identityPersonalization";
import AppShell from "../components/AppShell";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import ContinueButton from "../components/ContinueButton";
import FlowPrimaryStrip from "../components/FlowPrimaryStrip";
import AITutorPanel from "../components/AITutorPanel";
import StatusBadge from "../components/StatusBadge";
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
          <FlowPrimaryStrip>
            {!submitted ? (
              <button type="button" className="btn w-full text-center min-h-[48px] touch-manipulation" onClick={grade}>
                Submit order
              </button>
            ) : !correct ? (
              <button type="button" className="btn w-full text-center min-h-[48px] touch-manipulation" onClick={reset}>
                Try again
              </button>
            ) : (
              <ContinueButton step={nextStep} className="btn w-full text-center min-h-[48px] touch-manipulation" coachHint="" />
            )}
          </FlowPrimaryStrip>
          <PageHeader
            eyebrow={`Domain ${def.domain} · PBQ-style drill`}
            title={def.title}
            purpose="Use Up / Down, then Submit order above."
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
                  <details className="mt-3 rounded-xl border border-sky-800/40 bg-sky-950/20 group">
                    <summary className="cursor-pointer list-none px-3 py-2 text-sm text-sky-200 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
                      <span className="mr-2 text-sky-500 group-open:text-sky-300">▸</span>
                      Extra repair links
                    </summary>
                    <div className="px-3 pb-3 border-t border-slate-800 pt-3 flex flex-col gap-2">
                      <Link to={`/lesson/${repairLessonId}`} className="btn text-sm min-h-[44px] justify-center touch-manipulation text-center">
                        Open lesson
                      </Link>
                      <Link to="/weak" className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation text-center border border-slate-600">
                        Weak areas
                      </Link>
                      <Link
                        to={`/flashcards?lesson=${encodeURIComponent(repairLessonId)}`}
                        className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation text-center border border-slate-600"
                      >
                        Flashcards
                      </Link>
                      <Link to="/practice-exams/pbq" className="btn-ghost text-sm min-h-[44px] justify-center touch-manipulation text-center border border-slate-600">
                        PBQ hub
                      </Link>
                    </div>
                  </details>
                )}
                <p className="text-xs text-slate-500 mt-2">Tap <strong className="text-slate-300">Try again</strong> in Next step above.</p>
              </div>
            )}
          </SectionCard>

          <details className="rounded-xl border border-slate-700 bg-slate-900/30 group">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-sm text-slate-400 touch-manipulation min-h-[44px] flex items-center [&::-webkit-details-marker]:hidden">
              <span className="mr-2 text-slate-600 group-open:text-emerald-400">▸</span>
              PBQ hub
            </summary>
            <div className="px-3 pb-3 border-t border-slate-800 pt-3">
              <Link to="/practice-exams/pbq" className="btn-ghost w-full text-center min-h-[44px] border border-slate-600 inline-block leading-[44px]">
                Open PBQ list
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
          className="lg:sticky lg:top-4 order-first lg:order-none !border-0 rounded-xl bg-violet-950/20"
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
        </details>
      </div>
    </AppShell>
  );
}
