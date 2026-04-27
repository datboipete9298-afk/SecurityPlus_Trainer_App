/**
 * Validates training platform coverage: every full lesson has ≥2 labs, ≥2 sims, ≥1 decision.
 * Run: npx tsx scripts/validate-training-system.ts
 */
import { lessons, ORDERED_LESSON_IDS } from "../src/data/lessons";
import { generateTrainingLabsForLesson } from "../src/core/labEngine";
import { generateTrainingSimulationsForLesson } from "../src/core/simulationEngine";
import { generateDecisionScenarioForLesson } from "../src/core/decisionEngine";

const problems: string[] = [];

for (const id of ORDERED_LESSON_IDS) {
  const L = lessons[id];
  if (!L?.hasFullContent) continue;

  const labs = generateTrainingLabsForLesson(id);
  if (labs.length < 2) {
    problems.push(`Lesson ${id}: expected ≥2 labs, got ${labs.length}`);
  }

  const sims = generateTrainingSimulationsForLesson(id);
  if (sims.length < 2) {
    problems.push(`Lesson ${id}: expected ≥2 simulations, got ${sims.length}`);
  }

  try {
    const dec = generateDecisionScenarioForLesson(id);
    if (!dec?.id || !dec.choices?.length) {
      problems.push(`Lesson ${id}: decision scenario missing id or choices`);
    }
  } catch (e) {
    problems.push(`Lesson ${id}: decision scenario threw — ${String(e)}`);
  }

  for (const lab of labs) {
    if (!lab.id || !lab.lessonId) problems.push(`Lesson ${id}: lab missing id/lessonId`);
  }
  for (const sim of sims) {
    if (!sim.id || !sim.lessonId) problems.push(`Lesson ${id}: simulation missing id/lessonId`);
  }
}

const fullCount = ORDERED_LESSON_IDS.filter((id) => lessons[id]?.hasFullContent).length;

if (problems.length) {
  console.error("validate-training-system: FAILED\n" + problems.join("\n"));
  process.exit(1);
}

console.log(
  `validate-training-system: OK — ${fullCount} full lessons checked (≥2 labs, ≥2 sims, decision each).`,
);
