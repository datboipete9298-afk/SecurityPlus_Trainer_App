# Elite Lab Factory Audit

## Stack

Templates → `generateAlertTriageLabInstance` + seed → **`labConstraintSolver`** structural checks → `labInstanceToTrainingLab`.

Scoring:** `scoreTriageOrder` in **`labScorer.ts`** — **do not casually change pairwise math** — audit only.

Coach upgrade path:

- **Domain mentor hooks** (`domainMentorHooks.ts`) — keyed by lesson domain strings `1–5`.
- **`buildPostScoreTriageDebrief`** — post-submit only narrative + pairwise inversion lines (≤3).

AI guard:** `eliteLabMentor` payload + **`ELITE_SOC_LAB_GUARD`** in server prompts forbids authoritative queue leakage.

Validation:** `scripts/validate-elite-labs.ts` — templates, deterministic hash, converters, learner guide copy, **`buildPostScoreTriageDebrief` smoke**.

Mobile:** LabRunner reorder buttons (Up/Down/Top/Bottom) — touch-target classes present — verify thumbs on smallest devices.

Portfolio:** `eliteLabPortfolio` keyed composite — Progress page exposes recent rows — **export JSON includes metadata**, not regenerated lab instances binaries.

Recommended manual tests: fail → pairwise lines appear; pass → loop items; airplane mode tutor → still reads rubric-ish content via static learner guide fallback.

---
