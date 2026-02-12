/**
 * Regional defaults — determines preferred units, time format, etc.
 * based on city name, timezone, or country.
 */

// Countries that use 12-hour clock as primary
const TWELVE_HOUR_COUNTRIES = new Set([
  "us", "usa", "united states", "america",
  "canada", "australia", "philippines",
  "india", "pakistan", "bangladesh", "malaysia",
  "egypt", "colombia", "mexico",
  "saudi arabia", "saudi", "uae", "emirates",
  "jordan", "iraq", "kuwait", "bahrain", "qatar", "oman",
]);

// Countries/regions that use miles
const IMPERIAL_COUNTRIES = new Set([
  "us", "usa", "united states", "america",
  "united kingdom", "uk", "england", "scotland", "wales",
  "myanmar", "liberia",
]);

// Countries that use feet
const FEET_COUNTRIES = new Set([
  "us", "usa", "united states", "america",
  "united kingdom", "uk",
]);

/**
 * Detect region from timezone string (e.g., "America/New_York" → "us")
 */
function regionFromTimezone(tz?: string): string {
  if (!tz) return "";
  const lower = tz.toLowerCase();
  if (lower.startsWith("america/") || lower.includes("us/")) return "us";
  if (lower.startsWith("europe/london") || lower.includes("gb")) return "uk";
  if (lower.startsWith("australia/")) return "australia";
  if (lower.startsWith("asia/kolkata") || lower.startsWith("asia/calcutta")) return "india";
  if (lower.startsWith("asia/karachi")) return "pakistan";
  if (lower.startsWith("asia/riyadh")) return "saudi arabia";
  if (lower.startsWith("asia/dubai")) return "uae";
  if (lower.startsWith("asia/manila")) return "philippines";
  if (lower.startsWith("asia/kuala_lumpur")) return "malaysia";
  if (lower.startsWith("africa/cairo")) return "egypt";
  return "";
}

export interface RegionalDefaults {
  timeFormat: "12h" | "24h";
  distanceUnit: "km" | "mi";
  smallDistanceUnit: "m" | "ft";
  speedUnit: "kmh" | "mph";
}

export function getRegionalDefaults(cityName?: string, timezone?: string): RegionalDefaults {
  const region = regionFromTimezone(timezone) || (cityName || "").toLowerCase();

  const is12h = [...TWELVE_HOUR_COUNTRIES].some(c => region.includes(c));
  const isImperial = [...IMPERIAL_COUNTRIES].some(c => region.includes(c));
  const usesFeet = [...FEET_COUNTRIES].some(c => region.includes(c));

  return {
    timeFormat: is12h ? "12h" : "24h",
    distanceUnit: isImperial ? "mi" : "km",
    smallDistanceUnit: usesFeet ? "ft" : "m",
    speedUnit: isImperial ? "mph" : "kmh",
  };
}

/**
 * Format time string (HH:MM) according to user preference
 */
export function formatTime(time: string, format: "12h" | "24h"): string {
  if (format === "24h") return time;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Format minutes as human-readable (e.g., 75 → "1h 15m", 5 → "5m")
 */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format small distance in user's preferred unit
 */
export function formatSmallDistance(meters: number, unit: "m" | "ft"): string {
  if (unit === "ft") {
    const ft = Math.round(meters * 3.28084);
    return ft > 5280 ? `${(ft / 5280).toFixed(1)} mi` : `${ft} ft`;
  }
  return meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}
