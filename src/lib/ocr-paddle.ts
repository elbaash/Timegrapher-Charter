"use client";

// PaddleOCR (PP-OCRv4) running fully in the browser via onnxruntime-web + @gutenye/ocr-browser.
// Same models as the desktop benchmark, so the accuracy carries over. Detection deskews text boxes
// but there's no angle classifier here, so we try a few whole-image rotations for upside-down shots
// and keep the best-parsing result. Models + wasm are self-hosted under /models and /ort for offline.

import { parseReadingText, type ParsedReading } from "./parse-reading";

export type OcrOutcome = {
  parsed: ParsedReading;
  rawText: string;
  angle: number;
};

type Line = { text: string; mean?: number; box?: number[][] };
type OcrEngine = { detect: (image: string, options?: unknown) => Promise<Line[]> };

const ROTATIONS = [0, 180, 90, 270];
const GOOD_ENOUGH = 3;
const MAX_EDGE = 1600; // detection input long-edge (speed vs accuracy)

let enginePromise: Promise<OcrEngine> | null = null;

async function getEngine(): Promise<OcrEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const [{ default: Ocr }, ort] = await Promise.all([
        import("@gutenye/ocr-browser"),
        import("onnxruntime-web"),
      ]);
      // Single-threaded avoids needing COOP/COEP cross-origin-isolation headers.
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = "/Timegrapher-Charter/ort/";
      return (await Ocr.create({
        models: {
          detectionPath: "/Timegrapher-Charter/models/ch_PP-OCRv4_det_infer.onnx",
          recognitionPath: "/Timegrapher-Charter/models/ch_PP-OCRv4_rec_infer.onnx",
          dictionaryPath: "/Timegrapher-Charter/models/ppocr_keys_v1.txt",
        },
      })) as unknown as OcrEngine;
    })();
  }
  return enginePromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function rotatedDataUrl(img: HTMLImageElement, deg: number): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  const swap = deg % 180 !== 0;
  canvas.width = swap ? h : w;
  canvas.height = swap ? w : h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

// Pick the line that looks like the reading value; fall back to all detected text joined.
function readingText(lines: Line[]): string {
  const texts = lines.map((l) => l.text);
  return texts.find((t) => /s\s*\/?\s*d/i.test(t)) ?? texts.join(" ");
}

export async function runPaddleOcr(dataUrl: string): Promise<OcrOutcome> {
  const engine = await getEngine();
  const img = await loadImage(dataUrl);
  let best: OcrOutcome | null = null;

  for (const angle of ROTATIONS) {
    const input = rotatedDataUrl(img, angle);
    let lines: Line[] = [];
    try {
      lines = await engine.detect(input);
    } catch {
      continue;
    }
    const raw = readingText(lines);
    const parsed = parseReadingText(raw);
    if (!best || parsed.score > best.parsed.score) {
      best = { parsed, rawText: lines.map((l) => l.text).join(" "), angle };
    }
    if (best.parsed.score >= GOOD_ENOUGH) break;
  }

  return best ?? { parsed: parseReadingText(""), rawText: "", angle: 0 };
}
