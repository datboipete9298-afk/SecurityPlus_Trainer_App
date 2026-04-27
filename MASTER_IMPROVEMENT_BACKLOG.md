# Master improvement backlog

Prioritized from **multi-expert review** + failure-oriented analysis. **Priority score** = impact ÷ effort (subjective 1–10).

## CRITICAL — must fix before sharing widely

| Problem | Impact | Effort | Fix | Files | P |
|---------|--------|--------|-----|-------|---|
| Users may **clear storage** and lose everything | Catastrophic for trust | Low | First-visit modal or Progress banner: “Export weekly” | `Dashboard`, `ProgressPage`, `BackupNudgeBanner` | **10** |
| **Readiness %** misread as pass odds | High legal/moral risk | Low | Tooltip + one line by score | `Dashboard`, `readinessBand` consumers | **9** |

## HIGH — strongly recommended

| Problem | Impact | Effort | Fix | Files | P |
|---------|--------|--------|-----|-------|---|
| **Lesson page overload** for beginners | Quit rate | Med | Collapse labs/sims behind toggle | `LessonPage` | **8** |
| **No E2E smoke tests** | Regression risk | Med | Playwright: land, quiz, export | `tests/e2e` | **7** |
| **Mobile AI panel density** | Fatigue | Med | Accordion default closed <768px | `AITutorPanel` | **7** |
| **3 video verify slots** | Trust gap | Low | Resolve URLs or hide embed with CTA | `videoMap`, `VIDEO_ALIGNMENT_REPORT` | **8** |

## MEDIUM — nice, not blocking

| Problem | Impact | Effort | Fix | Files | P |
|---------|--------|--------|-----|-------|---|
| **Router back/forward** resets quiz | Confusion | Low–Med | Prompt or persist attempt id | `QuizPage` | **5** |
| **Dashboard hero** unclear for cold users | Bounce | Low | One sentence value | `Dashboard` | **6** |
| **A11y** unverified | Inclusion | Med | Audit keyboard + aria | many | **5** |
| **Interleaved review** | Learning | Med | Weekly mixed quiz | `QuizPage` / new deck | **6** |

## LOW — polish

| Problem | Impact | Effort | Fix | Files | P |
|---------|--------|--------|-----|-------|---|
| Identity lines feel cheesy (for some) | Minor | Low | Density cap | `identityPersonalization` | **4** |
| Search hints | Minor | Low | Example chips | `SearchPage` | **5** |

## FUTURE — bigger bets

- Cloud sync (encrypted) without vendor lock-in.  
- Official objective coverage matrix UI.  
- Timed 90-min exam shell.  
- Certificate / share cards.

---

## Safe fixes applied in this audit pass (2026-04-25)

1. **`src/lib/aiClient.ts`** — `checkAiHealth()` returns `null` when `VITE_AI_API_BASE` is unset (avoid pointless fetch/404).  
2. **`src/pages/ProgressPage.tsx`** — Note under import: progress backup vs **content import** link.  
3. **`README.md`** — Index links to all master audit documents.

## Remains manual

- **WCAG audit**, **real device** iOS/Android pass, **load testing** AI routes, **legal review** of disclaimers, **content verification** for 3 video slots.
