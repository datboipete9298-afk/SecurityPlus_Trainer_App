# Capitalize on Test Results

A practical playbook for turning real-user findings (once collected) into product, retention, and honest marketing wins.

---

## 1. Turn findings into product upgrades

### Pattern: "5 users hesitated at point X"

→ Open `coachingMicroCopy.ts`, add a key for that exact moment, place a `<CoachLine k="..." />` at the friction point. Ship in the next minor release. **No engine changes, no scoring changes.**

### Pattern: "3+ users confused by a button label"

→ Edit copy in the relevant page; do **not** add documentation. The lesson is "the label was wrong," not "we need a help page."

### Pattern: "User abandoned on screen Y"

→ Inspect that screen for:
- More than one primary CTA → suppress one
- Wordy header → reduce to one calm sentence (`SearchPage` is the template)
- A red/punitive palette → switch to amber/neutral (`MistakeInsight` is the template)

### Pattern: "Wrong answer caused emotional crash"

→ The `quizGoal` + `MistakeInsight` softening is already in place. If still failing, escalate the `quiz_retry` signal panel on Progress to a calm "you retried 3+ times — that's how it works" callout.

---

## 2. Metrics to track (local-only — no spying)

`localUsageSignals` already records:

- `lesson_started` / `lesson_completed` / `first_win`
- `video_note_saved` / `quiz_completed`
- `pdf_added` / `export_completed`
- `error_boundary_hit` / `offline_mode_used` / `pwa_installed`
- **NEW** `ai_fallback_used` — flags backend instability without sending data
- **NEW** `quiz_retry` — flags failure-loop endurance
- **NEW** `unknown_route_hit` — flags stale bookmarks / deep-link breakage after refactors

**Health rules** (review these locally during tester sessions):

| Signal | Healthy band | What it means if outside the band |
|--------|--------------|-----------------------------------|
| `lesson_completed / lesson_started` | ≥ 0.4 | Funnel leak between opening a lesson and finishing it |
| `quiz_retry / quiz_completed` | 0.2–0.6 | Below: users may be skipping wrongs; above: failure loop is too punishing |
| `ai_fallback_used / total AI sends` | < 0.3 | Above: live AI server is degraded — check `/api/ai/health` |
| `unknown_route_hit` per session | < 1 | Above: a recent refactor broke a deep-link — check release notes |
| `pdf_added` after `pdf_setup_visit` | ≥ 0.5 | Below: PDF Setup is too hard or scary |

These bands are guesses today — calibrate from the first 5-tester run. Replace this table with measured medians.

---

## 3. Retention plays

| Lever | Action | Effort | Estimated retention lift |
|-------|--------|:------:|:-----------------------:|
| Empty-state coach lines | Add to FlashcardsPage empty state, WeakPage empty state | low | +5 % |
| Re-engage email — opt-in only | Out of scope (no account system) | n/a | n/a |
| First-loop celebration | The `extensionFlashLine` flash + identity line is in place; consider a one-time "first lesson done" toast on next visit | low | +3 % |
| Streak-near-miss reminder | `buildStreakNearMiss` already in `SessionMomentumCard` | already shipped | — |
| One-tap resume | `ResumeWhereCard` covers this | already shipped | — |

---

## 4. Pass-readiness confidence

The honest framing: readiness in this app is **steering**, not a CompTIA prediction. The `TrustReminderStrip` says it; the Dashboard purpose says it; the Progress page header says it.

**Capitalize:** when persona testers complete `T1–T8`, ask explicitly:

- "Did the readiness number make you feel like the app was guessing your exam outcome?"
- "Did 'your practice here' wording change your trust?"

If even one persona answers **yes** to the first, escalate the disclaimer position (move to top of Progress, not just the strip).

---

## 5. Honest marketing positioning

### What we can claim

- **Local-first** — verified by validator (no `fetch` in 7 utils).
- **Works offline after first visit** — verified by SW + Playwright (deployed-only test).
- **AI tutor never blanks out** — verified by `validate:ai-quality` (28 cases) + Playwright.
- **Refresh-safe quizzes** — verified by `validate:production` + manual checklist.
- **No login required** — by design.
- **Export your data anytime** — UI button + checklist test.

### What we cannot yet claim (do not market these)

- "Cloud sync across devices" — backend not implemented (`CloudSyncStub` is honest about this).
- "Tested with X users" — only run after `USER_TEST_SCORECARD.md` is filled.
- "Pass guarantee" or any prediction of CompTIA scores — explicitly disclaimed in copy and would be dishonest.

### Specific honest taglines (suggested)

- *"Local-first study app for Security+ SY0-701 — your progress saves on this device."*
- *"Works offline after the first visit. No login. Your notes never leave your browser."*
- *"AI tutor with a structured fallback — same answer / key points / next-step shape every time."*

---

## 6. Testimonial / question prompts to collect

When you run the persona session, ask each tester these **after** they finish T1–T8:

1. "What did the app do that surprised you in a good way?"
2. "What did you almost give up on?"
3. "Tell me a moment when you felt 'this is teaching me how to study,' if any."
4. "How did the wrong-answer feedback feel?"
5. "Would you use this for a real exam? What would have to be different?"
6. "If you came back tomorrow, what would you do first?"

Direct quotes from #1, #3, #5 are testimonial-shaped. Direct quotes from #2 are roadmap-shaped.

---

## 7. What to fix first after testing 5 real users

The empirical fix pipeline:

1. **Cohort medians** of T1 (time-to-first-win) and T8 (would-use-again).
   - T1 > 90 s → simplify `FirstLoopCard` further or move to a single "Press play" video.
   - T8 < 7 → confusion log triage (next steps).
2. **Most-cited confusion** (highest count in `USER_TEST_SCORECARD.md` confusion log) → fix it in copy or layout the same week.
3. **Most-cited trust concern** (T7) → escalate the relevant disclaimer's position or volume; if it's about a new feature, defer the feature.
4. **Re-run persona session** with the fix; expect cohort median T1 to drop ≥ 15 % for a real fix.

If the fix doesn't move the median, the fix wasn't the right one. Do **not** ship more copy patches over the same problem.
