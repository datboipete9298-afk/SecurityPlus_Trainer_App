/**
 * IndexedDB store for extracted PDF text (user-added files).
 * Separate from `localPdfStore` (registry PDF blobs for opening files).
 */

import { classifyImportedPdfCategory, importedPdfCategoryLabel } from "../utils/pdfCategory";

const DB_NAME = "spt_pdf_text_library_v1";
const STORE = "pdfs";
const DB_VERSION = 1;

export type StoredPdfTextRecord = {
  id: string;
  fileName: string;
  addedAt: number;
  pages: { pageIndex: number; text: string }[];
  fullText: string;
};

export type PdfSearchHit = {
  pdfId: string;
  fileName: string;
  pageIndex: number;
  snippet: string;
  /** Display label from `classifyImportedPdfCategory` (Import / Search). */
  categoryLabel?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb_unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("idb_open_failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

export async function loadAllPdfs(): Promise<StoredPdfTextRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onerror = () => reject(req.error ?? new Error("idb_read_failed"));
    req.onsuccess = () => resolve((req.result as StoredPdfTextRecord[]) ?? []);
  });
}

export async function putPdf(rec: StoredPdfTextRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb_write_failed"));
    tx.objectStore(STORE).put(rec);
  });
}

export async function deletePdf(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb_delete_failed"));
    tx.objectStore(STORE).delete(id);
  });
}

/**
 * Search extracted pages across the in-memory list (caller loads via loadAllPdfs).
 */
export function searchPages(query: string, pdfs: StoredPdfTextRecord[], limit = 24): PdfSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2 || pdfs.length === 0) return [];
  const hits: PdfSearchHit[] = [];
  for (const pdf of pdfs) {
    for (const page of pdf.pages) {
      const text = page.text;
      const lower = text.toLowerCase();
      let from = 0;
      let count = 0;
      while (count < 4 && hits.length < limit) {
        const idx = lower.indexOf(q, from);
        if (idx === -1) break;
        const start = Math.max(0, idx - 100);
        const end = Math.min(text.length, idx + q.length + 200);
        const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
        hits.push({
          pdfId: pdf.id,
          fileName: pdf.fileName,
          pageIndex: page.pageIndex,
          snippet,
          categoryLabel: importedPdfCategoryLabel(classifyImportedPdfCategory(pdf.fileName)),
        });
        count++;
        from = idx + q.length;
      }
    }
  }
  return hits.slice(0, limit);
}
