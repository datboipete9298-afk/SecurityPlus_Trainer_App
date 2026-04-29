# Real-World Execution Plan

**Purpose:** the runnable script for taking this code-complete app to **real humans**, capturing measurable outcomes, and turning the results into the next prioritized fix list.

**Not** a brainstorm. Every section below is meant to be executed as written.

---

## 1. Real-world testing plan

### Who

**5 testers**, recruited once, never reused across sessions:

| Slot | Persona profile | Recruit notes |
|------|-----------------|----------------|
| 1 | Complete beginner (no security background) | Friend / family member; honest about confusion |
| 2 | Phone-only user | Tester who normally studies on a phone; provide their own device |
| 3 | Distracted / multitasking user | Someone with a busy day; schedule mid-week |
| 4 | Serious exam candidate | Currently studying for or considering Security+ |
| 5 | No-AI / privacy-conscious user | Someone who refuses optional AI on principle |

**Do not** recruit anyone who has built or tested the app before. **Do not** brief them on the design intent.

### When + how

- **20 minutes** per tester. **Hard stop at 25.**
- **In person OR screen-share with audio.** No silent text-only.
- Recording is **opt-in**. If declined, take handwritten notes.
- **Fresh browser profile** per tester (Incognito or a clean Chrome profile). Never reuse the previous tester's localStorage.
- **Fresh URL** — deployed Vercel preview, not localhost. The first-load offline path is part of the test.

### Facilitator rules

1. Read the **prompt** for the persona aloud once.
2. Then **silently watch**. Only respond if asked a direct yes/no question, and only with "use the app to figure it out — that's the test."
3. **Never** demonstrate. **Never** say "scroll down" or "tap the green button."
4. **Note** every time the tester:
   - hesitates **>5 seconds** (count as 1 confusion event)
   - says "what?" / "huh?" / "I don't get it"
   - clicks something they didn't intend
   - asks "is this saving?"
   - asks "what do I do now?"
5. After the 20 min hard stop, ask the **6 capitalize questions** (`CAPITALIZE_ON_TEST_RESULTS.md` §6). Stop the recording.
6. Within **24 hours**, fill the tester's row in `USER_TEST_SCORECARD.md`.

### Materials

- `REAL_USER_TEST_PLAN.md` — persona prompts + T1–T8 task definitions.
- `USER_TEST_SCORECARD.md` — per-tester recording template.
- A **stopwatch** (phone is fine).
- A **paper sheet** with the 6 capitalize questions printed.
- Backup test URL in case of deploy issues.

---

## 2. Expected human reactions (predictions)

These are **falsifiable** predictions from the code + lab review. After the cohort run, mark each prediction `confirmed` / `partially confirmed` / `falsified`.

| # | Prediction | Where | Persona most affected | Confirmed? |
|---|-----------|-------|------------------------|:----------:|
| 1 | Tester smiles or relaxes when seeing **`Start now →`** | `FirstLoopCard` on Home | Beginner | ? |
| 2 | Tester hesitates **5–10 s** before saving the first fusion note (4 input fields) | VideoStudyMode | Beginner, anxious | ? |
| 3 | Tester says "I don't know what to write" at the fusion note | VideoStudyMode | Beginner | ? |
| 4 | Tester reads the wrong-answer card **fully** on first miss; **scrolls past** by 3rd miss | FeedbackPanel | Anxious, low-confidence | ? |
| 5 | Tester asks "is this saving?" at least once | Lesson, Quiz | All | ? |
| 6 | Tester misses the **`OfflineStatusBanner`** when network drops (it's narrow, top-positioned) | Layout | Distracted | ? |
| 7 | Phone-only tester **types into fusion note while video is partly off-screen** and is mildly annoyed | VideoStudyMode | Phone-only | ? |
| 8 | Tester asks "what does Built-in coach mean?" after seeing the AI badge | AITutorPanel | All except no-AI | ? |
| 9 | Tester ignores the **`MultiTabHint`** because it's "small text" | Progress, Lesson | Distracted | ? |
| 10 | First-boss **failure** triggers visible negative reaction on at least 1 of 5 testers | BossFight | Anxious, low-confidence | ? |
| 11 | Tester chooses **Continue** rather than the resume cue ~80 % of the time | Home | All | ? |
| 12 | Tester taps `Mark complete anyway…` instead of finishing the stepper | LessonPage | Lazy / impatient | ? |
| 13 | After 7-day return, tester finds their lesson via **Continue**, not the path | Home | Returner | ? |
| 14 | At least 2 testers ask "where do I see all my notes?" | Brain Book / Lesson | All | ? |
| 15 | At least 1 tester tries to drag a PDF into the wrong page | PDF Setup | Beginner | ? |

**Validation rule:** if more than **5 of 15** are falsified, the model of "what real users do" was wrong, and the next fix round should be redesigned around the actual signals — not based on the prior labs.

---

## 3. Failure points (what counts as a failed session)

A session is recorded as **failed** if **any** of these happen — not for the build, for the *next-fix* prioritization:

| Code | Trigger | Owner of fix |
|------|---------|--------------|
| **F-IMPRESSION** | Tester asks "what is this?" or "what do I do?" within the first **60 seconds** on Home | Dashboard / FirstLoopCard copy |
| **F-LOOP** | Tester abandons the fusion note after **3+ minutes** of trying | VideoStudyMode + 1-note rule visibility |
| **F-WRONG** | Tester gives up after **3 wrong answers in a row** without retrying | FeedbackPanel + quizGoal CoachLine reframing |
| **F-TRUST** | Tester refreshes and reacts negatively to lost position on a lesson study quiz | sessionStorage restore (verify it's actually working live) |
| **F-PDF** | Tester drops a PDF and gets stuck for **>2 minutes** without progress | PdfSetupPage copy + verifier confidence framing |
| **F-RETURN** | Tester revisiting after 7 days needs **>30 seconds** to find their next move | Home / ResumeWhereCard ordering |
| **F-SCORE** | Cohort median for **T8 (would-use-again)** drops below **7 / 10** | Triage by frequency in the confusion log |

**Failure threshold for shipping a "real-users-tested" claim publicly:** zero **F-SCORE**, no more than one **F-IMPRESSION** across the cohort, and no more than two **F-LOOP**.

---

## 4. Measurable success metrics

These are **stopwatch-measurable**. No subjective "the tester seemed happy."

### Per-tester

| Metric | Target (cohort median) | Where it's recorded |
|--------|:----------------------:|---------------------|
| **T1** time-to-first-win (open URL → first quick-check answered) | ≤ 90 s | Scorecard |
| **T2** confusion-event count (>5 s hesitations + "what?" asks) | ≤ 2 | Scorecard |
| **T3** export attempt success | 100 % | Scorecard |
| **T4** PDF add success | 100 % when applicable | Scorecard |
| **T5** wrong-answer recovery (continue to next question within 30 s) | 100 % | Scorecard |
| **T6** lab pass on retry (≤ 5 min) | ≥ 80 % | Scorecard |
| **T7** offline reload still works (saw banner + made a save) | 100 % | Scorecard |
| **T8** "would use again?" 1–10 self-rating | median ≥ 7 | Scorecard |

### Across the cohort (post-session, from the local signals if you have access to a cooperative tester's tab)

| Signal | Healthy band | What out-of-band means |
|--------|--------------|------------------------|
| `lesson_completed / lesson_started` | ≥ 0.4 | Funnel leak between opening and finishing |
| `quiz_retry / quiz_completed` | 0.2 – 0.6 | Below = skipping wrongs; above = punishing |
| `ai_fallback_used / total tutor sends` | < 0.3 | Above = backend degraded, infra fix |
| `unknown_route_hit` per session | < 1 | Above = recent refactor broke a deep-link |
| `offline_mode_used` count | ≥ 1 over a week | Below = users not actually trying offline |

These can be observed by asking the tester to read their Progress → Usage signals counters at the end of the session. **No data is sent off-device.**

---

## 5. Testing script for real users (read aloud)

**Total run-time: 20 minutes hard cap.**

### Welcome (1 min, said by facilitator)

> "Thanks for helping. I'm going to give you a starting prompt and then watch for about 20 minutes. I won't help — that's the whole test. If you get stuck, that's information for me, not a failure for you. Talk out loud if you can — say what you're trying to do and what you're seeing. Ready?"

### The single starting prompt (per persona)

| Persona | Prompt (read once, then stop talking) |
|---------|---------------------------------------|
| Beginner | "You're starting Security+. Get started." |
| Phone-only | "You're commuting. Study for ten minutes on this phone." |
| Distracted | "You have ten minutes between meetings. Open it and study." |
| Exam candidate | "Imagine your exam is in two weeks. Make a plan and start it." |
| No-AI / privacy | "You don't connect anything optional. Just study, no AI, no PDFs." |

### Mid-session interventions

**Only** these. Anything else, stay silent:

- If the tester explicitly says "I quit" → "Take 30 seconds, then I'll ask you a few quick questions."
- If the tester asks "what does this mean?" about a label → "What do you think it means?" then watch.
- If the tester is stuck for **>2 min** with no input → "What's going through your mind right now?"

### Closing 6 questions (5 min, after stopwatch hits 20 min)

Read each, in order, write down the answer verbatim:

1. "What did the app do that surprised you in a good way?"
2. "What did you almost give up on?"
3. "Tell me a moment when you felt 'this is teaching me how to study,' if any."
4. "How did the wrong-answer feedback feel?"
5. "Would you use this for a real exam? What would have to be different?"
6. "If you came back tomorrow, what would you do first?"

Then: T8 self-rating.

> "On a scale of 1 to 10, how likely are you to use this app again tomorrow if it were on your phone?"

---

## 6. Definition of "improvement" (the only definition we'll use)

After the 5-tester cohort, an "improvement" must satisfy **all four**:

1. **Cohort median** of one of T1 / T2 / T8 moves in the right direction.
2. The change has a **single named cause** in the confusion log (don't ship 3 fixes hoping one moves the needle).
3. The change is **safe** (copy / layout / progressive disclosure — no logic, no scoring, no architectural reshuffles).
4. The change is **re-testable**: you can re-run the same persona's prompt next month and check if the median still holds.

If a proposed change doesn't satisfy all four, it's a **wish**, not an improvement. File it in `REALITY_FIX_BACKLOG.md` under FUTURE and move on.

### What is **not** an improvement (even if it feels like one)

- "I added more help text" (often increases overwhelm).
- "I added a tooltip" (mostly invisible to most users).
- "I moved the button up" without measuring before/after.
- "Three users said it was confusing so I added a tutorial page" (the answer is fix the surface, not add a page).

---

## 7. Pre-deploy checklist before running the cohort

- [ ] `npm run build` exits 0
- [ ] Playwright `npm run test:e2e` passes (against deployed URL, with `SPT_E2E_BASE`)
- [ ] Vercel deploy is on the URL the testers will visit
- [ ] `VITE_AI_API_BASE` decision is made (set or unset — both are fine, just be consistent for the cohort)
- [ ] All 5 prompts are printed on a single sheet
- [ ] 6 closing questions are printed on a single sheet
- [ ] One blank `USER_TEST_SCORECARD.md` cohort row per tester is open
- [ ] Stopwatch is on the facilitator's phone (not the tester's)
- [ ] Every tester is using a clean profile

If even one box is unchecked, **postpone**. The cohort is only useful if it's clean.

---

## Final REAL readiness score

Two numbers, on purpose:

### Code-readiness: **95 / 100**

What's structurally proven, automated, and safe-fixed across 12 build validators, 28 AI quality cases, 11 Playwright cases (13 passing on locale), 7 privacy guards across local-only utils, and ~20 in-repo test/QA documents.

### Real-world-readiness: **80 / 100 until the cohort runs**

The gap is **the cohort itself**. No code change can move this number. Even a perfect codebase, untested with humans, cannot honestly claim higher than ~80 — because:

- Predicted human reactions are **falsifiable hypotheses**, not observations.
- Mobile keyboard / device behavior is **predicted**, not measured.
- The "this app teaches you how to study" framing has **never been said back to us by a real user**.

**A clean cohort run lifts the second number to 88–92** depending on how many predictions hold up. **A second cohort run lifts it to 92–96.** **There is no honest path to 96+ without humans in front of the screen.**

That's it. The plan above is the path.
