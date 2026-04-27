import type { Readiness } from "../types";
import type { PersistedState } from "./storage";
import { computeExamReadiness } from "./examReadinessScore";
import {
  examDomainShortTitle,
  hashStr,
  microToneFromReadiness,
  pickIndex,
  truncateTopic,
  type MicroTone,
} from "./identityPersonalization";

/** Snapshot domain scores at the start of each calendar day (first activity sets it). */
export function ensureDomainDayBaseline(s: PersistedState, dayIso: string): PersistedState {
  if (s.domainScoreDayBaseline?.date === dayIso) return s;
  return { ...s, domainScoreDayBaseline: { date: dayIso, scores: { ...s.domainScore } } };
}

export type QuizRevealIdentityContext = {
  questionId: string;
  domain: string;
  /** Lesson title when available — improves relevance without extra tracking. */
  lessonTitle?: string;
  readinessLabel: Readiness;
  prevCorrect: number;
  prevWrong: number;
  correctNow: boolean;
};

const DOMAIN_UP_CLOSURE: Record<MicroTone, [string, string]> = {
  encouraging: ["keep stacking reps — it shows up in your readiness score.", "this is the kind of lift that compounds."],
  reinforcing: ["the baseline is moving in the right direction.", "your error pattern here is getting cleaner."],
  exam: ["that's the domain lift item writers expect you to feel.", "this is how you earn points back in that objective area."],
};

const DOMAIN_DOWN_CLOSURE: Record<MicroTone, string> = {
  encouraging: "short repairs here still move the needle — that's normal.",
  reinforcing: "note it, repair once, move on — that's the loop.",
  exam: "exam day will mix domains — catching this early helps.",
};

/**
 * One calm line after a correct reveal — priority: repair (wrong→right) > depth > exam > occasional identity.
 * Skipped on incorrect answers.
 */
export function pickQuizIdentityLine(ctx: QuizRevealIdentityContext): string | null {
  if (!ctx.correctNow) return null;

  const tone = microToneFromReadiness(ctx.readinessLabel);
  const dom = examDomainShortTitle(ctx.domain);
  const topic = truncateTopic(ctx.lessonTitle ?? dom, 40);
  const seedBase = `${ctx.questionId}:${ctx.domain}:${ctx.readinessLabel}`;

  if (ctx.prevWrong >= 1) {
    const v = pickIndex(`q-repair:${seedBase}`, 3);
    if (v === 0) return `That shift on ${dom} — miss to hit — that's real learning.`;
    if (v === 1) return `You turned this “${topic}” item around — that's the repair that transfers.`;
    return tone === "encouraging"
      ? `Moving from wrong to right on ${dom} — that kind of correction is how confidence grows.`
      : `Wrong → right on ${dom} — that's pattern recognition, not luck.`;
  }

  if (ctx.prevCorrect >= 1) {
    const v = pickIndex(`q-depth:${seedBase}`, 3);
    if (v === 0) return `On “${topic}”, you're not just remembering — you understand how it fits.`;
    if (v === 1) return `Repeat corrects on ${dom} — that's depth, not first-guess luck.`;
    return `This “${topic}” hook is starting to look familiar for the right reasons.`;
  }

  if (ctx.prevCorrect === 0 && ctx.prevWrong === 0) {
    const h = hashStr(`${ctx.questionId}:${ctx.domain}`);
    if (h % 6 === 0) {
      const i = pickIndex(`q-id:${seedBase}`, 3);
      const lines = [
        `You're starting to think like someone who gets ${dom} — not just the acronym soup.`,
        `“${topic}” — you're building exam awareness one stem at a time.`,
        `On ${dom}, you're matching patterns the objectives keep coming back to.`,
      ];
      return lines[i] ?? lines[0];
    }
    if (h % 6 === 1) {
      const i = pickIndex(`q-ex:${seedBase}`, 2);
      return i === 0
        ? `**${dom}** — this is the kind of discrimination the test rewards.`
        : `**${topic}** — that's the same careful read the exam expects.`;
    }
  }

  return null;
}

const DOMAIN_IDS = ["1", "2", "3", "4", "5"] as const;

/** Compare today's domain scores to start-of-day baseline. */
export function pickDomainMasteryNudge(s: PersistedState, todayIso: string): string | null {
  const b = s.domainScoreDayBaseline;
  if (!b || b.date !== todayIso) return null;

  let bestUp: { d: string; delta: number } | null = null;
  let worstDown: { d: string; delta: number } | null = null;

  for (const d of DOMAIN_IDS) {
    const cur = s.domainScore[d] ?? 0;
    const base = b.scores[d] ?? cur;
    const delta = cur - base;
    if (delta >= 4 && (!bestUp || delta > bestUp.delta)) bestUp = { d, delta };
    if (delta <= -5 && (!worstDown || delta < worstDown.delta)) worstDown = { d, delta };
  }

  const { label: readinessLabel } = computeExamReadiness(s);
  const tone = microToneFromReadiness(readinessLabel);
  const domUp = bestUp ? examDomainShortTitle(bestUp.d) : "";
  const domDown = worstDown ? examDomainShortTitle(worstDown.d) : "";

  if (bestUp) {
    const kind = bestUp.delta >= 8 ? "fewer mistakes" : "stronger recall";
    const v = pickIndex(`dom-up:${bestUp.d}:${todayIso}:${readinessLabel}`, 3);
    const [c0, c1] = DOMAIN_UP_CLOSURE[tone];
    if (v === 0) return `You're getting stronger in ${domUp} (${kind}) — ${c0}`;
    if (v === 1) return `${domUp} is moving up today — ${c1}`;
    return `Today's work is lifting ${domUp} — ${c0}`;
  }
  if (worstDown) {
    return `${domDown} still needs attention — ${DOMAIN_DOWN_CLOSURE[tone]}`;
  }
  return null;
}

/** After enough reps, a subtle long-arc line (dashboard only; low frequency). */
export function pickLongTermProgressLine(s: PersistedState): string | null {
  const attempts = Object.values(s.questionStats).reduce((a, st) => a + (st?.c ?? 0) + (st?.w ?? 0), 0);
  const lessonsDone = s.completedLessons?.length ?? 0;
  if (attempts < 14 && lessonsDone < 2) return null;
  const { label } = computeExamReadiness(s);
  const tone = microToneFromReadiness(label);
  const v = pickIndex(`lt:${s.lastActiveDay}:${attempts}:${label}`, 3);
  if (tone === "encouraging") {
    const lines = [
      "You've come further than when you started — keep the pace kind to yourself.",
      "The path feels a little wider than week one — that's real, even if scores wobble.",
      "You're collecting proof that you can stick with this — that matters on exam day too.",
    ];
    return lines[v] ?? lines[0];
  }
  if (tone === "exam") {
    const lines = [
      "You're connecting objectives now — the kind of cross-links item writers love.",
      "Lessons, labs, and misses are starting to point at the same exam story — that's readiness.",
      "You're past memorizing in isolation — this is integration-level thinking.",
    ];
    return lines[v] ?? lines[0];
  }
  const lines = [
    "You've come further than when you started.",
    "You're connecting concepts now, not just memorizing.",
    "The picture is getting more coherent — trust the reps you already put in.",
  ];
  return lines[v] ?? lines[0];
}
