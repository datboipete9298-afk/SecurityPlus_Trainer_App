/**
 * Build-output flow smoke test.
 *
 * Runs against `dist/` after `vite build`. Asserts that the produced static
 * artifacts contain the markers required for the actual user flow to work:
 *
 *   - `index.html` references the manifest, theme color, and module entry.
 *   - `dist/sw.js` ships and contains the production lifecycle markers.
 *   - `dist/manifest.webmanifest` is valid JSON with required fields.
 *   - All expected lazy route bundles are present in `dist/assets/` (Home,
 *     Lesson, Watch, Quiz, Progress, NotFound, FlashcardsPage, ImportPage,
 *     PdfSetupPage, PdfLessonGuidePage, etc.).
 *
 * Catches: a route accidentally being eager-imported, a chunk being deleted,
 * `sw.js` not being copied through, manifest typos, etc.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

function fail(msg: string): never {
  console.error(`validate-flow-smoke: FAIL — ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(dist)) {
  fail("dist/ not found — run `npm run build` before validate:flow-smoke (the build script chains them).");
}

// 1. index.html references
const indexHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
for (const needle of ["manifest.webmanifest", "theme-color", "/assets/", "<div id=\"root\">"]) {
  if (!indexHtml.includes(needle)) fail(`dist/index.html missing: ${JSON.stringify(needle)}`);
}

// 2. Service worker shipped + production lifecycle markers
const swPath = path.join(dist, "sw.js");
if (!fs.existsSync(swPath)) fail("dist/sw.js missing — public/sw.js was not copied through.");
const swSrc = fs.readFileSync(swPath, "utf8");
for (const needle of ["CACHE_VERSION", "addEventListener(\"install\"", "addEventListener(\"fetch\"", "SKIP_WAITING"]) {
  if (!swSrc.includes(needle)) fail(`dist/sw.js missing: ${JSON.stringify(needle)}`);
}
const installBlock = swSrc.match(/addEventListener\("install"[\s\S]*?(?=addEventListener\("activate")/);
if (installBlock && /await\s+self\.skipWaiting\s*\(/.test(installBlock[0])) {
  fail("dist/sw.js install handler must not call skipWaiting() — production lifecycle gates this on user opt-in.");
}

// 3. Manifest valid JSON + required fields
const manifestPath = path.join(dist, "manifest.webmanifest");
if (!fs.existsSync(manifestPath)) fail("dist/manifest.webmanifest missing.");
let manifest: Record<string, unknown>;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
} catch (e) {
  fail(`dist/manifest.webmanifest is not valid JSON: ${(e as Error).message}`);
}
for (const k of ["name", "short_name", "start_url", "display", "theme_color"]) {
  if (!(k in manifest)) fail(`manifest.webmanifest missing key: ${k}`);
}

// 4. Expected lazy route bundles
const assetsDir = path.join(dist, "assets");
if (!fs.existsSync(assetsDir)) fail("dist/assets/ missing.");
const assetFiles = fs.readdirSync(assetsDir);
const requiredRouteChunks = [
  "Dashboard-",
  "LessonPage-",
  "QuizPage-",
  "WatchLesson-",
  "ProgressPage-",
  "NotFoundPage-",
  "FlashcardsPage-",
  "ImportPage-",
  "PdfSetupPage-",
  "PdfLessonGuidePage-",
  "VideoStudyMode-",
  "AITutorPanel-",
];
for (const prefix of requiredRouteChunks) {
  const found = assetFiles.find((f) => f.startsWith(prefix) && f.endsWith(".js"));
  if (!found) fail(`expected lazy chunk starting with "${prefix}" not found under dist/assets/`);
}

// 5. SPA fallback file present (for hosts that read it)
const redirects = path.join(dist, "_redirects");
if (!fs.existsSync(redirects)) fail("dist/_redirects missing — SPA fallback won't work on Netlify-style hosts.");

console.log(`validate-flow-smoke: OK — dist/ shape valid (${assetFiles.length} assets, manifest + sw.js shipped, all expected route chunks present).`);
