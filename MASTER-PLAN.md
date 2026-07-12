# ChronoGrapher — Master Plan

**Single source of truth for this project.** Supersedes `BUILD-PLAN.md` and `Handover.md`;
`CLAUDE.md` points here. If anything elsewhere disagrees with this file, this file wins.

_Last updated: 2026-07-07._

> **Reading this cold?** Sections 1–3 tell you what the app is and who it's for. Section 6 is what's
> already built. Sections 7–8 are what's left and in what order. To pick the next task: go to the
> Roadmap (§8), take the first milestone that isn't done, and build to its Definition of Done.

---

## 1. Purpose & Vision
ChronoGrapher is a **free, offline, installable web app** that lets a watchmaker **photograph a Weishi
Timegrapher display and instantly turn the reading into structured data**, then keep a **dated history
per watch** so they can regulate over several passes, see the numbers converge (before/after), and
**share a clean report** — all on a phone, with no internet, no accounts, no per-scan cost.

**Vision:** the fastest, no-friction way for any watchmaker to log timegrapher readings and prove the
improvement they made to a watch.

## 2. Goals & Non-Goals
**Goals:** photo → readings in seconds, on-device & offline; per-watch history and progression; never
lose data (export/backup); trivial to install and share; works for *other* watchmakers, not just the
author.

**Non-Goals (v1):** no cloud accounts/sync/multi-user; no payments/licensing (the app is free); no
native App-Store build (an installable PWA is the final form — wrapping via Capacitor is a documented
*future* option); not a full servicing CRM — scope is timegrapher readings + history + share.

## 3. Users & Core Use Cases
**User:** a professional or hobbyist watchmaker with a Weishi No.1000/1900 timegrapher and a phone.

1. **Regulate a watch:** create/select a watch → photograph the 6 positions → review/correct the
   readings → save a dated table → adjust the watch → repeat → **compare progress** → **share**.
2. **Look back:** open a watch → scroll its dated history (evidence of work done over time).
3. **Manual fallback:** type readings in by hand when a photo won't cooperate.

**The machine's 6-position order (printed on the Weishi, used for auto-labelling):**
Dial Down → Crown Up → Crown Down → Crown Left → Crown Right → Dial Up.

## 4. Requirements
**MUST (v1):**
- On-device OCR of the 4 fields (Rate / Amp / Beat Error / Lift Angle) with a human **Review** step. **[DONE]**
- **Named watches** → dated readings tables → **timeline**. **[DONE]**
- **Progress comparison** across all attempts (not just two). **[DONE]**
- **Crop-to-display** for reliability; positions **auto-labelled** in machine order, editable. **[DONE]**
- **Camera capture** on the phone (take the photo in-app, not only gallery). **[TODO]**
- **Share/export** a table (and a comparison) as PDF/image via the share sheet. **[TODO]**
- **Data export & import (backup)** so a watch's history can't just vanish. **[TODO — critical]**
- **Installable, fully-offline PWA** (manifest, icons, service worker; works with no network). **[TODO]**
- **First-run onboarding/help** for watchmakers new to the app. **[TODO]**

**SHOULD:** robust storage (**IndexedDB**) for quota + eviction resilience; trim OCR download weight and
confirm phone performance; delete dead code (old Tesseract path, Gemini/Genkit remnants).

**COULD (post-v1):** Capacitor store wrap; live camera with a framing-guide overlay; multi-language OCR;
confidence hints.

## 5. Architecture & Tech
- **Framework:** Next.js (App Router) SPA. Almost all app state lives in `src/app/page.tsx`.
- **Persistence:** `localStorage` today via `src/lib/watch-store.ts`; **IndexedDB planned** (data safety).
- **Data model:** `Watch → ReadingsTable → readings` in `src/types/index.ts`.
- **OCR:** PaddleOCR **PP-OCRv4** running in-browser via `onnxruntime-web` + `@gutenye/ocr-browser`
  (`src/lib/ocr-paddle.ts`). Tolerant range-based parser in `src/lib/parse-reading.ts`.
- **OCR assets:** models + the one wasm we use are self-hosted under `public/models` and `public/ort`,
  **git-ignored**, regenerated from `node_modules` by `scripts/setup-ocr-assets.mjs` (runs on
  install / predev / prebuild).
- **PWA target:** static export + web manifest + service worker for offline (not built yet — Milestone D).
- **Dev caveat:** dev runs on **webpack** (Turbopack was dropped so onnxruntime-web/opencv bundle;
  `next.config.ts` has `fs`/`path` fallbacks). See Risks.

## 6. Current State (verified) — 2026-07-07
Work lives on branch **`feat/offline-pwa-ocr-watches`** (local, **not pushed**). Key commits:
`8cef6c9` (offline PWA rebuild + watch history), `5a6e8dc` (training photos), `16b0197` (PaddleOCR + crop
+ positions + lift angle).

Built and **verified live in the browser**:
- **PaddleOCR** in-browser — benchmarked **97% field accuracy vs Tesseract's 53%** on 17 real photos;
  reads the +/− sign and beat error even on wide/upside-down shots. ~2s warm per image.
- **Crop-to-display** step (react-easy-crop) for wide/awkward shots.
- **Watch data model** + Watches list + reverse-chronological **timeline**.
- **Progress comparison** grid (position × every attempt, per metric, trend-coloured).
- **Position auto-labelling** in machine order; **Lift Angle** now read from the display.
- "Batch photos" tab; table/review titles match the machine (Rate / Amp / B.E. / L.A.); amber cue on
  blank Review fields.
- Production build is green.

17 real Weishi photos are in `Timegrapher training images/` — the ground-truth OCR test set.

## 7. Weak Points / Risks / Tech Debt (honest)
- **Data loss (CRITICAL):** data is in `localStorage` only; phone browsers can evict it. → Milestone B
  (export/import + IndexedDB).
- **Not yet offline:** OCR models fetch on first use; no service worker. → Milestone D.
- **Dev friction:** webpack dev (no Turbopack) is slow and occasionally throws a cold-start
  `ChunkLoadError` (a reload clears it). The **production build is fine**.
- **Weight:** ~26 MB wasm + ~15 MB models downloaded on first use (cached afterwards).
- **No tests** at any level.
- **Dead code:** unused Tesseract path (`src/lib/ocr.ts`) and the old Gemini/Genkit layer
  (`src/ai/`, `src/app/actions.ts`) still present.
- **Stale docs:** `Handover.md` (and historically `CLAUDE.md`) describe the old Gemini/cloud design.
- **iOS PWA limits:** install is Safari-only and storage can be evicted — matters when sharing widely.
- **OCR residual:** the rate +/− sign is occasionally missed (Review + the amber cue catch it).
- **Parked sibling:** `../timegrapher-mobile` (Expo/native) is on hold — keep or retire (see §10).

## 8. Roadmap to v1 — each milestone has a Definition of Done (DoD)
**Recommended order: B → A → C → D → E → F.** Data safety (B) is the single highest priority — do it
first even though A appears earlier, because losing a watchmaker's history is the worst failure. A
(camera capture) is small; slot it in right after B. Then C–F in sequence. Build each to its DoD before
moving on.

- **A — Trustworthy capture** _(mostly done)._ Remaining: in-app **camera capture** (phone camera, keep
  gallery as fallback). **DoD:** take a photo in-app on a phone and it flows into Review.
- **B — Don't lose data (CRITICAL).** Move persistence to **IndexedDB**; add **Export** (download a JSON
  backup of all watches) and **Import** (restore). **DoD:** export a backup, clear storage, import →
  every watch and dated table is restored; verified end-to-end.
- **C — Share the result.** Generate a **PDF/image** of a readings table and of a comparison, shared via
  the native share sheet. **DoD:** from a watch, produce a shareable PDF that opens correctly.
- **D — Installable & offline.** Web **manifest** + app **icons** + **service worker** caching the app
  shell and OCR models/wasm; static export. **DoD:** "Add to Home Screen" on a phone; disable the
  network; capture → review → save still works fully offline.
- **E — Ready for others.** First-run **onboarding/help** (how to frame the photo, the 6-position order,
  review tips); friendly empty states; a shareable **install link**. **DoD:** a watchmaker who has never
  seen the app can install it and log a watch without help.
- **F — Cleanup & confidence.** Remove dead Tesseract/Genkit code; trim OCR download weight; add a couple
  of smoke tests; refresh docs. **DoD:** clean build, no dead OCR/AI code, docs accurate.

_Post-v1:_ Capacitor store wrap; live camera with a framing guide; multi-language OCR.

## 9. Success Criteria (v1 "done")
A watchmaker can **install it from a link**, use it **fully offline**, **photograph** a Weishi display and
get correct readings after a quick review, keep a **dated history per watch**, see **before/after
progress**, **share a PDF**, and **back up / restore** their data — no accounts, no cost.

## 10. Open Decisions
- Retire or keep the parked Expo project (`../timegrapher-mobile`)?
- Where to host the install link (GitHub Pages / Vercel / Netlify static)?
- Name / icon / light branding for the shared version.

## 11. Living Status / Changelog
Append dated entries; tick Milestones A–F as they land.

- **2026-07-05** — Rebuilt as an offline PWA direction: removed inert Firebase, chose in-browser OCR,
  added the named-watch data model + timeline + comparison. (commit `8cef6c9`)
- **2026-07-06** — Crop-to-display step for real-world photo reliability.
- **2026-07-07** — Switched OCR engine to PaddleOCR (97% vs 53%); position auto-labelling; lift-angle
  capture; "Batch photos" rename; machine-matched titles. (commit `16b0197`)
- **2026-07-07** — Authored this Master Plan as the single source of truth.
