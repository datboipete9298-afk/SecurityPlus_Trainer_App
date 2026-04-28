# EDGE_CASE_DESTRUCTION REPORT

**Approach:** Code-path reasoning — not exhaustive automated breakage tests.

---

| Edge | Expected behavior | Residual risk |
|------|-------------------|---------------|
| **Refresh mid-quiz (lesson)** | React state resets; **position lost** (`QuizPage`). Stats may double-count if user re-submits same Q ids in new run — investigate if `recordQuiz` dedupes per session only. | Medium confusion; possible analytics skew. |
| **Refresh Messer exam** | Draft load from `practiceExamDraft` — **recoverable**. | Low. |
| **Lose connection mid-AI** | Timeout / catch → fallback message. | Low. |
| **Wrong PDF** | Guide still renders structure; tutor can say file missing (`pdfFileAvailable`). | Medium — user must self-correct. |
| **Corrupted PDF (viewer)** | Depends on PDF.js path — not fully audited here. | Unknown — manual test. |
| **IndexedDB failure** | If `ProgressProvider` throws on init, app may error — **ErrorBoundary** catches render errors, not all async init failures. | Medium — verify storage init try/catch. |
| **Route not found** | `NotFoundPage` — excellent. | Low. |
| **Partial progress** | Local state merge — generally OK; import merge is user-driven. | Medium on bad import JSON (validators exist at import UI level — confirm). |
| **Multiple tabs** | last-write-wins risk for `localStorage` — **classic** single-tab hazard. | High for power users; document “one tab”. |
| **Slow mobile** | Large lesson pages + hydration + spinners — tolerable but scroll cost remains. | Medium UX. |

---

## Must not claim

- “No crashes” — not proven without E2E + crash analytics.

---

*End Phase 6.*
