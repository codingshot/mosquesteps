/**
 * Extended mosque search tests: name variations (masjid, musalla, prayer room, etc.),
 * no-results edge case, and expanded query coverage.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { searchNearbyMosques, haversineKm } from "@/lib/mosque-search";

describe("Mosque search — name variation coverage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => vi.restoreAllMocks());

  const makeOverpassResponse = (elements: any[]) => ({
    ok: true,
    json: () => Promise.resolve({ elements }),
  });

  it("finds mosques tagged as masjid in name", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([
        { id: 1, type: "node", lat: 51.5, lon: -0.1, tags: { name: "Masjid Al-Noor", amenity: "place_of_worship" } },
      ])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("Masjid Al-Noor");
  });

  it("finds musalla / prayer room entries", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([
        { id: 2, type: "node", lat: 51.501, lon: -0.1, tags: { name: "University Musalla", amenity: "place_of_worship" } },
        { id: 3, type: "node", lat: 51.502, lon: -0.1, tags: { name: "Airport Prayer Room", amenity: "place_of_worship" } },
      ])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results.length).toBe(2);
    expect(results.some((r) => r.name.includes("Musalla"))).toBe(true);
    expect(results.some((r) => r.name.includes("Prayer Room"))).toBe(true);
  });

  it("finds Islamic center entries", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([
        { id: 4, type: "way", center: { lat: 51.5, lon: -0.1 }, tags: { name: "Islamic Center of London", amenity: "place_of_worship", religion: "muslim" } },
      ])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results.length).toBe(1);
    expect(results[0].name).toContain("Islamic Center");
  });

  it("finds jamia / jami mosque entries", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([
        { id: 5, type: "node", lat: 51.5, lon: -0.1, tags: { name: "Jamia Masjid", amenity: "place_of_worship", religion: "muslim" } },
      ])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results[0].name).toBe("Jamia Masjid");
  });

  it("returns empty array when no mosques found", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results).toEqual([]);
  });

  it("throws on invalid coordinates", async () => {
    await expect(searchNearbyMosques(NaN, 0)).rejects.toThrow("Invalid coordinates");
    await expect(searchNearbyMosques(91, 0)).rejects.toThrow("Invalid coordinates");
    await expect(searchNearbyMosques(0, -181)).rejects.toThrow("Invalid coordinates");
  });

  it("deduplicates same-name mosques within 150m", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([
        { id: 10, type: "node", lat: 51.5, lon: -0.1, tags: { name: "Central Mosque", religion: "muslim", amenity: "place_of_worship" } },
        { id: 11, type: "way", center: { lat: 51.5001, lon: -0.1001 }, tags: { name: "Central Mosque", religion: "muslim", amenity: "place_of_worship" } },
      ])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results.length).toBe(1);
  });

  it("does NOT deduplicate same-name mosques far apart", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([
        { id: 20, type: "node", lat: 51.5, lon: -0.1, tags: { name: "Al-Falah Mosque", religion: "muslim", amenity: "place_of_worship" } },
        { id: 21, type: "node", lat: 51.52, lon: -0.12, tags: { name: "Al-Falah Mosque", religion: "muslim", amenity: "place_of_worship" } },
      ])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results.length).toBe(2);
  });

  it("prefers English name over Arabic name", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([
        { id: 30, type: "node", lat: 51.5, lon: -0.1, tags: { "name:en": "East London Mosque", "name:ar": "مسجد شرق لندن", religion: "muslim", amenity: "place_of_worship" } },
      ])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results[0].name).toBe("East London Mosque");
  });

  it("includes distanceKm in results", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeOverpassResponse([
        { id: 40, type: "node", lat: 51.51, lon: -0.09, tags: { name: "Test Mosque", religion: "muslim", amenity: "place_of_worship" } },
      ])
    );
    const results = await searchNearbyMosques(51.5, -0.1);
    expect(results[0].distanceKm).toBeGreaterThan(0);
    expect(results[0].distanceKm).toBeLessThan(5);
  });
});

describe("haversineKm edge cases", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("calculates ~111 km for 1° latitude at equator", () => {
    const d = haversineKm(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it("handles antipodal points", () => {
    const d = haversineKm(0, 0, 0, 180);
    expect(d).toBeGreaterThan(20000);
    expect(d).toBeLessThan(20100);
  });
});
