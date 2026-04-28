# User Test Scorecard — Template

Copy this whole file per cohort and fill in. Keep it under version control alongside the dated build.

**Build:** _e.g._ `2026-04-28 main @ commit abc123`  
**Tester cohort size:** 5  
**Run date:**

---

## Per-persona row

| Persona | Task completion (0–5) | Time to first win (mm:ss) | # confusion points | Trust concerns (Y/N + note) | Mobile friction (0–5) | "Would use again?" (1–10) |
|---------|----------------------:|--------------------------:|-------------------:|-----------------------------|----------------------:|--------------------------:|
| Complete beginner       |  |  |  |  |  |  |
| Phone-only user         |  |  |  |  |  |  |
| Distracted user         |  |  |  |  |  |  |
| Serious exam candidate  |  |  |  |  |  |  |
| No-AI / no-PDF user     |  |  |  |  |  |  |

**Cohort medians**

- Time to first win: _____  
- "Would use again?": _____  
- Total confusion points: _____  

---

## Confusion log

| # | Persona | Surface (page / component) | What confused them | Suggested fix (copy / layout only — no logic) |
|---|---------|---------------------------|--------------------|-----------------------------------------------|
| 1 |         |                           |                    |                                               |
| 2 |         |                           |                    |                                               |
| 3 |         |                           |                    |                                               |

---

## Trust log

| # | Persona | What broke trust (or boosted it) | Action |
|---|---------|----------------------------------|--------|
| 1 |         |                                  |        |
| 2 |         |                                  |        |

---

## Mobile-only issues (if any)

| Device + browser | Issue | Severity | Fix |
|------------------|-------|----------|-----|
|                  |       |          |     |

---

## Ship gate

- [ ] **≥ 4 / 5** personas reached first win in **≤ 10 minutes**
- [ ] **0** critical confusion points (defined as: blocked progress for >60 s without recovery)
- [ ] **0** trust regressions versus prior build
- [ ] **Median "Would use again?" ≥ 7 / 10**

If any box is empty, **don't ship the next big change** until it’s addressed via copy / layout (no logic edits during testing).

---

## Notes for next round

_Free-form. What are we watching for next time?_
