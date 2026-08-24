// Local static server that mirrors GitHub Pages sub-path hosting.
// Serves the exported `out/` folder under /Timegrapher-Charter/ so
// local testing matches production exactly.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../out/', import.meta.url));
const BASE = '/Timegrapher-Charter';
const PORT = process.env.PORT || 5001;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.onnx': 'application/octet-stream',
};

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
    if (!urlPath.startsWith(BASE)) {
      res.writeHead(302, { Location: BASE + '/' });
      res.end();
      return;
    }
    const relPath = urlPath.slice(BASE.length) || '/';
    let filePath = join(ROOT, normalize(relPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    let data;
    try {
      data = await readFile(filePath);
    } catch {
      if (!extname(filePath)) {
        filePath = join(ROOT, 'index.html');
        data = await readFile(filePath);
      } else {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
}).listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}${BASE}/`);
});