# How to Install and Use ChronoGrapher on Your Phone

ChronoGrapher is a **Progressive Web App (PWA)** that works entirely offline. Follow these steps to install it on your phone:

---

## 🔧 Install as a PWA (Recommended)

1. **Open your phone's browser** (Chrome for Android, Safari for iOS).
2. **Visit the live app**: [https://elbaash.github.io/Timegrapher-Charter/](https://elbaash.github.io/Timegrapher-Charter/)
3. **Install the app**:
   - **Android**: Tap the three-dot menu → *Add to Home screen*.
   - **iOS**: Tap the share icon → *Add to Home Screen*.
4. **Launch from your home screen** — it will open as a standalone app with full offline functionality.

> ⚠️ **Note**: The app works **without internet** after installation. You can use it while traveling, in the workshop, or anywhere with no signal.

---

## 📱 Manual Installation (For Developers Only)

If you're building from source:

1. Run `npm install` to install dependencies.
2. Run `npm run build` to generate the static files.
3. Serve the `out/` directory using a local server:
   ```bash
   npm run serve:static
   ```
4. Open the local server URL (e.g., `http://localhost:3000`) in your phone's browser.
5. Install as a PWA using the steps above.

> 💡 **Why this works**: The app uses a service worker to precache all assets at install time. Once installed, it works **without internet**.

---

## ❓ Why Not App Stores?

- The app is **not distributed via Google Play/App Store** because it’s a **static PWA**.
- **No backend, no API keys, no cloud** — it’s a self-contained website.
- **No need for app store approval** — just install directly from the web.

---

## ✅ Verification

After installation, you’ll see:
- A **home screen icon** (with the ChronoGrapher logo).
- The app **launches without a browser URL bar**.
- **All features work offline** (photograph, save, PDF reports, etc.).

> 📸 **Pro Tip**: Take a photo of a Weishi timegrapher display → the app instantly extracts readings → save it to your watch history.

---

> ℹ️ **Documentation**: [Full user guide](https://elbaash.github.io/Timegrapher-Charter/docs/)
> 🔐 **License**: MIT — free to use, modify, and redistribute with attribution.