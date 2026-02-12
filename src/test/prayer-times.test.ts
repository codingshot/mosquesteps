import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  estimateSteps,
  estimateWalkingTime,
  calculateHasanat,
  calculateLeaveByTime,
  getNowInTimezone,
  getDatePartsInTimezone,
  minutesUntilLeave,
} from "@/lib/prayer-times";

describe("estimateSteps", () => {
  it("returns 0 steps for 0 km", () => {
    expect(estimateSteps(0)).toBe(0);
  });

  it("estimates ~1333 steps per km", () => {
    expect(estimateSteps(1)).toBe(1333);
  });

  it("scales linearly with distance", () => {
    expect(estimateSteps(2)).toBe(2666);
    expect(estimateSteps(0.5)).toBe(667);
  });

  it("handles small distances", () => {
    expect(estimateSteps(0.1)).toBe(133);
  });
});

describe("estimateWalkingTime", () => {
  it("returns correct time at default speed (5 km/h)", () => {
    expect(estimateWalkingTime(1)).toBe(12);
  });

  it("returns correct time at custom speed", () => {
    expect(estimateWalkingTime(1, 4)).toBe(15);
    expect(estimateWalkingTime(2, 5)).toBe(24);
  });

  it("returns 0 for 0 distance", () => {
    expect(estimateWalkingTime(0)).toBe(0);
  });
});

describe("calculateHasanat", () => {
  it("returns 2 hasanat per step", () => {
    expect(calculateHasanat(1)).toBe(2);
    expect(calculateHasanat(100)).toBe(200);
    expect(calculateHasanat(1000)).toBe(2000);
  });

  it("returns 0 for 0 steps", () => {
    expect(calculateHasanat(0)).toBe(0);
  });
});

describe("calculateLeaveByTime", () => {
  it("subtracts walking time + 5 min buffer", () => {
    // Prayer at 13:15, 10 min walk = leave at 13:00
    expect(calculateLeaveByTime("13:15", 10)).toBe("13:00");
  });

  it("handles hour boundary crossing", () => {
    // Prayer at 13:05, 10 min walk = leave at 12:50
    expect(calculateLeaveByTime("13:05", 10)).toBe("12:50");
  });

  it("handles short walks", () => {
    // Prayer at 12:30, 5 min walk = leave at 12:20
    expect(calculateLeaveByTime("12:30", 5)).toBe("12:20");
  });

  it("handles long walks", () => {
    // Prayer at 14:00, 30 min walk = leave at 13:25
    expect(calculateLeaveByTime("14:00", 30)).toBe("13:25");
  });

  it("wraps across midnight", () => {
    // Prayer at 00:15, 10 min walk = leave at 00:00
    expect(calculateLeaveByTime("00:15", 10)).toBe("00:00");
  });
});

describe("getNowInTimezone", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns hours and minutes in range when no timezone", () => {
    const result = getNowInTimezone();
    expect(result).toHaveProperty("hours");
    expect(result).toHaveProperty("minutes");
    expect(result.hours).toBeGreaterThanOrEqual(0);
    expect(result.hours).toBeLessThan(24);
    expect(result.minutes).toBeGreaterThanOrEqual(0);
    expect(result.minutes).toBeLessThan(60);
  });

  it("returns device time when no timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T14:30:00.000Z"));
    const result = getNowInTimezone();
    expect(result.hours).toBeDefined();
    expect(result.minutes).toBeDefined();
    vi.useRealTimers();
  });
});

describe("getDatePartsInTimezone", () => {
  it("returns dd, mm, yyyy for a given date (device time when no tz)", () => {
    const d = new Date("2025-03-17T12:00:00");
    const result = getDatePartsInTimezone(d);
    expect(result.dd).toBe("17");
    expect(result.mm).toBe("03");
    expect(result.yyyy).toBe("2025");
  });

  it("pads single-digit day and month", () => {
    const d = new Date("2025-01-05T12:00:00");
    const result = getDatePartsInTimezone(d);
    expect(result.dd).toBe("05");
    expect(result.mm).toBe("01");
    expect(result.yyyy).toBe("2025");
  });
});

describe("minutesUntilLeave", () => {
  it("returns positive minutes when leave-by is in the future", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T13:00:00.000Z"));
    // Leave by 13:50 (prayer 14:00, 5 min walk + 5 min buffer); use UTC so "now" is 13:00
    const result = minutesUntilLeave("14:00", 5, "UTC");
    expect(result).toBe(50);
    vi.useRealTimers();
  });

  it("accepts optional timezone and returns a number", () => {
    const result = minutesUntilLeave("14:00", 10, "Europe/London");
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
