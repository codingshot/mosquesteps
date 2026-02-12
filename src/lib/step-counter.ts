/**
 * Real step counter using device sensors.
 * Priority: Accelerometer API > DeviceMotionEvent > GPS estimation
 */

type StepCallback = (totalSteps: number) => void;

interface StepCounterState {
  steps: number;
  isActive: boolean;
  source: "accelerometer" | "devicemotion" | "gps" | "none";
}

// Step detection via peak detection on acceleration magnitude (exported for tests)
export class AccelerometerStepDetector {
  private steps = 0;
  private lastMagnitude = 0;
  private lastPeakTime = 0;
  private isRising = false;
  private callback: StepCallback;

  // Tuning parameters for walking accuracy
  private readonly PEAK_THRESHOLD = 1.2;    // m/s² above gravity to count as step
  private readonly MIN_STEP_INTERVAL = 250; // ms between steps (max ~4 steps/sec, prevents double-count)
  private readonly MAX_STEP_INTERVAL = 3500; // ms (allows pauses at crosswalks, ~0.3 steps/sec min)

  constructor(callback: StepCallback) {
    this.callback = callback;
  }

  processReading(x: number, y: number, z: number) {
    const nx = Number(x);
    const ny = Number(y);
    const nz = Number(z);
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) return;
    const magnitude = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (!Number.isFinite(magnitude) || magnitude < 1 || magnitude > 50) return; // ignore impossible values
    const now = Date.now();

    // Peak detection: detect when acceleration crosses threshold going up then down
    if (magnitude > 9.8 + this.PEAK_THRESHOLD) {
      if (!this.isRising) {
        this.isRising = true;
      }
    } else if (this.isRising && magnitude < 9.8 + this.PEAK_THRESHOLD * 0.5) {
      this.isRising = false;
      const timeSinceLastPeak = this.lastPeakTime ? now - this.lastPeakTime : this.MIN_STEP_INTERVAL + 1;
      const isFirstStep = this.lastPeakTime === 0;
      const validInterval = isFirstStep || (timeSinceLastPeak > this.MIN_STEP_INTERVAL && timeSinceLastPeak < this.MAX_STEP_INTERVAL);
      if (validInterval) {
        this.steps++;
        this.callback(this.steps);
      }
      this.lastPeakTime = now;
    }

    this.lastMagnitude = magnitude;
  }

  reset() {
    this.steps = 0;
    this.lastMagnitude = 0;
    this.lastPeakTime = 0;
    this.isRising = false;
  }

  getSteps() {
    return this.steps;
  }
}

export class StepCounter {
  private detector: AccelerometerStepDetector;
  private accelerometer: any = null;
  private deviceMotionHandler: ((e: DeviceMotionEvent) => void) | null = null;
  private state: StepCounterState = { steps: 0, isActive: false, source: "none" };
  private onStep: StepCallback;
  private onSourceChange: ((source: string) => void) | null = null;
  private paused = false;

  constructor(onStep: StepCallback, onSourceChange?: (source: string) => void) {
    this.onStep = onStep;
    this.onSourceChange = onSourceChange || null;
    this.detector = new AccelerometerStepDetector((steps) => {
      this.state.steps = steps;
      this.onStep(steps);
    });
  }

  async start(): Promise<string> {
    this.detector.reset();
    this.state.isActive = true;

    // Try Accelerometer API first (Chrome on Android, some desktops)
    if (typeof (window as any).Accelerometer !== "undefined") {
      try {
        // Request permission if needed
        if (typeof (navigator as any).permissions !== "undefined") {
          try {
            const result = await (navigator as any).permissions.query({ name: "accelerometer" as any });
            if (result.state === "denied") {
              throw new Error("Permission denied");
            }
          } catch {
            // Permission API might not support accelerometer query, continue anyway
          }
        }

        const accel = new (window as any).Accelerometer({ frequency: 30 });
        accel.addEventListener("reading", () => {
          if (!this.paused) {
            this.detector.processReading(accel.x || 0, accel.y || 0, accel.z || 0);
          }
        });
        accel.addEventListener("error", (e: any) => {
          console.warn("Accelerometer error, falling back:", e.error);
          accel.stop();
          this.startDeviceMotion();
        });
        accel.start();
        this.accelerometer = accel;
        this.state.source = "accelerometer";
        this.onSourceChange?.("accelerometer");
        return "accelerometer";
      } catch (e) {
        console.warn("Accelerometer API failed, trying DeviceMotion:", e);
      }
    }

    // Fallback: DeviceMotionEvent (iOS Safari, older Android)
    return this.startDeviceMotion();
  }

  private async startDeviceMotion(): Promise<string> {
    // iOS 13+ requires permission
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== "granted") {
          this.state.source = "gps";
          this.onSourceChange?.("gps");
          return "gps";
        }
      } catch {
        this.state.source = "gps";
        this.onSourceChange?.("gps");
        return "gps";
      }
    }

    this.deviceMotionHandler = (event: DeviceMotionEvent) => {
      if (this.paused) return;
      const accel = event.accelerationIncludingGravity;
      if (accel && accel.x !== null && accel.y !== null && accel.z !== null) {
        this.detector.processReading(accel.x, accel.y, accel.z);
      }
    };

    window.addEventListener("devicemotion", this.deviceMotionHandler);
    this.state.source = "devicemotion";
    this.onSourceChange?.("devicemotion");
    return "devicemotion";
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  stop() {
    this.state.isActive = false;
    this.paused = false;

    if (this.accelerometer) {
      try { this.accelerometer.stop(); } catch {}
      this.accelerometer = null;
    }

    if (this.deviceMotionHandler) {
      window.removeEventListener("devicemotion", this.deviceMotionHandler);
      this.deviceMotionHandler = null;
    }
  }

  getSteps(): number {
    return this.state.steps;
  }

  getSource(): string {
    return this.state.source;
  }

  isActive(): boolean {
    return this.state.isActive;
  }
}

/**
 * Check if real step counting is available on this device
 */
export function isStepCountingAvailable(): boolean {
  return (
    typeof (window as any).Accelerometer !== "undefined" ||
    typeof DeviceMotionEvent !== "undefined"
  );
}

/**
 * Calculate walking pace category
 */
export function getPaceCategory(stepsPerMinute: number): {
  label: string;
  isTooFast: boolean;
  message: string;
  sunnahLink?: string;
} {
  if (stepsPerMinute === 0) {
    return { label: "Stationary", isTooFast: false, message: "Start walking to begin tracking." };
  }
  if (stepsPerMinute < 70) {
    return { label: "Slow", isTooFast: false, message: "Walking at a leisurely pace." };
  }
  if (stepsPerMinute <= 120) {
    return {
      label: "Dignified",
      isTooFast: false,
      message: "Walking with sakina (tranquility) and waqar (dignity) — as taught by the Prophet ﷺ.",
    };
  }
  if (stepsPerMinute <= 150) {
    return {
      label: "Brisk",
      isTooFast: false,
      message: "Good pace. Remember to walk with calmness to the mosque.",
    };
  }
  return {
    label: "Too Fast",
    isTooFast: true,
    message: "Please slow down. The Prophet ﷺ said: 'Come walking tranquilly with solemnity.'",
    sunnahLink: "https://sunnah.com/bukhari:636",
  };
}
