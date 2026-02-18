// CRITICAL: Storage polyfill MUST be the first import.
// It installs in-memory fallbacks for localStorage/sessionStorage
// when they are null in APK WebViews, preventing crashes in both
// our code and third-party libraries.
import './lib/storage-polyfill';

import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
