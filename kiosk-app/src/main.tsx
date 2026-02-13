import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import KioskApp from "./KioskApp";
import "./index.css";

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update when new content is available
    updateSW(true);
  },
  onOfflineReady() {
    console.log("Kiosk app ready for offline use");
  },
  onRegisteredSW(swUrl, registration) {
    // Check for updates every hour
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <KioskApp />
  </React.StrictMode>
);
