import type { SyntheticAlert } from "./labInstance";
import type { AlertTriageLearnerGuide } from "./labInstance";
import type { DomainMentorHook } from "./domainMentorHooks";

export type PostScoreTriageDebrief = {
  prioritizedWell: string;
  missedFocus: string;
  whyOrderMatters: string;
  nextTime: string;
  examTakeaway: string;
  pairwiseMistakes: string[];
};

/**
 * Highest-severity pairwise inversions (user put `earlier` before `later` but calibrated queue says `later` first).
 * Narratives stay descriptive — never dump full canonical id lists.
 */
export function topPairwiseMistakeLines(
  userOrderIds: readonly string[],
  canonicalPriorityIds: readonly string[],
  alerts: readonly SyntheticAlert[],
  max = 3,
): string[] {
  const byId = new Map<string, SyntheticAlert>();
  alerts.forEach((a) => byId.set(a.id, a));
  const pos = new Map<string, number>();
  canonicalPriorityIds.forEach((id, i) => pos.set(id, i));
  type Inv = { gap: number; earlier: string; later: string };
  const invs: Inv[] = [];
  for (let i = 0; i < userOrderIds.length; i++) {
    for (let j = i + 1; j < userOrderIds.length; j++) {
      const a = userOrderIds[i]!;
      const b = userOrderIds[j]!;
      const pa = pos.get(a);
      const pb = pos.get(b);
      if (pa === undefined || pb === undefined) continue;
      if (pa > pb) {
        invs.push({ gap: pa - pb, earlier: a, later: b });
      }
    }
  }
  invs.sort((x, y) => y.gap - x.gap);
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const it of invs) {
    const key = `${it.earlier}|${it.later}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(inversionPhrase(byId.get(it.earlier), byId.get(it.later)));
    if (lines.length >= max) break;
  }
  return lines;
}

function inversionPhrase(ahead: SyntheticAlert | undefined, laterInQueue: SyntheticAlert | undefined): string {
  if (!ahead || !laterInQueue) {
    return "A row that looks routine was investigated before another row with higher material impact.";
  }
  const sevA = `${ahead.severityLabel} (${ahead.assetCriticality} asset)`;
  const sevB = `${laterInQueue.severityLabel} (${laterInQueue.assetCriticality} asset)`;
  const hintA = ahead.benign ? "mostly routine / benign-leaning" : "elevated signal";
  const hintB = laterInQueue.benign ? "possibly hygiene noise" : "stronger escalation signal";

  /** `laterInQueue` is the one calibration would bring forward */
  return `You placed ${sevA} — ${hintA} — before ${sevB} — ${hintB}. When impact beats headline severity, the second row should climb the queue sooner.`;
}

export function buildPostScoreTriageDebrief(params: {
  userOrderIds: readonly string[];
  canonicalPriorityIds: readonly string[];
  alerts: readonly SyntheticAlert[];
  score: number;
  pass: boolean;
  domainHook: DomainMentorHook;
  learnerGuide: AlertTriageLearnerGuide;
  lessonTitle?: string;
}): PostScoreTriageDebrief {
  const { userOrderIds, canonicalPriorityIds, alerts, score, pass, domainHook, learnerGuide, lessonTitle } = params;
  const pairwiseMistakes = topPairwiseMistakeLines(userOrderIds, canonicalPriorityIds, alerts, 3);
  const canon = canonicalPriorityIds;

  let prioritizedWell: string;
  if (userOrderIds.length && userOrderIds[0] === canon[0]) {
    prioritizedWell =
      "Your first investigation slot matched the calibrated most urgent row — strongest anchor graders reward.";
  } else if (userOrderIds.length && canon.slice(0, 3).includes(userOrderIds[0]!)) {
    prioritizedWell =
      "Your #1 stayed inside the hottest priority tier — directional judgment was sound.";
  } else if (score >= 78) {
    prioritizedWell = "Overall pairwise alignment stayed disciplined — tighter than chaotic guesswork.";
  } else if (score >= 62) {
    prioritizedWell =
      sessionTheme(lessonTitle) ??
      "You captured part of the pattern — let the pairwise cues below reshuffle early slots.";
  } else {
    prioritizedWell =
      "Use this lap as rehearsal: skim crown-jewel assets plus credible compromise cues ahead of flashy severity badges.";
  }

  let missedFocus: string;
  if (pairwiseMistakes[0]) {
    missedFocus = pairwiseMistakes[0]!;
  } else if (!pass) {
    missedFocus = `Alignment stayed below the pass bar — revisit ${domainHook.prioritize.toLowerCase()} before reacting to flashy queue noise.`;
  } else {
    missedFocus = "Residual ordering deltas are modest — sharpen only if you chase perfect alignment.";
  }

  const whyOrderMatters =
    `${learnerGuide.whyOrderMatters.replace(/\*\*/g, "")}\nDomain lens (${domainHook.label}): ${domainHook.decisionPrinciple}`;

  const nextTime = `${domainHook.doNotOvervalue} Focus next run on: ${domainHook.prioritize}`;

  const examTakeaway = `${domainHook.examTrap} Memory pegs: ${domainHook.keywords}.`;

  return {
    prioritizedWell,
    missedFocus,
    whyOrderMatters,
    nextTime,
    examTakeaway,
    pairwiseMistakes,
  };
}

/** Optional flavor from Messer-ish lesson titles—never required */
function sessionTheme(title: string | undefined): string | null {
  if (!title) return null;
  const t = title.toLowerCase();
  if (t.includes("log") || t.includes("siem") || t.includes("monitor"))
    return "You showed analyst instincts consistent with telemetry-heavy lectures — tighten tie-break ordering.";
  if (t.includes("incident") || t.includes("response")) return "Incident-flow muscles help—make sure escalation logic beat automation noise.";
  return null;
}
