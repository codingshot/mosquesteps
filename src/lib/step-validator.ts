/**
 * GPS-Step cross-validation and arrival detection.
 * Validates sensor step counts against GPS distance to filter phantom steps,
 * and detects mosque arrival for auto-checkin prompts.
 * Includes adaptive stride length learning from walk history.
 */

import { haversineKm } from "@/lib/geo-utils";

// ── Adaptive stride length learning ──

const STRIDE_KEY = "mosquesteps_learned_stride";
const MIN_STRIDE = 0.4;
const MAX_STRIDE = 1.2;

/** Load the user's learned stride length (metres). Falls back to default. */
export function getLearnedStride(fallback = 0.77): number {
  try {
    const v = parseFloat(localStorage.getItem(STRIDE_KEY) || "");
    return Number.isFinite(v) && v >= MIN_STRIDE && v <= MAX_STRIDE ? v : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Record a stride observation after a walk.
 * Uses an exponential moving average so recent walks count more.
 */
export function recordStrideObservation(distanceKm: number, steps: number): void {
  if (steps < 50 || distanceKm < 0.03) return; // too short to learn from
  const observed = (distanceKm * 1000) / steps;
  if (observed < MIN_STRIDE || observed > MAX_STRIDE) return; // outlier

  const current = getLearnedStride();
  const alpha = 0.3; // learning rate
  const updated = current * (1 - alpha) + observed * alpha;
  try {
    localStorage.setItem(STRIDE_KEY, updated.toFixed(4));
  } catch {}
}

/** Validate step count against GPS distance. Returns corrected step count. */
export function validateStepsAgainstGPS(
  sensorSteps: number,
  gpsDistanceKm: number,
  strideLength?: number
): { correctedSteps: number; confidence: "high" | "medium" | "low"; driftPercent: number } {
  const stride = strideLength ?? getLearnedStride();

  if (gpsDistanceKm <= 0.005 || sensorSteps <= 0) {
    return { correctedSteps: sensorSteps, confidence: "low", driftPercent: 0 };
  }

  const expectedSteps = Math.round((gpsDistanceKm * 1000) / stride);
  if (expectedSteps <= 0) {
    return { correctedSteps: sensorSteps, confidence: "low", driftPercent: 0 };
  }

  const ratio = sensorSteps / expectedSteps;
  const driftPercent = Math.round(Math.abs(1 - ratio) * 100);

  // Within 25%: high confidence, trust sensor
  if (ratio >= 0.75 && ratio <= 1.25) {
    return { correctedSteps: sensorSteps, confidence: "high", driftPercent };
  }

  // Within 50%: medium confidence, blend sensor + GPS estimate
  if (ratio >= 0.5 && ratio <= 1.5) {
    const blended = Math.round(sensorSteps * 0.7 + expectedSteps * 0.3);
    return { correctedSteps: blended, confidence: "medium", driftPercent };
  }

  // Beyond 50% drift: low confidence, prefer GPS estimate
  return { correctedSteps: expectedSteps, confidence: "low", driftPercent };
}

/** Arrival detection state machine */
export type ArrivalState = "walking" | "approaching" | "arrived" | "checked_in";

export interface ArrivalDetector {
  update(userLat: number, userLng: number, mosqueLat: number, mosqueLng: number): ArrivalState;
  getState(): ArrivalState;
  getDistanceM(): number;
  markCheckedIn(): void;
  reset(): void;
}

export function createArrivalDetector(options?: {
  approachRadiusM?: number;
  arrivalRadiusM?: number;
  dwellTimeMs?: number;
}): ArrivalDetector {
  const APPROACH_M = options?.approachRadiusM ?? 200;
  const ARRIVAL_M = options?.arrivalRadiusM ?? 75;
  const DWELL_MS = options?.dwellTimeMs ?? 10000; // 10s dwell to confirm arrival

  let state: ArrivalState = "walking";
  let distanceM = Infinity;
  let enteredArrivalZoneAt = 0;

  return {
    update(userLat, userLng, mosqueLat, mosqueLng) {
      distanceM = haversineKm(userLat, userLng, mosqueLat, mosqueLng) * 1000;

      if (state === "checked_in") return state;

      if (distanceM <= ARRIVAL_M) {
        if (state !== "arrived") {
          if (enteredArrivalZoneAt === 0) {
            enteredArrivalZoneAt = Date.now();
          }
          // Require dwelling in arrival zone to avoid GPS bounce false positives
          if (Date.now() - enteredArrivalZoneAt >= DWELL_MS) {
            state = "arrived";
          } else {
            state = "approaching";
          }
        }
      } else if (distanceM <= APPROACH_M) {
        if (state === "walking") state = "approaching";
        enteredArrivalZoneAt = 0;
      } else {
        state = "walking";
        enteredArrivalZoneAt = 0;
      }

      return state;
    },
    getState: () => state,
    getDistanceM: () => Math.round(distanceM),
    markCheckedIn() { state = "checked_in"; },
    reset() { state = "walking"; distanceM = Infinity; enteredArrivalZoneAt = 0; },
  };
}

/** Adaptive ETA using exponential moving average of pace with dual windows */
export class PaceTracker {
  private samples: { time: number; distanceKm: number }[] = [];
  private emaSpeedKmH = 0;
  private readonly alpha = 0.3;
  /** Longer-term average for better ETA on long walks */
  private longTermSamples: { time: number; distanceKm: number }[] = [];

  addSample(distanceKm: number) {
    const now = Date.now();
    this.samples.push({ time: now, distanceKm });
    this.longTermSamples.push({ time: now, distanceKm });

    // Short window: last 60 seconds (responsive to speed changes)
    const cutoff = now - 60000;
    this.samples = this.samples.filter(s => s.time >= cutoff);

    // Long window: last 5 minutes (stable for ETA)
    const longCutoff = now - 300000;
    this.longTermSamples = this.longTermSamples.filter(s => s.time >= longCutoff);

    if (this.samples.length >= 2) {
      const first = this.samples[0];
      const last = this.samples[this.samples.length - 1];
      const dtHours = (last.time - first.time) / 3600000;
      const dDist = last.distanceKm - first.distanceKm;
      if (dtHours > 0 && dDist >= 0) {
        const instantSpeed = dDist / dtHours;
        this.emaSpeedKmH = this.emaSpeedKmH === 0
          ? instantSpeed
          : this.emaSpeedKmH * (1 - this.alpha) + instantSpeed * this.alpha;
      }
    }
  }

  /** Get smoothed speed in km/h. Falls back to provided default. */
  getSpeedKmH(fallback = 5): number {
    return this.emaSpeedKmH > 0.5 ? this.emaSpeedKmH : fallback;
  }

  /** Estimate minutes to destination using blended short+long term speed */
  getETAMinutes(remainingKm: number, fallbackSpeed = 5): number {
    // Blend short-term (responsive) and long-term (stable) for better ETA
    let speed = this.getSpeedKmH(fallbackSpeed);

    if (this.longTermSamples.length >= 3) {
      const first = this.longTermSamples[0];
      const last = this.longTermSamples[this.longTermSamples.length - 1];
      const dtH = (last.time - first.time) / 3600000;
      const dD = last.distanceKm - first.distanceKm;
      if (dtH > 0 && dD >= 0) {
        const longSpeed = dD / dtH;
        if (longSpeed > 0.5) {
          // 60% long-term, 40% short-term for stable ETA
          speed = longSpeed * 0.6 + speed * 0.4;
        }
      }
    }

    return speed > 0 ? Math.round((remainingKm / speed) * 60) : 0;
  }

  reset() {
    this.samples = [];
    this.longTermSamples = [];
    this.emaSpeedKmH = 0;
  }
}

/** Check-in streak calculation */
export function getCheckInStreak(checkInDates: string[]): number {
  if (checkInDates.length === 0) return 0;

  // Normalize to unique dates (YYYY-MM-DD)
  const uniqueDates = [...new Set(checkInDates.map(d => d.split("T")[0]))].sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Streak must include today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
