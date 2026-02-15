/** Validate coordinate is finite and within valid range. */
function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

/**
 * Fetch walking route from OSRM. Returns null when offline (no network).
 */
export async function fetchWalkingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<{
  coords: [number, number][];
  distanceKm: number;
  durationMin: number;
  steps: { instruction: string; distance: number; duration: number }[];
} | null> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
  if (!isValidCoord(fromLat, fromLng) || !isValidCoord(toLat, toLng)) return null;

  // Same or nearly same point — OSRM may return odd results
  const samePoint =
    Math.abs(fromLat - toLat) < 1e-6 && Math.abs(fromLng - toLng) < 1e-6;
  if (samePoint) return null;

  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);

    let data: { code?: string; routes?: unknown[] };
    try {
      data = await res.json();
    } catch {
      return null;
    }

    if (!res.ok || data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0] as {
      distance?: number;
      duration?: number;
      geometry?: { coordinates?: [number, number][] };
      legs?: { steps?: { name?: string; ref?: string; maneuver?: { type?: string; modifier?: string }; distance?: number; duration?: number }[] }[];
    };
    const rawCoords = route.geometry?.coordinates;
    if (!Array.isArray(rawCoords) || rawCoords.length === 0) return null;

    const dist = Number(route.distance);
    const dur = Number(route.duration);
    const distanceKm = Number.isFinite(dist) ? dist / 1000 : 0;
    const durationMin = Number.isFinite(dur) ? Math.round(dur / 60) : 0;

    const coords: [number, number][] = rawCoords.map(
      (c: [number, number]) => [c[1], c[0]] // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
    );

    const steps = (route.legs?.[0]?.steps ?? []).map((s: { name?: string; ref?: string; maneuver?: { type?: string; modifier?: string }; distance?: number; duration?: number }) => {
      const roadName = s.name || s.ref;
      const ontoPart = roadName ? ` onto ${roadName}` : "";
      const instruction = s.maneuver?.type
        ? `${s.maneuver.type}${s.maneuver.modifier ? ` ${s.maneuver.modifier}` : ""}${ontoPart}`
        : "Continue";
      const distance = Number.isFinite(Number(s.distance)) ? (s.distance ?? 0) : 0;
      const duration = Number.isFinite(Number(s.duration)) ? (s.duration ?? 0) : 0;
      return { instruction, distance, duration };
    });

    return { coords, distanceKm, durationMin, steps };
  } catch (e) {
    console.error("OSRM route fetch failed:", e);
    return null;
  }
}
