// Build-time manifest includes every app chunk, font, OCR model and runtime file.
// A replacement must be COMPLETE before activation; failed installs preserve the working cache.
const CACHE = "chronographer-97e3cd90ae";
const SHELL = "/Timegrapher-Charter/";
const PRECACHE = [
  "/Timegrapher-Charter/",
  "/Timegrapher-Charter/_next/static/cKF5nXX5nGFlnuDQlhMjI/_buildManifest.js",
  "/Timegrapher-Charter/_next/static/cKF5nXX5nGFlnuDQlhMjI/_ssgManifest.js",
  "/Timegrapher-Charter/_next/static/chunks/037f3a08.5e28d270726cdccb.js",
  "/Timegrapher-Charter/_next/static/chunks/139.8d54880d25bc452f.js",
  "/Timegrapher-Charter/_next/static/chunks/164f4fb6-91375d5a65762548.js",
  "/Timegrapher-Charter/_next/static/chunks/199.829cec104a19a84e.js",
  "/Timegrapher-Charter/_next/static/chunks/255-7db27168c8424be6.js",
  "/Timegrapher-Charter/_next/static/chunks/2f0b94e8-ea60580ce276fab2.js",
  "/Timegrapher-Charter/_next/static/chunks/359-226dffa5b1639c91.js",
  "/Timegrapher-Charter/_next/static/chunks/473-71f2f09a63a85256.js",
  "/Timegrapher-Charter/_next/static/chunks/4bd1b696-409494caf8c83275.js",
  "/Timegrapher-Charter/_next/static/chunks/562.3f7099cdfd514d3e.js",
  "/Timegrapher-Charter/_next/static/chunks/597.8cf0c5da4388b1ca.js",
  "/Timegrapher-Charter/_next/static/chunks/646.c2c67a3e35c59670.js",
  "/Timegrapher-Charter/_next/static/chunks/695-86d3f09ee0fbd4b6.js",
  "/Timegrapher-Charter/_next/static/chunks/6d6a7a63.cd0f18b91767a597.js",
  "/Timegrapher-Charter/_next/static/chunks/80.bd71270c21881907.js",
  "/Timegrapher-Charter/_next/static/chunks/931.8f418dfbd7239db6.js",
  "/Timegrapher-Charter/_next/static/chunks/aaea2bcf.e726b3f47dfe43dc.js",
  "/Timegrapher-Charter/_next/static/chunks/ad2866b8.635304a38afc0b68.js",
  "/Timegrapher-Charter/_next/static/chunks/app/_not-found/page-30371f3ddbfef58e.js",
  "/Timegrapher-Charter/_next/static/chunks/app/layout-4ce61c003c24edd1.js",
  "/Timegrapher-Charter/_next/static/chunks/app/page-71b580c6c01f4c44.js",
  "/Timegrapher-Charter/_next/static/chunks/bc98253f.d6fc8a0138855acd.js",
  "/Timegrapher-Charter/_next/static/chunks/fc51dc41.f06114bf980ad352.js",
  "/Timegrapher-Charter/_next/static/chunks/framework-1ce91eb6f9ecda85.js",
  "/Timegrapher-Charter/_next/static/chunks/main-app-10616f7f416b99c9.js",
  "/Timegrapher-Charter/_next/static/chunks/main-b632f620a7564252.js",
  "/Timegrapher-Charter/_next/static/chunks/pages/_app-0d6ce27712411be2.js",
  "/Timegrapher-Charter/_next/static/chunks/pages/_error-a8479a8c7bc399cf.js",
  "/Timegrapher-Charter/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/Timegrapher-Charter/_next/static/chunks/webpack-ad7d36574588907b.js",
  "/Timegrapher-Charter/_next/static/css/28b2a8b1e1676ab9.css",
  "/Timegrapher-Charter/_next/static/media/19cfc7226ec3afaa-s.woff2",
  "/Timegrapher-Charter/_next/static/media/21350d82a1f187e9-s.woff2",
  "/Timegrapher-Charter/_next/static/media/8e9860b6e62d6359-s.woff2",
  "/Timegrapher-Charter/_next/static/media/ba9851c3c22cd980-s.woff2",
  "/Timegrapher-Charter/_next/static/media/c5fe6dc8356a8c31-s.woff2",
  "/Timegrapher-Charter/_next/static/media/df0a9ae256c0569c-s.woff2",
  "/Timegrapher-Charter/_next/static/media/e4af272ccee01ff0-s.p.woff2",
  "/Timegrapher-Charter/_next/static/media/ort-wasm-simd-threaded.jsep.c6bc439b.wasm",
  "/Timegrapher-Charter/_next/static/media/ort.bundle.min.15369b28.mjs",
  "/Timegrapher-Charter/favicon.ico",
  "/Timegrapher-Charter/icons/icon-192.png",
  "/Timegrapher-Charter/icons/icon-512.png",
  "/Timegrapher-Charter/icons/icon-maskable-512.png",
  "/Timegrapher-Charter/index.txt",
  "/Timegrapher-Charter/manifest.webmanifest",
  "/Timegrapher-Charter/models/ch_PP-OCRv4_det_infer.onnx",
  "/Timegrapher-Charter/models/ch_PP-OCRv4_rec_infer.onnx",
  "/Timegrapher-Charter/models/ppocr_keys_v1.txt",
  "/Timegrapher-Charter/ort/ort-wasm-simd-threaded.jsep.mjs",
  "/Timegrapher-Charter/ort/ort-wasm-simd-threaded.jsep.wasm"
];
const PREFIX = "chronographer-";
let status = { phase: "checking", completed: 0, total: PRECACHE.length, failed: [] };
let downloading = null;

async function report(target) {
  const message = { type: "OFFLINE_STATUS", version: CACHE, ...status };
  if (target) target.postMessage(message);
  else {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      if (new URL(client.url).pathname.startsWith(SHELL)) client.postMessage(message);
    }
  }
}

async function missingFiles(cache) {
  const missing = [];
  for (const url of PRECACHE) if (!(await cache.match(url))) missing.push(url);
  return missing;
}

async function download() {
  try {
    const cache = await caches.open(CACHE);
    const missing = await missingFiles(cache);
    status = { phase: "downloading", completed: PRECACHE.length - missing.length, total: PRECACHE.length, failed: [] };
    await report();
    for (const url of missing) {
      let saved = false;
      // Bound stalled downloads and retry transient failures, including failures reading the body.
      for (let attempt = 0; attempt < 3 && !saved; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        try {
          const response = await fetch(url, { cache: "reload", signal: controller.signal });
          if (!response.ok) throw new Error(`Download failed: ${response.status}`);
          await cache.put(url, response);
          saved = true;
        } catch {
          // Retry below; quota failures must also surface instead of falsely reporting ready.
        } finally {
          clearTimeout(timeout);
        }
      }
      if (saved) status.completed++;
      else status.failed.push(url);
      await report();
      if (!saved) break;
    }
    status.failed = await missingFiles(cache);
    status.completed = PRECACHE.length - status.failed.length;
    if (status.failed.length) throw new Error("Offline download incomplete");
    status.phase = "ready";
    await report();
  } catch (error) {
    status.phase = "error";
    await report();
    throw error;
  }
}

function ensureOffline() {
  if (!downloading) downloading = download().finally(() => { downloading = null; });
  return downloading;
}

self.addEventListener("install", (event) => {
  // Existing sessions retain their version until the user chooses to reload.
  event.waitUntil(ensureOffline());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    if ((await missingFiles(cache)).length) throw new Error("Cannot activate an incomplete cache");
    const keys = (await caches.keys()).filter((key) => key.startsWith(PREFIX) && key !== CACHE);
    // Retain the previous cache for old tabs' chunks. Never delete other apps' caches or watch data.
    await Promise.all(keys.slice(0, -1).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "OFFLINE_STATUS") {
    event.waitUntil((async () => {
      if (!downloading) {
        const missing = await missingFiles(await caches.open(CACHE));
        status = { phase: missing.length ? "error" : "ready", completed: PRECACHE.length - missing.length, total: PRECACHE.length, failed: missing };
      }
      await report(event.source);
    })());
  }
  if (event.data?.type === "RETRY_OFFLINE") event.waitUntil(ensureOffline().catch(() => {}));
  if (event.data?.type === "ACTIVATE_UPDATE") event.waitUntil(ensureOffline().then(() => self.skipWaiting()));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(SHELL)) return;
  if (request.mode === "navigate") {
    // Never mix newer network HTML with this worker's older offline chunks. Update separately.
    event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match(SHELL)) || fetch(request)));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = (await cache.match(request)) || (await caches.match(request));
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
