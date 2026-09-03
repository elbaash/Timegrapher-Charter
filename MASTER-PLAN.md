# ChronoGrapher — Master Plan

**Single source of truth for this project.** Supersedes `BUILD-PLAN.md` and `Handover.md`;
`CLAUDE.md` points here. If anything elsewhere disagrees with this file, this file wins.

_Last updated: 2026-08-28._

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
- **Camera capture** on the phone (take the photo in-app, not only gallery). **[DONE]**
- **Share/export** a table (and a comparison) as PDF/image via the share sheet. **[DONE]**
- **Data export & import (backup)** so a watch's history can't just vanish. **[DONE]**
- **Installable, fully-offline PWA** (manifest, icons, service worker; works with no network). **[DONE]**
- **First-run onboarding/help** for watchmakers new to the app. **[DONE]**

**SHOULD:** robust storage (**IndexedDB**) for quota + eviction resilience **[DONE]**; trim OCR download weight and
confirm phone performance; delete dead code (old Tesseract path, Gemini/Genkit remnants).

**COULD (post-v1):** Capacitor store wrap; live camera with a framing-guide overlay; multi-language OCR;
confidence hints.

## 5. Architecture & Tech
- **Framework:** Next.js (App Router) SPA. Almost all app state lives in `src/app/page.tsx`.
- **Persistence:** **IndexedDB** primary (`src/lib/db.ts`, single atomic value) via `src/lib/watch-store.ts`,
  with a best-effort localStorage mirror as a second copy; one-time migration from the old localStorage
  keys; `navigator.storage.persist()` requested on load. Versioned JSON backup export/import (merge-only,
  idempotent) from the Watches tab.
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
- ~~**Data loss (CRITICAL)**~~ **Resolved 2026-07-12** by Milestone B: IndexedDB primary + localStorage
  mirror + JSON export/import. Residual: iOS can still evict all site storage — export remains the true
  safety net (onboarding should tell users to back up).
- ~~**Not yet offline**~~ **Resolved 2026-07-13** by Milestone D: service worker precaches the whole
  export; verified working with the network fully down.
- **Dev friction:** webpack dev (no Turbopack) is slow and occasionally starts 404-ing its own
  chunks (blank page) — kill it, delete `.next/`, restart. The **production build is fine**.
- **Weight:** ~13 MB wasm + ~15 MB models, all precached on install (was ~26 MB wasm; plain
  variant dropped 2026-07-13).
- ~~**No tests**~~ **Partly resolved 2026-07-13:** 10 Vitest smoke tests over the OCR parser and
  store/backup logic. Still no component/E2E tests.
- ~~**Dead code**~~ **Resolved 2026-07-13:** Tesseract path, Genkit/Gemini layer, and their deps
  deleted.
- ~~**Stale docs**~~ **Resolved 2026-07-13:** `CLAUDE.md` rewritten. `Handover.md`/`BUILD-PLAN.md`
  remain historical — this file supersedes them.
- **iOS PWA limits:** install is Safari-only and storage can be evicted — matters when sharing widely.
- **OCR residual:** the rate +/− sign is occasionally missed (Review + the amber cue catch it).
- **Parked sibling:** `../timegrapher-mobile` (Expo/native) is on hold — keep or retire (see §10).

## 8. Roadmap to v1 — each milestone has a Definition of Done (DoD)
**Recommended order: B → A → C → D → E → F.** Data safety (B) is the single highest priority — do it
first even though A appears earlier, because losing a watchmaker's history is the worst failure. A
(camera capture) is small; slot it in right after B. Then C–F in sequence. Build each to its DoD before
moving on.

- **A — Trustworthy capture. ✅ DONE 2026-07-12.** In-app **camera capture** added: a "Take photo"
  button backed by `<input capture="environment">` opens the phone's rear camera directly (gallery
  upload kept). **DoD met:** a photo fed through the camera input flows preview → OCR → Review with
  correct values (verified live with a real Weishi photo; extraction exact). _Residual: spot-check
  once on a physical phone that the OS camera opens._
- **B — Don't lose data (CRITICAL). ✅ DONE 2026-07-12.** Persistence moved to **IndexedDB**; **Export**
  (JSON backup download) and **Import** (merge-restore) added. **DoD met:** exported a backup, wiped
  IndexedDB + localStorage, imported → watch, table, and every reading value restored; verified live
  end-to-end (plus: legacy-localStorage migration, idempotent re-import, bad-file rejection).
- **C — Share the result. ✅ DONE 2026-07-12.** `src/lib/report.ts` (jsPDF + autotable, fully offline)
  builds a readings-table PDF and a progress-comparison PDF (all three metrics); shared via
  `navigator.share({files})` where supported, else downloaded. Buttons: "Share PDF" per dated table in
  the watch timeline, "Share comparison PDF" in the compare view. **DoD met:** both PDFs generated from
  a watch via the real buttons and verified valid (correct header, watch name/ref, all rows).
- **D — Installable & offline. ✅ DONE 2026-07-13.** Static export (`output: 'export'`); web manifest +
  generated icons; service worker with a **build-time precache manifest** (postbuild
  `scripts/build-sw-precache.mjs` injects the full export file list — 56 files incl. every lazy JS
  chunk, OCR models, wasm, self-hosted font — into `out/sw.js` with a content-hashed cache name).
  Google Fonts replaced with self-hosted `next/font` Inter. **DoD met:** with the server killed, the
  app reloads from cache and the full capture → OCR → review → save flow works — verified live, OCR
  extracted exact values offline. _Residual: "Add to Home Screen" needs an HTTPS host + a phone —
  spot-check after deploying (Milestone E's install link)._
- **E — Ready for others. ✅ Mostly done 2026-07-13.** First-run onboarding dialog
  (`src/components/onboarding-dialog.tsx`: 6-position order, crop tip, review/save, backup reminder;
  shows once, reopenable via "Quick-start guide" on the FAQ tab — all verified live). Empty states
  were already friendly. **Remaining: the shareable install link** — blocked on the §10 hosting
  decision (GitHub Pages / Vercel / Netlify). The app is a plain static export in `out/`, so any
  static host works; deploy, then spot-check "Add to Home Screen" on a phone (also closes D's
  residual).
- **F — Cleanup & confidence. ✅ DONE 2026-07-13.** Deleted the dead Tesseract path (`src/lib/ocr.ts`),
  the whole Genkit/Gemini layer (`src/ai/`, `src/app/actions.ts`), and unused deps (genkit×3,
  genkit-cli, tesseract.js, dotenv, patch-package). Trimmed OCR download ~13 MB (plain wasm variant
  dropped; runtime uses only the jsep build — re-verified OCR after). Added Vitest with 10 smoke
  tests over `parse-reading` and `watch-store` (`npm test`, all green). Rewrote `CLAUDE.md` to match
  reality. **DoD met:** clean build (54-file precache), no dead OCR/AI code, docs accurate.

_Post-v1:_ Capacitor store wrap; live camera with a framing guide; multi-language OCR.

## 9. Success Criteria (v1 "done")
A watchmaker can **install it from a link**, use it **fully offline**, **photograph** a Weishi display and
get correct readings after a quick review, keep a **dated history per watch**, see **before/after
progress**, **share a PDF**, and **back up / restore** their data — no accounts, no cost.

## 10. Open Decisions
- Retire or keep the parked Expo project (`../timegrapher-mobile`)?
- ~~Where to host the install link (GitHub Pages / Vercel / Netlify static)?~~ **Decided 2026-08: GitHub Pages** — live at https://elbaash.github.io/Timegrapher-Charter/
- Name / icon / light branding for the shared version.

## 11. Recovery Plan — Deploy & Offline Reliability (2026-08)

> **Living checklist — keep statuses current; this is the working reference for the recovery.**
> Why it exists: on 2026-08-24 GitHub Pages stopped publishing the `gh-pages` branch, the site
> 404'd, and the (unpatched) service worker cached the GitHub 404 page as the app shell — so
> installed phones showed a 404 page when taken offline. Sections below fix each layer so it
> cannot silently recur.

### ⏸️ RESUME POINT — session ended 2026-08-28

**State: everything is saved, committed (`d1328c6` on `main`), pushed to GitHub, and LIVE.**
Working tree clean; nothing pending anywhere. Live site (verified):
https://elbaash.github.io/Timegrapher-Charter/ — hardened service worker, cache `chronographer-7b5b608d6b`.

**The ONE open item is §11.4's last checkbox — the 2-minute phone re-test:**
1. On the phone (internet ON), open ChronoGrapher once — it silently downloads the update and re-caches (~30 s).
2. Airplane mode ON → open the app again → must load normally.
3. Bonus: photograph a timegrapher display → OCR → save, all offline.
→ Pass? Tick the box and the recovery is fully closed.

**Next session after that — §11.5 polish, in order:**
1. Remove duplicate Customer Name / Ref inputs from `uploader.tsx` (legacy; watch name/ref already on the New tab).
2. Add a Review-step hint when a rate has no +/− sign.
3. Component/E2E tests; stronger iOS storage-eviction nudges.

**Everyday commands:** `npm run dev` (local dev) · `npm run deploy` (publish to the live site) ·
`npm run serve:static` (test PWA/offline locally) · `npm test` · `npm run typecheck`.

### 11.1 Get the site back online — ✅ DONE 2026-08-28
- [x] Repo Settings → Pages → “Deploy from a branch” → `gh-pages` / root (owner action)
- [x] Verified `https://elbaash.github.io/Timegrapher-Charter/` and `/sw.js` serve HTTP 200

### 11.2 Harden the service worker (never breaks offline again) — ✅ DONE 2026-08-28
- [x] Removed the stray `what` syntax error at the top of `public/sw.js`
- [x] Navigation handler rejects non-OK responses — error pages are never cached as the shell
- [x] Precache is per-file and fault-tolerant (one bad URL can’t abort the ~40 MB install; console warns)
- [x] Source maps excluded from the precache manifest (weight)
- [x] Rebuilt, redeployed via `npm run deploy`, live `sw.js` verified

### 11.3 Reliable deployment — ✅ DONE 2026-08-28
- [x] `npm run deploy` (`scripts/deploy-gh-pages.mjs`): build → replace `gh-pages` content with `out/` → force-push
- [x] Build artifacts removed from `main` tracking; `.deploy-gh-pages/` git-ignored
- [x] `main` pushed so GitHub matches the working tree

### 11.4 Phone acceptance (Android) — 🟡 INITIAL PASS 2026-08-28, re-verify after deploy
- [x] App installed to home screen from Chrome
- [x] Airplane-mode test passed: app loads and works offline
- [ ] After the patched deploy: open the app once online (self-updates the service worker), then re-run the airplane-mode test

### 11.5 App polish (post-recovery, in this order)
- [ ] Remove the duplicate Customer Name / Ref inputs from `uploader.tsx` (legacy from the customer-session era; watch name/ref already live on the New tab)
- [ ] Review-step hint when a rate has no +/− sign
- [ ] Component/E2E tests; stronger iOS storage-eviction nudges

## 12. Living Status / Changelog
Append dated entries; tick Milestones A–F as they land.

- **2026-07-05** — Rebuilt as an offline PWA direction: removed inert Firebase, chose in-browser OCR,
  added the named-watch data model + timeline + comparison. (commit `8cef6c9`)
- **2026-07-06** — Crop-to-display step for real-world photo reliability.
- **2026-07-07** — Switched OCR engine to PaddleOCR (97% vs 53%); position auto-labelling; lift-angle
  capture; "Batch photos" rename; machine-matched titles. (commit `16b0197`)
- **2026-07-07** — Authored this Master Plan as the single source of truth.
- **2026-07-12** — **Milestone B done.** IndexedDB is now the primary store (`src/lib/db.ts` +
  reworked `src/lib/watch-store.ts`), localStorage kept as a best-effort mirror, one-time migration
  from old localStorage keys, `navigator.storage.persist()` requested. Export backup (versioned JSON
  download) and Import backup (merge by name+ref, tables unioned by id — idempotent, never deletes)
  on the Watches tab. Verified live: save → export → wipe all storage → import → full restore;
  re-import adds nothing; junk file rejected with a clear error; legacy migration confirmed.
  Production build green.
- **2026-07-12** — **Milestone A done.** "Take photo" button (`capture="environment"` input) in the
  uploader opens the phone camera in-app; photo flows into the existing preview → crop → OCR → Review
  pipeline. Fixed a live-FileList bug in `handleFilesChange` (snapshot before async reads; also fixes
  the old oversized-file miscount). Verified live with a real Weishi photo — OCR values exact
  (+34 / 206 / 2.4 / 52.0). Build green.
- **2026-07-12** — **Milestone C done.** Added `jspdf` + `jspdf-autotable`; `src/lib/report.ts` builds
  offline PDF reports (single dated table; full progress comparison across all attempts). Share sheet
  on phones, download fallback on desktop. Buttons in the watch detail timeline and compare views.
  Verified live: both PDFs generated through the UI, parsed as valid 1-page/multi-grid PDFs with the
  right content. Build green.
- **2026-07-12** — **Milestone D implemented.** Static export enabled (`output: 'export'`,
  `images.unoptimized`); `public/manifest.webmanifest` + generated app icons (`public/icons/`);
  `public/sw.js`; production-only registration via `src/components/sw-register.tsx`; Google Fonts
  replaced with self-hosted `next/font` Inter (offline-safe). Added `npm run serve:static` + a
  "static" launch config to serve the export locally.
- **2026-07-13** — **Milestone D done (verified offline).** First offline test caught a real gap:
  the OCR engine loads as lazy webpack chunks that weren't precached, so OCR failed offline. Fixed
  with a build-time precache manifest (`scripts/build-sw-precache.mjs`, postbuild): the whole
  export (56 files) is precached under a content-hashed cache name; old caches auto-deleted.
  Verified with the server killed: page reload works, and capture → OCR → review → save completes
  offline with exact values. Test data cleaned up.
- **2026-07-13** — **Milestone E mostly done.** First-run onboarding dialog (photo order, crop tip,
  review/save, backup reminder); shows once, reopenable via "Quick-start guide" on the FAQ tab.
  Verified live (first-run → dismiss → no re-show → reopen). Remaining: install link (hosting
  decision, §10).
- **2026-07-13** — **Milestone F done.** Dead Tesseract/Genkit code and 7 unused deps removed;
  OCR download trimmed ~13 MB (jsep-only wasm, re-verified); Vitest added with 10 passing smoke
  tests (`npm test`); `CLAUDE.md` rewritten to match the current app. Build green, 54-file
  precache.
- **2026-08-24** — GitHub Pages sub-path deploy (`basePath` `/Timegrapher-Charter`, `gh-pages`
  branch). The Pages source setting later lapsed → site 404'd → the deployed service worker cached
  the GitHub 404 page as the app shell (no `res.ok` guard) → installed phones saw a 404 offline.
- **2026-08-28** — **Recovery complete (see §11 RESUME POINT).** Pages re-pointed at `gh-pages`
  (site live); `sw.js` hardened (non-OK navigations never cached; per-file fault-tolerant
  precache; stray syntax removed); source maps excluded from precache; added `npm run deploy`;
  build artifacts removed from `main` + git-ignored; rebuilt + redeployed + live-verified
  (commit `d1328c6`, cache `chronographer-7b5b608d6b`); Android install + airplane-mode
  acceptance test passed. Remaining: §11.4 re-verify on phone, then §11.5 polish.
- **2026-09-03** — Repo professionalised: end-user download/use guide (`docs/how-to-download-and-use.md`),
  MIT LICENSE (repo is public), README hero with live-app link/badges/TOC/screenshots, repo
  description + website + topics set (commit `5e9b247`).
- **2026-09-03** — **Regulation calculator added (5th top tab, "Regulate").** Enter per-position
  rates (manual rows or one-tap import from the workspace) → prominent current average → editable
  target (default +5 s/d) → live-recalculated regulator adjustment ("Speed up by X s/d") with
  projected new rate per position and the new average (= target). Pure math in `src/lib/regulation.ts`
  with 16 Vitest cases (`src/lib/regulation.test.ts`), incl. the spec example [+24, −46] @ +5 →
  avg −11, adj +16, projected +40/−30. Also shows spread (unchanged by a uniform move) with a
  poising note. Tests 26/26, typecheck + build green.
- **2026-09-03** — Regulation calculator reachable from saved history: each dated table in a watch's
  Timeline got a **Regulate** button → loads that table's rates (position-labelled) into the Regulate
  tab via a `prefill` prop (fresh object per click, so repeat clicks reload). Tables without readable
  rates toast a warning instead.
