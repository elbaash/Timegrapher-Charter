"use client";

// Client-side OCR: runs entirely in the browser (Tesseract.js / WASM), fully offline once the
// engine + model are cached.
//
// Two passes:
//   1. Detect — OCR the whole (downscaled) photo at each rotation; keep the orientation whose parse
//      scores highest. This handles upside-down / rotated photos.
//   2. Zoom — from that pass, find the reading line's bounding box, crop to that band on a HIGH-res
//      render of the same rotation, and re-OCR just the strip. The tiny rate digits (and the +/-
//      sign) become large and far more legible. Keep whichever pass parsed better.

import { createWorker, PSM, type Worker } from "tesseract.js";
import { parseReadingText, type ParsedReading } from "./parse-reading";

export type OcrOutcome = {
  parsed: ParsedReading;
  rawText: string;
  angle: number;
};

type Line = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };

const ROTATIONS = [0, 180, 90, 270]; // most-common orientations first
const GOOD_ENOUGH = 3; // stop the detect loop early once a rotation parses this many fields
const DETECT_EDGE = 1500; // long-edge px for the detection pass
const ZOOM_EDGE = 3000; // long-edge px for the high-res band crop

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

// Draw the image rotated by `deg`, scaled so its long edge is ~maxEdge px.
function rotatedCanvas(img: HTMLImageElement, deg: number, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
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
  return canvas;
}

// Flatten Tesseract's block tree to lines and pick the one that looks like the reading value line.
function findValueLine(blocks: unknown): Line | null {
  const lines: Line[] = [];
  for (const blk of (blocks as { paragraphs?: { lines?: Line[] }[] }[]) ?? []) {
    for (const par of blk.paragraphs ?? []) {
      for (const ln of par.lines ?? []) {
        if (ln?.bbox) lines.push(ln);
      }
    }
  }
  return (
    lines.find((l) => /\/\s*d|s\s*\/?\s*d/i.test(l.text)) ??
    lines.find((l) => (l.text.match(/\d/g)?.length ?? 0) >= 4) ??
    null
  );
}

async function recognize(worker: Worker, canvas: HTMLCanvasElement) {
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  return data;
}

export async function runClientOcr(dataUrl: string): Promise<OcrOutcome> {
  const img = await loadImage(dataUrl);
  const worker = await createWorker("eng");

  try {
    // Pass 1 — detect orientation on the downscaled full image.
    let best: { data: Awaited<ReturnType<typeof recognize>>; angle: number; parsed: ParsedReading; detW: number } | null = null;
    for (const angle of ROTATIONS) {
      const canvas = rotatedCanvas(img, angle, DETECT_EDGE);
      const data = await recognize(worker, canvas);
      const parsed = parseReadingText(data.text);
      if (!best || parsed.score > best.parsed.score) best = { data, angle, parsed, detW: canvas.width };
      if (best.parsed.score >= GOOD_ENOUGH) break;
    }
    if (!best) return { parsed: parseReadingText(""), rawText: "", angle: 0 };

    // Pass 2 — zoom into the reading band at high resolution and re-OCR.
    const line = findValueLine(best.data.blocks);
    if (line) {
      const hi = rotatedCanvas(img, best.angle, ZOOM_EDGE);
      const ratio = hi.width / best.detW;
      const padY = (line.bbox.y1 - line.bbox.y0) * 0.15; // tight — just the value line, no header/graph
      const cy0 = Math.max(0, Math.round((line.bbox.y0 - padY) * ratio));
      const cy1 = Math.min(hi.height, Math.round((line.bbox.y1 + padY) * ratio));
      const crop = document.createElement("canvas");
      crop.width = hi.width; // full width keeps every column (rate…beat rate)
      crop.height = Math.max(1, cy1 - cy0);
      const ctx = crop.getContext("2d");
      if (ctx) {
        ctx.drawImage(hi, 0, cy0, hi.width, crop.height, 0, 0, hi.width, crop.height);
        // The band is a single line of digits + units — constrain Tesseract accordingly so it
        // can't invent words, and whitelist just the characters that actually appear there.
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_LINE,
          tessedit_char_whitelist: "0123456789+-.,/ sSdDmM°º",
        });
        const data2 = await recognize(worker, crop);
        const parsed2 = parseReadingText(data2.text);
        if (parsed2.score >= best.parsed.score) {
          best = { ...best, data: data2, parsed: parsed2 };
        }
      }
    }

    return { parsed: best.parsed, rawText: best.data.text, angle: best.angle };
  } finally {
    await worker.terminate();
  }
}
