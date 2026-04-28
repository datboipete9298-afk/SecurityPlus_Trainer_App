# FINAL_HIGH_IMPACT_FIXES — Prioritized Backlog vs Implemented (Phase 9)

Only items that **materially** improve clarity, trust, reliability, or learning ergonomics — **cosmetics omitted.**

---

## IMPLEMENTED THIS SESSION

### 1. Tutor message region accessibility

| Field | Detail |
|------|--------|
| **Issue** | Screen reader users lack `aria-busy` / contiguous `aria-live` around loading + streamed assistant text. |
| **Why it matters** | Matches “trustworthy AI” requirement for assistive tech; reduces “silent failure” perception. |
| **Files** | `src/components/AITutorPanel.tsx` |
| **Fix** | Add `role="region"`, `aria-label`, `aria-live="polite"`, `aria-relevant="additions"` on tutor transcript; `role="status"` on “Thinking…”. (`aria-busy` omitted — strict Edge a11y lint rejects boolean expression.) |
| **Expected impact** | A11y +5–8 pts within category; no product score inflation claim. |

### 2. Lesson quiz — refresh clarity

| Field | Detail |
|------|--------|
| **Issue** | Refresh mid-quiz resets in-run position; users think progress “vanished.” |
| **Why it matters** | Direct trust/psychology hit; aligns with EDGE_CASE report. |
| **Files** | `src/pages/QuizPage.tsx` |
| **Fix** | One unobtrusive sentence for lesson (`!isMesser`) quizzes. |
| **Expected impact** | Trust + UX clarity +3–5 pts in “reliability understanding.” |

---

## DEFERRED (High value, larger than Phase 9 “safe fixes”)

1. **Single-tab advisory** on Progress export card — avoids multi-device corruption fear (copy-only; still high impact).

2. **Dashboard primary CTA experiment** — e.g. emphasize only `Resume` + one secondary for first 7 days — **product decision**, not a microcopy patch.

3. **`recordQuiz` idempotency / session key** for lesson quiz refresh — **touches scoring** — excluded by rules.

4. **Service worker / offline shell** — major scope.

5. **Re-check AI health on `visibilitychange`** — small code, good follow-up.

---

*End Phase 8 document – merged with implementation list.*
