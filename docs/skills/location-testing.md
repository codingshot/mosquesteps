# Location testing skill

**When to use:** Testing or changing location features: GPS vs IP vs city priority, address/city type-ahead, mosque search, map center, onboarding/Settings location. Ensures location resolution, geocode, and UX work correctly.

---

## What to check

- **Location priority**: Dashboard and prayer-time flows use **current location (GPS) first**, then **IP geolocation**, then **saved or entered city**, then fallback (e.g. Makkah). No use of saved city before attempting GPS/IP when that would bypass “my location.”
- **IP geolocation**: `getIPGeolocation()` returns `{ lat, lng, city, timezone }` or null; cached for 24h; used when GPS is unavailable or denied.
- **Address/city type-ahead**: Nominatim-based suggestions (e.g. `fetchLocationSuggestions`) with min 2 chars, debounce (~300ms), limit 6–8; used in MosqueFinder, Onboarding, Settings. Empty query or API error yields no crash and no stale suggestions.
- **Mosque finder**: Search input shows suggestions; “Use my location” appears at top when GPS or IP position is available; selecting suggestion centers map and runs nearby mosque search. Initial map center: saved city/home if set, else IP location, then GPS overrides when available.
- **Onboarding**: Location step pre-fills city from IP when no city set; city input has type-ahead dropdown; “Use Current Location” (GPS) and manual city search both update city/lat/lng/timezone.
- **Settings**: City/location input has type-ahead; “Use Current Location” and manual search both work; timezone and regional defaults applied when city changes.
- **Geocode helper**: `src/lib/geocode.ts` — `fetchLocationSuggestions(query, limit)` returns `LocationSuggestion[]` with `displayName`, `shortName`, `lat`, `lng`; handles empty query, timeout, non-OK response. No raw fetch in duplicate places; shared helper used everywhere.
- **Edge cases**: Empty or invalid Nominatim response; geolocation denied; IP fetch fails; user clears location permission; very long city names don’t break UI.

---

## Where to look

| Area | Path |
|------|------|
| Geocode / type-ahead | `src/lib/geocode.ts` (fetchLocationSuggestions, reverseGeocode) |
| IP geolocation | `src/lib/prayer-times.ts` (getIPGeolocation) |
| Location priority | `src/pages/Dashboard.tsx` (useEffect: GPS → fallbackToIPOrCity) |
| Mosque finder search | `src/pages/MosqueFinder.tsx` (handleSearchInputChange, selectSuggestion, IP init effect, GPS effect) |
| Onboarding location | `src/pages/Onboarding.tsx` (step 1: IP pre-fill, handleCityInputChange, selectCitySuggestion) |
| Settings location | `src/pages/Settings.tsx` (handleCityInputChange, selectCitySuggestion, handleUseCurrentLocation) |
| Tests | `src/test/geocode.test.ts` (fetchLocationSuggestions, reverseGeocode), `src/test/location.test.ts` (getIPGeolocation, cache) |

---

## How to iterate

1. **Unit tests**: Add `src/test/geocode.test.ts` — mock fetch for Nominatim; test `fetchLocationSuggestions` with empty query, short query (< 2 chars), valid response shape, timeout/error. Test `getIPGeolocation` (or prayer-times) with mocked fetch if not already covered.
2. **Priority tests**: In a test that mounts Dashboard (or mocks it), assert that when geolocation is denied/unavailable, fallback runs (IP then city); when geolocation succeeds, loadPrayers is called with GPS coords. Mock `navigator.geolocation` and `getIPGeolocation`.
3. **Type-ahead behavior**: Test that typing in city/location input triggers debounced fetch and that selecting a suggestion applies lat/lng/city (and timezone where applicable). Mock `fetchLocationSuggestions` or fetch.
4. **Manual test**: Set location (GPS, then deny and confirm IP/city fallback); use mosque search type-ahead and “Use my location”; run onboarding location step and Settings city; confirm no duplicate or missing API calls (e.g. single IP fetch per session where expected).
5. **Document**: Keep this skill and changelog updated when adding new location sources or changing priority order.
