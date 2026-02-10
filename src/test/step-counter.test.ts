import { describe, it, expect } from "vitest";
import { getPaceCategory } from "@/lib/step-counter";

describe("step-counter", () => {
  describe("getPaceCategory", () => {
    it("returns Stationary for 0 steps/min", () => {
      const result = getPaceCategory(0);
      expect(result.label).toBe("Stationary");
      expect(result.isTooFast).toBe(false);
    });

    it("returns Slow for <70 steps/min", () => {
      const result = getPaceCategory(50);
      expect(result.label).toBe("Slow");
      expect(result.isTooFast).toBe(false);
    });

    it("returns Dignified for 70-120 steps/min", () => {
      const result = getPaceCategory(100);
      expect(result.label).toBe("Dignified");
      expect(result.isTooFast).toBe(false);
    });

    it("returns Brisk for 121-150 steps/min", () => {
      const result = getPaceCategory(140);
      expect(result.label).toBe("Brisk");
      expect(result.isTooFast).toBe(false);
    });

    it("returns Too Fast for >150 steps/min with sunnah link", () => {
      const result = getPaceCategory(160);
      expect(result.label).toBe("Too Fast");
      expect(result.isTooFast).toBe(true);
      expect(result.sunnahLink).toContain("sunnah.com");
    });
  });
});
