/**
 * Security+ Trainer — minimal runtime service worker.
 *
 * Strategy:
 *   - Navigation requests: network-first, fall back to cached app shell (`/`).
 *   - Same-origin static assets (Vite-hashed `/assets/*`, `/favicon.svg`, `/manifest.webmanifest`):
 *       cache-first with background revalidation.
 *   - `/api/*` requests: pass straight through (NEVER cached). Tutor/coach data must be fresh.
 *   - Cross-origin (e.g. YouTube embeds): pass straight through.
 *
 * Privacy:
 *   - User PDFs live in IndexedDB and Cache Storage is never used for them.
 *   - localStorage / IndexedDB are not touched by this SW.
 *
 * Versioning:
 *   - Bump CACHE_VERSION when shipping breaking changes; old caches are dropped on activate.
 */
const CACHE_VERSION = "spt-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const APP_SHELL_URLS = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      try {
        await cache.addAll(APP_SHELL_URLS);
      } catch (err) {
        // Allow first-install offline-capable later — just log.
        console.warn("[sw] app shell precache partial:", err);
      }
      // NOTE: do NOT call skipWaiting() here.
      // The page asks via postMessage('SKIP_WAITING') after the user taps the
      // "New version available — reload" banner. This prevents serving new
      // assets to an already-loaded old document.
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event?.data === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

function isAssetRequest(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/assets/")) return true;
  if (url.pathname === "/favicon.svg") return true;
  if (url.pathname === "/manifest.webmanifest") return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never touch API routes — keep them dynamic and bypass SW entirely.
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return;
  }

  // Cross-origin (e.g. youtube.com embeds) — pass through.
  if (url.origin !== self.location.origin) {
    return;
  }

  // SPA navigations: network-first with offline shell fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put("/", fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(APP_SHELL_CACHE);
          const cached = (await cache.match("/")) ?? (await cache.match("/index.html"));
          if (cached) return cached;
          return new Response(
            "<!doctype html><meta charset='utf-8'><title>Offline</title><p>You're offline and the app shell isn't cached yet. Reconnect once and you're set.</p>",
            { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
      })(),
    );
    return;
  }

  // Hashed static assets: cache-first; refresh in background.
  if (isAssetRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        const networkP = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => null);
        return cached ?? (await networkP) ?? new Response("Offline asset", { status: 504 });
      })(),
    );
    return;
  }
});
