import type { Lesson } from "../types";
import { SECTION_ORDER } from "./sectionOrder";
import { genericOutlineLesson } from "./lessonFactory";
import { lessonsBase } from "./lessonsBase";
import { domain1Extended } from "./domain1Extended";
import { domain2Lessons } from "./domain2Bulk";
import { outlineLessons } from "./outlineLessons";
import { messerLessons } from "./messerLessons";
import { VIDEO_MAP } from "./videoMap";

const merged: Record<string, Lesson> = {
  ...lessonsBase,
  ...domain1Extended,
  ...domain2Lessons,
  ...outlineLessons,
  ...messerLessons,
};

const orderMap = new Map(SECTION_ORDER.map((s, i) => [s.id, i + 1]));

function normalizeLesson(id: string, L: Lesson): Lesson {
  const sMeta = SECTION_ORDER.find((s) => s.id === id);
  const order = orderMap.get(id) ?? L.order;
  const secFromLabel = sMeta?.label.match(/^(\d+\.\d+)/)?.[1];
  return {
    ...L,
    id,
    order,
    title: L.title || sMeta?.label || id,
    domain: (sMeta?.domain ?? L.domain) as Lesson["domain"],
    sectionNumber: L.sectionNumber ?? VIDEO_MAP[id]?.section ?? secFromLabel,
  };
}

export const lessons: Record<string, Lesson> = {};

for (const [id, L] of Object.entries(merged)) {
  lessons[id] = normalizeLesson(id, L);
}

for (const s of SECTION_ORDER) {
  if (!lessons[s.id]) {
    lessons[s.id] = normalizeLesson(s.id, { ...genericOutlineLesson(s.id, s.label, s.domain), hasFullContent: true });
  }
}

/** Full Messer-ordered curriculum IDs (same as `sectionOrder` coverage). */
export const ORDERED_LESSON_IDS: readonly string[] = SECTION_ORDER.map((s) => s.id);

/** @deprecated use ORDERED_LESSON_IDS; kept so imports do not break */
export const MVP_LESSON_IDS = ORDERED_LESSON_IDS;

export function getLessonList(): { id: string; title: string; hasFullContent: boolean; domain: string }[] {
  return Object.values(lessons)
    .sort((a, b) => a.order - b.order)
    .map((l) => ({ id: l.id, title: l.title, hasFullContent: l.hasFullContent, domain: l.domain }));
}

export function getNextSectionId(lessonId: string): string | null {
  const i = SECTION_ORDER.findIndex((s) => s.id === lessonId);
  if (i < 0 || i >= SECTION_ORDER.length - 1) return null;
  return SECTION_ORDER[i + 1]!.id;
}
