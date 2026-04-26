# FEATURE_ROADMAP

Grouped by value. **Quick wins** are small UI/data tweaks; **major** items need design + time.

## A. Learning flow

- **Quick:** “Resume last session” chip using `lessonProgress` + last quiz id.
- **Major:** Today’s Study Plan generator; weekly review; 10-min / 30-min / 1-hr session presets; cram mode scheduler.

## B. Video

- **Quick:** Already: verification banner, playlist + course links on `WatchLesson`.
- **Major:** Timestamp chapters if you add structured data; pause-quiz sync.

## C. Highlighting

- **Quick:** “Too many highlights” warning when count > 10.
- **Major:** Highlight discipline score + export.

## D. Brain Book

- **Major:** Export notes JSON/Markdown; search; “explain simpler” via local templates (no copyright paste).

## E. Quizzes

- **Quick:** Timer optional on practice exams.
- **Major:** Bookmark / report question; confidence per item; domain-only mixed quiz.

## F. Flashcards

- **Major:** True SM-2 or FSRS-lite; due count on dashboard; auto-queue from highlights.

## G. Labs

- **Quick:** Time estimate + difficulty on `labs.ts` display.
- **Major:** Completion proof screenshot stub; portfolio export.

## H. PBQs

- **Done (v1):** 10 original ordering labs + `/pbq/:id`.
- **Major:** Drag/drop; firewall rule builder mini-DSL; certificate chain diagram (original art).

## I. Adaptive coach

- **Quick:** Surface last practice exam % in coach text.
- **Major:** Burnout / session length heuristic; readiness trend chart.

## J. Progress

- **Quick:** PBQ pass/fail optional counter in state (if you want history beyond journal).
- **Major:** Domain mastery chart; import merge strategies.

## K. Gamification

- **Major:** Badges for exam milestones; daily missions beyond current flag.

## L. Job prep

- **Major:** STAR story builder; resume bullets from completed labs (user-entered).

## M. Quality / ops

- **Done:** `validate:data`, `validate:videos`, pre-build hook; `VIDEO_ALIGNMENT_REPORT.md`.
- **Major:** E2E Playwright smoke; error boundary + issue toast.

---

**Highest ROI next:** timed exam UI + session summary modal + dashboard “last exam score” strip.
