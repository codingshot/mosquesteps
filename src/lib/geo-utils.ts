/**
 * Shared geographic utility functions.
 * Single source of truth for distance calculations, bearing, and route helpers.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two points in km.
 * Used across mosque search, check-in, dashboard, active walk, etc.
 */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compass bearing (0°=N, 90°=E) from point A to point B.
 */
export function calcBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const y = Math.sin(dLng) * Math.cos(lat2 * DEG_TO_RAD);
  const x =
    Math.cos(lat1 * DEG_TO_RAD) * Math.sin(lat2 * DEG_TO_RAD) -
    Math.sin(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * Math.cos(dLng);
  return (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
}

/**
 * Smooth (exponential) heading filter to reduce jitter from compass readings.
 * Returns smoothed heading in degrees [0, 360).
 */
export function smoothHeading(
  prevHeading: number | null,
  newHeading: number,
  alpha = 0.3
): number {
  if (prevHeading == null || !Number.isFinite(prevHeading)) return newHeading;
  // Handle 360°/0° wraparound
  let delta = newHeading - prevHeading;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return ((prevHeading + alpha * delta) + 360) % 360;
}

/**
 * Find the closest point index on a route to a given position.
 * Returns { index, distanceSq } where distanceSq is in degrees² (for speed).
 */
export function findClosestRouteIndex(
  route: [number, number][],
  lat: number,
  lng: number
): { index: number; distanceSq: number } {
  let minD = Infinity;
  let idx = 0;
  for (let i = 0; i < route.length; i++) {
    const dlat = route[i][0] - lat;
    const dlng = route[i][1] - lng;
    const d = dlat * dlat + dlng * dlng;
    if (d < minD) { minD = d; idx = i; }
  }
  return { index: idx, distanceSq: minD };
}

/**
 * Calculate route completion percentage based on closest point.
 */
export function routeProgress(
  route: [number, number][],
  userLat: number,
  userLng: number
): number {
  if (!route || route.length < 2) return 0;
  const { index } = findClosestRouteIndex(route, userLat, userLng);
  return Math.min(100, Math.round((index / (route.length - 1)) * 100));
}

/**
 * Simplify a route using Ramer-Douglas-Peucker algorithm.
 * Reduces coordinate count for performance on long routes.
 * Epsilon is in degrees (≈0.00005 for ~5m tolerance at equator).
 */
export function simplifyRoute(
  coords: [number, number][],
  epsilon = 0.00005
): [number, number][] {
  if (coords.length <= 2) return coords;

  // Find point with max distance from line
  let maxD = 0;
  let maxIdx = 0;
  const start = coords[0];
  const end = coords[coords.length - 1];

  for (let i = 1; i < coords.length - 1; i++) {
    const d = perpendicularDistance(coords[i], start, end);
    if (d > maxD) { maxD = d; maxIdx = i; }
  }

  if (maxD > epsilon) {
    const left = simplifyRoute(coords.slice(0, maxIdx + 1), epsilon);
    const right = simplifyRoute(coords.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(point[0] - lineStart[0], point[1] - lineStart[1]);
  const t = Math.max(0, Math.min(1,
    ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / lenSq
  ));
  const projX = lineStart[0] + t * dx;
  const projY = lineStart[1] + t * dy;
  return Math.hypot(point[0] - projX, point[1] - projY);
}

/** Off-route threshold in degrees² (~50m at mid-latitudes) — used as fallback */
export const OFF_ROUTE_THRESHOLD_SQ = 0.0005 ** 2;

/**
 * Perpendicular distance from a point to the nearest route segment, in km.
 * Much more accurate than point-based distance for off-route detection,
 * especially on curves and long straight segments.
 */
export function perpendicularDistToRouteKm(
  route: [number, number][],
  lat: number,
  lng: number
): number {
  if (!route || route.length === 0) return Infinity;
  if (route.length === 1) return haversineKm(lat, lng, route[0][0], route[0][1]);

  let minDist = Infinity;

  for (let i = 0; i < route.length - 1; i++) {
    const [aLat, aLng] = route[i];
    const [bLat, bLng] = route[i + 1];

    // Project point onto segment in degree-space (fast approximation)
    const dx = bLat - aLat;
    const dy = bLng - aLng;
    const lenSq = dx * dx + dy * dy;

    let projLat: number, projLng: number;
    if (lenSq === 0) {
      projLat = aLat;
      projLng = aLng;
    } else {
      const t = Math.max(0, Math.min(1, ((lat - aLat) * dx + (lng - aLng) * dy) / lenSq));
      projLat = aLat + t * dx;
      projLng = aLng + t * dy;
    }

    const dist = haversineKm(lat, lng, projLat, projLng);
    if (dist < minDist) minDist = dist;
  }

  return minDist;
}

/**
 * Check if user is off-route using segment-based perpendicular distance.
 * Returns true if more than thresholdM meters from nearest route segment.
 */
export function isOffRoute(
  route: [number, number][],
  lat: number,
  lng: number,
  thresholdM = 50
): boolean {
  const distKm = perpendicularDistToRouteKm(route, lat, lng);
  return distKm * 1000 > thresholdM;
}

/** Format distance for display: "1.2 km" or "350 m" */
export function formatDistanceLabel(km: number, useImperial = false): string {
  if (useImperial) {
    const mi = km * 0.621371;
    return mi >= 0.1 ? `${mi.toFixed(1)} mi` : `${Math.round(km * 3280.84)} ft`;
  }
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`;
}
