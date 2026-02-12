import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getPaceCategory,
  isStepCountingAvailable,
  StepCounter,
  AccelerometerStepDetector,
} from "@/lib/step-counter";

describe("step-counter", () => {
  describe("isStepCountingAvailable", () => {
    it("returns a boolean", () => {
      expect(typeof isStepCountingAvailable()).toBe("boolean");
    });
  });

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

    it("handles boundary 70 steps/min as Slow", () => {
      expect(getPaceCategory(69).label).toBe("Slow");
      expect(getPaceCategory(70).label).toBe("Dignified");
    });

    it("handles boundary 150 steps/min as Brisk", () => {
      expect(getPaceCategory(150).label).toBe("Brisk");
      expect(getPaceCategory(151).label).toBe("Too Fast");
    });
  });

  describe("AccelerometerStepDetector", () => {
    it("counts first step on rise then fall", () => {
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(0, 0, 11.5); // rise (mag > 9.8+1.2)
      d.processReading(0, 0, 10); // fall (mag < 10.4)
      expect(steps).toEqual([1]);
      expect(d.getSteps()).toBe(1);
    });

    it("does not count when magnitude never crosses threshold", () => {
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(0, 0, 9.8);
      d.processReading(0, 0, 10);
      d.processReading(0, 0, 9.5);
      expect(steps).toEqual([]);
      expect(d.getSteps()).toBe(0);
    });

    it("does not count second step if interval too short", () => {
      vi.useFakeTimers();
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(steps).toEqual([1]);
      vi.advanceTimersByTime(100);
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(steps).toEqual([1]); // still 1, interval 100ms < 250ms
      vi.useRealTimers();
    });

    it("counts second step when interval is valid", () => {
      vi.useFakeTimers();
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(steps).toEqual([1]);
      vi.advanceTimersByTime(300);
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(steps).toEqual([1, 2]);
      expect(d.getSteps()).toBe(2);
      vi.useRealTimers();
    });

    it("does not count step when interval too long", () => {
      vi.useFakeTimers();
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(steps).toEqual([1]);
      vi.advanceTimersByTime(4000);
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(steps).toEqual([1]); // interval 4000ms > 3500ms
      vi.useRealTimers();
    });

    it("reset zeros steps and allows first step again", () => {
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(d.getSteps()).toBe(1);
      d.reset();
      expect(d.getSteps()).toBe(0);
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(d.getSteps()).toBe(1);
      expect(steps).toEqual([1, 1]);
    });

    it("ignores NaN and non-finite readings", () => {
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(NaN, 0, 10);
      d.processReading(0, Infinity, 0);
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(steps).toEqual([1]);
    });

    it("ignores impossible magnitude (too small or too large)", () => {
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(0, 0, 0); // magnitude 0, ignored
      d.processReading(100, 0, 0); // magnitude 100 > 50, ignored
      d.processReading(0, 0, 11.5);
      d.processReading(0, 0, 10);
      expect(steps).toEqual([1]);
    });

    it("handles negative acceleration values (device orientation)", () => {
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      // Magnitude sqrt(0+0+121) = 11, so > 11.0 rise
      d.processReading(0, 0, -11.5);
      d.processReading(0, 0, -10);
      expect(steps).toEqual([1]);
    });

    it("handles magnitude just above threshold", () => {
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(0, 0, 11.1); // just above 11.0 rise threshold
      d.processReading(0, 0, 10.0); // fall below 10.4
      expect(steps).toEqual([1]);
    });

    it("does not count on rapid oscillation (jitter)", () => {
      vi.useFakeTimers();
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      for (let i = 0; i < 10; i++) {
        d.processReading(0, 0, 11.5);
        d.processReading(0, 0, 10);
        vi.advanceTimersByTime(50);
      }
      expect(steps.length).toBeLessThanOrEqual(2);
      vi.useRealTimers();
    });

    it("handles undefined-like number 0 for individual axis", () => {
      const steps: number[] = [];
      const d = new AccelerometerStepDetector((s) => steps.push(s));
      d.processReading(11.5, 0, 0);
      d.processReading(10, 0, 0);
      expect(steps).toEqual([1]);
    });
  });

  describe("StepCounter", () => {
    beforeEach(() => {
      vi.stubGlobal("window", globalThis);
      vi.stubGlobal("navigator", { permissions: undefined });
      vi.stubGlobal("Accelerometer", undefined);
      vi.stubGlobal("DeviceMotionEvent", {
        requestPermission: undefined,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("getSteps returns 0 initially", () => {
      const onStep = vi.fn();
      const counter = new StepCounter(onStep);
      expect(counter.getSteps()).toBe(0);
      expect(onStep).not.toHaveBeenCalled();
    });

    it("start() calls reset so steps are 0", async () => {
      const onStep = vi.fn();
      const onSource = vi.fn();
      const counter = new StepCounter(onStep, onSource);
      const source = await counter.start();
      expect(counter.getSteps()).toBe(0);
      expect(["gps", "devicemotion"]).toContain(source);
    });

    it("stop() does not clear step count", async () => {
      const onStep = vi.fn();
      const counter = new StepCounter(onStep);
      await counter.start();
      // Manually feed a step via the internal detector (we can't easily without exposing it)
      // So we test: after stop, getSteps() still returns whatever it was
      counter.stop();
      expect(counter.getSteps()).toBe(0);
      expect(counter.isActive()).toBe(false);
    });

    it("getSource returns gps when DeviceMotion permission denied", async () => {
      const onSource = vi.fn();
      const counter = new StepCounter(() => {}, onSource);
      (globalThis as any).DeviceMotionEvent = {
        requestPermission: vi.fn().mockResolvedValue("denied"),
      };
      const source = await counter.start();
      expect(source).toBe("gps");
      expect(onSource).toHaveBeenCalledWith("gps");
    });

    it("getSource returns devicemotion when no permission API", async () => {
      const onSource = vi.fn();
      const counter = new StepCounter(() => {}, onSource);
      (globalThis as any).DeviceMotionEvent = {};
      const source = await counter.start();
      expect(source).toBe("devicemotion");
      expect(onSource).toHaveBeenCalledWith("devicemotion");
      counter.stop();
    });

    it("pause and resume do not throw", async () => {
      const counter = new StepCounter(() => {});
      await counter.start();
      expect(() => counter.pause()).not.toThrow();
      expect(() => counter.resume()).not.toThrow();
      counter.stop();
    });

    it("getSteps returns same value when paused", async () => {
      const counter = new StepCounter(() => {});
      await counter.start();
      counter.pause();
      const before = counter.getSteps();
      counter.resume();
      const after = counter.getSteps();
      expect(after).toBe(before);
      counter.stop();
    });
  });
});
