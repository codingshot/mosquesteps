/**
 * GPS-Step cross-validation and arrival detection.
 * Validates sensor step counts against GPS distance to filter phantom steps,
 * and detects mosque arrival for auto-checkin prompts.
 */

import { haversineKm } from "@/lib/geo-utils";

/** Validate step count against GPS distance. Returns corrected step count. */
export function validateStepsAgainstGPS(
  sensorSteps: number,
  gpsDistanceKm: number,
  strideLength = 0.77 // meters
): { correctedSteps: number; confidence: "high" | "medium" | "low"; driftPercent: number } {
  if (gpsDistanceKm <= 0.005 || sensorSteps <= 0) {
    return { correctedSteps: sensorSteps, confidence: "low", driftPercent: 0 };
  }

  const expectedSteps = Math.round((gpsDistanceKm * 1000) / strideLength);
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

/** Adaptive ETA using exponential moving average of pace */
export class PaceTracker {
  private samples: { time: number; distanceKm: number }[] = [];
  private emaSpeedKmH = 0;
  private readonly alpha = 0.3;

  addSample(distanceKm: number) {
    const now = Date.now();
    this.samples.push({ time: now, distanceKm });

    // Keep last 60 seconds of samples
    const cutoff = now - 60000;
    this.samples = this.samples.filter(s => s.time >= cutoff);

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

  /** Estimate minutes to destination */
  getETAMinutes(remainingKm: number, fallbackSpeed = 5): number {
    const speed = this.getSpeedKmH(fallbackSpeed);
    return speed > 0 ? Math.round((remainingKm / speed) * 60) : 0;
  }

  reset() {
    this.samples = [];
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
