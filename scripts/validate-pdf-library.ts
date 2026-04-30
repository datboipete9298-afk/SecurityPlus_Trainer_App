/**
 * Validates local PDF text library integration (browser extraction + IndexedDB + UI wiring).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(msg: string): never {
  console.error("validate-pdf-library:", msg);
  process.exit(1);
}

function mustContain(path: string, subs: string[]) {
  const p = join(root, path);
  if (!existsSync(p)) fail(`Missing ${path}`);
  const t = readFileSync(p, "utf8");
  for (const s of subs) {
    if (!t.includes(s)) fail(`${path} must include: ${s.slice(0, 120)}${s.length > 120 ? "…" : ""}`);
  }
}

function main() {
  mustContain("src/lib/extractPdfText.ts", ["extractPdfTextFromFile", "pdfjs-dist", "GlobalWorkerOptions"]);
  mustContain("src/lib/pdfLibraryDb.ts", ["loadAllPdfs", "putPdf", "deletePdf", "searchPages"]);
  mustContain("src/context/PdfLibraryContext.tsx", ["addFiles", "removePdf", "PdfLibraryProvider"]);
  mustContain("src/utils/lessonPdfMatch.ts", ["snippetsForLesson", "searchPdfLibrary"]);
  mustContain("src/pages/ImportPage.tsx", ["addFiles"]);
  mustContain("src/pages/SearchPage.tsx", [
    "searchPdfLibrary",
    "Send to lesson note",
    "Found in your PDF.",
    "Take me to where I can save it.",
  ]);
  mustContain("src/pages/LessonPage.tsx", [
    "Use your PDF to learn this",
    "Save to Brain Book",
    "Saved — you can review this later.",
    "Say this idea in your own words.",
    "Open quick quiz for this lesson",
    "Back to lesson path",
  ]);
  mustContain("src/components/video/VideoStudyMode.tsx", ["Saved with your PDF."]);

  const sw = readFileSync(join(root, "public", "sw.js"), "utf8");
  if (!sw.includes("IndexedDB") || !sw.includes("spt_pdf_text_library_v1")) {
    fail("public/sw.js must document that extracted PDF text DB is not cached by the service worker");
  }

  const pdfDir = join(root, "public", "pdfs");
  if (existsSync(pdfDir)) {
    const bad = readdirSync(pdfDir).filter((n) => n.toLowerCase().endsWith(".pdf"));
    const allowed = readdirSync(pdfDir).filter((n) => {
      const low = n.toLowerCase();
      if (low.endsWith(".pdf")) return false;
      return low.endsWith(".md") || low.endsWith(".txt") || low === "readme" || low.startsWith("readme");
    });
    if (bad.length > 0) fail(`Do not commit PDF binaries under public/pdfs — found: ${bad.join(", ")}`);
    void allowed;
  }

  console.log("validate-pdf-library: OK");
}

main();
