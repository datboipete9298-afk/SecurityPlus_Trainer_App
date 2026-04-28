# AI REALITY REPORT (4 Conditions)

**Evidence:** `src/lib/aiClient.ts`, `AITutorPanel.tsx`, `aiTutorFallback.ts` (referenced from panel).

---

## 1. Fully working API (`VITE_AI_API_BASE` + health ok + `hasKey`)

- **Behavior:** `aiConn` → `live`; structured JSON enforced via `enforceStructuredAiResponse`.
- **Trust:** Subcopy says answers can still fall back — **honest**.
- **Hanging states:** `loading` + timeout on `postAi` (18s) — **controlled**.

---

## 2. Slow API

- **Behavior:** User sees “Thinking…” until response or timeout → timeout path gets **explicit** timeout message + offline structure.
- **Trust:** High — no infinite spinner without text (unless bug; panel uses `finally { setLoading(false) }`).

---

## 3. Broken API (5xx / malformed / key issues)

- **Behavior:** catch → “Request didn’t finish” + coach fallback (not empty).
- Weak response detection downgrades to fallback when model output looks wrong.
- **Trust:** User may not know *why* backend failed — acceptable for local coaching product if copy stays non-technical.

---

## 4. No API configured (`VITE_AI_API_BASE` empty)

- **Behavior:** `offline` immediately; quick actions still run `postAi` — **will throw** → catch → same structured fallback. Actually: `apiBase()` is `""` → `postAi` URLs become relative `"/api/ai/..."` → may 404 in pure static deploy **unless** proxied. **Critical real-world note:** without dev server proxy / base URL, tutor taps may always error into fallback quickly. That’s **consistent** but can feel “broken API” if latency is low and error copy repeats.

**Recommendation (ops):** Document that static hosting must proxy `/api` or set base to hosted API — not a code change in this phase.

---

## “Never broken / vague / inconsistent” — judgment

| Critique | Holds? |
|---------|--------|
| Broken | **Mostly no** — fallback always returns structure. |
| Vague | Occasionally — generic catch message is broad but paired with coach bullets. |
| Inconsistent | **Low** — same `pushAssistant` shape for success and fallback paths. |

---

## Gaps

- **No retry button** on transient failure (user must re-tap shortcut or resend).
- **Connection re-check** runs once on mount — tab refocus after laptop sleep doesn’t re-probe (minor).

---

*End Phase 4.*
