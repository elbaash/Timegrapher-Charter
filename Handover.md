# Handover: ChronoGrapher Project Documentation

## Project Overview
ChronoGrapher is a specialized utility for watchmakers. It uses GenAI (Gemini 2.5 Flash via Genkit) to perform OCR on images of mechanical watch timegraphers, extracting performance data (Rate, Amplitude, Beat Error) and organizing it into professional reports.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **AI**: Genkit v1.x with Google AI (Gemini 2.5 Flash)
- **Backend**: Firebase (Auth & Firestore)
- **UI**: Tailwind CSS, ShadCN UI, Lucide Icons
- **Persistence**: Hybrid (localStorage for active session, Firestore for history)

---

## Core Architecture & Data Flow

### 1. Data Models (`src/types/index.ts`)
The project relies on a strict set of types.
- **`POSITIONS`**: An enum-like array defining the 6 standard watchmaking positions.
- **`TimegrapherReading`**: The atomic unit of data.
- **`CustomerSession`**: The parent object containing multiple readings.

### 2. The AI Pipeline (`src/ai/flows`)
- **Extraction**: `extract-timegrapher-data.ts` uses a vision-enabled prompt. It is instructed to look for handwritten notes in the image (e.g., "DU" for Dial Up) to determine the position.
- **Sorting**: In `page.tsx`, the `handleDataExtracted` function uses a hardcoded `sortOrder` to ensure the "Review" screen matches the standard watchmaking sequence (Dial Down -> Crown Up -> ... -> Dial Up).

### 3. State Management & Persistence
- **Active Workspace**: The app uses `useEffect` hooks in `page.tsx` to sync the state of `activeReadings`, `activeCustomerName`, and `activeRefNumber` to `localStorage` under the key `chronoCurrentSession`.
- **History Storage**: Currently, the `sessions` state is also synced to `localStorage`.

---

## Technical Audit: Current State vs. Target State

### Current Implementation (MVP)
- **OCR**: Fully functional. Handles batch uploads (up to 6 images).
- **Review Flow**: Allows users to correct AI errors before committing to the session.
- **Auth**: Firebase project is connected, but UI-driven login is not yet implemented.
- **Persistence**: Relies on `localStorage`.

### Missing Pieces (Next Steps for Developer)
1. **Firestore Migration**: 
   - Update `handleSaveSession` in `page.tsx` to use `setDoc` (Firestore) instead of just updating the local `sessions` array.
   - Use the path: `users/{userId}/sessions/{sessionId}`.
2. **Authentication Flow**: 
   - The app is configured for Anonymous Auth. 
   - **Action**: Add a `signInAnonymously(auth)` trigger in a `useEffect` on the main page to ensure every user gets a `uid`.
3. **Data Retrieval**:
   - Replace the `localStorage` retrieval of `sessions` with the `useCollection` hook from `@/firebase`.

---

## File Map for Development
- `src/app/page.tsx`: The "God Component" managing state and tab navigation.
- `src/app/actions.ts`: The Server Action bridging the uploader to the AI flows.
- `src/components/uploader.tsx`: Handles file reading and the batch analysis loop.
- `docs/backend.json`: The blueprint for Firestore and Auth configuration.
- `firestore.rules`: Security policy requiring `request.auth.uid == userId`.

## Developer Notes
- **Print Styles**: `globals.css` contains `@media print` rules. The `ReadingsTable` component has a hidden `print-only` div to ensure reports look professional when printed.
- **Hydration**: Persistence uses `useEffect` to avoid hydration mismatches between server-rendered HTML and client-side `localStorage` data.
