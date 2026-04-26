import { ORDERED_LESSON_IDS, lessons } from "../data/lessons";
import type { LessonProgress } from "../types/beginner";
import type { PersistedState } from "./storage";
import { nextLessonId } from "./lessonOrder";

function hasAnyProgress(p: Partial<LessonProgress> | undefined): boolean {
  if (!p) return false;
  return Object.values(p).some((v) => v === true || (typeof v === "number" && v > 0));
}

/**
 * “Resume” = first incomplete full lesson in Messer order with any step started.
 * Otherwise null (use `nextStep` / nextLessonId for a fresh start of the current target).
 */
export function getResumeLessonId(s: PersistedState): string | null {
  const next = nextLessonId(s);
  if (!next) return null;
  const p = s.lessonProgress[next];
  if (hasAnyProgress(p)) return next;
  return null;
}

export function getResumeLabel(s: PersistedState): { href: string; text: string; sub: string } | null {
  const id = getResumeLessonId(s);
  if (!id) return null;
  const t = lessons[id]?.title ?? id;
  return {
    href: `/lesson/${id}`,
    text: `Resume: ${t}`,
    sub: "You already started this lesson — pick up where you left off.",
  };
}

/** Index (1-based) in Messer list for current focus — first incomplete with full content. */
export function getYouAreHereIndex(s: PersistedState): { index: number; total: number; id: string | null; title: string | null } {
  const id = nextLessonId(s);
  if (!id) {
    return { index: ORDERED_LESSON_IDS.length, total: ORDERED_LESSON_IDS.length, id: null, title: "Course complete / polish" };
  }
  const idx = ORDERED_LESSON_IDS.indexOf(id);
  const i = idx >= 0 ? idx + 1 : 1;
  return { index: i, total: ORDERED_LESSON_IDS.length, id, title: lessons[id]?.title ?? id };
}
