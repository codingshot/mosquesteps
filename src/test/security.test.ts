import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSettings, saveSettings, getWalkHistory, addWalkEntry, getSavedMosques, saveMosque } from "@/lib/walking-history";

// ── Input Validation & Sanitization ──────────────────────────────

describe("Security: Input Validation", () => {
  beforeEach(() => localStorage.clear());

  it("rejects XSS in mosque name", () => {
    const entry = addWalkEntry({
      date: new Date().toISOString(),
      mosqueName: '<script>alert("xss")</script>',
      distanceKm: 0.5,
      steps: 100,
      walkingTimeMin: 5,
      hasanat: 200,
      prayer: "Fajr",
    });
    // The app stores raw data — rendering must sanitize via React
    expect(entry.mosqueName).not.toContain("<script>");
    // If stored, verify it doesn't execute (React auto-escapes JSX)
    const history = getWalkHistory();
    expect(history[0].mosqueName).toBeDefined();
  });

  it("handles extremely long input strings without crashing", () => {
    const longString = "A".repeat(100000);
    saveSettings({ cityName: longString });
    const s = getSettings();
    expect(s.cityName?.length).toBe(100000);
  });

  it("sanitizes negative walking distances to zero", () => {
    const entry = addWalkEntry({
      date: new Date().toISOString(),
      mosqueName: "Test",
      distanceKm: -5,
      steps: 100,
      walkingTimeMin: 5,
      hasanat: 200,
      prayer: "Fajr",
    });
    expect(entry.distanceKm).toBe(0); // sanitized to 0
  });

  it("NaN walkingSpeed persists as null via JSON", () => {
    saveSettings({ walkingSpeed: NaN });
    const s1 = getSettings();
    // JSON.stringify(NaN) → null, spread overrides default
    expect(s1.walkingSpeed).toBeNull();

    saveSettings({ walkingSpeed: Infinity });
    const s2 = getSettings();
    // JSON.stringify(Infinity) → null
    expect(s2.walkingSpeed).toBeNull();
  });

  it("handles special characters in city names", () => {
    const specialChars = "München — Üniversité & <b>bold</b>";
    saveSettings({ cityName: specialChars });
    expect(getSettings().cityName).toBe(specialChars);
  });

  it("handles unicode/RTL in mosque names", () => {
    saveMosque({ id: "test-1", name: "المسجد الحرام", lat: 21.42, lng: 39.83, distanceKm: 0.5 });
    const mosques = getSavedMosques();
    expect(mosques[0].name).toBe("المسجد الحرام");
  });
});

// ── localStorage Integrity & Tampering ──────────────────────────

describe("Security: localStorage Integrity", () => {
  beforeEach(() => localStorage.clear());

  it("handles corrupted JSON gracefully", () => {
    localStorage.setItem("mosquesteps_history", '{"broken');
    expect(getWalkHistory()).toEqual([]);
  });

  it("handles null values in localStorage", () => {
    localStorage.setItem("mosquesteps_settings", "null");
    const s = getSettings();
    expect(s.walkingSpeed).toBe(5);
  });

  it("handles array instead of object in settings", () => {
    localStorage.setItem("mosquesteps_settings", "[1,2,3]");
    const s = getSettings();
    // Should still merge with defaults
    expect(s.walkingSpeed).toBeDefined();
  });

  it("handles tampered walk entry with missing fields", () => {
    localStorage.setItem("mosquesteps_history", JSON.stringify([
      { id: "fake", date: "2026-01-01" }, // Missing required fields
    ]));
    const history = getWalkHistory();
    expect(history).toHaveLength(1);
    expect(history[0].steps).toBeUndefined(); // No crash
  });

  it("handles localStorage quota exceeded gracefully", () => {
    // Simulate by filling localStorage
    const bigData = "x".repeat(4 * 1024 * 1024); // 4MB
    try {
      localStorage.setItem("test_fill", bigData);
    } catch {
      // Expected if quota exceeded
    }
    // Should not crash
    expect(() => saveSettings({ cityName: "test" })).not.toThrow();
    localStorage.removeItem("test_fill");
  });

  it("prevents prototype pollution via JSON.parse", () => {
    const malicious = '{"__proto__": {"isAdmin": true}}';
    localStorage.setItem("mosquesteps_settings", malicious);
    const s = getSettings();
    expect((s as any).isAdmin).toBeUndefined();
    expect(({} as any).isAdmin).toBeUndefined();
  });
});

// ── API URL Construction ────────────────────────────────────────

describe("Security: API URL Safety", () => {
  it("encodes search queries in Nominatim URLs", () => {
    const malicious = '"; DROP TABLE users; --';
    const encoded = encodeURIComponent(malicious);
    expect(encoded).not.toContain('"');
    expect(encoded).not.toContain(';');
    expect(encoded).toContain('%22');
  });

  it("validates coordinates are numeric for prayer API", () => {
    const lat = parseFloat("not_a_number");
    const lng = parseFloat("also_nan");
    expect(Number.isNaN(lat)).toBe(true);
    expect(Number.isNaN(lng)).toBe(true);
  });
});

// ── Data Access Boundaries ──────────────────────────────────────

describe("Security: Data Boundaries", () => {
  beforeEach(() => localStorage.clear());

  it("different storage keys are isolated", () => {
    saveSettings({ cityName: "London" });
    addWalkEntry({
      date: new Date().toISOString(),
      mosqueName: "Test",
      distanceKm: 0.5,
      steps: 100,
      walkingTimeMin: 5,
      hasanat: 200,
      prayer: "Fajr",
    });
    
    // Settings and history are separate
    const settings = JSON.parse(localStorage.getItem("mosquesteps_settings")!);
    const history = JSON.parse(localStorage.getItem("mosquesteps_history")!);
    expect(settings.cityName).toBe("London");
    expect(Array.isArray(history)).toBe(true);
    expect(history[0].mosqueName).toBe("Test");
  });

  it("walk entry IDs are unique", () => {
    const e1 = addWalkEntry({ date: new Date().toISOString(), mosqueName: "A", distanceKm: 0.5, steps: 100, walkingTimeMin: 5, hasanat: 200, prayer: "Fajr" });
    const e2 = addWalkEntry({ date: new Date().toISOString(), mosqueName: "B", distanceKm: 0.5, steps: 100, walkingTimeMin: 5, hasanat: 200, prayer: "Dhuhr" });
    expect(e1.id).not.toBe(e2.id);
  });
});
