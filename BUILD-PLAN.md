# ChronoGrapher — Build Plan (living checklist)

> Tick items off as we go. This is the current source of truth for what we're building and
> where we are. Last updated: 2026-07-05.

## The decision (why this plan)

Goal: a **lightweight, offline app** a watchmaker uses to **photograph the timegrapher display**,
auto-extract the readings into a **table**, keep **multiple dated tables per named watch**, see a
**before/after comparison**, and **share** it.

Chosen approach: **build the existing web app into an installable PWA** (Progressive Web App).
- Iterate fast here in the browser; install on the phone via "Add to Home Screen".
- OCR runs **in the browser** (Tesseract.js) → fully offline, no API key, no server, no per-scan cost.
- Later, if ever wanted, the PWA can be wrapped into a real App Store / Play listing with little rework.

Evidence this works: an in-browser OCR test on the 17 real photos read the readings on 13/17 at
first pass (no tuning) — amplitude / beat error / lift angle / beat rate very reliable; the rate
number is the weak field (helped by crop + rotate + the human review step).

**Status of the Expo mobile project:** PARKED (kept, not deleted). The PWA is now the product;
`../timegrapher-mobile/` is on hold unless native OCR is later needed.

---

## Phase 1 — OCR pipeline (client-side) ← CURRENT FOCUS
Prove and refine the riskiest part first: photo → readings, in the browser, with review.

- [x] Add `tesseract.js` dependency
- [x] Deterministic parser: OCR text → `{ rate, amplitude, beatError, liftAngle, beatRate? }`
      (`src/lib/parse-reading.ts`) — regex on the value line, tolerant of OCR noise; validated
      against the real OCR strings (amplitude 12/12, beat error ~11/12, rate ~9/12 before review)
- [x] Client OCR runner (`src/lib/ocr.ts`): load image → try rotations → OCR → parse → best result
- [x] Auto-orientation: pick the rotation whose parse scores highest (fixes upside-down photos)
- [x] Wire `uploader.tsx` to call the client OCR instead of the Gemini server action
- [x] Keep the existing Review step (unchanged — human corrects fields before saving)
- [x] Smoke-tested live in the browser (dev server) on 2 representative photos — upright AND
      upside-down — both populate rate + amplitude + beat error into Review. Offline, no server.
      Parser rewritten to assign numbers by value-range (units ° / ms OCR unreliably), with a
      dropped-decimal fallback for beat error. Production build passes.
      Known residuals (left to the human Review step): the +/- rate **sign** is often lost by OCR,
      and lift angle defaults to 52 (not read).
- [x] Refine: crop-to-reading-band before OCR — two-pass in `ocr.ts` (detect line bbox → crop to a
      high-res single-line band → re-OCR with single-line PSM + char whitelist; keep the better parse).
      Verified live: on the upside-down photo it CORRECTED amplitude 180→150 and beat rate
      12800→19800 vs the low-res pass. Residual: the +/- rate sign is still dropped by OCR
      (`+`→nothing, `-`→`s`) — a review-step correction, not fixable by resolution.
- [ ] Sweep all 17 images for an accuracy baseline (optional; representative 2 pass well)
- [ ] Self-host the Tesseract worker/wasm/model (default fetches from CDN — needed for true offline) ← NEXT
- [ ] Remove Gemini/Genkit path once client OCR is trusted (deps, `actions.ts`, `src/ai/`, dev scripts)

## Phase 2 — Data model + the real features
Grow beyond the current one-off session model to watches with history.

- [x] Data model: `Watch` (named) → many date/time-stamped `ReadingsTable`s → readings (`types/index.ts`)
- [x] Persistence (`lib/watch-store.ts`) — localStorage with one-time migration from the legacy
      `chronoSessions` archive. (IndexedDB deferred until we store photos; readings are small.)
- [x] Watches list → Watch detail = reverse-chronological timeline of its tables (`page.tsx`,
      `components/readings-view.tsx`). Verified live: manual reading → Save to Watch → list → detail.
- [x] Capture flow saves a new dated table under the current watch (name+ref match, or new watch);
      workspace clears but keeps name/ref so the next capture (e.g. "after") attaches to the same watch
- [x] Manual entry retained as the fallback
- [x] Progress comparison (`components/watch-compare.tsx`) — NOT limited to two: a grid of
      position × every attempt (oldest→newest) per metric (Rate/Amplitude/Beat Error), with
      green/amber trend vs the previous attempt. Timeline/Compare toggle in the watch detail.
      Verified live on a 2-attempt watch showing convergence toward zero.
- [ ] **Camera capture** in-browser (phone camera), gallery still available ← NEXT
- [ ] Share: export a table (or a comparison) to PDF/image via the share sheet

## Phase 3 — Make it an installable, offline PWA
- [ ] Web app manifest (name, icons, theme colour, standalone display)
- [ ] App icons (192/512) + splash; favicon
- [ ] Service worker: offline caching of app shell + Tesseract wasm/model (self-hosted, not CDN)
- [ ] Static export (`output: 'export'`) so it can be hosted anywhere / bundled
- [ ] Test "Add to Home Screen" on the phone; confirm it works with no network
- [ ] Docs pass: update CLAUDE.md / Handover.md to describe the PWA

---

## Done already (2026-07-05)
- [x] Slimmed & secured the web app (removed inert Firebase + unused recharts; re-enabled build checks; fixed build script)
- [x] Confirmed the readout is clean printed text; chose in-browser OCR (Tesseract.js)
- [x] Validated OCR on 17 real photos (13/17 readable at first pass)
- [x] Decided approach: PWA, iterate here; Expo project parked
