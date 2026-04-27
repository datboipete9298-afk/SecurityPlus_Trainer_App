# Master expert review (multi-role simulation)

**Project:** SecurityPlus Trainer App · **Scope:** Expert-level product + learning + engineering critique (not a basic QA pass).

---

## Phase 1 — Full system walkthrough (what happens, what can go wrong)

| Step | User sees | Expected action | Next obvious? | Confuse / break | Trust driver |
|------|-----------|-----------------|---------------|-----------------|--------------|
| Land `/` | Dashboard, coach, resume, optional onboarding banner | Start session / Continue | **Yes** — primary CTAs | Too much text for some | Backup card, honest readiness |
| Start Here | Step list, links | Follow or dismiss | **Medium** — long page | Skip → still OK (defensive UX) | Plain language |
| Roadmap | Locked/unlocked rows | Pick next lesson | **Yes** | Skip prerequisites if confused | Clear lock rules |
| Lesson | Dense UI: video, notes, labs | Multi-modal study | **Medium** — cognitive load | Tab overload on phone | Traps + teach-back |
| Watch | Chunk prompts, embed | Watch + pause | **Yes** | YouTube offline | Simple structure |
| Quiz | MCQ / multi-select, feedback | Answer → explain | **Yes** | 3-miss gate stops advance | Repair panel |
| Flashcards | Deck + spacing | Flip / grade | **Yes** | — | Mistake-driven cards |
| Weak | 3 actions + collapsible detail | Repair | **Yes** | — | Honest domain copy |
| Practice exams | Exam vs study | Choose mode | **Yes** | Session draft lost if cleared | Draft disclaimers |
| PBQ | Order lab | Reorder + submit | **Yes** | Fail → domain nudge | “Not official” messaging |
| Labs/Sims | Checklist + branching sim | Read + tap | **Medium** | No per-step persistence | Explicit resume note |
| Progress | Export/import | Backup | **Yes** | Wrong JSON type | Clarified import vs content |
| Return later | Resume card + tier sort | One tap | **Yes** | localStorage cleared | Export nudges |

**Quit triggers:** overwhelm on first lesson, readiness misread as guarantee, AI “broken” when no server, exam draft loss, accidental import overwrite.

---

## Phase 2 — Role-by-role (26 lenses)

Scores are **honest** — 100 means “no meaningful gap for this lens.”

### Engineering & architecture (1–4)

| Role | Praise | Criticize | Biggest risk | Best fix | /100 |
|------|--------|-----------|--------------|----------|------|
| **Senior full-stack** | Validators + migrateable `localStorage`, Express + Vercel API shape | No real backend for progress sync | Schema drift if migrations skipped | Versioned migrations + export warning | **86** |
| **Frontend architect** | Lazy routes, context boundary, coach engine separation | `LessonPage` bundle ~72kb — hot spot | Maintainability as lesson UI grows | Split lesson sub-panels | **84** |
| **React/TS expert** | Strict typing on AI payloads, hooks discipline | Few route-level error UIs beyond boundary | Rare render edge in quiz state machine | Narrow integration tests for quiz | **88** |

### Design & access (5–7)

| Role | Praise | Criticize | Risk | Fix | /100 |
|------|--------|-----------|------|-----|------|
| **UX/UI** | Purpose lines on pages, recovery panels | Dashboard information density | Cognitive overload | Progressive disclosure toggles | **82** |
| **Mobile designer** | 44px targets, sticky continue suppressed on quiz | AI panel max-height on small screens | Scroll fatigue | Collapsed tutor by default on xs | **78** |
| **A11y** | `aria-label` on panels, regions on recovery | Not a full WCAG audit | Screen reader quiz option order | Audit + live region for score changes | **72** |

### Quality & product (8–12)

| Role | Praise | Criticize | Risk | Fix | /100 |
|------|--------|-----------|------|-----|------|
| **QA automation** | Scriptable validators | No Playwright in repo | Regressions in flows | Add smoke E2E | **70** |
| **Manual QA** | Clear failure recovery paths | Many permutations of quiz modes | Human misses exam+draft edge | Checklist in `SMOKE_TEST_PLAN` | **85** |
| **Product manager** | Single `nextStep` queue | Feature surface area huge | Positioning blur | One-line value on dashboard | **80** |
| **SaaS founder** | Local-first = low COGS | No accounts = no LTV mechanics | Support burden on friends | Friend guide + backup | **76** |
| **Support lead** | Import/export documented | Users conflate two imports | Angry “lost progress” | In-app copy + Progress page note | **83** |

### Instruction & learning (12–17)

| Role | Praise | Criticize | Risk | Fix | /100 |
|------|--------|-----------|------|-----|------|
| **SY0-701 instructor** | Domain alignment, traps, PBQ thinking | Not a full course replacement | Gap vs official objectives map | Objective coverage matrix doc | **88** |
| **Messer-style coach** | Order + video map | Branding is user’s responsibility | Copyright/association confusion | Stay “aligned to” not “official” | **85** |
| **Exam strategist** | Exam mode discipline + review | Readiness can mislead | Overconfidence | Bigger disclaimer near score | **82** |
| **Learning scientist** | Quiz + spacing + feedback loop | Interleaving weak | Siloed by lesson path | Optional mixed review mode | **81** |
| **Cognitive psych** | Chunked watch, progression pause | Dense lesson first screen | Early overload | Beginner simplified rail | **79** |
| **Motivational design** | Streak, XP, identity lines | Lines can feel gimmicky | Cynical users bounce | Tone toggle / fewer lines | **77** |

### AI & ops (18–22)

| Role | Praise | Criticize | Risk | Fix | /100 |
|------|--------|-----------|------|-----|------|
| **AI tutor architect** | Grounded payloads, exam lock, fallbacks | Model can still hallucinate if live | Wrong “facts” remembered | Stronger “verify in lesson” footer | **80** |
| **OpenAI integration** | Key server-side, rate limit | Misconfigured `VITE_AI_API_BASE` | Silent 404 before fix | Health check skip if no base (fixed) | **86** |
| **DevOps** | `vercel.json` SPA fallback | AI routes need env in prod | Tutor offline in static deploy | Document proxy path | **82** |
| **Data validation** | Excellent scripts | — | — | Keep `build` mandatory | **92** |
| **Privacy/security** | Local-first | User pastes secrets in notes? | Accidental PII in exports | Warning on export | **84** |

### Personas (23–26)

| Persona | Praise | Criticize | Risk | Fix | /100 |
|---------|--------|-----------|------|-----|------|
| **Total beginner** | Start Here, quick win quiz | Vocabulary wall | Shame spiral | Glossary tooltips | **74** |
| **Fast passer** | Exams + weak repair | Time-to-first-exam unclear | Skips foundations | “Minimum before exam mode” hint | **81** |
| **Distracted phone user** | Touch targets, resume | Accidental nav | Fatigue | Fewer primaries per screen | **78** |
| **Friend, no instructions** | Dashboard still usable | No “what is this app” hero | Bounce | One hero sentence | **72** |

---

## Cross-cutting verdict

This is **credible exam-prep infrastructure** with **unusually strong data discipline** and **thoughtful defensive UX**. It is **not** a substitute for official CompTIA materials, and **readiness must stay framed as heuristic**. Biggest honest gap: **beginner emotional/cognitive load** + **mobile tutor ergonomics** + **automated E2E**.
