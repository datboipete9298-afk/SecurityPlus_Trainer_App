/**
 * Browser-only PDF text extraction via pdf.js.
 *
 * Lazy-load pdf.js extraction on import only (dynamic import).
 * TODO: Consider further code-splitting if bundle budgets tighten.
 */

export type PdfPageText = { pageIndex: number; text: string };

export type ExtractedPdf = {
  fileName: string;
  pages: PdfPageText[];
  fullText: string;
};

export async function extractPdfTextFromFile(file: File): Promise<ExtractedPdf> {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
  const doc = await loadingTask.promise;
  const pages: PdfPageText[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ pageIndex: i, text });
  }
  const fullText = pages.map((p) => `--- Page ${p.pageIndex} ---\n${p.text}`).join("\n\n");
  return { fileName: file.name, pages, fullText };
}

/** True when extractable text is effectively missing (e.g. scanned image PDF). */
export function isLikelyScanOnlyPdf(pages: PdfPageText[]): boolean {
  const joined = pages.map((p) => p.text).join(" ").trim();
  return joined.length < 12;
}
