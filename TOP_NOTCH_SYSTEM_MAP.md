# Top-Notch System Map — Security+ Trainer App

**Project:** `C:\Users\Petey\Desktop\SecurityPlus_Trainer_App`  
**Stack:** React 18 · TypeScript · Vite 5 · Tailwind 3 · React Router 6 · Express AI server (optional) · localStorage persistence  

This document maps **routes, pages, components, data, engines, validators, AI, storage, deployment, and docs**, with **purpose, connections, failure modes, importance, and improvement ideas**.

---

## 1. Routes → Pages

| Path | Component | What it does |
|------|-----------|--------------|
| `/` | `HomeGate` → lazy `Dashboard` | If `onboarding.hasSeenStartHere` is false → redirect `/start-here`; else dashboard. |
| `/start-here` | `StartHere` | First-run orientation; sets onboarding when done. |
| `/watch/:id` | `WatchLesson` | Video-first view + embed + links to full lesson/quiz. |
| `/roadmap` | `Roadmap` | Messer-ordered lesson list / navigation. |
| `/lesson/:id` | `LessonPage` | Full lesson: video, highlights, notes, labs block, quiz links, simple vs full mode. |
| `/practice` | `PracticePage` | Hub for practice exams, flashcards, PBQ, weak, search. |
| `/practice-exams` | `PracticeExamsPage` | Exams A/B/C, quick practice, readiness card. |
| `/practice-exams/pbq`, `/pbq` | `PracticePbqHubPage` | PBQ lab list + banner. |
| `/pbq/:id` | `PbqRunnerPage` | Single PBQ ordering/matching drill. |
| `/progress` | `ProgressPage` | Scores, history, import/export, daily minimum card. |
| `/session` | `Session30` | 30-minute timed study phases. |
| `/quiz/:id` | `QuizPage` | Lesson quizzes + Messer exams; `mode=exam|study`, `quick=N`, wrong-only, multi-select. |
| `/flashcards` | `FlashcardsPage` | Spaced repetition + user cards; optional `?lesson=`. |
| `/weak` | `WeakPage` | Miss journal + domain weak list + flashcard batch. |
| `/search` | `SearchPage` | Keyword search lessons/questions/cards/labs. |
| `/sim` | `SimPage` | Labs catalog slice + branching simulation UI. |
| `/import` | `ImportPage` | **Author** lesson JSON validator (not progress import). |
| `/boss`, `/boss/:id` | `BossHub`, `BossFight` | Milestone scenario quizzes. |
| `*` | `Navigate` → `/` | SPA fallback. |

**Connections:** All pages sit under `Layout` (nav, beginner/simple toggles, mobile drawer, `MobileStickyContinue`). State from `ProgressContext`.

**What could break:** Deep links to missing lesson IDs show “not found” states; quiz IDs must exist in `quizzes.ts`.  

**Importance:** Critical — routing is the product skeleton.  

**Improve:** Optional route-level error boundary per section; explicit `/dashboard` alias if users bookmark it (currently `/` only).

---

## 2. Major components (selected)

| Component | Role | Connects to | Failure / risk |
|-----------|------|-------------|----------------|
| `Layout` | Shell, nav, safe-area, modes | `ProgressContext`, `MobileStickyContinue` | Mobile drawer focus trap incomplete (Escape only). |
| `HomeGate` | Onboarding gate | `localStorage` onboarding flag | Users can get stuck if flag corrupt — rare. |
| `AppShell` | `space-y-*` wrapper | Pages | Purely presentational. |
| `PageHeader` | Title, purpose, badge | All major pages | Copy quality drives beginner clarity. |
| `NextActionCard` | CTA pattern | `nextStep` engine | If engine wrong, CTAs mislead — validate with smoke tests. |
| `ContinueButton` | Smart continue | `getNextStep` | Same as above. |
| `AITutorPanel` | AI + fallback tutor | `aiClient`, `aiTutorFallback`, context props | Network, rate limits, exam lock must stay correct. |
| `VideoEmbed` | YouTube | `videoMap`, lesson id | Broken video IDs caught by `validate:videos`. |
| `DailyMinimumCard` | Low-pressure day plan | `COURSE_TOUR_LINKS`, optional `lessonId` | Links must stay aligned with `nextLesson`. |
| `FeedbackPanel`, `ConfidenceSelector`, `MicroTeachBack` | Adaptive tutoring UI | `feedbackEngine`, `ProgressContext` | Schema drift in `feedbackLoop`. |
| `TrainingPlatformBlock` | Labs/sims/decisions per lesson | `labs`, `simulations`, training engines | Data must match `validate:training`. |
| `LabRunner`, `SimulationRunner`, `DecisionPanel` | Hands-on execution | `recordTraining*` | Progress not synced across devices (by design). |
| `MobileStickyContinue` | Sticky mobile CTA | `nextStep` | Can obscure content — padding on `main` compensates. |

**Improve:** Shared “screen contract” snippet (what / why / first / next / if wrong) in `PageHeader` docs for authors.

---

## 3. Data files (`src/data/`)

| Area | Files | Role |
|------|-------|------|
| Curriculum | `lessons.ts`, `lessonsBase.ts`, `lessonFactory.ts`, `outlineLessons.ts`, `sectionOrder.ts` | Lesson objects, order, Messer alignment. |
| Video | `videoMap.ts`, `knownYoutubeIds.ts`, `videoConstants.ts` | Map lesson → YouTube id. |
| Assessment | `quizzes.ts`, `messer/*.ts`, `quizGenerator.ts` | 717 questions incl. exams A/B/C. |
| Cards | `flashcards.ts`, `flashcardEngine.ts` | Built-in + helpers. |
| PBQ | `pbqCatalog.ts` | PBQ scenarios + journal title helper. |
| Training | `labs.ts`, `simulations.ts` | Hands-on definitions. |
| Boss | `bossFights.ts` | Boss scenarios. |
| Coach | `beginnerPath.ts` | Tour links, first lesson ids. |
| Misc | `glossary.ts`, `domain1Extended.ts`, `domain2Bulk.ts` | Supplemental content. |

**Validators:** `validate-app-data`, `validate-feedback-data`, `validate-training`, `validate-videos` keep IDs and counts consistent.

**What could break:** Reordering `SECTION_ORDER` without updating lessons/quizzes/videos; duplicate question ids; missing `hasFullContent` flags.

**Improve:** Optional script to diff “lessons without quiz rows” automatically (partially covered by validate:data).

---

## 4. Engines & core logic (`src/core/`)

| Module | Function |
|--------|----------|
| `nextStepEngine.ts` | **Smart Coach “next step”** — lesson, repair, cards, boss, etc. |
| `learningObserver.ts` | Profile signals for dashboard / AI context. |
| `learningFlow.ts` | Flow helpers for beginner journey. |
| `adaptiveEngine.ts` | Tiered explanations, confusion signals. |
| `feedbackEngine.ts` | Quiz feedback, flashcard tutor copy, teach-back prompts. |
| `memoryEngine.ts`, `thinkingPatterns.ts` | Recall / pattern nudges. |
| `labEngine.ts`, `simulationEngine.ts`, `decisionEngine.ts` | Training interactions. |
| `trainingProgress.ts`, `trainingHash.ts` | Training run bookkeeping. |
| `noteAnalyzer.ts` | Note quality / structure signals. |

**Connections:** Consumed by `ProgressContext`, `QuizPage`, `LessonPage`, `Dashboard`, `AITutorPanel` context builders.

**Failure modes:** Heavy `useMemo` deps missing → stale coach; import cycles (watch when refactoring).

**Improve:** Unit tests on `nextStepEngine` for golden paths (new user, all complete, weak-only).

---

## 5. Utilities (`src/utils/`)

| File | Role |
|------|------|
| `storage.ts` | **localStorage** key `spt_v1_state`, schema version, migrations, import/export. |
| `examReadinessScore.ts` | Readiness label + score heuristic. |
| `readinessBand.ts` | Human-facing band copy (“Getting it”, etc.). |
| `adaptive.ts` | Legacy / supplemental adaptive helpers, unlock rules. |
| `sessionResume.ts` | Resume labels for dashboard. |
| `lessonNoteIntelligence.ts` | Highlight / note hints for lessons. |
| `beginnerLayer.ts` | Extra copy when `beginnerMode`. |

**Failure modes:** Quota exceeded, private browsing, corrupt JSON — `loadState` backs up corrupt blob and resets.

**Improve:** Optional export reminder toast once per week.

---

## 6. Context

**`ProgressContext.tsx`** — Single source of truth: loads `loadState()`, exposes state + mutations (`completeLesson`, `recordQuiz`, `patchLessonProgress`, AI-related, training, PBQ, practice exam attempts, `setBeginnerMode`, `setSimpleLessonMode`, etc.).

**Risk:** Any mutation that skips `migrateAndNormalize` on import can brick older saves — mitigated in `importStateFromJson`.

---

## 7. AI system

| Piece | Role |
|-------|------|
| **Browser** | `src/lib/aiClient.ts` — `POST` to `${VITE_AI_API_BASE}/api/ai/*`; `checkAiHealth`. |
| **Browser** | `src/lib/aiTutorFallback.ts` — offline / error copy. |
| **Server** | `server/index.ts` — Express, CORS, routes under `/api/ai/*`. |
| **Server** | `server/aiCore.ts`, `server/prompts.ts`, `server/safety.ts`, `server/rateLimit.ts`, `server/openaiClient.ts` | Prompting, limits, API key usage. |
| **Serverless-style** | `api/ai/*.ts` | Vercel handlers sharing `_shared.ts` logic. |

**Dev proxy:** `vite.config.ts` proxies `/api` → `http://localhost:8787` (matches `AI_SERVER_PORT` default).

**Security:** API key must stay server-side; frontend only sends context JSON.

**Failure:** Missing `VITE_AI_API_BASE` in production → fetch fails → fallback tutor.

---

## 8. Validators (`scripts/`)

| Script | Checks |
|--------|--------|
| `validate-app-data.ts` | Lesson count, questions, flashcards, Messer exam row counts. |
| `validate-feedback-data.ts` | Per-question feedback integrity. |
| `validate-training-system.ts` | ≥2 labs, ≥2 sims, decision per full lesson. |
| `validate-videos.mjs` | Video IDs vs lessons; writes `VIDEO_ALIGNMENT_REPORT.md`. |
| `validate-ai-system.mjs` / `.ts` | AI wiring sanity. |
| `validate-ai-integration.mjs` | Integration checks. |
| `validate-app-data.mjs` / `validate-training-system.mjs` | Node duplicates for CI without tsx. |

**Build:** `npm run build` runs data + feedback + training + videos (not always ai — see `package.json`).

---

## 9. Storage schema (high level)

`PersistedState` in `storage.ts`: xp, streak, completed lessons, question stats, notes, missed journal, domain scores, lesson progress, practice exam attempts, training runs, feedback loop, PBQ passes, onboarding, beginner/simple flags, user flashcards, etc.

**Migrations:** `migrateAndNormalize` fills defaults and bumps `schemaVersion`.

---

## 10. Deployment

| Asset | Purpose |
|-------|---------|
| `vercel.json` | SPA rewrite to `index.html`. |
| `vite.config.ts` | Build + dev API proxy. |
| `DEPLOYMENT_GUIDE.md`, `FRIEND_ACCESS_GUIDE.md`, `AI_DEPLOYMENT_CHECKLIST.md` | Host + env instructions. |

**Production AI:** Deploy API routes or separate server; set `VITE_AI_API_BASE` to public API origin.

---

## 11. Documentation index

| Doc | Audience |
|-----|----------|
| `README.md` | Developers + quick start. |
| `ACTIVE_PROJECT_PATH.md` | Which folder is canonical (not HeliosII). |
| `README_AI_SETUP.md` | OpenAI / env. |
| `DEPLOYMENT_GUIDE.md` | Vercel / Netlify. |
| `FRIEND_ACCESS_GUIDE.md` | Sharing a link. |
| `SMOKE_TEST_PLAN.md` | QA paths. |
| `MOBILE_QA_CHECKLIST.md` | Phone testing. |
| `STUDY_READY_CHECKLIST.md` | Learner readiness. |
| `VIDEO_ALIGNMENT_REPORT.md` | Generated video audit. |
| `FINAL_AUDIT_REPORT.md` | Prior audit snapshot. |
| **This file** | Architecture map. |
| `TOP_NOTCH_AUDIT_REPORT.md` | Issues + expert lenses. |
| `TOP_NOTCH_IMPROVEMENT_PLAN.md` | Prioritized follow-ups. |
| `FRIEND_READY_CHECKLIST.md` | Pre-share for friends. |
| `FINAL_PRE_SHARE_CHECKLIST.md` | Maintainer release gate. |

---

## 12. How everything connects (diagram)

```mermaid
flowchart LR
  subgraph browser [Browser]
    Layout --> Pages
    Pages --> ProgressContext
    ProgressContext --> storage[localStorage]
    Pages --> aiClient
    aiClient --> API[/api/ai]
  end
  subgraph build [Build / CI]
    validators[validate-* scripts] --> vite[Vite build]
  end
  subgraph data [Curriculum]
    lessons --> quizzes
    lessons --> flashcards
    lessons --> videoMap
  end
  Pages --> data
  validators --> data
```

---

*End of system map. Update this file when adding routes, validators, or persistence fields.*
