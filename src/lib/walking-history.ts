// Walking history stored in localStorage
export interface WalkEntry {
  id: string;
  date: string;
  mosqueName: string;
  distanceKm: number;
  steps: number;
  walkingTimeMin: number;
  hasanat: number;
  prayer: string;
}

export interface SavedMosque {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  isPrimary?: boolean;
}

export interface WalkingStats {
  totalSteps: number;
  totalDistance: number;
  totalHasanat: number;
  totalWalks: number;
  currentStreak: number;
  longestStreak: number;
  walksByPrayer: Record<string, number>;
  // Extended special tracking
  ramadanWalks: number;
  fridayWalks: number;
  fajrThisWeek: number;
  jumuahStreak: number;
}

const STORAGE_KEY = "mosquesteps_history";
const SETTINGS_KEY = "mosquesteps_settings";
const MOSQUES_KEY = "mosquesteps_saved_mosques";

/** Reasonable age range for health recommendations (years). */
export const AGE_MIN = 5;
export const AGE_MAX = 120;

/** Reasonable body weight range for metrics (kg). */
export const BODY_WEIGHT_KG_MIN = 20;
export const BODY_WEIGHT_KG_MAX = 300;

export interface UserSettings {
  walkingSpeed: number; // km/h
  selectedMosqueName: string;
  selectedMosqueDistance: number; // km
  selectedMosqueLat?: number;
  selectedMosqueLng?: number;
  cityName?: string;
  cityLat?: number;
  cityLng?: number;
  cityTimezone?: string; // IANA timezone e.g. "Europe/London"
  distanceUnit?: "km" | "mi";
  speedUnit?: "kmh" | "mph";
  smallDistanceUnit?: "m" | "ft";
  timeFormat?: "12h" | "24h";
  strideLength?: number; // meters
  homeAddress?: string;
  homeLat?: number;
  homeLng?: number;
  prayerPreferences?: string[]; // which prayers user walks to
  prayerMosques?: Record<string, string>; // prayer name -> mosque id
  notifyMinutesBefore?: number; // minutes before "leave by" time to notify
  age?: number;
  gender?: "male" | "female" | "";
  /** Optional body weight in kg for calorie estimates and future gait metrics. */
  bodyWeightKg?: number;
  /** When true, use weight for calories and enable future gait/stride/cadence insights. */
  advancedMetricsMode?: boolean;
}

/**
 * Fetch IANA timezone string from coordinates using TimeAPI.io
 */
export async function fetchTimezone(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`
    );
    const data = await res.json();
    return data.timeZone || null;
  } catch {
    // Fallback: approximate from longitude (15° per hour)
    try {
      const offsetHours = Math.round(lng / 15);
      const sign = offsetHours >= 0 ? "+" : "-";
      const abs = Math.abs(offsetHours);
      // Try to resolve via Intl — won't work for all, but is a decent fallback
      return `Etc/GMT${offsetHours <= 0 ? "+" : "-"}${abs}`;
    } catch {
      return null;
    }
  }
}

const DEFAULT_SETTINGS: UserSettings = {
  walkingSpeed: 5,
  selectedMosqueName: "My Mosque",
  selectedMosqueDistance: 0.8,
};

export function getSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<UserSettings>) {
  const current = getSettings();
  const merged = { ...current, ...settings };

  // Validate numeric ranges
  if (merged.walkingSpeed != null) merged.walkingSpeed = Math.max(0.5, Math.min(20, Number(merged.walkingSpeed) || 5));
  if (merged.age != null) merged.age = Math.max(AGE_MIN, Math.min(AGE_MAX, Math.round(Number(merged.age) || 25)));
  if (merged.bodyWeightKg != null) merged.bodyWeightKg = Math.max(BODY_WEIGHT_KG_MIN, Math.min(BODY_WEIGHT_KG_MAX, Number(merged.bodyWeightKg) || 70));
  if (merged.selectedMosqueDistance != null) merged.selectedMosqueDistance = Math.max(0, Math.min(100, Number(merged.selectedMosqueDistance) || 0));
  if (merged.notifyMinutesBefore != null) merged.notifyMinutesBefore = Math.max(0, Math.min(120, Math.round(Number(merged.notifyMinutesBefore) || 15)));
  if (merged.strideLength != null) merged.strideLength = Math.max(0.3, Math.min(2.0, Number(merged.strideLength) || 0.75));

  // Validate coordinates
  if (merged.cityLat != null) merged.cityLat = isFinite(merged.cityLat) ? Math.max(-90, Math.min(90, merged.cityLat)) : undefined;
  if (merged.cityLng != null) merged.cityLng = isFinite(merged.cityLng) ? Math.max(-180, Math.min(180, merged.cityLng)) : undefined;
  if (merged.homeLat != null) merged.homeLat = isFinite(merged.homeLat) ? Math.max(-90, Math.min(90, merged.homeLat)) : undefined;
  if (merged.homeLng != null) merged.homeLng = isFinite(merged.homeLng) ? Math.max(-180, Math.min(180, merged.homeLng)) : undefined;
  if (merged.selectedMosqueLat != null) merged.selectedMosqueLat = isFinite(merged.selectedMosqueLat) ? Math.max(-90, Math.min(90, merged.selectedMosqueLat)) : undefined;
  if (merged.selectedMosqueLng != null) merged.selectedMosqueLng = isFinite(merged.selectedMosqueLng) ? Math.max(-180, Math.min(180, merged.selectedMosqueLng)) : undefined;

  // Sanitize string fields
  if (merged.cityName) merged.cityName = sanitizeString(merged.cityName);
  if (merged.selectedMosqueName) merged.selectedMosqueName = sanitizeString(merged.selectedMosqueName);
  if (merged.homeAddress) merged.homeAddress = sanitizeString(merged.homeAddress);

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    // localStorage quota exceeded — silently fail
  }
}

// Saved mosques
export function getSavedMosques(): SavedMosque[] {
  try {
    const stored = localStorage.getItem(MOSQUES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveMosque(mosque: SavedMosque) {
  const mosques = getSavedMosques();
  const existing = mosques.findIndex((m) => m.id === mosque.id);
  if (existing >= 0) {
    mosques[existing] = mosque;
  } else {
    mosques.push(mosque);
  }
  localStorage.setItem(MOSQUES_KEY, JSON.stringify(mosques));
}

export function removeSavedMosque(id: string) {
  const mosques = getSavedMosques().filter((m) => m.id !== id);
  localStorage.setItem(MOSQUES_KEY, JSON.stringify(mosques));
}

export function setPrimaryMosque(id: string) {
  const mosques = getSavedMosques().map((m) => ({ ...m, isPrimary: m.id === id }));
  localStorage.setItem(MOSQUES_KEY, JSON.stringify(mosques));
  const primary = mosques.find((m) => m.isPrimary);
  if (primary) {
    saveSettings({
      selectedMosqueName: primary.name,
      selectedMosqueDistance: primary.distanceKm,
      selectedMosqueLat: primary.lat,
      selectedMosqueLng: primary.lng,
    });
  }
}

export function getWalkHistory(): WalkEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, "").trim().slice(0, 500);
}

export function addWalkEntry(entry: Omit<WalkEntry, "id">): WalkEntry {
  const history = getWalkHistory();
  const newEntry: WalkEntry = {
    ...entry,
    mosqueName: sanitizeString(entry.mosqueName),
    prayer: sanitizeString(entry.prayer),
    distanceKm: Math.max(0, Number(entry.distanceKm) || 0),
    steps: Math.max(0, Math.round(Number(entry.steps) || 0)),
    walkingTimeMin: Math.max(0, Math.round(Number(entry.walkingTimeMin) || 0)),
    hasanat: Math.max(0, Math.round(Number(entry.hasanat) || 0)),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  history.unshift(newEntry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage quota exceeded — silently fail
  }
  return newEntry;
}

export function deleteWalkEntry(id: string) {
  const history = getWalkHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getWalkingStats(): WalkingStats {
  const history = getWalkHistory();

  const totalSteps = history.reduce((s, e) => s + e.steps, 0);
  const totalDistance = history.reduce((s, e) => s + e.distanceKm, 0);
  const totalHasanat = history.reduce((s, e) => s + e.hasanat, 0);

  const walksByPrayer: Record<string, number> = {};
  history.forEach((e) => {
    walksByPrayer[e.prayer] = (walksByPrayer[e.prayer] || 0) + 1;
  });

  // Streaks: use local date strings so timezone doesn't break "today"
  const toLocalDateKey = (iso: string): string | null => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  const today = new Date();

  const uniqueDates = [...new Set(history.map((e) => toLocalDateKey(e.date)).filter((k): k is string => k != null))].sort().reverse();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedKey = toLocalDateKey(expected.toISOString());
    if (uniqueDates[i] === expectedKey) {
      tempStreak++;
    } else {
      break;
    }
  }
  currentStreak = tempStreak;

  const allDates = [...new Set(history.map((e) => toLocalDateKey(e.date)).filter((k): k is string => k != null))].sort();
  if (allDates.length > 0) {
    tempStreak = 1;
    for (let i = 1; i < allDates.length; i++) {
      const [py, pm, pd] = allDates[i - 1].split("-").map(Number);
      const [cy, cm, cd] = allDates[i].split("-").map(Number);
      const prevMs = new Date(py, pm - 1, pd).getTime();
      const currMs = new Date(cy, cm - 1, cd).getTime();
      const diffDays = Math.round((currMs - prevMs) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  }

  // Extended stats: Ramadan, Friday, Fajr-this-week, Jumuah streak
  let ramadanWalks = 0;
  let fridayWalks = 0;
  let fajrThisWeek = 0;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const jumuahWeeks = new Set<string>();

  for (const e of history) {
    const d = new Date(e.date);
    // Ramadan detection via Intl Hijri calendar
    try {
      const hijriMonth = parseInt(new Intl.DateTimeFormat("en-u-ca-islamic", { month: "numeric" }).format(d));
      if (hijriMonth === 9) ramadanWalks++;
    } catch { /* skip */ }
    if (d.getDay() === 5) fridayWalks++;
    if (e.prayer === "Fajr" && d >= weekAgo) fajrThisWeek++;
    if (e.prayer === "Jumuah" && d.getDay() === 5) {
      const ws = new Date(d);
      ws.setDate(d.getDate() - d.getDay());
      jumuahWeeks.add(`${ws.getFullYear()}-${String(ws.getMonth() + 1).padStart(2, "0")}-${String(ws.getDate()).padStart(2, "0")}`);
    }
  }

  // Jumuah streak: consecutive weeks
  const sortedJumuahWeeks = [...jumuahWeeks].sort().reverse();
  let jumuahStreak = 0;
  const nowWeekStart = new Date();
  nowWeekStart.setDate(nowWeekStart.getDate() - nowWeekStart.getDay());
  for (let i = 0; i < sortedJumuahWeeks.length; i++) {
    const expW = new Date(nowWeekStart);
    expW.setDate(nowWeekStart.getDate() - i * 7);
    const expKey = `${expW.getFullYear()}-${String(expW.getMonth() + 1).padStart(2, "0")}-${String(expW.getDate()).padStart(2, "0")}`;
    if (sortedJumuahWeeks[i] === expKey) { jumuahStreak++; } else { break; }
  }

  return {
    totalSteps,
    totalDistance,
    totalHasanat,
    totalWalks: history.length,
    currentStreak,
    longestStreak,
    walksByPrayer,
    ramadanWalks,
    fridayWalks,
    fajrThisWeek,
    jumuahStreak,
  };
}
