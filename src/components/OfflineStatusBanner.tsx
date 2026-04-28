import { useEffect, useState } from "react";
import { markUsage } from "../utils/localUsageSignals";

/**
 * Calm online/offline indicator. Renders only when offline, plus a brief reconnect cue.
 * No layout shift cost when online.
 */
export default function OfflineStatusBanner() {
  const [online, setOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const goOff = () => {
      setOnline(false);
      setJustReconnected(false);
      markUsage("offline_mode_used");
    };
    const goOn = () => {
      setOnline(true);
      setJustReconnected(true);
      window.setTimeout(() => setJustReconnected(false), 3500);
    };
    window.addEventListener("offline", goOff);
    window.addEventListener("online", goOn);
    return () => {
      window.removeEventListener("offline", goOff);
      window.removeEventListener("online", goOn);
    };
  }, []);

  if (online && !justReconnected) return null;

  return (
    <div
      className={`fixed left-0 right-0 z-[60] top-0 px-3 py-1.5 text-center text-xs font-medium border-b shadow-sm pointer-events-none ${
        online
          ? "bg-emerald-950/90 border-emerald-800/60 text-emerald-100"
          : "bg-amber-950/90 border-amber-800/60 text-amber-100"
      }`}
      role="status"
      aria-live="polite"
    >
      {online
        ? "Back online — everything sync-free still saved on this device."
        : "Offline — keep studying. Notes, quizzes, and PDFs work. Tutor falls back to built-in coach."}
    </div>
  );
}
