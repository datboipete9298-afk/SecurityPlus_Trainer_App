# Technical quality audit

## Architecture snapshot

- **React 18 + Vite + TS** — standard, fast dev.  
- **React Router** lazy routes — good code splitting; `LessonPage` largest chunk.  
- **ProgressContext** — single source of truth; `localStorage` persistence with `schemaVersion` migrations.  
- **Dual AI runtime** — Express (`server/`) for local; `api/` for Vercel-style handlers sharing `server/aiCore`.  
- **AppErrorBoundary** — wraps app in `main.tsx`; reassures on crash.

## High-risk technical issues

1. **Single-tab localStorage** — no multi-device sync; user expectation mismatch is a *product* risk that surfaces as “data loss.”  
2. **Large lesson component** — maintainability + bundle size; regression risk when editing.  
3. **No automated E2E** — validators are excellent but don’t click the UI.

## Medium-risk issues

1. **Quiz state complexity** — exam vs study vs quick vs wrongOnly; high manual QA burden.  
2. **sessionStorage exam drafts** — intentional, but fragile; must stay documented.  
3. **AI base URL** — misconfiguration leads to silent guided mode (mitigated by health check behavior).

## Small polish (done or easy)

- Health check **skips fetch** when `VITE_AI_API_BASE` unset — avoids meaningless `/api/ai/health` 404 noise.  
- Progress import note distinguishes **progress JSON vs author lesson JSON**.

## Failure-oriented testing (simulated)

| Scenario | Outcome | User understands? |
|----------|---------|-------------------|
| Skip onboarding | OK — dashboard | Yes |
| Random nav | OK — consistent shell | Mostly |
| Abandon lesson | Resume pointers | Yes |
| Abandon quiz mid | Partial — exam draft session-only | Yes if copy read |
| Fail quiz 3× | Progression pause + repair | Yes |
| Fail PBQ / boss | Recovery panels | Yes |
| No AI key | Guided fallbacks | Medium |
| AI server offline | Fallback | Medium |
| Refresh mid-flow | localStorage restores | Mostly |
| Mobile only | Usable | Some fatigue |
| Back/forward | Router state may reset quiz step | **Risk** — expected SPA behavior |
| Clear localStorage | **Data loss** unless export | **Must warn** |
| Wrong JSON import | Error string | Better with new note |
| Search no results | Good empty state | Yes |
| Many activities + resume | Tier sort + cap | Yes |
| Deep link `/lesson/x` locked | Explains lock | Yes |
| `/pbq` | Redirects to hub | Yes |
| Unknown route | Redirect home | Soft — may confuse “where was I” |

## Maintainability verdict

**Good for a disciplined solo/small team** — validators are the secret weapon. **Score: 85/100**
