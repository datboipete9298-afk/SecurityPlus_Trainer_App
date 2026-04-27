# UX / UI + mobile audit

## Desktop experience

**Strengths:** Clear `PageHeader` purpose pattern; cards; consistent emerald/slate theme; recovery panels read as coaching not errors.  
**Friction:** Dashboard packs many modules; first visit can scan as “dashboard soup” until the eye finds Continue.

**Desktop score: 82/100**

## Mobile experience

**Strengths:** `min-h-[44px]` on many controls; quiz sticky continue suppressed to avoid double primary; touch-manipulation classes.  
**Friction:** Lesson page + side AI column reorder (AI above on lg) — on phone, AI competes vertically with core task; long pages. PBQ up/down buttons side by side — acceptable. Videos embed — OK unless keyboard covers input (browser dependent).

**Mobile score: 78/100**

## Accessibility (basics)

**Present:** `aria-label` on search, AI panel, recovery regions; semantic headings in cards.  
**Missing / unverified:** Full keyboard path through quiz options; live regions for score changes; color-only status for some badges; focus management on route change.

**Accessibility score: 72/100** (without formal WCAG audit)

## Top UI fixes (small → medium)

1. **Dashboard:** collapse secondary cards behind “More today” after first week.  
2. **AI panel mobile:** single-column accordion default closed.  
3. **Quiz:** ensure option buttons expose `aria-pressed` or radio semantics where appropriate.  
4. **Resume card:** already capped at 4 — keep.  
5. **Focus ring** audit on custom buttons vs `.btn`.

## Score summary

| Dimension | /100 |
|-----------|------|
| Desktop UX | 82 |
| Mobile UX | 78 |
| A11y basics | 72 |
