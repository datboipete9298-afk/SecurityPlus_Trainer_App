/**
 * Ensures quiz items have non-empty explanations for tutor feedback.
 * Run: npx tsx scripts/validate-feedback-data.ts
 */
import { allQuestions } from "../src/data/quizzes";

const problems: string[] = [];

for (const q of allQuestions()) {
  if (!q.explanation?.trim()) problems.push(`Empty explanation: ${q.id}`);
  if (!Array.isArray(q.wrongExplanations) || q.wrongExplanations.length !== q.options.length) {
    problems.push(`wrongExplanations length !== options (${q.id}): ${q.wrongExplanations?.length} vs ${q.options.length}`);
  }
  for (let i = 0; i < (q.wrongExplanations?.length ?? 0); i++) {
    if (!String(q.wrongExplanations[i]).trim()) problems.push(`Empty wrongExplanations[${i}] for ${q.id}`);
  }
}

if (problems.length) {
  console.error("validate-feedback-data: FAILED\n" + problems.slice(0, 40).join("\n"));
  if (problems.length > 40) console.error(`… and ${problems.length - 40} more`);
  process.exit(1);
}

console.log(`validate-feedback-data: OK — ${allQuestions().length} questions checked.`);
