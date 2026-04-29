# Deployment Test Checklist

Run end-to-end whenever you push a build to a hosted environment. Pair with the smoke tests in `DEPLOYMENT.md`.

**Owner:** _your name_ · **Build:** _commit hash + date_ · **Host:** _Vercel project URL_

---

## 0. Pre-push (local)

- [ ] `npm ci` completes cleanly
- [ ] `npm run build` exits 0 with all validators green (10 validators including `validate:production`)
- [ ] `dist/` folder has `index.html`, `manifest.webmanifest`, `sw.js`, `assets/`
- [ ] No secrets in repo (`grep -ri 'OPENAI_API_KEY' src public` returns 0 hits — only `server/` and docs)
- [ ] Git working tree clean

## 1. Push + build

- [ ] `git push origin <branch>` succeeds
- [ ] Vercel build job completes — green check
- [ ] No build warnings in Vercel logs (Vite reporter advisory: 0)
- [ ] Preview URL responds with 200

## 2. Environment variables (Vercel)

- [ ] `VITE_AI_API_BASE` set on the project (or intentionally blank — Built-in coach)
- [ ] `OPENAI_API_KEY` set on the **server** project / function only — never `VITE_*`
- [ ] Build cache invalidated after env changes (Vercel auto-rebuilds)

## 3. AI server reachability

- [ ] `curl https://<api-host>/api/ai/health` returns `{ ok: true, hasKey: true }`
- [ ] CORS allows the front-end origin
- [ ] If unreachable: app should still load and show **Built-in coach** badge (verify in section 6)

## 4. Front-end first load (online)

- [ ] Open the deployed URL in a clean Incognito window
- [ ] HTTP 200, fonts/assets load
- [ ] DevTools → Application → Service Workers → `sw.js` activated within ~3 s
- [ ] DevTools → Application → Cache Storage → `spt-v1-shell` and `spt-v1-assets` exist
- [ ] Home renders FirstLoopCard (fresh user) with `Start now →`

## 5. Offline second-visit

- [ ] DevTools → Network → **Offline**, hard reload
- [ ] App shell loads from cache, navigation works between Home / Lesson / Quiz / Progress
- [ ] Save a fusion note → it persists (IndexedDB / localStorage)
- [ ] OfflineStatusBanner reads "Offline — keep studying. Notes, quizzes, and PDFs work…"
- [ ] Re-enable network → green "Back online" flashes briefly
- [ ] Tutor returns to **Tutor ready** if `VITE_AI_API_BASE` was set

## 6. AI states

- [ ] **Live**: tutor returns within ~2 s; badge "Tutor ready"; structure `answer · key points · next`
- [ ] **No API**: unset `VITE_AI_API_BASE`, redeploy; badge "Built-in coach"; same structure
- [ ] **Slow API**: throttle Network → Slow 3G; tutor either returns or surfaces timeout fallback within 18 s
- [ ] **Broken API**: block `*/api/ai/*` in DevTools; same structured fallback, no infinite "Thinking…"

## 7. Service worker update banner

- [ ] On the deployed source, bump `CACHE_VERSION` in `public/sw.js` (e.g. `spt-v1` → `spt-v1-2`)
- [ ] Deploy
- [ ] Reload the previously-loaded tab — within ~3 s, "New version available — Reload now" banner appears bottom-right
- [ ] Tap **Reload now** → page reloads exactly once; new bundle is in effect; no console errors
- [ ] Tap **Later** on a different test → banner dismisses; no auto-reload

## 8. PDF upload (live)

- [ ] Add the expected Messer PDF on `/pdf-setup`
- [ ] Setup screen reports a saved match (high or medium confidence)
- [ ] `/pdf-guides/messer-course-notes-v107/<lesson-id>` renders the section
- [ ] `Open local PDF` button creates a blob URL and opens in a new tab
- [ ] Refresh — PDF still listed in setup; metadata persists

## 9. Export / Import

- [ ] Progress → Export progress → JSON file downloads
- [ ] In Incognito (or after `Clear site data`), Import → file → confirm overwrite
- [ ] All counters and notes restored
- [ ] No console errors during import

## 10. Multi-tab safety

- [ ] Open two tabs of the deployed URL
- [ ] On Progress and on any Lesson, the inline "Heads up: another tab is open" appears within ~6 s
- [ ] Close one tab; the note disappears within ~10 s on the other

## 11. Mobile spot-check (live URL on a real phone)

- [ ] Sticky bottom Continue does not block content
- [ ] Mobile drawer opens / closes from the Menu button
- [ ] Skip-to-content focus visible on Tab
- [ ] Save-area-inset-* are honored (no overlap with iOS notch)
- [ ] FirstLoopCard fits on iPhone SE width (320 px) without horizontal scroll

## 12. Trust copy spot-check

- [ ] Progress page header reads "Your safety hub. … Nothing leaves your browser."
- [ ] `CloudSyncStub` shows `Not connected` badge + disabled connect button
- [ ] `OfflineStatusBanner` text matches the calm copy ("Offline — keep studying…")
- [ ] `AppErrorBoundary` triggers (force a render error) and shows "We hit a snag rendering this view" + reassurance

## 13. Sign-off

- [ ] Test owner: `_____________`
- [ ] All boxes above checked
- [ ] Notes / regressions: `_____________`
- [ ] Approved for promotion to production: yes / no

---

If any box fails, **don't promote**. Roll back via Vercel's previous deployment, document in `USER_TEST_SCORECARD.md`, fix, repeat.
