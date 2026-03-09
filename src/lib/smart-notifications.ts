/**
 * Smart Notification Engine — context-aware prayer reminders.
 * Adapts "time-to-leave" alerts based on GPS distance, learned habits,
 * weather conditions, and battery state.
 *
 * Performance: results are memoised per prayer+minute to avoid redundant work.
 * Battery: polling cadence is adapted via battery-manager.
 */

import { fetchWeather, type WeatherCondition } from "@/lib/weather";
import { getBatteryState, getNotificationPollInterval, shouldPollNotifications } from "@/lib/battery-manager";

// ── Types ──

export interface SmartAlert {
  prayerName: string;
  leaveAt: Date;
  urgency: "normal" | "important" | "urgent";
  message: string;
  bufferMinutes: number;
  weatherAdjusted: boolean;
  confidence: number; // 0-1
}

interface WalkingPattern {
  prayerName: string;
  durationMin: number;
  timestamp: number;
}

// ── Storage keys ──

const PATTERNS_KEY = "mosquesteps_walk_patterns";
const ALERTS_CACHE_KEY = "mosquesteps_smart_alerts_cache";
const MAX_PATTERNS = 50;

// ── Pattern learning ──

function getPatterns(): WalkingPattern[] {
  try {
    return JSON.parse(localStorage.getItem(PATTERNS_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePatterns(patterns: WalkingPattern[]): void {
  // Keep only the latest MAX_PATTERNS entries
  const trimmed = patterns.slice(-MAX_PATTERNS);
  localStorage.setItem(PATTERNS_KEY, JSON.stringify(trimmed));
}

/** Record a completed walk for future prediction. */
export function recordWalkingPattern(prayerName: string, durationMin: number): void {
  if (!Number.isFinite(durationMin) || durationMin <= 0) return;
  const patterns = getPatterns();
  patterns.push({ prayerName, durationMin, timestamp: Date.now() });
  savePatterns(patterns);
}

/** Get learned median duration for a prayer, or null if insufficient data. */
function getLearnedDuration(prayerName: string): number | null {
  const patterns = getPatterns().filter((p) => p.prayerName === prayerName);
  if (patterns.length < 3) return null;
  // Use recent patterns only (last 30 days)
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = patterns.filter((p) => p.timestamp > cutoff);
  if (recent.length < 2) return null;
  const sorted = recent.map((p) => p.durationMin).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// ── Memoisation cache ──

interface CachedAlert {
  key: string;
  alert: SmartAlert;
  expiresAt: number;
}

let alertCache: Map<string, CachedAlert> = new Map();

function makeCacheKey(prayerName: string, prayerTimeStr: string, minuteNow: number): string {
  return `${prayerName}:${prayerTimeStr}:${minuteNow}`;
}

function getCachedAlert(key: string): SmartAlert | null {
  const entry = alertCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    alertCache.delete(key);
    return null;
  }
  return entry.alert;
}

function setCachedAlert(key: string, alert: SmartAlert): void {
  // Cache for 60 seconds
  alertCache.set(key, { key, alert, expiresAt: Date.now() + 60_000 });
  // Prune old entries
  if (alertCache.size > 30) {
    const now = Date.now();
    for (const [k, v] of alertCache) {
      if (v.expiresAt < now) alertCache.delete(k);
    }
  }
}

// ── Weather adjustment ──

function applyWeatherFactor(baseMin: number, weather: WeatherCondition | null): { adjusted: number; wasAdjusted: boolean } {
  if (!weather) return { adjusted: baseMin, wasAdjusted: false };
  const factor = weather.speedFactor ?? 1;
  if (Math.abs(factor - 1) < 0.02) return { adjusted: baseMin, wasAdjusted: false };
  // speedFactor < 1 means slower walking → more time needed
  return { adjusted: Math.round(baseMin / factor), wasAdjusted: true };
}

// ── Core engine ──

export interface CalculateAlertInput {
  prayerName: string;
  prayerTime: string; // "HH:MM"
  estimatedWalkMin: number;
  weather?: WeatherCondition | null;
}

/** Calculate a smart leave-by alert for a single prayer. Results are memoised. */
export function calculateSmartAlert(input: CalculateAlertInput): SmartAlert {
  const now = new Date();
  const minuteNow = now.getHours() * 60 + now.getMinutes();
  const cacheKey = makeCacheKey(input.prayerName, input.prayerTime, minuteNow);

  const cached = getCachedAlert(cacheKey);
  if (cached) return cached;

  const [h, m] = input.prayerTime.split(":").map(Number);
  const prayerDate = new Date(now);
  prayerDate.setHours(h, m, 0, 0);
  if (prayerDate.getTime() <= now.getTime()) {
    prayerDate.setDate(prayerDate.getDate() + 1);
  }

  // Base walking estimate — blend with learned data
  let walkMin = input.estimatedWalkMin;
  let confidence = 0.6;
  const learned = getLearnedDuration(input.prayerName);
  if (learned !== null) {
    walkMin = Math.round(learned * 0.7 + input.estimatedWalkMin * 0.3);
    confidence = 0.85;
  }

  // Weather adjustment
  const { adjusted, wasAdjusted } = applyWeatherFactor(walkMin, input.weather ?? null);
  walkMin = adjusted;

  // Buffer: minimum 5 min, more for lower confidence
  const buffer = Math.max(5, Math.round((1 - confidence) * 15));

  // Leave-by time
  const leaveAt = new Date(prayerDate.getTime() - (walkMin + buffer) * 60_000);
  const minutesUntil = (leaveAt.getTime() - now.getTime()) / 60_000;

  // Urgency
  let urgency: SmartAlert["urgency"] = "normal";
  if (minutesUntil <= 5) urgency = "urgent";
  else if (minutesUntil <= 15) urgency = "important";

  // Message
  let message: string;
  if (urgency === "urgent") {
    message = `Leave now for ${input.prayerName}! ${walkMin} min walk.`;
  } else if (urgency === "important") {
    message = `Prepare to leave for ${input.prayerName} in ${Math.round(minutesUntil)} min.`;
  } else {
    message = `${input.prayerName} in ~${Math.round(minutesUntil + walkMin + buffer)} min. Plan to leave at ${leaveAt.getHours().toString().padStart(2, "0")}:${leaveAt.getMinutes().toString().padStart(2, "0")}.`;
  }

  const alert: SmartAlert = {
    prayerName: input.prayerName,
    leaveAt,
    urgency,
    message,
    bufferMinutes: buffer,
    weatherAdjusted: wasAdjusted,
    confidence,
  };

  setCachedAlert(cacheKey, alert);
  return alert;
}

// ── Batch calculation (Dashboard use) ──

export function calculateAllAlerts(
  prayers: Array<{ name: string; time: string; estimatedWalkMin: number }>,
  weather?: WeatherCondition | null
): SmartAlert[] {
  return prayers.map((p) =>
    calculateSmartAlert({
      prayerName: p.name,
      prayerTime: p.time,
      estimatedWalkMin: p.estimatedWalkMin,
      weather,
    })
  );
}

/** Clear the in-memory alert cache. */
export function clearAlertCache(): void {
  alertCache = new Map();
}
