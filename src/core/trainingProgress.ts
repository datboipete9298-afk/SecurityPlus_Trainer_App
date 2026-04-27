import type { PersistedState, TrainingRunsState } from "../utils/storage";
import { generateTrainingLabsForLesson } from "./labEngine";
import { generateTrainingSimulationsForLesson } from "./simulationEngine";
import { generateDecisionScenarioForLesson } from "./decisionEngine";

/** Persist new training runs and append `trainingMasteryLessonIds` when hands-on flips complete. */
export function nextStateAfterTrainingRuns(s: PersistedState, nextRuns: TrainingRunsState, lessonId: string): PersistedState {
  let ns: PersistedState = { ...s, trainingRuns: nextRuns };
  const mastery = ns.trainingMasteryLessonIds ?? [];
  if (!mastery.includes(lessonId) && isLessonHandsOnComplete(lessonId, ns)) {
    ns = { ...ns, trainingMasteryLessonIds: [...mastery, lessonId] };
  }
  return ns;
}

export function trainingLabRunKey(lessonId: string, labId: string) {
  return `${lessonId}::${labId}`;
}

export function trainingSimRunKey(lessonId: string, simId: string) {
  return `${lessonId}::${simId}`;
}

export function trainingDecisionKey(lessonId: string, scenarioId: string) {
  return `${lessonId}::${scenarioId}`;
}

export function isLessonHandsOnComplete(lessonId: string, s: PersistedState): boolean {
  const runs = s.trainingRuns;
  if (!runs) return false;
  const labs = generateTrainingLabsForLesson(lessonId);
  const sims = generateTrainingSimulationsForLesson(lessonId);
  const dec = generateDecisionScenarioForLesson(lessonId);
  const dk = trainingDecisionKey(lessonId, dec.id);

  for (const lab of labs) {
    const r = runs.labs[trainingLabRunKey(lessonId, lab.id)];
    if (!r?.pass) return false;
  }
  for (const sim of sims) {
    const r = runs.sims[trainingSimRunKey(lessonId, sim.id)];
    if (!r?.pass) return false;
  }
  const dr = runs.decisions[dk];
  if (!dr?.correct) return false;
  return true;
}

export function countHandsOnCompleteLessons(s: PersistedState, lessonIds: readonly string[]): number {
  return lessonIds.filter((id) => isLessonHandsOnComplete(id, s)).length;
}
