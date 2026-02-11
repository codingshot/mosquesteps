/**
 * Daily prayer log — tracks which prayers were prayed and how user got there/back.
 */

export type TransportMode = "walked" | "car" | "taxi" | "bus" | "bike" | "other" | "";

export interface PrayerLogEntry {
  prayer: string;
  prayed: boolean;
  goMethod: TransportMode;   // how they got to the mosque
  returnMethod: TransportMode; // how they came back
  note?: string;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  prayers: PrayerLogEntry[];
}

const LOG_KEY = "mosquesteps_prayer_log";

function getAllLogs(): DayLog[] {
  try {
    const stored = localStorage.getItem(LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: DayLog[]) {
  // Keep max 90 days
  const trimmed = logs.slice(0, 90);
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  } catch { }
}

const DAILY_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function createEmptyDay(date: string): DayLog {
  return {
    date,
    prayers: DAILY_PRAYERS.map((p) => ({
      prayer: p,
      prayed: false,
      goMethod: "",
      returnMethod: "",
    })),
  };
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDayLog(date: string): DayLog {
  const logs = getAllLogs();
  const existing = logs.find((l) => l.date === date);
  return existing || createEmptyDay(date);
}

export function getRecentLogs(days: number = 7): DayLog[] {
  const result: DayLog[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    result.push(getDayLog(dateStr));
  }
  return result;
}

export function updatePrayerLog(date: string, prayer: string, updates: Partial<PrayerLogEntry>) {
  const logs = getAllLogs();
  let dayLog = logs.find((l) => l.date === date);
  if (!dayLog) {
    dayLog = createEmptyDay(date);
    logs.unshift(dayLog);
  }
  const entry = dayLog.prayers.find((p) => p.prayer === prayer);
  if (entry) {
    Object.assign(entry, updates);
  }
  // Sort by date descending
  logs.sort((a, b) => b.date.localeCompare(a.date));
  saveLogs(logs);
}

/**
 * Auto-mark a prayer as prayed when a walk is completed for it.
 */
export function markPrayerWalked(prayer: string, date?: string) {
  const dateStr = date || getTodayStr();
  updatePrayerLog(dateStr, prayer, { prayed: true, goMethod: "walked" });
}

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  walked: "🚶 Walked",
  car: "🚗 Car",
  taxi: "🚕 Taxi",
  bus: "🚌 Bus",
  bike: "🚲 Bike",
  other: "❓ Other",
  "": "—",
};
