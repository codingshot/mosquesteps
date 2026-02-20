/**
 * Extended directions tests: street name preservation, merge/fork edge cases,
 * imperial formatting precision, and boundary values.
 */
import { describe, it, expect } from "vitest";
import { formatDirection, formatDistanceForStep } from "@/lib/directions-utils";

describe("formatDirection – street names", () => {
  it("preserves street name in turn left", () => {
    expect(formatDirection("turn left onto Baker Street")).toBe("Turn left onto baker street");
  });

  it("preserves street name in turn right", () => {
    expect(formatDirection("turn right onto A40")).toBe("Turn right onto a40");
  });

  it("preserves street name for depart", () => {
    expect(formatDirection("depart onto High Road")).toBe("Start walking along high road");
  });

  it("preserves street name for notification/continue", () => {
    expect(formatDirection("notification onto Green Lane")).toBe("Continue on green lane");
    expect(formatDirection("continue onto Market St")).toBe("Continue on market st");
  });

  it("handles depart with no street name", () => {
    expect(formatDirection("depart")).toBe("Start walking");
  });

  it("handles arrive with no street", () => {
    expect(formatDirection("arrive")).toBe("You have arrived");
  });
});

describe("formatDirection – turn modifiers", () => {
  it("handles sharp left / sharp right", () => {
    expect(formatDirection("turn sharp left")).toBe("Turn sharp left");
    expect(formatDirection("turn sharp right")).toBe("Turn sharp right");
  });

  it("handles slight left / slight right", () => {
    expect(formatDirection("turn slight left")).toBe("Turn slight left");
    expect(formatDirection("turn slight right")).toBe("Turn slight right");
  });

  it("handles turn with no modifier", () => {
    // plain 'turn' without a direction keyword
    const result = formatDirection("turn");
    expect(result).toBe("Turn");
  });

  it("handles merge left/right", () => {
    expect(formatDirection("merge left onto Bypass")).toBe("Turn left onto bypass");
    expect(formatDirection("merge right")).toBe("Turn right");
  });
});

describe("formatDirection – roundabouts & forks", () => {
  it("handles rotary left/right with street", () => {
    expect(formatDirection("rotary right onto Exit Rd")).toBe("Enter roundabout, take exit right onto exit rd");
  });

  it("handles fork with no side", () => {
    expect(formatDirection("fork")).toBe("Take the fork");
  });

  it("handles fork left with street", () => {
    expect(formatDirection("fork left onto Valley Rd")).toBe("Take the left fork onto valley rd");
  });
});

describe("formatDirection – unknown / passthrough", () => {
  it("capitalises unknown instructions", () => {
    expect(formatDirection("walk diagonally")).toBe("Walk diagonally");
    expect(formatDirection("cross the bridge")).toBe("Cross the bridge");
  });

  it("handles 'end' action", () => {
    expect(formatDirection("end")).toBe("Continue to destination");
  });

  it("handles 'new name' action", () => {
    expect(formatDirection("new name onto Ring Rd")).toBe("Continue on ring rd");
  });
});

describe("formatDirection – safety guards", () => {
  it("handles empty string", () => {
    expect(formatDirection("")).toBe("Continue straight");
  });

  it("handles whitespace-only", () => {
    expect(formatDirection("   ")).toBe("Continue straight");
  });

  it("handles null", () => {
    expect(formatDirection(null as unknown as string)).toBe("Continue straight");
  });

  it("handles undefined", () => {
    expect(formatDirection(undefined as unknown as string)).toBe("Continue straight");
  });
});

describe("formatDistanceForStep – metric precision", () => {
  it("returns Now at exactly 0", () => {
    expect(formatDistanceForStep(0)).toBe("Now");
  });

  it("returns Now below threshold (< 10 m)", () => {
    expect(formatDistanceForStep(1)).toBe("Now");
    expect(formatDistanceForStep(9.9)).toBe("Now");
  });

  it("returns Now at exactly 10 m (boundary)", () => {
    // 10 m < 10 is false — so it should NOT be "Now"
    expect(formatDistanceForStep(10)).toBe("In 10 m");
  });

  it("rounds to nearest meter", () => {
    expect(formatDistanceForStep(150.6)).toBe("In 151 m");
    expect(formatDistanceForStep(99.4)).toBe("In 99 m");
  });

  it("formats exactly 1000 m as 1.0 km", () => {
    expect(formatDistanceForStep(1000)).toBe("In 1.0 km");
  });

  it("formats large distance in km", () => {
    expect(formatDistanceForStep(3500)).toBe("In 3.5 km");
    expect(formatDistanceForStep(10000)).toBe("In 10.0 km");
  });

  it("handles negative numbers as Now", () => {
    expect(formatDistanceForStep(-50)).toBe("Now");
  });

  it("handles Infinity as Now", () => {
    expect(formatDistanceForStep(Infinity)).toBe("Now");
  });
});

describe("formatDistanceForStep – imperial precision", () => {
  it("converts 100 m to feet", () => {
    expect(formatDistanceForStep(100, true)).toBe("In 328 ft");
  });

  it("converts 500 m to feet", () => {
    expect(formatDistanceForStep(500, true)).toBe("In 1640 ft");
  });

  it("converts 1609.344 m to exactly 1.0 mi", () => {
    expect(formatDistanceForStep(1609.344, true)).toBe("In 1.0 mi");
  });

  it("converts 3218.688 m to 2.0 mi", () => {
    expect(formatDistanceForStep(3218.688, true)).toBe("In 2.0 mi");
  });

  it("converts large imperial distance", () => {
    const result = formatDistanceForStep(8046.72, true); // 5 miles
    expect(result).toBe("In 5.0 mi");
  });

  it("returns Now for imperial small distance", () => {
    expect(formatDistanceForStep(5, true)).toBe("Now");
  });
});
