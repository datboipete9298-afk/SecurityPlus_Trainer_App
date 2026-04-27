import type { Readiness } from "../types";

export type MicroTone = "encouraging" | "reinforcing" | "exam";

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic pick — stable for same seed. */
export function pickIndex(seed: string, modulo: number): number {
  if (modulo <= 1) return 0;
  return hashStr(seed) % modulo;
}

/** SY0-701-style short domain labels for natural sentences. */
export function examDomainShortTitle(domainId: string): string {
  const m: Record<string, string> = {
    "1": "general security concepts",
    "2": "threats and mitigations",
    "3": "security architecture",
    "4": "security operations",
    "5": "governance, risk, and compliance",
  };
  return m[domainId] ?? `exam domain ${domainId}`;
}

export function microToneFromReadiness(label: Readiness): MicroTone {
  if (label === "not_ready") return "encouraging";
  if (label === "exam_ready") return "exam";
  return "reinforcing";
}

export function truncateTopic(text: string, maxLen = 44): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "this topic";
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

const LESSON_CLOSURE: Record<MicroTone, string> = {
  encouraging: "steady work like this adds up faster than it feels.",
  reinforcing: "that's how real understanding builds.",
  exam: "that's the same follow-through performance-based items assume.",
};

const PBQ_CLOSURE: Record<MicroTone, string> = {
  encouraging: "labs like this are worth the time while you're still building.",
  reinforcing: "that's the procedural thinking these drills train.",
  exam: "that's the kind of sequencing the exam expects under pressure.",
};

const SESSION_CLOSURE: Record<MicroTone, string> = {
  encouraging: "showing up for a full block matters more than speed.",
  reinforcing: "focused blocks like this are what readiness is made of.",
  exam: "sustained focus is what exam day asks for — you just practiced it.",
};

const FLASH_STREAK_CLOSURE: Record<MicroTone, string> = {
  encouraging: "keep the rhythm — recall is starting to stick.",
  reinforcing: "that's genuine recall, not pattern-matching the deck.",
  exam: "closed-book recall is exactly what you'll need on the test.",
};

const WEAK_REPAIR_CLOSURE: Record<MicroTone, string> = {
  encouraging: "repairing misses is how the scoreboard turns around.",
  reinforcing: "that's the repair loop working — not luck.",
  exam: "closing gaps like this is how you earn points back on exam day.",
};

export function buildLessonCompleteIdentityLine(lessonTitle: string, readiness: Readiness): string {
  const tone = microToneFromReadiness(readiness);
  const topic = truncateTopic(lessonTitle);
  const c = LESSON_CLOSURE[tone];
  const v = pickIndex(`lesson:${topic}:${readiness}`, 3);
  if (v === 0) return `You followed “${topic}” all the way through — ${c}`;
  if (v === 1) return `You closed the loop on “${topic}” — ${c}`;
  return `Finishing “${topic}” end-to-end — ${c}`;
}

export function buildPbqFirstIdentityLine(domainId: string, readiness: Readiness, pbqId: string): string {
  const tone = microToneFromReadiness(readiness);
  const domain = examDomainShortTitle(domainId);
  const c = PBQ_CLOSURE[tone];
  const v = pickIndex(`pbq:${pbqId}:${readiness}`, 3);
  if (v === 0) return `You just worked through ${domain} the way the exam expects — ${c}`;
  if (v === 1) return `That ${domain} ordering — you handled it like a performance-based item — ${c}`;
  return `Strong ${domain} lab pass — procedural thinking, not guessing — ${c}`;
}

export function buildSession30IdentityLine(readiness: Readiness, daySeed: string): string {
  const tone = microToneFromReadiness(readiness);
  const c = SESSION_CLOSURE[tone];
  const v = pickIndex(`session30:${daySeed}:${readiness}`, 3);
  if (v === 0) return `This kind of focused session is what builds real readiness — ${c}`;
  if (v === 1) return `You stayed in the block for the full 30 minutes — ${c}`;
  return `A complete half-hour study block — no shortcuts — ${c}`;
}

export function buildFlashcardStreakIdentityLine(topicHint: string, readiness: Readiness, cardId: string): string {
  const tone = microToneFromReadiness(readiness);
  const hook = truncateTopic(topicHint, 36);
  const c = FLASH_STREAK_CLOSURE[tone];
  const v = pickIndex(`fc-streak:${cardId}:${readiness}`, 3);
  if (v === 0) return `You're recalling “${hook}” without guessing now — ${c}`;
  if (v === 1) return `That run of honest “got it” grades on “${hook}” — ${c}`;
  return `Clean recall on “${hook}” — the kind that holds under pressure — ${c}`;
}

export function buildWeakCardRepairIdentityLine(topicHint: string, readiness: Readiness, cardId: string): string {
  const tone = microToneFromReadiness(readiness);
  const hook = truncateTopic(topicHint, 36);
  const c = WEAK_REPAIR_CLOSURE[tone];
  const v = pickIndex(`fc-repair:${cardId}:${readiness}`, 3);
  if (v === 0) return `You corrected “${hook}” after struggling — ${c}`;
  if (v === 1) return `That “got it” on “${hook}” after misses — ${c}`;
  return `You turned “${hook}” from shaky to solid — ${c}`;
}
