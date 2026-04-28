# Ultimate User Journey Simulation

| Step | Goal | Obvious next? | Confusion / quit risk | Wrong path / recovery | Improvements |
|------|------|-----------------|-------------------------|------------------------|--------------|
| **1. First visit** | Start studying | Home → Start here or Continue | Density of nav items | N/A | Spotlight one “Start here” for true first-timers only |
| **2. Home** | Resume study | `FlowPrimaryStrip` / Continue button | Competitor CTAs (cards, tutor) | Navigate away; resume still in coach | Already strong; simplify mobile scroll order |
| **3. Start Here** | Orientation | Links to roadmap/lesson | Can skip mentally | Harmless skip | Banner on Dashboard compensates ✓ |
| **4. First lesson** | Learn section | Huge page — stepper helps | Cognitive overload (“Simple lesson view”) | Wrong lesson id → emptiness | Persist “simple lesson” default by cohort |
| **5. Watch video** | See Messer/embed | Embed in lesson/watch | Playback blocked (network, embed) | Open YouTube externally | Embed error copy test |
| **6. PDF files** | Attach notes PDF | Pdf setup checklist | Filename mismatch → verifier message | Retry with guided title | ✅ Improved success copy (friendly titles not ids) |
| **7. Open PDF guide** | Guided read | Lesson → pdf guide deeplink | Wrong PDF slug | Back to `/pdf-setup?need=id` → ✅ human title banner |
| **8. Highlights** | Mark must-knows | Panel instructions | Highlight fatigue | Stored locally | Checkpoint nudge good |
| **9. Notes** | Brain Book | Bottom of lesson | Duplicates tutor | Persisted ✓ | None |
| **10. Tutor** | Explain / ask | Sidebar / compact coach | Offline feels “dumb”? | Fallback patterns | Fallback quality audited separately |
| **11. Quick quiz** | Check recall | Lesson CTA → `/quiz/:id` | Leaves lesson context | Re-enter via coach | ✅ |
| **12. Wrong answer** | Repair | Explanation + missed journal | Emotional drop | Weak area / re-quiz | Strong |
| **13. Recovery** | Relearn | Weak page + quiz | Busy users skip | Coach reprioritize | ✅ |
| **14. Flashcards** | Drill | Deck merge complexity | SRS term scary | Friendly copy | ✅ “Due now” on progress |
| **15. Weak repair** | Domain lift | Quiz loop | Numeric domain obscure | Guided copy | Tooltip “Domain 4 = SOC” |
| **16. Elite lab** | SOC triage | Hands-on section | Threshold frustration | Retry + debrief + PDF links | ✅ recent debrief work |
| **17. PBQ** | Exam skill | Separate hub timing | Separate from mocks | Restart PBQ hub | Clarify PBQ vs full exam |
| **18. Practice exam** | Stamina/timing | Practice exams menu | Mixed with Messer wording | Draft resume ✓ | Test draft survives refresh |
| **19. Progress** | See stats | Many cards | IndexedDB jargon | ✅ softened copy | ✅ |
| **20. Export** | Backup | JSON download | PDF not included | Warning present ✓ | Repeat warning on first PDF add |
| **21. Leave + return** | Resume | Dashboard coach | Rare multi-tab divergence | Reload | Document single-tab preference |
| **22. Resume** | Same session | `ResumeWhereCard` | Duplicate with Continue strip | Dedupe partially in engine | Periodic audit |
| **23. Phone** | Study on commute | Sidebar hamburger sticky | Tiny PDF multitask | Portrait OK | Thumb zone on primary CTAs ✅ |
| **24. No AI** | Offline study | Fallback + static content | Tutor muted | ✅ | Banner “guided mode” clearer |
| **25. AI on** | Deeper explanations | Paste question | Over-reliance on answers | Guards in prompts | See AI audit |
