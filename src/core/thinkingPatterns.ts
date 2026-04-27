import type { PersistedState } from "../utils/storage";
import { allQuestions } from "../data/quizzes";

const PAIRS = [
  ["integrity", "confidentiality"],
  ["authentication", "authorization"],
  ["preventive", "detective"],
];

/**
 * Detects likely misconception patterns from confusion keys + missed journal text.
 */
export function getThinkingPatternAlerts(s: PersistedState): string[] {
  const alerts: string[] = [];
  const conf = s.feedbackLoop?.confusionSignalByConcept ?? {};
  for (const key of Object.keys(conf)) {
    if ((conf[key] ?? 0) < 2) continue;
    const low = key.toLowerCase();
    for (const [a, b] of PAIRS) {
      if (low.includes(a) || low.includes(b)) {
        alerts.push(
          `You are mixing **${a}** and **${b}** — fix this now: write a two-column compare (definition vs symptom) before the next quiz.`,
        );
      }
    }
  }

  const recent = s.missedJournal.slice(-12);
  for (const m of recent) {
    const q = allQuestions().find((x) => x.id === m.qid);
    if (!q) continue;
    const kw = q.examKeyword.toLowerCase();
    for (const [a, b] of PAIRS) {
      if (kw.includes(a) && kw.includes(b)) {
        alerts.push(`Similar-term confusion risk on “${a}” vs “${b}” — re-run the tutor breakdown for that miss.`);
        break;
      }
    }
  }

  const falseConf = s.feedbackLoop?.falseConfidenceHitsByQuestionId ?? {};
  let fc = 0;
  for (const v of Object.values(falseConf)) fc += v;
  if (fc >= 3) {
    alerts.push("Pattern: high confidence + wrong answers — slow down and eliminate distractors on paper before clicking.");
  }

  return [...new Set(alerts)].slice(0, 5);
}
