import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWalkingRoute } from "@/lib/routing";

describe("routing / directions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds correct OSRM URL with from and to coordinates", async () => {
    const mockRes = {
      json: () =>
        Promise.resolve({
          code: "Ok",
          routes: [
            {
              distance: 1500,
              duration: 900,
              geometry: { coordinates: [[-0.1, 51.5], [-0.09, 51.51]] },
              legs: [{ steps: [{ maneuver: { type: "depart" }, distance: 500, duration: 300 }] }],
            },
          ],
        }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockRes);

    await fetchWalkingRoute(51.5, -0.1, 51.51, -0.09);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("router.project-osrm.org");
    expect(url).toContain("/foot/");
    expect(url).toContain("-0.1,51.5"); // lng,lat from
    expect(url).toContain("-0.09,51.51"); // lng,lat to
    expect(url).toContain("overview=full");
    expect(url).toContain("steps=true");
  });

  it("returns coords as [lat, lng] for Leaflet", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve({
          code: "Ok",
          routes: [
            {
              distance: 1000,
              duration: 600,
              geometry: { coordinates: [[-0.1, 51.5], [-0.09, 51.51]] },
              legs: [
                {
                  steps: [
                    { maneuver: { type: "depart" }, distance: 500, duration: 300 },
                    { maneuver: { type: "arrive" }, distance: 500, duration: 300 },
                  ],
                },
              ],
            },
          ],
        }),
    });

    const result = await fetchWalkingRoute(51.5, -0.1, 51.51, -0.09);
    expect(result).not.toBeNull();
    expect(result!.coords).toHaveLength(2);
    expect(result!.coords[0]).toEqual([51.5, -0.1]);
    expect(result!.coords[1]).toEqual([51.51, -0.09]);
  });

  it("returns distanceKm and durationMin", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve({
          code: "Ok",
          routes: [
            {
              distance: 2500,
              duration: 1200,
              geometry: { coordinates: [[-0.1, 51.5], [-0.09, 51.51]] },
              legs: [{ steps: [{ maneuver: { type: "depart" }, distance: 2500, duration: 1200 }] }],
            },
          ],
        }),
    });

    const result = await fetchWalkingRoute(51.5, -0.1, 51.51, -0.09);
    expect(result!.distanceKm).toBe(2.5);
    expect(result!.durationMin).toBe(20);
  });

  it("returns steps with instruction and distance", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve({
          code: "Ok",
          routes: [
            {
              distance: 1000,
              duration: 600,
              geometry: { coordinates: [[-0.1, 51.5], [-0.09, 51.51]] },
              legs: [
                {
                  steps: [
                    { maneuver: { type: "depart", modifier: "left" }, name: "Street", distance: 400, duration: 240 },
                    { maneuver: { type: "turn", modifier: "right" }, distance: 600, duration: 360 },
                  ],
                },
              ],
            },
          ],
        }),
    });

    const result = await fetchWalkingRoute(51.5, -0.1, 51.51, -0.09);
    expect(result!.steps).toHaveLength(2);
    expect(result!.steps[0]).toMatchObject({ distance: 400, duration: 240 });
    expect(result!.steps[0].instruction).toBeTruthy();
    expect(result!.steps[1].instruction).toBeTruthy();
  });

  it("returns null when API code is not Ok", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ code: "NoRoute", routes: [] }),
    });

    const result = await fetchWalkingRoute(51.5, -0.1, 51.51, -0.09);
    expect(result).toBeNull();
  });

  it("returns null when routes array is empty", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ code: "Ok", routes: [] }),
    });

    const result = await fetchWalkingRoute(51.5, -0.1, 51.51, -0.09);
    expect(result).toBeNull();
  });

  it("returns null on fetch failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

    const result = await fetchWalkingRoute(51.5, -0.1, 51.51, -0.09);
    expect(result).toBeNull();
  });

  it("returns null when route has no geometry coordinates", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () =>
        Promise.resolve({
          code: "Ok",
          routes: [{ distance: 1000, duration: 600, geometry: {}, legs: [{ steps: [] }] }],
        }),
    });

    const result = await fetchWalkingRoute(51.5, -0.1, 51.51, -0.09);
    expect(result).toBeNull();
  });
});
