import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateStepsAgainstGPS,
  createArrivalDetector,
  PaceTracker,
  getCheckInStreak,
} from "@/lib/step-validator";

describe("validateStepsAgainstGPS", () => {
  it("returns high confidence when steps match GPS within 25%", () => {
    // 1km walk, stride 0.77m → ~1299 expected steps
    const result = validateStepsAgainstGPS(1300, 1.0, 0.77);
    expect(result.confidence).toBe("high");
    expect(result.correctedSteps).toBe(1300);
    expect(result.driftPercent).toBeLessThan(25);
  });

  it("blends steps when drift is 25-50%", () => {
    // 1km walk → ~1299 expected, but sensor says 1800 (38% over)
    const result = validateStepsAgainstGPS(1800, 1.0, 0.77);
    expect(result.confidence).toBe("medium");
    expect(result.correctedSteps).toBeLessThan(1800);
    expect(result.correctedSteps).toBeGreaterThan(1299);
  });

  it("uses GPS estimate when drift exceeds 50%", () => {
    // 1km walk → ~1299 expected, but sensor says 3000 (>2x)
    const result = validateStepsAgainstGPS(3000, 1.0, 0.77);
    expect(result.confidence).toBe("low");
    expect(result.correctedSteps).toBe(1299);
  });

  it("returns low confidence for tiny GPS distance", () => {
    const result = validateStepsAgainstGPS(50, 0.002);
    expect(result.confidence).toBe("low");
    expect(result.correctedSteps).toBe(50);
  });

  it("handles zero sensor steps", () => {
    const result = validateStepsAgainstGPS(0, 1.0);
    expect(result.correctedSteps).toBe(0);
  });

  it("handles custom stride length", () => {
    const result = validateStepsAgainstGPS(1000, 1.0, 1.0);
    // 1km / 1m stride = 1000 expected → exact match
    expect(result.confidence).toBe("high");
    expect(result.driftPercent).toBe(0);
  });
});

describe("createArrivalDetector", () => {
  it("starts in walking state", () => {
    const detector = createArrivalDetector();
    expect(detector.getState()).toBe("walking");
  });

  it("transitions to approaching within 200m", () => {
    const detector = createArrivalDetector();
    // ~150m away (0.0015 degrees ≈ 167m at equator)
    const state = detector.update(0, 0, 0.0013, 0);
    expect(state).toBe("approaching");
  });

  it("transitions to arrived after dwell time within 75m", () => {
    vi.useFakeTimers();
    const detector = createArrivalDetector({ dwellTimeMs: 5000 });

    // Enter arrival zone
    detector.update(0, 0, 0.0005, 0); // ~55m
    expect(detector.getState()).toBe("approaching"); // not yet dwelled

    vi.advanceTimersByTime(6000);
    detector.update(0, 0, 0.0005, 0);
    expect(detector.getState()).toBe("arrived");

    vi.useRealTimers();
  });

  it("resets when moving away from mosque", () => {
    const detector = createArrivalDetector();
    detector.update(0, 0, 0.001, 0); // approaching
    expect(detector.getState()).toBe("approaching");
    detector.update(0, 0, 0.01, 0); // far away
    expect(detector.getState()).toBe("walking");
  });

  it("stays checked_in after marking", () => {
    vi.useFakeTimers();
    const detector = createArrivalDetector({ dwellTimeMs: 0 });
    detector.update(0, 0, 0.0003, 0); // very close
    vi.advanceTimersByTime(100);
    detector.update(0, 0, 0.0003, 0);
    detector.markCheckedIn();
    expect(detector.getState()).toBe("checked_in");
    // Moving away shouldn't change state
    detector.update(0, 0, 1, 0);
    expect(detector.getState()).toBe("checked_in");
    vi.useRealTimers();
  });

  it("reports distance in meters", () => {
    const detector = createArrivalDetector();
    detector.update(0, 0, 0.001, 0);
    expect(detector.getDistanceM()).toBeGreaterThan(50);
    expect(detector.getDistanceM()).toBeLessThan(200);
  });

  it("reset returns to walking", () => {
    const detector = createArrivalDetector();
    detector.update(0, 0, 0.001, 0);
    detector.reset();
    expect(detector.getState()).toBe("walking");
  });
});

describe("PaceTracker", () => {
  it("returns fallback speed with no samples", () => {
    const tracker = new PaceTracker();
    expect(tracker.getSpeedKmH(5)).toBe(5);
    expect(tracker.getETAMinutes(2.5, 5)).toBe(30);
  });

  it("calculates ETA from samples", () => {
    vi.useFakeTimers();
    const tracker = new PaceTracker();

    tracker.addSample(0);
    vi.advanceTimersByTime(30000); // 30 seconds
    tracker.addSample(0.25); // 0.25 km in 30s = 30 km/h... unrealistic but tests math

    const speed = tracker.getSpeedKmH();
    expect(speed).toBeGreaterThan(0.5);

    const eta = tracker.getETAMinutes(1.0);
    expect(eta).toBeGreaterThan(0);
    expect(Number.isFinite(eta)).toBe(true);

    vi.useRealTimers();
  });

  it("reset clears state", () => {
    const tracker = new PaceTracker();
    tracker.addSample(1.0);
    tracker.reset();
    expect(tracker.getSpeedKmH(5)).toBe(5);
  });
});

describe("getCheckInStreak", () => {
  it("returns 0 for empty dates", () => {
    expect(getCheckInStreak([])).toBe(0);
  });

  it("returns 1 for today only", () => {
    const today = new Date().toISOString();
    expect(getCheckInStreak([today])).toBe(1);
  });

  it("counts consecutive days", () => {
    const dates = [
      new Date().toISOString(),
      new Date(Date.now() - 86400000).toISOString(),
      new Date(Date.now() - 86400000 * 2).toISOString(),
    ];
    expect(getCheckInStreak(dates)).toBe(3);
  });

  it("breaks streak on gap", () => {
    const dates = [
      new Date().toISOString(),
      new Date(Date.now() - 86400000).toISOString(),
      // skip a day
      new Date(Date.now() - 86400000 * 3).toISOString(),
    ];
    expect(getCheckInStreak(dates)).toBe(2);
  });

  it("returns 0 if most recent is older than yesterday", () => {
    const dates = [new Date(Date.now() - 86400000 * 3).toISOString()];
    expect(getCheckInStreak(dates)).toBe(0);
  });

  it("deduplicates same-day entries", () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(getCheckInStreak([today, today, today, yesterday, yesterday])).toBe(2);
  });
});
