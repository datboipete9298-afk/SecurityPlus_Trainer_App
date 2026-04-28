/**
 * Canonical serialized lab instance produced by generators — immutable result of (template × seed × params).
 */

export type EliteLabDifficulty = 1 | 2 | 3 | 4 | 5;

export type EliteTemplateId =
  | "SOC_ALERT_TRIAGE_TEMPLATE"
  | "INCIDENT_RESPONSE_TEMPLATE"
  | "IAM_MISCONFIG_TEMPLATE";

export type LabRubricCriterion = {
  id: string;
  label: string;
  weight: number;
};

/** One row in a synthetic SOC queue */
export type SyntheticAlert = {
  id: string;
  title: string;
  /** SIEM-style e.g. P1–P4 */
  severityLabel: string;
  /** Display only — user reasons about priority vs asset */
  severityRank: number;
  assetCriticality: "critical" | "high" | "medium" | "low";
  host: string;
  source: string;
  benign: boolean;
  /** Synthetic log line token */
  logLine: string;
  /** Hidden from UI — lower = investigate first */
  truePriorityRank: number;
};

/** Human-facing copy — never includes canonical answer order */
export type AlertTriageExamStrip = {
  /** Short SY0-701 objective framing */
  objective: string;
  /** How stems tend to be worded */
  examWording: string;
  /** Common distractor pattern */
  trap: string;
  keyword: string;
};

export type AlertTriageLearnerGuide = {
  whatHappened: string;
  yourJob: string;
  /** Single primary CTA sentence */
  doThisNow: string;
  howScoringWorks: string;
  whyOrderMatters: string;
  afterFail: string;
  /** One line tying lab to cert prep */
  securityPlusConnection: string;
  examStrip: AlertTriageExamStrip;
};

export type AlertTriageGeneratedContent = {
  engine: "ALERT_TRIAGE";
  scenarioTitle: string;
  briefing: string;
  noiseLevel: number;
  alerts: SyntheticAlert[];
  /** Alert ids sorted best-first (investigation order) */
  canonicalPriorityIds: string[];
  wrongBranchHints: string[];
  recoveryBullets: string[];
  learnerGuide: AlertTriageLearnerGuide;
};

export type IncidentStubContent = {
  engine: "INCIDENT_STUB";
  scenarioTitle: string;
  briefing: string;
  phases: { name: string; detail: string }[];
  checkpoints: string[];
};

export type IAMStubContent = {
  engine: "IAM_STUB";
  scenarioTitle: string;
  briefing: string;
  policySnippet: string;
  issueHints: string[];
  checkpoints: string[];
};

export type GeneratedLabContent =
  | AlertTriageGeneratedContent
  | IncidentStubContent
  | IAMStubContent;

export interface LabInstance {
  instanceId: string;
  templateId: EliteTemplateId;
  seed: number;
  difficulty: EliteLabDifficulty;
  lessonId: string;
  parameters: Record<string, string | number | boolean>;
  generatedContent: GeneratedLabContent;
  expectedOutcome: string;
  rubric: LabRubricCriterion[];
  dedupHash: string;
}
