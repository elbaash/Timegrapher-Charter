# ChronoGrapher — CLAUDE.md

> ## 📌 Source of truth: [`MASTER-PLAN.md`](MASTER-PLAN.md)
> Read **`MASTER-PLAN.md`** first — purpose, goals, architecture, current state, risks, roadmap, and
> a dated changelog. It supersedes this file, `BUILD-PLAN.md`, and `Handover.md` wherever they
> disagree. This file is code-navigation detail only. _(Refreshed 2026-07-13 — the old Gemini/
> Firebase/customer-session notes are gone; that design no longer exists.)_

## What This App Does

A **free, offline, installable PWA** for watchmakers. It OCRs photos of a **Weishi Timegrapher**
display **on-device** (PaddleOCR in the browser — no cloud, no API key) to extract Rate (s/d),
Amplitude (°), Beat Error (ms), and Lift Angle (°). Readings are human-reviewed, then saved as
**dated tables under a named watch**, so the watchmaker can regulate over several passes, compare
progress across attempts, back up/restore everything as JSON, and share PDF reports.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), **static export** (`output: 'export'` → `out/`) |
| Dev bundler | **webpack** (`next dev`; Turbopack dropped so onnxruntime-web/opencv bundle) |
| Language | TypeScript 5 strict; build errors enforced |
| OCR | PaddleOCR PP-OCRv4 in-browser via `onnxruntime-web` + `@gutenye/ocr-browser` |
| UI | React 18, Tailwind CSS 3.4, ShadCN/Radix, Lucide; `next/font` Inter (self-hosted) |
| PDF reports | `jspdf` + `jspdf-autotable`, fully offline |
| Persistence | **IndexedDB** primary + localStorage mirror (`src/lib/watch-store.ts`, `src/lib/db.ts`) |
| Offline | Service worker (`public/sw.js`) with build-time precache manifest |
| Tests | Vitest (`npm test`) — smoke tests for the OCR parser and store logic |
| Backend / AI cloud | **None.** Firebase removed 2026-07-05; Genkit/Gemini removed 2026-07-13 |

---

## Folder Structure

```
src/
├── app/
│   ├── page.tsx          # Main SPA — all tabs, all state, all handlers
│   ├── layout.tsx        # Root layout — metadata/manifest, font, Toaster, SW registration
│   └── globals.css       # incl. @media print styles
├── components/
│   ├── uploader.tsx           # Batch upload + "Take photo" camera capture + crop-to-display
│   ├── onboarding-dialog.tsx  # First-run quick-start guide (reopenable from FAQ tab)
│   ├── manual-entry-form.tsx  # Zod-validated fallback entry
│   ├── readings-table.tsx     # Active-session table + print/share/save actions
│   ├── readings-view.tsx      # Read-only table used in the watch timeline
│   ├── watch-compare.tsx      # Progress grid: position × every attempt, per metric
│   ├── sw-register.tsx        # Registers /sw.js (production only)
│   ├── app-header.tsx / faq.tsx
│   └── ui/                    # ShadCN primitives
├── lib/
│   ├── ocr-paddle.ts     # In-browser PaddleOCR engine (rotation retry for upside-down shots)
│   ├── parse-reading.ts  # Tolerant range-based parser for the OCR text  [tested]
│   ├── watch-store.ts    # Load/save/merge/backup of the watch archive   [tested]
│   ├── db.ts             # Minimal IndexedDB promise wrapper (single kv store)
│   ├── report.ts         # jsPDF report builders + share-sheet/download
│   └── utils.ts          # cn()
├── hooks/                # use-toast, use-mobile
└── types/index.ts        # POSITIONS, TimegrapherReading, ReadingsTable, Watch, Backup shapes

scripts/
├── setup-ocr-assets.mjs      # Copies ONNX models + wasm into public/ (postinstall/predev/prebuild)
└── build-sw-precache.mjs     # postbuild: injects full out/ file list into out/sw.js (offline)

public/
├── manifest.webmanifest, icons/, sw.js (template — see build-sw-precache)
└── models/, ort/             # git-ignored, regenerated from node_modules

Timegrapher training images/  # 17 real Weishi photos — the ground-truth OCR test set
```

---

## Key Conventions

- All app state lives in `page.tsx`, passed down via props; `isHydrated` guards the async
  IndexedDB load before first render.
- Storage: IndexedDB `chronographer/kv/watches` is primary; localStorage `chronoWatches` is a
  best-effort mirror and one-time migration source; `chronoCurrentSession` holds the volatile
  workspace; `chronoOnboarded` gates the first-run dialog.
- All measurement values are stored as **strings**.
- `POSITIONS` in `src/types/index.ts` drives every position dropdown; photos are auto-labelled in
  the machine's printed order (Dial Down → Crown Up → Down → Left → Right → Dial Up).
- Backup files are a versioned envelope (`{app, schema, exportedAt, watches}`); import **merges**
  (by name+ref, tables unioned by id) and never deletes.

## Dev Scripts

```bash
npm run dev           # dev server (webpack; SW deliberately NOT registered in dev)
npm run build         # static export to out/ + SW precache injection (postbuild)
npm run serve:static  # build then serve out/ on :5001 — use this to test the PWA/offline
npm run deploy        # build then publish out/ to the gh-pages branch (GitHub Pages)
npm test              # vitest smoke tests
npm run typecheck     # tsc --noEmit — run before shipping
```

## Gotchas

- **Dev-server flakiness:** `next dev` (webpack) occasionally starts 404-ing its own chunks →
  blank page. Fix: kill it, delete `.next/`, restart. The production build is unaffected.
- The SW precache manifest is injected **into `out/sw.js` only** — `public/sw.js` keeps the
  `__PRECACHE_MANIFEST__` placeholder. Never hand-edit `out/`.
- **Deploying:** `npm run deploy` force-pushes `out/` to the `gh-pages` branch — build output must
  never be committed to `main` (a 55 MB artifact commit there is what drifted in the 2026-08 outage).
- **Service-worker invariants:** never cache non-OK navigation responses as the shell; precache is
  per-file and fault-tolerant. See the header comment of `public/sw.js` (and MASTER-PLAN §11).
- OCR assets (~40 MB) are git-ignored and regenerated by `scripts/setup-ocr-assets.mjs`.
- Testing in the browser pane: never click controls that trigger real downloads/print dialogs —
  stub `URL.createObjectURL` / anchor clicks and inspect the blob instead.
