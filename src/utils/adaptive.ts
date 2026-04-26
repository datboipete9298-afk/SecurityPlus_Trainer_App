import { SECTION_ORDER } from "../data/sectionOrder";
import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import { allQuestions } from "../data/quizzes";
import { allStaticFlashcards } from "../data/flashcards";
import { BOSS_FIGHTS } from "../data/bossFights";
import { getNextStep, getNextStepCoachingLines } from "../core/nextStepEngine";
import type { CoachRecommendation, Readiness } from "../types";
import type { PersistedState } from "./storage";
export { nextLessonId } from "./lessonOrder";

const LEVELS = [
  { id: 1, name: "Rookie", xp: 0 },
  { id: 2, name: "Learner", xp: 150 },
  { id: 3, name: "Operator", xp: 400 },
  { id: 4, name: "Analyst", xp: 800 },
  { id: 5, name: "Defender", xp: 1300 },
  { id: 6, name: "Security Pro", xp: 2000 },
  { id: 7, name: "Exam Ready", xp: 3000 },
];

export const BOSSES = BOSS_FIGHTS.map((b) => ({ id: b.id, name: b.name, relatedLessons: b.relatedLessons }));

export function getLevelName(xp: number): { level: number; name: string; next: number } {
  let l = LEVELS[0]!;
  for (const row of LEVELS) {
    if (xp >= row.xp) l = row;
  }
  const idx = LEVELS.findIndex((x) => x.xp === l.xp);
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1]!.xp : l.xp;
  return { level: l.id, name: l.name, next: next || l.xp };
}

const FULL_LESSON_COUNT = () => Object.values(lessons).filter((x) => x.hasFullContent).length;

export function examReadiness(s: PersistedState): { score: number; label: Readiness } {
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
  const raw = Math.min(100, Math.round(completion * 0.4 + quizPct * 0.45 + cardCoverage * 0.15 - weak));
  let label: Readiness = "not_ready";
  if (raw >= 80) label = "exam_ready";
  else if (raw >= 60) label = "almost";
  else if (raw >= 35) label = "building";
  return { score: Math.max(0, raw), label };
}

export type SmartCoachOutput = {
  todaysBestMove: string;
  why: string;
  doThisNext: [string, string, string];
};

/**
 * Aligned 1:1 with `getNextStep` / `nextStepEngine` — no extra coach noise.
 */
export function getSmartCoachOutput(s: PersistedState): SmartCoachOutput {
  return getNextStepCoachingLines(getNextStep(s));
}

export function smartCoach(s: PersistedState): CoachRecommendation[] {
  const step = getNextStep(s);
  return [
    {
      title: step.nextAction,
      reason: step.why,
      why: step.why,
      type: "lesson",
    },
  ];
}

export { LEVELS };

export function isLessonUnlocked(lessonId: string, s: PersistedState): boolean {
  if (!lessons[lessonId]) return true;
  const idx = ORDERED_LESSON_IDS.indexOf(lessonId);
  if (idx <= 0) return true;
  const prev = ORDERED_LESSON_IDS[idx - 1];
  if (!prev) return true;
  return s.completedLessons.includes(prev);
}

export function addMiss(s: PersistedState, qid: string, lessonId: string): PersistedState {
  return {
    ...s,
    missedJournal: [...s.missedJournal, { qid, at: Date.now(), lessonId }].slice(-200),
  };
}

export function updateDomainScore(s: PersistedState, dom: string, correct: boolean): PersistedState {
  const cur = s.domainScore[dom] ?? 50;
  const delta = correct ? 3 : -5;
  return { ...s, domainScore: { ...s.domainScore, [dom]: Math.max(0, Math.min(100, cur + delta)) } };
}

export function reviewQueue(s: PersistedState): { cardId: string; when: string }[] {
  const now = Date.now();
  return s.spaced
    .filter((x) => x.nextReview <= now)
    .map((x) => ({ cardId: x.cardId, when: "due now" }));
}

export { SECTION_ORDER };

/** When a boss is failed, nudge domain / journal */
export function applyBossFailure(s: PersistedState, relatedLessonId: string, domain: string): PersistedState {
  let ns = updateDomainScore(s, domain, false);
  ns = addMiss(ns, `boss-miss-${Date.now()}`, relatedLessonId);
  return ns;
}
