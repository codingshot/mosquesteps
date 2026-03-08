import { describe, it, expect, vi, beforeEach } from "vitest";
import { GPSFilter, PositionBatcher } from "@/lib/gps-filter";

describe("GPSFilter", () => {
  it("returns first position directly", () => {
    const filter = new GPSFilter();
    const pos = filter.update(51.5, -0.1, 10);
    expect(pos.lat).toBeCloseTo(51.5, 4);
    expect(pos.lng).toBeCloseTo(-0.1, 4);
    expect(pos.confidence).not.toBe("low"); // initialized now
  });

  it("smooths noisy readings", () => {
    const filter = new GPSFilter();
    filter.update(51.5000, -0.1000, 10);
    // Simulate jitter
    filter.update(51.5005, -0.1005, 15);
    const pos = filter.update(51.4998, -0.0998, 12);
    // Should be closer to true center than the raw noisy reading
    expect(Math.abs(pos.lat - 51.5)).toBeLessThan(0.001);
    expect(Math.abs(pos.lng - (-0.1))).toBeLessThan(0.001);
  });

  it("trusts high-accuracy readings more", () => {
    const filter = new GPSFilter();
    filter.update(51.5, -0.1, 5); // high accuracy
    const pos = filter.update(51.6, -0.2, 100); // low accuracy big jump
    // Should barely move toward the noisy reading
    expect(Math.abs(pos.lat - 51.5)).toBeLessThan(0.05);
  });

  it("detects stale positions", () => {
    vi.useFakeTimers();
    const filter = new GPSFilter();
    filter.update(51.5, -0.1, 10);
    vi.advanceTimersByTime(15000);
    const pos = filter.getPosition();
    expect(pos.isStale).toBe(true);
    expect(pos.confidence).toBe("low");
    vi.useRealTimers();
  });

  it("reports high confidence for fresh accurate readings", () => {
    const filter = new GPSFilter();
    const pos = filter.update(51.5, -0.1, 5);
    expect(pos.confidence).toBe("high");
  });

  it("reports medium confidence for moderate accuracy", () => {
    const filter = new GPSFilter();
    const pos = filter.update(51.5, -0.1, 30);
    expect(pos.confidence).toBe("medium");
  });

  it("ignores non-finite values", () => {
    const filter = new GPSFilter();
    filter.update(51.5, -0.1, 10);
    const pos = filter.update(NaN, -0.1, 10);
    expect(pos.lat).toBeCloseTo(51.5, 4);
  });

  it("stores speed and heading", () => {
    const filter = new GPSFilter();
    const pos = filter.update(51.5, -0.1, 10, 1.4, 90);
    expect(pos.speed).toBe(1.4);
    expect(pos.heading).toBe(90);
  });

  it("reset clears all state", () => {
    const filter = new GPSFilter();
    filter.update(51.5, -0.1, 10);
    filter.reset();
    expect(filter.isInitialized()).toBe(false);
  });
});

describe("PositionBatcher", () => {
  it("emits first position immediately", () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const batcher = new PositionBatcher(cb, 500);
    batcher.push(51.5, -0.1, 10, null, null);
    expect(cb).toHaveBeenCalledTimes(1);
    batcher.stop();
    vi.useRealTimers();
  });

  it("batches rapid updates", () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const batcher = new PositionBatcher(cb, 500);
    batcher.push(51.5, -0.1, 10, null, null); // immediate
    batcher.push(51.6, -0.2, 15, null, null); // queued
    batcher.push(51.7, -0.3, 20, null, null); // overwrites queued
    expect(cb).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(2);
    // Should have the latest value
    expect(cb).toHaveBeenLastCalledWith({ lat: 51.7, lng: -0.3, accuracy: 20, speed: null, heading: null });
    batcher.stop();
    vi.useRealTimers();
  });

  it("stop clears timer and prevents further emissions", () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const batcher = new PositionBatcher(cb, 500);
    batcher.push(51.5, -0.1, 10, null, null); // immediate emit
    expect(cb).toHaveBeenCalledTimes(1);
    batcher.stop();
    // After stop, pushing should not start a new timer
    vi.advanceTimersByTime(2000);
    expect(cb).toHaveBeenCalledTimes(1); // still just 1
    vi.useRealTimers();
  });
});
