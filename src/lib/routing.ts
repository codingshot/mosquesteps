/**
 * Fetch walking route from OSRM
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
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0];
    const rawCoords = route.geometry?.coordinates;
    if (!Array.isArray(rawCoords) || rawCoords.length === 0) return null;
    const coords: [number, number][] = rawCoords.map(
      (c: [number, number]) => [c[1], c[0]] // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
    );

    const steps = route.legs[0]?.steps?.map((s: any) => ({
      instruction: s.maneuver?.type
        ? `${s.maneuver.type}${s.maneuver.modifier ? ` ${s.maneuver.modifier}` : ""}${s.name ? ` onto ${s.name}` : ""}`
        : "Continue",
      distance: s.distance,
      duration: s.duration,
    })) || [];

    return {
      coords,
      distanceKm: route.distance / 1000,
      durationMin: Math.round(route.duration / 60),
      steps,
    };
  } catch (e) {
    console.error("OSRM route fetch failed:", e);
    return null;
  }
}
