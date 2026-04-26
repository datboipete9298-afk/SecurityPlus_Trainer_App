import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import type { PersistedState } from "./storage";

/** First Messer lesson id (in order) that is not completed; null if chain is done. */
export function nextLessonId(s: PersistedState): string | null {
  for (const id of ORDERED_LESSON_IDS) {
    if (!lessons[id]?.hasFullContent) continue;
    if (!s.completedLessons.includes(id)) return id;
  }
  return null;
}
