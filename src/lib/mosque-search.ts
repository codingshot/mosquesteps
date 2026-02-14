/**
 * Mosque discovery via OpenStreetMap Overpass API.
 * Queries multiple tag combinations for broad coverage.
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
}

function getElementCoords(el: { lat?: number; lon?: number; center?: { lat: number; lon: number } }): { lat: number; lon: number } | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lon: el.lon };
  if (el.center?.lat != null && el.center?.lon != null) return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

function getElementName(el: { tags?: Record<string, string> }): string {
  const t = el.tags;
  if (!t) return "Mosque";
  return (
    t["name:en"] ||
    t.name ||
    t["int_name"] ||
    t["name:ar"] ||
    t["name:tr"] ||
    t["alt_name"] ||
    "Mosque"
  );
}

/** Element "quality" for deduplication: prefer ways/relations (have geometry) and named results */
function elementScore(el: { type?: string; tags?: Record<string, string> }): number {
  let score = 0;
  if (el.type === "way") score += 2;
  else if (el.type === "relation") score += 2;
  if (el.tags?.name || el.tags?.["name:en"]) score += 4;
  return score;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Overpass query: 10km radius, multiple mosque tag combinations, up to 80 results */
const buildQuery = (lat: number, lng: number) => `
[out:json][timeout:20];
(
  node["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${lat},${lng});
  way["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${lat},${lng});
  relation["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${lat},${lng});
  node["building"="mosque"](around:10000,${lat},${lng});
  way["building"="mosque"](around:10000,${lat},${lng});
  relation["building"="mosque"](around:10000,${lat},${lng});
  node["amenity"="place_of_worship"]["denomination"="sunni"](around:10000,${lat},${lng});
  way["amenity"="place_of_worship"]["denomination"="sunni"](around:10000,${lat},${lng});
  node["amenity"="place_of_worship"]["denomination"="shia"](around:10000,${lat},${lng});
  way["amenity"="place_of_worship"]["denomination"="shia"](around:10000,${lat},${lng});
  node["place_of_worship:type"="mosque"](around:10000,${lat},${lng});
  way["place_of_worship:type"="mosque"](around:10000,${lat},${lng});
);
out center 80;
`;

async function fetchOverpass(url: string, query: string, signal?: AbortSignal | null): Promise<{ elements: unknown[] }> {
  const res = await fetch(url, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: signal ?? (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(18000)
      : undefined),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();
  if (!data.elements || !Array.isArray(data.elements)) throw new Error("Invalid Overpass response");
  return data;
}

/**
 * Search for mosques near a location. Tries primary Overpass server, falls back to secondary on failure.
 */
export async function searchNearbyMosques(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<MosqueResult[]> {
  // Validate coordinates before constructing Overpass query
  if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error("Invalid coordinates for mosque search");
  }
  const query = buildQuery(lat, lng);
  let data: { elements: unknown[] } | null = null;

  for (const url of OVERPASS_SERVERS) {
    try {
      data = await fetchOverpass(url, query, signal);
      break;
    } catch (e) {
      if (url === OVERPASS_SERVERS[OVERPASS_SERVERS.length - 1]) {
        throw e instanceof Error ? e : new Error(String(e));
      }
    }
  }

  if (!data) throw new Error("Overpass request failed");

  const elements = data.elements as Array<{
    id: number;
    type?: string;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>;

  const parsed = elements
    .map((el) => {
      const coords = getElementCoords(el);
      if (!coords) return null;
      return {
        id: el.id,
        type: el.type || "node",
        name: getElementName(el),
        lat: coords.lat,
        lon: coords.lon,
        score: elementScore(el),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m != null);

  // Deduplicate: cluster by ~30m, keep highest-score result per cluster
  const DEDUP_M_KM = 0.03;
  const deduped: typeof parsed = [];

  for (const m of parsed.sort((a, b) => b.score - a.score)) {
    const isDuplicate = deduped.some(
      (existing) =>
        haversineKm(existing.lat, existing.lon, m.lat, m.lon) < DEDUP_M_KM ||
        (existing.name === m.name && haversineKm(existing.lat, existing.lon, m.lat, m.lon) < 0.08)
    );
    if (!isDuplicate) deduped.push(m);
  }

  return deduped.map(({ id, name, lat, lon }) => ({ id, name, lat, lon }));
}
