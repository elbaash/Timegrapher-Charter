// ChronoGrapher service worker: makes the app fully offline.
// The precache manifest below is a placeholder — scripts/build-sw-precache.mjs (postbuild) replaces
// it with the complete static-export file list (app shell, every JS chunk incl. the lazy OCR
// chunks, CSS, fonts, icons, OCR models and wasm) and stamps the cache name with a content hash,
// so every build gets a fresh cache and old ones are deleted on activate.
//
// Resilience rules (learned from the 2026-08 outage):
// 1. Error pages are NEVER cached as the app shell — a broken host must not poison offline use.
// 2. Precaching is per-file and fault-tolerant: one missing asset must not abort the whole install.

const CACHE = "chronographer-__CACHE_VERSION__";

// The app shell is the sub-path root (GitHub Pages project site).
const SHELL = "/Timegrapher-Charter/";

const PRECACHE = ["__PRECACHE_MANIFEST__"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        // Add one file at a time so a single missing/broken URL can't abort the whole install
        // (cache.addAll is all-or-nothing, and the manifest is ~40 MB of models + wasm).
        const failed = [];
        for (const url of PRECACHE) {
          try {
            await cache.add(url);
          } catch {
            failed.push(url);
          }
        }
        if (failed.length) console.warn("[sw] precache skipped:", failed);
        if (!(await cache.match(SHELL))) console.error("[sw] app shell failed to precache — offline will not work");
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App navigations: try network (to pick up updates), fall back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // A server error page (e.g. 404 when hosting is down) must NOT be shown or cached —
          // fall back to the cached shell so the installed app keeps working.
          if (!res.ok) throw new Error(`navigation failed: ${res.status}`);
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }

  // Everything else: cache-first, populate the cache from the network on miss.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
