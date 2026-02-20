/**
 * Geocoding and address type-ahead via Nominatim (OpenStreetMap).
 * Used for mosque search, city/location search in Onboarding and Settings.
 */

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

export interface LocationSuggestion {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
}

/**
 * Fetch address/place suggestions for type-ahead. Use with debounced input (e.g. 300ms).
 * Min 2 characters recommended. Pass `nearLat/nearLng` to bias results toward a location.
 */
export async function fetchLocationSuggestions(
  query: string,
  limit = 8,
  nearLat?: number,
  nearLng?: number,
): Promise<LocationSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params: Record<string, string> = {
    q,
    format: "json",
    limit: String(limit),
    addressdetails: "1",
  };

  // Bias results toward a reference point using a ~50km viewbox
  if (nearLat != null && nearLng != null && Number.isFinite(nearLat) && Number.isFinite(nearLng)) {
    const delta = 0.45; // ~50 km
    params.viewbox = `${nearLng - delta},${nearLat + delta},${nearLng + delta},${nearLat - delta}`;
    params.bounded = "0"; // soft-bias: fall back outside viewbox if no results inside
  }

  const fetchOpts: RequestInit = {
    headers: { Accept: "application/json", "Accept-Language": "en" },
  };
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    fetchOpts.signal = AbortSignal.timeout(8000);
  }
  const res = await fetch(`${NOMINATIM_SEARCH}?${new URLSearchParams(params)}`, fetchOpts);
  if (!res.ok) return [];
  let data: Array<{ lat: string; lon: string; display_name: string; address?: Record<string, string> }>;
  try {
    const raw = await res.json();
    data = Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
  return data
    .map((d) => {
      const lat = parseFloat(d.lat);
      const lng = parseFloat(d.lon);
      return {
        displayName: d.display_name,
        shortName: (d.address?.house_number
          ? `${d.address.house_number} ${d.address.road || d.address.street || ""}`.trim()
          : d.address?.road || d.address?.city || d.address?.town || d.address?.village || d.display_name.split(",")[0] || d.display_name
        ).trim(),
        lat,
        lng,
      };
    })
    .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng) && x.lat >= -90 && x.lat <= 90 && x.lng >= -180 && x.lng <= 180);
}

/**
 * Reverse geocode lat/lng to a display name (e.g. for "current location" label).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
  });
  const reverseOpts: RequestInit = {
    headers: { Accept: "application/json", "Accept-Language": "en" },
  };
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    reverseOpts.signal = AbortSignal.timeout(5000);
  }
  const res = await fetch(`${NOMINATIM_REVERSE}?${params}`, reverseOpts);
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string; address?: Record<string, string> };
  const addr = data.address;
  const city = addr?.city || addr?.town || addr?.village || addr?.county;
  if (city) return city;
  if (data.display_name) return data.display_name.split(",").slice(0, 3).join(", ");
  return null;
}
