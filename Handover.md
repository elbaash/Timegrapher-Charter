# Project Handover: ChronoGrapher Professional

**Document version:** 2.1.0
**Last updated:** 2026-07-05

> **v2.1.0 change (2026-07-05):** The inert Firebase layer was **removed entirely** (see §6),
> along with unused `recharts`/`chart.tsx`. Build-error suppression was **turned off** and the
> remaining type error fixed — `npm run build` now passes with checks enforced. Direction also
> set: the offline phone-app goal lives in the **timegrapher-mobile** project, not this web app,
> which stays as the UX reference. Full plan: `.claude/plans/i-had-to-take-tranquil-pebble.md`.

---

## 1. Executive Summary

ChronoGrapher Professional is a single-page web utility for professional watchmakers. It solves a manual data-entry bottleneck: instead of transcribing readings off a **Weishi Timegrapher No. 1000** display by hand, the watchmaker photographs the display and Google's **Gemini 2.5 Flash** vision model extracts four measurements — Rate (s/d), Amplitude (°), Beat Error (ms), and Position — as structured data. Readings are grouped into per-customer sessions, verified by a human in a review step (to catch OCR/AI mistakes), then archived locally or printed as a "Regulation Certificate."

It is a working, iteratively-refined MVP — not the "production ready" state a prior version of this document claimed. Persistence is 100% browser `localStorage`; no cloud backend is actually active despite Firebase being fully scaffolded (see §5).

A second project, **timegrapher-mobile**, is an early-stage offline Android port of this app (Expo + on-device ML Kit OCR + SQLite). This web app is the **UI/UX reference** for that port — nothing here should be changed to accommodate the mobile work. See §8.

---

## 2. History & Origin

This project was built inside **Firebase Studio** (Google's AI-assisted cloud IDE), then later exported for local/offline development. The git history tells the story directly, because almost every commit message is a verbatim (typo-and-all) prompt someone typed to an AI coding agent:

| Date | What happened |
|---|---|
| **2025-10-08** | Firebase Studio scaffold commit (`Initialized workspace with Firebase Studio`, authored by `Firebase Studio <noreply@firebase.studio>`). This is the standard ShadCN/Next.js/Genkit starter — no app logic yet, ~17,500 lines of boilerplate. |
| **2025-10-29 → 10-30** | "Initial prototype" then a single-day binge of ~23 commits building the real app: camera capture, manual entry, customer/ref fields, lift angle, print/share buttons, table layout. |
| **2025-11-02 → 11-06** | Refinement pass: position turned into a dropdown, the canonical 6-position upload order was defined, session/localStorage persistence was added, a Firebase project was wired up (`src/firebase/*`, `firestore.rules`, `docs/backend.json`), followed by dev-server troubleshooting. |
| **2026-05-07** | A ~6-month gap, then a documentation-only session that wrote and iterated the previous `Handover.md`, plus a cleanup commit that removed hardcoded demo/seed data (`initialReadings` for a fake "Jane Smith" customer) that had been silently loading whenever `localStorage` was empty. |
| **2026-07-05** | This document. Also: dependency audit (see §9). |

**Supporting evidence this was AI-prototyped, not hand-built:**
- `docs/blueprint.md` — Firebase Studio's original "App Prototyper" design brief (feature list, color palette: primary `#3F51B5`, background `#F0F0F0`, accent `#009688`; Inter font) — this predates any visible commit and is the prompt Firebase Studio's AI used to scaffold the app.
- `docs/backend.json` — the companion data-model blueprint (Firestore entity shapes, intended `anonymous` auth) that `firestore.rules` was written to satisfy.
- `.idx/` — Firebase Studio / Project IDX workspace files (Nix environment, MCP config).
- `.agents/` (untracked) — a **Google Antigravity** migration skill (`fbs-to-agy-export`) whose job is to finish exporting a Firebase-Studio project for local/Antigravity use. Its presence confirms the project passed through that export flow at some point before landing in front of Claude Code.
- A recurring commit message — "The app isn't starting. Please investigate..." — appears **four separate times** across the history, suggesting dev-server breakage was a repeat problem that got re-diagnosed from scratch each session rather than root-caused once.

**Practical implication for whoever picks this up next:** there is no separate design doc or spec beyond `docs/blueprint.md`/`docs/backend.json` and this handover. The commit log itself is effectively the project's requirements history if you ever need to know *why* a particular UI decision was made.

---

## 3. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 15.5.20, App Router, Turbopack | Bumped from 15.3.8 on 2026-07-05 (§9) |
| Language | TypeScript 5, strict mode | Build-error checks **enforced** as of 2026-07-05 (`ignoreBuildErrors`/`ignoreDuringBuilds` back to `false`) — `npm run build` passes clean |
| AI | Genkit v1.20 + `@genkit-ai/google-genai` → `googleai/gemini-2.5-flash` | Single global instance, no retry/safety config |
| UI | React 18.3 (not 19, despite Next 15), Tailwind CSS 3.4, ShadCN/Radix UI, Lucide React | |
| Backend | None | Firebase scaffolding **removed 2026-07-05** — see §6 |
| Forms | react-hook-form + Zod | |
| Dates | date-fns | |
| Persistence | `localStorage` only | By design for this web app; the mobile port uses SQLite |
| Deployment target | Firebase App Hosting (`apphosting.yaml` present) | No evidence a deploy has ever happened — no `firebase.json`, no CI config |

---

## 4. Architecture & Full Data Flow

### 4.1 Everything lives in `page.tsx`

`src/app/page.tsx` is the entire app: all state, all handlers, all tab navigation. Components under `src/components/` are presentation + local-form-state only — they receive callbacks as props and own no global state.

### 4.2 The four tabs

Top-level `Tabs` (`activeTab`, default `"new"`):
- **New** — the main workspace: a "Customer Info" card, a nested sub-tab switcher (**AI Upload** vs **Manual Entry**), and a live readings table.
- **Review** — disabled until there's staged AI output; lets the user correct OCR mistakes before committing them.
- **Sessions** — the archive: list, reopen, or delete past customer sessions.
- **FAQ** — static help content.

### 4.3 State (all `useState` in `page.tsx`)

| State | Purpose |
|---|---|
| `sessions` | Archived `CustomerSession[]`, persisted to `localStorage["chronoSessions"]` |
| `activeReadings` | The in-progress session's `TimegrapherReading[]` |
| `activeCustomerName` / `activeRefNumber` | Current session's customer/reference |
| `activeSessionId` | `null` = unsaved; once set, subsequent "Archive" saves update in place instead of creating a duplicate |
| `isProcessing` | Disables inputs while AI calls are in flight |
| `extractedData` | Staging area for AI OCR results awaiting human review |
| `isHydrated` | Gates rendering until `localStorage` has loaded, avoiding an SSR/client mismatch |

Two `useEffect`s mirror `sessions` and the active-session bundle into `localStorage` (`chronoSessions`, `chronoCurrentSession`), gated on `isHydrated` so the initial empty state doesn't clobber saved data on load.

**There are zero Firestore calls anywhere in `page.tsx`.** Persistence is entirely client-side.

### 4.4 End-to-end user journey (photo → archived session)

1. User optionally fills Customer Name / Reference Number at the page level.
2. Switches to the **AI Upload** sub-tab, drags/selects up to 6 images (4 MB cap each) into `<Uploader>`.
3. Clicks **Analyze N Images** — `Uploader` calls the server action `analyzeImage()` once per file in parallel (`Promise.all`), setting `isProcessing`.
4. Successful results become `AnalyzedImage { imageUrl, data }`, with the Uploader's *own* local customer/ref fields stamped on (see the duplication note in §4.6).
5. `page.tsx.handleDataExtracted` sorts the batch into the canonical position order — **Dial Down → Crown Up → Crown Down → Crown Left → Crown Right → Dial Up** — stages it in `extractedData`, and jumps to the **Review** tab.
6. On Review, each image is shown beside an editable form (rate/amplitude/beat-error/position). `handleExtractedDataChange` mutates the staged data live.
7. **Confirm All Readings** (`handleReviewSave`) converts each staged item into a real `TimegrapherReading` (stamped with `id` and `timestamp`), backfills customer/ref if not already set, appends to `activeReadings`, and returns to New. **Discard** (`handleReviewCancel`) just clears the staging area.
8. Alternatively, the **Manual Entry** sub-tab (`<ManualEntryForm>`) adds one reading directly to `activeReadings` with no review step — used for correcting a bad photo or entering by hand.
9. `<ReadingsTable>` renders `activeReadings` live with **Share**, **Print**, and **Archive Session** actions.
10. **Archive Session** (`handleSaveSession`) creates a new `CustomerSession` (or updates the existing one if `activeSessionId` is already set) and prepends/updates it in `sessions`.
11. On the **Sessions** tab: **Open** (`handleSelectSession`) reloads a session into the active workspace; **Delete** (`handleDeleteSession`) removes it, clearing the workspace too if it was the active one; **New Session** (`handleNewSession`) resets everything to blank.

### 4.5 Complete handler inventory (`page.tsx`)

| Function | What it does |
|---|---|
| `handleDataExtracted` | Sort AI batch results, stage them, jump to Review |
| `handleReviewSave` | Commit staged data into real readings |
| `handleReviewCancel` | Discard staged data |
| `handleExtractedDataChange` | Live-edit a field during Review |
| `handleManualDataAdded` | Append a manual reading directly |
| `handleSaveSession` | Create-or-update the archived session |
| `handleNewSession` | Reset the workspace |
| `handleSelectSession` | Load an archived session for editing |
| `handleDeleteSession` | Remove a session from the archive |

### 4.6 Component roles

- **`uploader.tsx`** — drag-and-drop/click file intake (max 6 files, 4 MB each, png/jpeg/webp), converts files to base64 data URIs, triggers the AI calls. **Note:** it has its own local `customerName`/`refNumber` fields, separate from the page-level "Customer Info" card — these two pairs are not synced except indirectly (the page only backfills its own fields if they're currently empty). Worth reconciling if this causes confusion in the field.
- **`manual-entry-form.tsx`** — Zod + react-hook-form validated entry. Defaults `position` to "Dial Up" and `liftAngle` to `"52"` (a common real-world default). After submit, resets rate/amplitude/beat-error/position but preserves customer/ref/lift-angle — optimized for quickly entering all six positions in a row.
- **`readings-table.tsx`** — renders the live table twice: once for screen, once (`hidden print:block`) as a formatted "Regulation Certificate" that only appears via `window.print()`. Also implements Share (Web Share API with clipboard fallback) and the Archive trigger.

---

## 5. The AI Pipeline

### 5.1 Setup (`src/ai/genkit.ts`)

```ts
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
```

One global instance, hardcoded model, no retry/safety configuration.

### 5.2 The active flow — `src/ai/flows/extract-timegrapher-data.ts`

- **Input:** `{ photoDataUri: string }` — a base64 data URI.
- **Output schema:** `{ rate: string, amplitude: string, beatError: string, position: enum(POSITIONS) }`. **`liftAngle` is not extracted by AI at all** — it's manual-entry-only, and the Review screen has no lift-angle field.
- **Prompt (verbatim):**
  > "You are an expert watchmaker's assistant. Extract the rate, amplitude, beat error, and movement position from the timegrapher image. The position might be written on a piece of paper next to the watch or on the watch case itself.
  >
  > Valid positions are: Dial Up, Dial Down, Crown Up, Crown Down, Crown Left, Crown Right, Unknown.
  >
  > If any value is not clearly visible, leave it as an empty string. If the position is not visible, return "Unknown".
  >
  > Return the data in JSON format.
  >
  > Timegrapher Image: {{media url=photoDataUri}}"

### 5.3 Dead code — `src/ai/flows/improve-ocr-accuracy.ts`

Defined, exported, but **never called from anywhere** in the app (confirmed via grep across `actions.ts`, `uploader.tsx`, `page.tsx`). It takes an image plus optional previous OCR text and asks the model to correct errors, returning free text. This looks like an intended retry/fallback feature that was scaffolded and abandoned — a real candidate for either finishing or deleting.

### 5.4 The bridge — `src/app/actions.ts` (21 lines, one function)

```ts
"use server";
export async function analyzeImage(photoDataUri: string) {
  // calls extractTimegrapherData(), returns { data, error }
}
```

Edge case worth knowing: if rate/amplitude/beatError all come back empty, it still returns non-null `data` but attaches an `error` string. The caller (`Uploader`) treats any non-null `error` as a hard failure and discards the result anyway — so in practice this partial-success branch only changes the toast wording, not behavior.

### 5.5 Full flow, image to reading

`Uploader` reads file → base64 data URI → `analyzeImage()` server action → `extractTimegrapherData()` → Genkit prompt against Gemini 2.5 Flash → Zod-validated JSON back → stamped with customer/ref → staged as `AnalyzedImage` → shown on Review for human correction → confirmed into a `TimegrapherReading`.

---

## 6. Firebase: Removed (2026-07-05)

Earlier versions of this document described a fully-scaffolded-but-inert Firebase layer. That
layer has now been **deleted entirely**, because it was never wired to any UI (nothing called
`useUser`/`useCollection`/`useDoc`/`useFirestore`/`useAuth`), it added bundle weight, and its
provider could blank the whole app if Firebase init failed. Persistence is `localStorage` only,
by design, for this web app.

**What was removed on 2026-07-05:**
- `src/firebase/` (the entire directory: `config.ts`, `provider.tsx`, `client-provider.tsx`,
  `auth/use-user.tsx`, `firestore/use-collection.tsx`, `firestore/use-doc.tsx`, error emitter).
- `src/components/FirebaseErrorListener.tsx`.
- The `<FirebaseClientProvider>` wrapper in `src/app/layout.tsx` (now renders children + Toaster).
- The `firebase` dependency from `package.json` (this also removed the one committed key — a
  Firebase *web* config key, which is designed to be public and was guarded by rules anyway).
- Orphaned backend artifacts: `firestore.rules`, `.firebaserc`, `apphosting.yaml`,
  `docs/backend.json`.

The pre-existing type errors that used to hide under `ignoreBuildErrors` are resolved: two lived
in the now-deleted Firestore hooks, and the third (in live code, `uploader.tsx`, around the
`AnalyzedImage`/`liftAngle` shape) was fixed — `analyzeImage()` in `actions.ts` now has an
explicit return type, and the AI path stamps the standard `liftAngle: "52"` default. `tsc
--noEmit` and `npm run build` both pass clean with checks enforced.

**If cloud sync is ever wanted later:** it would be a fresh, deliberate build (auth trigger +
data-layer swap + `firebase.json` for deploy), not a matter of "turning on" existing code. For
the current product direction, though, the future is the **offline mobile app** (SQLite, no
cloud) — see §10.

---

## 7. Known Issues & Technical Debt

| Item | Status | Notes |
|---|---|---|
| Firebase (Firestore + Auth) | **Removed 2026-07-05** | Entire inert layer, provider, hooks, rules, and config deleted — see §6 |
| Type errors (Firestore hooks + `uploader.tsx`) | **Fixed 2026-07-05** | Two vanished with the Firebase deletion; the live `uploader.tsx` one fixed via explicit `analyzeImage` return type + `liftAngle` default. `tsc --noEmit` clean |
| `improve-ocr-accuracy.ts` | Dead code | Defined, never called — likely an abandoned retry-fallback feature |
| `placeholder-images.ts` / `ui/chart.tsx` / recharts | **Removed 2026-07-05** | All unused; deleted together with the `recharts` dependency |
| `liftAngle` field | Inconsistent | Always defaults to `"52"`; never extracted by AI; AI path now stamps it (`uploader.tsx`), otherwise print view only |
| Build errors suppressed | **Fixed 2026-07-05** | `ignoreBuildErrors`/`ignoreDuringBuilds` back to `false`; `npm run build` passes with checks enforced. Also fixed the `build` script (was Windows-incompatible `NODE_ENV=production` prefix) |
| No tests | Gap | Zero unit, integration, or E2E tests |
| `.env` variable name mismatch | Documentation bug (fixed in this doc) | The actual `.env` variable is `GEMINI_API_KEY`. A prior version of this document said `GOOGLE_GENAI_API_KEY` — that name does not exist in this codebase |
| No `.env.example` | **Fixed 2026-07-05** | `.env.example` added (with a `.gitignore` exception, since `.env*` was ignoring it) |
| `package.json` name | **Fixed 2026-07-05** | Renamed from the generic scaffold default `"nextn"` to `"chronographer-professional"` |
| Duplicate customer/ref inputs | UX inconsistency | Page-level "Customer Info" card and `Uploader`'s own fields aren't synced (§4.6) |

---

## 8. Local Setup

### Prerequisites
- Node.js 20+
- A Google **Gemini** API key

### Steps
1. `npm install` (as of 2026-07-05 this installs cleanly — see §9 for the dependency health work done that day).
2. Copy `.env.example` to `.env` and fill in your key:
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. `npm run dev` — starts Next.js via Turbopack.
4. `npm run genkit:dev` — opens the Genkit dev UI (port 4000) for testing the AI prompt/flow in isolation, without going through the full UI.
5. Before shipping any change: `npm run typecheck` (note: this will currently report pre-existing type errors — see §6 — but none are imported by anything that blocks `npm run build`).

Firebase is not required for local development to work — the app functions entirely on `localStorage` without any Firebase credentials being valid, since nothing calls Firestore or Auth.

---

## 9. Dependency Health (2026-07-05)

`node_modules` did not exist in this environment prior to this date — dependencies had genuinely never been installed here. After `npm install` (924 packages), `npm audit` reported **100 vulnerabilities (3 critical, 22 high, 73 moderate, 2 low)**.

Remediated without any risky/forced changes:
- `npm audit fix` (no `--force`) — cleared all 3 criticals (`fast-xml-parser`, `handlebars`, `protobufjs`) and most highs/moderates via non-breaking transitive bumps.
- `next` explicitly upgraded `15.3.8 → 15.5.20` (a direct dependency, minor bump) — resolved the Next.js/PostCSS advisories that would otherwise have needed a forced audit fix.
- Verified with a full `next build` after each step — both compiled successfully, same bundle size.

**Result: 69 vulnerabilities remain (0 critical, 6 high, 63 moderate)**, all inside the `genkit` / `genkit-cli` / `firebase-admin` / OpenTelemetry dev-tooling dependency chain, with no available fix short of a major *downgrade* to `genkit-cli@0.0.2` — not worth the risk since none of that chain is exposed to end users (it's dev-only tooling plus the unused Firestore admin SDK path). Re-check for upstream fixes periodically; don't run `npm audit fix --force` blindly.

---

## 10. Sibling Project: timegrapher-mobile

A separate repository at `../timegrapher-mobile/` (sibling folder, kept deliberately separate so this web app remains untouched as the UX reference). **Do not modify this web app to support the mobile port** — port outward from here, not the other way around.

**What it is:** a standalone offline Android port. The intended stack substitution:

| Web (here) | Mobile |
|---|---|
| Gemini 2.5 Flash (cloud OCR) | Google ML Kit Text Recognition v2, on-device (`rn-mlkit-ocr`) |
| Firebase Firestore | SQLite (`expo-sqlite`) |
| Firebase Auth | Removed entirely |
| Next.js server actions | Local TypeScript functions |
| `window.print()` CSS | `expo-print` PDF generation |

**Current status: very early — Phase 0, an OCR validation prototype that has never been run on a device.** Concretely: Expo SDK 54 + RN 0.81, TypeScript strict, an `OcrProvider` interface with an ML Kit implementation, an image preprocessor (resize-to-1280px + JPEG), and a single prototype screen doing gallery-pick → preprocess → OCR → dump raw output. `tsc --noEmit` passes. It has **never** been built (`expo prebuild`/`expo run:android` never executed) and **never** tested against a real Weishi timegrapher photo — which is explicitly the entire point of Phase 0 before anything further gets built.

**Two known constraints already discovered there** (documented in that project's own memory, worth knowing if you're asked to help with it):
- `rn-mlkit-ocr` returns no confidence scores — any UI planned around "flag low-confidence OCR" can't work as originally imagined.
- `expo-image-manipulator` only does resize/rotate/crop/flip — no contrast/grayscale/threshold. If raw OCR accuracy on the Weishi's LCD proves poor, a different preprocessing library will be needed.

**Explicitly planned for reuse from this web app:** `src/types/index.ts` (POSITIONS, TimegrapherReading, CustomerSession), the Zod schema and validation logic from `manual-entry-form.tsx`, the print-certificate layout (to become an HTML template for `expo-print`), and the core business-logic handlers from `page.tsx` (`handleSaveSession`, `handleReviewSave`, the position sort order). **Explicitly excluded from porting:** `src/firebase/`, `src/ai/`, `src/app/` — all replaced by their mobile-native equivalents.

For full detail, see that project's own `CLAUDE.md`.

---

## 11. Immediate Roadmap, If Continuing This Project

**Direction (decided 2026-07-05):** the owner's real goal — a downloadable, fully-offline
**phone app** — lives in the sibling **timegrapher-mobile** project (§10), not this web app.
This web app is now maintained purely as the **UX reference**. So the roadmap below is only
light housekeeping for the reference; the substantive roadmap is the mobile project's (see its
CLAUDE.md and `.claude/plans/i-had-to-take-tranquil-pebble.md`).

Reference-app housekeeping, if touched again (low priority):
1. **Resolve or delete `improve-ocr-accuracy.ts`** — finish integrating it as a retry path or remove the dead code.
2. **Reconcile the duplicate customer/ref inputs** between the page-level card and `Uploader` (§4.6).
3. **Add tests** — there currently are none at any level.

**Already done (2026-07-05):** removed the entire Firebase layer (§6), removed unused
`recharts`/`chart.tsx`, fixed the last real type errors and **re-enabled** build-error checks,
fixed the Windows-incompatible `build` script, `.env.example` added, `placeholder-images.ts`
deleted, `package.json` renamed from the generic `"nextn"` default, dependency vulnerabilities
reduced from 100 to 69 with zero criticals (§9). `npm run build` passes clean.
