# Technical Master Audit

## TypeScript

- **Strictness:** Project uses `tsc -b`; build succeeds — types generally solid.
- **Surface gaps:** Occasional `Record<string, unknown>` in AI payloads — intentional flexibility.

## React structure

- **Route-level code splitting:** `React.lazy` for all routes — ✅ initial bundle constrained (`index.js` chunk ~298kb raw before gzip listed in build logs).
- **Shared shell:** Layout + ProgressProvider wraps app.

## State

- Single large **context reducer pattern** (`ProgressContext`) — predictable but heavyweight re-renders possible on huge state churn — acceptable at current scope.

## Storage

| Store | Migration |
|-------|-----------|
| localStorage (`spt_v1_state`) | schema v12 migrations in storage load |

Test:** export/import corrupted JSON — guarded by try/catch in import path (verify UX message).

IndexedDB:**

- Separate from LS — reconciliation effect when IDB emptied.

## Build / deploy

| Item | Status |
|------|--------|
| Vite prod build | OK |
| `vercel.json` SPA rewrite | ✅ |
| API server | Separate process — **not embedded** in static artifact |
| Secrets | OpenAI must be server/env only |

## Error boundaries

- **No repo-wide React error boundary spotted in quick grep** — unhandled exceptions may white-screen single route subtree — backlog item MEDIUM.

---
