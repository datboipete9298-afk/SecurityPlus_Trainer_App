import { PDF_REGISTRY } from "../data/pdfRegistry";
import type { PdfRegistryEntry } from "../types/pdfLibrary";

export type PdfVerifyResult = {
  pdfId: string | null;
  confidence: "high" | "medium" | "low" | "none";
  reason: string;
};

function normalizeName(name: string): string {
  let s = name.trim().toLowerCase();
  s = s.replace(/\+/g, " ");
  s = s.replace(/\s*\(\s*1\s*\)\s*/gi, "");
  s = s.replace(/\s*\(\s*2\s*\)\s*/gi, "");
  s = s.replace(/\s*-\s*copy\s*$/i, "");
  s = s.replace(/\s*\(\s*\d+\s*\)\s*$/g, "");
  s = s.replace(/\s+/g, " ");
  return s;
}

function stripExt(name: string): string {
  return name.replace(/\.pdf$/i, "").trim();
}

/** Decode /Title <48656C6C6F> or UTF-16BE with leading FEFF in hex. */
export function decodePdfHexTitle(hexRaw: string): string | null {
  const hex = hexRaw.replace(/[\s\r\n]/g, "");
  if (hex.length < 4 || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const b = parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(b)) return null;
    bytes[i / 2] = b;
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes.slice(2)).replace(/\0/g, "").trim() || null;
  }
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes.slice(3)).replace(/\0/g, "").trim() || null;
  }
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/\0/g, "").trim();
  if (utf8.length > 1) return utf8;
  return null;
}

/** PDF string (…) escapes: \\, \(, \), \n, \r, \t, octal \ddd */
function extractPdfLiteralString(chunk: string): string | null {
  let out = "";
  let i = 0;
  while (i < chunk.length) {
    const c = chunk[i]!;
    if (c === "\\") {
      i++;
      if (i >= chunk.length) break;
      const n = chunk[i]!;
      if (n === "n") out += "\n";
      else if (n === "r") out += "\r";
      else if (n === "t") out += "\t";
      else if (n === "(" || n === ")" || n === "\\") out += n;
      else if (/\d/.test(n)) {
        let oct = n;
        let k = i + 1;
        while (oct.length < 3 && k < chunk.length && /\d/.test(chunk[k]!)) {
          oct += chunk[k]!;
          k++;
        }
        const code = parseInt(oct, 8);
        if (!Number.isNaN(code) && code >= 0 && code <= 255) out += String.fromCharCode(code);
        i = k - 1;
      } else out += n;
      i++;
      continue;
    }
    if (c === ")") break;
    out += c;
    i++;
  }
  const t = out.trim();
  return t.length > 0 ? t : null;
}

/**
 * Collects all plausible /Title values: hex brackets + literal strings (first 128 KB).
 */
export async function collectPdfTitleStrings(file: File): Promise<string[]> {
  const n = Math.min(file.size, 131072);
  if (n < 24) return [];
  const buf = await file.slice(0, n).arrayBuffer();
  const raw = new TextDecoder("latin1").decode(buf);
  const found = new Set<string>();

  for (const m of raw.matchAll(/\/Title\s*<([0-9A-Fa-f\s]+)>/gi)) {
    const dec = decodePdfHexTitle(m[1] ?? "");
    if (dec) found.add(dec);
  }

  const reLit = /\/Title\s*\(/g;
  let lm: RegExpExecArray | null;
  while ((lm = reLit.exec(raw)) !== null) {
    const innerStart = lm.index + lm[0].length;
    const lit = extractPdfLiteralString(raw.slice(innerStart));
    if (lit) found.add(lit);
  }

  return [...found];
}

/** @deprecated use collectPdfTitleStrings */
export async function readPdfEmbeddedTitle(file: File): Promise<string | null> {
  const all = await collectPdfTitleStrings(file);
  return all[0] ?? null;
}

function titleMetadataBonus(titleNorms: string[], entry: PdfRegistryEntry): { add: number; tag: string } {
  let best = 0;
  let tag = "";
  const needles: string[] = [
    ...entry.expectedFileNames.map((n) => normalizeName(stripExt(n))),
    ...entry.aliases.map((a) => normalizeName(stripExt(a))),
  ];
  for (const titleNorm of titleNorms) {
    if (!titleNorm || titleNorm.length < 4) continue;
    for (const needle of needles) {
      if (!needle) continue;
      if (titleNorm === needle) {
        if (best < 32) {
          best = 32;
          tag = "PDF /Title metadata matches";
        }
      } else if (titleNorm.includes(needle) || needle.includes(titleNorm)) {
        if (best < 18) {
          best = 18;
          tag = "PDF /Title metadata partial match";
        }
      }
    }
  }
  return { add: best, tag };
}

/** First ~4 KB: printable-only fingerprint to catch renamed files with consistent marketing strings. */
export async function pdfEarlyContentFingerprint(file: File): Promise<string> {
  const n = Math.min(file.size, 4096);
  if (n < 32) return "";
  const buf = await file.slice(0, n).arrayBuffer();
  const raw = new TextDecoder("latin1").decode(buf);
  const printable = raw.replace(/[^\x20-\x7e]+/g, " ").replace(/\s+/g, " ");
  return normalizeName(printable.slice(0, 3200));
}

function contentScanScore(contentNorm: string, entry: PdfRegistryEntry): { add: number; tag: string } {
  if (!contentNorm || contentNorm.length < 20) return { add: 0, tag: "" };
  let add = 0;
  const tags: string[] = [];
  const id = entry.id;
  const has = (a: string, b?: string) => (b ? contentNorm.includes(a) && contentNorm.includes(b) : contentNorm.includes(a));

  if (id.includes("messer") && has("messer")) {
    add += 4;
    tags.push("body: messer");
  }
  if (id.includes("messer") && entry.type === "exams" && (has("practice") || has("exam"))) {
    add += 5;
    tags.push("body: practice/exam");
  }
  if (id.includes("messer") && entry.type === "notes" && (has("course") || has("notes"))) {
    add += 5;
    tags.push("body: course notes");
  }
  if (id.includes("study-guide") && has("study") && has("guide")) {
    add += 6;
    tags.push("body: study guide");
  }
  if (contentNorm.includes("sy0-701") || (contentNorm.includes("sy0") && contentNorm.includes("701"))) {
    add += 4;
    tags.push("body: sy0-701");
  }
  if (has("comptia") && has("security")) {
    add += 3;
    tags.push("body: comptia security");
  }
  return { add: Math.min(add, 14), tag: tags.slice(0, 2).join("; ") };
}

/** First bytes should be ASCII %PDF- for valid PDFs */
export function looksLikePdfBinary(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export async function readPdfMagicOk(file: File): Promise<boolean> {
  if (file.size < 5) return false;
  const buf = await file.slice(0, 5).arrayBuffer();
  const t = new TextDecoder("latin1").decode(buf);
  return t.startsWith("%PDF-");
}

function scoreAgainstEntry(norm: string, entry: PdfRegistryEntry): { score: number; why: string } {
  let score = 0;
  const reasons: string[] = [];
  const needles: string[] = [
    ...entry.expectedFileNames.map((n) => normalizeName(stripExt(n))),
    ...entry.aliases.map((a) => a.toLowerCase().replace(/\s+/g, " ").trim()),
  ];
  for (const needle of needles) {
    if (!needle) continue;
    if (norm === needle || norm.includes(needle) || needle.includes(norm)) {
      score += norm === needle ? 40 : norm.includes(needle) ? 30 : 18;
      reasons.push(`matched “${needle.slice(0, 48)}…”`);
    }
  }
  if (entry.id.includes("messer") && norm.includes("messer")) {
    score += 5;
    reasons.push("filename mentions messer");
  }
  if (entry.id.includes("study-guide") && norm.includes("study") && norm.includes("guide")) {
    score += 8;
    reasons.push("study + guide");
  }
  if (entry.type === "exams" && (norm.includes("practice") || norm.includes("exam"))) {
    score += 6;
    reasons.push("practice/exam hint");
  }
  if (norm.includes("sy0") || norm.includes("sy0-701") || norm.includes("701")) {
    score += 4;
    reasons.push("SY0-701 hint");
  }
  return { score, why: reasons.slice(0, 3).join("; ") || "no strong token match" };
}

export async function verifyPdfFile(file: File): Promise<PdfVerifyResult> {
  if (!file || !(file instanceof File)) {
    return { pdfId: null, confidence: "none", reason: "Not a file." };
  }
  if (!looksLikePdfBinary(file)) {
    return { pdfId: null, confidence: "none", reason: "Expected a .pdf file or application/pdf type." };
  }
  const magic = await readPdfMagicOk(file);
  if (!magic) {
    return { pdfId: null, confidence: "none", reason: "File does not start with %PDF- — may be corrupted or not a PDF." };
  }
  const norm = normalizeName(stripExt(file.name));
  if (norm.length < 3) {
    return { pdfId: null, confidence: "none", reason: "Filename too short to match." };
  }

  const titleStrings = await collectPdfTitleStrings(file);
  const titleNorms = [
    ...new Set(
      titleStrings.map((t) => normalizeName(stripExt(t.replace(/\.pdf$/i, "")))).filter((x) => x.length > 2),
    ),
  ];
  const contentNorm = await pdfEarlyContentFingerprint(file);

  type Row = { pdfId: string; score: number; why: string };
  const rows: Row[] = [];
  for (const entry of PDF_REGISTRY) {
    const { score, why } = scoreAgainstEntry(norm, entry);
    const { add: tAdd, tag: tTag } = titleMetadataBonus(titleNorms, entry);
    const { add: cAdd, tag: cTag } = contentScanScore(contentNorm, entry);
    const total = score + tAdd + cAdd;
    const parts = [why];
    if (tTag) parts.push(tTag);
    if (cTag) parts.push(`early scan: ${cTag}`);
    rows.push({ pdfId: entry.id, score: total, why: parts.filter(Boolean).join("; ") });
  }
  rows.sort((a, b) => b.score - a.score);
  const best = rows[0];
  const runner = rows[1];
  if (!best || best.score < 18) {
    return {
      pdfId: null,
      confidence: "none",
      reason: `No registry match for “${file.name}”. Try the expected download, or ensure the PDF still has correct /Title metadata.`,
    };
  }

  const gap = runner ? best.score - runner.score : 99;
  let conf: PdfVerifyResult["confidence"] = best.score >= 52 ? "high" : best.score >= 32 ? "medium" : "low";
  if (gap < 8) {
    conf = conf === "high" ? "medium" : conf === "medium" ? "low" : "low";
  }
  const reasonExtra = gap < 8 ? " (close second candidate — confirm or use Save if this is correct)" : "";

  return {
    pdfId: best.pdfId,
    confidence: conf,
    reason: `Matched ${best.pdfId} (${conf}). ${best.why}${reasonExtra}`,
  };
}
