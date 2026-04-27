/**
 * Validates AI coach + note intelligence wiring for every full lesson.
 * Run: npx tsx scripts/validate-ai-system.ts
 */
import { lessons, ORDERED_LESSON_IDS } from "../src/data/lessons";
import { getLessonNoteIntelligence } from "../src/utils/lessonNoteIntelligence";
import { buildLearningProfile } from "../src/core/learningObserver";
import { getNextStep } from "../src/core/nextStepEngine";
import { getThinkingPatternAlerts } from "../src/core/thinkingPatterns";
import { buildMemoryPlan } from "../src/core/memoryEngine";
import { defaultState } from "../src/utils/storage";

const problems: string[] = [];

for (const id of ORDERED_LESSON_IDS) {
  const L = lessons[id];
  if (!L?.hasFullContent) continue;
  const ni = getLessonNoteIntelligence(L);
  if (!ni.whatToHighlight.length) problems.push(`${id}: note intelligence — no highlight hooks`);
  if (!ni.writeThisDown.trim()) problems.push(`${id}: note intelligence — empty writeThisDown`);
  if (!ni.examSnapshot.length) problems.push(`${id}: note intelligence — empty exam snapshot`);
  if (!ni.examMindset.howThisShowsOnExam.trim()) problems.push(`${id}: missing exam mindset`);
}

try {
  buildLearningProfile(defaultState());
  buildMemoryPlan(defaultState());
  getThinkingPatternAlerts(defaultState());
  getNextStep(defaultState());
} catch (e) {
  problems.push(`Smoke error: ${e instanceof Error ? e.message : String(e)}`);
}

if (problems.length) {
  console.error("validate-ai-system: FAILED\n" + problems.slice(0, 30).join("\n"));
  if (problems.length > 30) console.error(`… and ${problems.length - 30} more`);
  process.exit(1);
}

console.log(
  `validate-ai-system: OK — ${ORDERED_LESSON_IDS.filter((id) => lessons[id]?.hasFullContent).length} lessons checked; coach + observer smoke passed.`,
);
