# Project Handover: ChronoGrapher Professional

## 1. Executive Summary
ChronoGrapher is a production-ready utility designed for watchmakers and horologists. It solves the manual data-entry bottleneck in watch regulation by using **GenAI (Gemini 2.5 Flash)** to perform high-fidelity OCR on mechanical watch timegrapher displays. The system extracts accuracy (Rate), power (Amplitude), and escapement health (Beat Error) directly from photos, organizing them into professional, printable reports.

## 2. Technical Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **AI Integration**: Genkit v1.x (Google AI Plugin)
- **Backend Services**: Firebase (Authentication, Cloud Firestore)
- **Styling & UI**: Tailwind CSS, ShadCN UI (Radix), Lucide Icons
- **Deployment Ready**: Configured for Firebase App Hosting (`apphosting.yaml`)

---

## 3. Architecture & Data Flow

### A. Data Persistence Strategy
The application uses a **Hybrid Persistence Model**:
1. **Volatile State (Active Workspace)**: Managed via `localStorage` (key: `chronoCurrentSession`). This ensures that if a user accidentally refreshes while uploading photos, the data is not lost.
2. **Persistent State (History)**: Currently transitioning from `localStorage` to **Firebase Firestore**. The target schema is defined in `docs/backend.json`.

### B. The AI Pipeline (`src/ai/flows`)
- **Flow**: `extract-timegrapher-data.ts`.
- **Logic**: Vision-to-JSON extraction. The prompt is tuned to recognize handwritten position labels (e.g., "DD" for Dial Down) often placed by watchmakers next to the timegrapher.
- **Safety**: Includes Genkit safety settings to handle potentially noisy image data.

### C. Validation & Review UX
To mitigate AI "hallucinations" or OCR errors (common in low-light workshop photos), the app implements a **Review Phase**. Data extracted from the `uploader.tsx` component is held in a temporary `extractedData` state before being "committed" to the active session.

---

## 4. Database & Security (`firestore.rules`)
Security is implemented at the database level using Firebase Security Rules.
- **Path**: `/users/{userId}/sessions/{sessionId}`
- **Constraint**: `request.auth.uid == userId`
- **Integrity**: Data must match the `CustomerSession` schema defined in `docs/backend.json`.

---

## 5. Setup & Development Environment

### Prerequisites
- Node.js 20+
- Google Gemini API Key (stored in `.env` as `GOOGLE_GENAI_API_KEY`)
- Firebase CLI (for rules deployment)

### Local Development
```bash
npm install
npm run dev # Starts Next.js on port 9002
npm run genkit:dev # Starts Genkit Developer UI
```

### Environment Variables
```env
GOOGLE_GENAI_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_CONFIG=...
```

---

## 6. Project Audit: Current Status (MVP)

| Feature | Status | Note |
| :--- | :--- | :--- |
| **OCR Extraction** | ✅ Stable | Handles batch uploads (up to 6 images). |
| **Manual Entry** | ✅ Stable | Validation via Zod/React Hook Form. |
| **Print/Export** | ✅ Stable | Custom CSS `@media print` rules applied. |
| **Persistence** | ⚠️ Partial | localStorage active; Firestore sync pending. |
| **Auth** | ⚠️ Pending | Anonymous login trigger needs activation. |

---

## 7. Immediate Roadmap (Next 48 Hours)
1. **Firebase Sync**:
   - Locate `handleSaveSession` in `src/app/page.tsx`.
   - Replace `setSessions` (local) with `setDoc(doc(db, ...))`.
2. **Global Error Handling**:
   - Ensure the `FirebaseErrorListener` is correctly catching Firestore permission errors in production environments.
3. **Advanced OCR**:
   - Implement `improve-ocr-accuracy.ts` for edge-case images where the first pass fails.

## 8. Developer Notes
- **Hydration Warning**: Be careful when reading `localStorage` in `useEffect`. The app uses a loading state to prevent mismatch between server and client renders.
- **Print Optimization**: The `ReadingsTable` component contains a `print-only` block that is hidden in the web UI but becomes the primary layout when `window.print()` is triggered.

---
**Document Version**: 1.1.0  
**Author**: App Prototyper (Senior AI Engineer)  
**Date**: Nov 2023