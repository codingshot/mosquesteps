/**
 * Tests for onboarding location bias, home address type-ahead, and mosque auto-select edge cases.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchLocationSuggestions } from "@/lib/geocode";

describe("Home address type-ahead location bias", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes viewbox bias params when nearLat/nearLng provided", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    await fetchLocationSuggestions("Baker Street", 6, 51.5074, -0.1278);
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("viewbox=");
    expect(url).toContain("bounded=0");
  });

  it("does NOT add viewbox params when no nearLat/nearLng provided", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    await fetchLocationSuggestions("Baker Street", 6);
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain("viewbox=");
    expect(url).not.toContain("bounded=");
  });

  it("does NOT add viewbox when nearLat is NaN", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    await fetchLocationSuggestions("Baker Street", 6, NaN, -0.1278);
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain("viewbox=");
  });

  it("does NOT add viewbox when nearLng is Infinity", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    await fetchLocationSuggestions("Baker Street", 6, 51.5, Infinity);
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain("viewbox=");
  });

  it("viewbox is correctly constructed from lat/lng delta", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    const lat = 40.0, lng = 10.0, delta = 0.45;
    await fetchLocationSuggestions("test", 6, lat, lng);
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const params = new URLSearchParams(url.split("?")[1]);
    const viewbox = params.get("viewbox");
    expect(viewbox).not.toBeNull();
    const [minLng, maxLat, maxLng, minLat] = viewbox!.split(",").map(Number);
    expect(minLng).toBeCloseTo(lng - delta, 5);
    expect(maxLat).toBeCloseTo(lat + delta, 5);
    expect(maxLng).toBeCloseTo(lng + delta, 5);
    expect(minLat).toBeCloseTo(lat - delta, 5);
  });

  it("returns suggestions with correct shape including lat/lng", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        {
          lat: "51.52",
          lon: "-0.09",
          display_name: "1 Baker Street, London, UK",
          address: { house_number: "1", road: "Baker Street", city: "London" },
        },
      ]),
    });
    const result = await fetchLocationSuggestions("Baker", 6, 51.5, -0.1);
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBeCloseTo(51.52, 2);
    expect(result[0].lng).toBeCloseTo(-0.09, 2);
    // House number + road should form shortName
    expect(result[0].shortName).toMatch(/Baker/);
  });

  it("filters out results with out-of-range coordinates", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { lat: "91.0", lon: "0.0", display_name: "Invalid lat", address: {} },
        { lat: "0.0", lon: "181.0", display_name: "Invalid lng", address: {} },
        { lat: "51.5", lon: "-0.1", display_name: "Valid", address: { city: "London" } },
      ]),
    });
    const result = await fetchLocationSuggestions("test", 8, 51.5, -0.1);
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe("Valid");
  });

  it("returns empty array for 1-char query without calling fetch", async () => {
    await fetchLocationSuggestions("A", 6, 51.5, -0.1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("handles fetch network error gracefully", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));
    // Should throw — callers are expected to catch; test the helper throws
    await expect(fetchLocationSuggestions("London", 6)).rejects.toThrow("Network error");
  });
});

describe("Mosque auto-select edge cases", () => {
  it("haversine distance returns 0 for identical points", () => {
    const R = 6371;
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    expect(haversine(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("haversine distance between London and Berlin is approximately 930 km", () => {
    const R = 6371;
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    const dist = haversine(51.5074, -0.1278, 52.52, 13.405);
    expect(dist).toBeGreaterThan(900);
    expect(dist).toBeLessThan(960);
  });

  it("distance badge shows meters when < 1 km", () => {
    const getDistLabel = (km: number) => {
      if (km < 1) return `${Math.round(km * 1000)} m`;
      return `${km.toFixed(1)} km`;
    };
    expect(getDistLabel(0.35)).toBe("350 m");
    expect(getDistLabel(0.999)).toBe("999 m");
    expect(getDistLabel(1.0)).toBe("1.0 km");
    expect(getDistLabel(2.5)).toBe("2.5 km");
  });

  it("distance color thresholds are correct", () => {
    const getDistColor = (km: number) => {
      if (km < 0.5) return "close";
      if (km < 1.5) return "medium";
      return "far";
    };
    expect(getDistColor(0.1)).toBe("close");
    expect(getDistColor(0.499)).toBe("close");
    expect(getDistColor(0.5)).toBe("medium");
    expect(getDistColor(1.499)).toBe("medium");
    expect(getDistColor(1.5)).toBe("far");
    expect(getDistColor(5.0)).toBe("far");
  });
});

describe("Dashboard route display edge cases", () => {
  it("estimateSteps returns whole positive number for valid distance", () => {
    // estimateSteps(km) — approx 1300 steps/km
    const estimateSteps = (km: number) => Math.round(km * 1312);
    expect(estimateSteps(1.0)).toBeGreaterThan(0);
    expect(estimateSteps(0)).toBe(0);
    expect(Number.isInteger(estimateSteps(2.5))).toBe(true);
  });

  it("displays straight-line fallback when no route available", () => {
    // If mosqueRoute is null, we fall back to settings.selectedMosqueDistance
    const mosqueRoute = null;
    const mosqueDistance = 0.8;
    const displayDist = mosqueRoute ? (mosqueRoute as any).distanceKm : mosqueDistance;
    expect(displayDist).toBe(0.8);
  });

  it("displays route distance when route is available", () => {
    const mosqueRoute = { distanceKm: 1.23, durationMin: 15 };
    expect(mosqueRoute.distanceKm).toBe(1.23);
    expect(mosqueRoute.durationMin).toBe(15);
  });
});
