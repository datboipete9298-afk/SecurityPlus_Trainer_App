import { useEffect, useState } from "react";

/**
 * Surfaces a calm "New version available" prompt when a Service Worker
 * update has been downloaded and is waiting to take over.
 *
 * Listens for the `spt:update-available` window event dispatched by
 * `registerServiceWorker.ts`. Tapping reload posts SKIP_WAITING to the
 * waiting worker, which triggers `controllerchange` and a single page reload.
 */
export default function AppUpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onAvail = () => setShow(true);
    window.addEventListener("spt:update-available", onAvail as EventListener);
    return () => window.removeEventListener("spt:update-available", onAvail as EventListener);
  }, []);

  if (!show) return null;

  const reload = () => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      window.location.reload();
      return;
    }
    void navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) {
        reg.waiting.postMessage("SKIP_WAITING");
      } else {
        // No waiting worker (rare race) — just reload.
        window.location.reload();
      }
    });
  };

  return (
    <div
      className="fixed left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 z-[55] rounded-xl border border-emerald-700/55 bg-emerald-950/95 backdrop-blur-md px-4 py-3 shadow-xl shadow-emerald-950/40"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-emerald-100">New version available</p>
      <p className="text-xs text-slate-300 mt-1 leading-snug">
        Reload to get the latest. Your notes and progress are saved.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn text-sm min-h-[44px] touch-manipulation"
          onClick={reload}
        >
          Reload now
        </button>
        <button
          type="button"
          className="btn-ghost text-sm min-h-[44px] touch-manipulation border border-slate-700"
          onClick={() => setShow(false)}
        >
          Later
        </button>
      </div>
    </div>
  );
}
