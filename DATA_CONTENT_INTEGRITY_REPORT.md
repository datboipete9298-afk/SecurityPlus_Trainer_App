# Data & content integrity report

**Project:** SecurityPlus Trainer App (SY0-701)  
**Date:** 2026-04-25 (audit pass)  
**Method:** Validator scripts + static review of routes and content wiring.

## Automated validation (executed)

| Command | Result | Notes |
|--------|--------|--------|
| `npm run validate:data` | **OK** | 66 full lessons, 717 questions, 330 flashcards; Messer exam rows A/B/C 85 each |
| `npm run validate:feedback` | **OK** | 717 questions checked |
| `npm run validate:training` | **OK** | 66 full lessons, ≥2 labs, ≥2 sims, decision each |
| `npm run validate:videos` | **OK** | 63 matched YouTube IDs, **3 verification slots**, 66 sections; `VIDEO_ALIGNMENT_REPORT.md` regenerated |
| `npm run validate:ai` | **OK** | Coach + observer smoke on 66 lessons |
| `npm run validate:ai-integration` | **OK** | Invokes production build pipeline |
| `npm run build` | **OK** | `tsc -b` + Vite |

## Counts (authoritative from validators)

- **Lessons (full content):** 66  
- **Questions:** 717  
- **Flashcards (dataset):** 330  
- **Practice exam banks:** A/B/C × 85 items each (in-app, not CompTIA proprietary)  
- **Videos:** 63 embedded + 3 slots requiring manual URL verification per report  

## Integrity strengths

- **Single pipeline:** `build` fails fast on bad lesson/quiz/training/video shape — strong gate before ship.  
- **Messer order:** Central `SECTION_ORDER` + roadmap unlock logic reduces drift.  
- **PBQ / boss / labs:** Catalog-driven; runners resolve IDs with fallbacks for unknown PBQ.  

## Known content caveats (not bugs; user-facing honesty)

1. **3 video slots** are flagged for human verification — app should not claim “100% verified embeds” until those are resolved.  
2. **PBQs** are original ordering/matching drills — not official exam UI; disclaimers exist but remain a trust teaching point.  
3. **Readiness %** is a local heuristic — must never be sold as “pass prediction.”  

## Route / deep-link sanity

| Route | Behavior |
|-------|----------|
| `/` | Dashboard (no onboarding wall) |
| `/pbq` | Redirects to `/practice-exams/pbq` |
| `/pbq/:id` | Runner; unknown id → helpful empty state |
| `/quiz/:id` | Empty id / no questions → handled in page |
| `*` | Redirect to `/` (no scary 404 for SPA) |

## Duplicate IDs / broken references

- **Validators green:** no unresolved duplicate question IDs or broken training structure detected by scripts.  
- **Residual risk:** manual edits to `lessons.ts` without running `npm run build` can still break things — workflow discipline is the control.

## Verdict

**Data layer is production-grade for a local-first trainer** provided the three video verification slots stay documented and `build` stays mandatory before releases.
