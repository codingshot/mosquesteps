/**
 * Tests for multi-provider routing (OSRM + Mapbox fallback),
 * Mapbox token management, and provider selection logic.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  fetchWalkingRoute,
  getMapboxToken,
  setMapboxToken,
  isMapboxAvailable,
  getPreferredProvider,
  setPreferredProvider,
} from "@/lib/routing";

const OSRM_OK = {
  code: "Ok",
  routes: [{
    distance: 1200,
    duration: 900,
    geometry: { coordinates: [[-0.1, 51.5], [-0.09, 51.51], [-0.08, 51.52]] },
    legs: [{ steps: [
      { maneuver: { type: "depart" }, distance: 600, duration: 450 },
      { maneuver: { type: "turn", modifier: "left" }, name: "High St", distance: 600, duration: 450 },
      { maneuver: { type: "arrive" }, distance: 0, duration: 0 },
    ]}],
  }],
};

const MAPBOX_OK = {
  routes: [{
    distance: 1100,
    duration: 850,
    geometry: { coordinates: [[-0.1, 51.5], [-0.095, 51.505], [-0.08, 51.52]] },
    legs: [{ steps: [
      { maneuver: { instruction: "Head north" }, distance: 550, duration: 425 },
      { maneuver: { instruction: "Turn left onto High St" }, distance: 550, duration: 425 },
    ]}],
  }],
};

describe("Routing provider management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => vi.restoreAllMocks());

  it("getMapboxToken returns empty when not set", () => {
    expect(getMapboxToken()).toBe("");
  });

  it("setMapboxToken stores and retrieves token", () => {
    setMapboxToken("pk.test_token_12345");
    expect(getMapboxToken()).toBe("pk.test_token_12345");
  });

  it("setMapboxToken with empty string removes token", () => {
    setMapboxToken("pk.test_token_12345");
    setMapboxToken("");
    expect(getMapboxToken()).toBe("");
  });

  it("isMapboxAvailable returns false when no token", () => {
    expect(isMapboxAvailable()).toBe(false);
  });

  it("isMapboxAvailable returns true with valid token", () => {
    setMapboxToken("pk.test_token_12345_long_enough");
    expect(isMapboxAvailable()).toBe(true);
  });

  it("getPreferredProvider defaults to osrm", () => {
    expect(getPreferredProvider()).toBe("osrm");
  });

  it("setPreferredProvider to mapbox without token still returns osrm", () => {
    setPreferredProvider("mapbox");
    expect(getPreferredProvider()).toBe("osrm");
  });

  it("setPreferredProvider to mapbox with token returns mapbox", () => {
    setMapboxToken("pk.test_token_12345_long_enough");
    setPreferredProvider("mapbox");
    expect(getPreferredProvider()).toBe("mapbox");
  });
});

describe("fetchWalkingRoute with providers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => vi.restoreAllMocks());

  it("uses OSRM by default and returns provider field", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(OSRM_OK),
    });
    const result = await fetchWalkingRoute(51.5, -0.1, 51.52, -0.08);
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("osrm");
    expect(result!.distanceKm).toBeCloseTo(1.2, 1);
  });

  it("falls back to Mapbox when OSRM fails and Mapbox is available", async () => {
    setMapboxToken("pk.test_token_12345_long_enough");
    let callCount = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      callCount++;
      if (url.includes("project-osrm.org")) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ code: "NoRoute" }) });
      }
      if (url.includes("api.mapbox.com")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(MAPBOX_OK) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });
    const result = await fetchWalkingRoute(51.5, -0.1, 51.52, -0.08);
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("mapbox");
    expect(callCount).toBe(2);
  });

  it("prefers Mapbox when set as preferred provider", async () => {
    setMapboxToken("pk.test_token_12345_long_enough");
    setPreferredProvider("mapbox");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MAPBOX_OK),
    });
    const result = await fetchWalkingRoute(51.5, -0.1, 51.52, -0.08);
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("mapbox");
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("api.mapbox.com");
  });

  it("falls back to OSRM when Mapbox preferred but fails", async () => {
    setMapboxToken("pk.test_token_12345_long_enough");
    setPreferredProvider("mapbox");
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes("api.mapbox.com")) {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(OSRM_OK) });
    });
    const result = await fetchWalkingRoute(51.5, -0.1, 51.52, -0.08);
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("osrm");
  });

  it("returns null when both providers fail", async () => {
    setMapboxToken("pk.test_token_12345_long_enough");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
    const result = await fetchWalkingRoute(51.5, -0.1, 51.52, -0.08);
    expect(result).toBeNull();
  });

  it("returns null for invalid coordinates", async () => {
    expect(await fetchWalkingRoute(NaN, -0.1, 51.52, -0.08)).toBeNull();
    expect(await fetchWalkingRoute(91, -0.1, 51.52, -0.08)).toBeNull();
    expect(await fetchWalkingRoute(51.5, -181, 51.52, -0.08)).toBeNull();
  });

  it("returns null for same point", async () => {
    expect(await fetchWalkingRoute(51.5, -0.1, 51.5, -0.1)).toBeNull();
  });

  it("Mapbox steps use maneuver.instruction directly", async () => {
    setMapboxToken("pk.test_token_12345_long_enough");
    setPreferredProvider("mapbox");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MAPBOX_OK),
    });
    const result = await fetchWalkingRoute(51.5, -0.1, 51.52, -0.08);
    expect(result!.steps[0].instruction).toBe("Head north");
    expect(result!.steps[1].instruction).toBe("Turn left onto High St");
  });
});
