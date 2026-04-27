import type { PersistedState } from "../utils/storage";
import { allStaticFlashcards } from "../data/flashcards";

/**
 * 0–100: higher = more cards scheduled + recent correct quiz signal.
 */
export function estimateRecallStrength(s: PersistedState): number {
  const staticN = allStaticFlashcards().length + s.userFlashcards.length;
  const scheduled = s.spaced.length;
  const coverage = staticN ? Math.min(100, Math.round((scheduled / staticN) * 70)) : 0;
  let quizSignal = 0;
  let n = 0;
  for (const st of Object.values(s.questionStats)) {
    const t = st.c + st.w;
    if (t === 0) continue;
    quizSignal += (st.c / t) * 100;
    n++;
  }
  const avgQuiz = n ? quizSignal / n : 40;
  return Math.max(0, Math.min(100, Math.round(coverage * 0.45 + avgQuiz * 0.55)));
}

export type MemoryPlanItem = {
  kind: "flashcard" | "quiz" | "teach_back";
  reason: string;
  href: string;
};

export function buildMemoryPlan(s: PersistedState, limit = 4): MemoryPlanItem[] {
  const out: MemoryPlanItem[] = [];
  const now = Date.now();
  const due = s.spaced.filter((x) => x.nextReview <= now).length;
  if (due > 0) {
    out.push({
      kind: "flashcard",
      reason: `${due} card(s) due now — clear them before new reading.`,
      href: "/flashcards",
    });
  }
  const lastMiss = s.missedJournal[s.missedJournal.length - 1];
  if (lastMiss) {
    out.push({
      kind: "quiz",
      reason: "Last miss still shapes your forgetting curve — re-quiz that lesson.",
      href: `/quiz/${lastMiss.lessonId}`,
    });
  }
  if (out.length < limit) {
    out.push({
      kind: "teach_back",
      reason: "Say one objective out loud with eyes closed — strengthens recall more than rereading.",
      href: "/roadmap",
    });
  }
  return out.slice(0, limit);
}
