# Real User Behavior Lab

**Method:** behavioral simulation against the current code + copy. Each row is a hypothesis about how a real human will react, signals that would expose it, and the file/component to address. **Not** validated against humans — pair with `USER_TEST_SCORECARD.md` to do that.

Legend: **Sev** = severity if true (`H` high · `M` medium · `L` low) · **Fix?** = is there a safe code/copy fix vs. requires real user testing

---

## Persona × task matrix

### A. Overwhelmed beginner

| Task | Expected behavior | Hesitation signals | Confusion signals | Emotional reaction | Quitting risk | Fix idea | Where | Sev | Fix? |
|------|------------------|-------------------|-------------------|--------------------|---------------|----------|-------|----:|:----:|
| First open | Looks for "Start now" | Scrolls Home looking for an entry | Multiple CTAs | Slight relief seeing one big button | Low | `FirstLoopCard` already shipped | `Dashboard.tsx`, `FirstLoopCard.tsx` | L | ✓ done |
| First lesson | Reads Do this now, taps embed | Pauses on "Lesson reference & settings" | Three nested details | "Why are there so many sections?" | Low (collapsed by default) | Top-level grouping done last round | `LessonPage.tsx` | L | ✓ done |
| First video note | Pause + write 1 word | Stares at 4 input fields | "Do I fill all fields?" | Mild paralysis | Med | `oneNoteRule` coach line above inputs | `LessonPage.tsx` | M | ✓ done |
| First wrong answer | Reads "Not quite" softly | Reads all 7 cards in feedback | Information overload | Tolerable (amber not red) | Low | `FeedbackPanel` already softened | `FeedbackPanel.tsx`, `MistakeInsight.tsx` | M | ✓ done |
| Return after 7 days | Tap Continue | "Where was I?" | `ResumeWhereCard` shows last 4 entries | Relief | Low | Already wired | `ResumeWhereCard.tsx` | L | ✓ done |

### B. Anxious learner

| Task | Hesitation signals | Confusion signals | Quitting risk | Fix idea | Sev | Fix? |
|------|-------------------|-------------------|---------------|----------|----:|:----:|
| Wrong answer | Reads explanation 2× | "Did I just fail?" | Med | `Not quite` + reassurance line + amber palette | M | ✓ done |
| 3 wrong in a row | Considers stopping | "Am I dumb?" | **High** | `MistakeInsight` neutralized; quiz-goal coach line at top reframes wrongs as data | M | ✓ done |
| Lab fail | Wants to quit | "What did I miss?" | High | Boss posture line + retry-after-review framing | M | ✓ done |
| Export | Worry about losing data | "Did it save?" | Low | `BackupNudgeBanner` calm copy; `Your progress is safe` repeated everywhere | L | ✓ done |

### C. Low-confidence learner

| Task | Confusion / hesitation | Fix idea | Sev | Fix? |
|------|------------------------|----------|----:|:----:|
| Reading readiness score | "Is this saying I'll fail?" | Explicit "your practice here — not a CompTIA score" copy in PageHeader & TrustReminder | M | ✓ done |
| Confidence selector | "What if I lie about being confident?" | Subline explains: "honest tap — no wrong answers here" | L | ✓ done |
| Attempting a boss fight | Avoids it entirely | `bossPosture` coach line: "losing the first run is normal" | M | ✓ done |

### D. Distracted phone user

| Task | Friction | Fix | Sev | Fix? |
|------|----------|-----|----:|:----:|
| Tapping Continue | Sticky bottom CTA must be unblocked | `MobileStickyContinue` + `pb-[5.5rem+safe-area]` on `<main>` | L | ✓ done |
| Typing fusion note | Mobile keyboard might cover Save | Form is in flow; keyboard scroll-into-view is browser-default. **Real-device test still required.** | M | needs device |
| Switching tabs back | Stale state? | `MultiTabHint` + `ForeignWriteCue` cover this | L | ✓ done |

### E. Fast-clicking impatient user

| Task | Risk | Fix | Sev | Fix? |
|------|------|-----|----:|:----:|
| AI shortcuts | Spam-click during loading | Buttons `disabled={loading}` already; `Send` button also disabled | L | ✓ done |
| Quiz answer + Next | Double-tap Next | Each button has its own `disabled` guard pre-confidence; no race observed | L | ✓ done |
| Refreshing mid-quiz | Loses position | `sessionStorage` restore for lesson study quizzes; calm copy | L | ✓ done |

### F. User who gets 3 questions wrong

| Task | Risk | Fix | Sev | Fix? |
|------|------|-----|----:|:----:|
| Repeated wrongs | Accumulating amber feedback walls; demoralization | `FeedbackPanel` is amber not red; `quizGoal` coach line reframes; `quiz_retry` signal records it | **H** | ✓ done (copy/tone), pending humans for verification |
| Smart Coach reaction | Should redirect to `/weak` after pattern | `nextStepEngine` already prioritizes `Repair last miss`; verified via Playwright unknown-route + AI-blocked tests | M | ✓ wired |

### G. User who skips instructions

| Task | Risk | Fix | Sev | Fix? |
|------|------|-----|----:|:----:|
| Skips Start Here | Misses orientation | `OnboardingHintBanner` says "you can't take a wrong step" | L | ✓ done |
| Doesn't read pause prompt | Watches video without notes | `pauseFiveSeconds` coach + 1-note rule + analyzer warnings | M | ✓ done |
| Hits Mark complete anyway | Bypasses checkpoints | Ethical user-agency choice; not a fix target | L | by design |

### H. User who returns after 7 days

| Task | Risk | Fix | Sev | Fix? |
|------|------|-----|----:|:----:|
| Lost momentum | "Where do I start?" | `ResumeWhereCard` (top 4 study links) + `Continue` button | L | ✓ done |
| Forgot last lesson topic | Anxiety | `Smart Coach` last-miss/lesson summary in nextStep | L | ✓ done |
| Two devices, no sync | "Why is my streak gone?" | `TrustReminderStrip` + `ProgressSafetyCard` explain local-only + export | M | needs cloud sync (out of scope) |

---

## High-leverage findings (this lab)

1. **3-wrongs-in-a-row** is the single biggest emotional risk. Tone has been softened (amber, not red); `quiz_retry` is now a local signal so it can be tracked. **Real human reaction still needs measuring.**
2. **Mobile keyboard overlap** on the fusion note is a likely device-only problem. Listed in `DEVICE_ISSUE_LOG.md`.
3. **Multi-device confusion** is unsolved by design (no cloud sync). The product story explicitly tells the user; nothing more code can do.

## What this lab still cannot answer

- Does the calmer wrong-answer copy actually reduce drop-off?
- Does `bossPosture` change first-boss completion rates?
- Is the `MultiTabHint` discoverable enough?

All three need real users (`USER_TEST_SCORECARD.md`).
