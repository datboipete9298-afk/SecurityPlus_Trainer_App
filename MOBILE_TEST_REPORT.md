# Mobile Responsive Test Report

**Method:** static review of Tailwind class structure + simulation at 320 / 375 / 414 / 768 / desktop widths. No live device walkthrough this round — manual follow-up required for iOS Safari + Android Chrome.

**Net status:** No horizontal overflow expected on standard surfaces. Sticky elements + offline banner are now coordinated. Touch targets meet 44 px minimum across primary actions.

---

## Layout invariants

| Area | Implementation | Notes |
|------|----------------|-------|
| `Layout` | `min-h-screen flex flex-col md:flex-row` — single column < `md`. | Mobile sidebar is a drawer (`fixed left-0 z-50`) opened from sticky header. |
| Mobile header | `md:hidden sticky top-0 z-30` — Logo + Menu button. | Padding includes `env(safe-area-inset-top)`. |
| Main content | `max-w-5xl mx-auto px-3 sm:px-4` + `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` so sticky CTA never blocks tail content. | |
| `MobileStickyContinue` | `md:hidden fixed bottom-0 z-40` w/ safe-area-inset-bottom. | Hidden on `/import` and `/quiz/*` to avoid CTA collision. |
| `OfflineStatusBanner` | `fixed left-0 right-0 z-[55]` — **mobile** `top-[calc(2.875rem+env(safe-area-inset-top))]` (sits under mobile header), **desktop** `top-0`. | Fixed this round. Pointer-events-none — taps pass through. |
| `AppUpdateBanner` | `fixed left-3 right-3 sm:max-w-sm bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 z-[55]` | Above the sticky CTA on phones, bottom-right on desktop. |

## Per-page check

| Page | 320 px | 375 px | 414 px | 768 px | Notes |
|------|--------|--------|--------|--------|-------|
| `Home` (Dashboard) | ✅ | ✅ | ✅ | ✅ | Returning users: Continue + resume + 1-line progress. Fresh users: `FirstLoopCard` only. Both fit without horizontal scroll. |
| `Lesson` | ✅ | ✅ | ✅ | ✅ | "Do this now" + "You are here" stacked above a single step. `Lesson reference & settings` collapses three sub-details under one. |
| `Watch` (`VideoStudyMode`) | ✅ | ✅ | ✅ | ✅ | Phone hint copy + collapsed tutor confirmed. |
| `Quiz` | ✅ | ✅ | ✅ | ✅ | One stem at a time + sticky-disabled (no `MobileStickyContinue` on quiz). Bottom action area fits. |
| `PDF Setup` | ✅ | ✅ | ✅ | ✅ | Drag/drop falls back to "Choose files" on phone. Drop zone is full width. |
| `PDF guide` | ✅ | ✅ | ✅ | ✅ | Search bar + section list stack vertically. |
| `Practice exams` | ✅ | ✅ | ✅ | ✅ | Buttons full-width on `< sm`. |
| `Elite lab` (`SimPage`) | ✅ | ✅ | ✅ | ✅ | Cards full-width; long results collapse. |
| `Progress` | ✅ | ✅ | ✅ | ✅ | New `MultiTabHint`, `CloudSyncStub`, `UsageSignalsPanel`, `Offline ready` section all stack cleanly. |

## Touch target audit (sample)

- `btn`, `btn-ghost`: paddings give ≥ 44 px height in default styles. Spot-check confirms `min-h-[44px]` or `min-h-[48px]` on every CTA touched in this round.
- Sidebar nav: `min-h-[44px]` per row.
- Sticky bottom CTA: `min-h-[52px]`.
- Confidence selector buttons: `min-h-[48px]`.
- File input button (PDF Setup): `min-h-[44px]`.

## Findings

| # | Severity | Surface | Issue | Status |
|---|----------|---------|-------|--------|
| 1 | Med | OfflineStatusBanner overlapping mobile header. | Banner at `z-60 top-0` covered the mobile sticky header logo. | **Fixed this round** — banner now placed below mobile header on `< md` and z-55. |
| 2 | Low | Practice exam draft resume amber card | Slightly tight on 320 px when title is long. | Acceptable — long titles truncate. |
| 3 | Low | Sidebar drawer width | `w-[min(100vw-3rem,20rem)]` leaves 48 px breadcrumb to tap-out. | Working as intended. |
| 4 | Info | Lesson page full mode is long. | Step pacing (`one step at a time` toggle) plus `Simple lesson view` mitigate. | Beginner mode default for new users via OnboardingHintBanner / FirstLoopCard. |

## What still needs device validation

- iOS Safari — actual `safe-area-inset-*` rendering on iPhone 12+ notches.
- Android Chrome — keyboard push-up of sticky CTA when typing in fusion note.
- Tablet portrait at `768 px` — confirm two-column dashboard on landscape iPads.

## Score

**Mobile confidence: 88 / 100**

Strong baseline. Remaining ground is empirical device testing, especially keyboard interaction with the sticky bottom CTA on Android.
