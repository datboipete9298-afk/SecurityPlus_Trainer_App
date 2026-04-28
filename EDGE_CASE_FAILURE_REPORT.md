# Edge Cases + Failure Testing Report

Synthetic tests run: **validators + prod build**.

| Scenario | Expected / observed |
|----------|---------------------|
| Unknown route `/foo` | Redirect `/` (**silent**) — usability debt |
| `/pbq` old path | Redirect `/practice-exams/pbq` ✅ |
| Empty PDF guides | Guards + setup CTAs chain |
| No AI configured | Fallback + connectivity states |
| No network POST AI | Fallback copy |
| Corrupt import JSON | importProgress returns `{ok:false}` — verify modal |
| Reload mid-quiz | React state resets — misses not lost if persisted per question interactions — **needs manual QA** session |
| Duplicate tabs | reconcile IDB/listeners — plausible race flicker |

Manual-only recommended:

- Offline airplane mode lesson video → external open path.
- iOS Safari private window PDF save → block banner.
- Long session memory leak suspicion on heavy lesson page — profiler.

---
