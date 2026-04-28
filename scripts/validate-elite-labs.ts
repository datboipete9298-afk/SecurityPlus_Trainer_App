/**
 * Elite Lab Factory — template + generator sanity.
 * Run: npx tsx scripts/validate-elite-labs.ts
 */
import { ORDERED_LESSON_IDS } from "../src/data/lessons";
import { lessons } from "../src/data/lessons";
import {
  evaluateTemplateStructuralRules,
  validateSyntheticAlertConsistency,
} from "../src/eliteLab/labConstraintSolver";
import { ELITE_TEMPLATES } from "../src/eliteLab/labTemplates";
import {
  fingerprintHash,
  generateAlertTriageLabInstance,
  generateIncidentStubInstance,
  generateIamMisconfigStubInstance,
  labInstanceToTrainingLab,
  deriveLessonSeed,
} from "../src/eliteLab/labGenerator";
import { elitePassThreshold } from "../src/eliteLab/eliteLabThresholds";
import { DOMAIN_MENTOR_HOOKS, getDomainMentorHook } from "../src/eliteLab/domainMentorHooks";
import { buildPostScoreTriageDebrief } from "../src/eliteLab/triageDebrief";
import type { DomainId } from "../src/types";

const problems: string[] = [];

for (const id of ["1", "2", "3", "4", "5"] as DomainId[]) {
  const h = DOMAIN_MENTOR_HOOKS[id];
  if (
    !h?.label?.trim() ||
    !h.decisionPrinciple?.trim() ||
    !h.examTrap?.trim() ||
    !h.prioritize?.trim() ||
    !h.doNotOvervalue?.trim() ||
    !h.keywords?.trim()
  ) {
    problems.push(`DOMAIN_MENTOR_HOOKS missing copy for domain ${id}`);
  }
}

for (const tmpl of Object.keys(ELITE_TEMPLATES) as (keyof typeof ELITE_TEMPLATES)[]) {
  const t = ELITE_TEMPLATES[tmpl];
  if (!t.scenarioStructure.length) problems.push(`Template ${tmpl}: empty scenarioStructure`);
  if (!t.decisionPoints.length) problems.push(`Template ${tmpl}: no decisionPoints`);
}

const reproducibilitySeeds = [deriveLessonSeed("validate-a"), deriveLessonSeed("validate-b")];

for (const seed of reproducibilitySeeds) {
  const inst = generateAlertTriageLabInstance({
    lessonId: "lesson-validate",
    seed,
    difficulty: 3,
  });
  const h1 = inst.dedupHash;
  const inst2 = generateAlertTriageLabInstance({
    lessonId: "lesson-validate",
    seed,
    difficulty: 3,
  });
  if (inst2.dedupHash !== h1) {
    problems.push(`SOC triage deterministic hash mismatch seed=${seed}`);
  }

  const c = inst.generatedContent.engine === "ALERT_TRIAGE" ? inst.generatedContent : null;
  if (!c) {
    problems.push("SOC triage generator returned wrong engine marker");
    continue;
  }

  const lg = c.learnerGuide;
  if (!lg?.doThisNow?.trim() || !lg.howScoringWorks.includes(String(elitePassThreshold(3)))) {
    problems.push(`[seed ${seed}] learnerGuide missing copy or pass threshold text`);
  }
  if (!lg?.examStrip?.objective || !lg.examStrip.trap || !lg.examStrip.keyword) {
    problems.push(`[seed ${seed}] examStrip incomplete`);
  }
  if (!lg.afterFail?.trim() || !lg.whyOrderMatters?.trim()) {
    problems.push(`[seed ${seed}] recovery / rationale copy missing`);
  }

  /** Post-score debrief contract (pairs with UI; does not affect scoring math) */
  try {
    const badUserOrder = [...c.canonicalPriorityIds].reverse();
    const debriefPassProbe = buildPostScoreTriageDebrief({
      userOrderIds: c.canonicalPriorityIds,
      canonicalPriorityIds: c.canonicalPriorityIds,
      alerts: c.alerts,
      score: 95,
      pass: true,
      domainHook: getDomainMentorHook("4"),
      learnerGuide: lg,
    });
    const debriefFailProbe = buildPostScoreTriageDebrief({
      userOrderIds: badUserOrder,
      canonicalPriorityIds: c.canonicalPriorityIds,
      alerts: c.alerts,
      score: 42,
      pass: false,
      domainHook: getDomainMentorHook("4"),
      learnerGuide: lg,
    });
    for (const [label, d] of [
      ["pass", debriefPassProbe],
      ["fail", debriefFailProbe],
    ] as const) {
      if (
        !d.prioritizedWell?.trim() ||
        !d.missedFocus?.trim() ||
        !d.whyOrderMatters?.trim() ||
        !d.nextTime?.trim() ||
        !d.examTakeaway?.trim() ||
        !Array.isArray(d.pairwiseMistakes)
      ) {
        problems.push(`[seed ${seed}] buildPostScoreTriageDebrief (${label}) incomplete`);
      }
    }
  } catch (e) {
    problems.push(`[seed ${seed}] buildPostScoreTriageDebrief threw ${String(e)}`);
  }

  validateSyntheticAlertConsistency(c.alerts, c.canonicalPriorityIds).forEach((e) =>
    problems.push(`[seed ${seed}] ${e.message}`),
  );

  evaluateTemplateStructuralRules("SOC_ALERT_TRIAGE_TEMPLATE", {
    alertCount: c.alerts.length,
  }).forEach((m) => problems.push(`[seed ${seed}] ${m.message}`));

  /** Cross-version sanity on fingerprint length */
  const fp = fingerprintHash([inst.instanceId, inst.templateId]);
  if (fp.length < 4) problems.push(`fingerprint unexpectedly short (${fp})`);
}

/** Training shell conversion must not throw for stub + triage payloads */
try {
  for (const lessonId of ORDERED_LESSON_IDS.slice(0, 5)) {
    labInstanceToTrainingLab(generateIncidentStubInstance(lessonId));
    labInstanceToTrainingLab(generateIamMisconfigStubInstance(lessonId));
    labInstanceToTrainingLab(
      generateAlertTriageLabInstance({ lessonId, seed: deriveLessonSeed(`${lessonId}-x`), difficulty: 2 }),
    );
  }
} catch (e) {
  problems.push(`labInstanceToTrainingLab threw ${String(e)}`);
}

/** Smoke every full-lesson bridge */
for (const id of ORDERED_LESSON_IDS) {
  const L = lessons[id];
  if (!L?.hasFullContent) continue;
  try {
    const tri = generateAlertTriageLabInstance({
      lessonId: id,
      seed: deriveLessonSeed(id),
      difficulty: 3,
    });
    labInstanceToTrainingLab(tri);
  } catch (e) {
    problems.push(`Full lesson bridge failed ${id}: ${String(e)}`);
  }
}

if (problems.length) {
  console.error("validate-elite-labs: FAILED\n" + problems.filter(Boolean).join("\n"));
  process.exit(1);
}

console.log("validate-elite-labs: OK — templates wired, SOC triage generator consistent, converters load.");
