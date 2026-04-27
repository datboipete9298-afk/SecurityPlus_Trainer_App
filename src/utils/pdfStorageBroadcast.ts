/**
 * Notifies other tabs / same-origin contexts when local PDF blobs change (IndexedDB).
 * Keeps "Open local PDF" and progress metadata aligned without a full reload.
 */
const CHANNEL = "spt_pdf_storage_v1";

export function broadcastPdfStorageChanged(): void {
  try {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.postMessage({ type: "pdf-changed", at: Date.now() });
    ch.close();
  } catch {
    /* ignore */
  }
}

export function subscribePdfStorageChanged(handler: () => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  try {
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = () => handler();
    return () => ch.close();
  } catch {
    return () => {};
  }
}
