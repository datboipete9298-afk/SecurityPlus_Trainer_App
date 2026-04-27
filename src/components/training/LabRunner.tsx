import { useEffect, useMemo, useRef, useState } from "react";
import type { TrainingLab } from "../../core/labEngine";
import { buildLabTutorFeedback } from "../../core/feedbackEngine";
import FeedbackPanel from "../FeedbackPanel";
import MockTerminal from "./MockTerminal";
import ScenarioViewer from "./ScenarioViewer";
import InteractiveDiagram from "./InteractiveDiagram";
import AITutorPanel from "../AITutorPanel";

type Props = {
  lab: TrainingLab;
  onComplete: (pass: boolean) => void;
  completed: boolean;
  lessonId?: string;
  lessonTitle?: string;
};

export default function LabRunner({ lab, onComplete, completed, lessonId, lessonTitle }: Props) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [termOk, setTermOk] = useState<string[]>([]);
  const [order, setOrder] = useState<number[] | null>(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    submitLockRef.current = false;
  }, [lab.id]);

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

  const canSubmit =
    lab.category === "VISUAL_INTERACTIVE" && canonical
      ? orderCorrect && !completed
      : lab.category === "MOCK_TERMINAL" || lab.category === "NETWORK_SIMULATION"
        ? termOk.length >= 2 && allChecked
        : allChecked;

  const analysisText = `Synthetic alert (read only):\nFrom: payroll-update@payroll-updates-support.net\nSubject: URGENT — verify direct deposit\nBody: Click http://payroll-updates-support.net/verify\n\nYour task: classify risk and one containment action for: ${lab.objective.slice(0, 120)}`;

  const move = (pos: number, dir: -1 | 1) => {
    if (completed || !canonical) return;
    const arr = [...displayOrder];
    const j = pos + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[pos], arr[j]] = [arr[j]!, arr[pos]!];
    setOrder(arr);
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase text-slate-500">{lab.category.replace(/_/g, " ")}</span>
        <span className="text-[10px] text-slate-600">~{lab.estimatedTimeMin} min</span>
        {completed && <span className="text-xs text-emerald-400 font-semibold">Completed ✓</span>}
      </div>
      <h4 className="text-white font-medium text-sm">{lab.objective}</h4>
      <p className="text-xs text-slate-400">{lab.realWorldContext}</p>

      {(lab.category === "NETWORK_SIMULATION" || lab.category === "MOCK_TERMINAL") && (
        <MockTerminal
          scenarioId={lab.terminalScenarioId}
          onCommandSuccess={() => setTermOk((t) => [...t, "x"].slice(-5))}
        />
      )}

      {lab.category === "SECURITY_ANALYSIS" && (
        <ScenarioViewer title="Synthetic snippet" text={analysisText} />
      )}

      {(lab.category === "NETWORK_SIMULATION" || lab.category === "SYSTEM_INTERACTION") && (
        <InteractiveDiagram variant="network" />
      )}
      {lab.category === "DECISION" && <InteractiveDiagram variant="zt" />}
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
                  disabled={completed}
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
          disabled={!canSubmit}
          onClick={() => {
            if (submitLockRef.current) return;
            submitLockRef.current = true;
            onComplete(true);
          }}
        >
          Mark lab complete
        </button>
      )}
      {!canSubmit && !completed && (
        <p className="text-[10px] text-slate-500">
          {lab.category === "VISUAL_INTERACTIVE" ? "Reorder to the canonical process, then complete." : "Check all boxes"}{" "}
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
            },
            coachLines: [lab.examConnection, lab.memoryHook, lab.realWorldContext].filter(Boolean),
          }}
        />
      </div>
    </div>
  );
}
