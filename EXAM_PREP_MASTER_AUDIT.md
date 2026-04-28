# Security+ Exam-Prep Master Audit (SY0-701)

## Strengths

- **Messer-aligned ordering** enforced via `ORDERED_LESSON_IDS` validators.
- **Video alignment validator** catches drift (VIDEO_ALIGNMENT_REPORT generated).
- **717 questions + feedback validators** reduce broken explanations.
- **PBQs labeled as practice-performance** scenarios — separate from Pearson item banks.
- **Exam mode AI lock**: prevents cheating during mocks (server + tutor surface).
- **Domain scores + readiness band**: honest composite (not pretending to quote CompTIA cut scores everywhere).

## Risks / limitations

| Risk | Explanation |
|------|----------------|
| **Readiness ≠ pass guarantee** | Composite model; disclaimers vary by screen — unify “practice signal only”? |
| **Weak domain cold-start** | Default-ish scores push early users to Weak page — intentional but can demotivate. |
| **Messer exam A/B/C** | Validated rows (85/85/85) — user must own exam files; app never ships them. |
| **Elite labs** | Synthetic SOC — transfer to PBQ good, not 1:1 with live exam UI. |
| **Boss fights** | Gamified — could distract purists; optional path. |

## Official exam reminder — where to reinforce

- **Practice exams page** — good place for “CompTIA owns item wording; this is practice-style.”
- **Quiz feedback** — already exam-keyword oriented.
- **Progress page readiness** — ensure label never says “predicted pass”.

## Scores framing

- Practice exam % = app bank performance, not scaled CompTIA score — **verify** `PracticeExamsPage` / `ExamReport` strings.

---
