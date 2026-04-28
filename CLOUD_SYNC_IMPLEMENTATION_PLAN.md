# Cloud Sync — Implementation Plan (Optional, Local-First)

**Status:** Plan + UI stub. **Backend is not implemented.** Local-first export/import remains the source of truth.

This document is the authoritative architecture for adding sync **without** breaking the privacy promise: *“nothing leaves your browser unless you export.”*

---

## Goals

1. **Local-first stays default.** Sync is opt-in per device.
2. **No required account.** Identity is a key the user holds.
3. **Same JSON contract** as today’s `Export progress` (no parallel schema).
4. **PDF binaries never sync.** They live in IndexedDB on each device.
5. **Disconnect any time.** Disconnecting deletes local sync state, not local progress.
6. **No upload without explicit consent** for that exact device, that exact account.

## Non-goals

- Realtime collaboration / multi-user editing.
- Server-side rendering.
- Replacement for `Export progress` JSON file.

---

## Identity model — three options (pick one at build time)

### Option A — Passkey-anchored personal store (recommended)

- User registers a **passkey** (WebAuthn) bound to a hosted endpoint.
- Endpoint exchanges passkey assertion for a short-lived **device token**.
- Device token authorizes `PUT /api/sync/progress` and `GET /api/sync/progress`.
- Server stores **only** an encrypted blob (client-side AES-GCM) keyed by user-held secret.

Pros: no email, no password, phishing-resistant.  
Cons: requires passkey-capable device + a small backend.

### Option B — User-supplied storage URL (zero-server)

- User pastes a signed URL (e.g. their own S3 / R2 / Drive presigned).
- App PUTs encrypted JSON; GETs on connect.
- App never sees their account.

Pros: app remains static-host friendly, no backend.  
Cons: setup friction; URLs expire.

### Option C — Recovery code only (no auth at all)

- User generates a random 32-byte recovery code locally.
- App writes encrypted payload to a public storage with a derived path.
- Recovery code = full access (treat like a password).

Pros: simplest.  
Cons: lost code = lost sync.

**Recommendation:** Ship **Option A** when there’s a backend; expose **Option B** as “bring your own storage” for self-hosters.

---

## Data contract

Sync uses the **same JSON shape** as `exportProgress()` produces today. No schema fork.

```ts
type SyncEnvelope = {
  version: 1;
  /** ISO timestamp of the last local mutation. Used for conflict resolution. */
  modifiedAt: string;
  /** Same JSON shape as `Export progress` download. */
  payload: PersistedStateJson;
  /** Optional client-encrypted hint (HKDF tag). */
  encHint?: string;
};
```

### What syncs

- Notes (Brain Book, video fusion).
- Lesson progress flags + completion checkmarks.
- Quiz / lab / PBQ stats, miss journal, streak, XP, readiness.
- Domain scores.
- Practice exam attempts (final scored runs).
- User flashcards.
- Identity buckets and onboarding flags.
- Settings: beginner mode, simple lesson mode.

### What does NOT sync

- **PDF binaries.** They are large + potentially copyrighted; live in IndexedDB per device.
- **Service worker caches** (`spt-v1-shell`, `spt-v1-assets`).
- **Tab-scoped sessionStorage** (quiz draft index, backup nudge state).
- **Local usage signals** (`spt_usage_signals_v1`) — local telemetry stays local.
- **AI tutor transcripts** (none persisted today; design holds if added later).

---

## Conflict resolution

- **Last-write-wins per top-level key**, with `modifiedAt` from the envelope.
- Arrays (notes, missedJournal, practiceExamAttempts) are **append-merged** by `id` / `(qid, at)` — never overwrite older entries.
- On conflict, the user is offered a one-click **“download both before merge”** safety export.

---

## UX flow

1. **Progress → Optional cloud sync** card (already shipped as `CloudSyncStub`).
2. **Connect** opens a modal with the chosen identity option (A / B / C).
3. **Status row**: `Connected · last synced 2m ago` or `Not connected`.
4. **Sync now** + **Disconnect** buttons.
5. **Disconnect** wipes the device sync token; local progress is untouched.

Copy contracts:

- *“Local still works without sync.”* (always visible in the card)
- *“Notes and progress sync. PDFs stay on this device.”* (on Connect modal)
- *“Disconnect any time. Your export JSON is the source of truth.”*

---

## Failure modes — explicit handling

| Scenario | Behavior |
|---------|----------|
| Network down during sync | Queue locally, retry on next visibilitychange |
| Server 5xx | Surface a calm tile: "Sync paused — your progress is safe locally" |
| Token expired | Re-auth quietly; if user-action needed, surface a single CTA |
| Conflict (two devices) | Offer download-both, then merge by rule above |
| User clears browser data | Sync state lost; **local progress** lost too — covered by export reminder |
| User disables sync | Wipe sync token, keep local progress |

---

## Security checklist

- [ ] Encrypt payload **before** PUT (AES-GCM with a key never sent to the server).
- [ ] Server stores **only** ciphertext + length + `modifiedAt`.
- [ ] No emails, names, or analytics fields in the payload.
- [ ] Use `Cache-Control: no-store` on sync endpoints.
- [ ] Rate-limit by token at the edge.
- [ ] Document key rotation: download → re-encrypt → upload → invalidate old key.

---

## Backward compatibility

- The same `payload` JSON works with the existing **Export / Import** flow.
- A user can disconnect sync, export locally, re-connect later — no data loss.
- The `validate:data` and other validators don’t need to change; they validate static lesson content, not user state.

---

## Build order if implementing later

1. Add `src/lib/cloudSyncClient.ts` with **no-op** default exports plus a feature flag (`VITE_SYNC_ENABLED`).
2. Replace `CloudSyncStub` with a real `CloudSyncCard` that calls `cloudSyncClient`.
3. Add server endpoints: `POST /api/sync/auth/*`, `GET/PUT /api/sync/progress`.
4. Add e2e test: connect → mutate → push → wipe local → pull → verify.
5. Document key rotation in this file.

Until step 1 lands, the stub component stays.

---

## What this build ships today

- `src/components/CloudSyncStub.tsx` — UI shows the **plan** with explicit “Not connected” state and a hard link to local export.
- Progress page surfaces the stub above the existing Backup section.
- `BackupNudgeBanner` and `Export progress` are unchanged.

**No fake sync.**
