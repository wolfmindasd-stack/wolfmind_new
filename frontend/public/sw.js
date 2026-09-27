/* Wolf's Mind ASD - Service Worker
   Strategy: Network-first for HTML/API, cache-first for static assets.
*/
const CACHE_VERSION = "wm-v5";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Ignora le chiamate API locali o verso il backend di Render
  if (url.pathname.startsWith("/api/") || url.hostname.includes("onrender.com")) return;

  // Ignora richieste verso origini differenti da quella corrente
  if (url.origin !== self.location.origin) return;

  // Richieste di navigazione HTML (React Router)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put("/", copy)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match("/");
          if (cached) return cached;
          // Risposta di fallback sicura ed esplicita anziché Response.error()
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain" }),
          });
        })
    );
    return;
  }

  // Risorse statiche: Cache-first con fallback su Rete
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached)
    )
  );
});
