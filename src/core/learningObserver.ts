import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import type { PersistedState } from "../utils/storage";
import { computeExamReadiness } from "../utils/examReadinessScore";
import { estimateRecallStrength, buildMemoryPlan } from "./memoryEngine";
import { getThinkingPatternAlerts } from "./thinkingPatterns";
import { isLessonHandsOnComplete } from "./trainingProgress";

export type LearningProfile = {
  weakTopics: string[];
  strongTopics: string[];
  decisionMistakes: number;
  noteQualityScore: number;
  recallStrength: number;
  examReadiness: number;
  /** Heuristic 0–100: notes per completed lesson */
  notesEngagementScore: number;
  /** Labs/sims with high retries */
  handsOnStruggleLessons: string[];
  thinkingAlerts: string[];
  memoryPlan: ReturnType<typeof buildMemoryPlan>;
};

function avgTeachQuality(s: PersistedState): number {
  const vals = Object.values(s.teachQuality);
  if (!vals.length) return 50;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) * 20;
}

export function buildLearningProfile(s: PersistedState): LearningProfile {
  const domains = Object.entries(s.domainScore).sort((a, b) => a[1] - b[1]);
  const weakTopics = domains.filter(([, v]) => v < 52).map(([d]) => `Domain ${d}`);
  const strongTopics = domains.filter(([, v]) => v >= 62).map(([d]) => `Domain ${d}`);

  let decisionMistakes = 0;
  const tr = s.trainingRuns;
  if (tr) {
    for (const r of Object.values(tr.decisions)) {
      if (!r.correct) decisionMistakes += r.attempts;
    }
  }

  const notesPerLesson = s.completedLessons.length
    ? s.notes.filter((n) => s.completedLessons.includes(n.lessonId)).length / s.completedLessons.length
    : 0;
  const notesEngagementScore = Math.min(100, Math.round(notesPerLesson * 40 + Math.min(5, s.notes.length) * 8));

  const teach = avgTeachQuality(s);
  const noteQualityScore = Math.min(100, Math.round(teach * 0.6 + notesEngagementScore * 0.4));

  const handsOnStruggleLessons: string[] = [];
  if (tr) {
    for (const [key, r] of Object.entries(tr.sims)) {
      if (r.retries >= 2) {
        const lessonId = key.split("::")[0] ?? "";
        if (lessonId && lessons[lessonId]?.hasFullContent) handsOnStruggleLessons.push(lessonId);
      }
    }
  }

  const readiness = computeExamReadiness(s).score;
  const recallStrength = estimateRecallStrength(s);

  return {
    weakTopics,
    strongTopics,
    decisionMistakes,
    noteQualityScore,
    recallStrength,
    examReadiness: readiness,
    notesEngagementScore,
    handsOnStruggleLessons: [...new Set(handsOnStruggleLessons)].slice(0, 6),
    thinkingAlerts: getThinkingPatternAlerts(s),
    memoryPlan: buildMemoryPlan(s),
  };
}

/** Anti-passive: lesson marked complete but hands-on or notes thin */
export function getAntiPassiveWarnings(lessonId: string, s: PersistedState): string[] {
  const w: string[] = [];
  if (!lessons[lessonId]?.hasFullContent) return w;
  if (s.completedLessons.includes(lessonId) && !isLessonHandsOnComplete(lessonId, s)) {
    w.push("Slow down — you marked this lesson done but hands-on training isn’t complete. You’re not learning the procedure layer yet.");
  }
  const notesHere = s.notes.filter((n) => n.lessonId === lessonId).length;
  if (s.completedLessons.includes(lessonId) && notesHere === 0) {
    w.push("Slow down — zero Brain Book rows for a completed lesson. Add one hook row or you’ll forget this block.");
  }
  const t = s.timeOnLesson[lessonId] ?? 0;
  if (s.completedLessons.includes(lessonId) && t > 0 && t < 45) {
    w.push("You rushed this lesson (<45s tracked time). Re-open highlights or quiz once for real retention.");
  }
  return w;
}

/** Next lesson in chain with thin notes (for coach) */
export function findLessonNeedingNotes(s: PersistedState): string | null {
  for (const id of ORDERED_LESSON_IDS) {
    if (!lessons[id]?.hasFullContent) continue;
    if (!s.completedLessons.includes(id)) continue;
    const n = s.notes.filter((x) => x.lessonId === id).length;
    if (n === 0) return id;
  }
  return null;
}
