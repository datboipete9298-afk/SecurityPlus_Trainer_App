/**
 * Declarative template registry — drives generator structure, checkpoints, branches, validation hooks.
 */

import type { EliteTemplateId } from "./labInstance";

export type WrongPathBranch = {
  id: string;
  label: string;
  symptom: string;
  recoveryBullets: string[];
};

export type DecisionPointDesc = {
  id: string;
  prompt: string;
  rationaleKeys: readonly string[];
};

export type ScenarioValidationRule = {
  id: string;
  description: string;
};

/** High-level playbook for each SOC / IR template */
export type EliteLabTemplate = {
  id: EliteTemplateId;
  scenarioStructure: readonly string[];
  decisionPoints: readonly DecisionPointDesc[];
  wrongPaths: readonly WrongPathBranch[];
  recoveryPaths: readonly string[];
  validation: readonly ScenarioValidationRule[];
};

const TRIAGE_WRONG: readonly WrongPathBranch[] = [
  {
    id: "priority_by_severity_only",
    label: "Sort by reported severity only",
    symptom: "Critical business assets may be deprioritized when noise is P1.",
    recoveryBullets: [
      "Rescore with asset criticality × threat confidence.",
      "Escalate impossible travel + mass auth failures before routine patch noise.",
    ],
  },
  {
    id: "ignore_benign_cluster",
    label: "Dismiss all low-severity before reading context",
    symptom: "Benign noise can mask staging on low-severity channels.",
    recoveryBullets: ["Re-read log semantics; correlate user + host + time window."],
  },
];

const TRIAGE_DECISIONS: readonly DecisionPointDesc[] = [
  {
    id: "queue_order",
    prompt: "Order the investigation queue from most urgent to least.",
    rationaleKeys: ["asset_criticality", "blast_radius", "signal_confidence", "business_hours"],
  },
  {
    id: "escalation",
    prompt: "Identify which items warrant immediate escalation vs monitor.",
    rationaleKeys: ["data_exfil_indicators", "identity_compromise", "availability_impact"],
  },
];

export const SOC_ALERT_TRIAGE_TEMPLATE: EliteLabTemplate = {
  id: "SOC_ALERT_TRIAGE_TEMPLATE",
  scenarioStructure: [
    "Synthetic alert batch lands in shared queue",
    "Noise mixes with high-signal benign + malicious patterns",
    "Participant must prioritize using severity, asset value, and log semantics",
    "Outcome validates ordering rubric versus canonical queue",
  ],
  decisionPoints: TRIAGE_DECISIONS,
  wrongPaths: TRIAGE_WRONG,
  recoveryPaths: [
    "Revert full queue and re-score using rubric checklist.",
    "Cross-check top 3 alerts against asset inventory criticality tier.",
    "Annotate benign vs escalation candidates before final submit.",
  ],
  validation: [
    {
      id: "has_alerts",
      description: "Generator must emit ≥4 alerts incl. mixed benign/hostile ratios.",
    },
    {
      id: "canonical_unique",
      description: "Priority order must be a strict total order (solver).",
    },
  ],
};

const IR_WRONG: readonly WrongPathBranch[] = [
  {
    id: "contain_before_scope",
    label: "Isolate endpoints before scoping blast radius",
    symptom: "Blind containment can destroy evidence on shared infrastructure.",
    recoveryBullets: ["Snapshot volatile memory policy", "Establish chain-of-custody on shared storage"],
  },
  {
    id: "skip_comms",
    label: "Suppress stakeholder updates until remediation done",
    symptom: "Regulatory timers and exec trust degrade without cadence.",
    recoveryBullets: ["Use severity-based comm template", "Document factual status only"],
  },
];

export const INCIDENT_RESPONSE_TEMPLATE: EliteLabTemplate = {
  id: "INCIDENT_RESPONSE_TEMPLATE",
  scenarioStructure: [
    "Declared incident anchor + classification",
    "Containment ↔ evidence preservation fork",
    "Recovery + lessons learned scaffold",
  ],
  decisionPoints: [
    {
      id: "severity_class",
      prompt: "Classify incident tier and stakeholder map",
      rationaleKeys: ["data_types", "user_count", "regulatory_clock"],
    },
  ],
  wrongPaths: IR_WRONG,
  recoveryPaths: [
    "Revert to containment checklist with legal hold flag.",
    "Re-open comms template draft for CIO + legal reviewers.",
  ],
  validation: [
    { id: "phases_present", description: "Incident stub must expose ≥3 labeled phases." },
  ],
};

const IAM_WRONG: readonly WrongPathBranch[] = [
  {
    id: "wildcards_everywhere",
    label: "Grant '*' on resource ARN for expedience",
    symptom: "Lateral blast if role assumed from lower trust zone.",
    recoveryBullets: ["Scope ARN prefix", "Add IP / VPC condition keys"],
  },
];

export const IAM_MISCONFIG_TEMPLATE: EliteLabTemplate = {
  id: "IAM_MISCONFIG_TEMPLATE",
  scenarioStructure: [
    "Policy document excerpt with ambiguity",
    "Trust boundary traversal implied by trust policy",
    "Least-privilege restoration path",
  ],
  decisionPoints: [
    {
      id: "least_priv_review",
      prompt: "List concrete excess permissions and replacement actions",
      rationaleKeys: ["actions", "resources", "conditions"],
    },
  ],
  wrongPaths: IAM_WRONG,
  recoveryPaths: ["Export policy diff", "Run simulation deny test on changed statement"],
  validation: [
    { id: "policy_snippet", description: "Stub must include non-empty policy text block." },
  ],
};

export const ELITE_TEMPLATES: Record<EliteTemplateId, EliteLabTemplate> = {
  SOC_ALERT_TRIAGE_TEMPLATE,
  INCIDENT_RESPONSE_TEMPLATE,
  IAM_MISCONFIG_TEMPLATE,
};
