import type { DomainId } from "../types";

/** Domain-aligned coaching snippets for Elite SOC labs — keyed to lesson.domain */
export type DomainMentorHook = {
  domain: DomainId;
  /** Short syllabus label */
  label: string;
  decisionPrinciple: string;
  examTrap: string;
  prioritize: string;
  doNotOvervalue: string;
  /** Comma-friendly list */
  keywords: string;
};

export const DOMAIN_MENTOR_HOOKS: Record<DomainId, DomainMentorHook> = {
  "1": {
    domain: "1",
    label: "General Security Concepts",
    decisionPrinciple: "Treat security decisions as tradeoffs among confidentiality, integrity, availability, and residual risk tied to stakeholders.",
    examTrap: "Stems disguise “everything sounds right” controls — elimination comes from picking what best matches the stem’s PRIMARY risk scenario.",
    prioritize: "Map each alert’s story to confidentiality / integrity / availability impact before choosing an action verb on the exam.",
    doNotOvervalue: "Buzzword controls (encryption, redundancy) without aligning to the attacker path or stated business outage.",
    keywords: "CIA, residual risk, control types, Threat vs vulnerability vs risk",
  },
  "2": {
    domain: "2",
    label: "Threats, Vulnerabilities & Mitigations",
    decisionPrinciple: "Separate what the hostile actor DID (technique/TTP) from what the CONTROL family actually reduces (prevent/detect/respond).",
    examTrap: "Pick-the-tool distractors mix audit logging with remediation — Prevention vs Detection verbs matter.",
    prioritize: "When triaging telemetry, elevate signals that correlate to plausible compromise mechanics or blast-radius expansion.",
    doNotOvervalue: "Bright red severity labels tied to benign automation or patching noise without corroborating host or identity pivots.",
    keywords: "TTPs, IOC, CVSS relevance, patching vs compensating control",
  },
  "3": {
    domain: "3",
    label: "Security Architecture & Engineering",
    decisionPrinciple: "Ask which trust boundary broke and what evidence proves scope before prescribing architecture moves.",
    examTrap: "Beautiful architecture answers that ignore containment order or forensic preservation on the exam PBQs.",
    prioritize: "Chase asset tier + segmentation impact first when logs smell like lateral staging or misuse of federated identities.",
    doNotOvervalue: "Designer controls (zero trust jargon) chosen before proving material impact / evidence chain.",
    keywords: "Segmentation, least privilege, trust boundary, secure design baseline",
  },
  "4": {
    domain: "4",
    label: "Security Operations & Monitoring",
    decisionPrinciple: "Prioritize fidelity of compromise + business criticality × evidence before noise—SIEM queues are graded on analyst judgment.",
    examTrap: "\"FIRST response\" prompts that lure you toward the loudest P1 label while quieter rows hit crown-jewel assets harder.",
    prioritize: "Evidence strength, severity in context of asset class, escalation paths, containment that preserves forensic value.",
    doNotOvervalue: "Repeated benign automation hits or patch windows before identity or data-exfil correlations.",
    keywords: "SIEM, IOC triage, containment, escalation, log fidelity",
  },
  "5": {
    domain: "5",
    label: "Identity, Access & IR governance",
    decisionPrinciple: "Identity anomalies outrank generic host noise when federation, privilege, or MFA bypass patterns appear.",
    examTrap: "Role definition vs enforcement — answers that confuse policy drafts with detective controls.",
    prioritize: "Impossible travel, lateral privilege adds, federation trust breaks, IAM keys and token replay wording.",
    doNotOvervalue: "Stale device compliance alerts unrelated to lateral movement timelines.",
    keywords: "MFA bypass, federation, entitlement drift, SOC escalation",
  },
};

export function getDomainMentorHook(domain: DomainId | string | undefined): DomainMentorHook {
  const d = domain === "1" || domain === "2" || domain === "3" || domain === "4" || domain === "5" ? domain : "1";
  return DOMAIN_MENTOR_HOOKS[d];
}
