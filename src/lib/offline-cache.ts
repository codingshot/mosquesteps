/**
 * Offline-resilient caching for mosque searches and routes.
 * Uses localStorage with TTL to survive page reloads and connectivity drops.
 */

interface MosqueCacheEntry {
  key: string;
  mosques: CachedMosque[];
  timestamp: number;
}

interface RouteCacheEntry {
  key: string;
  coords: [number, number][];
  distanceKm: number;
  durationMin: number;
  steps: { instruction: string; distance: number; duration: number }[];
  timestamp: number;
}

export interface CachedMosque {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

const MOSQUE_CACHE_KEY = "mosquesteps_mosque_cache";
const ROUTE_CACHE_KEY = "mosquesteps_route_cache";
const MOSQUE_TTL = 24 * 60 * 60 * 1000; // 24h
const ROUTE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Round to ~500m grid for cache key grouping
function gridKey(lat: number, lng: number): string {
  return `${(Math.round(lat * 200) / 200).toFixed(3)},${(Math.round(lng * 200) / 200).toFixed(3)}`;
}

// ---- Mosque cache ----

export function getCachedMosques(lat: number, lng: number): CachedMosque[] | null {
  try {
    const raw = localStorage.getItem(MOSQUE_CACHE_KEY);
    if (!raw) return null;
    const entries: MosqueCacheEntry[] = JSON.parse(raw);
    const key = gridKey(lat, lng);
    const entry = entries.find((e) => e.key === key && Date.now() - e.timestamp < MOSQUE_TTL);
    return entry?.mosques || null;
  } catch {
    return null;
  }
}

export function setCachedMosques(lat: number, lng: number, mosques: CachedMosque[]): void {
  try {
    const key = gridKey(lat, lng);
    let entries: MosqueCacheEntry[] = [];
    try {
      const raw = localStorage.getItem(MOSQUE_CACHE_KEY);
      if (raw) entries = JSON.parse(raw);
    } catch { }
    // Remove expired + same key
    entries = entries.filter((e) => e.key !== key && Date.now() - e.timestamp < MOSQUE_TTL);
    entries.unshift({ key, mosques: mosques.slice(0, 50), timestamp: Date.now() });
    // Keep max 10 location caches
    localStorage.setItem(MOSQUE_CACHE_KEY, JSON.stringify(entries.slice(0, 10)));
  } catch { }
}

// ---- Route cache ----

function routeKey(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  return `${gridKey(fromLat, fromLng)}->${gridKey(toLat, toLng)}`;
}

export function getCachedRoute(fromLat: number, fromLng: number, toLat: number, toLng: number): RouteCacheEntry | null {
  try {
    const raw = localStorage.getItem(ROUTE_CACHE_KEY);
    if (!raw) return null;
    const entries: RouteCacheEntry[] = JSON.parse(raw);
    const key = routeKey(fromLat, fromLng, toLat, toLng);
    return entries.find((e) => e.key === key && Date.now() - e.timestamp < ROUTE_TTL) || null;
  } catch {
    return null;
  }
}

/** When offline, fallback: any cached route to this mosque (destination). Prefer one from nearby origin. */
export function getCachedRouteToMosque(toLat: number, toLng: number, preferFromLat?: number, preferFromLng?: number): RouteCacheEntry | null {
  try {
    const raw = localStorage.getItem(ROUTE_CACHE_KEY);
    if (!raw) return null;
    const entries: RouteCacheEntry[] = JSON.parse(raw);
    const destKey = gridKey(toLat, toLng);
    const valid = entries.filter((e) => {
      if (Date.now() - e.timestamp >= ROUTE_TTL) return false;
      const [, dest] = e.key.split("->");
      return dest === destKey;
    });
    if (valid.length === 0) return null;
    if (preferFromLat != null && preferFromLng != null) {
      valid.sort((a, b) => {
        const [fromA] = a.key.split("->");
        const [fromB] = b.key.split("->");
        const [latA, lngA] = fromA.split(",").map(Number);
        const [latB, lngB] = fromB.split(",").map(Number);
        if (!Number.isFinite(latA) || !Number.isFinite(lngA) || !Number.isFinite(latB) || !Number.isFinite(lngB)) return 0;
        const distA = Math.hypot(latA - preferFromLat, lngA - preferFromLng);
        const distB = Math.hypot(latB - preferFromLat, lngB - preferFromLng);
        return distA - distB;
      });
    }
    return valid[0];
  } catch {
    return null;
  }
}

export function setCachedRoute(
  fromLat: number, fromLng: number, toLat: number, toLng: number,
  data: { coords: [number, number][]; distanceKm: number; durationMin: number; steps: { instruction: string; distance: number; duration: number }[] }
): void {
  try {
    const key = routeKey(fromLat, fromLng, toLat, toLng);
    let entries: RouteCacheEntry[] = [];
    try {
      const raw = localStorage.getItem(ROUTE_CACHE_KEY);
      if (raw) entries = JSON.parse(raw);
    } catch { }
    entries = entries.filter((e) => e.key !== key && Date.now() - e.timestamp < ROUTE_TTL);
    entries.unshift({ key, ...data, timestamp: Date.now() });
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(entries.slice(0, 20)));
  } catch { }
}

// ---- Online status ----

export function isOnline(): boolean {
  return navigator.onLine !== false;
}
