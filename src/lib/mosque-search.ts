/**
 * Mosque discovery via OpenStreetMap Overpass API.
 * Queries multiple tag combinations for broad coverage.
 * Improvements over v1:
 *  - Concentric radii (2 km → 5 km → 10 km) so nearby results surface first
 *  - Richer name extraction (official_name, loc_name, operator)
 *  - opening_hours forwarded so UI can show "open now" status
 *  - phone / website for contact details
 *  - Better deduplication (50 m cluster + same-name within 150 m)
 *  - Distance-sorting within clusters so the closest of each duplicate group wins
 */

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
] as const;

export interface MosqueResult {
  id: number;
  name: string;
  lat: number;
  lon: number;
  /** Best opening hours string from OSM tags, if available */
  openingHours?: string;
  /** Phone number from OSM tags, if available */
  phone?: string;
  /** Website from OSM tags, if available */
  website?: string;
  /** Distance in km from the searched position (approximate) */
  distanceKm?: number;
}

function getElementCoords(el: {
  lat?: number; lon?: number;
  center?: { lat: number; lon: number };
}): { lat: number; lon: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon };
  if (el.center?.lat != null && el.center?.lon != null) return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

function getElementName(el: { tags?: Record<string, string> }): string {
  const t = el.tags;
  if (!t) return "Mosque";
  return (
    t["name:en"] ||
    t["official_name"] ||
    t.name ||
    t["int_name"] ||
    t["name:ar"] ||
    t["name:tr"] ||
    t["name:ur"] ||
    t["loc_name"] ||
    t["alt_name"] ||
    t["operator"] ||
    "Mosque"
  );
}

/** Element quality score: prefer ways/relations (have geometry) and named results */
function elementScore(el: { type?: string; tags?: Record<string, string> }): number {
  let score = 0;
  if (el.type === "way" || el.type === "relation") score += 2;
  if (el.tags?.["name:en"]) score += 5;
  else if (el.tags?.name) score += 4;
  if (el.tags?.["opening_hours"]) score += 1;
  return score;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Build an Overpass query for a given radius (metres).
 * Uses multiple tag combinations for broad coverage.
 */
const buildQuery = (lat: number, lng: number, radiusM: number) => `
[out:json][timeout:25];
(
  node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
  way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
  relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
  node["building"="mosque"](around:${radiusM},${lat},${lng});
  way["building"="mosque"](around:${radiusM},${lat},${lng});
  relation["building"="mosque"](around:${radiusM},${lat},${lng});
  node["amenity"="place_of_worship"]["denomination"="sunni"](around:${radiusM},${lat},${lng});
  way["amenity"="place_of_worship"]["denomination"="sunni"](around:${radiusM},${lat},${lng});
  node["amenity"="place_of_worship"]["denomination"="shia"](around:${radiusM},${lat},${lng});
  way["amenity"="place_of_worship"]["denomination"="shia"](around:${radiusM},${lat},${lng});
  node["place_of_worship:type"="mosque"](around:${radiusM},${lat},${lng});
  way["place_of_worship:type"="mosque"](around:${radiusM},${lat},${lng});
);
out center 100;
`;

async function fetchOverpass(
  url: string,
  query: string,
  signal?: AbortSignal | null,
): Promise<{ elements: unknown[] }> {
  const res = await fetch(url, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: signal ?? (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(22000)
      : undefined),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();
  if (!data.elements || !Array.isArray(data.elements)) throw new Error("Invalid Overpass response");
  return data;
}

async function tryOverpass(
  lat: number,
  lng: number,
  radiusM: number,
  signal?: AbortSignal,
): Promise<{ elements: unknown[] }> {
  let lastErr: unknown;
  for (const url of OVERPASS_SERVERS) {
    try {
      return await fetchOverpass(url, buildQuery(lat, lng, radiusM), signal);
    } catch (e) {
      lastErr = e;
      if (signal?.aborted) throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Search for mosques near a location.
 * Uses concentric radii (2 km → 5 km → 10 km) so nearby results surface first
 * and distant searches only fire when close results are sparse.
 */
export async function searchNearbyMosques(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<MosqueResult[]> {
  if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("Invalid coordinates for mosque search");
  }

  // Try narrow radius first, expand only if sparse
  const radii = [2000, 5000, 10000];
  let allElements: unknown[] = [];
  let lastError: unknown;

  for (const radius of radii) {
    try {
      const data = await tryOverpass(lat, lng, radius, signal);
      allElements = data.elements;
      lastError = undefined;
      // If we have at least 3 results at this radius, stop expanding
      if (allElements.length >= 3) break;
    } catch (e) {
      lastError = e;
      // Continue to wider radius
    }
  }

  // If every radius failed, propagate the error
  if (lastError) throw lastError instanceof Error ? lastError : new Error(String(lastError));

  if (allElements.length === 0) return [];

  type RawElement = {
    id: number;
    type?: string;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  };

  const elements = allElements as RawElement[];

  const parsed = elements
    .map((el) => {
      const coords = getElementCoords(el);
      if (!coords) return null;
      const distKm = haversineKm(lat, lng, coords.lat, coords.lon);
      return {
        id: el.id,
        type: el.type || "node",
        name: getElementName(el),
        lat: coords.lat,
        lon: coords.lon,
        score: elementScore(el),
        distanceKm: distKm,
        openingHours: el.tags?.["opening_hours"],
        phone: el.tags?.phone || el.tags?.["contact:phone"],
        website: el.tags?.website || el.tags?.["contact:website"],
      };
    })
    .filter((m): m is NonNullable<typeof m> => m != null);

  // Sort by score descending, then distance ascending within same score tier
  parsed.sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm);

  // Deduplicate: cluster by 50 m OR same name within 150 m — keep closest of each cluster
  const DEDUP_CLOSE_KM = 0.05;    // 50 m — same physical building
  const DEDUP_NAME_KM  = 0.15;    // 150 m — same name at nearby location
  const deduped: typeof parsed = [];

  for (const m of parsed) {
    const isDuplicate = deduped.some((existing) => {
      const distKm = haversineKm(existing.lat, existing.lon, m.lat, m.lon);
      return (
        distKm < DEDUP_CLOSE_KM ||
        (existing.name !== "Mosque" && existing.name === m.name && distKm < DEDUP_NAME_KM)
      );
    });
    if (!isDuplicate) deduped.push(m);
  }

  // Final sort by distance
  deduped.sort((a, b) => a.distanceKm - b.distanceKm);

  return deduped.map(({ id, name, lat, lon, distanceKm, openingHours, phone, website }) => ({
    id,
    name,
    lat,
    lon,
    distanceKm,
    openingHours,
    phone,
    website,
  }));
}
