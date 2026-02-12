# API testing skill

**When to use:** Testing or changing integration with OSRM, prayer-time APIs, Nominatim, or any external service. Ensures contracts, errors, and fallbacks are correct.

---

## What to check

- **OSRM (routing)**: Request URL uses correct path (`/route/v1/foot/`), coordinate order (lng,lat in URL), and params (`overview=full`, `steps=true`). Response: `code === "Ok"`, `routes[0]` exists, `geometry.coordinates` present. Handle `NoRoute`, empty routes, missing geometry, and network errors (return null or show toast).
- **Prayer times**: Correct coordinates and date/timezone passed; response parsed for timings and date; handle failure (show error or cached/fallback).
- **Nominatim (search)**: Search query encoded; results parsed for lat/lon/display_name; handle empty or error (toast or message).
- **Overpass (mosques)**: Query and parse for nodes/ways; handle empty or timeout (show “no mosques” or retry).
- **Contracts**: Assume APIs can change; validate response shape before use; avoid assuming optional fields exist.
- **Rate limits / abuse**: No unnecessary repeated calls; debounce search; use cached route when available.

---

## Where to look

| Area | Path |
|------|------|
| OSRM | `src/lib/routing.ts` (fetchWalkingRoute) |
| Prayer times | `src/lib/prayer-times.ts` (fetch, Aladhan or similar) |
| Mosque search / Overpass | `src/pages/MosqueFinder.tsx` (searchNearbyMosques, Nominatim, Overpass) |
| Caching | `src/lib/offline-cache.ts` (getCachedRoute, setCachedRoute, mosques) |
| Tests | `src/test/routing.test.ts`, any fetch mocks in tests |

---

## How to iterate

1. Unit test with mocks: `src/test/routing.test.ts` already mocks fetch for OSRM; add or extend tests for prayer-times and mosque search when you change them.
2. Test error paths: mock `fetch` to return 4xx/5xx or invalid JSON; assert app shows message and doesn’t crash.
3. Test response shape: mock minimal valid response; assert code only uses fields that exist (e.g. route.geometry?.coordinates).
4. Manually test with network throttling or offline to confirm fallbacks and toasts.
5. Document expected request/response for each API in this file or in code comments so future changes don’t break contracts.
