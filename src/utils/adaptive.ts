import { SECTION_ORDER } from "../data/sectionOrder";
import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import { quizQuestions } from "../data/quizzes";
import { pdfGuideSectionKey } from "../data/pdfGuides";
import { BOSS_FIGHTS } from "../data/bossFights";
import { getNextStep, getNextStepCoachingLines } from "../core/nextStepEngine";
import { isLessonHandsOnComplete } from "../core/trainingProgress";
import { buildLearningProfile } from "../core/learningObserver";
import type { CoachRecommendation, Readiness } from "../types";
import type { PersistedState } from "./storage";
import { computeExamReadiness } from "./examReadinessScore";
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

export function examReadiness(s: PersistedState): { score: number; label: Readiness } {
  return computeExamReadiness(s);
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
  const base = getNextStepCoachingLines(getNextStep(s));
  const profile = buildLearningProfile(s);
  if (profile.thinkingAlerts[0]) {
    return {
      ...base,
      why: `${profile.thinkingAlerts[0]!.replace(/\*\*/g, "")} · ${base.why}`,
    };
  }
  if (profile.recallStrength < 42 && profile.memoryPlan[0]) {
    return {
      ...base,
      why: `Recall strength is low (${profile.recallStrength}/100) — ${profile.memoryPlan[0]!.reason} · ${base.why}`,
    };
  }
  return base;
}

function coachItemRank(r: CoachRecommendation): number {
  if (r.type === "lab" && r.title.startsWith("Hands-on gap")) return 100;
  if (r.type === "lab" && r.title.startsWith("Retry")) return 97;
  if (r.type === "teach" && r.title.startsWith("Decision pattern")) return 95;
  if (r.type === "quiz" && r.href?.includes("/pdf-guides/")) return 92;
  if (r.title.startsWith("Add your course notes PDF")) return 90;
  if (r.type === "teach" && r.title.startsWith("PDF guide:")) return 88;
  if (r.type === "teach" && r.title.includes("Note quality")) return 84;
  if (r.type === "flashcard") return 76;
  return 55;
}

function dedupeCoachByHref(items: CoachRecommendation[]): CoachRecommendation[] {
  const keyOf = (r: CoachRecommendation) => r.href ?? `${r.type}:${r.targetId ?? r.title}`;
  const best = new Map<string, CoachRecommendation>();
  for (const item of items) {
    const k = keyOf(item);
    const prev = best.get(k);
    if (!prev || coachItemRank(item) > coachItemRank(prev)) best.set(k, item);
  }
  const out: CoachRecommendation[] = [];
  const emitted = new Set<string>();
  for (const item of items) {
    const k = keyOf(item);
    if (emitted.has(k)) continue;
    if (best.get(k) === item) {
      out.push(item);
      emitted.add(k);
    }
  }
  return out;
}

/** Primary step + highest-priority secondary rows — reduces decision fatigue. */
export function capCoachRecommendations(items: CoachRecommendation[], maxTotal = 6): CoachRecommendation[] {
  const deduped = dedupeCoachByHref(items);
  if (deduped.length <= maxTotal) return deduped;
  const [primary, ...rest] = deduped;
  const sorted = [...rest].sort((a, b) => coachItemRank(b) - coachItemRank(a));
  return [primary!, ...sorted.slice(0, maxTotal - 1)];
}

export function smartCoach(s: PersistedState): CoachRecommendation[] {
  const step = getNextStep(s);
  const lm = s.pdfLibrary?.localFileMeta ?? {};
  const hasNotesPdf = !!lm["messer-course-notes-v107"];
  const out: CoachRecommendation[] = [
    {
      title: step.nextAction,
      reason: step.why,
      why: step.why,
      type: "lesson",
    },
  ];

  const slipped = s.completedLessons.find(
    (id) => lessons[id]?.hasFullContent && !isLessonHandsOnComplete(id, s),
  );
  if (slipped) {
    const t = lessons[slipped]?.title ?? slipped;
    out.push({
      title: `Hands-on gap: ${t}`,
      reason: "Lesson marked complete, but labs, simulations, or the decision scenario are not all passed.",
      why: "Re-open that lesson, use step 6, and finish every checkpoint — the exam rewards procedure, not bookmarks.",
      type: "lab",
      targetId: slipped,
    });
  }

  const tr = s.trainingRuns;
  if (tr) {
    let worst: { retries: number; lessonId: string; kind: "lab" | "sim" } | null = null;
    for (const [key, r] of Object.entries(tr.labs)) {
      if (r.retries >= 2 && (!worst || r.retries > worst.retries)) {
        const lessonId = key.split("::")[0] ?? "";
        if (lessons[lessonId]?.hasFullContent) worst = { retries: r.retries, lessonId, kind: "lab" };
      }
    }
    for (const [key, r] of Object.entries(tr.sims)) {
      if (r.retries >= 2 && (!worst || r.retries > worst.retries)) {
        const lessonId = key.split("::")[0] ?? "";
        if (lessons[lessonId]?.hasFullContent) worst = { retries: r.retries, lessonId, kind: "sim" };
      }
    }
    if (worst) {
      out.push({
        title: `Retry ${worst.kind}: ${lessons[worst.lessonId]?.title ?? worst.lessonId}`,
        reason: `Several misses logged (${worst.retries}+) — clean runs build automatic exam recognition.`,
        why: "Use the same lesson’s hands-on block; read every “why” after a wrong branch.",
        type: "lab",
        targetId: worst.lessonId,
      });
    }

    for (const [key, r] of Object.entries(tr.decisions)) {
      if (r.attempts >= 3 && !r.correct) {
        const lessonId = key.split("::")[0] ?? "";
        if (lessons[lessonId]?.hasFullContent) {
          out.push({
            title: `Decision pattern: ${lessons[lessonId]?.title ?? lessonId}`,
            reason: "Multiple tries without the exam-best answer — slow down and compare consequences.",
            why: "Re-read the scenario, eliminate the fastest-looking wrong choice first, then pick the control-aligned option.",
            type: "teach",
            targetId: lessonId,
          });
        }
        break;
      }
    }
  }

  const confusingN = s.feedbackLoop?.confusingQuestionIds?.length ?? 0;
  if (confusingN > 0) {
    const firstQid = s.feedbackLoop!.confusingQuestionIds[0]!;
    const qMeta = quizQuestions.find((q) => q.id === firstQid);
    const confusingHref = (() => {
      if (!hasNotesPdf) return "/pdf-setup";
      if (!qMeta) return "/pdf-guides/messer-course-notes-v107";
      if (String(qMeta.lessonId).startsWith("messer-exam")) return "/pdf-guides/messer-practice-exams-v18";
      return `/pdf-guides/messer-course-notes-v107/${qMeta.lessonId}`;
    })();
    out.push({
      title: "Revisit questions you marked confusing",
      reason: `${confusingN} flagged — short targeted review beats rereading whole chapters.`,
      why: "Open the matching PDF study guide section, mark the “must highlight” ideas, then retry the same question without peeking.",
      type: "quiz",
      href: confusingHref,
    });
  }

  const profile = buildLearningProfile(s);
  if (profile.noteQualityScore < 40 && s.completedLessons.length >= 2) {
    const lastLesson = s.completedLessons[s.completedLessons.length - 1];
    out.push({
      title: "Note quality: tighten Brain Book",
      reason: "Teach-backs and rows look thin — the exam needs hooks, not bookmarks.",
      why: "Add one MUST-highlight keyword per completed lesson; keep each field under two lines.",
      type: "teach",
      href: lastLesson ? `/pdf-guides/messer-course-notes-v107/${lastLesson}` : "/pdf-guides",
    });
  }
  if (profile.recallStrength < 45 && profile.memoryPlan[0]) {
    out.push({
      title: profile.memoryPlan[0]!.reason.slice(0, 72),
      reason: "Memory engine: spaced recall is trailing understanding.",
      why: profile.memoryPlan[0]!.reason,
      type: "flashcard",
    });
  }

  if (!hasNotesPdf && s.completedLessons.length >= 1) {
    out.push({
      title: "Add your course notes PDF",
      reason: "The guided layer can open your licensed Messer notes beside each lesson.",
      why: "Add PDF files keeps books on this device only — add once, then use Open local PDF from any guide.",
      type: "teach",
      href: "/pdf-setup",
    });
  }

  if (hasNotesPdf) {
    for (const lid of [...s.completedLessons].reverse()) {
      const key = pdfGuideSectionKey("messer-course-notes-v107", lid);
      const sec = s.pdfLibrary?.bySection[key];
      if (sec && !sec.completedAt) {
        out.push({
          title: `PDF guide: ${lessons[lid]?.title ?? lid}`,
          reason: "You saved the notes PDF — finish guided checkpoints for this section when you can.",
          why: "Guided highlights + one short Brain Book note beat passive re-reading.",
          type: "teach",
          href: `/pdf-guides/messer-course-notes-v107/${lid}`,
        });
        break;
      }
    }
  }

  const lastMiss = s.missedJournal.length ? s.missedJournal[s.missedJournal.length - 1] : undefined;
  if (confusingN > 0 && lastMiss && hasNotesPdf) {
    out.push({
      title: "Open the PDF guide after a miss",
      reason: "Re-anchor the exam keywords for that lesson.",
      why: "Use MUST-highlight targets in the guide while the confusion flag is still active.",
      type: "quiz",
      href: `/pdf-guides/messer-course-notes-v107/${lastMiss.lessonId}`,
    });
  }

  return capCoachRecommendations(out);
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
