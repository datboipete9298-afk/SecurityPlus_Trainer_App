import { useRef, useState } from "react";
import type { DecisionScenario } from "../../core/decisionEngine";
import { buildDecisionTutorFeedback } from "../../core/feedbackEngine";
import FeedbackPanel from "../FeedbackPanel";

type Props = {
  scenario: DecisionScenario;
  onAnswer: (correct: boolean) => void;
  completed: boolean;
  wasCorrect?: boolean;
};

export default function DecisionPanel({ scenario, onAnswer, completed, wasCorrect }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  /** Blocks double-submit on the same option before React updates (mobile double-tap). */
  const lastCommittedChoiceRef = useRef<string | null>(null);

  const choose = (id: string) => {
    if (completed) return;
    if (lastCommittedChoiceRef.current === id) return;
    const c = scenario.choices.find((x) => x.id === id);
    if (!c) return;
    lastCommittedChoiceRef.current = id;
    setPicked(id);
    setShow(true);
    onAnswer(c.isBest);
  };

  const tryAgain = () => {
    if (completed) return;
    lastCommittedChoiceRef.current = null;
    setPicked(null);
    setShow(false);
  };

  if (completed) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm">
        <p className="text-slate-400 font-semibold">Decision challenge</p>
        <p className="text-xs text-slate-500 mt-1">{scenario.title}</p>
        <p className="text-emerald-300/90 text-xs mt-2">{wasCorrect ? "You chose the exam-best path ✓" : "Review the scenario again anytime — decision pattern logged."}</p>
        <p className="text-[10px] text-cyan-200/80 mt-2">{scenario.memoryHook}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-900/50 bg-amber-950/15 p-4 space-y-3">
      <p className="text-[10px] uppercase text-amber-300/90 font-semibold">What would you do?</p>
      <h4 className="text-white font-medium text-sm">{scenario.title}</h4>
      <p className="text-sm text-slate-300 leading-relaxed">{scenario.scenario}</p>
      <div className="space-y-2">
        {scenario.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={show && !!(picked && scenario.choices.find((x) => x.id === picked)?.isBest)}
            className={`w-full text-left rounded-xl border px-4 py-3 text-sm min-h-[52px] touch-manipulation ${
              show && picked === c.id
                ? c.isBest
                  ? "border-emerald-500 bg-emerald-950/30"
                  : "border-rose-500 bg-rose-950/20"
                : "border-slate-600 bg-slate-800/40 hover:border-amber-600/50"
            }`}
            onClick={() => choose(c.id)}
          >
            {c.text}
          </button>
        ))}
      </div>
      {show && picked && (() => {
        const c = scenario.choices.find((x) => x.id === picked);
        if (!c) return null;
        const tutor = buildDecisionTutorFeedback(scenario, c);
        return (
          <div className="border-t border-slate-800 pt-3 space-y-3">
            <p className="text-[10px] uppercase text-amber-200/80 font-semibold">Outcome &amp; risk</p>
            <p className="text-xs text-slate-300">
              <strong className="text-white">What happened:</strong> {c.result}
            </p>
            <FeedbackPanel feedback={tutor} />
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Why other options fail</p>
              <ul className="list-disc pl-4 space-y-1">
                {scenario.choices
                  .filter((x) => x.id !== c.id)
                  .map((x) => (
                    <li key={x.id}>
                      <span className="text-slate-200">{x.text.slice(0, 80)}</span>
                      {x.text.length > 80 ? "…" : ""} — {x.explanation}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        );
      })()}
      {show && picked && !scenario.choices.find((x) => x.id === picked)?.isBest && !completed && (
        <button type="button" className="btn-ghost text-xs w-full" onClick={tryAgain}>
          Try a different choice
        </button>
      )}
    </div>
  );
}
