/**
 * Infinite Elite Lab Factory — seeded generators (SOC triage primary engine).
 */

import type {
  AlertTriageGeneratedContent,
  AlertTriageLearnerGuide,
  EliteLabDifficulty,
  LabInstance,
  LabRubricCriterion,
  SyntheticAlert,
} from "./labInstance";
import { benignLogFragments, ambiguousLogFragments, hostileLogFragments } from "./labPools";
import { pickPool, POOL_APP_NAMES, POOL_REGIONS } from "./labPools";
import { ELITE_TEMPLATES, SOC_ALERT_TRIAGE_TEMPLATE } from "./labTemplates";
import { evaluateTemplateStructuralRules, validateSyntheticAlertConsistency } from "./labConstraintSolver";
import type { IncidentStubContent, IAMStubContent } from "./labInstance";
import type { TrainingLab } from "../core/labEngine";
import { lessons } from "../data/lessons";
import { elitePassThreshold } from "./eliteLabThresholds";

function strToSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) || 1;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) || 1e-9;
  };
}

export function fingerprintHash(parts: unknown[]): string {
  const raw = JSON.stringify(parts);
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(16).padStart(8, "0")}`;
}

/** Deterministic jitter for strict total order */
function jitterFromId(seed: number, id: string): number {
  let x = seed ^ strToSeed(id);
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 1000) / 1_000_000;
}

export type AlertTriageGenOpts = {
  lessonId: string;
  seed: number;
  difficulty: EliteLabDifficulty;
};

const CRIT_WEIGHT: Record<SyntheticAlert["assetCriticality"], number> = {
  critical: 0,
  high: 120,
  medium: 260,
  low: 400,
};

/**
 * Lower `_urgencyScore` ⇒ investigate sooner.
 * Malicious/high-impact signals outweigh benign chatter even when severity labels flare.
 */
function buildAlertTriageLearnerGuide(opts: AlertTriageGenOpts, noiseLevel: number): AlertTriageLearnerGuide {
  const bar = elitePassThreshold(opts.difficulty);
  const L = lessons[opts.lessonId];
  const dom = L?.domain ?? "1";

  return {
    whatHappened: `Alerts batched into one view — noisy automation next to ambiguous signals next to sharper risk. Same mess as shift change in a SOC, without real systems.`,
    yourJob: `Pick the investigation order you'd actually run **if you opened them one-by-one**.`,
    doThisNow: `Move rows with ↑ ↓ (or Top / Bottom on a phone). Line 1 = first investigation. Tap **Score my triage queue** when ready.`,
    howScoringWorks: `Alignment score runs 0–100 (higher = closer to calibrated priority). Passing needs **≥ ${bar}** on this difficulty. ${noiseLevel >= 0.55 ? `Extra noise (${Math.round(noiseLevel * 100)}%) is intentional — skim log lines, don't chase P-labels blindly.` : `Take your time identifying which lines are hygiene vs escalation.`}`,
    whyOrderMatters: `SOC and Security+ PBQs punish “busy work first”: if you elevate noise over identity loss or staging, you stall the real breach.`,
    afterFail: `Read the coaching panel → reorder → **Rescore queue**. Hint: elevate **critical business assets**, **credential / exfil cues**, then routine noise.`,
    securityPlusConnection: `Reinforces SY0-701 **Domain ${dom}** incident analysis patterns: triage, scope, and “first best” decisions under noise.`,
    examStrip: {
      objective: `Domain ${dom} — IR & analysis: interpret alerts, prioritize response, limit business impact.`,
      examWording: `Stems often read **“Which should be addressed first?”** or **“Best next step”** — same mental stack as this queue.`,
      trap: `Answer choices that look scary because of **P1/P2** labels but ignore blast radius / asset tier.`,
      keyword: "**Triage · asset criticality · containment**",
    },
  };
}

function computeUrgency(a: Omit<SyntheticAlert, "id" | "truePriorityRank">): number {
  const benignTax = a.benign ? 820 : 0;
  const sev = a.severityRank * 46;
  return CRIT_WEIGHT[a.assetCriticality] + sev + benignTax;
}

/** Build deterministic alert corpus with mixed fidelity + noise ramp by difficulty */
export function generateAlertTriageLabInstance(opts: AlertTriageGenOpts): LabInstance {
  const rand = mulberry32(opts.seed);
  const tmpl = SOC_ALERT_TRIAGE_TEMPLATE;
  const noiseLevel = Math.min(1, 0.35 + opts.difficulty * 0.1 + rand() * 0.2);

  let nAlerts = Math.min(6, Math.max(4, 3 + (opts.difficulty % 3) + (rand() > 0.5 ? 1 : 0)));
  /** Beginner tiers: fewer rows = faster clarity */
  if (opts.difficulty <= 2) nAlerts = Math.min(nAlerts, 4);
  else if (opts.difficulty <= 4) nAlerts = Math.min(nAlerts, 5);

  const poolOff = opts.seed % Math.max(7, 1);

  const ben = benignLogFragments(rand);
  const amb = ambiguousLogFragments(rand);
  const hos = hostileLogFragments(rand);

  const alertsDraft: Omit<SyntheticAlert, "id" | "truePriorityRank">[] = [];
  let slot = 0;

  /** Pattern: at least two pure benign, two ambiguous/straddle, remainder hostile-heavy */
  const benignCount = Math.max(2, Math.floor(nAlerts * 0.28));
  const ambCount = Math.max(2, Math.floor(nAlerts * 0.32));
  const hostileSlots = Math.max(1, nAlerts - benignCount - ambCount);

  const critChoices: SyntheticAlert["assetCriticality"][] = ["critical", "high", "medium", "low"];

  function nextSeverity(rankBias: number) {
    const r = Math.max(1, Math.min(4, Math.floor(rankBias + rand())));
    const labels = ["P1", "P2", "P3", "P4"] as const;
    return { label: labels[r - 1]!, rank: r };
  }

  const host = (): string =>
    rand() > 0.5 ? `${pickPool(POOL_APP_NAMES, rand)}-${pickPool(POOL_REGIONS, rand)}` : `edge-${POOL_REGIONS[Math.floor(rand() * POOL_REGIONS.length)]!}`;

  for (let i = 0; i < benignCount; i++) {
    const [title, tail] = ben[(i + poolOff) % ben.length]!;
    const cr = critChoices[(i + opts.difficulty) % critChoices.length]!;
    const sev = nextSeverity(noiseLevel > 0.55 ? 1 : i % 4); // benign noise can still show flashy P labels
    alertsDraft.push({
      title: `[${sev.label}] ${title}`,
      severityLabel: sev.label,
      severityRank: sev.rank,
      assetCriticality: cr,
      host: host(),
      source: rand() > 0.45 ? "EDR" : "SIEM_PIPELINE",
      benign: true,
      logLine: `[${sev.label}] ${title} • ${tail}`,
    });
    slot++;
  }

  for (let i = 0; i < ambCount; i++) {
    const [title, tail] = amb[(i + slot + poolOff) % amb.length]!;
    const cr = critChoices[(i + slot) % critChoices.length]!;
    const sev = nextSeverity(2 + (i % 2));
    alertsDraft.push({
      title: `[${sev.label}] ${title}`,
      severityLabel: sev.label,
      severityRank: sev.rank,
      assetCriticality: cr,
      host: host(),
      source: rand() > 0.55 ? "IDP_CLOUD" : "NET_FLOW",
      benign: rand() > 0.82,
      logLine: `[${sev.label}] ${title} • ${tail}`,
    });
    slot++;
  }

  for (let i = 0; i < hostileSlots; i++) {
    const [title, tail] = hos[(i + opts.difficulty + slot + poolOff) % hos.length]!;
    const cr: SyntheticAlert["assetCriticality"] = i === 0 ? "critical" : critChoices[(i + 3) % critChoices.length]!;
    const sev = nextSeverity(i === 0 ? 1 : 2);
    alertsDraft.push({
      title: `[${sev.label}] ${title}`,
      severityLabel: sev.label,
      severityRank: sev.rank,
      assetCriticality: cr,
      host: host(),
      source: "MULTI_FEED_CORRELATOR",
      benign: false,
      logLine: `[CORR] ${title} • ${tail}`,
    });
    slot++;
  }

  while (alertsDraft.length < nAlerts) {
    const [title, tail] = amb[slot % amb.length]!;
    alertsDraft.push({
      title: `[P3] ${title}`,
      severityLabel: "P3",
      severityRank: 3,
      assetCriticality: "medium",
      host: host(),
      source: "SIEM",
      benign: true,
      logLine: `${title} • ${tail}`,
    });
    slot++;
  }

  const trimmed = alertsDraft.slice(0, nAlerts);

  const withScores = trimmed.map((a, i) => {
    const urgency = computeUrgency(a) + jitterFromId(opts.seed, `row-${i}`);
    return { ...a, urgency };
  });

  withScores.sort((x, y) => x.urgency - y.urgency);

  const alerts: SyntheticAlert[] = withScores.map((a, rank) => {
    const id = `alt-${fingerprintHash([opts.lessonId, opts.seed, a.title, String(rank)]).slice(0, 10)}`;
    const { urgency: _u, ...rest } = a;
    return { ...rest, id, truePriorityRank: rank };
  });

  const canonicalPriorityIds = [...alerts].sort((a, b) => a.truePriorityRank - b.truePriorityRank).map((a) => a.id);

  const learnerGuide = buildAlertTriageLearnerGuide(opts, noiseLevel);

  const content: AlertTriageGeneratedContent = {
    engine: "ALERT_TRIAGE",
    scenarioTitle: `Synthetic queue — ${tmpl.id.replace(/_/g, " ").toLowerCase()}`,
    briefing: tmpl.scenarioStructure.join(" → "),
    noiseLevel,
    alerts,
    canonicalPriorityIds,
    wrongBranchHints: [...tmpl.wrongPaths.map((w) => `${w.label}: ${w.symptom}`)],
    recoveryBullets: [...tmpl.recoveryPaths],
    learnerGuide,
  };

  const rubric: LabRubricCriterion[] = tmpl.decisionPoints.map((d) => ({
    id: d.id,
    label: `${d.prompt} (${d.rationaleKeys.join(", ")})`,
    weight: 1 / (tmpl.decisionPoints.length || 1),
  }));

  const templateErrors = evaluateTemplateStructuralRules("SOC_ALERT_TRIAGE_TEMPLATE", { alertCount: alerts.length });
  const structuralErrors = validateSyntheticAlertConsistency(alerts, canonicalPriorityIds);

  const instanceId = `soc-${fingerprintHash([opts.lessonId, opts.seed, "SOC_ALERT_TRIAGE"]).slice(0, 14)}`;

  const inst: LabInstance = {
    instanceId,
    templateId: "SOC_ALERT_TRIAGE_TEMPLATE",
    seed: opts.seed,
    difficulty: opts.difficulty,
    lessonId: opts.lessonId,
    parameters: { noiseFloor: noiseLevel },
    generatedContent: content,
    expectedOutcome:
      "Highest-risk identity / data-impact signals bubble above noisy benign automation, respecting asset criticality and log semantics.",
    rubric,
    dedupHash: fingerprintHash([instanceId, content.canonicalPriorityIds.join("."), tmpl.id]),
  };

  /** Non-fatal bookkeeping — surfaced by validate script only */
  if (templateErrors.length || structuralErrors.length) {
    (inst as { _generationWarnings?: string[] })._generationWarnings = [
      ...templateErrors.map((e) => e.message),
      ...structuralErrors.map((e) => e.message),
    ];
  }

  return inst;
}

export function deriveLessonSeed(lessonId: string, salt = "elite-v1"): number {
  return strToSeed(`${salt}::${lessonId}`);
}

export function pickDifficultyFromLesson(lessonId: string): EliteLabDifficulty {
  const base = deriveLessonSeed(`${lessonId}::difficulty`);
  return ((base % 5) + 1) as EliteLabDifficulty;
}

/** Bridge factory output into legacy `TrainingLab` shell consumed by routing + dashboards */
export function labInstanceToTrainingLab(instance: LabInstance): TrainingLab {
  const tmpl = ELITE_TEMPLATES[instance.templateId];
  if (instance.generatedContent.engine === "ALERT_TRIAGE") {
    const g = instance.generatedContent;
    const lg = g.learnerGuide;
    const cpLabels = [
      "I prioritized using asset impact + compromise cues — not Sev-1 hype alone.",
      "I mentally tagged what needs escalation versus what can route to a ticket/monitor workflow.",
    ];
    return {
      id: `elite-${instance.instanceId}`,
      lessonId: instance.lessonId,
      category: "SECURITY_ANALYSIS",
      difficulty: instance.difficulty as TrainingLab["difficulty"],
      estimatedTimeMin: 12 + Math.min(10, tmpl.decisionPoints.length * 3),
      toolsRequired: ["SIEM mindset", "Read-only queues"],
      objective: `Elite alert triage — ${lessons[instance.lessonId]?.title ?? instance.lessonId}`,
      realWorldContext: lg.whatHappened,
      environmentType: "ELITE_ALERT_TRIAGE",
      stepByStep: [
        lg.doThisNow.replace(/\*\*/g, ""),
        lg.howScoringWorks.replace(/\*\*/g, "").split(". ")[0] + ".",
        lg.whyOrderMatters.replace(/\*\*/g, "").slice(0, 180),
      ],
      checkpoints: tmpl.decisionPoints.map((d, i) => ({
        id: d.id,
        label: cpLabels[i] ?? d.prompt.slice(0, 120),
        hint: tmpl.wrongPaths[i]?.recoveryBullets[0],
      })),
      expectedResult: `${lg.securityPlusConnection} · ${instance.expectedOutcome}`,
      failureModes: [...tmpl.wrongPaths.map((w) => w.label)],
      hints: [...tmpl.recoveryPaths].slice(0, 2),
      recoverySteps: [...tmpl.recoveryPaths],
      examConnection: lg.examStrip.objective,
      memoryHook: lg.examStrip.keyword,
      eliteInstance: instance,
    };
  }
  /** Stubs reuse SECURITY_ANALYSIS with narrative-only UI */
  if (instance.generatedContent.engine === "INCIDENT_STUB") {
    const g = instance.generatedContent;
    return {
      id: `elite-${instance.instanceId}`,
      lessonId: instance.lessonId,
      category: "DECISION",
      difficulty: instance.difficulty,
      estimatedTimeMin: 10,
      toolsRequired: ["IR checklist"],
      objective: g.scenarioTitle,
      realWorldContext: tmpl.scenarioStructure[0] ?? "",
      environmentType: "ELITE_STUB",
      stepByStep: g.phases.map((p) => `${p.name}: ${p.detail}`),
      checkpoints: g.checkpoints.map((c, i) => ({ id: `ck-${i}`, label: c })),
      expectedResult: instance.expectedOutcome,
      failureModes: [...tmpl.wrongPaths.map((w) => w.symptom)],
      hints: [...tmpl.recoveryPaths],
      recoverySteps: [...tmpl.recoveryPaths],
      examConnection: "Declare → contain → eradicate → lessons learned cadence.",
      memoryHook: "Contain without burning evidence.",
      eliteInstance: instance,
    };
  }

  if (instance.generatedContent.engine === "IAM_STUB") {
    const g = instance.generatedContent;
    return {
      id: `elite-${instance.instanceId}`,
      lessonId: instance.lessonId,
      category: "SECURITY_ANALYSIS",
      difficulty: instance.difficulty,
      estimatedTimeMin: 8,
      toolsRequired: ["Policy diff mindset"],
      objective: g.scenarioTitle,
      realWorldContext: tmpl.scenarioStructure[1] ?? "",
      environmentType: "ELITE_STUB",
      stepByStep: [...g.issueHints],
      checkpoints: tmpl.decisionPoints.map((d, i) => ({
        id: `${d.id}-${i}`,
        label: d.prompt,
      })),
      expectedResult: instance.expectedOutcome,
      failureModes: [...tmpl.wrongPaths.map((w) => w.label)],
      hints: [...tmpl.recoveryPaths],
      recoverySteps: [...tmpl.recoveryPaths],
      examConnection: "Least privilege beats speed.",
      memoryHook: "Deny-first simulation.",
      eliteInstance: instance,
    };
  }

  throw new Error("labInstanceToTrainingLab: unsupported payload");
}

/** Future engines — stub payloads keep template validators + AI mentor metadata warm */
export function generateIncidentStubInstance(lessonId: string): LabInstance {
  const seed = deriveLessonSeed(`${lessonId}::ir-stub`);
  const tmpl = ELITE_TEMPLATES.INCIDENT_RESPONSE_TEMPLATE;
  const content: IncidentStubContent = {
    engine: "INCIDENT_STUB",
    scenarioTitle: `Declared incident staging — tabletop ${lessonId}`,
    briefing: tmpl.scenarioStructure.join(" · "),
    phases: [
      { name: "Detect / scope", detail: "Classify tier + stakeholder map." },
      { name: "Contain", detail: "Stop bleeding WITH chain-of-custody." },
      { name: "Recover + communicate", detail: `Communication cadence + legal hold flag — seed ${seed % 997}.` },
    ].filter(Boolean),
    checkpoints: ["Tier chosen", "Containment avoids evidence loss", "Comms drafted"],
  };

  const inst: LabInstance = {
    instanceId: fingerprintHash(["IR", lessonId]).slice(0, 14),
    templateId: "INCIDENT_RESPONSE_TEMPLATE",
    seed,
    difficulty: pickDifficultyFromLesson(lessonId + "-ir"),
    lessonId,
    parameters: {},
    generatedContent: content,
    expectedOutcome: "You can narrate phased IR without skipping legal/comms checkpoints.",
    rubric: tmpl.decisionPoints.map((d, i) => ({
      id: `${d.id}-${i}`,
      label: d.prompt,
      weight: 1,
    })),
    dedupHash: fingerprintHash([lessonId, "INCIDENT_RESPONSE_TEMPLATE"]),
  };
  return inst;
}

export function generateIamMisconfigStubInstance(lessonId: string): LabInstance {
  const seed = deriveLessonSeed(`${lessonId}::iam-stub`);
  const tmpl = ELITE_TEMPLATES.IAM_MISCONFIG_TEMPLATE;
  const snippet = `
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": ["s3:*","kms:Decrypt"],
    "Resource": "*"
  }]
}`.trim();
  const content: IAMStubContent = {
    engine: "IAM_STUB",
    scenarioTitle: "Over-broad federation policy on shared bucket tier",
    briefing: tmpl.scenarioStructure[0],
    policySnippet: snippet,
    issueHints: [
      `"Principal": "*" on cross-account bucket ${pickPool(POOL_APP_NAMES, mulberry32(seed))}.`,
      "Actions include destructive s3 deletes + KMS decrypt spanning tenant keys.",
    ],
    checkpoints: ["List excess actions", "Propose ARN-scoped DENY-first policy", "Explain blast radius verbally"],
  };
  const inst: LabInstance = {
    instanceId: fingerprintHash(["IAM", lessonId]).slice(0, 14),
    templateId: "IAM_MISCONFIG_TEMPLATE",
    seed,
    difficulty: pickDifficultyFromLesson(lessonId + "-iam"),
    lessonId,
    parameters: {},
    generatedContent: content,
    expectedOutcome: "Tight scope + conditional keys reduce lateral movement surface.",
    rubric: tmpl.decisionPoints.map((d, i) => ({
      id: `${d.id}-${i}`,
      label: d.prompt,
      weight: 1,
    })),
    dedupHash: fingerprintHash([lessonId, "IAM_MISCONFIG_TEMPLATE", snippet.slice(5, 20)]),
  };
  return inst;
}
