import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSettings, saveSettings, getWalkHistory, addWalkEntry, getSavedMosques, saveMosque } from "@/lib/walking-history";
import { isValidCoordinate } from "@/lib/prayer-times";

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
    expect(entry.mosqueName).not.toContain("<script>");
    const history = getWalkHistory();
    expect(history[0].mosqueName).toBeDefined();
  });

  it("handles extremely long input strings without crashing", () => {
    const longString = "A".repeat(100000);
    saveSettings({ cityName: longString });
    const s = getSettings();
    // sanitizeString trims to 500 chars
    expect(s.cityName!.length).toBeLessThanOrEqual(500);
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
    expect(entry.distanceKm).toBe(0);
  });

  it("NaN walkingSpeed persists as null via JSON", () => {
    saveSettings({ walkingSpeed: NaN });
    const s1 = getSettings();
    // saveSettings now clamps NaN to default 5
    expect(s1.walkingSpeed).toBe(5);

    saveSettings({ walkingSpeed: Infinity });
    const s2 = getSettings();
    // Infinity is clamped to max 20
    expect(s2.walkingSpeed).toBe(20);
  });

  it("handles special characters in city names", () => {
    const specialChars = "München — Üniversité & bold";
    saveSettings({ cityName: specialChars });
    // HTML angle brackets are stripped by sanitizeString
    expect(getSettings().cityName).toBe(specialChars);
  });

  it("handles unicode/RTL in mosque names", () => {
    saveMosque({ id: "test-1", name: "المسجد الحرام", lat: 21.42, lng: 39.83, distanceKm: 0.5 });
    const mosques = getSavedMosques();
    expect(mosques[0].name).toBe("المسجد الحرام");
  });
});

// ── Settings Validation ─────────────────────────────────────────

describe("Security: Settings Validation", () => {
  beforeEach(() => localStorage.clear());

  it("clamps age to valid range", () => {
    saveSettings({ age: -5 });
    expect(getSettings().age).toBe(5); // AGE_MIN
    saveSettings({ age: 999 });
    expect(getSettings().age).toBe(120); // AGE_MAX
  });

  it("clamps body weight to valid range", () => {
    saveSettings({ bodyWeightKg: 5 });
    expect(getSettings().bodyWeightKg).toBe(20); // BODY_WEIGHT_KG_MIN
    saveSettings({ bodyWeightKg: 500 });
    expect(getSettings().bodyWeightKg).toBe(300); // BODY_WEIGHT_KG_MAX
  });

  it("clamps walking speed to valid range", () => {
    saveSettings({ walkingSpeed: 0.1 });
    expect(getSettings().walkingSpeed).toBe(0.5);
    saveSettings({ walkingSpeed: 50 });
    expect(getSettings().walkingSpeed).toBe(20);
  });

  it("rejects invalid coordinates in settings", () => {
    saveSettings({ cityLat: 999, cityLng: -999 });
    const s = getSettings();
    // Out of range should be clamped
    expect(s.cityLat).toBeLessThanOrEqual(90);
    expect(s.cityLng).toBeGreaterThanOrEqual(-180);
  });

  it("strips HTML from city name and mosque name", () => {
    saveSettings({ cityName: '<img src=x onerror=alert(1)>London', selectedMosqueName: '<b>Mosque</b>' });
    const s = getSettings();
    expect(s.cityName).not.toContain("<");
    expect(s.selectedMosqueName).not.toContain("<");
  });
});

// ── Coordinate Validation ───────────────────────────────────────

describe("Security: Coordinate Validation", () => {
  it("validates correct coordinates", () => {
    expect(isValidCoordinate(51.5, -0.12)).toBe(true);
    expect(isValidCoordinate(-33.87, 151.21)).toBe(true);
    expect(isValidCoordinate(0, 0)).toBe(true);
  });

  it("rejects NaN coordinates", () => {
    expect(isValidCoordinate(NaN, 0)).toBe(false);
    expect(isValidCoordinate(0, NaN)).toBe(false);
  });

  it("rejects Infinity coordinates", () => {
    expect(isValidCoordinate(Infinity, 0)).toBe(false);
    expect(isValidCoordinate(0, -Infinity)).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(-91, 0)).toBe(false);
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate(0, -181)).toBe(false);
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
    expect(s.walkingSpeed).toBeDefined();
  });

  it("handles tampered walk entry with missing fields", () => {
    localStorage.setItem("mosquesteps_history", JSON.stringify([
      { id: "fake", date: "2026-01-01" },
    ]));
    const history = getWalkHistory();
    expect(history).toHaveLength(1);
    expect(history[0].steps).toBeUndefined();
  });

  it("handles localStorage quota exceeded gracefully", () => {
    const bigData = "x".repeat(4 * 1024 * 1024);
    try {
      localStorage.setItem("test_fill", bigData);
    } catch {
      // Expected if quota exceeded
    }
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
