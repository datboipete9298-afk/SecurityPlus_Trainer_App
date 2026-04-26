# OPERATIONAL_AUDIT

Operational review of navigation, progress, and storage (2026-04-25).

## Checks (1–20)

| # | Question | Status |
|---|----------|--------|
| 1 | Dashboard shows a clear next action | **OK** — `ContinueButton` + `nextStep` from `nextStepEngine` |
| 2 | Start goes to the right place | **OK** — `HomeGate` → `/start-here` until seen |
| 3 | Continue always sensible | **Mostly** — edge cases if all lessons complete (engine should still suggest review) |
| 4 | `nextStepEngine` prioritizes | **OK** — single source for coach + CTA |
| 5 | Smart Coach useful | **OK** — aligned with `getNextStepCoachingLines` |
| 6 | Beginner mode default | **OK** — `beginnerMode: true` in defaults |
| 7 | Locked blocks explain why | **OK** — `WatchLesson` / gating copy |
| 8 | Lesson completion criteria | **OK** — checklist in `LessonPage` / progress patches |
| 9 | Quiz affects progress | **OK** — `recordQuiz` + lesson `quizCompleted` on lesson quizzes |
| 10 | Flashcards affect readiness | **OK** — `examReadiness` uses spaced + coverage |
| 11 | Labs affect readiness | **Indirect** — via completion / skip signals |
| 12 | Boss fights affect readiness | **OK** — XP + `applyBossFailure` |
| 13 | Weak areas change recommendations | **OK** — `missedJournal` + domain scores |
| 14 | Storage survives reload | **OK** — `useEffect` save in provider |
| 15 | Corrupt storage recovers | **OK** — try/catch + corrupt backup key |
| 16 | Export/import progress | **OK** — `ImportPage` + `exportStateJson` / `importStateFromJson` |
| 17 | Dead links | **Spot-check** — external Messer/YouTube HTTPS |
| 18 | Hidden routes | **Reduced** — Practice exams + PBQ in Layout “More” + Practice page |
| 19 | Pages without next step | **Partial** — hub pages add links; full “next panel” per page still roadmap |
| 20 | MVP leftovers | **Low** — `MVP_LESSON_IDS` deprecated alias remains for imports |

## Fixes applied this pass

- **Practice exam hub** (`/practice-exams`) with readiness, counts, exam/study entry, miss review, flashcard batch hint.
- **`practiceExamAttempts`** in persisted state for score history.
- **Messer flashcards** show all correct options for multi-select.
- **PBQ fail** → `recordPbqMiss` (domain score + journal).

## Recommended next fixes

- Add a small **NextActionCard** component reused on `LessonPage`, `Dashboard`, `Roadmap` for absolute consistency.

## Shipped this pass

- **Error boundary:** `AppErrorBoundary` wraps `App` in `main.tsx` (reload + home; does not wipe storage).
