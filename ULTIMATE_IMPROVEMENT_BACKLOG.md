# Ultimate Improvement Backlog

## CRITICAL

| Issue | Impact | Effort | Files | Fix sketch | Expected score uplift | Ignore risk |
|-------|--------|--------|-------|-------------|------------------------|-------------|
| **Production AI routing** unclear for static hosting | Tutor flaky in prod unless `/api` endpoint deployed | Medium | Deployment docs / `lib/aiClient` base URL | Env var + README “Vercel serverless handlers” step | Tutor usefulness +15 perceived | Broken tutor → trust erosion |
| **Silent `/` fallback for unknown URLs** loses deep-link debuggability | Support confusion | Low | `App.tsx` | Dedicated 404 mini-page linking Search | Flow +3 | Minimal |

## HIGH

| Issue | Impact | Effort | Files | Fix |
|-------|--------|--------|-------|-----|
| **Global error boundary** missing | Crash → blank white | Medium | `main.tsx`, `ErrorFallback.tsx` | Catch route subtree |
| Coach step strings expose raw `/practice-exams` paths | Cognitive friction beginners | Low | `nextStepEngine.ts` | Human labels |

## MEDIUM

| Item | Effort | Fix |
|------|--------|-----|
| First-day weak-domain nudge intimidation | Low–Med | Gentle copy when `quizAttempts < 10` suppress weak redirect |
| Readiness disclaimers unify | Low | Pull string constants |
| `Import lesson (authors)` nav label scares normals | trivial | Rename |

## LOW

- Lighthouse SEO meta description pass.
- Animated loading skeleton uniformity.

## FUTURE

- Dedicated FSRS flashcard tier.
- Web push reminders (explicit opt-in controversy).
