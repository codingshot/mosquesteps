import { describe, it, expect } from "vitest";
import { srDuration } from "@/lib/accessibility";

describe("srDuration", () => {
  it("treats fractional minutes under 1 as less than a minute", () => {
    expect(srDuration(0.5)).toBe("less than a minute");
    expect(srDuration(0.99)).toBe("less than a minute");
  });

  it("rounds whole minutes from 1 upward", () => {
    expect(srDuration(1)).toBe("1 minute");
    expect(srDuration(1.4)).toBe("1 minute");
    expect(srDuration(15)).toBe("15 minutes");
  });

  it("handles hour boundaries", () => {
    expect(srDuration(90)).toBe("1 hour and 30 minutes");
    expect(srDuration(120)).toBe("2 hours");
  });

  it("handles invalid input", () => {
    expect(srDuration(NaN)).toBe("less than a minute");
    expect(srDuration(-1)).toBe("less than a minute");
  });
});
