import { describe, it, expect } from "vitest";
import { formatDirection, formatDistanceForStep } from "@/lib/directions-utils";

describe("formatDirection", () => {
  it("formats depart as Start walking", () => {
    expect(formatDirection("depart")).toBe("Start walking");
    expect(formatDirection("depart onto Main St")).toBe("Start walking along main st");
  });

  it("formats arrive as You have arrived", () => {
    expect(formatDirection("arrive")).toBe("You have arrived");
  });

  it("formats turn left/right with street name", () => {
    expect(formatDirection("turn left onto Oak Ave")).toBe("Turn left onto oak ave");
    expect(formatDirection("turn right onto Highway 1")).toBe("Turn right onto highway 1");
  });

  it("formats slight and sharp turns", () => {
    expect(formatDirection("turn slight left")).toBe("Turn slight left");
    expect(formatDirection("turn sharp right onto Lane")).toBe("Turn sharp right onto lane");
  });

  it("formats continue straight", () => {
    expect(formatDirection("continue")).toBe("Continue straight");
    expect(formatDirection("continue onto Park Rd")).toBe("Continue on park rd");
  });

  it("formats roundabout and rotary", () => {
    expect(formatDirection("roundabout left")).toBe("Enter roundabout, take exit left");
    expect(formatDirection("roundabout right onto Exit")).toBe("Enter roundabout, take exit right onto exit");
    expect(formatDirection("rotary left")).toBe("Enter roundabout, take exit left");
    expect(formatDirection("rotary right onto Highway")).toBe("Enter roundabout, take exit right onto highway");
  });

  it("formats notification as continue", () => {
    expect(formatDirection("notification")).toBe("Continue straight");
    expect(formatDirection("notification onto Path")).toBe("Continue on path");
  });

  it("formats fork", () => {
    expect(formatDirection("fork left")).toBe("Take the left fork");
    expect(formatDirection("fork right onto Path")).toBe("Take the right fork onto path");
  });

  it("handles empty or whitespace", () => {
    expect(formatDirection("")).toBe("");
    expect(formatDirection("  turn left  ")).toBe("Turn left");
  });

  it("handles unknown instruction by capitalizing", () => {
    expect(formatDirection("custom instruction")).toBe("Custom instruction");
  });

  it("handles merge", () => {
    expect(formatDirection("merge left onto Rd")).toBe("Turn left onto rd");
  });
});

describe("formatDistanceForStep", () => {
  it('returns "Now" for 0 or very small', () => {
    expect(formatDistanceForStep(0)).toBe("Now");
    expect(formatDistanceForStep(5)).toBe("Now");
    expect(formatDistanceForStep(9)).toBe("Now");
  });

  it("formats meters under 1km", () => {
    expect(formatDistanceForStep(50)).toBe("In 50 m");
    expect(formatDistanceForStep(150)).toBe("In 150 m");
    expect(formatDistanceForStep(999)).toBe("In 999 m");
  });

  it("formats kilometers", () => {
    expect(formatDistanceForStep(1000)).toBe("In 1.0 km");
    expect(formatDistanceForStep(1500)).toBe("In 1.5 km");
    expect(formatDistanceForStep(2500)).toBe("In 2.5 km");
  });

  it("handles edge NaN and undefined-like", () => {
    expect(formatDistanceForStep(NaN)).toBe("Now");
    expect(formatDistanceForStep(undefined as unknown as number)).toBe("Now");
  });

  it("rounds meters", () => {
    expect(formatDistanceForStep(123.7)).toBe("In 124 m");
    expect(formatDistanceForStep(99.2)).toBe("In 99 m");
  });

  it("formats imperial when useImperial true", () => {
    expect(formatDistanceForStep(100, true)).toBe("In 328 ft");
    expect(formatDistanceForStep(500, true)).toBe("In 1640 ft");
    expect(formatDistanceForStep(1609, true)).toBe("In 1.0 mi");
    expect(formatDistanceForStep(3218, true)).toBe("In 2.0 mi");
  });
});
