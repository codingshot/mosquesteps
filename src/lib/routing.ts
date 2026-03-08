import { getCachedRoute, setCachedRoute } from "./offline-cache";

/** Validate coordinate is finite and within valid range. */
function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

/** Routing provider — OSRM is always available; Mapbox used when API key is set */
export type RoutingProvider = "osrm" | "mapbox";

/** Get the configured Mapbox token (returns empty string if none) */
export function getMapboxToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("mosquesteps_mapbox_token") || "";
}

/** Set the Mapbox token */
export function setMapboxToken(token: string): void {
  if (token) localStorage.setItem("mosquesteps_mapbox_token", token);
  else localStorage.removeItem("mosquesteps_mapbox_token");
}

/** Check if Mapbox routing is available */
export function isMapboxAvailable(): boolean {
  return getMapboxToken().length > 10;
}

/** Get currently preferred routing provider */
export function getPreferredProvider(): RoutingProvider {
  if (typeof window === "undefined") return "osrm";
  const pref = localStorage.getItem("mosquesteps_routing_provider");
  if (pref === "mapbox" && isMapboxAvailable()) return "mapbox";
  return "osrm";
}

export function setPreferredProvider(p: RoutingProvider): void {
  localStorage.setItem("mosquesteps_routing_provider", p);
}

export type RouteResult = {
  coords: [number, number][];
  distanceKm: number;
  durationMin: number;
  steps: { instruction: string; distance: number; duration: number }[];
  provider: RoutingProvider;
};

// ── In-flight request dedup ──────────────────────────────────────────────────
const inflightRequests = new Map<string, Promise<RouteResult | null>>();

function makeKey(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  return `${fromLat.toFixed(5)},${fromLng.toFixed(5)}->${toLat.toFixed(5)},${toLng.toFixed(5)}`;
}

// ── Active AbortController for cancelling stale route requests ───────────────
let activeAbortController: AbortController | null = null;

/** Cancel any in-flight route requests (e.g., on reroute or walk stop) */
export function cancelPendingRoutes(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

/**
 * Fetch walking route from Mapbox Directions API.
 */
async function fetchMapboxRoute(
  fromLat: number, fromLng: number, toLat: number, toLng: number,
  signal?: AbortSignal
): Promise<RouteResult | null> {
  const token = getMapboxToken();
  if (!token) return null;
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full&steps=true&access_token=${token}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes?.length) return null;
    const route = data.routes[0];
    const rawCoords = route.geometry?.coordinates;
    if (!Array.isArray(rawCoords) || rawCoords.length === 0) return null;
    const dist = Number(route.distance);
    const dur = Number(route.duration);
    const coords: [number, number][] = rawCoords.map((c: [number, number]) => [c[1], c[0]]);
    const steps = (route.legs?.[0]?.steps ?? []).map((s: any) => ({
      instruction: s.maneuver?.instruction || "Continue",
      distance: s.distance ?? 0,
      duration: s.duration ?? 0,
    }));
    return {
      coords,
      distanceKm: Number.isFinite(dist) ? dist / 1000 : 0,
      durationMin: Number.isFinite(dur) ? Math.round(dur / 60) : 0,
      steps,
      provider: "mapbox",
    };
  } catch (e: any) {
    if (e?.name === "AbortError") return null;
    console.error("Mapbox route fetch failed:", e);
    return null;
  }
}

/**
 * Fetch walking route from OSRM with retry.
 */
async function fetchOSRMRoute(
  fromLat: number, fromLng: number, toLat: number, toLng: number,
  signal?: AbortSignal
): Promise<RouteResult | null> {
  const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { signal });
      let data: { code?: string; routes?: unknown[] };
      try { data = await res.json(); } catch { return null; }
      if (!res.ok || data.code !== "Ok" || !data.routes?.length) {
        // Retry on server errors (5xx), give up on client errors
        if (res.status >= 500 && attempt < 2) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        return null;
      }
      const route = data.routes[0] as any;
      const rawCoords = route.geometry?.coordinates;
      if (!Array.isArray(rawCoords) || rawCoords.length === 0) return null;
      const dist = Number(route.distance);
      const dur = Number(route.duration);
      const coords: [number, number][] = rawCoords.map((c: [number, number]) => [c[1], c[0]]);
      const steps = (route.legs?.[0]?.steps ?? []).map((s: any) => {
        const roadName = s.name || s.ref;
        const ontoPart = roadName ? ` onto ${roadName}` : "";
        const instruction = s.maneuver?.type
          ? `${s.maneuver.type}${s.maneuver.modifier ? ` ${s.maneuver.modifier}` : ""}${ontoPart}`
          : "Continue";
        return {
          instruction,
          distance: Number.isFinite(Number(s.distance)) ? (s.distance ?? 0) : 0,
          duration: Number.isFinite(Number(s.duration)) ? (s.duration ?? 0) : 0,
        };
      });
      return {
        coords,
        distanceKm: Number.isFinite(dist) ? dist / 1000 : 0,
        durationMin: Number.isFinite(dur) ? Math.round(dur / 60) : 0,
        steps,
        provider: "osrm",
      };
    } catch (e: any) {
      if (e?.name === "AbortError") return null;
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      console.error("OSRM route fetch failed:", e);
      return null;
    }
  }
  return null;
}

/**
 * Fetch walking route using preferred provider with automatic fallback.
 * Features: AbortController support, request dedup, stale cancellation, auto-caching.
 * Returns null when offline (no network) — check cache first in that case.
 */
export async function fetchWalkingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  options?: { skipCache?: boolean }
): Promise<RouteResult | null> {
  if (!isValidCoord(fromLat, fromLng) || !isValidCoord(toLat, toLng)) return null;
  const samePoint = Math.abs(fromLat - toLat) < 1e-6 && Math.abs(fromLng - toLng) < 1e-6;
  if (samePoint) return null;

  // Check cache first (unless skipped)
  if (!options?.skipCache) {
    const cached = getCachedRoute(fromLat, fromLng, toLat, toLng);
    if (cached) {
      return {
        coords: cached.coords,
        distanceKm: cached.distanceKm,
        durationMin: cached.durationMin,
        steps: cached.steps,
        provider: (cached.provider as RoutingProvider) || "osrm",
      };
    }
  }

  // Return null if offline (after checking cache)
  if (typeof navigator !== "undefined" && navigator.onLine === false) return null;

  const key = makeKey(fromLat, fromLng, toLat, toLng);

  // Dedup: return in-flight promise for same route
  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  // Cancel previous stale request
  cancelPendingRoutes();
  const controller = new AbortController();
  activeAbortController = controller;

  const promise = (async () => {
    try {
      const preferred = getPreferredProvider();
      const signal = controller.signal;

      let result: RouteResult | null = null;

      if (preferred === "mapbox") {
        result = await fetchMapboxRoute(fromLat, fromLng, toLat, toLng, signal);
        if (!result) {
          result = await fetchOSRMRoute(fromLat, fromLng, toLat, toLng, signal);
        }
      } else {
        result = await fetchOSRMRoute(fromLat, fromLng, toLat, toLng, signal);
        if (!result && isMapboxAvailable()) {
          result = await fetchMapboxRoute(fromLat, fromLng, toLat, toLng, signal);
        }
      }

      // Auto-cache successful route
      if (result) {
        setCachedRoute(fromLat, fromLng, toLat, toLng, {
          coords: result.coords,
          distanceKm: result.distanceKm,
          durationMin: result.durationMin,
          steps: result.steps,
        });
      }

      return result;
    } finally {
      inflightRequests.delete(key);
      if (activeAbortController === controller) {
        activeAbortController = null;
      }
    }
  })();

  inflightRequests.set(key, promise);
  return promise;
}
