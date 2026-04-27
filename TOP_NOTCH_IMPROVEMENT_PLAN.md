# Top-Notch Improvement Plan

Prioritized, **low-bloat** follow-ups. Check off as you go.

## P0 — Trust & safety (copy + expectations)

- [x] Readiness disclaimer visible near score (dashboard / exams — extend if needed)
- [x] Progress exam card one-liner (steer study, not pass/fail prediction)
- [x] Start Here: readiness / official materials heads-up

## P1 — Onboarding clarity

- [ ] **Import** page title suffix: “(for developers / content authors)” in nav label — optional
- [x] **Search** purpose: what / why / first / next / no results

## P2 — Accessibility

- [x] Skip to main content + `#main-content` on `<main>`
- [ ] Mobile drawer: focus trap (optional)
- [ ] Quiz: ensure answer buttons have accessible names when only letter shown

## P3 — AI quality

- [x] Prompt addendum: no fake exam wording; objective-grounded replies (`server/prompts.ts`)
- [ ] Log redacted prompt size server-side (optional telemetry)

## P4 — Mobile polish

- [ ] AITutorPanel: “Collapse” control on small screens (if not present)
- [ ] Long tables on Progress: horizontal scroll wrapper

## P5 — QA automation (later)

- [ ] Playwright: Start Here → first lesson → 1 quiz question → home

## P6 — Docs

- [x] `TOP_NOTCH_SYSTEM_MAP.md`
- [x] `TOP_NOTCH_AUDIT_REPORT.md`
- [x] `FRIEND_READY_CHECKLIST.md`
- [x] `FINAL_PRE_SHARE_CHECKLIST.md`

---

**Rule:** Do not expand scope into new feature areas (social, accounts) without product decision — this app’s strength is **local-first + depth**.
