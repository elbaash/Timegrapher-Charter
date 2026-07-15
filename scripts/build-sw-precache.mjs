// Injects the full static-export file list into the service worker's precache manifest.
// Runs postbuild: scans out/, replaces the __PRECACHE_MANIFEST__ placeholder in out/sw.js, and
// stamps the cache name with a content hash so a new build invalidates the old cache.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const OUT = "out";

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

const urls = walk(OUT)
  .map((p) => "/" + relative(OUT, p).replaceAll("\\", "/"))
  .filter((u) => u !== "/sw.js" && !u.endsWith(".txt.gz"))
  .map((u) => {
    if (u === "/index.html") return "/";
    if (u.endsWith(".html")) return u.slice(0, -".html".length);
    return u;
  })
  .sort();

const swPath = join(OUT, "sw.js");
let sw = readFileSync(swPath, "utf8");
if (!sw.includes("__PRECACHE_MANIFEST__")) {
  console.error("[build-sw-precache] placeholder not found in out/sw.js — sw template changed?");
  process.exit(1);
}
const hash = createHash("sha256").update(JSON.stringify(urls)).digest("hex").slice(0, 10);
sw = sw
  .replace("__CACHE_VERSION__", hash)
  .replace('["__PRECACHE_MANIFEST__"]', JSON.stringify(urls, null, 2));
writeFileSync(swPath, sw);
console.log(`[build-sw-precache] ${urls.length} files precached, cache chronographer-${hash}`);
