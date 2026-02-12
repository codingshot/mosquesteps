import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchLocationSuggestions, reverseGeocode } from "@/lib/geocode";

describe("geocode / location type-ahead", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchLocationSuggestions", () => {
    it("returns empty array for empty or whitespace query", async () => {
      expect(await fetchLocationSuggestions("")).toEqual([]);
      expect(await fetchLocationSuggestions("   ")).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns empty array for query shorter than 2 characters", async () => {
      expect(await fetchLocationSuggestions("L")).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns suggestions from valid Nominatim-shaped response", async () => {
      const mockData = [
        {
          lat: "51.5074",
          lon: "-0.1278",
          display_name: "London, Greater London, England, United Kingdom",
          address: { city: "London" },
        },
        {
          lat: "52.52",
          lon: "13.405",
          display_name: "Berlin, Germany",
          address: { city: "Berlin" },
        },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await fetchLocationSuggestions("London", 5);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        displayName: "London, Greater London, England, United Kingdom",
        shortName: "London",
        lat: 51.5074,
        lng: -0.1278,
      });
      expect(result[1]).toMatchObject({
        displayName: "Berlin, Germany",
        shortName: "Berlin",
        lat: 52.52,
        lng: 13.405,
      });

      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain("nominatim.openstreetmap.org");
      expect(url).toContain("q=London");
      expect(url).toContain("limit=5");
      expect(url).toContain("addressdetails=1");
    });

    it("uses display_name first part when address has no city/town/village", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { lat: "21.42", lon: "39.83", display_name: "Makkah, Saudi Arabia", address: {} },
          ]),
      });
      const result = await fetchLocationSuggestions("Makkah");
      expect(result[0].shortName).toBe("Makkah");
      expect(result[0].displayName).toBe("Makkah, Saudi Arabia");
    });

    it("returns empty array when response is not ok", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
      const result = await fetchLocationSuggestions("London");
      expect(result).toEqual([]);
    });

    it("returns empty array when response is empty array", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
      const result = await fetchLocationSuggestions("xyznonexistent");
      expect(result).toEqual([]);
    });

    it("default limit is 8", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
      await fetchLocationSuggestions("London");
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain("limit=8");
    });

    it("returns empty array when JSON parse fails or response is not array", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });
      const result = await fetchLocationSuggestions("London");
      expect(result).toEqual([]);
    });

    it("returns empty array when response is object instead of array", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: "Rate limited" }),
      });
      const result = await fetchLocationSuggestions("London");
      expect(result).toEqual([]);
    });
  });

  describe("reverseGeocode", () => {
    it("returns city from address when present", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: { city: "London" },
            display_name: "London, UK",
          }),
      });
      const result = await reverseGeocode(51.5074, -0.1278);
      expect(result).toBe("London");
    });

    it("falls back to town then village then county", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: { town: "Cambridge", county: "Cambridgeshire" },
            display_name: "Cambridge, UK",
          }),
      });
      const result = await reverseGeocode(52.2, 0.12);
      expect(result).toBe("Cambridge");
    });

    it("uses display_name first parts when no city/town/village", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            address: {},
            display_name: "Makkah, Mecca Governorate, Saudi Arabia",
          }),
      });
      const result = await reverseGeocode(21.42, 39.83);
      expect(result).toContain("Makkah");
      expect(result).toContain("Mecca Governorate");
      expect(result).toContain("Saudi Arabia");
    });

    it("returns null when response is not ok", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
      const result = await reverseGeocode(51.5, -0.1);
      expect(result).toBeNull();
    });

    it("builds correct reverse URL with lat and lon", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ address: { city: "London" } }),
      });
      await reverseGeocode(51.5074, -0.1278);
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain("nominatim.openstreetmap.org/reverse");
      expect(url).toContain("lat=51.5074");
      expect(url).toContain("lon=-0.1278");
    });
  });
});
