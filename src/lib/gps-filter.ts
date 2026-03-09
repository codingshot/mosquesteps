/**
 * GPS position smoothing using a simple Kalman-inspired filter.
 * Reduces GPS jitter for walking-pace navigation while preserving responsiveness.
 * Also provides location confidence scoring and stale position detection.
 */

import { getPositionHistorySize } from "@/lib/battery-manager";

export interface SmoothedPosition {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  confidence: "high" | "medium" | "low";
  timestamp: number;
  isStale: boolean;
}

export class GPSFilter {
  private lat = 0;
  private lng = 0;
  private accuracy = 999;
  private variance = 1; // position uncertainty (degrees²)
  private lastUpdate = 0;
  private speed: number | null = null;
  private heading: number | null = null;
  private initialized = false;
  private positionHistory: Array<{ lat: number; lng: number; timestamp: number }> = [];

  /** Process noise — how much we expect position to change between readings.
   *  Higher = more responsive but noisier. Tuned for walking (~1.4 m/s). */
  private readonly PROCESS_NOISE = 0.000001; // ~0.11m² at equator

  /** Stale threshold — position older than this is considered stale */
  private readonly STALE_MS = 10000;

  /** Maximum accuracy to accept (meters). Worse readings are down-weighted. */
  private readonly MAX_USEFUL_ACCURACY = 50;

  update(lat: number, lng: number, accuracy: number, speed?: number | null, heading?: number | null): SmoothedPosition {
    const now = Date.now();

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(accuracy)) {
      return this.getPosition();
    }

    // Convert accuracy (meters) to approximate degrees² variance
    // 1 degree ≈ 111,000m, so accuracy in degrees = accuracy/111000
    const measurementVariance = Math.pow(Math.max(accuracy, 1) / 111000, 2);

    if (!this.initialized) {
      this.lat = lat;
      this.lng = lng;
      this.accuracy = accuracy;
      this.variance = measurementVariance;
      this.lastUpdate = now;
      this.initialized = true;
    } else {
      // Time-based process noise increase
      const dt = Math.min(now - this.lastUpdate, 30000); // cap at 30s
      const processNoise = this.PROCESS_NOISE * (dt / 1000);
      this.variance += processNoise;

      // Kalman gain: how much to trust the new measurement vs prediction
      const K = this.variance / (this.variance + measurementVariance);

      // Update position
      this.lat = this.lat + K * (lat - this.lat);
      this.lng = this.lng + K * (lng - this.lng);

      // Update variance
      this.variance = (1 - K) * this.variance;

      // Weighted accuracy update
      this.accuracy = this.accuracy + K * (accuracy - this.accuracy);
      this.lastUpdate = now;
      
      // Store in position history for battery-aware optimization
      this.positionHistory.push({ lat: this.lat, lng: this.lng, timestamp: now });
      const maxHistory = getPositionHistorySize();
      if (this.positionHistory.length > maxHistory) {
        this.positionHistory = this.positionHistory.slice(-maxHistory);
      }
    }

    // Store speed and heading from GPS if available
    if (speed != null && Number.isFinite(speed) && speed >= 0) {
      this.speed = speed;
    }
    if (heading != null && Number.isFinite(heading)) {
      this.heading = heading;
    }

    return this.getPosition();
  }

  getPosition(): SmoothedPosition {
    const now = Date.now();
    const age = now - this.lastUpdate;

    return {
      lat: this.lat,
      lng: this.lng,
      accuracy: Math.round(this.accuracy * 10) / 10,
      speed: this.speed,
      heading: this.heading,
      confidence: this.getConfidence(),
      timestamp: this.lastUpdate,
      isStale: age > this.STALE_MS,
    };
  }

  private getConfidence(): "high" | "medium" | "low" {
    if (!this.initialized) return "low";
    const age = Date.now() - this.lastUpdate;
    if (age > this.STALE_MS) return "low";
    if (this.accuracy <= 10 && age < 3000) return "high";
    if (this.accuracy <= this.MAX_USEFUL_ACCURACY && age < 6000) return "medium";
    return "low";
  }

  /** Reset filter state */
  reset() {
    this.lat = 0;
    this.lng = 0;
    this.accuracy = 999;
    this.variance = 1;
    this.lastUpdate = 0;
    this.speed = null;
    this.heading = null;
    this.initialized = false;
    this.positionHistory = [];
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Batch GPS position updates to reduce React re-renders.
 * Collects positions and emits at a fixed rate.
 */
export class PositionBatcher {
  private pending: { lat: number; lng: number; accuracy: number; speed: number | null; heading: number | null } | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private callback: (pos: { lat: number; lng: number; accuracy: number; speed: number | null; heading: number | null }) => void;
  private readonly intervalMs: number;

  constructor(
    callback: (pos: { lat: number; lng: number; accuracy: number; speed: number | null; heading: number | null }) => void,
    intervalMs = 500
  ) {
    this.callback = callback;
    this.intervalMs = intervalMs;
  }

  push(lat: number, lng: number, accuracy: number, speed: number | null, heading: number | null) {
    this.pending = { lat, lng, accuracy, speed, heading };
    if (!this.timer) {
      this.timer = setInterval(() => this.flush(), this.intervalMs);
      // Emit first position immediately
      this.flush();
    }
  }

  private flush() {
    if (this.pending) {
      this.callback(this.pending);
      this.pending = null;
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.pending = null;
  }
}
