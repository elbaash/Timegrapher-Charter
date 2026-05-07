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
2. **Persistent State (History)**: Currently transitioning from `localStorage` (`chronoSessions`) to **Firebase Firestore**. The target schema is defined in `docs/backend.json`.

### B. The AI Pipeline (`src/ai/flows`)
- **Flow**: `extract-timegrapher-data.ts`.
- **Logic**: Vision-to-JSON extraction. The prompt is tuned to recognize handwritten position labels and standard timegrapher digits.
- **Workflow Sorting**: The app automatically sorts incoming AI data into a standardized sequence: **Dial Down → Crown Up → Crown Down → Crown Left → Crown Right → Dial Up**.

### C. Validation & Review UX
To mitigate AI "hallucinations" or OCR errors (common in low-light workshop photos), the app implements a **Review Phase**. Data extracted from the `uploader.tsx` component is held in a temporary `extractedData` state before being "committed" to the active session.

---

## 4. VS Code & Local Setup Guide

### Prerequisites
- Node.js 20+
- Google Gemini API Key (stored in `.env` as `GOOGLE_GENAI_API_KEY`)
- Firebase CLI (`npm install -g firebase-tools`)

### Getting Started Locally
1. **Clone/Unzip**: Move all files to your local folder.
2. **Install**: Run `npm install`.
3. **Environment**: Create a `.env.local` file with your `GOOGLE_GENAI_API_KEY`.
4. **Firebase Config**: Update `src/firebase/config.ts` with your specific Firebase project credentials if you move away from the Studio-provisioned project.
5. **Start Dev**: `npm run dev` (Starts Next.js on port 3000 by default).
6. **Start Genkit UI**: `npm run genkit:dev` (Crucial for testing AI prompts locally).

---

## 5. Database & Security (`firestore.rules`)
Security is implemented at the database level using Firebase Security Rules.
- **Path**: `/users/{userId}/sessions/{sessionId}`
- **Constraint**: `request.auth.uid == userId`
- **Integrity**: Data must match the `CustomerSession` schema defined in `docs/backend.json`.

---

## 6. Project Audit: Current Status (Production Ready)

| Feature | Status | Note |
| :--- | :--- | :--- |
| **OCR Extraction** | ✅ Stable | Handles batch uploads (up to 6 images) with auto-sorting. |
| **Manual Entry** | ✅ Stable | Validation via Zod/React Hook Form. |
| **Print/Export** | ✅ Stable | Custom CSS `@media print` rules for "Regulation Certificates". |
| **Persistence** | ✅ Stable | `localStorage` sync active for both workspace and history. |
| **Auth** | ⚠️ Placeholder | Firebase Auth structure is present but needs `signInAnonymously()` trigger implementation in the UI. |

---

## 7. Immediate Roadmap for Next Developer
1. **Firestore Sync**: Replace the `setSessions` and `useEffect` logic in `src/app/page.tsx` with Firestore hooks (`useCollection`) to enable multi-device sync.
2. **Auth Trigger**: Add a "Login" or "Sync to Cloud" button that triggers Firebase Anonymous Auth.
3. **Advanced OCR**: Implement the `improve-ocr-accuracy.ts` flow for edge-case images where the first pass fails or returns low confidence.

---
**Document Version**: 1.2.0  
**Status**: Ready for Export  
**Date**: Nov 2023