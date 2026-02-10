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
}

const STORAGE_KEY = "mosquesteps_history";
const SETTINGS_KEY = "mosquesteps_settings";
const MOSQUES_KEY = "mosquesteps_saved_mosques";

export interface UserSettings {
  walkingSpeed: number; // km/h
  selectedMosqueName: string;
  selectedMosqueDistance: number; // km
  selectedMosqueLat?: number;
  selectedMosqueLng?: number;
  cityName?: string;
  cityLat?: number;
  cityLng?: number;
  distanceUnit?: "km" | "mi";
  speedUnit?: "kmh" | "mph";
  strideLength?: number; // meters
  homeAddress?: string;
  homeLat?: number;
  homeLng?: number;
  prayerPreferences?: string[]; // which prayers user walks to
  prayerMosques?: Record<string, string>; // prayer name -> mosque id
  notifyMinutesBefore?: number; // minutes before "leave by" time to notify
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
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
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

export function addWalkEntry(entry: Omit<WalkEntry, "id">): WalkEntry {
  const history = getWalkHistory();
  const newEntry: WalkEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  history.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
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

  // Calculate streaks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const uniqueDates = [...new Set(history.map((e) => e.date.split("T")[0]))].sort().reverse();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    const d = new Date(uniqueDates[i]);
    d.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (d.getTime() === expectedDate.getTime()) {
      tempStreak++;
    } else {
      break;
    }
  }
  currentStreak = tempStreak;

  // Calculate longest streak from all dates
  tempStreak = 1;
  const allDates = [...new Set(history.map((e) => e.date.split("T")[0]))].sort();
  for (let i = 1; i < allDates.length; i++) {
    const prev = new Date(allDates[i - 1]);
    const curr = new Date(allDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      tempStreak++;
    } else if (diffDays > 1) {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return {
    totalSteps,
    totalDistance,
    totalHasanat,
    totalWalks: history.length,
    currentStreak,
    longestStreak,
    walksByPrayer,
  };
}
