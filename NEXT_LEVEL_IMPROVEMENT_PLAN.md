# Next-level improvement plan

Grouped backlog after full-product review. **Safe implementation** favors copy, UX clarity, accessibility, validators, docs, and non-breaking UI. **Risk** is relative to regressions + learner trust.

| Priority | Meaning |
|---------|---------|
| **CRITICAL** | Data loss, security, misleading exam guarantees, or broken core loop |
| **HIGH** | Frequent friction, mobile blockage, tutor trust, deployment confusion |
| **MEDIUM** | Learning effectiveness polish, denser onboarding |
| **LOW** | Visual nit, wording only |
| **FUTURE** | Larger UX systems or measurable research-led changes |

---

## CRITICAL

| Issue | Why it matters | File(s) | Exact fix | Risk | Expected score impact |
|-------|----------------|---------|-----------|------|-------------------------|
| **Import/merge misunderstandings** | User may overwrite progress | Export/import UX | Guardrails: confirm dialog, backup reminder, documented merge semantics | Med if mishandled | Trust +5 if done right |
| **Invalid env = “broken product” assumption** | Support noise, trust loss | `DEPLOYMENT.md`, tutor UI | Emphasize offline-first; checklist | Low | Trust +3 |

*(No unresolved CRITICAL code issues identified in review; treat import semantics as ongoing product discipline.)*

---

## HIGH

| Issue | Why it matters | File(s) | Exact fix | Risk | Expected score impact |
|-------|----------------|---------|-----------|------|-------------------------|
| **Primary action clarity** | Competing CTAs confuse phone users | Dashboard, key pages | Primary vs secondary hierarchy; tuck under More where already pattern | Low | Zero-think +4 |
| **Tutor degraded path** | Feels dumb when offline | `AITutorPanel`, `server/prompts.ts`, built-in fallbacks | Constrain prompts: answer + key points + exam tip + imperative next step | Low | AI usefulness +3 |
| **PBQ / lab mobile density** | Tap errors, fatigue | PBQ + Elite Lab layouts | Larger hit targets, sticky actions, no horizontal scroll | Med | Mobile +5 |
| **404 / error boundaries** | Dead ends break trust | `NotFoundPage`, boundaries | Ensure visible recovery links | Low | Technical +2 |

---

## MEDIUM

| Issue | Why it matters | File(s) | Exact fix | Risk | Expected score impact |
|-------|----------------|---------|-----------|------|-------------------------|
| **Weak area psychology** | Feels punitive | `WeakPage` | Repair framing, healthy queue copy | Low | Retention +3 |
| **PDF resume** | Drop-off mid guide | PDF guide flow | Resume chip + “next 5 min” | Med | PDF loop +4 |
| **Spaced repetition prompts** | Needs nudges without spam | Smart Coach / home | Calm copy for “next review” | Low | Learning +3 |
| **Session30 / streak** | Motivation without childish gamification | Session UI | Subtle progress, identity copy | Low | Retention +2 |

---

## LOW

| Issue | Why it matters | File(s) | Exact fix | Risk | Expected score impact |
|-------|----------------|---------|-----------|------|-------------------------|
| **Microcopy drift** | Same concept, different labels | Various | Glossary alignment | Low | Clarity +1 |
| **Focus ring consistency** | Keyboard users | `index.css`, components | `:focus-visible` inheritance | Low | A11y +1 |

---

## FUTURE

| Issue | Why it matters | File(s) | Exact fix | Risk | Expected score impact |
|-------|----------------|---------|-----------|------|-------------------------|
| **Research-backed schedules** | True FSRS or calendar sync | New module | Design + privacy review | High | Learning +10 long-term |
| **Deeper LMS analytics** | Nice-to-have | N/A | Out of scope for local-first | Med | Product +optional |

---

## Safe implementation already aligned with this plan

Examples of **allowed** edits: trust strips on Progress/Weak, clearer empty decks on Flashcards, stricter tutor JSON wording in `server/prompts.ts`, expanded `DEPLOYMENT.md`, `aria-expanded` boolean strings for tooling, validators left strict.

Examples of **avoid unless explicitly requested**: changing score math for domains, rewriting storage schemas, deleting features.
