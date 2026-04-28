# Privacy & Trust Master Audit

## Data residency

| Data | Leaves device? |
|------|----------------|
| Quiz/progress JSON | ❌ stays local unless user exports |
| PDF binaries | ❌ IndexedDB local — **no upload** in BYO PDF path |
| AI chat | ✅ text sent to model when API configured — prompts include lesson/q context |
| Telemetry | ❌ assumed none — **verify** analytics snippet absent |

## Backup honesty

Explicit warnings: Progress export excludes PDF blobs — ✅ user trust-critical.

---

## Friend / shared-device use

Risk: shared browser profile leakage — mitigation: OS profile separation (document in FAQ future).

Exam integrity:** AI locked during timed exam posture — ✅ fair signaling.

Disclaimer:** Readiness disclaimers scattered — consolidate for trust.

---
