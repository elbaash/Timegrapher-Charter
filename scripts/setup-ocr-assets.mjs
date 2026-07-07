// Copies the OCR runtime assets (PaddleOCR ONNX models + the one onnxruntime-web wasm we use)
// from node_modules into public/ so they're served at /models and /ort. Run automatically on
// install and before dev/build. These assets are git-ignored — regenerated from dependencies.

import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const FILES = [
  ["node_modules/@gutenye/ocr-models/assets/ch_PP-OCRv4_det_infer.onnx", "public/models/ch_PP-OCRv4_det_infer.onnx"],
  ["node_modules/@gutenye/ocr-models/assets/ch_PP-OCRv4_rec_infer.onnx", "public/models/ch_PP-OCRv4_rec_infer.onnx"],
  ["node_modules/@gutenye/ocr-models/assets/ppocr_keys_v1.txt", "public/models/ppocr_keys_v1.txt"],
  // onnxruntime-web's default build loads the "jsep" wasm at runtime (confirmed via network); include
  // the plain variant too so we're robust to version differences. (asyncify/jspi are not used.)
  ["node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm", "public/ort/ort-wasm-simd-threaded.jsep.wasm"],
  ["node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs", "public/ort/ort-wasm-simd-threaded.jsep.mjs"],
  ["node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm", "public/ort/ort-wasm-simd-threaded.wasm"],
  ["node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs", "public/ort/ort-wasm-simd-threaded.mjs"],
];

let copied = 0;
for (const [src, dst] of FILES) {
  if (!existsSync(src)) {
    console.warn(`[setup-ocr-assets] missing dependency file: ${src}`);
    continue;
  }
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied++;
}
console.log(`[setup-ocr-assets] ${copied}/${FILES.length} OCR assets ready in public/`);
