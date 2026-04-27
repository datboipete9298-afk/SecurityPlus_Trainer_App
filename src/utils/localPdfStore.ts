/**
 * Browser-local PDF storage (IndexedDB). No server upload.
 * Do not store blobs in localStorage.
 */

import { broadcastPdfStorageChanged } from "./pdfStorageBroadcast";

const DB_NAME = "spt_local_pdfs_v1";
const DB_VERSION = 1;
const STORE = "pdfs";

/** Per-file ceiling (~85MB) — avoids silent quota failures on huge uploads. */
export const MAX_PDF_BYTES = 85 * 1024 * 1024;

async function blobStartsWithPdfMagic(blob: Blob): Promise<boolean> {
  if (blob.size < 5) return false;
  const buf = await blob.slice(0, 5).arrayBuffer();
  return new TextDecoder("latin1").decode(buf).startsWith("%PDF-");
}

export type StoredPdfRecord = {
  pdfId: string;
  blob: Blob;
  name: string;
  size: number;
  mime: string;
  savedAt: number;
};

const objectUrlCache = new Map<string, string>();

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
        db.createObjectStore(STORE, { keyPath: "pdfId" });
      }
    };
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onerror = () => reject(req.error ?? new Error("idb_request_failed"));
    req.onsuccess = () => resolve(req.result);
  });
}

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export async function savePdfFile(pdfId: string, file: File): Promise<void> {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("pdf_too_large");
  }
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const rec: StoredPdfRecord = {
    pdfId,
    blob: file,
    name: file.name,
    size: file.size,
    mime: file.type || "application/pdf",
    savedAt: Date.now(),
  };
  try {
    await reqToPromise(tx.objectStore(STORE).put(rec));
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === "QuotaExceededError") {
      throw new Error("quota_exceeded");
    }
    throw e;
  }
  revokePdfObjectUrl(pdfId);
}

export async function getPdfFile(pdfId: string): Promise<StoredPdfRecord | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const raw = await reqToPromise(tx.objectStore(STORE).get(pdfId));
  return (raw as StoredPdfRecord | undefined) ?? null;
}

export async function deletePdfFile(pdfId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  await reqToPromise(tx.objectStore(STORE).delete(pdfId));
  revokePdfObjectUrl(pdfId);
  broadcastPdfStorageChanged();
}

export async function listSavedPdfs(): Promise<Pick<StoredPdfRecord, "pdfId" | "name" | "size" | "savedAt">[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const all = await reqToPromise(tx.objectStore(STORE).getAll());
  return (all as StoredPdfRecord[]).map((r) => ({
    pdfId: r.pdfId,
    name: r.name,
    size: r.size,
    savedAt: r.savedAt,
  }));
}

export async function hasRequiredPdf(pdfId: string): Promise<boolean> {
  const row = await getPdfFile(pdfId);
  return row != null;
}

export function revokePdfObjectUrl(pdfId: string): void {
  const u = objectUrlCache.get(pdfId);
  if (u) {
    try {
      URL.revokeObjectURL(u);
    } catch {
      /* ignore */
    }
    objectUrlCache.delete(pdfId);
  }
}

/**
 * Returns a blob: URL for opening the PDF (new tab or iframe). Caller should not revoke until done viewing;
 * we cache per pdfId — new save revokes old URL.
 */
export async function getPdfObjectUrl(pdfId: string): Promise<string | null> {
  const row = await getPdfFile(pdfId);
  if (!row?.blob) return null;
  if (!(await blobStartsWithPdfMagic(row.blob))) {
    return null;
  }
  revokePdfObjectUrl(pdfId);
  const url = URL.createObjectURL(row.blob);
  objectUrlCache.set(pdfId, url);
  return url;
}

export async function clearPdfLibrary(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  await reqToPromise(tx.objectStore(STORE).clear());
  for (const id of [...objectUrlCache.keys()]) {
    revokePdfObjectUrl(id);
  }
  broadcastPdfStorageChanged();
}
