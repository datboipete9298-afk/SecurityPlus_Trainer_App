import type { PdfSearchHit, StoredPdfTextRecord } from "../lib/pdfLibraryDb";
import { searchPages } from "../lib/pdfLibraryDb";

export type { PdfSearchHit };

/** Build search phrases from roadmap id + label to locate blocks in course PDFs. */
export function needlesForLesson(lessonId: string, label: string): string[] {
  const out = new Set<string>();
  const lab = label.trim();
  if (lab) {
    out.add(lab.toLowerCase());
    const afterNum = lab.replace(/^\d+\.\d+\s+/i, "").trim();
    if (afterNum && afterNum !== lab) out.add(afterNum.toLowerCase());
  }
  const parts = lessonId.split("-").filter(Boolean);
  if (parts.length >= 2 && /^\d+$/.test(parts[0]!) && /^\d+$/.test(parts[1]!)) {
    out.add(`${parts[0]}.${parts[1]}`);
    out.add(`${parts[0]}-${parts[1]}`);
  }
  return [...out].filter((s) => s.length >= 2);
}

export type PdfSnippet = {
  pdfId: string;
  fileName: string;
  pageIndex: number;
  excerpt: string;
  score: number;
};

function scoreHit(needle: string, hay: string, idx: number): number {
  const n = needle.length;
  let score = Math.min(n, 80);
  if (idx < 4000) score += 5;
  const window = hay.slice(Math.max(0, idx - 200), idx + n + 200);
  if (/\bobjective\b/i.test(window)) score += 8;
  return score;
}

/** Find best page + excerpt windows for this lesson across all stored PDFs. */
export function snippetsForLesson(
  lessonId: string,
  label: string,
  pdfs: StoredPdfTextRecord[],
  maxPerPdf = 3,
  windowBefore = 400,
  windowAfter = 3500,
): PdfSnippet[] {
  const needles = needlesForLesson(lessonId, label);
  if (needles.length === 0 || pdfs.length === 0) return [];

  const hits: PdfSnippet[] = [];
  for (const pdf of pdfs) {
    const local: PdfSnippet[] = [];
    for (const page of pdf.pages) {
      const hay = page.text.toLowerCase();
      for (const needle of needles) {
        const n = needle.toLowerCase();
        let from = 0;
        while (from < hay.length) {
          const idx = hay.indexOf(n, from);
          if (idx === -1) break;
          const start = Math.max(0, idx - windowBefore);
          const end = Math.min(page.text.length, idx + n.length + windowAfter);
          const slice = page.text.slice(start, end).trim();
          local.push({
            pdfId: pdf.id,
            fileName: pdf.fileName,
            pageIndex: page.pageIndex,
            excerpt: slice.length > 12000 ? `${slice.slice(0, 12000)}…` : slice,
            score: scoreHit(n, hay, idx),
          });
          from = idx + Math.max(1, n.length);
        }
      }
    }
    local.sort((a, b) => b.score - a.score);
    const dedup: PdfSnippet[] = [];
    const seen = new Set<string>();
    for (const h of local) {
      const key = `${h.pdfId}:${h.pageIndex}:${h.excerpt.slice(0, 120)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(h);
      if (dedup.length >= maxPerPdf) break;
    }
    hits.push(...dedup);
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, 12);
}

/** PDF search helper — thin wrapper around IndexedDB record search. */
export function searchPdfLibrary(query: string, pdfs: StoredPdfTextRecord[], limit = 24): PdfSearchHit[] {
  return searchPages(query, pdfs, limit);
}

/** Suggested search phrase for “Follow in your PDF” (first strong needle). */
export function suggestedSearchPhrase(lessonId: string, label: string): string {
  const n = needlesForLesson(lessonId, label);
  return n[0] ?? label.trim().slice(0, 80);
}
