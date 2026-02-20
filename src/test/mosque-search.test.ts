/**
 * Tests for mosque-search: Overpass parsing, deduplication, concentric radii,
 * coordinate validation, and name extraction.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchNearbyMosques, haversineKm } from "@/lib/mosque-search";

const LONDON = { lat: 51.5, lng: -0.1 };

function makeElement(overrides: Record<string, unknown> = {}) {
  return {
    id: Math.floor(Math.random() * 1e9),
    type: "node",
    lat: LONDON.lat + (Math.random() - 0.5) * 0.01,
    lon: LONDON.lng + (Math.random() - 0.5) * 0.01,
    tags: { "amenity": "place_of_worship", "religion": "muslim", "name": "Test Mosque" },
    ...overrides,
  };
}

function mockOverpassResponse(elements: unknown[]) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ elements }),
  });
}

describe("haversineKm", () => {
  it("returns 0 for same point", () => {
    expect(haversineKm(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("returns ~111 km for 1 degree latitude difference", () => {
    const dist = haversineKm(0, 0, 1, 0);
    expect(dist).toBeCloseTo(111.19, 1);
  });

  it("returns a positive value for two different points", () => {
    const dist = haversineKm(51.5, -0.1, 51.51, -0.09);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(2);
  });
});

describe("searchNearbyMosques – coordinate validation", () => {
  it("throws for NaN lat", async () => {
    await expect(searchNearbyMosques(NaN, 0)).rejects.toThrow(/invalid/i);
  });

  it("throws for NaN lng", async () => {
    await expect(searchNearbyMosques(51.5, NaN)).rejects.toThrow(/invalid/i);
  });

  it("throws for lat > 90", async () => {
    await expect(searchNearbyMosques(91, 0)).rejects.toThrow(/invalid/i);
  });

  it("throws for lng > 180", async () => {
    await expect(searchNearbyMosques(0, 181)).rejects.toThrow(/invalid/i);
  });

  it("throws for lat < -90", async () => {
    await expect(searchNearbyMosques(-91, 0)).rejects.toThrow(/invalid/i);
  });
});

describe("searchNearbyMosques – parsing", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array when Overpass returns no elements", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result).toHaveLength(0);
  });

  it("returns parsed mosque for a node element", async () => {
    const el = makeElement({ lat: LONDON.lat, lon: LONDON.lng, tags: { name: "Central Mosque", "amenity": "place_of_worship", religion: "muslim" } });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([el]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Central Mosque");
    expect(result[0].lat).toBe(LONDON.lat);
    expect(result[0].lon).toBe(LONDON.lng);
  });

  it("uses center coords for way elements", async () => {
    const el = {
      id: 1,
      type: "way",
      center: { lat: 51.51, lon: -0.09 },
      tags: { name: "Way Mosque", amenity: "place_of_worship", religion: "muslim" },
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([el]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(51.51);
    expect(result[0].lon).toBe(-0.09);
  });

  it("skips elements with no usable coordinates", async () => {
    const badEl = { id: 99, type: "way", tags: { name: "Bad" } }; // no lat/lon/center
    const goodEl = makeElement({ lat: LONDON.lat, lon: LONDON.lng });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([badEl, goodEl]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result).toHaveLength(1);
  });

  it("extracts opening_hours from tags", async () => {
    const el = makeElement({
      lat: LONDON.lat, lon: LONDON.lng,
      tags: { name: "Open Mosque", amenity: "place_of_worship", religion: "muslim", opening_hours: "Mo-Su 06:00-22:00" },
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([el]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result[0].openingHours).toBe("Mo-Su 06:00-22:00");
  });

  it("falls back to 'Mosque' when tags have no name", async () => {
    const el = makeElement({ lat: LONDON.lat, lon: LONDON.lng, tags: { amenity: "place_of_worship" } });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([el]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result[0].name).toBe("Mosque");
  });

  it("prefers name:en over name", async () => {
    const el = makeElement({
      lat: LONDON.lat, lon: LONDON.lng,
      tags: { name: "Arabic Name", "name:en": "English Name", amenity: "place_of_worship", religion: "muslim" },
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([el]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result[0].name).toBe("English Name");
  });
});

describe("searchNearbyMosques – deduplication", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("deduplicates same-name mosques within 50 m", async () => {
    // Two nodes ~10 m apart with same name
    const base = { lat: LONDON.lat, lon: LONDON.lng };
    const nearby = { lat: LONDON.lat + 0.00005, lon: LONDON.lng }; // ~5.5 m
    const el1 = { id: 1, type: "node", ...base,   tags: { name: "Duplicate Mosque", amenity: "place_of_worship", religion: "muslim" } };
    const el2 = { id: 2, type: "node", ...nearby, tags: { name: "Duplicate Mosque", amenity: "place_of_worship", religion: "muslim" } };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([el1, el2]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result).toHaveLength(1);
  });

  it("does NOT deduplicate same-name mosques far apart (>150 m)", async () => {
    // Two mosques with same name but 300 m apart
    const far = { lat: LONDON.lat + 0.003, lon: LONDON.lng }; // ~330 m
    const el1 = { id: 1, type: "node", lat: LONDON.lat, lon: LONDON.lng, tags: { name: "Common Mosque", amenity: "place_of_worship", religion: "muslim" } };
    const el2 = { id: 2, type: "node", lat: far.lat,       lon: far.lon,  tags: { name: "Common Mosque", amenity: "place_of_worship", religion: "muslim" } };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([el1, el2]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result).toHaveLength(2);
  });

  it("sorts results by distance (closest first)", async () => {
    const far  = makeElement({ id: 100, lat: LONDON.lat + 0.01, lon: LONDON.lng, tags: { name: "Far Mosque",   amenity: "place_of_worship", religion: "muslim" } });
    const close = makeElement({ id: 200, lat: LONDON.lat + 0.001, lon: LONDON.lng, tags: { name: "Close Mosque", amenity: "place_of_worship", religion: "muslim" } });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([far, close]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result[0].name).toBe("Close Mosque");
    expect(result[1].name).toBe("Far Mosque");
  });

  it("includes distanceKm in results", async () => {
    const el = makeElement({ lat: LONDON.lat, lon: LONDON.lng });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverpassResponse([el]));
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result[0].distanceKm).toBeDefined();
    expect(result[0].distanceKm).toBeGreaterThanOrEqual(0);
  });
});

describe("searchNearbyMosques – Overpass server fallback", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("falls back to second server when first fails", async () => {
    const goodEl = makeElement({ lat: LONDON.lat, lon: LONDON.lng, tags: { name: "Fallback Mosque", amenity: "place_of_worship", religion: "muslim" } });
    let call = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      call++;
      if (call === 1) return Promise.reject(new Error("Primary down"));
      return mockOverpassResponse([goodEl]);
    });
    const result = await searchNearbyMosques(LONDON.lat, LONDON.lng);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Fallback Mosque");
  });

  it("throws when all servers fail", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("All down"));
    await expect(searchNearbyMosques(LONDON.lat, LONDON.lng)).rejects.toThrow();
  });
});
