# Real Device Test Matrix

**Method:** device profile expectations + an explicit **TODO list per real device** to run during the next QA session. Code-level mitigations (safe-area insets, `min-h-[44px]`, sticky z-index hierarchy) are already in. The empirical run is the gap.

---

## Device profiles to cover

| # | Profile | Why |
|---|---------|-----|
| 1 | **iPhone Safari** (latest) | Most common phone; `safe-area-inset-*` rendering varies |
| 2 | **Android Chrome** (recent) | Mobile keyboard push behavior, sticky bottom buttons |
| 3 | **Low-end Android** (2-year-old, 2 GB RAM) | First-load TTI on slow CPU |
| 4 | **iPad / tablet** (portrait + landscape) | Two-column dashboard switch |
| 5 | **Windows laptop** (Chrome + Edge + Firefox) | Desktop default profile |
| 6 | **Narrow mobile 320 px** (iPhone SE 1st gen) | Tightest layout — no horizontal scroll |
| 7 | **Mobile keyboard open** | Virtual keyboard covers sticky CTA risk |
| 8 | **Poor Wi-Fi / cellular** | Slow first-load; SW behavior; AI timeout |

---

## Surfaces × profile (manual checks)

For each surface, verify on each profile in the list above. Mark `✓` (passes), `✗` (regression), or `?` (not tested yet).

### Home (Dashboard)

| Check | iPhone Safari | Android Chrome | Low-end Android | iPad | Win laptop | 320 px | Keyboard open | Slow net |
|-------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| FirstLoopCard fits | ? | ? | ? | ? | ? | ? | n/a | ? |
| Continue button never clipped by sticky | ? | ? | ? | ? | ? | ? | ? | ? |
| Resume cue text wraps cleanly | ? | ? | ? | ? | ? | ? | n/a | ? |

### Lesson page

| Check | … |
|-------|---|
| "Do this now" + "You are here" visible above fold | ? |
| Lesson reference & settings collapsed by default | ? |
| MobileStickyContinue z-index above content but not blocking primary action | ? |
| Brain Book inputs reachable while keyboard open | ? |

### VideoStudyMode

| Check | … |
|-------|---|
| Video frame fits viewport on 320 px | ? |
| Pause prompt + CoachLine readable | ? |
| Note textarea scrolls into view on focus | ? |
| Quick check buttons ≥ 44 px | ? |
| AI tutor collapses when minimal | ? |

### Quiz page

| Check | … |
|-------|---|
| One stem per screen; no overflow | ? |
| Choices ≥ 52 px | ? |
| Confidence selector buttons fit on phone | ? |
| FeedbackPanel scrolls without horizontal flow | ? |
| Sticky Continue NOT shown (suppressed by route) | ? |

### PDF setup

| Check | … |
|-------|---|
| Drag/drop zone falls back to "Choose files" | ? |
| File picker opens system sheet | ? |
| Saved row shows confidence | ? |
| Quota error displays calmly (try with huge PDF) | ? |

### PDF guide (lesson layer)

| Check | … |
|-------|---|
| Section list scrolls smoothly | ? |
| Open local PDF triggers blob URL → new tab | ? |
| Highlights persist across reload | ? |

### PBQ runner

| Check | … |
|-------|---|
| Up/Down reorder controls reachable on phone | ? |
| Submit button bottom-aligned | ? |
| Failure debrief readable | ? |

### Sim / Elite Lab

| Check | … |
|-------|---|
| Choice buttons full-width | ? |
| Long results collapse | ? |

### Practice exams hub

| Check | … |
|-------|---|
| Exam A/B/C cards stack vertically on phone | ? |
| Draft resume amber card readable | ? |

### Progress page

| Check | … |
|-------|---|
| Backup card primary button hits 44 px | ? |
| Cloud sync stub clearly disabled | ? |
| Usage signals panel doesn't overflow | ? |

### Offline / update banners

| Check | iPhone Safari | Android Chrome | Slow net |
|-------|:-:|:-:|:-:|
| OfflineStatusBanner sits below mobile sticky header | ? | ? | ? |
| AppUpdateBanner respects safe-area-inset-bottom | ? | ? | ? |
| Banner doesn't cover MobileStickyContinue tap target | ? | ? | ? |

---

## Pre-test code mitigations already in place

| Surface | Mitigation |
|---------|------------|
| `Layout.tsx` | `pt-[max(0.5rem,env(safe-area-inset-top))]` on mobile header; `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` on `<main>` |
| `OfflineStatusBanner.tsx` | Below mobile header on `< md` (`top-[calc(2.875rem+env(safe-area-inset-top))]`) |
| `AppUpdateBanner.tsx` | `bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4` |
| `MobileStickyContinue.tsx` | `pb-[max(0.75rem,env(safe-area-inset-bottom))]` |
| All buttons | `min-h-[44px]` (or 48/52 for primary) |
| All disclosure summaries | `min-h-[44px]` |
| Lesson page | `pb-8` + sticky safe-area | 

## What this matrix still cannot answer (alone)

- Whether iOS Safari actually renders `safe-area-inset-top` correctly with the OfflineStatusBanner offset — needs an iPhone in hand.
- Whether Android Chrome's keyboard overlap is fully avoided on the fusion note input — varies by Android version + IME.
- Whether the low-end Android can render the LessonPage in < 3 s — needs profiling.
- Whether the VideoStudyMode video stays visible while typing on 320 px — visual-only judgment.

See `DEVICE_ISSUE_LOG.md` for tracking real findings.
