# AI Tutor Master Audit

## Architecture snapshot

`AITutorPanel` posts to `postAi(mode, body)` → dev proxy `/api` → Express handlers → OpenAI with **structured JSON** enforced via `enforceStructuredAiResponse` + `aiResponseQuality` weak detection.

Contexts: lesson, quiz, lab (with `eliteLabMentor` + domain coach hooks after score), pdf guide metadata + highlights.

Prompts (`server/prompts.ts`):

- **ELITE SOC lab guard**: no canonical queue leakage; different rules before vs after score.
- **PDF guard**: richer rules when guided PDF sections present.

## Helpfulness

- ✅ Structured answers with key points — scannable on mobile.

## Groundedness risk

| Risk | Mitigation | Residual gap |
|------|-------------|---------------|
| Hallucinates exam wording | Prompt forbids insider claims | User must still verify |
| Leaks quiz answers | Not fully provable statically | Confidence + tutor modes separate |
| Lab queue answers | SOC guardrail | ✅ strong |

## Technical / infra

- Fallback copy path when offline or weak structured response (`aiTutorFallback`).
- Rate limit message distinct from outage.
- **Exam lock** returns deterministic canned response (`examAiLocked`).
- **`validate:ai` + `validate:ai-integration`** — scripts exist and passed in CI run.

---
