import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getIPGeolocation } from "@/lib/prayer-times";

const IP_GEO_CACHE_KEY = "mosquesteps_ip_geo";

describe("location / IP geolocation", () => {
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    localStorageStore = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStorageStore[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageStore[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageStore[key];
      },
      clear: () => {
        localStorageStore = {};
      },
      length: 0,
      key: () => null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when both IP services fail or return no coords", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    const result = await getIPGeolocation();
    expect(result).toBeNull();
  });

  it("returns lat, lng, city, timezone from ipapi.co-shaped response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          latitude: 51.5074,
          longitude: -0.1278,
          city: "London",
          timezone: "Europe/London",
        }),
    });
    const result = await getIPGeolocation();
    expect(result).toEqual({
      lat: 51.5074,
      lng: -0.1278,
      city: "London",
      timezone: "Europe/London",
    });
    expect(global.fetch).toHaveBeenCalledWith("https://ipapi.co/json/", expect.any(Object));
  });

  it("falls back to ip-api.com when ipapi.co does not return coords", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            lat: 52.52,
            lon: 13.405,
            city: "Berlin",
            timezone: "Europe/Berlin",
          }),
      });
    const result = await getIPGeolocation();
    expect(result).toEqual({
      lat: 52.52,
      lng: 13.405,
      city: "Berlin",
      timezone: "Europe/Berlin",
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("uses Unknown for city and empty string for timezone when missing", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          latitude: 21.42,
          longitude: 39.83,
        }),
    });
    const result = await getIPGeolocation();
    expect(result).toMatchObject({
      lat: 21.42,
      lng: 39.83,
      city: "Unknown",
      timezone: "",
    });
  });

  it("returns cached result when valid and under 24h", async () => {
    const cached = {
      lat: 40.7,
      lng: -74.0,
      city: "New York",
      timezone: "America/New_York",
      timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
    };
    localStorageStore[IP_GEO_CACHE_KEY] = JSON.stringify(cached);
    const result = await getIPGeolocation();
    expect(result).toMatchObject({ lat: 40.7, lng: -74.0, city: "New York", timezone: "America/New_York" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches again when cache is older than 24h", async () => {
    const cached = {
      lat: 40.7,
      lng: -74.0,
      city: "New York",
      timezone: "America/New_York",
      timestamp: Date.now() - 25 * 60 * 60 * 1000,
    };
    localStorageStore[IP_GEO_CACHE_KEY] = JSON.stringify(cached);
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          latitude: 51.5,
          longitude: -0.1,
          city: "London",
          timezone: "Europe/London",
        }),
    });
    const result = await getIPGeolocation();
    expect(result).toMatchObject({ lat: 51.5, city: "London" });
    expect(global.fetch).toHaveBeenCalled();
  });
});
