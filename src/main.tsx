import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPWA } from "./lib/pwa-register";
import { initBatteryMonitor } from "./lib/battery-manager";
import { ensureSkipLink } from "./lib/accessibility";

// Initialize performance optimizations
registerPWA();
initBatteryMonitor();
ensureSkipLink();

createRoot(document.getElementById("root")!).render(<App />);
