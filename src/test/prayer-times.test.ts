import { describe, it, expect } from "vitest";
import {
  estimateSteps,
  estimateWalkingTime,
  calculateHasanat,
  calculateLeaveByTime,
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
});
