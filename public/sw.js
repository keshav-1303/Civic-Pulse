/* CivicPulse service worker - safe network-first strategy. */
const CACHE = "civicpulse-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(["/icon-192.png"]).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: network-first so users always get fresh content, fall back to cache offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          const home = await caches.match("/");
          if (home) return home;
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Offline</title><body style="font-family:system-ui;padding:2rem;color:#0f1729"><h1>You are offline</h1><p>Reconnect to the internet to use CivicPulse.</p></body>',
            { headers: { "Content-Type": "text/html" } }
          );
        }
      })()
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (
    url.pathname.startsWith("/_next/static") ||
    /\.(?:png|svg|jpg|jpeg|webp|ico|woff2?|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              caches.open(CACHE).then((c) => c.put(req, res.clone()));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })()
    );
  }
});
