import { markUsageOnce } from "./localUsageSignals";

/**
 * Lazy, defensive PWA registration.
 *
 * - Skipped on `localhost` dev unless explicitly enabled (`?sw=1` URL flag).
 * - Skipped if Service Workers aren't supported (older browsers / WebViews).
 * - Failures are swallowed — the app must keep working without SW.
 */
const SHOULD_REGISTER_FLAG = "spt_pwa_v1";

function isDev(): boolean {
  if (typeof location === "undefined") return false;
  const h = location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return true;
  return false;
}

function explicitOptIn(): boolean {
  try {
    return new URLSearchParams(location.search).get("sw") === "1";
  } catch {
    return false;
  }
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (isDev() && !explicitOptIn()) return;

  // Wait for load so SW registration doesn't compete with first paint / hydration.
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          try {
            sessionStorage.setItem(SHOULD_REGISTER_FLAG, "1");
            markUsageOnce("pwa_installed");
          } catch {
            /* ignore */
          }
          // Surface "New version available" UX only when there's already an
          // active controller (i.e. this is an update, not a first install).
          const emitAvailable = () => {
            try {
              window.dispatchEvent(new CustomEvent("spt:update-available"));
            } catch {
              /* CustomEvent unsupported — ignore */
            }
          };
          if (reg.waiting && navigator.serviceWorker.controller) {
            emitAvailable();
          }
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                emitAvailable();
              }
            });
          });
        })
        .catch((err) => {
          console.warn("[pwa] service worker registration failed (non-fatal):", err);
        });

      // Reload once when a new SW takes over after we sent SKIP_WAITING.
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    },
    { once: true },
  );
}

/** True after a successful registration this session — used to surface "Offline ready" copy. */
export function isPwaRegisteredThisSession(): boolean {
  try {
    return sessionStorage.getItem(SHOULD_REGISTER_FLAG) === "1";
  } catch {
    return false;
  }
}
