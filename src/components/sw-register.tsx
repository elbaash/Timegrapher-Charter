"use client";

import { useEffect } from "react";

// Registers the service worker that makes the app work offline. Production only — in dev the SW
// would cache webpack chunks and fight hot reload.
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((e) => {
      console.error("Service worker registration failed", e);
    });
  }, []);
  return null;
}
