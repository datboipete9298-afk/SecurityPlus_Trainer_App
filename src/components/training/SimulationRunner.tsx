import { useRef, useState } from "react";
import type { TrainingSimulation } from "../../core/simulationEngine";
import type { TutorFeedback } from "../../core/feedbackEngine";
import { buildSimChoiceTutorFeedback } from "../../core/feedbackEngine";
import FeedbackPanel from "../FeedbackPanel";
import AITutorPanel from "../AITutorPanel";

type Props = {
  sim: TrainingSimulation;
  onComplete: (score: number, pass: boolean) => void;
  completed: boolean;
  lastScore?: number;
  lessonId?: string;
  lessonTitle?: string;
};

export default function SimulationRunner({ sim, onComplete, completed, lastScore, lessonId, lessonTitle }: Props) {
  const [nodeId, setNodeId] = useState(sim.startNodeId);
  const [score, setScore] = useState(0);
  const [stepTutor, setStepTutor] = useState<TutorFeedback | null>(null);
  const [pendingNextNodeId, setPendingNextNodeId] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [lastPickLabel, setLastPickLabel] = useState<string | null>(null);
  const terminalFiredRef = useRef(false);

  const node = sim.nodes[nodeId];

  const pick = (choiceId: string) => {
    if (completed || ended || !node) return;
    const ch = node.choices.find((c) => c.id === choiceId);
    if (!ch) return;
    setLastPickLabel(ch.text);
    const nextScore = Math.max(0, Math.min(sim.maxScore, score + ch.scoreDelta));
    setScore(nextScore);
    setStepTutor(
      buildSimChoiceTutorFeedback({
        choiceText: ch.text,
        wasBest: ch.scoreDelta > 0,
        narrative: node.narrative,
        feedback: ch.feedback,
        examWhy: ch.examWhy,
        outcomeChain: ch.outcomeChain,
      }),
    );
    if (ch.nextNodeId === "END") {
      if (terminalFiredRef.current) return;
      terminalFiredRef.current = true;
      setEnded(true);
      setPendingNextNodeId(null);
      onComplete(nextScore, nextScore >= sim.passingScore);
    } else {
      setPendingNextNodeId(ch.nextNodeId);
    }
  };

  const continueStep = () => {
    if (!pendingNextNodeId) return;
    setStepTutor(null);
    setNodeId(pendingNextNodeId);
    setPendingNextNodeId(null);
  };

  if (completed) {
    return (
      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm text-slate-300">
        <p className="text-emerald-300 font-semibold">Simulation cleared</p>
        {lastScore != null && (
          <p className="text-xs mt-1">
            Score: {lastScore} / {sim.maxScore} (pass ≥ {sim.passingScore})
          </p>
        )}
        <p className="text-[10px] text-slate-500 mt-2">{sim.title}</p>
      </div>
    );
  }

  if (!node) return <p className="text-rose-400 text-sm">Invalid simulation state.</p>;

  return (
    <div className="rounded-2xl border border-violet-900/40 bg-violet-950/15 p-4 space-y-3">
      <div className="flex flex-wrap gap-2 text-[10px] uppercase text-slate-500">
        <span>{sim.kind.replace(/_/g, " ")}</span>
        <span>
          Score {score}/{sim.maxScore}
        </span>
      </div>
      <p className="text-xs text-slate-400">{sim.intro}</p>
      <p className="text-sm text-slate-100 leading-relaxed">{node.narrative}</p>
      <div className="space-y-2">
        {node.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={!!stepTutor || !!pendingNextNodeId || ended}
            className="w-full text-left rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 hover:border-violet-500 min-h-[52px] touch-manipulation disabled:opacity-50"
            onClick={() => pick(c.id)}
          >
            {c.text}
          </button>
        ))}
      </div>
      {stepTutor && (
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <p className="text-[10px] uppercase text-violet-300/80 font-semibold">What happened &amp; why</p>
          <FeedbackPanel feedback={stepTutor} />
          <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3 text-xs text-slate-300">
            <p className="text-[10px] uppercase text-cyan-200/90 font-semibold mb-2">Decision review (AI coach)</p>
            <p>
              <span className="text-slate-500">Exam angle: </span>
              {stepTutor.examRecognitionRule}
            </p>
            <p className="mt-2">
              <span className="text-slate-500">Next judgment: </span>
              {stepTutor.nextActionSuggestion}
            </p>
          </div>
          {!ended && pendingNextNodeId && (
            <>
              <p className="text-xs text-slate-500">Read the feedback, then continue when you&apos;re ready — no auto-advance.</p>
              <button type="button" className="btn text-sm w-full sm:w-auto" onClick={continueStep}>
                Next simulation step →
              </button>
            </>
          )}
        </div>
      )}
      {ended && (
        <p className="text-sm text-emerald-300">
          {score >= sim.passingScore
            ? "You improved — pattern internalized. Retry anytime for speed."
            : "Below pass line — read feedback and hit Retry on the section header."}
        </p>
      )}
      <div className="mt-4 border-t border-slate-800 pt-3">
        <AITutorPanel
          variant="compact"
          context={{
            surface: "sim",
            lesson: lessonId && lessonTitle ? { id: lessonId, title: lessonTitle } : undefined,
            sim: {
              title: sim.title,
              narrative: node.narrative,
              lastChoice: lastPickLabel ?? undefined,
              wasGood: stepTutor?.result === "correct",
            },
            lab: { objective: `${sim.title} — ${sim.kind}`, category: sim.kind },
            coachLines: stepTutor
              ? [stepTutor.explanationSimple, stepTutor.examRecognitionRule, stepTutor.nextActionSuggestion]
              : [sim.intro],
          }}
        />
      </div>
    </div>
  );
}
