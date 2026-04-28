import type { SyntheticAlert } from "./labInstance";
import type { EliteLabTemplate } from "./labTemplates";
import { ELITE_TEMPLATES } from "./labTemplates";

/**
 * Structural checks across generated instances — complements template.validation rules from labTemplates.ts
 */
export type ConstraintViolation = {
  code: string;
  message: string;
};

/** Ensure uniqueness of canonical priority list and coherence with emitted alerts */
export function validateSyntheticAlertConsistency(alerts: readonly SyntheticAlert[], canonicalPriorityIds: string[]): ConstraintViolation[] {
  const errs: ConstraintViolation[] = [];
  const ids = new Set(alerts.map((a) => a.id));
  if (ids.size !== alerts.length) {
    errs.push({ code: "DUP_IDS", message: "Alert ids must be unique." });
  }
  if (canonicalPriorityIds.length !== ids.size) {
    errs.push({ code: "CANON_LEN", message: "Canonical priority length must match alert count." });
  }
  const seen = new Set<string>();
  for (const cid of canonicalPriorityIds) {
    if (!ids.has(cid)) {
      errs.push({ code: "UNKNOWN_ID", message: `Canonical references unknown alert id ${cid}` });
    }
    if (seen.has(cid)) {
      errs.push({ code: "DUP_PRIO", message: `Duplicate id ${cid} in canonical order.` });
    }
    seen.add(cid);
  }

  /** True priority ranks should be injective for deterministic scoring */
  const ranks = alerts.map((a) => a.truePriorityRank).sort((a, b) => a - b);
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] === ranks[i - 1]) {
      errs.push({ code: "TIE_PRIO", message: "truePriorityRank collisions break strict ordering." });
      break;
    }
  }

  return errs;
}

export function evaluateTemplateStructuralRules(templateId: keyof typeof ELITE_TEMPLATES, detail: { alertCount?: number }): ConstraintViolation[] {
  const t: EliteLabTemplate = ELITE_TEMPLATES[templateId];
  const out: ConstraintViolation[] = [];
  if (!t) out.push({ code: "BAD_TEMPLATE", message: `Unknown template ${templateId}` });

  if (templateId === "SOC_ALERT_TRIAGE_TEMPLATE") {
    const n = detail.alertCount ?? 0;
    if (n < 4) {
      out.push({ code: "MIN_ALERTS", message: "SOC triage labs need at least 4 alerts." });
    }
  }
  return out;
}
