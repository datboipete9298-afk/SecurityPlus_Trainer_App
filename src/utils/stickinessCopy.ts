import type { NextStep } from "../core/nextStepEngine";
import type { Lesson, QuizQuestion, Readiness } from "../types";
import { lessons, ORDERED_LESSON_IDS } from "../data/lessons";
import { nextLessonId } from "./lessonOrder";
import type { PersistedState } from "./storage";
import { nextStreakMilestone } from "./streakMilestones";

export function sessionEndHeadlines(hasTodayActivity: boolean): { primary: string; secondary: string } {
  return {
    primary: hasTodayActivity
      ? "You made progress today."
      : "Even a short visit keeps your brain in Security+ mode — that’s how the exam gets closer.",
    secondary: "You’re getting closer to passing Security+.",
  };
}

export function buildProgressStory(s: PersistedState): string[] {
  const done = s.completedLessons.filter((id) => ORDERED_LESSON_IDS.includes(id)).length;
  const nl = nextLessonId(s);
  const firstFull = ORDERED_LESSON_IDS.find((id) => lessons[id]?.hasFullContent) ?? ORDERED_LESSON_IDS[0]!;
  const firstTitle = lessons[firstFull]?.title ?? "the first section";
  if (!nl) {
    return [
      `You started with **${firstTitle}**. You’ve moved through the full Messer chain in this app — now it’s polish, exams, and weak-area wins.`,
    ];
  }
  const curTitle = lessons[nl]?.title ?? nl;
  if (done === 0) {
    return [
      `You’re focused on **${curTitle}** now. Early sections feel heavy; then vocabulary and patterns start to snap together.`,
    ];
  }
  return [
    `You started with **${firstTitle}**. You’ve finished **${done}** full sections — and you’re sitting on **${curTitle}**. That’s a real arc, not noise.`,
  ];
}

export function buildMissJournalNarrative(s: PersistedState): string | null {
  const attempts = Object.values(s.questionStats).reduce((a, st) => a + st.c + st.w, 0);
  if (attempts < 8) return null;
  const n = s.missedJournal.length;
  if (n <= 5) return "Your miss list is small for how much you’ve practiced — that usually means you’re fixing traps instead of ignoring them.";
  if (n >= 28) return "You’ve collected more misses — honest prep. Shrink the list a little each session; the exam rewards repair, not pride.";
  return "Every miss you re-read is one fewer ‘gotcha’ on game day.";
}

export function buildDomainPulse(s: PersistedState): string | null {
  const sorted = Object.entries(s.domainScore).sort((a, b) => a[1] - b[1]);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  if (!low || !high) return null;
  const [lowId, lowV] = low;
  const [highId, highV] = high;
  if (lowV >= 52 && highV >= 55) return "Your domain scores look even enough that **mixed** quizzes and PBQs are the best next fuel.";
  if (Number(highV) - Number(lowV) >= 12) {
    return `**Domain ${highId}** feels stronger while **Domain ${lowId}** still wants reps — that imbalance is normal; narrow it with short drills.`;
  }
  return `Extra love for **Domain ${lowId}** still moves the composite score the fastest.`;
}

export function buildStreakNearMiss(streak: number): string | null {
  const next = nextStreakMilestone(streak);
  if (!next) return null;
  const gap = next - streak;
  if (gap === 1) return `You’re very close to a **${next}-day streak** — tomorrow’s visit seals it.`;
  if (gap === 2) return `Two more check-ins and you hit the **${next}-day** marker — small, dignified momentum.`;
  return null;
}

export function buildReadinessNearMiss(score: number, label: Readiness): string | null {
  if (label === "exam_ready") return null;
  if (label === "almost" && score >= 77 && score < 80) {
    return "You’re very close to **exam ready** on the local model — one tight review session might tip it.";
  }
  if (score >= 74 && score < 77 && (label === "building" || label === "almost")) {
    return "You’re within a few points of the next readiness band — short, honest quiz runs move this fastest.";
  }
  if (label === "building" && score >= 56 && score < 60) return "You’re very close to **almost ready** — keep pairing quizzes with miss repair.";
  if (label === "not_ready" && score >= 32 && score < 36) return "You’re one steady week from feeling **building**-level solid — stay on the chain.";
  return null;
}

export type NextSessionHook = { headline: string; detail: string };

export function buildNextSessionHook(s: PersistedState, nextStep: NextStep, explicitNextLessonId: string | null): NextSessionHook {
  const fromHref = nextStep.href.match(/\/lesson\/([^/?]+)/)?.[1];
  const nid = explicitNextLessonId ?? fromHref ?? nextLessonId(s);
  const L = nid && lessons[nid]?.hasFullContent ? lessons[nid]! : null;
  if (L) {
    const trap = L.examTraps[0]?.a?.replace(/\s+/g, " ").trim();
    const kw = L.instantRecognition[0]?.keyword;
    let detail: string;
    if (trap && trap.length > 24) {
      detail = `Stems often hinge on ideas like this: ${trap.slice(0, 155)}${trap.length > 155 ? "…" : ""}`;
    } else if (kw) {
      detail = `Watch for **${kw}** in the stem — Security+ loves that trigger-to-definition pattern.`;
    } else if (L.miniQuizIntro?.trim()) {
      detail = L.miniQuizIntro.trim().slice(0, 160) + (L.miniQuizIntro.length > 160 ? "…" : "");
    } else {
      detail = "This objective shows up across the exam — worth owning calmly, not skimming once.";
    }
    return {
      headline: `Next session, you’ll work on **${L.title}**.`,
      detail,
    };
  }
  if (nextStep.href.includes("/weak") || nextStep.nextAction.toLowerCase().includes("domain")) {
    const weaks = Object.entries(s.domainScore).sort((a, b) => a[1] - b[1])[0];
    const d = weaks?.[0] ?? "1";
    return {
      headline: `Next session, you’ll **strengthen Domain ${d}**.`,
      detail: "Repair there raises how safe you feel on mixed practice — it’s high-leverage time.",
    };
  }
  return {
    headline: `Next session: **${nextStep.nextAction.replace(/\*\*/g, "")}**.`,
    detail: nextStep.why,
  };
}

export function lessonAnticipationLine(current: Lesson, next: Lesson): string {
  const flip = (current.id.length + next.id.length) % 2 === 0;
  if (flip) {
    return `${next.title} gets easier once the hooks from this section are automatic — you’re laying the wiring Messer intended.`;
  }
  return `This idea connects forward to ${next.title} — the playlist order is there so the next chapter has something to snap onto.`;
}

const SMART_PRAISE = [
  "You matched the stem to the right control — that’s the habit the exam rewards.",
  "That’s exactly how CompTIA frames that trap — you answered like someone who’s seen the pattern before.",
  "Right answer for the right reason: keyword → definition, not the longest story.",
  "You eliminated the distractors the way an experienced candidate would — tight.",
  "You picked the option the objectives expect — that’s the muscle memory phase kicking in.",
  "Clean read: you didn’t let an almost-right term steal the slot.",
] as const;

export function smartQuizPraise(q: QuizQuestion): string {
  const seed = (q.id.length * 7 + (q.examKeyword?.length ?? 0) + q.domain.charCodeAt(0)) % SMART_PRAISE.length;
  return SMART_PRAISE[seed] ?? SMART_PRAISE[0];
}
