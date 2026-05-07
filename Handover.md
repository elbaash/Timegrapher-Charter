# Handover: ChronoGrapher Project Documentation

## Project Overview
ChronoGrapher is a web-based utility designed for watchmakers and hobbyists to record watch regulation data. It leverages AI-powered OCR (Optical Character Recognition) to extract timing data from images of timegrapher screens, streamlining the process of documenting a watch's performance across multiple positions.

## Technology Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS & ShadCN UI
- **AI/GenAI:** Google Genkit with Gemini 2.5 Flash
- **Backend/Database:** Firebase (Authentication & Firestore)
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Core Architecture

### 1. The Frontend (`src/app` & `src/components`)
- **`page.tsx`**: The main application hub. It manages the state for current readings, active sessions, and the navigation between "New Session", "Review", "Sessions", and "FAQ" tabs.
- **`layout.tsx`**: Configures the root HTML structure and wraps the application in the `FirebaseClientProvider` to enable database and auth features globally.
- **Components**:
    - `uploader.tsx`: Handles file selection, drag-and-drop, and triggers the AI analysis.
    - `manual-entry-form.tsx`: A Zod-validated form for entering timing data without photos.
    - `readings-table.tsx`: Displays the current session's data, allowing for sharing, printing, and saving.
    - `app-header.tsx` & `faq.tsx`: Standard UI elements and helpful movement documentation.

### 2. The AI Layer (`src/ai`)
- **`genkit.ts`**: Initialized the Genkit client with the Gemini 2.5 Flash model.
- **`flows/extract-timegrapher-data.ts`**: The primary AI agent. It takes a base64 image and returns a structured JSON object containing `rate`, `amplitude`, `beatError`, and the detected `position`.
- **`actions.ts`**: The Next.js Server Action that acts as a bridge between the client-side uploader and the server-side AI flows.

### 3. Data Storage & Persistence
Currently, the application uses a dual-layered approach to storage:

#### Local Persistence (`localStorage`)
- The app uses `useEffect` hooks in `page.tsx` to sync the current state to the browser's `localStorage`. This ensures that if a user refreshes the page or closes their browser, their customer name, ref number, and current readings are preserved.
- Keys: `chronoSessions` (saved history) and `chronoCurrentSession` (active work).

#### Firebase Integration (`src/firebase`)
- **`config.ts`**: Contains the project's Firebase credentials.
- **`provider.tsx` & `client-provider.tsx`**: Context providers that initialize the Firebase SDK on the client side.
- **`backend.json`**: A blueprint of the data entities (`UserProfile`, `CustomerSession`). It defines the expected schema for Firestore documents.
- **`firestore.rules`**: Security rules that restrict data access. Users can only read and write data under `/users/{userId}/...` if they are authenticated as that specific user.

### 4. Data Flow
1. **Input**: User uploads up to 6 images or enters data manually.
2. **Analysis**: Images are sent to `analyzeImage` (Server Action) -> `extractTimegrapherData` (Genkit Flow) -> Gemini LLM.
3. **Review**: Structured data returns to the UI. The user verifies and corrects readings in the "Review" tab.
4. **Ordering**: The app automatically sorts readings into a standard watchmaking sequence: *Dial Down -> Crown Up -> Crown Down -> Crown Left -> Crown Right -> Dial Up*.
5. **Storage**: Upon clicking "Save Session", the data is committed to the local state (and ready for Firestore implementation).

## How to Continue Development

### Completing Firestore Persistence
While the Firebase infrastructure is set up, the `handleSaveSession` function in `page.tsx` currently writes primarily to local state. To enable cloud storage:
- Update `handleSaveSession` to use the `setDoc` function from `firebase/firestore`.
- Reference the path `/users/{userId}/sessions/{sessionId}`.
- Use the `useUser()` hook to get the current authenticated user's ID.

### Authentication
The app is configured for Anonymous Authentication. You should implement a "Login" or "Sign In" button that triggers `signInAnonymously(auth)` to ensure every user has a unique `uid` for their Firestore data path.

### Improving AI Accuracy
If OCR results are inconsistent, modify the `prompt` string in `src/ai/flows/extract-timegrapher-data.ts` to provide more specific visual cues or examples of common timegrapher screen layouts (e.g., Weishi 1000 vs 1900).

## File Map
- `/docs/backend.json`: Database schema definition.
- `/src/types/index.ts`: TypeScript interfaces for the entire project.
- `/src/app/globals.css`: Theme colors and print-specific styles.
- `/firestore.rules`: Database security policy.
