import type { PdfSearchHit, StoredPdfTextRecord } from "../lib/pdfLibraryDb";
import { searchPages } from "../lib/pdfLibraryDb";
import { classifyImportedPdfCategory, importedPdfCategoryLabel } from "./pdfCategory";

export type { PdfSearchHit };

export type PdfMatchStrength = "strong" | "medium" | "weak";

/** Build search phrases from roadmap id + label to locate blocks in course PDFs. */
export function needlesForLesson(lessonId: string, label: string, domain?: string): string[] {
  const out = new Set<string>();
  const lab = label.trim();
  if (lab) {
    out.add(lab.toLowerCase());
    const afterNum = lab.replace(/^\d+\.\d+\s+/i, "").trim();
    if (afterNum && afterNum !== lab) out.add(afterNum.toLowerCase());
  }
  const parts = lessonId.split("-").filter(Boolean);
  if (parts.length >= 2 && /^\d+$/.test(parts[0]!) && /^\d+$/.test(parts[1]!)) {
    const a = parts[0]!;
    const b = parts[1]!;
    out.add(`${a}.${b}`);
    out.add(`${a}-${b}`);
    out.add(`${a}_${b}`);
    out.add(`domain ${a}`);
    out.add(`domain ${a}.`);
    out.add(`objective ${a}.${b}`);
  }
  if (domain && /^\d+$/.test(domain)) {
    out.add(`domain ${domain}`);
    out.add(`domain ${domain}.0`);
    out.add(`domain ${domain}:`);
  }
  const acronyms = lab.match(/\b[A-Z]{2,6}\b/g);
  if (acronyms) {
    for (const w of acronyms) {
      if (w.length >= 2 && w.length <= 6) out.add(w.toLowerCase());
    }
  }
  return [...out].filter((s) => s.length >= 2);
}

export type PdfSnippet = {
  pdfId: string;
  fileName: string;
  pageIndex: number;
  excerpt: string;
  score: number;
  categoryLabel: string;
  matchStrength: PdfMatchStrength;
  matchReason: string;
  confidence: number;
};

function scoreHit(
  needle: string,
  hay: string,
  idx: number,
  opts: { domain?: string; pageHead: string; categoryBoost: number },
): { score: number; reason: string } {
  const n = needle.length;
  let score = Math.min(n, 80);
  let reason = "Text match in page body";
  if (idx < 4000) {
    score += 5;
    reason = "Match appears early on page";
  }
  const window = hay.slice(Math.max(0, idx - 200), idx + n + 200);
  if (/\bobjective\b/i.test(window)) {
    score += 8;
    reason = "Near an “objective” style heading";
  }
  const head = opts.pageHead.slice(0, 1200).toLowerCase();
  if (head.includes(needle.slice(0, Math.min(needle.length, 48)))) {
    score += 12;
    reason = "Section / heading area on page";
  }
  if (opts.domain && new RegExp(`domain\\s*${opts.domain}\\b`, "i").test(window)) {
    score += 10;
    reason = "Domain keyword near match";
  }
  score += opts.categoryBoost;
  if (opts.categoryBoost >= 6) reason = `${reason} · course-style PDF filename`;
  return { score, reason };
}

function strengthFromScore(score: number): PdfMatchStrength {
  if (score >= 92) return "strong";
  if (score >= 74) return "medium";
  return "weak";
}

/** User-facing one-liner for PDF ↔ lesson excerpt quality. */
export function pdfMatchHeadline(strength: PdfMatchStrength): string {
  switch (strength) {
    case "strong":
      return "Matched from your PDF.";
    case "medium":
      return "Likely related from your PDF.";
    default:
      return "Possible support from your PDF.";
  }
}

function confidenceFromScore(score: number): number {
  return Math.min(100, Math.round(55 + score * 0.35));
}

/** Find best page + excerpt windows for this lesson across all stored PDFs. */
export function snippetsForLesson(
  lessonId: string,
  label: string,
  pdfs: StoredPdfTextRecord[],
  maxPerPdf = 3,
  windowBefore = 400,
  windowAfter = 3500,
  domain?: string,
): PdfSnippet[] {
  const needles = needlesForLesson(lessonId, label, domain);
  if (needles.length === 0 || pdfs.length === 0) return [];

  const hits: PdfSnippet[] = [];
  for (const pdf of pdfs) {
    const cat = classifyImportedPdfCategory(pdf.fileName);
    const categoryBoost =
      cat === "messer_course_notes" ? 8
      : cat === "study_guide" ? 5
      : cat === "practice_exams" ? 3
      : cat === "user_imported" ? 0
      : 1;
    const categoryLabel = importedPdfCategoryLabel(cat);
    const local: PdfSnippet[] = [];
    for (const page of pdf.pages) {
      const hay = page.text.toLowerCase();
      const pageHead = page.text.split("\n").slice(0, 12).join("\n");
      for (const needle of needles) {
        const n = needle.toLowerCase();
        let from = 0;
        while (from < hay.length) {
          const idx = hay.indexOf(n, from);
          if (idx === -1) break;
          const start = Math.max(0, idx - windowBefore);
          const end = Math.min(page.text.length, idx + n.length + windowAfter);
          const slice = page.text.slice(start, end).trim();
          const { score: rawScore, reason } = scoreHit(n, hay, idx, {
            domain,
            pageHead,
            categoryBoost,
          });
          const matchStrength = strengthFromScore(rawScore);
          const confidence = confidenceFromScore(rawScore);
          local.push({
            pdfId: pdf.id,
            fileName: pdf.fileName,
            pageIndex: page.pageIndex,
            excerpt: slice.length > 12000 ? `${slice.slice(0, 12000)}…` : slice,
            score: rawScore,
            categoryLabel,
            matchStrength,
            matchReason: reason,
            confidence,
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
export function suggestedSearchPhrase(lessonId: string, label: string, domain?: string): string {
  const n = needlesForLesson(lessonId, label, domain);
  return n[0] ?? label.trim().slice(0, 80);
}
