# Human Clarity Audit

## Findings summary

Residual jargon remains in **coach deep-links** (`/practice-exams` in coached steps — power-user friendly, beginner-opaque). **Lesson page** terminology (“Brain Book”, “MUST highlights”) is pedagogical-branding consistent with Messer style — acceptable if users watch Start Here once.

Smart Coach copy mixes **exam-realism framing** — good emotionally, dense for fatigued users.

---

## Safe fixes applied (this pass)

| Before | After | Where |
|--------|-------|-------|
| `Bring your own PDFs — IndexedDB` | `Your PDF copies stay in this browser only` | `ProgressPage` PDF subsection subtitle |
| `… / N registry slots` | `… / N listed guides` | `ProgressPage` PDF stats line |
| `Hottest streaks: abc123…(n)` internal ids | `Cards you tapped Again most: "{front snippets}" (n×)` | `ProgressPage` flashcard streak |
| `Saved: messer-course-notes-v107 (high confidence)` style id leak | `Saved "{Professor Messer… title}" — filename match: …` | `PdfSetupPage` batch success rows |
| `Removed pdfId…` | `Removed "{readable title}"…` | `PdfSetupPage` remove notice |
| `Add PDF for monospace id` banner | Bold **human-readable registry title** from `PDF_REGISTRY` | `PdfSetupPage` `?need=` banner |

---

## Remaining wording candidates (no code change yet)

| Location issue | Recommendation | Severity |
|----------------|----------------|----------|
| `nextStepEngine` bullets with raw `/lesson/` paths | Replace with UI labels (“Open Practice exams”) | Medium |
| `Import lesson (authors)` nav | Rename to **Import authoring data** when non-authors stumble | Low |
| “verification slots” (video validator report) dev-facing | Hide from learner UI *(not in SPA)* ✓ |

---
