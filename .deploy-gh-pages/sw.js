// ChronoGrapher service worker: makes the app fully offline.
// The precache manifest below is a placeholder — scripts/build-sw-precache.mjs (postbuild) replaces
// it with the complete static-export file list (app shell, every JS chunk incl. the lazy OCR
// chunks, CSS, fonts, icons, OCR models and wasm) and stamps the cache name with a content hash,
// so every build gets a fresh cache and old ones are deleted on activate.

const CACHE = "chronographer-1bc8ee2f32";

const PRECACHE = [
  "/Timegrapher-Charter/",
  "/Timegrapher-Charter/.nojekyll",
  "/Timegrapher-Charter/404",
  "/Timegrapher-Charter/_next/static/chunks/037f3a08.5e28d270726cdccb.js",
  "/Timegrapher-Charter/_next/static/chunks/139.8d54880d25bc452f.js",
  "/Timegrapher-Charter/_next/static/chunks/164f4fb6-91375d5a65762548.js",
  "/Timegrapher-Charter/_next/static/chunks/199.829cec104a19a84e.js",
  "/Timegrapher-Charter/_next/static/chunks/255-7db27168c8424be6.js",
  "/Timegrapher-Charter/_next/static/chunks/2f0b94e8-ea60580ce276fab2.js",
  "/Timegrapher-Charter/_next/static/chunks/335-3f9527c43e860e3a.js",
  "/Timegrapher-Charter/_next/static/chunks/407-ec2fd07bdd45f684.js",
  "/Timegrapher-Charter/_next/static/chunks/4bd1b696-409494caf8c83275.js",
  "/Timegrapher-Charter/_next/static/chunks/562.3f7099cdfd514d3e.js",
  "/Timegrapher-Charter/_next/static/chunks/597.8cf0c5da4388b1ca.js",
  "/Timegrapher-Charter/_next/static/chunks/646.c2c67a3e35c59670.js",
  "/Timegrapher-Charter/_next/static/chunks/6d6a7a63.cd0f18b91767a597.js",
  "/Timegrapher-Charter/_next/static/chunks/80.bd71270c21881907.js",
  "/Timegrapher-Charter/_next/static/chunks/931.8f418dfbd7239db6.js",
  "/Timegrapher-Charter/_next/static/chunks/aaea2bcf.e726b3f47dfe43dc.js",
  "/Timegrapher-Charter/_next/static/chunks/ad2866b8.635304a38afc0b68.js",
  "/Timegrapher-Charter/_next/static/chunks/app/_not-found/page-30371f3ddbfef58e.js",
  "/Timegrapher-Charter/_next/static/chunks/app/layout-5486beff2a70eafd.js",
  "/Timegrapher-Charter/_next/static/chunks/app/page-5c43596b31509fa6.js",
  "/Timegrapher-Charter/_next/static/chunks/bc98253f.d6fc8a0138855acd.js",
  "/Timegrapher-Charter/_next/static/chunks/fc51dc41.f06114bf980ad352.js",
  "/Timegrapher-Charter/_next/static/chunks/framework-1ce91eb6f9ecda85.js",
  "/Timegrapher-Charter/_next/static/chunks/main-app-10616f7f416b99c9.js",
  "/Timegrapher-Charter/_next/static/chunks/main-b632f620a7564252.js",
  "/Timegrapher-Charter/_next/static/chunks/pages/_app-0d6ce27712411be2.js",
  "/Timegrapher-Charter/_next/static/chunks/pages/_error-a8479a8c7bc399cf.js",
  "/Timegrapher-Charter/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/Timegrapher-Charter/_next/static/chunks/webpack-ad7d36574588907b.js",
  "/Timegrapher-Charter/_next/static/css/bc3c657c3c43d40d.css",
  "/Timegrapher-Charter/_next/static/d4dAYizF8bjbu8bNvlUSU/_buildManifest.js",
  "/Timegrapher-Charter/_next/static/d4dAYizF8bjbu8bNvlUSU/_ssgManifest.js",
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
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
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put("/Timegrapher-Charter/", copy));
          return res;
        })
        .catch(() => caches.match("/Timegrapher-Charter/")),
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
