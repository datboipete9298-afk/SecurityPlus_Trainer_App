# AI tutor audit

## What works well

- **Server-side key** via Express/Vercel handlers — key not baked into client bundle.  
- **Structured request bodies** — lesson, quiz, notes, lab context serialized intentionally.  
- **Exam mode lock** — `examAiLocked` blocks live calls; fallback message is on-theme.  
- **Health check** — `/api/ai/health` + UI badge states (Live / Guided / Exam lock).  
- **Rate limiting** — server-side hook prevents naive abuse.  
- **Graceful degradation** — network/429 → `smartCoachOfflineResponse` and friends; user still gets structured coaching text.  
- **Beginner mode flag** — passed to server for simpler tone.

## What can fail

| Failure | What happens | User understanding |
|---------|--------------|-------------------|
| No `VITE_AI_API_BASE` | Health skipped (no fetch spam); badge “Ready/Guided” | **Medium** — may think AI “loading” |
| Wrong API base URL | Fetch fails → fallback | **Low confusion** if they read panel |
| Server down | Same as network | **Low** |
| No OpenAI key on server | Health reports `hasKey: false` | **Good** if badge read |
| User asks out-of-scope question | Model may generalize | **Risk** — needs “verify in lesson” habit |

## Hallucination & verbosity risks

- **Quiz help** without strict grounding could invent distractors — mitigated by app sending stem/options/explanation, but not a legal chain-of-citation.  
- **Long answers** on mobile hurt — UI is chatty by design; truncation or “short mode” would help.

## Mobile AI usability

- Panel **max-height** + many quick actions → scroll + discoverability issues.  
- Input + Send OK; quick chips can feel cramped.

## Safer + more useful (incremental)

1. Footer on every assistant bubble: **“Cross-check with the lesson explanation and official objectives.”**  
2. **Simpler quick actions** on small screens (collapse to menu).  
3. **Log mode** (dev only) for prompt inspection — never in prod UI.

## Score (AI tutor safety & usefulness)

**81/100** — Architecture is responsible; residual risk is **user over-trust** and **mobile density**.
