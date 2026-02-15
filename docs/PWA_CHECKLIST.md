# PWA Improvement Checklist

Implementation status for MosqueSteps Progressive Web App support.

## Completed

- [x] **Manifest enhancements**
  - `id` for web app identity
  - `display_override: ["standalone", "browser"]`
  - `prefer_related_applications: false`
  - `shortcuts` for Start Walk, Mosque Finder, Dashboard

- [x] **Service worker update prompt**
  - `registerType: "prompt"` so users can choose when to reload
  - `registerSW` with `onNeedRefresh` — toast with "Reload" button
  - `onOfflineReady` — toast when app is ready to work offline
  - `cleanupOutdatedCaches: true`

- [x] **iOS / Safari meta tags**
  - `apple-mobile-web-app-capable`
  - `apple-mobile-web-app-title`
  - `apple-mobile-web-app-status-bar-style`
  - `apple-touch-icon` with sizes

- [x] **Install prompt on Dashboard**
  - Shown after first completed walk OR 2nd visit
  - Dismissible with 7-day cooldown
  - Uses `usePWAInstall` for Android/desktop, custom instructions for iOS

- [x] **Runtime caching**
  - Prayer times (Aladhan)
  - Mosque search (Overpass)
  - Geocoding (Nominatim)
  - Map tiles (OpenStreetMap)
  - Routes (OSRM)
  - **TimeAPI.io** (timezone)
  - **Google Fonts** (CSS + webfonts)

- [x] **Site-wide offline banner**
  - Amber banner when `navigator.onLine === false`
  - Explains cached data is available

- [x] **iOS detection in usePWAInstall**
  - `showIOSInstructions` for "Add to Home Screen" flow
  - `standalone` detection for iOS-in-standalone

## Future improvements

- [ ] **Screenshots in manifest** — for app store listings (requires actual images)
- [ ] **Maskable icons** — ensure 512×512 icon has safe zone
- [ ] **Install analytics** — track installs and dismissals
