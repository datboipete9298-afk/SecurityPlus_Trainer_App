# Device Issue Log

**Owner:** _your name_  ·  **Cohort run date:** _yyyy-mm-dd_  ·  **Build commit:** _hash_

Append one row per real-device finding. Severity: `H` (blocks ship) · `M` (degraded UX) · `L` (cosmetic).

| # | Date | Device + browser | Page / component | Problem (what user sees) | Severity | Likely cause | Safe fix proposed | Needs real device? |
|---|------|------------------|------------------|--------------------------|:--------:|--------------|-------------------|:-----------------:|
| _example_ | 2026-04-30 | iPhone 12 Safari 17 | LessonPage Brain Book input | Keyboard covers Save row when typing | M | Browser doesn't auto-scroll the focused input | Add `scroll-margin-bottom: 6rem` on the inputs OR `useEffect` `scrollIntoView` on focus | yes |
|   |      |                  |                  |                          |          |              |                   |                   |
|   |      |                  |                  |                          |          |              |                   |                   |
|   |      |                  |                  |                          |          |              |                   |                   |

---

## Already-fixed device-related items (closed)

| Surface | Fix | Round |
|---------|-----|-------|
| `OfflineStatusBanner` overlapped mobile sticky header | Repositioned below header on `< md`; z-55 (under mobile drawer z-50 but above content) | Reality stress lab pre-round |
| Sticky Continue obscured page bottom | `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` on `<main>` | Mobile pass |
| Mobile drawer z-index race vs offline banner | Drawer z-50 / banner z-55 / update z-55 / sticky z-40 — coordinated | Production readiness pass |

## Triage rules

- **Severity H** → block release, file a copy/CSS fix the same day, retest before promote.
- **Severity M** → file in this log + next safe-fix round.
- **Severity L** → batch with next quarterly polish.

## Useful evidence to capture per finding

- Screenshot (or screen recording for keyboard / sticky issues).
- Browser dev-tools `User Agent` string.
- Whether the issue reproduces in private/incognito mode.
- Whether reload clears it.
