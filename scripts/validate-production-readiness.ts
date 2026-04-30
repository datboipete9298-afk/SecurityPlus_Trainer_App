/**
 * Production-readiness validator.
 *
 * Catches accidental regressions in the production-shipping surfaces that
 * have no other automated coverage:
 *
 *   - PWA shell: manifest + sw.js + index.html wiring
 *   - Service worker lifecycle: no skipWaiting() in install, message handler present
 *   - Update flow: registerServiceWorker dispatches the event, AppUpdateBanner posts SKIP_WAITING
 *   - Offline banner + Layout wiring
 *   - Multi-tab presence + UI hint wiring (Progress + Lesson)
 *   - Local usage signals util + Progress page panel
 *   - Cloud sync stub is honest (Not connected / disabled)
 *   - DEPLOYMENT.md present with required sections
 *
 * Structural-only — does not assert exact copy that is meant to be tunable.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel: string): boolean {
  try {
    return fs.statSync(path.join(root, rel)).isFile();
  } catch {
    return false;
  }
}

function fail(reason: string): never {
  console.error(`validate-production-readiness: FAIL — ${reason}`);
  process.exit(1);
}

function mustContain(rel: string, needles: string[]): void {
  const txt = read(rel);
  for (const n of needles) {
    if (!txt.includes(n)) fail(`${rel} missing: ${JSON.stringify(n)}`);
  }
}

function mustNotContain(rel: string, needles: string[]): void {
  const txt = read(rel);
  for (const n of needles) {
    if (txt.includes(n)) fail(`${rel} unexpectedly contains: ${JSON.stringify(n)}`);
  }
}

// 1. PWA shell files
if (!exists("public/manifest.webmanifest")) fail("public/manifest.webmanifest missing");
if (!exists("public/sw.js")) fail("public/sw.js missing");
mustContain("public/manifest.webmanifest", ["start_url", "display", "Security+ Trainer"]);

// 2. Service worker structural rules
mustContain("public/sw.js", [
  "CACHE_VERSION",
  "addEventListener(\"install\"",
  "addEventListener(\"activate\"",
  "addEventListener(\"fetch\"",
  "SKIP_WAITING",
  "/api/", // pass-through guard
]);

// SW must NOT call skipWaiting inside install handler — production lifecycle
// requires waiting for explicit user opt-in via the in-app update banner.
const swSrc = read("public/sw.js");
const installHandlerMatch = swSrc.match(
  /addEventListener\("install"[\s\S]*?(?=addEventListener\("activate")/,
);
if (!installHandlerMatch) fail("public/sw.js install handler not found in expected shape");
if (/await\s+self\.skipWaiting\s*\(/.test(installHandlerMatch[0])) {
  fail("public/sw.js install handler must not call skipWaiting() — see DEPLOYMENT.md SW lifecycle.");
}

// 3. index.html wiring
mustContain("index.html", [
  "manifest.webmanifest",
  "theme-color",
  "apple-mobile-web-app-capable",
]);

// 4. Service worker registration + update event
mustContain("src/utils/registerServiceWorker.ts", [
  "navigator.serviceWorker",
  ".register(\"/sw.js\"",
  "spt:update-available",
  "controllerchange",
]);

// 5. App-level wiring
mustContain("src/main.tsx", ["registerServiceWorker"]);
mustContain("src/components/Layout.tsx", [
  "OfflineStatusBanner",
  "AppUpdateBanner",
  "MobileStickyContinue",
]);

// 6. Update banner posts SKIP_WAITING
mustContain("src/components/AppUpdateBanner.tsx", [
  "spt:update-available",
  "SKIP_WAITING",
]);

// 7. Multi-tab presence + UI hint (Progress + Lesson)
mustContain("src/utils/multiTabPresence.ts", ["BroadcastChannel", "spt_tabs_v1"]);
mustContain("src/components/MultiTabHint.tsx", ["useMultiTabPresence"]);
mustContain("src/pages/ProgressPage.tsx", ["MultiTabHint"]);
mustContain("src/pages/LessonPage.tsx", ["MultiTabHint"]);

// 7b. Cross-tab foreign-write watcher (read-only, no schema change)
mustContain("src/utils/crossTabWriteWatcher.ts", ["spt_v1_state", "addEventListener(\"storage\""]);
mustNotContain("src/utils/crossTabWriteWatcher.ts", ["fetch(", "navigator.sendBeacon", "XMLHttpRequest"]);
mustContain("src/components/ForeignWriteCue.tsx", ["useForeignWriteCue"]);
mustContain("src/pages/ProgressPage.tsx", ["ForeignWriteCue"]);
mustContain("src/pages/LessonPage.tsx", ["ForeignWriteCue"]);

// 8. Local usage signals — local-only, never sent
mustContain("src/utils/localUsageSignals.ts", [
  "spt_usage_signals_v1",
  "markUsage",
  "markUsageOnce",
  "USAGE_SIGNAL_LABELS",
]);
mustNotContain("src/utils/localUsageSignals.ts", ["fetch(", "navigator.sendBeacon", "XMLHttpRequest"]);
mustContain("src/pages/ProgressPage.tsx", ["UsageSignalsPanel"]);

// 8b. Privacy guards on the other local-only utils — never send anything anywhere.
//     Same allow-list approach as `localUsageSignals.ts`. Catches a future
//     contributor accidentally sneaking a `fetch` into a util that's documented
//     as local-only.
const NETWORK_FORBIDDEN = ["fetch(", "navigator.sendBeacon", "XMLHttpRequest", "WebSocket("];
for (const f of [
  "src/utils/crossTabWriteWatcher.ts",
  "src/utils/multiTabPresence.ts",
  "src/utils/localPdfStore.ts",
  "src/utils/pdfStorageBroadcast.ts",
  "src/utils/microEncouragement.ts",
  "src/utils/coachingMicroCopy.ts",
]) {
  mustNotContain(f, NETWORK_FORBIDDEN);
}

// 9. Cloud sync stub is honest
mustContain("src/components/CloudSyncStub.tsx", ["Not connected", "disabled"]);
mustNotContain("src/components/CloudSyncStub.tsx", ["fetch(\"/api/sync"]);

// 10. Deployment doc has key sections
mustContain("DEPLOYMENT.md", [
  "VITE_AI_API_BASE",
  "OPENAI_API_KEY",
  "Service worker",
  "smoke tests",
]);

// 11. Quiz lesson study position is restored from sessionStorage (not localStorage)
mustContain("src/pages/QuizPage.tsx", ["sessionStorage", "lessonQuizPosKey"]);
// Must never store lesson quiz position in localStorage (would survive across tabs and confuse stats).
const quizSrc = read("src/pages/QuizPage.tsx");
if (/localStorage\.setItem\([^)]*lessonQuizPos/.test(quizSrc)) {
  fail("Lesson quiz position must not be persisted to localStorage — sessionStorage only.");
}

// 12. PDF binaries never enter Cache Storage (sw.js only matches /assets/*, /favicon.svg, /manifest.webmanifest)
const swMatchAssetsOnly = /isAssetRequest|\/assets\//.test(swSrc);
if (!swMatchAssetsOnly) fail("public/sw.js asset rule unclear — confirm only /assets/* are cached.");

// 13. AI quality stress harness ships and exercises the public API
mustContain("scripts/validate-ai-quality-stress.ts", [
  "isWeakAiResponse",
  "enforceStructuredAiResponse",
  "tautological",
  "platitude",
]);

// 14. E2E smoke spec ships (Playwright is opt-in; spec must remain truthful)
if (!exists("tests/e2e/smoke.spec.ts")) fail("tests/e2e/smoke.spec.ts missing");
mustContain("tests/e2e/smoke.spec.ts", [
  "Home → first lesson → quiz → progress → 404",
  "Deep-link any lesson: future row opens (no hard lock)",
  "AI tutor never blanks",
  "Multi-tab foreign write cue",
]);

console.log("validate-production-readiness: OK — PWA shell, SW lifecycle, offline banner, update banner, multi-tab, usage signals, cloud-sync stub, and deploy docs all wired.");
