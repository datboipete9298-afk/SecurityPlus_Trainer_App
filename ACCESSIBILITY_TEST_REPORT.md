# Accessibility Test Report

**Method:** code-informed review against WCAG 2.x AA, plus IDE static a11y tooling. No screen-reader live walkthrough was performed in this round; that is a manual follow-up.

**Net status:** Strong on structural roles + live regions; minor IDE false-positives remain on `aria-expanded={boolean}`. No blockers.

---

## What's good

| Area | Evidence |
|------|----------|
| Skip link | `Layout.tsx` has `Skip to main content` anchor focused on `#main-content`, hidden until focus. |
| Main landmark | `<main id="main-content" tabIndex={-1}>` with focus ring on `:focus-visible`. |
| Live regions | `OfflineStatusBanner`, `AppUpdateBanner`, `MultiTabHint`, `BackupNudgeBanner`, **AITutorPanel transcript** (`role="region" aria-live="polite" aria-relevant="additions"`), `Thinking…` (`role="status"`), do-this-now strips, run-finished banners — all use `role="status"` / `aria-live="polite"`. |
| Status badges | `StatusBadge` consumed where AI state is communicated. |
| Confirmation prompts | `Mark complete anyway` paths use `window.confirm` — keyboard/SR friendly. |
| Touch targets | Button / link classes consistently use `min-h-[44px]` or `min-h-[48px]` on primary CTAs (`btn`, `btn-ghost`, list items). |
| Mobile sticky | `MobileStickyContinue` uses `role="navigation"` with `aria-label="Continue studying"`. |
| Page titles / headings | `PageHeader` renders `<h1>`; section cards use h2-level. |
| Form labels | Brain Book / fusion note inputs have explicit placeholders + paired labels. PDF setup file input has `aria-label`. |
| Detail/summary disclosure | All `<details>` use `summary` with `min-h-[44px]`; chevrons via CSS `[&::-webkit-details-marker]:hidden`. |
| Dialog / modal | Flashcard modal (`VideoStudyMode`) uses `role="dialog" aria-labelledby aria-modal="true"`. |

## Findings (none blocking)

| # | Severity | Surface | Issue | Fix |
|---|----------|---------|-------|-----|
| 1 | **Info** | `Layout.tsx`, `WeakPage.tsx`, `StartHere.tsx` | Edge Tools (Microsoft) lints `aria-expanded={boolean}` as "invalid value." This is a **false positive** — React's typing accepts the boolean and serializes to `"true"`/`"false"` exactly per spec. | Documented as known noise; no code change. TypeScript & build accept the boolean. |
| 2 | Info | `Dashboard.tsx`, `LessonStepIndicator.tsx` | Inline `style={{ width }}` on the readiness bar / step indicator — Edge Tools warns about inline styles. | Acceptable for dynamic % widths. Could move to CSS variables in a future pass. |
| 3 | Low | `OfflineStatusBanner.tsx` | Visually overlapped the mobile sticky header on small screens (top-0 fixed at z-60 vs sticky header z-30). | **Fixed this round** — banner now sits below the mobile header (`top-[calc(2.875rem+env(safe-area-inset-top))] md:top-0`) and z-index dropped from 60 → 55. |
| 4 | Low | All pages | Color contrast is mostly slate-200/300 on slate-950/900, comfortably above 7:1. The amber-200/85 on amber-950/25 mid-tones are close to AA but pass at standard sizes. | Manual contrast verification recommended on iOS Safari (renders amber slightly darker). |
| 5 | Low | `ConfidenceSelector` | Hint text inside button is `text-[10px]` — small but bold + adequate contrast. | Acceptable for power-user surface. |
| 6 | Low | `MobileStickyContinue` | `pointer-events-none` is NOT used on the inner Link, but the wrapper is at z-40. On extreme tall content the sticky may obscure the bottom of long pages. Body has `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` which compensates. | Confirmed adequate. |

## What still needs human or device validation

- **VoiceOver / NVDA walkthrough** of: opening a lesson, saving a fusion note, completing a quiz, hitting an error boundary, going offline.
- **Keyboard-only flow:** TabIndex order on `Roadmap` and `LessonPage`'s nested details.
- **Reduced motion:** No CSS `prefers-reduced-motion` carve-outs; the only animations are spinner + sticky transform. Acceptable, but a future pass should disable `animate-pulse` on `Thinking…` for `prefers-reduced-motion`.

## Score

**A11y confidence: 82 / 100**

Strong structural baseline; remaining gap is empirical SR + reduced-motion testing.
