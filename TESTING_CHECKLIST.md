# TESTING_CHECKLIST

Manual QA for Security+ Trainer (local build).

1. **New user first run** — Clear site data; open `/` → redirects to `/start-here`.
2. **Start Here flow** — Complete onboarding; returns to dashboard.
3. **Lesson flow** — Roadmap → lesson → watch → quiz from lesson.
4. **Video embed** — `/watch/1-1` shows iframe when id present in `KNOWN_YT`.
5. **Video verification** — Open section with `needsVideoUrl` (e.g. roadmap to `2-0` if unlocked); banner + external links work.
6. **Highlight completion** — Mark highlights done; progress updates.
7. **Brain Book note save** — Save note; cap messages if over limits.
8. **Quiz correct** — Single-select lesson quiz; XP/stat increments.
9. **Quiz wrong** — Miss adds journal / weak signal.
10. **Multi-select quiz** — Messer study mode: select two options where stem is select-all; grade + explanation.
11. **Practice exam A** — Exam mode full run; review shows score + domains.
12. **Practice exam B** — Same as A.
13. **Practice exam C** — Same as A.
14. **PBQ pass** — `/pbq/firewall-rules` order correctly; XP grant.
15. **PBQ fail** — Wrong order; weak/domain nudge via `recordPbqMiss`.
16. **Flashcard review** — `/flashcards` cycle cards.
17. **Mistake-to-flashcard** — After miss, user card exists or batch “Convert recent misses”.
18. **Weak area repair** — `/weak` shows actionable items.
19. **Smart Coach after miss** — Dashboard/coach text updates after quiz miss.
20. **Smart Coach after lesson complete** — Next step advances.
21. **Boss fight pass** — XP + win flag.
22. **Boss fight fail** — Domain penalty path.
23. **Export progress** — JSON download / copy from progress or import page.
24. **Import progress** — Valid JSON restores state.
25. **Reset progress** — Confirm dialog; clears state.
26. **Build validation** — `npm run build` (runs validate:data + validate:videos + tsc + vite).
