import { useEffect, useState } from "react";

/**
 * Cross-tab write watcher.
 *
 * Detects when ANOTHER tab in the same browser profile mutates the persisted
 * `spt_v1_state` localStorage key — and surfaces a soft cue.
 *
 * Why: BroadcastChannel-based `multiTabPresence` already detects that another
 * tab exists, but doesn't reveal that a foreign tab actually wrote progress
 * (e.g. saved a note). The DOM `storage` event is fired in OTHER tabs when
 * localStorage changes — perfect, lightweight, no library cost.
 *
 * Privacy: this util only listens; it does not write or send anything.
 */
const PERSIST_KEY = "spt_v1_state";
const FRESH_MS = 10000;

let lastForeignWriteAt = 0;
const listeners = new Set<(at: number) => void>();
let installed = false;

function notifyAll(): void {
  for (const cb of listeners) {
    try {
      cb(lastForeignWriteAt);
    } catch {
      /* ignore subscriber errors */
    }
  }
}

function ensureInstalled(): void {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;
  window.addEventListener("storage", (ev) => {
    if (!ev || ev.key !== PERSIST_KEY) return;
    // The browser fires `storage` only in OTHER tabs (not the writer) — so
    // this event tells us another tab in the same profile wrote progress.
    lastForeignWriteAt = Date.now();
    notifyAll();
  });
}

export function useForeignWriteCue(): boolean {
  const [cue, setCue] = useState<boolean>(false);
  useEffect(() => {
    ensureInstalled();
    let timer: number | null = null;
    const onChange = (at: number) => {
      const fresh = Date.now() - at < FRESH_MS;
      setCue(fresh);
      if (fresh) {
        if (timer != null) window.clearTimeout(timer);
        // Auto-clear after the fresh window so the cue doesn't linger.
        timer = window.setTimeout(() => setCue(false), FRESH_MS + 500);
      }
    };
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);
  return cue;
}
