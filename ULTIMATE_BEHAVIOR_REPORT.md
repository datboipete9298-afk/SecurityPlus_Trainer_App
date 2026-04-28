# ULTIMATE BEHAVIOR REPORT (Simulated Flows)

**Scope:** Code-informed simulation of `SecurityPlus_Trainer_App` — not live user testing.  
**Honesty:** Friction and trust gaps are called out even when architecture is strong.

---

## 1. Cold open → Home

| Aspect | Likely user thought | Friction / risk |
|--------|---------------------|-----------------|
| First paint | “Loads fast” (lazy routes + `PageFallback` with `aria-live`) | Route chunks on slow networks = visible spinner; acceptable. |
| Mental model | “Where do I start?” | Dashboard is dense: multiple cards (resume, daily min, practice exam, labs). **Skilled users** find power; **beginners** may scan too long before acting. |
| Trust | Local-first messaging exists (`TrustReminderStrip`, export copy) | Strong. |

**Hesitation point:** Competing next actions (Continue, lesson, quiz, weak, PDF) without a single forced “one thing” for anonymous new users who skip onboarding.

---

## 2. Skip Start Here

- **HomeGate** always loads Dashboard — no wall (`HomeGate.tsx`). Good.
- **Risk:** User never sees structured orientation; relies on `OnboardingHintBanner` / `ResumeWhereCard` visibility. Skippers may underuse PDF + fusion features.

---

## 3–7. Lesson → VideoStudyMode → Pause → Quick check → Wrong answer

- **Fusion strip** is logically ordered (video → pause → note → QC → Continue).
- **Hesitation:** Full lesson path still has FAQ, stepper, “More ways to learn,” and sidebar tutor → **attention competition**. Simple mode reduces this deliberately.
- **Wrong answer on QC:** Inline feedback exists; reinforces keyword. Trust remains if copy avoids blame (verify tone in FeedbackPanel elsewhere).
- **Simple mode progress:** Relies on fusion save setting `notesSaved` / `videoWatched` in minimal path — must stay consistent with `isSimpleLessonProgressComplete`.

---

## 8. Weak area flow

- Domain scores drive weak-area strings in tutor and dashboard — **effective if user understands domain model**. Novices may not map “Domain 3” to study actions without reading `/weak`.

---

## 9. Flashcards

- Miss-driven cards + manual adds — recall loop exists.
- **Friction:** Multiple surfaces create cards (quiz miss, fusion, PDF selection); user might not realize **single** review pipeline on `/flashcards`.

---

## 10. PDF setup + guides

- **Strength:** Guided routes and “PDF not on device” tutor copy (`AITutorPanel` pdf block).
- **Risk:** IndexedDB PDF storage + mental model “file lives in browser” → confusion if user clears site data without export.

---

## 11. AI tutor (with / without API)

- **Strength:** `postAi` has **18s timeout**; failures append structured offline coach (`ai_network_timeout`, generic catch). “Guided” vs “offline” badges set expectations.
- **Risk:** Requires `VITE_AI_API_BASE` — without it, users get offline coach immediately (good); with wrong base, **timeouts** until fallback (bearable).

---

## 12. Elite lab (fail + pass)

- Not exhaustively traced in this pass; training validators green. Assume fail→feedback path depends on elite lab templates (verify in manual QA).

---

## 13. Practice exam (draft + resume)

- **Messer exams:** Draft resume via `practiceExamDraft` (`QuizPage` effects). Strong.
- **Lesson quiz (`!isMesser`):** Position **not** restored on refresh → user may think progress “lost.”

---

## 14. Progress + export

- Export + trust copy on Progress page align with privacy story.
- **Friction:** Export is user-triggered — if buried, anxious users fear data loss.

---

## 15. Close app → return

- `ProgressProvider` + `storage.ts` persistence — works if same browser profile; **multi-device** expectation gap remains (documented vs assumed).

---

## 16–20. Mobile / slow / offline / PDF / routes

| Scenario | Finding |
|---------|---------|
| Mobile | Tutor collapsible; `VideoStudyMode` phone hints. Touch targets often 44px+ — good direction. |
| Slow network | AI timeout + spinner; lazy routes add second wait. |
| No network | API calls fail → offline tutor text; static app shell works if loaded. Initial load requires network unless PWA/service worker (not assumed). |
| Missing PDFs | Explicit “add PDF” messaging in tutor context. |
| Broken routes | `NotFoundPage` reassures persistence + links Home/search/roadmap — **strong trust recovery.** |

---

## Stops / drop-off hypotheses (unvalidated)

1. Dashboard overload before first win.  
2. Lesson page length for full mode (scroll fatigue on phone).  
3. Quiz refresh surprise (lesson study).  
4. AI expectations when user believes “Live AI” but gets structured offline text.

---

*End Phase 1.*
