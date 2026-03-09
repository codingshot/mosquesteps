/**
 * Comprehensive tests for smart notifications performance, battery awareness, and accessibility.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  recordWalkingPattern,
  calculateSmartAlert,
  clearAlertCache,
  calculateAllAlerts,
} from "@/lib/smart-notifications";
import {
  initBatteryMonitor,
  getBatteryState,
  getGPSInterval,
  shouldAnimate,
  destroyBatteryMonitor,
} from "@/lib/battery-manager";
import {
  announce,
  announceUrgent,
  prefersReducedMotion,
  focusElement,
  srDistance,
  srDuration,
  srSteps,
  srPrayerCard,
  destroyA11yHelpers,
} from "@/lib/accessibility";

// Mock DOM globals
const mockMatchMedia = vi.fn();
Object.defineProperty(window, "matchMedia", { value: mockMatchMedia });

describe("Smart Notifications", () => {
  beforeEach(() => {
    localStorage.clear();
    clearAlertCache();
  });

  it("records walking patterns and applies learning", () => {
    recordWalkingPattern("Dhuhr", 15);
    recordWalkingPattern("Dhuhr", 18);
    recordWalkingPattern("Dhuhr", 12);
    
    // With learned data, estimate should be blended
    const alert = calculateSmartAlert({
      prayerName: "Dhuhr",
      prayerTime: "13:00",
      estimatedWalkMin: 20,
    });
    
    expect(alert.prayerName).toBe("Dhuhr");
    expect(alert.confidence).toBeGreaterThan(0.8); // High confidence with learned data
    expect(alert.urgency).toMatch(/normal|important|urgent/);
  });

  it("applies weather adjustments", () => {
    const weather = {
      temperatureC: 5,
      windspeedKmh: 15,
      weatherCode: 95,
      description: "Heavy rain",
      emoji: "🌧️",
      speedFactor: 0.7, // 30% slower
      advice: "Walk carefully",
    };
    
    const alert = calculateSmartAlert({
      prayerName: "Maghrib",
      prayerTime: "18:30",
      estimatedWalkMin: 10,
      weather,
    });
    
    expect(alert.weatherAdjusted).toBe(true);
    expect(alert.message).toContain("Maghrib");
  });

  it("caches results for performance", () => {
    const spy = vi.spyOn(Date, "now").mockReturnValue(1000000);
    
    const alert1 = calculateSmartAlert({
      prayerName: "Fajr",
      prayerTime: "05:30",
      estimatedWalkMin: 8,
    });
    
    const alert2 = calculateSmartAlert({
      prayerName: "Fajr",
      prayerTime: "05:30",
      estimatedWalkMin: 8,
    });
    
    expect(alert1).toBe(alert2); // Same reference = cached
    spy.mockRestore();
  });

  it("calculates all alerts in batch", () => {
    const prayers = [
      { name: "Fajr", time: "05:30", estimatedWalkMin: 8 },
      { name: "Dhuhr", time: "13:00", estimatedWalkMin: 12 },
    ];
    
    const alerts = calculateAllAlerts(prayers);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].prayerName).toBe("Fajr");
    expect(alerts[1].prayerName).toBe("Dhuhr");
  });
});

describe("Battery Manager", () => {
  beforeEach(() => {
    destroyBatteryMonitor();
    // Mock battery API
    (global.navigator as any).getBattery = vi.fn().mockResolvedValue({
      level: 0.8,
      charging: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    destroyBatteryMonitor();
  });

  it("initializes and returns battery state", async () => {
    const state = await initBatteryMonitor();
    expect(state.level).toBe(0.8);
    expect(state.charging).toBe(false);
    expect(state.mode).toBe("balanced"); // 0.8 level, not charging
  });

  it("adapts GPS interval based on battery mode", async () => {
    await initBatteryMonitor();
    const interval = getGPSInterval();
    expect(typeof interval).toBe("number");
    expect(interval).toBeGreaterThan(1000);
  });

  it("handles missing battery API gracefully", async () => {
    (global.navigator as any).getBattery = undefined;
    const state = await initBatteryMonitor();
    expect(state.level).toBe(1);
    expect(state.charging).toBe(true);
    expect(state.mode).toBe("full");
  });

  it("respects reduced motion preference", () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    expect(shouldAnimate()).toBe(false);
    
    mockMatchMedia.mockReturnValue({ matches: false });
    // Depends on battery state too, so may vary
    expect(typeof shouldAnimate()).toBe("boolean");
  });
});

describe("Accessibility", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    destroyA11yHelpers();
  });

  it("creates and uses ARIA live region for announcements", () => {
    announce("Test message");
    const liveRegion = document.getElementById("a11y-live-region");
    expect(liveRegion).toBeTruthy();
    expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
    expect(liveRegion?.className).toBe("sr-only");
  });

  it("supports urgent announcements", () => {
    announceUrgent("Emergency message");
    const liveRegion = document.getElementById("a11y-live-region");
    expect(liveRegion?.getAttribute("aria-live")).toBe("assertive");
  });

  it("detects reduced motion preference", () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);
    
    mockMatchMedia.mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
  });

  it("focuses elements by ID", () => {
    const button = document.createElement("button");
    button.id = "test-button";
    document.body.appendChild(button);
    
    const focusSpy = vi.spyOn(button, "focus");
    focusElement("test-button", 0);
    
    setTimeout(() => {
      expect(focusSpy).toHaveBeenCalled();
    }, 10);
  });

  it("formats distances for screen readers", () => {
    expect(srDistance(1.0)).toBe("1 kilometre");
    expect(srDistance(2.5)).toBe("2.5 kilometres");
    expect(srDistance(1.60934, "mi")).toBe("1 mile");
  });

  it("formats durations for screen readers", () => {
    expect(srDuration(0.5)).toBe("less than a minute");
    expect(srDuration(1)).toBe("1 minute");
    expect(srDuration(15)).toBe("15 minutes");
    expect(srDuration(90)).toBe("1 hour and 30 minutes");
    expect(srDuration(120)).toBe("2 hours");
  });

  it("formats step counts with commas", () => {
    expect(srSteps(1)).toBe("1 step");
    expect(srSteps(1500)).toBe("1,500 steps");
  });

  it("builds prayer card aria labels", () => {
    const label = srPrayerCard("Dhuhr", "13:00", "12:45");
    expect(label).toBe("Dhuhr prayer at 13:00. Leave by 12:45");
  });
});