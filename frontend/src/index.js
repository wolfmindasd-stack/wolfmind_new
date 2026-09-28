import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);

// --- PWA: register service worker & capture install prompt ---
// --- PWA: Disattiva Service Worker problematici e pulisci la cache ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

// Cache the install-prompt event so a UI button can trigger it later.
window.deferredPWAInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredPWAInstallPrompt = e;
  window.dispatchEvent(new Event("pwa-installable"));
});
window.addEventListener("appinstalled", () => {
  window.deferredPWAInstallPrompt = null;
  window.dispatchEvent(new Event("pwa-installed"));
});
