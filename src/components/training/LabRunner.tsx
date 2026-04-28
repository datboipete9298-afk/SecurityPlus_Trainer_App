import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { TrainingLab } from "../../core/labEngine";
import { buildLabTutorFeedback } from "../../core/feedbackEngine";
import type { EliteLabPortfolioEntry } from "../../utils/storage";
import { fingerprintHash } from "../../eliteLab/labGenerator";
import { elitePassThreshold } from "../../eliteLab/eliteLabThresholds";
import { scoreTriageOrder } from "../../eliteLab/labScorer";
import { lessons } from "../../data/lessons";
import { buildPostScoreTriageDebrief } from "../../eliteLab/triageDebrief";
import { getDomainMentorHook } from "../../eliteLab/domainMentorHooks";
import FeedbackPanel from "../FeedbackPanel";
import MockTerminal from "./MockTerminal";
import ScenarioViewer from "./ScenarioViewer";
import InteractiveDiagram from "./InteractiveDiagram";
import AITutorPanel from "../AITutorPanel";

type Props = {
  lab: TrainingLab;
  onComplete: (pass: boolean) => void;
  /** Elite Lab Factory — structured row for portfolio + analytics */
  onElitePortfolio?: (entry: EliteLabPortfolioEntry) => void;
  completed: boolean;
  lessonId?: string;
  lessonTitle?: string;
};

function sortIdsBySeed(ids: string[], seed: number): string[] {
  return [...ids].sort((a, b) =>
    fingerprintHash([seed, a]).localeCompare(fingerprintHash([seed, b])),
  );
}

function firstMisleadingPair(canonicalPriorityIds: string[], userIds: string[]): string[] {
  const pos = new Map<string, number>();
  canonicalPriorityIds.forEach((id, i) => pos.set(id, i));
  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      const a = userIds[i]!;
      const b = userIds[j]!;
      const pa = pos.get(a);
      const pb = pos.get(b);
      if (pa === undefined || pb === undefined) continue;
      if (pa > pb) {
        return [a, b];
      }
    }
  }
  return [];
}

export default function LabRunner({ lab, onComplete, onElitePortfolio, completed, lessonId, lessonTitle }: Props) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [termOk, setTermOk] = useState<string[]>([]);
  const [order, setOrder] = useState<number[] | null>(null);
  const [eliteUserAlertOrder, setEliteUserAlertOrder] = useState<string[] | null>(null);
  const [eliteSubmittedScore, setEliteSubmittedScore] = useState<number | null>(null);
  const [lastScoredOrder, setLastScoredOrder] = useState<string[] | null>(null);
  const submitLockRef = useRef(false);

  const ei = lab.eliteInstance;
  const triage =
    ei?.generatedContent && ei.generatedContent.engine === "ALERT_TRIAGE"
      ? ei.generatedContent
      : null;

  useEffect(() => {
    submitLockRef.current = false;
  }, [lab.id]);

  const initialAlertOrder = useMemo(() => {
    if (!ei || !triage) return null;
    return sortIdsBySeed(
      triage.alerts.map((a) => a.id),
      ei.seed,
    );
  }, [ei, lab.id, triage]);

  useEffect(() => {
    setEliteUserAlertOrder(null);
    setEliteSubmittedScore(null);
    setLastScoredOrder(null);
    setChecks({});
    setOrder(null);
  }, [lab.id]);

  const alertOrderEffective = eliteUserAlertOrder ?? initialAlertOrder;

  const canonical = lab.orderingCanonical;
  const shuffledIdx = useMemo(() => {
    if (!canonical?.length) return [];
    const idx = canonical.map((_, i) => i);
    const rot = lab.id.length % canonical.length;
    return [...idx.slice(rot), ...idx.slice(0, rot)];
  }, [canonical, lab.id]);

  const displayOrder = order ?? shuffledIdx;

  const toggle = (id: string) => {
    if (completed) return;
    setChecks((c) => ({ ...c, [id]: !c[id] }));
  };

  const allChecked = lab.checkpoints.every((c) => checks[c.id]);

  const orderCorrect =
    !canonical || (displayOrder.length === canonical.length && displayOrder.every((v, i) => v === i));

  const analysisText = `Synthetic alert (read only):\nFrom: payroll-update@payroll-updates-support.net\nSubject: URGENT — verify direct deposit\nBody: Click http://payroll-updates-support.net/verify\n\nYour task: classify risk and one containment action for: ${lab.objective.slice(0, 120)}`;

  const move = (pos: number, dir: -1 | 1) => {
    if (completed || !canonical) return;
    const arr = [...displayOrder];
    const j = pos + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[pos], arr[j]] = [arr[j]!, arr[pos]!];
    setOrder(arr);
  };

  const moveAlert = (alertIds: readonly string[], pos: number, dir: -1 | 1) => {
    if (completed) return;
    const arr = [...alertIds];
    const j = pos + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[pos], arr[j]] = [arr[j]!, arr[pos]!];
    setEliteUserAlertOrder(arr as string[]);
  };

  const sendAlertToTop = (alertIds: readonly string[], pos: number) => {
    if (completed) return;
    const id = alertIds[pos];
    if (!id) return;
    const rest = alertIds.filter((_, i) => i !== pos);
    setEliteUserAlertOrder([id, ...rest]);
  };

  const sendAlertToBottom = (alertIds: readonly string[], pos: number) => {
    if (completed) return;
    const id = alertIds[pos];
    if (!id) return;
    const rest = alertIds.filter((_, i) => i !== pos);
    setEliteUserAlertOrder([...rest, id]);
  };

  const retryTriageAttempt = () => {
    setEliteSubmittedScore(null);
    setChecks({});
    setLastScoredOrder(null);
  };

  const lg = triage?.learnerGuide;

  const domainHook = useMemo(
    () => getDomainMentorHook(lessonId ? lessons[lessonId]?.domain : undefined),
    [lessonId],
  );

  const postScoreDebrief = useMemo(() => {
    if (eliteSubmittedScore === null || !lastScoredOrder?.length || !triage || !lg) return null;
    const passNow = eliteSubmittedScore >= elitePassThreshold(ei?.difficulty ?? 3);
    return buildPostScoreTriageDebrief({
      userOrderIds: lastScoredOrder,
      canonicalPriorityIds: triage.canonicalPriorityIds,
      alerts: triage.alerts,
      score: eliteSubmittedScore,
      pass: passNow,
      domainHook,
      learnerGuide: lg,
      lessonTitle: lessonId ? lessons[lessonId]?.title ?? lessonTitle : lessonTitle,
    });
  }, [eliteSubmittedScore, lastScoredOrder, triage, lg, domainHook, lessonId, lessonTitle, ei?.difficulty]);

  const previewScore =
    triage && alertOrderEffective ? scoreTriageOrder(alertOrderEffective, triage.canonicalPriorityIds).score : null;

  const mistakeHints =
    triage && alertOrderEffective ?
      firstMisleadingPair(triage.canonicalPriorityIds, alertOrderEffective).map((id) => {
        const al = triage.alerts.find((x) => x.id === id);
        return al ? `"${al.title.slice(0, 64)}..." is ahead of something more urgent.` : "";
      }).filter(Boolean)
    : [];

  const elitePasses =
    eliteSubmittedScore !== null && eliteSubmittedScore >= elitePassThreshold(ei?.difficulty ?? 3);

  const canSubmit =
    triage ?
      eliteSubmittedScore !== null && elitePasses && allChecked && !completed
    : lab.category === "VISUAL_INTERACTIVE" && canonical
      ? orderCorrect && !completed
      : lab.category === "MOCK_TERMINAL" || lab.category === "NETWORK_SIMULATION"
        ? termOk.length >= 2 && allChecked
        : allChecked;

  const submitEliteGrade = () => {
    if (!triage || !alertOrderEffective || !ei || completed) return;
    const r = scoreTriageOrder(alertOrderEffective, triage.canonicalPriorityIds);
    setLastScoredOrder([...alertOrderEffective]);
    setEliteSubmittedScore(r.score);

    const pass = r.score >= elitePassThreshold(ei.difficulty);
    const topTitles = alertOrderEffective
      .slice(0, 3)
      .map((id) => triage.alerts.find((x) => x.id === id)?.title ?? id)
      .filter(Boolean);

    onElitePortfolio?.({
      labId: lab.id,
      lessonId: lessonId ?? "",
      templateId: ei.templateId,
      seed: ei.seed,
      instanceId: ei.instanceId,
      decisions: [
        `queue_order:${alertOrderEffective.join(">")}`,
        `normalized_alignment:${Math.round(r.normalized * 100)}`,
      ],
      score: r.score,
      pass,
      artifacts: topTitles,
      skills: pass ? ei.rubric.map((x) => x.id) : ei.rubric.slice(0, 1).map((x) => x.id),
      at: Date.now(),
    });
  };

  const handleMarkComplete = () => {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    if (triage) {
      onComplete(elitePasses);
      return;
    }
    onComplete(true);
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase text-slate-500">{lab.category.replace(/_/g, " ")}</span>
        {ei && <span className="text-[10px] uppercase text-amber-400/90">Elite lab</span>}
        <span className="text-[10px] text-slate-600">~{lab.estimatedTimeMin} min</span>
        {completed && <span className="text-xs text-emerald-400 font-semibold">Completed ✓</span>}
      </div>
      <h4 className="text-white font-medium text-sm">{lab.objective}</h4>
      {lessonId && (
        <p className="text-[10px] text-slate-500">
          Linked lesson: <span className="text-slate-300">{lessons[lessonId]?.title ?? lessonTitle ?? lessonId}</span>
        </p>
      )}
      <p className="text-xs text-slate-400">{lab.realWorldContext}</p>

      {(lab.category === "NETWORK_SIMULATION" || lab.category === "MOCK_TERMINAL") && (
        <MockTerminal
          scenarioId={lab.terminalScenarioId}
          onCommandSuccess={() => setTermOk((t) => [...t, "x"].slice(-5))}
        />
      )}

      {lab.category === "SECURITY_ANALYSIS" && !triage && (
        <ScenarioViewer title="Synthetic snippet" text={analysisText} />
      )}

      {triage && ei && alertOrderEffective && lg && (
        <>
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/95">Do this now</p>
            <p className="text-sm text-emerald-50/95 leading-snug">{lg.doThisNow.replace(/\*\*/g, "")}</p>
            <p className="text-[10px] text-emerald-200/70">Use the buttons on each row — taps are large for phones. ↑/↓ move one step; Top/Bottom jump the row.</p>
          </div>

          <div className="rounded-xl border border-cyan-900/40 bg-slate-950/70 p-4 space-y-2">
            <p className="text-[10px] uppercase text-cyan-400/90 font-semibold">Security+ relevance</p>
            <p className="text-xs text-slate-200">{lg.examStrip.objective}</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div>
                <dt className="text-slate-500">Exam wording to expect</dt>
                <dd className="text-slate-300 mt-0.5">{lg.examStrip.examWording.replace(/\*\*/g, "")}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Trap to dodge</dt>
                <dd className="text-amber-200/90 mt-0.5">{lg.examStrip.trap.replace(/\*\*/g, "")}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Keywords to remember</dt>
                <dd className="text-cyan-200/90 mt-0.5 font-medium">{lg.examStrip.keyword.replace(/\*\*/g, "")}</dd>
              </div>
            </dl>
            <p className="text-[10px] text-slate-500 border-t border-slate-800 pt-2">{lg.securityPlusConnection.replace(/\*\*/g, "")}</p>
          </div>

          <div className="rounded-xl border border-amber-900/40 bg-slate-950/60 p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase text-slate-400">What happened</p>
              <p className="text-sm text-slate-200 mt-1">{lg.whatHappened}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-slate-400">Your job</p>
              <p className="text-sm text-slate-200 mt-1">{lg.yourJob.replace(/\*\*/g, "")}</p>
            </div>
            <p className="text-xs text-slate-500 border-l-2 border-amber-600/60 pl-2">{triage.briefing}</p>
            <p className="text-[10px] text-slate-500">
              Practice mode · seed <span className="text-slate-400">{ei.seed}</span> · noise envelope ~{Math.round(triage.noiseLevel * 100)}%
            </p>
            <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800">
              <p className="text-[10px] uppercase text-slate-500 mb-1">How scoring works</p>
              <p className="text-xs text-slate-300 leading-relaxed">{lg.howScoringWorks.replace(/\*\*/g, "")}</p>
              <p className="text-[11px] text-slate-400 mt-2">{lg.whyOrderMatters.replace(/\*\*/g, "")}</p>
              {previewScore !== null && eliteSubmittedScore === null && (
                <p className="text-[10px] text-slate-500 mt-2 border-t border-slate-800 pt-2">
                  Rough fit before you submit: ~{previewScore}/100 (tap Score when ready — that locks your attempt for checkpoints).
                </p>
              )}
            </div>

            <ol className="space-y-3">
              {alertOrderEffective.map((alertId, pos) => {
                const a = triage.alerts.find((x) => x.id === alertId)!;
                return (
                  <li key={alertId}>
                    <div className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-3 text-xs flex flex-col gap-3">
                      <div className="flex gap-3 items-start">
                        <span className="text-slate-500 w-7 shrink-0 text-sm font-medium pt-0.5">{pos + 1}.</span>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex flex-wrap gap-2 items-baseline">
                            <span className="text-emerald-400/90 font-semibold">{a.severityLabel}</span>
                            <span
                              className={
                                "text-[10px] uppercase px-2 py-0.5 rounded border min-h-[26px] inline-flex items-center " +
                                (a.assetCriticality === "critical" ?
                                  "border-red-900/70 text-red-300/90"
                                : "border-slate-600 text-slate-400")
                              }
                            >
                              {a.assetCriticality} asset
                            </span>
                            {a.benign ?
                              <span className="text-[10px] text-slate-500">likely routine / noise</span>
                            : <span className="text-[10px] text-rose-400/90">elevated signal</span>}
                          </div>
                          <p className="text-slate-200 font-medium">{a.title}</p>
                          <p className="text-slate-500 font-mono break-all text-[11px] leading-relaxed">{a.logLine}</p>
                          <p className="text-[10px] text-slate-500">
                            {a.host} · {a.source}
                          </p>
                        </div>
                      </div>
                      {!completed && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                          <button
                            type="button"
                            className="btn-ghost text-xs min-h-[44px]"
                            aria-label={`Move alert ${pos + 1} up`}
                            onClick={() => moveAlert(alertOrderEffective, pos, -1)}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="btn-ghost text-xs min-h-[44px]"
                            aria-label={`Move alert ${pos + 1} down`}
                            onClick={() => moveAlert(alertOrderEffective, pos, 1)}
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="btn-ghost text-xs min-h-[44px]"
                            aria-label={`Send alert ${pos + 1} to top`}
                            onClick={() => sendAlertToTop(alertOrderEffective, pos)}
                          >
                            Top
                          </button>
                          <button
                            type="button"
                            className="btn-ghost text-xs min-h-[44px]"
                            aria-label={`Send alert ${pos + 1} to bottom`}
                            onClick={() => sendAlertToBottom(alertOrderEffective, pos)}
                          >
                            Bottom
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {eliteSubmittedScore !== null && (
              <div className="space-y-4">
                <p className={`text-sm font-semibold ${elitePasses ? "text-emerald-400" : "text-amber-300"}`}>
                  Your alignment: {eliteSubmittedScore}/100 · pass bar {elitePassThreshold(ei.difficulty)}/100
                  {elitePasses ? " — checkpoints below are now unlocked." : " — coach debrief is ready; adjust and rescore anytime."}
                </p>

                {postScoreDebrief && (
                  <div id={`elite-debrief-${lab.id}`} className="rounded-xl border border-violet-900/55 bg-violet-950/30 p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-violet-300/95">Coach debrief · after scoring</p>
                    <div className="space-y-2 text-xs text-slate-200 leading-relaxed">
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">What you prioritized well</p>
                        <p>{postScoreDebrief.prioritizedWell}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Where focus slipped</p>
                        <p>{postScoreDebrief.missedFocus}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Why the better order matters</p>
                        <p className="whitespace-pre-line">{postScoreDebrief.whyOrderMatters}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">What to do next time</p>
                        <p>{postScoreDebrief.nextTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Exam takeaway</p>
                        <p className="text-amber-200/95">{postScoreDebrief.examTakeaway}</p>
                      </div>
                    </div>

                    {postScoreDebrief.pairwiseMistakes.length > 0 && (
                      <div className="border-t border-violet-900/40 pt-3">
                        <p className="text-[10px] font-semibold uppercase text-slate-400 mb-2">Highest-impact ordering notes (≤3)</p>
                        <ul className="list-disc pl-5 space-y-2 text-[11px] text-slate-300">
                          {postScoreDebrief.pairwiseMistakes.map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-lg bg-slate-950/50 border border-slate-700/80 p-3 text-[11px] text-slate-400 space-y-1">
                      <p className="text-[10px] uppercase text-emerald-500/85">Domain mentor cues · {domainHook.label}</p>
                      <p>
                        <strong className="text-slate-300">Lean into:</strong> {domainHook.prioritize}
                      </p>
                      <p>
                        <strong className="text-slate-300">Don&apos;t overweight:</strong> {domainHook.doNotOvervalue}
                      </p>
                      <p>
                        <strong className="text-slate-300">Exam keywords:</strong> {domainHook.keywords}
                      </p>
                    </div>
                  </div>
                )}

                {!elitePasses && (
                  <div className="rounded-xl border border-sky-900/50 bg-sky-950/25 p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase text-sky-300/95">Learning loop · below pass</p>
                    <ol className="list-decimal pl-5 text-sm text-slate-300 space-y-2">
                      <li>Digest the violet debrief panel (only visible once you scored).</li>
                      <li>Reorder using domain cues → tap Retry triage.</li>
                      <li>Open the quick quiz to cement vocabulary traps.</li>
                      <li>Skim your PDF guided slice for handwritten hooks.</li>
                    </ol>
                    <div className="flex flex-col sm:flex-row gap-2 flex-wrap pt-1">
                      <button type="button" className="btn text-sm min-h-[44px]" onClick={retryTriageAttempt}>
                        Retry triage (clears score & checkpoints)
                      </button>
                      {lessonId && (
                        <>
                          <Link to={`/lesson/${lessonId}`} className="btn-ghost text-sm min-h-[44px] text-center border border-slate-600">
                            Jump to lesson review
                          </Link>
                          <Link to={`/quiz/${lessonId}`} className="btn-ghost text-sm min-h-[44px] text-center border border-slate-600">
                            Quick quiz
                          </Link>
                          <Link
                            to={`/pdf-guides/messer-course-notes-v107/${lessonId}`}
                            className="btn-ghost text-sm min-h-[44px] text-center border border-slate-600"
                          >
                            PDF guide slice
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {elitePasses && (
                  <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase text-emerald-300/95">Learning loop · pass</p>
                    <ol className="list-decimal pl-5 text-sm text-slate-300 space-y-2">
                      <li>Portfolio already captured this attempt — see Progress ▸ Elite SOC lab portfolio for proof.</li>
                      <li>Check the affirmation boxes → Mark lab complete to bank XP.</li>
                      <li>
                        {lessonId ?
                          <>
                            Continue learning:{" "}
                            <Link to={`/lesson/${lessonId}`} className="text-emerald-400 underline hover:text-emerald-300">
                              return to lesson
                            </Link>
                            .
                          </>
                        : "Hop back into the roadmap for the next hands-on drill."}
                      </li>
                    </ol>
                    <Link
                      to="/progress"
                      className="inline-flex text-[11px] text-cyan-300/95 hover:text-cyan-200 underline underline-offset-2 mt-2"
                    >
                      Open Progress page (portfolio highlights)
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {ei && ei.generatedContent.engine === "INCIDENT_STUB" && (
        <ScenarioViewer title="Incident tabletop" text={ei.generatedContent.briefing + "\n\n" + ei.generatedContent.phases.map((p) => `• ${p.name}: ${p.detail}`).join("\n")} />
      )}
      {ei && ei.generatedContent.engine === "IAM_STUB" && (
        <ScenarioViewer title="Policy excerpt" text={ei.generatedContent.policySnippet + "\n\n" + ei.generatedContent.issueHints.join("\n")} />
      )}

      {(lab.category === "NETWORK_SIMULATION" || lab.category === "SYSTEM_INTERACTION") && (
        <InteractiveDiagram variant="network" />
      )}
      {lab.category === "DECISION" && !ei && <InteractiveDiagram variant="zt" />}
      {lab.category === "BROWSER_BASED" && (
        <p className="text-xs text-slate-500">Use your real browser for the padlock/certificate steps listed above — this app cannot access other tabs.</p>
      )}

      {lab.category === "VISUAL_INTERACTIVE" && canonical && (
        <ol className="space-y-2">
          {displayOrder.map((idx, pos) => (
            <li key={`${idx}-${pos}`} className="flex flex-col sm:flex-row gap-2 items-start rounded-lg border border-slate-700 p-2 text-sm">
              <span className="text-slate-500 w-6">{pos + 1}.</span>
              <span className="text-slate-200 flex-1">{canonical[idx]}</span>
              {!completed && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button type="button" className="btn-ghost flex-1 text-xs min-h-[40px]" onClick={() => move(pos, -1)}>
                    Up
                  </button>
                  <button type="button" className="btn-ghost flex-1 text-xs min-h-[40px]" onClick={() => move(pos, 1)}>
                    Down
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <div>
        <p className="text-xs text-slate-500 uppercase mb-2">Checkpoints</p>
        <ul className="space-y-2">
          {lab.checkpoints.map((c) => (
            <li key={c.id}>
              <label className="flex items-start gap-2 text-sm text-slate-300 cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded"
                  checked={!!checks[c.id]}
                  disabled={completed || (triage ? eliteSubmittedScore === null || !elitePasses : false)}
                  onChange={() => toggle(c.id)}
                />
                <span>{c.label}</span>
              </label>
              {c.hint && <p className="text-[10px] text-slate-500 ml-6">{c.hint}</p>}
            </li>
          ))}
        </ul>
      </div>

      <details id={`lab-hints-${lab.id}`} className="text-xs text-slate-400">
        <summary className="cursor-pointer text-emerald-400">Hints & recovery</summary>
        <ul className="list-disc pl-4 mt-2 space-y-1">
          {lab.hints.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
        <p className="mt-2 text-slate-500">
          <strong className="text-slate-300">If stuck:</strong> {lab.recoverySteps.join(" · ")}
        </p>
        <p className="mt-2 text-amber-200/80">
          <strong>Exam:</strong> {lab.examConnection}
        </p>
        <p className="mt-1 text-cyan-200/80">
          <strong>Memory:</strong> {lab.memoryHook}
        </p>
      </details>

      {!completed && (
        <button
          type="button"
          className="btn w-full sm:w-auto"
          disabled={
            completed ||
            (triage ?
              !!(eliteSubmittedScore !== null && elitePasses && !allChecked)
            : !canSubmit)
          }
          onClick={() => {
            if (!triage) {
              handleMarkComplete();
              return;
            }
            if (eliteSubmittedScore === null || !elitePasses) {
              submitEliteGrade();
              return;
            }
            if (elitePasses && allChecked) handleMarkComplete();
          }}
        >
          {!triage ?
            "Mark lab complete"
          : eliteSubmittedScore === null || !elitePasses ?
            eliteSubmittedScore === null ?
              "Score my triage queue"
            : "Rescore queue"
          : !allChecked ?
            "Complete checkpoints"
          : "Mark lab complete"}
        </button>
      )}
      {!canSubmit && !completed && (
        <p className="text-[10px] text-slate-500">
          {triage ?
            "Submit once for alignment score ≥ threshold, then checkpoints unlock."
          : lab.category === "VISUAL_INTERACTIVE" ?
            "Reorder to the canonical process, then complete."
          : "Check all boxes"}{" "}
          {(lab.category === "MOCK_TERMINAL" || lab.category === "NETWORK_SIMULATION") && "+ run 2 mock commands."}
        </p>
      )}
      {completed && (
        <div className="mt-4 space-y-3 border-t border-emerald-900/30 pt-4">
          <p className="text-xs font-semibold text-emerald-300">🧠 What you learned</p>
          <p className="text-sm text-slate-300">{lab.expectedResult}</p>
          <p className="text-[10px] text-slate-500 uppercase">Tutor debrief</p>
          <FeedbackPanel feedback={buildLabTutorFeedback(lab, true)} />
          <button
            type="button"
            className="btn-ghost text-xs w-full sm:w-auto"
            onClick={() => document.getElementById(`lab-hints-${lab.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Need help — jump to hints
          </button>
        </div>
      )}
      <div className="mt-4 border-t border-slate-800 pt-4">
        <AITutorPanel
          variant="compact"
          context={{
            surface: "lab",
            lesson: lessonId && lessonTitle ? { id: lessonId, title: lessonTitle } : undefined,
            lab: {
              objective: lab.objective,
              category: lab.category,
              checkpoints: lab.checkpoints.map((c) => c.label),
              ...(ei && lg ?
                {
                  eliteLabMentor: {
                    templateId: ei.templateId,
                    instanceId: ei.instanceId,
                    submissionPhase: eliteSubmittedScore === null ? "before_score" : "after_score",
                    rubricBullets: ei.rubric.map((r) => r.label),
                    examPrinciples: [lg.whyOrderMatters, lg.examStrip.trap],
                    guidingDirective:
                      "Never reveal numbered alert IDs or canonical queue ranks. Teach prioritization lenses: asset tier, blast radius, credible compromise cues, escalation vs benign automation. Tie to Exam strip + rubric only.",
                    currentDecisionTrace: alertOrderEffective ? [`labeled_queue_positions:${alertOrderEffective.length} rows`] : [],
                    mistakeHints:
                      eliteSubmittedScore !== null && !elitePasses ?
                        [...mistakeHints, lg.afterFail.replace(/\*\*/g, "")]
                      : undefined,
                    lastScore: eliteSubmittedScore ?? undefined,
                    domainCoach: {
                      label: domainHook.label,
                      decisionPrinciple: domainHook.decisionPrinciple,
                      examTrap: domainHook.examTrap,
                      prioritize: domainHook.prioritize,
                      doNotOvervalue: domainHook.doNotOvervalue,
                      keywords: domainHook.keywords,
                    },
                    debriefAnchors:
                      postScoreDebrief && eliteSubmittedScore !== null ?
                        {
                          prioritizedWell: postScoreDebrief.prioritizedWell,
                          missedFocus: postScoreDebrief.missedFocus,
                        }
                      : undefined,
                  },
                }
              : {}),
            },
            coachLines: [lab.examConnection, lab.memoryHook, lab.realWorldContext].filter(Boolean),
          }}
        />
      </div>
    </div>
  );
}
