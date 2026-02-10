/**
 * Mosque check-in system
 * Users can check in when they arrive within ~100m of a mosque
 */

export interface CheckIn {
  id: string;
  mosqueId: string;
  mosqueName: string;
  date: string;
  prayer: string;
  lat: number;
  lng: number;
}

const CHECKIN_KEY = "mosquesteps_checkins";
const CHECKIN_RADIUS_KM = 0.1; // 100 meters

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCheckIns(): CheckIn[] {
  try {
    const stored = localStorage.getItem(CHECKIN_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addCheckIn(checkin: Omit<CheckIn, "id">): CheckIn {
  const checkIns = getCheckIns();
  const newCheckIn: CheckIn = {
    ...checkin,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  checkIns.unshift(newCheckIn);
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkIns));
  return newCheckIn;
}

export function isNearMosque(
  userLat: number, userLng: number,
  mosqueLat: number, mosqueLng: number
): boolean {
  return haversine(userLat, userLng, mosqueLat, mosqueLng) <= CHECKIN_RADIUS_KM;
}

export function hasCheckedInToday(mosqueId: string, prayer: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return getCheckIns().some(
    (c) => c.mosqueId === mosqueId && c.prayer === prayer && c.date.startsWith(today)
  );
}

export function getCheckInStats(): {
  totalCheckIns: number;
  uniqueMosques: number;
  checkInsByMosque: Record<string, number>;
  checkInsByPrayer: Record<string, number>;
} {
  const checkIns = getCheckIns();
  const mosqueSet = new Set(checkIns.map((c) => c.mosqueId));
  const byMosque: Record<string, number> = {};
  const byPrayer: Record<string, number> = {};

  checkIns.forEach((c) => {
    byMosque[c.mosqueName] = (byMosque[c.mosqueName] || 0) + 1;
    byPrayer[c.prayer] = (byPrayer[c.prayer] || 0) + 1;
  });

  return {
    totalCheckIns: checkIns.length,
    uniqueMosques: mosqueSet.size,
    checkInsByMosque: byMosque,
    checkInsByPrayer: byPrayer,
  };
}
