# Optional cloud sync — design (safe, no forced login)

**Status:** Design only. The shipped app remains **local-first**: `localStorage` + export/import JSON.

## Principles

1. **No forced login** — opening the app must always work anonymously.
2. **Fallback always local** — if sync is off, unavailable, or user declines, behavior matches today’s app.
3. **User-owned data** — progress JSON is the contract; cloud is a convenience mirror, not the only copy.
4. **Minimal surface** — no social graph, no public profiles.

## Suggested architecture (later)

| Piece | Role |
|-------|------|
| **Client** | Same `PersistedState` shape; after local save, optionally `POST` encrypted blob + `schemaVersion`. |
| **Auth (optional)** | Magic link, passkey, or “anonymous device key” stored in `localStorage` — user explicitly opts in. |
| **Storage** | Object storage (S3/R2) or small DB row per user id; **encrypt client-side** if feasible (user passphrase) so server never reads plain notes. |
| **Conflict** | Last-write-wins with timestamp + prompt “This device vs cloud — keep both?” for power users. |
| **Privacy** | Export remains the escape hatch; deleting cloud copy does not delete local unless user confirms. |

## What not to do

- Block UI behind signup.
- Replace export/import with “cloud only.”
- Send API keys or third-party tokens to the client bundle.

## Rollout order

1. Keep promoting **Export** in UI (done).
2. Add optional “Link this browser” behind a **Progress** toggle when backend exists.
3. Dogfood with maintainers only; then document env in `DEPLOYMENT_GUIDE.md`.

---

*This file is product intent — implement only when a backend and privacy review are ready.*
