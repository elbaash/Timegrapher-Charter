# ChronoGrapher

**A free, offline, installable PWA for watchmakers.** Photograph a Weishi Timegrapher display and instantly turn the reading into structured data. Keep a dated regulation history per watch, compare progress across attempts, and share clean PDF reports — all on your phone, with no internet, no accounts, no per-scan cost.

[**▶ Try the live app**](https://elbaash.github.io/Timegrapher-Charter/) &nbsp;·&nbsp; [**User guide — download & use**](docs/how-to-download-and-use.md)

[![Live app](https://img.shields.io/badge/Live%20app-elbaash.github.io-success)](https://elbaash.github.io/Timegrapher-Charter/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![OCR](https://img.shields.io/badge/OCR-on--device-orange)
![Offline](https://img.shields.io/badge/works-offline-green)

---

## Contents

- [What It Does](#what-it-does)
- [Screenshots](#screenshots)
- [How It Works](#how-it-works)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Building & Testing the PWA](#building--testing-the-pwa)
- [Deploying](#deploying)
- [Installing as a PWA on Your Phone](#installing-as-a-pwa-on-your-phone)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [OCR Accuracy](#ocr-accuracy)
- [Known Limitations](#known-limitations)
- [Documentation](#documentation)
- [License](#license)

---

## What It Does

1. **Photograph** a Weishi No.1000/1900 timegrapher display (or upload a photo from your gallery).
2. **Crop** to the display area for reliable OCR.
3. **Review** the extracted readings — Rate (s/d), Amplitude (°), Beat Error (ms), and Lift Angle (°) — and correct anything the OCR missed.
4. **Save** the readings as a dated table under a named watch.
5. **Regulate** the watch, scan again, and **compare progress** across all attempts in a position × attempt grid.
6. **Share** a PDF report of any dated table or the full comparison via the phone's share sheet.
7. **Back up & restore** all your watches and history as a JSON file — your data is never locked in.
8. **Regulate with maths on your side** — the built-in regulation calculator takes your per-position rates (typed or one-tap imported from the workspace), shows the current average, and tells you exactly how far to move the regulator to land on your target average, with the projected new rate for every position.

The 6-position order matches the Weishi machine's printed labels: **Dial Down → Crown Up → Crown Down → Crown Left → Crown Right → Dial Up**. Positions are auto-labelled in this order; you can edit them before saving.

---

## Screenshots

This is what you photograph — a Weishi No.1000 display (real photo from the OCR test set):

<p align="center">
  <img src="Timegrapher%20training%20images/Timegrapher/IMG_20260520_112019862_HDR.jpg" alt="Weishi timegrapher display showing Rate, Amplitude, Beat Error and Lift Angle" width="360" />
</p>

> 📷 **App screenshots coming soon** — the capture, review, watch history, and progress-comparison screens. (To add: drop PNGs into `docs/images/` and reference them here.)

---

## How It Works

- **OCR runs entirely on-device** using PaddleOCR PP-OCRv4 via `onnxruntime-web`. No photo ever leaves your phone.
- **Storage** uses IndexedDB (primary) with a localStorage mirror — your data survives browser restarts and quota pressure.
- **Offline PWA:** a service worker precaches the entire app (UI, OCR models, wasm, fonts) at install time. Once installed, the app works with the network fully off.
- **No backend, no API keys, no cloud.** The app is a static website — just HTML, JS, CSS, and the OCR models.

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js 18+** and **npm 9+**

### Setup

```bash
# Clone the repository
git clone https://github.com/elbaash/Timegrapher-Charter.git
cd Timegrapher-Charter

# Install dependencies (also copies OCR models into public/)
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The dev server uses webpack (not Turbopack — required for the OCR libraries to bundle correctly).

> **⚠️ Dev-server flakiness:** `next dev` occasionally starts 404-ing its own chunks (blank page). If this happens, kill the server, delete `.next/`, and restart. The production build is unaffected.

### Run Tests

```bash
npm test          # Vitest smoke tests (OCR parser + store logic)
npm run typecheck # TypeScript strict check
```

---

## Building & Testing the PWA

The production build is a **static export** — plain files in `out/` that any static host can serve.

```bash
# Build the static export + inject the service worker precache manifest
npm run build

# Serve the export locally on port 5001 (test the full PWA, including offline)
npm run serve:static
```

After running `npm run serve:static`, open [http://localhost:5001](http://localhost:5001). To test offline mode:
1. Open Chrome DevTools → Application → Service Workers → check "Offline".
2. Reload the page — the app should load from cache.
3. Run the full capture → OCR → review → save flow — it all works offline.

---

## Deploying

The app is a plain static export in `out/`. Any static host works:

### Option 1: GitHub Pages (this repo's live setup)

1. Make the repository **public** (GitHub Pages requires a public repo on the free plan).
2. **One-time:** in the repo Settings → Pages, set the source to **“Deploy from a branch” → `gh-pages` → root (`/`)**.
3. Deploy any time with:
   ```bash
   npm run deploy   # builds, then pushes out/ to the gh-pages branch (scripts/deploy-gh-pages.mjs)
   ```
4. The app is live at `https://<username>.github.io/Timegrapher-Charter/` a minute or two later. Installed phones pick up the update automatically the next time they open the app online.

### Option 2: Vercel

1. Import the repo into [Vercel](https://vercel.com).
2. Set the **Build Command** to `npm run build` and the **Output Directory** to `out`.
3. Deploy — Vercel auto-detects Next.js static export.

### Option 3: Netlify

1. Import the repo into [Netlify](https://netlify.com).
2. Set the **Build Command** to `npm run build` and the **Publish Directory** to `out`.
3. Deploy.

> **Note:** The `out/` directory is git-ignored. Always run `npm run build` before deploying — the postbuild script injects the service worker precache manifest with the correct file list and cache hash.

---

## Installing as a PWA on Your Phone

Once deployed to an HTTPS host:

- **Android (Chrome):** Open the site → tap the "Add to Home Screen" banner (or ⋮ → Add to Home Screen).
- **iOS (Safari):** Open the site → tap the Share button → "Add to Home Screen".

The app will open in standalone mode (no browser chrome) and work fully offline after the first visit.

> **End-user guide:** [docs/how-to-download-and-use.md](docs/how-to-download-and-use.md) — a plain-language download & usage guide for watchmakers (no dev knowledge required).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main SPA — all tabs, state, and handlers
│   ├── layout.tsx            # Root layout — metadata, manifest, font, Toaster, SW registration
│   └── globals.css           # Tailwind + print styles
├── components/
│   ├── uploader.tsx          # Batch upload + camera capture + crop-to-display
│   ├── onboarding-dialog.tsx # First-run quick-start guide (reopenable from FAQ tab)
│   ├── manual-entry-form.tsx # Zod-validated fallback entry
│   ├── readings-table.tsx    # Active-session table + print/share/save actions
│   ├── readings-view.tsx     # Read-only table used in the watch timeline
│   ├── watch-compare.tsx     # Progress grid: position × every attempt, per metric
│   ├── sw-register.tsx       # Registers /sw.js (production only)
│   ├── app-header.tsx / faq.tsx
│   └── ui/                   # ShadCN primitives
├── lib/
│   ├── ocr-paddle.ts         # In-browser PaddleOCR engine
│   ├── parse-reading.ts      # Tolerant range-based parser for OCR text
│   ├── watch-store.ts        # Load/save/merge/backup of the watch archive
│   ├── db.ts                 # Minimal IndexedDB promise wrapper
│   ├── report.ts             # jsPDF report builders + share-sheet/download
│   └── utils.ts              # cn()
├── hooks/                    # use-toast, use-mobile
└── types/index.ts            # POSITIONS, TimegrapherReading, ReadingsTable, Watch, Backup

scripts/
├── setup-ocr-assets.mjs      # Copies ONNX models + wasm into public/ (runs on install/build)
└── build-sw-precache.mjs     # postbuild: injects full out/ file list into out/sw.js

public/
├── manifest.webmanifest      # PWA manifest
├── sw.js                     # Service worker template (precache manifest injected at build)
├── icons/                    # App icons (192, 512, maskable-512)
├── models/                   # OCR models (git-ignored, generated from node_modules)
└── ort/                      # ONNX Runtime wasm (git-ignored, generated from node_modules)

Timegrapher training images/  # 17 real Weishi photos — ground-truth OCR test set
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), static export (`output: 'export'`) |
| Language | TypeScript 5 (strict) |
| OCR | PaddleOCR PP-OCRv4 via `onnxruntime-web` + `@gutenye/ocr-browser` |
| UI | React 18, Tailwind CSS 3.4, ShadCN/Radix, Lucide icons |
| Fonts | `next/font` Inter (self-hosted — works offline) |
| PDF Reports | `jspdf` + `jspdf-autotable` (fully offline) |
| Persistence | IndexedDB primary + localStorage mirror |
| Offline | Service worker with build-time precache manifest |
| Tests | Vitest |
| Backend | **None** — the app is a static website |

---

## OCR Accuracy

PaddleOCR PP-OCRv4 achieves **~97% field accuracy** on real Weishi photos (benchmarked against 17 ground-truth images in `Timegrapher training images/`). The previous Tesseract-based engine achieved ~53%. The human **Review** step catches any residual errors (most commonly the rate +/− sign).

---

## Known Limitations

- **iOS PWA storage:** iOS can evict all site storage under disk pressure. Export your data regularly (the onboarding dialog reminds you).
- **Dev server:** `next dev` uses webpack (Turbopack was dropped because it can't bundle `onnxruntime-web`/`opencv-js`). It's slower and occasionally flakes — the production build is fine.
- **OCR download size:** ~28 MB of models + wasm are downloaded on first visit and precached by the service worker. Subsequent visits are instant.
- **No native app store build (yet):** The PWA is the primary distribution. Wrapping via Capacitor for app store submission is a documented future option.

---

## Documentation

- **[docs/how-to-download-and-use.md](docs/how-to-download-and-use.md)** — End-user guide: how watchmakers install the app and use it day-to-day.
- **[MASTER-PLAN.md](MASTER-PLAN.md)** — Single source of truth: purpose, architecture, roadmap, changelog, and all milestone definitions of done.
- **[CLAUDE.md](CLAUDE.md)** — Code-navigation detail: tech stack table, folder structure, conventions, dev scripts, and gotchas.
- **[BUILD-PLAN.md](BUILD-PLAN.md)** — Historical build plan (superseded by MASTER-PLAN.md; kept for the OCR implementation log).
- **[Handover.md](Handover.md)** — Historical handover notes from the Gemini/cloud era (superseded).

---

## License

Released under the [MIT License](LICENSE) — free to use, modify, and redistribute with attribution.

The OCR models (PaddleOCR PP-OCRv4) are subject to their own license terms from PaddlePaddle; they are fetched from the `onnxruntime-web`/`@gutenye/ocr-browser` packages at install time and are not redistributed in this repository.