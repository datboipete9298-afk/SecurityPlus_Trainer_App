# Manual mobile & responsive QA checklist

Use real devices or browser devtools device emulation. **Project:** `C:\Users\Petey\Desktop\SecurityPlus_Trainer_App` (production build: `npm run build` + `npm run preview` or hosted URL).

---

## Phone (portrait)

| Area | Check |
|------|--------|
| **Navigation** | Hamburger / menu opens; all main routes reachable |
| **Dashboard** | “Start here → First lesson → Quiz → Review” card (if shown) readable; no horizontal scroll |
| **Continue / sticky** | Bottom continue does not hide primary actions |
| **Video** | iframe scales; no overflow; external “open on YouTube” usable |
| **Quiz** | Answer buttons ≥44px tall; no mis-taps |
| **PBQ** | Up/Down/Submit tappable; feedback readable |
| **AI panel** | Scrolls; input + send visible with keyboard (if applicable) |
| **Flashcards** | Swipe/tap actions work |
| **Progress** | Export/import UI usable; copy buttons not clipped |

---

## Tablet (portrait & landscape)

| Area | Check |
|------|--------|
| **Layout** | Two-column blocks (lesson + AI) collapse sensibly |
| **Roadmap** | Long list scrolls; row taps accurate |
| **Practice exam** | Timer and nav do not overlap |

---

## Desktop

| Area | Check |
|------|--------|
| **Keyboard** | Tab order reasonable on quiz and PBQ |
| **Resize** | 1280px → 1024px no broken grids |

---

## Feature passes (any device)

| Flow | Pass criteria |
|------|----------------|
| **Video** | Embed or fallback message; playlist link works |
| **Quiz** | Submit, explanation, next question |
| **PBQ** | Wrong submit → weak/miss signal; correct → XP + pass count on Progress |
| **Progress export/import** | JSON round-trip preserves completions |

---

## Sign-off

| Date | Device / browser | Tester | Notes |
|------|------------------|--------|-------|
|      |                |        |       |
