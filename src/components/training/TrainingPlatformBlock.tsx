import { useState } from "react";
import { generateTrainingLabsForLesson } from "../../core/labEngine";
import { generateTrainingSimulationsForLesson } from "../../core/simulationEngine";
import { generateDecisionScenarioForLesson } from "../../core/decisionEngine";
import { trainingLabRunKey, trainingSimRunKey, trainingDecisionKey } from "../../core/trainingProgress";
import { useProgress } from "../../context/ProgressContext";
import { lessons } from "../../data/lessons";
import LabRunner from "./LabRunner";
import SimulationRunner from "./SimulationRunner";
import DecisionPanel from "./DecisionPanel";

type Props = { lessonId: string };

export default function TrainingPlatformBlock({ lessonId }: Props) {
  const { state, recordTrainingLab, recordTrainingSim, recordTrainingDecision } = useProgress();
  const runs = state.trainingRuns ?? { labs: {}, sims: {}, decisions: {} };
  const [simRetry, setSimRetry] = useState<Record<string, number>>({});

  const labs = generateTrainingLabsForLesson(lessonId);
  const sims = generateTrainingSimulationsForLesson(lessonId);
  const decision = generateDecisionScenarioForLesson(lessonId);
  const lessonTitle = lessons[lessonId]?.title ?? lessonId;

  return (
    <div className="space-y-8 mt-4">
      <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/10 p-3">
        <h3 className="text-cyan-300 font-bold text-xs uppercase">Learn → Do → Decide → Verify → Repeat</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Every section includes <strong className="text-slate-200">two hands-on labs</strong>,{" "}
          <strong className="text-slate-200">two branching simulations</strong>, and one{" "}
          <strong className="text-slate-200">decision scenario</strong>. Finish all to satisfy the lesson checklist — the coach will notice gaps.
        </p>
      </div>

      <section>
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="text-lg">🧪</span> Hands-on labs (local, safe)
        </h3>
        <div className="space-y-6">
          {labs.map((lab) => {
            const key = trainingLabRunKey(lessonId, lab.id);
            const r = runs.labs[key];
            return (
              <LabRunner
                key={lab.id}
                lab={lab}
                completed={!!r?.pass}
                lessonId={lessonId}
                lessonTitle={lessonTitle}
                onComplete={(pass) => recordTrainingLab(lessonId, lab.id, pass)}
              />
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="text-lg">🎮</span> Simulations (think under pressure)
        </h3>
        <div className="space-y-6">
          {sims.map((sim) => {
            const key = trainingSimRunKey(lessonId, sim.id);
            const r = runs.sims[key];
            const retry = simRetry[sim.id] ?? 0;
            return (
              <div key={`${sim.id}-${retry}`}>
                <SimulationRunner
                  sim={sim}
                  completed={!!r?.pass}
                  lastScore={r?.score}
                  lessonId={lessonId}
                  lessonTitle={lessonTitle}
                  onComplete={(score, pass) => recordTrainingSim(lessonId, sim.id, score, pass)}
                />
                {r && !r.pass && (
                  <button type="button" className="btn-ghost text-xs mt-2" onClick={() => setSimRetry((s) => ({ ...s, [sim.id]: (s[sim.id] ?? 0) + 1 }))}>
                    Retry simulation
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <span className="text-lg">⚖️</span> Decision scenario
        </h3>
        <DecisionPanel
          scenario={decision}
          completed={!!runs.decisions[trainingDecisionKey(lessonId, decision.id)]?.correct}
          wasCorrect={runs.decisions[trainingDecisionKey(lessonId, decision.id)]?.correct}
          onAnswer={(correct) => recordTrainingDecision(lessonId, decision.id, correct)}
        />
      </section>
    </div>
  );
}
