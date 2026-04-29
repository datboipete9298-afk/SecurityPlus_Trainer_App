# AI / Backend Chaos Test Plan

**Goal:** prove the tutor stays useful, calm, and **never blank** under every realistic backend failure.

**Scope:** the AI tutor + the (planned-only) cloud sync stub. Quiz / lab / lesson scoring is fully local and unaffected by API state.

---

## Conditions × expected behavior × verification

| # | Condition | Expected user-visible behavior | Where it's verified |
|---|-----------|-------------------------------|---------------------|
| 1 | `VITE_AI_API_BASE` unset | Badge **`Built-in coach`**; shortcuts produce structured fallback; copy never says "error" | `AITutorPanel` `aiConn === 'offline'` path; **`validate:ai-quality` 28-case + Playwright "AI panel never blanks"** |
| 2 | Wrong API base (DNS/HTTPS fail) | Badge probably **`Built-in coach`** after 4.5 s fail-safe; subsequent calls catch + fallback | Manual smoke test from `DEPLOYMENT_TEST_CHECKLIST.md`; partly covered by `validate:ai-quality` |
| 3 | Slow API response (15 s) | Spinner "Thinking…"; resolves within 18 s timeout or flips to timeout fallback | `aiClient.ts` `POST_AI_TIMEOUT_MS = 18_000` |
| 4 | Hard timeout (>18 s) | "Tutor request timed out — your homework still works" structured fallback | `AITutorPanel.run` catch path for `ai_network_timeout` |
| 5 | HTTP 429 (rate limit) | `rateLimitedAiResponse` — "Tutor refreshes in about a minute" | `aiClient.ts` throws `rate_limited`; covered by stress test case |
| 6 | HTTP 500 / 503 | Generic catch → fallback "Request didn't finish — still giving you the same structured offline pattern" | `AITutorPanel.run` catch; fallback shape proven via `enforceStructuredAiResponse` |
| 7 | Malformed JSON | `postAi` throws → catch → structured fallback | `aiClient.ts` returns parsed JSON; bad JSON throws SyntaxError → caught |
| 8 | Empty `{}` response | `isWeakAiResponse(out)` → true → fallback | `validate:ai-quality` covers this |
| 9 | Partial response (only `answer`) | Weak detection on missing keypoints → fallback | `validate:ai-quality` covers this |
| 10 | Inconsistent / vague answer | Weak detection on platitudes / tautology / duplicate bullets → fallback | `validate:ai-quality` covers this |
| 11 | Network goes offline mid-request | Catch path → "Request didn't finish" fallback | `OfflineStatusBanner` independently shows offline state |
| 12 | Rapid repeated tutor clicks | Each shortcut button is `disabled={loading}`; the Send button also `disabled={loading \|\| !input.trim()}` | `AITutorPanel.tsx` |
| 13 | API returns "OPENAI_API_KEY not configured" | Special case: explicit fallback with no shame language | `AITutorPanel.run` `outRaw.answer.includes("not configured")` branch |

---

## Hard guarantees (provable today)

1. **Tutor never blanks.** Every code path through `AITutorPanel.run` ends in `pushAssistant(...)` with a fully-populated structured response. Verified by Playwright `AI tutor never blanks out` test.
2. **No infinite checking.** Health check has a 4.5 s fail-safe; `postAi` has 18 s timeout via `AbortSignal.timeout` (or fallback `AbortController`).
3. **No /api caching by SW.** `public/sw.js` returns early on `url.pathname.startsWith("/api/")`. Asserted by `validate:production`.
4. **No spam-click race.** All shortcut buttons + the Send button respect `disabled={loading}`.
5. **Fallback shape is enforced.** `enforceStructuredAiResponse` returns `answer + ≥2 keyPoints + examTip ≥ 12 chars + nextAction ≥ 10 chars`. 28 stress cases pass.
6. **Local telemetry stays local.** A new `ai_fallback_used` signal records non-live answers in `localStorage` only. No `fetch` allowed in `localUsageSignals.ts` (validator-enforced).
7. **No cached AI answers visible offline.** SW does not cache `/api/*`; offline mode reliably flips to fallback.

---

## What still needs the real backend

These cannot be honestly checked without a live deployment:

- 429 rate-limit copy under bursty traffic
- Cold-start latency on serverless (3–10 s spin-up)
- 504 from upstream provider mid-stream
- Token refresh / quota exhaustion
- CORS misconfiguration on a new origin

These are itemized in `DEPLOYMENT_TEST_CHECKLIST.md` §3 and §6.

---

## Test improvements landed this round

- New Playwright case: **`AI panel renders Built-in coach when the API base is unreachable`**, asserts the badge text is in the DOM and that the call count to `/api/ai/**` stays ≤ 5 (no chatty health-check loops).
- New local signal: **`ai_fallback_used`** — every non-live `pushAssistant` increments it. Surfaced in `Progress → Usage signals` so the user can see if the live AI is or isn't reaching them. **No network sends.**
