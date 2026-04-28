import { useEffect, useState } from "react";

/**
 * Light multi-tab presence using BroadcastChannel.
 * - One singleton channel `spt_tabs_v1` for the app.
 * - Each tab has a random id, broadcasts a `ping` on join + every 5 s.
 * - On `ping` from a peer, it answers `pong`; both messages refresh `peerSeenAt`.
 * - Subscribers are notified `peer = true` while a peer was seen in the last 8 s.
 *
 * Falls back gracefully on browsers without BroadcastChannel — no peer ever reported.
 *
 * Used to surface a calm inline note on Progress + Lesson when another tab is open,
 * to back the existing copy: "Use one tab while studying so progress saves cleanly."
 */
const CHANNEL_NAME = "spt_tabs_v1";
const PEER_FRESH_MS = 8000;
const HEARTBEAT_MS = 5000;

type Listener = (peer: boolean) => void;

let started = false;
let channel: BroadcastChannel | null = null;
let myId = "";
let peerSeenAt = 0;
let intervalHandle: number | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  const has = Date.now() - peerSeenAt < PEER_FRESH_MS;
  for (const cb of listeners) {
    try {
      cb(has);
    } catch {
      /* ignore subscriber errors */
    }
  }
}

function startMultiTabPresence(): void {
  if (started) return;
  if (typeof window === "undefined") return;
  if (typeof BroadcastChannel === "undefined") {
    started = true;
    return;
  }
  started = true;
  myId = Math.random().toString(36).slice(2, 10);
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
    return;
  }
  channel.onmessage = (ev) => {
    const data = ev?.data as { type?: string; from?: string } | null;
    if (!data || data.from === myId) return;
    if (data.type === "ping") {
      peerSeenAt = Date.now();
      try {
        channel?.postMessage({ type: "pong", from: myId });
      } catch {
        /* ignore */
      }
      notify();
    } else if (data.type === "pong") {
      peerSeenAt = Date.now();
      notify();
    }
  };
  // Initial probe + heartbeat
  try {
    channel.postMessage({ type: "ping", from: myId });
  } catch {
    /* ignore */
  }
  intervalHandle = window.setInterval(() => {
    try {
      channel?.postMessage({ type: "ping", from: myId });
    } catch {
      /* ignore */
    }
    notify(); // also lets stale peers expire
  }, HEARTBEAT_MS);

  window.addEventListener("beforeunload", () => {
    try {
      channel?.close();
    } catch {
      /* ignore */
    }
    if (intervalHandle != null) window.clearInterval(intervalHandle);
  });
}

export function useMultiTabPresence(): boolean {
  const [peer, setPeer] = useState<boolean>(false);
  useEffect(() => {
    startMultiTabPresence();
    listeners.add(setPeer);
    // Sync initial state.
    setPeer(Date.now() - peerSeenAt < PEER_FRESH_MS);
    return () => {
      listeners.delete(setPeer);
    };
  }, []);
  return peer;
}
