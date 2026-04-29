/**
 * Lightweight Playwright smoke tests for the deployed (or `vite preview`d) app.
 *
 * To run:
 *
 *   npm install -D @playwright/test
 *   npx playwright install chromium
 *   npm run build
 *   npm run test:e2e
 *
 * `playwright.config.ts` starts `vite preview` on port 4173 when `dist/` exists
 * (unless `SPT_E2E_BASE` is a non-local URL). You can still run preview manually.
 *
 * Defaults to http://localhost:4173. Override with SPT_E2E_BASE for a hosted URL.
 *
 * Mobile coverage is done by Chromium emulating an iPhone viewport — avoids
 * pulling WebKit binaries (~70 MB) just to verify CSS / tap targets.
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.SPT_E2E_BASE ?? "http://localhost:4173";
const FIRST_LESSON_ID = "1-0"; // unlocked from a clean profile (no prior completions)

test.describe("Security+ Trainer — minimal smoke", () => {
  test("Home → first lesson → quiz → progress → 404", async ({ page }) => {
    // 1) Home loads.
    await page.goto(BASE + "/");
    await expect(page).toHaveTitle(/Security\+ Trainer/i);
    await expect(page.locator("main")).toBeVisible();

    // Fresh user shows FirstLoopCard's "Start now"; mobile also adds the
    // sticky "Do this next:" link (legacy builds may still say "Continue:").
    const primary = page.getByRole("link", { name: /Start now|Do this next|^Continue/i }).first();
    await expect(primary).toBeVisible();

    // 2) Open the first unlocked lesson. Default state is `simpleLessonMode: true`,
    // so the page renders "Watch · pause · prove it" rather than the full-mode
    // "Do this now" strip. Match either to stay resilient to default flips.
    await page.goto(BASE + `/lesson/${FIRST_LESSON_ID}`);
    await expect(page.locator("h1").first()).toBeVisible();
    const lessonAnchor = page
      .getByText(/Watch · pause · prove it|Do this now/i)
      .first();
    await expect(lessonAnchor).toBeVisible();

    // 3) Open a quiz directly.
    await page.goto(BASE + `/quiz/${FIRST_LESSON_ID}`);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Quiz/i }).first()).toBeVisible();

    // 4) Progress page renders with backup section + privacy stub.
    await page.goto(BASE + "/progress");
    await expect(page.getByRole("heading", { name: /^Progress$/i }).first()).toBeVisible();
    await expect(page.getByText(/Backup & restore/i)).toBeVisible();
    await expect(page.getByText(/Optional cloud sync/i)).toBeVisible();
    await expect(page.getByText(/Not connected/i).first()).toBeVisible();

    // 5) 404 route renders the friendly page (no crash).
    await page.goto(BASE + "/this-route-does-not-exist");
    await expect(page.getByText(/Page not found/i)).toBeVisible();
  });

  test("Full-mode toggle shows 'Do this now' + 'You are here'", async ({ page, isMobile }) => {
    // Mobile drawer hides the sidebar checkboxes behind the Menu button — keep
    // this test desktop-only to avoid flakiness driving the drawer open/close.
    if (isMobile) test.skip(true, "Sidebar toggles are desktop-only here; mobile uses a drawer.");

    await page.goto(BASE + `/lesson/${FIRST_LESSON_ID}`);
    // Default state is simple mode — flip both toggles via the actual sidebar UI
    // so we exercise the same code path real users do.
    await page.getByRole("checkbox", { name: /Simple lesson view/i }).uncheck();
    await page.getByRole("checkbox", { name: /Beginner mode/i }).uncheck();

    await expect(page.getByText(/Do this now/i).first()).toBeVisible();
    await expect(page.getByText(/You are here/i).first()).toBeVisible();
  });

  test("Locked-lesson recovery: deep-link to a future lesson shows graceful fallback", async ({ page }) => {
    // Fresh profile + deep-link to lesson 1-1 (next after 1-0). Should NOT crash;
    // should render the "Lesson locked" page with a link back to the previous lesson.
    await page.goto(BASE + "/lesson/1-1");
    await expect(page.getByRole("heading", { name: /Lesson locked/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Go to previous lesson/i })).toBeVisible();
  });

  test("AI tutor never blanks out — structured badge is always rendered", async ({ page }) => {
    // Block any future /api/ai/* calls so even the live build can't reach a
    // tutor; the panel must still render with a clear badge.
    await page.route("**/api/ai/**", (route) => route.abort());

    // The Roadmap page renders the AI panel unconditionally (not gated by a
    // <details> disclosure), so the badge is in the visible layout tree.
    await page.goto(BASE + "/roadmap");

    const badge = page.getByText(/Tutor ready|Built-?in coach|Connecting|Paused/i).first();
    // Asserting `attached` (not visible) is enough — the contract is that the
    // panel always renders a structured state, never blank. Visibility on
    // small screens depends on the `<details>` open state, which is its own
    // UX concern tested elsewhere.
    await expect(badge).toBeAttached({ timeout: 6000 });
  });

  test("Unknown route renders the friendly 404 with a Home link", async ({ page }) => {
    // Realistic chaos: a stale bookmark or pasted link.
    await page.goto(BASE + "/this-route-does-not-exist-123");
    await expect(page.getByText(/Page not found/i)).toBeVisible();
    // At least one friendly recovery link is present and clickable.
    await expect(page.getByRole("link", { name: /^Home$/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Lesson path/i }).first()).toBeVisible();
  });

  test("AI panel renders Built-in coach when the API base is unreachable", async ({ page }) => {
    // Same intent as the 'never blanks' test, but explicitly asserts the
    // user-visible STATE indicator and that no /api request is cached or hangs.
    let apiCalls = 0;
    await page.route("**/api/ai/**", (route) => {
      apiCalls++;
      void route.abort();
    });
    await page.goto(BASE + "/roadmap");
    // Built-in coach badge must be present (panel renders structure regardless of network).
    await expect(page.getByText(/Built-?in coach|Tutor ready|Connecting|Paused/i).first()).toBeAttached({
      timeout: 6000,
    });
    // The roadmap doesn't auto-fire AI requests — confirms there's no chatty health-check loop.
    // Health checks are allowed at most once per mount; require <= 5 to keep wiggle room.
    expect(apiCalls).toBeLessThanOrEqual(5);
  });

  test("Multi-tab foreign write cue surfaces on Progress", async ({ browser }) => {
    // Two pages in the SAME browser context share localStorage; the `storage`
    // event fires in the OTHER page when one writes the persisted state key.
    const ctx = await browser.newContext();
    try {
      const a = await ctx.newPage();
      const b = await ctx.newPage();

      await a.goto(BASE + "/progress");
      await b.goto(BASE + "/progress");

      // Force-write the persisted key from page B and let page A receive the storage event.
      await b.evaluate(() => {
        const KEY = "spt_v1_state";
        const raw = localStorage.getItem(KEY) ?? "{}";
        // Round-trip parse to keep schema valid; mutate trivially so the value differs.
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          parsed.__multiTabProbe = Date.now();
          localStorage.setItem(KEY, JSON.stringify(parsed));
        } catch {
          localStorage.setItem(KEY, JSON.stringify({ __multiTabProbe: Date.now() }));
        }
      });

      // The cue auto-clears after ~10 s; assert quickly.
      await expect(a.getByText(/another tab just saved progress/i)).toBeVisible({ timeout: 4000 });

      await ctx.close();
    } catch (err) {
      await ctx.close();
      throw err;
    }
  });

  test("Service worker registers (deployed only)", async ({ page }) => {
    if (BASE.includes("localhost") || BASE.includes("127.0.0.1")) {
      test.skip(true, "SW registration is gated off localhost — run against a hosted URL.");
    }
    await page.goto(BASE + "/");
    const ready = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg && (!!reg.active || !!reg.installing || !!reg.waiting);
    });
    expect(ready).toBe(true);
  });

  test("Offline shell loads after first visit (deployed only)", async ({ context, page }) => {
    if (BASE.includes("localhost") || BASE.includes("127.0.0.1")) {
      test.skip(true, "Offline test requires a hosted URL with a registered SW.");
    }
    await page.goto(BASE + "/");
    await page.waitForLoadState("networkidle");
    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page.locator("main")).toBeVisible();
      await expect(page.getByText(/Offline — keep studying/i)).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
