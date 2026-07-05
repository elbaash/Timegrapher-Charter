# ChronoGrapher Professional — CLAUDE.md

> **There is a sibling mobile port in progress** at `../timegrapher-mobile/` (Expo + React Native + on-device ML Kit OCR + SQLite). This web app is the **UI/UX reference** for the mobile project — do not modify this app to support the mobile work. See [`../timegrapher-mobile/CLAUDE.md`](../timegrapher-mobile/CLAUDE.md) for mobile project status.

## What This App Does

A single-page utility for professional watchmakers. It uses **Gemini 2.5 Flash** (vision AI) to OCR photos of a **Weishi Timegrapher No. 1000** display and extract four measurements: Rate (s/d), Amplitude (°), Beat Error (ms), and Position. Readings are grouped into customer sessions, verified in a review step, then archived locally or printed as a "Regulation Certificate."

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5.20, App Router, Turbopack |
| Language | TypeScript 5, strict mode — build errors **enforced** (`next.config.ts` checks re-enabled 2026-07-05) |
| AI | Genkit v1.20 + `@genkit-ai/google-genai` → `googleai/gemini-2.5-flash` |
| UI | React 18, Tailwind CSS 3.4, ShadCN/Radix UI, Lucide React |
| Backend | None — Firebase scaffolding **removed 2026-07-05** (was inert; see below) |
| Forms | react-hook-form + Zod |
| Dates | date-fns |
| Persistence | localStorage only |

---

## Folder Structure

```
src/
├── app/
│   ├── page.tsx          # Main SPA — all tabs, all state, all handlers
│   ├── layout.tsx        # Root layout — Toaster only (Firebase provider removed)
│   ├── actions.ts        # Server action: analyzeImage() → calls Genkit flow
│   └── globals.css
├── ai/
│   ├── genkit.ts         # Genkit init, model = googleai/gemini-2.5-flash
│   ├── dev.ts            # Entry for `npm run genkit:dev` (Genkit UI on port 4000)
│   └── flows/
│       ├── extract-timegrapher-data.ts   # Primary AI flow (active)
│       └── improve-ocr-accuracy.ts       # Secondary flow (defined, NOT integrated)
├── components/
│   ├── uploader.tsx           # Drag-and-drop batch upload (max 6 images, 4 MB each)
│   ├── manual-entry-form.tsx  # Zod-validated fallback entry
│   ├── readings-table.tsx     # Data table + print/share/archive actions
│   ├── app-header.tsx
│   ├── faq.tsx
│   └── ui/                    # ShadCN primitives (button, card, input, table, etc.)
├── hooks/
│   ├── use-toast.ts
│   └── use-mobile.tsx
├── lib/
│   └── utils.ts               # cn() for conditional class merging
└── types/index.ts             # POSITIONS const, Position, TimegrapherReading, CustomerSession, etc.

# Removed 2026-07-05: src/firebase/ (inert Firebase layer), src/components/FirebaseErrorListener.tsx,
# src/lib/placeholder-images.ts (unused), src/components/ui/chart.tsx (+ recharts dep, unused).
```

---

## Entry Points

- **`src/app/page.tsx`** — the entire app. Manages all state, tab navigation, localStorage sync, and handlers.
- **`src/app/actions.ts`** — `analyzeImage(photoDataUri)` server action. Returns `{ data, error }`.
- **`src/ai/flows/extract-timegrapher-data.ts`** — Gemini prompt + Zod output schema.
- **`src/app/layout.tsx`** — root layout; renders children + Toaster (no backend provider).

---

## Key Conventions

### State & Persistence
- All app state lives in `page.tsx` and is passed down via props.
- `isHydrated` guard prevents SSR/client mismatch before localStorage loads.
- Two localStorage keys:
  - `"chronoCurrentSession"` — volatile workspace (readings, customerName, refNumber, sessionId)
  - `"chronoSessions"` — persistent archive array of `CustomerSession[]`

### Types
- All shared types are in `src/types/index.ts` — add new ones there.
- `POSITIONS` is a `const` array used for both the Zod enum in the AI flow and the UI `<Select>`.
- All measurement values (rate, amplitude, beatError, liftAngle) are stored as **strings**, not numbers.

### AI Flows
- Flows live in `src/ai/flows/`. Each flow exports an `async function` wrapper around `ai.defineFlow()`.
- Input/output schemas use Zod, exported as TypeScript types via `z.infer<>`.
- The server action in `actions.ts` is the only caller of flows from the UI layer.

### Components
- ShadCN primitives live in `src/components/ui/` — do not hand-edit these unless necessary.
- Feature components (uploader, form, table) receive callbacks from `page.tsx` via props — they own no global state.
- CSS class composition uses `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge).

### Styling
- Dark mode enabled globally via `class` strategy in `tailwind.config.ts`.
- Print styles for the Regulation Certificate are in `globals.css` under `@media print`.
- Responsive breakpoints follow Tailwind defaults; `md:` is the primary breakpoint used.

---

## Dev Scripts

```bash
npm run dev           # Next.js dev server (Turbopack)
npm run genkit:dev    # Genkit UI at http://localhost:4000 (for testing AI flows)
npm run build         # Production build
npm run typecheck     # tsc --noEmit (run this before shipping)
npm run lint          # ESLint
```

---

## Known Issues / Incomplete Work

| Item | Status | Notes |
|------|--------|-------|
| Firebase (Firestore/Auth) | **Removed 2026-07-05** | Entire inert `src/firebase/` layer, provider, rules, and config deleted. App is localStorage-only by design |
| `improve-ocr-accuracy.ts` | Dead code | Flow defined, never called — intended as OCR retry fallback. Resolve or delete |
| `placeholder-images.ts` / `ui/chart.tsx` / recharts | **Removed 2026-07-05** | All unused; deleted along with the `recharts` dependency |
| Build errors suppressed | **Fixed 2026-07-05** | `ignoreBuildErrors`/`ignoreDuringBuilds` back to `false`; `npm run build` passes with checks on |
| `liftAngle` field | Inconsistent | Always defaults to "52", not extracted by OCR; AI path now stamps it in `uploader.tsx`, else print view only |
| No tests | Gap | Zero unit, integration, or E2E tests in the repo |
