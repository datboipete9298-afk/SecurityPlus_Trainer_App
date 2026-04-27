import type { Readiness } from "../types";
import { allQuestions } from "../data/quizzes";
import { allStaticFlashcards } from "../data/flashcards";
import { lessons } from "../data/lessons";
import type { PersistedState } from "./storage";

const FULL_LESSON_COUNT = () => Object.values(lessons).filter((x) => x.hasFullContent).length;

/** Core readiness heuristic — safe to import from observer modules (no coach cycle). */
export function computeExamReadiness(s: PersistedState): { score: number; label: Readiness } {
  const qs = allQuestions();
  let correct = 0,
    tot = 0;
  for (const q of qs) {
    const st = s.questionStats[q.id];
    if (st) {
      tot += st.c + st.w;
      correct += st.c;
    }
  }
  const quizPct = tot ? (correct / tot) * 100 : 0;
  const nFull = Math.max(FULL_LESSON_COUNT(), 1);
  const completion = (s.completedLessons.length / nFull) * 40;
  const cards = allStaticFlashcards().length + s.userFlashcards.length;
  const cardCoverage = s.spaced.length / Math.max(cards, 1) * 20;
  const weak = s.missedJournal.length * 2;
  const trainBonus = Math.min(10, s.trainingMasteryLessonIds?.length ?? 0);
  const pbqN = s.pbqPassedIds?.length ?? 0;
  /** Up to +4 for PBQ-style drills — complements quiz stats without double-counting misses */
  const pbqBonus = Math.min(4, pbqN);
  const raw = Math.min(100, Math.round(completion * 0.4 + quizPct * 0.45 + cardCoverage * 0.15 - weak + trainBonus + pbqBonus));
  let label: Readiness = "not_ready";
  if (raw >= 80) label = "exam_ready";
  else if (raw >= 60) label = "almost";
  else if (raw >= 35) label = "building";
  return { score: Math.max(0, raw), label };
}
