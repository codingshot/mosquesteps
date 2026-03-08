/**
 * Tests for shared geo-utils: haversine, bearing, heading smoothing,
 * route progress, route simplification, and distance formatting.
 */
import { describe, it, expect } from "vitest";
import {
  haversineKm,
  calcBearing,
  smoothHeading,
  findClosestRouteIndex,
  routeProgress,
  simplifyRoute,
  formatDistanceLabel,
  OFF_ROUTE_THRESHOLD_SQ,
} from "@/lib/geo-utils";

describe("haversineKm", () => {
  it("returns 0 for same point", () => {
    expect(haversineKm(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("returns ~111 km for 1° latitude at equator", () => {
    const d = haversineKm(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });

  it("London to Paris ~340 km", () => {
    const d = haversineKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(350);
  });
});

describe("calcBearing", () => {
  it("north bearing is ~0°", () => {
    const b = calcBearing(0, 0, 1, 0);
    expect(b).toBeLessThan(1);
  });

  it("east bearing is ~90°", () => {
    const b = calcBearing(0, 0, 0, 1);
    expect(b).toBeGreaterThan(89);
    expect(b).toBeLessThan(91);
  });

  it("south bearing is ~180°", () => {
    const b = calcBearing(1, 0, 0, 0);
    expect(b).toBeGreaterThan(179);
    expect(b).toBeLessThan(181);
  });
});

describe("smoothHeading", () => {
  it("returns raw heading when no previous", () => {
    expect(smoothHeading(null, 90)).toBe(90);
  });

  it("smooths towards new heading", () => {
    const result = smoothHeading(0, 90, 0.3);
    expect(result).toBeCloseTo(27, 0);
  });

  it("handles 360/0 wraparound correctly", () => {
    const result = smoothHeading(350, 10, 0.5);
    // Should go through 0 (shortest path), not jump to 180
    expect(result).toBeLessThan(20);
  });

  it("handles reverse wraparound", () => {
    const result = smoothHeading(10, 350, 0.5);
    // 10 + 0.5 * (-20) = 0 → wraps to 360
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(15);
  });
});

describe("findClosestRouteIndex", () => {
  const route: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0]];

  it("finds exact match", () => {
    const { index } = findClosestRouteIndex(route, 2, 0);
    expect(index).toBe(2);
  });

  it("finds closest for intermediate point", () => {
    const { index } = findClosestRouteIndex(route, 1.3, 0);
    expect(index).toBe(1);
  });
});

describe("routeProgress", () => {
  const route: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0]];

  it("returns 0 at start", () => {
    expect(routeProgress(route, 0, 0)).toBe(0);
  });

  it("returns 100 at end", () => {
    expect(routeProgress(route, 3, 0)).toBe(100);
  });

  it("returns ~50 at midpoint", () => {
    const pct = routeProgress(route, 1.5, 0);
    expect(pct).toBeGreaterThan(25);
    expect(pct).toBeLessThan(75);
  });

  it("returns 0 for empty route", () => {
    expect(routeProgress([], 0, 0)).toBe(0);
  });
});

describe("simplifyRoute", () => {
  it("keeps start and end for simple routes", () => {
    const route: [number, number][] = [[0, 0], [1, 1]];
    expect(simplifyRoute(route)).toHaveLength(2);
  });

  it("reduces collinear points", () => {
    const route: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]];
    const simplified = simplifyRoute(route, 0.0001);
    expect(simplified.length).toBeLessThan(route.length);
    expect(simplified[0]).toEqual([0, 0]);
    expect(simplified[simplified.length - 1]).toEqual([4, 0]);
  });

  it("preserves significant turns", () => {
    const route: [number, number][] = [[0, 0], [1, 0], [1, 1], [2, 1]];
    const simplified = simplifyRoute(route, 0.0001);
    expect(simplified.length).toBeGreaterThanOrEqual(3);
  });
});

describe("formatDistanceLabel", () => {
  it("formats meters", () => {
    expect(formatDistanceLabel(0.5)).toBe("500 m");
  });

  it("formats km", () => {
    expect(formatDistanceLabel(2.5)).toBe("2.5 km");
  });

  it("formats imperial miles", () => {
    expect(formatDistanceLabel(2, true)).toBe("1.2 mi");
  });

  it("formats imperial feet for short distances", () => {
    expect(formatDistanceLabel(0.02, true)).toMatch(/ft$/);
  });
});

describe("OFF_ROUTE_THRESHOLD_SQ", () => {
  it("is a small positive number", () => {
    expect(OFF_ROUTE_THRESHOLD_SQ).toBeGreaterThan(0);
    expect(OFF_ROUTE_THRESHOLD_SQ).toBeLessThan(0.001);
  });
});
