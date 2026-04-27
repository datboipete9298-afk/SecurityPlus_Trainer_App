/**
 * Validates BYO-PDF plumbing: registry, routes, utilities, no committed PDF binaries.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDF_REGISTRY } from "../src/data/pdfRegistry";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg: string): never {
  console.error("validate-pdf-upload:", msg);
  process.exit(1);
}

function main() {
  for (const p of PDF_REGISTRY) {
    if (!p.expectedFileNames?.length) fail(`Missing expectedFileNames: ${p.id}`);
    if (!p.aliases?.length) fail(`Missing aliases: ${p.id}`);
  }

  const appPath = join(root, "src", "App.tsx");
  if (!existsSync(appPath)) fail("Missing src/App.tsx");
  const app = readFileSync(appPath, "utf8");
  if (!app.includes("/pdf-setup")) fail("App.tsx must register /pdf-setup");
  if (!app.includes("PdfSetupPage")) fail("App.tsx must lazy-load PdfSetupPage");

  const layoutPath = join(root, "src", "components", "Layout.tsx");
  if (!readFileSync(layoutPath, "utf8").includes("/pdf-setup")) fail("Layout must link PDF setup");

  for (const f of [
    "src/utils/localPdfStore.ts",
    "src/utils/pdfStorageBroadcast.ts",
    "src/utils/pdfFileVerifier.ts",
    "src/components/pdfGuide/LocalPdfOpenButton.tsx",
    "src/pages/PdfSetupPage.tsx",
  ]) {
    if (!existsSync(join(root, f))) fail(`Missing ${f}`);
  }
  const storeSrc = readFileSync(join(root, "src", "utils", "localPdfStore.ts"), "utf8");
  for (const fn of ["savePdfFile", "getPdfFile", "deletePdfFile", "listSavedPdfs", "hasRequiredPdf", "getPdfObjectUrl", "clearPdfLibrary"]) {
    if (!storeSrc.includes(fn)) fail(`localPdfStore must include ${fn}`);
  }

  const pdfDir = join(root, "public", "pdfs");
  if (existsSync(pdfDir)) {
    const files = readdirSync(pdfDir).filter((n) => n.toLowerCase().endsWith(".pdf"));
    if (files.length > 0) fail(`Do not commit PDF binaries under public/pdfs — found: ${files.join(", ")}`);
  }

  console.log("validate-pdf-upload: OK — BYO PDF system wired; no PDFs under public/pdfs");
}

main();
