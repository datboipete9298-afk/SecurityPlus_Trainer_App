/**
 * Privacy-safe LOCAL telemetry. Nothing leaves the browser.
 *
 * - Stored under a single localStorage key: `spt_usage_signals_v1`.
 * - Each known signal name has a counter and a last-seen timestamp.
 * - Designed to be cheap to call from any UI surface; never throws.
 * - Read via `readUsageSignals()` and `summarizeUsageSignals()` for the
 *   "Usage signals" panel on Progress page.
 *
 * IMPORTANT: This is intentionally local-only. Do NOT add network sends here
 * — the app's privacy promise is "nothing leaves your browser unless you export."
 */
const KEY = "spt_usage_signals_v1";

export type UsageSignalName =
  | "lesson_started"
  | "first_win" // first lesson completed
  | "lesson_completed"
  | "video_note_saved"
  | "quiz_completed"
  | "pdf_added"
  | "export_completed"
  | "error_boundary_hit"
  | "offline_mode_used"
  | "pwa_installed";

export type UsageRecord = {
  count: number;
  lastAt: number;
};

export type UsageSignals = Record<UsageSignalName, UsageRecord>;

const ZERO_RECORD: UsageRecord = { count: 0, lastAt: 0 };

const ALL_NAMES: UsageSignalName[] = [
  "lesson_started",
  "first_win",
  "lesson_completed",
  "video_note_saved",
  "quiz_completed",
  "pdf_added",
  "export_completed",
  "error_boundary_hit",
  "offline_mode_used",
  "pwa_installed",
];

function emptySignals(): UsageSignals {
  const o = {} as UsageSignals;
  for (const n of ALL_NAMES) o[n] = { ...ZERO_RECORD };
  return o;
}

export function readUsageSignals(): UsageSignals {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySignals();
    const parsed = JSON.parse(raw) as Partial<UsageSignals>;
    const out = emptySignals();
    for (const n of ALL_NAMES) {
      const r = parsed[n];
      if (r && typeof r.count === "number" && typeof r.lastAt === "number") {
        out[n] = { count: r.count, lastAt: r.lastAt };
      }
    }
    return out;
  } catch {
    return emptySignals();
  }
}

function writeUsageSignals(s: UsageSignals): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* localStorage may be full or blocked — silently ignore */
  }
}

/** Increment a signal. Safe to call from anywhere; never throws. */
export function markUsage(name: UsageSignalName): void {
  try {
    const s = readUsageSignals();
    s[name] = { count: s[name].count + 1, lastAt: Date.now() };
    writeUsageSignals(s);
  } catch {
    /* swallow */
  }
}

/** Mark a signal only if it has never been recorded before. Returns true if first time. */
export function markUsageOnce(name: UsageSignalName): boolean {
  try {
    const s = readUsageSignals();
    if (s[name].count > 0) return false;
    s[name] = { count: 1, lastAt: Date.now() };
    writeUsageSignals(s);
    return true;
  } catch {
    return false;
  }
}

export type UsageSummary = {
  totalEvents: number;
  uniqueSignals: number;
  hasFirstWin: boolean;
  recentSignals: { name: UsageSignalName; count: number; lastAt: number }[];
};

export function summarizeUsageSignals(s: UsageSignals = readUsageSignals()): UsageSummary {
  const rows = ALL_NAMES.map((n) => ({ name: n, ...s[n] }));
  const totalEvents = rows.reduce((a, r) => a + r.count, 0);
  const uniqueSignals = rows.filter((r) => r.count > 0).length;
  const recentSignals = rows
    .filter((r) => r.count > 0)
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, 8);
  return {
    totalEvents,
    uniqueSignals,
    hasFirstWin: s.first_win.count > 0,
    recentSignals,
  };
}

export function clearUsageSignals(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const USAGE_SIGNAL_LABELS: Record<UsageSignalName, string> = {
  lesson_started: "Lesson opened",
  first_win: "First lesson completed",
  lesson_completed: "Lesson completed",
  video_note_saved: "Video note saved",
  quiz_completed: "Quiz finished",
  pdf_added: "PDF added",
  export_completed: "Progress exported",
  error_boundary_hit: "App caught a render snag",
  offline_mode_used: "Studied offline",
  pwa_installed: "Installed as app",
};
