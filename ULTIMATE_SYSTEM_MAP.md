# Ultimate System Map — Security+ Trainer (`SY0-701`)

_Generated audit — maps architecture, coupling, risks, and improvement angles. Not a substitute for regression tests._

## Top-level topology

```
Browser SPA (Vite/React) ──► localStorage (spt_v1_state) + optional IndexedDB (PDF blobs)
                          ──► /api proxy (dev) ──► Express + OpenAI (optional)
```

Deployment: static `dist/` + `vercel.json` SPA fallback to `index.html`. AI server is **not** bundled; production AI requires a hosted API route or separate server with `OPENAI_API_KEY`.

---

## Routes → pages → user sees

| Route | Page / lazy | What it does | Depends on | Can break if |
|-------|----------------|-------------|------------|--------------|
| `/` | `HomeGate` → `Dashboard` | Home hub, Smart Coach strip, resume, daily cards | `ProgressContext`, `nextStepEngine` | Stale state, import corruption |
| `/start-here` | `StartHere` | First-run orientation | `onboarding` flags | None critical |
| `/watch/:id` | `WatchLesson` | Embedded video lesson | Lesson data + video IDs | Broken embed URL, offline |
| `/roadmap` | `Roadmap` | Linear Messer-style path | `ORDERED_LESSON_IDS`, completion | Missing lesson id |
| `/lesson/:id` | `LessonPage` (~108k) | Videos, Brain Book, training block, quizzes link, PDF shortcuts | Lessons + training labs | Wrong id → empty |
| `/practice` | `PracticePage` | Domain / topic practice hub | quizzes, routing | Navigation only |
| `/practice-exams` | `PracticeExamsPage` | Timed mocks, Messer A/B/C modes | quiz bank, drafts | Draft loss on clear storage |
| `/practice-exams/pbq`, `/pbq` redirect | PBQ hub | Lists PBQ scenarios | `pbqCatalog` | Rare route typos |
| `/pbq/:id` | `PbqRunnerPage` | Order / scenario PBQs | catalog + scoring | Wrong id → redirect home via `*` |
| `/quiz/:id` | `QuizPage` | Lesson quiz bank slice | `quizzes.ts` | Lesson id mismatch |
| `/flashcards` | `FlashcardsPage` | Spaced-lite + merged deck | `flashcards.ts`, user cards | Huge decks → cognitive load |
| `/weak` | `WeakPage` | Domain-weighted weaknesses | domain scores | Cold start low scores confuse |
| `/search` | `SearchPage` | Find lessons/terms | indexed content | Empty if no hits |
| `/sim` | `SimPage` | Lab listing / sim entry | training content | Thin if misconfigured |
| `/import` | `ImportPage` | Author/import JSON utilities | niche | Casual users confused |
| `/boss`, `/boss/:id` | Boss hub / fight | Gamified checks | boss config | Fail loops |
| `/pdf-guides` | Hub | PDF guide index | `pdfRegistry` | No PDF uploaded → guarded flows |
| `/pdf-setup` | Drag/drop attach | IndexedDB PDF save | `localPdfStore` | Private mode blocked |
| `/pdf-guides/:pdfId` | Pdf guide per book | Sections list | registry | 404-ish empty states |
| `/pdf-guides/:pdfId/:lessonId` | `PdfLessonGuidePage` | Highlights, checkpoints, tutor | IDB + progress | Wrong PDF |
| `/progress` | Export/import stats | Backup JSON | storage schema | Wrong JSON → import guard |
| `/session` | `Session30` | Time-box session | coach | Optional path |
| `*` | `Navigate → /` | Unknown routes vanish silently | router | Deep links lost (only minus) |

---

## Core data sources

| Source | Role | Depends on |
|--------|------|-------------|
| `src/data/lessons.ts` + `ORDERED_LESSON_IDS` | Curriculum spine | All lesson routes |
| `src/data/quizzes.ts` (~717 qs) | Validated quiz bank | Quiz, adaptive, readiness |
| `src/data/pdfGuides/*` | Per-lesson guided PDF copy | PDF lesson page |
| `src/data/pdfRegistry.ts` | BYO PDF metadata + matchers | Pdf setup, verifier |
| `src/data/videos*` (via validator) | YouTube/embed alignment | Watch, lesson |
| `src/data/pbqCatalog.ts` | PBQ scenarios | PBQ runner |

---

## Engines / subsystems

| Subsystem | Location | Purpose | Failure modes |
|-----------|----------|---------|---------------|
| **Progress persistence** | `utils/storage.ts` schema v12 | XP, completions, quiz stats, PBQ, PDF meta, elite portfolio | Migrates from older schemas; malformed JSON kills import |
| **Progress context** | `context/ProgressContext.tsx` | Single source of mutations + reconcile IDB ↔ meta | Heavy file; reconcile races on tab churn |
| **Smart Coach v2 / adaptive** | `utils/adaptive.ts`, `getSmartCoachOutput` | Messaging + leveling | Misleading when few quiz attempts |
| **Next step** | `core/nextStepEngine.ts` | Single “Continue” target | Overrides can feel preachy (/practice-exams in copy) |
| **Readiness / exam readiness** | `examReadinessScore.ts`, dashboard bands | Synthetic score | **Not CompTIA official** |
| **Lab engine** | `core/labEngine.ts` | Training lab shell | Elite vs generic mix |
| **Elite Lab Factory** | `eliteLab/*` | Generate SOC triage + score | Threshold tuning; deterministic seeds |
| **Learning observer** | `core/learningObserver.ts` | “Thinking alerts”, thin notes detection | Noise if thresholds tight |
| **Study resume** | `utils/studyResume.ts`, `sessionResume.ts` | Resume cues | Divergence if multi-tab |
| **Practice exam draft** | `utils/practiceExamDraft.ts` | Autosaved mock | localStorage cleared |
| **AI client** | `lib/aiClient.ts`, `postAi`, health check | Proxied chat | Offline → fallback |
| **AI quality** | `lib/aiResponseQuality.ts`, `enforceStructuredAiResponse` | Structure guard | Fallback when “weak” |
| **Fallback copy** | `lib/aiTutorFallback.ts` | Offline tutor | Same patter risk |
| **PDF local store** | `utils/localPdfStore.ts` | Blobs | Quota / Safari private |

---

## Servers / API

| Asset | Purpose |
|-------|---------|
| `server/index.ts` | Express, OpenAI route, cors |
| `server/prompts.ts` | Mode system prompts; elite SOC guardrails; PDF guard |
| `server/safety.ts` | Injection / abuse heuristics (if wired) |
| `api/` (if present for Vercel) | Edge/serverless equivalents — verify env in deploy |

Production on Vercel static hosting: **frontend must proxy to a hosted AI backend** — key never in bundled JS (verify `isAiApiBaseConfigured` reads env at build/runtime).

---

## Validators (CI truth)

Scripts in `package.json`:

- `validate:data`, `feedback`, `training`, `elite-labs`, `videos`, `pdf-guides`, `pdf-upload`, `ai`, `ai-integration`
- **`build`** runs most validators + `tsc -b` + `vite build`

---

## Improvement opportunities (architecture-level)

| Area | Issue | Suggestion |
|------|-------|-----------|
| **Single giant lesson page** | Hard to perf-test and reason about sections | Incremental refactor into sublayouts (risky; defer) |
| **Unknown route** | User loses URL | Dedicated “404” explanation + search link |
| **AI coupling** | Optional feature but prominent | Clearer badge when offline/guided |
| **Coach strings** | Internal paths like `/practice-exams` in markdown | Friendly labels for beginners |
| **Elite SOC** | Complexity | Portfolio + PDF links already mitigate |

---

_Last reviewed: codebase audit session._
