/**
 * Data consistency checks (CI / pre-build).
 * Run: npx tsx scripts/validate-app-data.ts
 */
import { lessons, ORDERED_LESSON_IDS } from "../src/data/lessons";
import { SECTION_ORDER } from "../src/data/sectionOrder";
import { allQuestions } from "../src/data/quizzes";
import { allStaticFlashcards } from "../src/data/flashcards";
import { labs } from "../src/data/labs";
import { VIDEO_MAP } from "../src/data/videoMap";
import { examARows } from "../src/data/messer/examA.rows";
import { examBRows } from "../src/data/messer/examB.rows";
import { examCRows } from "../src/data/messer/examC.rows";

const problems: string[] = [];

const lessonIds = new Set(Object.keys(lessons));

// SECTION_ORDER matches exported ids
for (const s of SECTION_ORDER) {
  if (!lessons[s.id]) problems.push(`SECTION_ORDER id missing from lessons: ${s.id}`);
}

if (ORDERED_LESSON_IDS.length !== SECTION_ORDER.length) {
  problems.push("ORDERED_LESSON_IDS length !== SECTION_ORDER length");
}

// Duplicate / orphan ordered ids
const seen = new Set<string>();
for (const id of ORDERED_LESSON_IDS) {
  if (seen.has(id)) problems.push(`Duplicate ORDER id: ${id}`);
  seen.add(id);
}

// Video map: keys should be lesson ids (or intentional extras)
for (const k of Object.keys(VIDEO_MAP)) {
  if (!lessonIds.has(k)) problems.push(`VIDEO_MAP key not a lesson id: ${k}`);
}

// Full lessons: quiz, cards, content fields
const full = Object.values(lessons).filter((L) => L.hasFullContent);
for (const L of full) {
  const id = L.id;
  if (!L.quickAction || !String(L.quickAction).trim()) problems.push(`full lesson ${id}: empty quickAction`);
  if (!L.highlightRules || L.highlightRules.length < 1) problems.push(`full lesson ${id}: need highlightRules`);
  const qs = allQuestions().filter((q) => q.lessonId === id);
  if (qs.length < 1) problems.push(`full lesson ${id}: no quiz questions (after merge + generate)`);
  const cards = allStaticFlashcards().filter((c) => c.lessonId === id);
  if (cards.length < 1) problems.push(`full lesson ${id}: no static flashcards`);
  if (VIDEO_MAP[id] == null) problems.push(`full lesson ${id}: missing VIDEO_MAP entry`);
}

// Quiz: lessonIds, duplicate ids
const qById = new Set<string>();
for (const q of allQuestions()) {
  if (!lessonIds.has(q.lessonId)) problems.push(`quiz ${q.id}: invalid lessonId ${q.lessonId}`);
  if (qById.has(q.id)) problems.push(`duplicate question id: ${q.id}`);
  qById.add(q.id);
}

// Flashcards: lessonId, duplicate
const cById = new Set<string>();
for (const c of allStaticFlashcards()) {
  if (!lessonIds.has(c.lessonId)) problems.push(`flashcard ${c.id}: invalid lessonId ${c.lessonId}`);
  if (cById.has(c.id)) problems.push(`duplicate flashcard id: ${c.id}`);
  cById.add(c.id);
}

// Labs
for (const lab of labs) {
  for (const lid of lab.relatedLessonIds) {
    if (!lessonIds.has(lid)) problems.push(`lab ${lab.id}: bad relatedLessonId ${lid}`);
  }
}

// Messer practice exams: row counts + global duplicate IDs across banks
const messerCounts = { examA: examARows.length, examB: examBRows.length, examC: examCRows.length };
const messerSeen = new Set<string>();
for (const row of [...examARows, ...examBRows, ...examCRows]) {
  if (messerSeen.has(row.id)) problems.push(`duplicate Messer MCQ id across banks: ${row.id}`);
  messerSeen.add(row.id);
}
for (const id of ["messer-exam-a", "messer-exam-b", "messer-exam-c"] as const) {
  if (!lessonIds.has(id)) problems.push(`Messer lesson stub missing: ${id}`);
}

if (problems.length) {
  console.error("validate-app-data: FAILED\n" + problems.join("\n"));
  process.exit(1);
}

console.log(
  "validate-app-data: OK —",
  full.length,
  "full lessons,",
  allQuestions().length,
  "questions,",
  allStaticFlashcards().length,
  "flashcards,",
  "| Messer rows A/B/C:",
  messerCounts.examA,
  messerCounts.examB,
  messerCounts.examC,
);
