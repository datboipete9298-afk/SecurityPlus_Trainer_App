# Real-User Test Plan

**Purpose:** Repeatable, structured way to validate that the app feels effortless, trustworthy, and effective for real humans — not just for engineers reading the code.

**Constraints:** Studies are cheap and small. 5 testers, ~20 min each. Findings drive copy / layout / CTA changes only — no scoring or AI logic edits during testing.

---

## How to run a session

1. Hand the tester a freshly opened browser pointed at the deployed URL.
2. Read them the **prompt** from their persona, then **silently watch**.
3. Use the **observation checklist** for that persona.
4. After the session, record results in `USER_TEST_SCORECARD.md`.

**Don't** lead them. **Don't** explain the app. If they ask "what now?", the answer must come from the UI — that's the test.

---

## Persona 1 — Complete beginner (no security background)

**Prompt:** *"You're new to Security+. Get started."*

| Step | What we expect them to do | Pass criteria |
|------|---------------------------|---------------|
| Open app | See **First loop card** + Start now button | They click Start now within 30 s |
| Land on first lesson | See **Do this now** + **You are here** strip | They start the video without scrolling away |
| Pause + write note | Use the inline fusion note (one keyword + one main idea) | Note saves; proof banner appears |
| Quick check | Pick an answer, get explanation | They read the explanation, not just the score |
| Next | Tap **Continue** on Home | Lands them on quiz / next lesson |
| **Time to first win** | — | **≤ 10 minutes** |

**Likely hesitation:** Roadmap on first menu open could feel long. Mitigated by `Ready / Coming soon / you are here` labels.  
**Likely confusion:** "Brain Book vs video note." Mitigated by single fusion path in simple lesson view.  
**Recovery:** OnboardingHintBanner ("2-minute tour ... or just tap Continue. You can't take a wrong step.")  
**Trust check:** Did they ever ask "is my work saved?" — if yes, copy isn't loud enough.

---

## Persona 2 — Phone-only user

**Prompt:** *"You're commuting. Study for 10 minutes."*

| Step | Pass criteria |
|------|---------------|
| Tap Continue on Home | One tap; no scrolling |
| Lesson loads on phone | Mobile sticky Continue is visible at bottom |
| Read pause line | Visible without horizontal scroll on iPhone SE width (320 px) |
| Tutor stays collapsed | They can ignore it without dismissing |
| Save note | Keyboard doesn't push primary action off screen |
| Refresh quiz mid-run | sessionStorage restores position; calm copy explains |
| Offline test (airplane mode) | Banner appears: "Offline — keep studying." Notes still save |

**Pass:** They never have to pinch-zoom; never have to think.

---

## Persona 3 — Distracted user (multi-tabbing, glanceable)

**Prompt:** *"Open the app between meetings."*

| Step | Pass criteria |
|------|---------------|
| Reopen after 30 minutes | Resume cue or PracticeExamDraftResume surfaces |
| Two tabs open | Tip "Use one tab while studying" appears on Progress; no data corruption visible |
| Reload mid-quiz | Position restored (lesson study) or draft restored (Messer); calm copy |
| Switch to another tab + back | OfflineStatusBanner is gone, no flicker |

**Pass:** Their interruptions don't translate into anxiety.

---

## Persona 4 — Serious exam candidate (2 weeks out)

**Prompt:** *"Get me ready for my Security+ in two weeks."*

| Step | Pass criteria |
|------|---------------|
| Practice exam draft | Resume card surfaces if mid-exam |
| Weak page | Top button is "Fix this mistake" → most recent miss |
| Readiness score | Honest — not framed as a CompTIA prediction |
| Cloud sync stub | They see "Not connected" and "local still works" — not led to think it's broken |
| Export | One click on Progress; file downloads |
| Re-import | One click; replaces device copy after confirmation |

**Pass:** They feel **in control of their data** and **steered to weak spots** without nagging.

---

## Persona 5 — No-AI / no-PDF user (privacy-leaning)

**Prompt:** *"Don't connect anything. Just study."*

| Step | Pass criteria |
|------|---------------|
| AI tutor badge | Reads **Built-in coach** when offline; same shape promised every time |
| PDF setup skipped | Lessons still complete; PDF guides hidden or labeled "optional" |
| Notes save | Local-only; no upload; trust copy reflects this |
| Cloud sync card | Shows planned features but disabled; nothing pretends to connect |
| Export | Works exactly the same as for the AI user |

**Pass:** The app feels **just as good without AI/PDF** as with them.

---

## Observation checklist (use for all personas)

- [ ] Did they hesitate for **>5 seconds** anywhere? Where?
- [ ] Did they **scroll past** the primary action without seeing it?
- [ ] Did they ask **"what does this mean?"** about any badge / label?
- [ ] Did they **second-guess** their progress was saved?
- [ ] Did they **get to first win** in under 10 minutes?
- [ ] Did they **come back** for a second loop without prompting?

---

## When to ship

Ship the next change when **at least 4 of 5** personas pass their criteria with **no critical hesitation**. A single critical block in any persona = block ship.

See `USER_TEST_SCORECARD.md` for the recording template.
