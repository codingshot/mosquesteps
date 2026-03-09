/**
 * Battery-aware resource manager.
 * Adapts GPS polling rate, animation complexity, and background work
 * based on device battery level and charging status.
 */

export interface BatteryState {
  level: number; // 0–1
  charging: boolean;
  mode: "full" | "balanced" | "saver";
}

interface BatteryManager {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

const DEFAULT_STATE: BatteryState = { level: 1, charging: true, mode: "full" };

let cachedState: BatteryState = { ...DEFAULT_STATE };
let listeners: Array<(s: BatteryState) => void> = [];
let batteryRef: BatteryManager | null = null;
let initialized = false;

function deriveMode(level: number, charging: boolean): BatteryState["mode"] {
  if (charging) return "full";
  if (level > 0.3) return "balanced";
  return "saver";
}

function update() {
  if (!batteryRef) return;
  const mode = deriveMode(batteryRef.level, batteryRef.charging);
  cachedState = { level: batteryRef.level, charging: batteryRef.charging, mode };
  listeners.forEach((fn) => fn(cachedState));
}

/** Initialize battery monitoring. Call once at app startup. */
export async function initBatteryMonitor(): Promise<BatteryState> {
  if (initialized) return cachedState;
  initialized = true;

  if ("getBattery" in navigator) {
    try {
      batteryRef = await (navigator as any).getBattery();
      if (batteryRef) {
        update();
        batteryRef.addEventListener("levelchange", update);
        batteryRef.addEventListener("chargingchange", update);
      }
    } catch {
      // Battery API not available — stay with defaults
    }
  }
  return cachedState;
}

/** Get current battery state (non-blocking). */
export function getBatteryState(): BatteryState {
  return cachedState;
}

/** Subscribe to battery state changes. Returns unsubscribe function. */
export function onBatteryChange(fn: (s: BatteryState) => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

// ── Adaptive configuration based on battery mode ──

/** GPS polling interval in ms. Slower polling = less battery drain. */
export function getGPSInterval(): number {
  switch (cachedState.mode) {
    case "full": return 2000;
    case "balanced": return 4000;
    case "saver": return 8000;
  }
}

/** Whether to enable smooth animations (framer-motion). */
export function shouldAnimate(): boolean {
  if (cachedState.mode === "saver") return false;
  // Also respect prefers-reduced-motion
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

/** Maximum position history length for GPS filter. */
export function getPositionHistorySize(): number {
  switch (cachedState.mode) {
    case "full": return 10;
    case "balanced": return 6;
    case "saver": return 3;
  }
}

/** Whether background notification polling should run. */
export function shouldPollNotifications(): boolean {
  return cachedState.mode !== "saver";
}

/** Notification poll interval (slower in balanced mode). */
export function getNotificationPollInterval(): number {
  switch (cachedState.mode) {
    case "full": return 60_000;
    case "balanced": return 120_000;
    case "saver": return 300_000;
  }
}

/** Map tile quality — reduce on low battery. */
export function getMapTileQuality(): "high" | "standard" {
  return cachedState.mode === "full" ? "high" : "standard";
}

/** Cleanup battery listeners. */
export function destroyBatteryMonitor(): void {
  if (batteryRef) {
    batteryRef.removeEventListener("levelchange", update);
    batteryRef.removeEventListener("chargingchange", update);
    batteryRef = null;
  }
  listeners = [];
  initialized = false;
  cachedState = { ...DEFAULT_STATE };
}
