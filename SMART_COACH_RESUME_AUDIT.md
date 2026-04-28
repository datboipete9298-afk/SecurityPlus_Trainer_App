# Smart Coach + Resume Audit

## Smart Coach pipeline

Inputs: persisted state (`storage`), learning profile observer, quiz stats, bosses, spaced queue, misses, elite portfolio optional.

Outputs: **`getSmartCoachOutput`**/`coachV2` lines + **`getNextStep`** single deterministic primary link.

Dedupe principle: **`nextStepEngine`** is canonical navigation oracle; Dashboard `ContinueButton` + `FlowPrimaryStrip` consume **same engine**.

Resume surfaces:

| Surface | Logic | Failure mode |
|---------|-------|---------------|
| `ResumeWhereCard` | `studyResume` + session resume index | Divergent if simultaneous devices |
| `PracticeExamDraftResume` | `practiceExamDraft` local state | Clearing storage wipes |
| Dashboard textual cue | Composite | Low signal if user clears notes only |

Practice exam realism accent in **`applyExamRealismAccent`** modifies `why`/`steps` when readiness crosses thresholds — avoids premature “timed exam” overwhelm for novices ✅.

Potential improvement: shorten step strings referencing raw URLs for novice clarity (see backlog).

---
