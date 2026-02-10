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

export interface UserSettings {
  walkingSpeed: number; // km/h
  selectedMosqueName: string;
  selectedMosqueDistance: number; // km
  selectedMosqueLat?: number;
  selectedMosqueLng?: number;
  cityName?: string;
  cityLat?: number;
  cityLng?: number;
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
    const diff = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === i) {
      tempStreak++;
      if (i === 0 || diff <= currentStreak + 1) {
        currentStreak = tempStreak;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

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
