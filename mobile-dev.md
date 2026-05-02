# MosqueSteps — Native iOS & Android Build Specification

**Purpose:** Single source of truth to implement MosqueSteps on iOS and Android (or Capacitor-wrapped web) with **feature parity** to the production web app. Paste this into Replit (or any build environment) and treat each section as requirements.

### Official website (canonical root)

The **production web app** is served at the root domain **MosqueSteps.com**. Use this as the canonical origin for deep links, store listings, legal URLs, and downloading marketing/logo assets.

| Form | URL |
|------|-----|
| **Primary (recommended in docs & APIs)** | [https://mosquesteps.com](https://mosquesteps.com) |
| **Branded host (same site; DNS is case-insensitive)** | [https://MosqueSteps.com](https://MosqueSteps.com) |

All paths below are relative to that root (e.g. `/brand` → [https://mosquesteps.com/brand](https://mosquesteps.com/brand)).

**Repo:** [https://github.com/codingshot/mosquesteps](https://github.com/codingshot/mosquesteps)  
**Stack (web):** React 18, TypeScript, Vite, Tailwind, shadcn/ui, Leaflet, React Router, TanStack Query, localStorage-only persistence (no custom backend for core product).

---

## 1. Product definition

### 1.1 One sentence

MosqueSteps helps Muslims **walk to the mosque** with **prayer times**, **leave-by reminders**, **step tracking**, **routing**, **mosque discovery**, **local history/stats**, and **spiritual rewards (hasanat + badges)** — privacy-first, data stored on-device.

### 1.2 Official naming & voice

| Item | Value |
|------|--------|
| **App name** | MosqueSteps (one word, capital M and S) |
| **Short name** | MosqueSteps |
| **Tagline (marketing)** | Turn every step into a blessing |
| **Hero headline (landing)** | Walk in the Footsteps |
| **Voice** | Warm, encouraging, authentic, respectful |
| **Islamic copy** | Use “Allah” in Islamic contexts; use ﷺ after the Prophet when mentioned; hadiths must include **book + number**; link to **sunnah.com** for verification where applicable; avoid controversial fiqh topics |

### 1.3 PWA manifest (parity for store listing / splash)

| Field | Value |
|-------|--------|
| Full name | MosqueSteps — Track Your Blessed Walk |
| Description | Track your walking journey to the mosque, view prayer times, and discover spiritual rewards. Every step is a blessing. |
| `theme_color` | `#0D7377` |
| `background_color` | `#FFFCF0` |
| `start_url` (installed) | `/dashboard` |
| Orientation | portrait |
| Categories | lifestyle, health, education |

---

## 2. Brand & visual system

### 2.1 Typography

| Role | Font | Weights |
|-----|------|---------|
| Headings & UI | Plus Jakarta Sans | 400, 500, 600, 700, 800 |
| Arabic | Amiri | 400, 700 |
| System fallback | system-ui, sans-serif | — |

Load Plus Jakarta Sans + Amiri (e.g. Google Fonts). Share cards assume Plus Jakarta Sans on canvas.

### 2.2 Color tokens (HSL components for CSS variables)

Light mode (`:root`):

- `--background`: 42 100% 97% (cream page)
- `--foreground`: 215 30% 15%
- `--primary`: 174 80% 26% (teal — buttons, links)
- `--primary-foreground`: 42 100% 97%
- `--accent`: 39 95% 55% (gold — rewards, highlights)
- `--accent-foreground`: 215 30% 15%
- `--card`: 0 0% 100%
- `--muted-foreground`: 170 8% 40%
- `--destructive`: 0 84.2% 60.2%
- `--radius`: 0.75rem
- Extended: `--gold`, `--gold-light`, `--gold-dark`, `--teal-light`, `--teal-dark`, `--cream`, `--warning`, `--success`

Dark mode (`.dark`): invert to dark navy background `215 30% 8%`, cream text `42 100% 95%`, primary teal `174 70% 40%`, accent gold `39 90% 50%`, etc. (mirror `src/index.css`.)

### 2.3 Logo & icons (production URLs + repo)

Use the **live site** for store / splash / notification icons so native builds match the shipped PWA.

| Asset | Production URL (absolute) | Source in repo (if rebuilding) |
|-------|---------------------------|----------------------------------|
| **App / favicon PNG** (192×192, 512×512 in manifest) | [https://mosquesteps.com/favicon.png](https://mosquesteps.com/favicon.png) | Served from project root / `index.html` |
| **Vector favicon** | [https://mosquesteps.com/favicon.svg](https://mosquesteps.com/favicon.svg) | `public/favicon.svg` |
| **In-app / marketing logo** (bitmap) | *Shipped in app bundle* — mirror from repo: `src/assets/logo.png` | `src/assets/logo.png` |
| **Brand guidelines page** (copy, usage) | [https://mosquesteps.com/brand](https://mosquesteps.com/brand) | `src/pages/BrandPage.tsx` + `src/marketing/brand-guidelines.md` |

Equivalent links using the branded host: `https://MosqueSteps.com/favicon.png`, `https://MosqueSteps.com/brand`, etc.

**Rules:** Icon + wordmark “MosqueSteps”; minimum icon ~24px; keep spacing between icon and text. Do not distort aspect ratio; prefer PNG from production for pixel parity with the PWA.

### 2.4 Accessibility

- Target **WCAG AA** contrast.
- Minimum tap targets ~44px on primary actions (e.g. Rewards tabs).
- Support **light / dark / system** theme (`localStorage` key `mosquesteps_theme`: `light` | `dark` | `system`; on `system`, follow OS appearance).

### 2.5 Motion & battery

- Respect reduced motion where possible; app uses `shouldAnimate()` from battery/reduced-motion heuristics for some UI (e.g. bottom nav indicator).

---

## 3. Architecture & data (critical)

### 3.1 No accounts (by default)

- **All user data:** browser `localStorage` (native: `UserDefaults` / `SharedPreferences` / Capacitor Preferences) with the **same keys** for portability.
- **External calls:** read-only public APIs (prayer times, maps, geocode, routing). No MosqueSteps proprietary backend required for core flows.

### 3.2 Canonical `localStorage` keys

Implement read/write compatibility if migrating web → native:

| Key | Purpose |
|-----|---------|
| `mosquesteps_onboarded` | `"true"` when onboarding complete |
| `mosquesteps_onboarded_date` | ISO date of first completion |
| `mosquesteps_settings` | JSON `UserSettings` |
| `mosquesteps_history` | JSON array of `WalkEntry` |
| `mosquesteps_saved_mosques` | JSON array of `SavedMosque` |
| `mosquesteps_goals` | JSON `WalkingGoals` |
| `mosquesteps_notifications` | JSON array in-app notifications (max 200) |
| `mosquesteps_notification_settings` | JSON toggles |
| `mosquesteps_badges` | JSON map `badgeId → earned ISO date` |
| `mosquesteps_prayer_cache` | Prayer API cache blob |
| `mosquesteps_ip_geo` | IP geolocation cache + timestamp |
| `mosquesteps_mosque_cache` | Nearby mosque search cache |
| `mosquesteps_route_cache` | OSRM/Mapbox route cache |
| `mosquesteps_scheduled_reminders` | JSON `ScheduledReminder[]` |
| `mosquesteps_theme` | `light` \| `dark` \| `system` |
| `mosquesteps_mapbox_token` | Optional Mapbox access token |
| `mosquesteps_routing_provider` | `osrm` \| `mapbox` (Mapbox only if token present) |

### 3.3 Core types (implement equivalent models)

**`WalkEntry`:** `id`, `date` (ISO), `mosqueName`, `distanceKm`, `steps`, `walkingTimeMin`, `hasanat`, `prayer`.

**`SavedMosque`:** `id`, `name`, `lat`, `lng`, `distanceKm`, optional `isPrimary`, `isFavorite`, `priority`, `address`, `phone`, `website`, `openingHours`.

**`UserSettings` (merge with defaults; validate on save):**

- `walkingSpeed` (km/h, clamp 0.5–20, default 5)
- `selectedMosqueName`, `selectedMosqueDistance` (km, 0–100), `selectedMosqueLat`, `selectedMosqueLng`
- `cityName`, `cityLat`, `cityLng`, `cityTimezone` (IANA)
- `distanceUnit`: `km` | `mi`; `speedUnit`: `kmh` | `mph`; `smallDistanceUnit`: `m` | `ft`; `timeFormat`: `12h` | `24h`
- `strideLength` (m, clamp ~0.3–2.0)
- `homeAddress`, `homeLat`, `homeLng`
- `prayerPreferences`: string[] (default five daily)
- `optionalPrayers`: e.g. Taraweeh, Tahajjud, Witr, Qiyam, Jumuah
- `ramadanMode`: boolean
- `prayerCalculationMethod`: key from method table (e.g. `ISNA`)
- `prayerMosques`: map prayer name → mosque id
- Notifications: `notifyMinutesBefore` (0–120), `notifyLeaveByEnabled`, `notifyPrayerTimeEnabled`, `notifyMinutesBeforePrayer`
- Profile: `age` (5–120), `gender`, `bodyWeightKg`, `advancedMetricsMode`

**`WalkingGoals`:** `dailySteps` (default 5000), `weeklyWalks` (10), `monthlyDistance` km (20).

**`WalkingStats` (derived from history):** `totalSteps`, `totalDistance`, `totalHasanat`, `totalWalks`, `currentStreak`, `longestStreak`, `walksByPrayer`, `ramadanWalks`, `fridayWalks`, `fajrThisWeek`, `jumuahStreak`.

**`AppNotification`:** `id`, `type` (`prayer_reminder` \| `walk_complete` \| `streak` \| `badge` \| `weekly_summary` \| `checkin` \| `goal` \| `health_tip` \| `system`), `title`, `body`, `read`, `timestamp`, optional `data`, `issueUrl`.

**`ScheduledReminder`:** `prayerName`, `reminderAt` (unix ms), `kind`: `leave_by` | `prayer_time`.

### 3.4 Domain formulas (must match web)

- **Leave-by time:** `prayerTimeMinutes - walkingMinutes - 5` (fixed **5 minute** buffer); wrap past midnight (+24h).
- **Minutes until leave:** compare “now” in **user’s prayer timezone** to leave-by; if leave-by already passed today, add 24h to leave window.
- **Estimated steps from distance:** `round(distanceKm * 1333)`.
- **Walking time from distance:** `round((distanceKm / speedKmh) * 60)` minutes.
- **Hasanat:** `steps * 2` (displayed on walk completion; aligns with app messaging).
- **Haversine km:** standard Earth radius 6371 between two WGS84 points.
- **Streaks:** use **local calendar date** of walk `date` in device/city interpretation as web does (`getWalkingStats`).

---

## 4. External APIs & contracts

### 4.1 Prayer times — Aladhan

- **URL:** `GET https://api.aladhan.com/v1/timings/{DD}-{MM}-{YYYY}?latitude={lat}&longitude={lng}&method={methodId}`
- **Default `methodId`:** `2` (ISNA).
- **Prayers shown in app:** Fajr, Dhuhr, Asr, Maghrib, Isha (plus optional/voluntary flows in settings/onboarding).
- **Arabic names map:** Fajr الفجر, Dhuhr الظهر, Asr العصر, Maghrib المغرب, Isha العشاء.
- **“Today” for `isPast`:** use **timezone-aware** date parts for the selected city (`getDatePartsInTimezone`).
- **Cache:** 6 hours per rounded lat/lng + date + timezone + method (`mosquesteps_prayer_cache`).

**Calculation methods (`PRAYER_CALCULATION_METHODS`):** MWL=3, ISNA=2, Egypt=5, Makkah=4, Karachi=1, Tehran=7, Jafari=0, Gulf=8, Kuwait=9, Qatar=10, Singapore=11, France=12, Turkey=13 — each with human-readable name, region, description (expose in Settings).

### 4.2 Timezone from coordinates

- **Primary:** `GET https://timeapi.io/api/timezone/coordinate?latitude={lat}&longitude={lng}` → `timeZone` string.
- **Fallback:** longitude-based `Etc/GMT±…` heuristic if fetch fails.

### 4.3 IP geolocation (no GPS)

- **Primary:** `https://ipapi.co/json/` (timeout ~5s).
- **Fallback:** `https://ip-api.com/json/?fields=lat,lon,city,timezone`
- **Cache:** 24h (`mosquesteps_ip_geo`).

### 4.4 Geocoding / search — Nominatim (OpenStreetMap)

- **Search:** `https://nominatim.openstreetmap.org/search` with `q`, `format=json`, `limit`, `addressdetails=1`, optional `viewbox` + `bounded=0` for biasing ~50km.
- **Reverse:** `https://nominatim.openstreetmap.org/reverse`
- **Rules:** debounce ~300ms; min query length **2** chars; `encodeURIComponent`; Accept-Language `en`; 8s timeout pattern as web.
- **User-Agent policy:** comply with Nominatim/OSM usage policy (identify app; throttle).

### 4.5 Mosques — Overpass API

- **Servers (retry order):** `https://overpass-api.de/api/interpreter`, `https://overpass.kumi.systems/api/interpreter`
- **Behavior:** concentric radii 2 → 5 → 10 km; dedupe clusters; tags for names, `opening_hours`, phone, website, accessibility, wudu, parking, etc.; session cache; backoff retries.
- **Client cache:** `mosquesteps_mosque_cache`, TTL 24h (`offline-cache.ts`).

### 4.6 Walking routes

- **Default provider OSRM:**  
  `GET https://router.project-osrm.org/route/v1/foot/{fromLng},{fromLat};{toLng},{toLat}?overview=full&geometries=geojson&steps=true`  
  Expect `code === "Ok"`; geometry coordinates are **[lng, lat]** — convert to **[lat, lng]** for map polyline.
- **Optional Mapbox:** if `mosquesteps_mapbox_token` length > 10, allow `mapbox` provider:  
  `https://api.mapbox.com/directions/v5/mapbox/walking/{fromLng},{fromLat};{toLng},{toLat}?geometries=geojson&overview=full&steps=true&access_token=...`
- **Result shape:** `coords: [lat,lng][]`, `distanceKm`, `durationMin`, `steps[]` with `instruction`, `distance`, `duration`, `provider`.
- **Cache:** 7 days (`mosquesteps_route_cache`); dedupe in-flight requests; cancel stale with `AbortController`.

### 4.7 Map tiles

- **Default:** OpenStreetMap raster tiles `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (respect OSM tile policy).

---

## 5. Information architecture — routes

### 5.1 Primary app routes (authenticated-onboarding flow)

| Path | Screen |
|------|--------|
| `/` | Marketing landing (Hero, features, etc.) |
| `/onboarding` | First-run wizard |
| `/dashboard` | Home: today’s prayers, leave-by, links |
| `/mosques` | Mosque finder map + search + saved |
| `/walk` | Active walk (pre-walk, tracking, completion) |
| `/history` | Walk log |
| `/stats` | Aggregates, streaks, filters if present |
| `/rewards` | Badges + Hadiths tabs |
| `/settings` | All preferences |
| `/notifications` | In-app notification center |

### 5.2 Content & legal

| Path | Purpose |
|------|---------|
| `/privacy`, `/terms`, `/legal` | Legal copy |
| `/guides`, `/guides/:guideId` | User guides |
| `/faq`, `/how-it-works`, `/sunnah` | Education |
| `/blogs`, `/blogs/:slug` | Blog |
| `/brand` | Brand guidelines page |
| `/contribute`, `/issues`, `/changelog`, `/content` | OSS / meta |

### 5.3 Redirects (must preserve slugs where noted)

- `/blog` → `/blogs`; `/blog/:slug` → `/blogs/:slug`
- `/blg`, `/bloggs` → `/blogs`
- `/mosque`, `/mosque-finder`, `/find-mosque`, `/masjid` → `/mosques`
- `/faqs` → `/faq`
- `/contribution` → `/contribute`
- `/changlog` → `/changelog`
- `/gides`, `/gude`, `/guide` → `/guides`
- Unknown → **404** with recovery links (“Quick actions”).

### 5.4 Bottom navigation

**Tabs (order):** Home `/dashboard`, Mosques `/mosques`, **Walk** `/walk` (elevated center FAB style), Stats `/stats`, Rewards `/rewards`.

**Hidden on paths:** `/`, `/onboarding`, `/privacy`, `/terms`, `/legal`, `/guides`, `/faq`, `/how-it-works`, `/sunnah`.

**Special:** On `/dashboard`, show fixed **“Walk Now”** bar above tab bar linking to `/walk`.

---

## 6. Onboarding (first run)

### 6.1 Completion gate

- `hasCompletedOnboarding()` → `localStorage.mosquesteps_onboarded === "true"`.
- If user opens app and flag is false, route to `/onboarding` (web may deep-link from marketing; native should default to onboarding until complete).

### 6.2 Steps (in order)

1. **Welcome** — MosqueSteps title, value prop, Get Started.
2. **Location** — “Set Your Location”: **Use Current Location** (GPS), or **city type-ahead** (Nominatim, 2+ chars, debounced). Optional **home address** type-ahead. Pre-fill city from **IP geolocation** when no saved city. On select/GPS: resolve **timezone** (`fetchTimezone`), save `cityName`, `cityLat`, `cityLng`, `cityTimezone`, optional home fields.
3. **Prayers** — Choose which obligatory prayers user walks to (checkboxes); optional voluntary prayers; Ramadan mode toggle; persist `prayerPreferences`, `optionalPrayers`, `ramadanMode`.
4. **Mosque** — Link to finder or skip; can save primary mosque later.
5. **Notifications** — Explain prayer reminders; **Enable** (system permission) or **Skip**; then `markOnboardingComplete()` + `saveSettings` + navigate **`/dashboard`**.

### 6.3 Optional prayers catalog (ids)

Taraweeh (ramadanOnly), Tahajjud, Witr, Qiyam (Qiyam al-Layl), Jumuah — each with label, Arabic, icon emoji, short description, cited hadith string for UI.

---

## 7. Screen-by-screen behavior

### 7.1 Dashboard

- Fetch prayer times for **location priority:** GPS (if permitted & fresh) → **IP** → **saved city** → **Makkah** fallback coords.
- List **today’s** prayers with time, **Leave by** (from walking time + buffer), **Walk** CTA per prayer → `/walk?prayer=...` (or equivalent state).
- Live clock in **city timezone**.
- If **all prayers past** for today, show **tomorrow’s** prayers (`isNextDay` pattern from prayer fetch).
- Links: Settings, Notifications (show **unread count** if > 0), optional badges preview.
- Respect `prayerPreferences` + optional prayers for which rows appear.

### 7.2 Mosque finder

- **Map:** Leaflet (or native map with same behaviors): center from saved city / user / default.
- **Nearby:** Overpass query; list + markers; sort by distance; show facilities, open/closed heuristic, contact fields when present.
- **Search:** placeholder “Search mosque, city, or address…”; suggestions + Search button; “Use my location” when GPS/IP available.
- **Select mosque:** fetch walking route from user position (or home) to mosque; show distance, duration, steps estimate, **Walk There Now** (sets primary + navigates to walk).
- **Saved tab:** list saved; **Set Primary**, **Remove**; favorites + reorder optional (web has `toggleFavoriteMosque`, `recomputeMosqueDistancesFromHome` when home set).
- **Open in Maps:** deep link to Apple Maps / Google Maps geo or directions.

### 7.3 Active walk

- **Pre-walk:** prayer selector; if **no mosque**, empty state with CTA to finder.
- **Start:** begin GPS tracking + step counter (see §8).
- **During:** show live steps, distance, map with route polyline, **turn-by-turn** (current step, distance, next preview); **off-route** if > **100 m** from route — offer reroute.
- **Pause / Resume:** pause freezes step/GPS aggregation; resume continues.
- **Voice toggle:** read aloud turn instructions when enabled (native TTS).
- **Return route:** “Walk back” fetches reverse route.
- **End walk:** stop tracking; **completion** screen with steps, distance, hasanat, time; actions: **Share Card** (image), **Share Text**, **Check In** if within **100 m** of mosque (persist check-in, toast), **New Walk**, **View History**.
- **Persist walk:** append `WalkEntry` to history; trigger badge/notification side effects as web.

### 7.4 History

- Reverse-chronological list: date, mosque, prayer, steps, distance, hasanat.
- Empty state + CTA to start first walk.
- Delete entry → updates stats.

### 7.5 Stats

- Totals: steps, distance, hasanat, walking time.
- Streaks: current + longest.
- Breakdown by prayer; period filters **if** present in web build (verify `Stats.tsx`).

### 7.6 Rewards

- Header: spiritual framing + badge count + total hasanat.
- **Tabs:** Badges \| Hadiths (a11y: `tablist` / `tab` / `tabpanel`, min height ~44px).
- **Badges:** show all definitions with progress bar, earned state, categories (`BADGE_CATEGORIES`).
- **Hadiths:** static content + link “Explore more on Sunnah.com”.
- Link back to Dashboard.

**Badge definitions (ids and targets) — implement exactly:**

| id | Target metric |
|----|----------------|
| first_steps | 1 walk |
| ten_walks | 10 walks |
| fifty_walks | 50 |
| hundred_walks | 100 |
| three_hundred | 300 |
| week_warrior | current streak 7 |
| two_weeks | longest streak 14 |
| month_strong | longest 30 |
| three_months | longest 90 |
| thousand_steps | total steps 1,000 |
| ten_k | 10,000 |
| hundred_k | 100,000 |
| million_steps | 1,000,000 |
| distance_5km | total distance 5 km |
| distance_marathon | 42 km |
| distance_100km | 100 km |
| five_prayers | **Parity with web:** `min(Object.keys(walksByPrayer).length, 5) >= 5` — i.e. cumulative distinct prayer names with ≥1 walk each (copy web logic even though copy says “single day”) |
| fajr_hero / fajr_master | Fajr walks 10 / 30 |
| isha_light / isha_guardian | Isha 10 / 30 |
| jumuah_regular / jumuah_faithful | Jumuah 4 / 12 |
| darkness_walker | Fajr + Isha count ≥ 20 |
| ramadan_walker / ramadan_devoted / ramadan_champion | Ramadan walks 1 / 10 / 30 |
| hasanat_10k / hasanat_100k / hasanat_million | total hasanat thresholds |
| early_bird | `fajrThisWeek` ≥ 5 |
| friday_streak | `jumuahStreak` ≥ 4 |

**Ramadan detection:** `Intl` Islamic calendar month === 9.

**Earned dates:** stored in `mosquesteps_badges` when first earned.

### 7.7 Notifications (in-app)

- List with filters: **type**, **read/unread**, sort newest/oldest.
- Mark read / unread; mark all read; clear all.
- Empty state copy.
- Settings panel respects `NotificationSettings` keys.

### 7.8 Settings

- Location: GPS, city type-ahead, timezone updates.
- Notifications: toggles + deep link to **system** notification settings.
- Theme: Light / Dark / System.
- Units: distance, speed, small distance, time format.
- Walking speed (affects leave-by and ETA).
- Prayer calculation method selector.
- Mapbox token + routing provider (advanced).
- Ramadan mode, optional prayers, age/gender/weight/advanced metrics as in web.
- **Autosave** after debounce on changes.

### 7.9 Landing (`/`)

- Marketing only; CTAs to onboarding or dashboard as appropriate.

### 7.10 SEO (web only / optional native)

- Per-route titles/descriptions; FAQ JSON-LD on FAQ page.

---

## 8. Sensors, steps, and motion

### 8.1 Priority order (match web intent)

1. **Accelerometer API** (where OS exposes it) with permission.
2. **Device motion** events.
3. **GPS distance** estimation fallback when motion unavailable.

### 8.2 Step detection parameters (web `AccelerometerStepDetector`)

- Peak threshold ~**1.2 m/s²** above gravity; min interval **250 ms**; max **3500 ms** between steps; ignore non-finite or absurd magnitude.

### 8.3 Pace categories (`getPaceCategory`)

Map steps/min to Stationary / Slow / Dignified / Brisk / Too Fast for UI hints.

### 8.4 Permissions copy (for App Store / Play)

- **Location when in use:** find mosques, track walk, leave-by accuracy.
- **Location always (optional):** only if you implement background walk tracking (web PWA is limited; native may request).
- **Motion & fitness:** step counting.
- **Notifications:** prayer and walk reminders.

**iOS `Info.plist` examples:** `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` (if needed), `NSMotionUsageDescription`.

**Android manifest:** `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACTIVITY_RECOGNITION`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED` (if rescheduling alarms), `SCHEDULE_EXACT_ALARM` (if exact alarms).

---

## 9. Notifications logic (native parity)

- **Browser web:** `Notification` API + `serviceWorker.showNotification` fallback; scheduled reminders in `mosquesteps_scheduled_reminders`; polling interval respects battery (`getNotificationPollInterval`).
- **Native:** use **UNUserNotificationCenter** / **AlarmManager** or **WorkManager** + channels to replicate:
  - **Leave-by reminders** (`notifyLeaveByEnabled`, `notifyMinutesBefore`)
  - **Prayer-time reminders** (`notifyPrayerTimeEnabled`, `notifyMinutesBeforePrayer`)
- On fire: optionally add row to in-app `mosquesteps_notifications` for history.
- Respect `getNotificationSettings()` toggles.

---

## 10. Sharing

- **Share card:** 1080×1080 canvas; gradient `#094D4F` → `#0D7377`; gold accents `#FABB51` / `#C78B08`; MosqueSteps label; emoji 🕌; title/subtitle; stat chips; optional hadith footer; export PNG **blob** → native share sheet.
- **Share text:** plain-language summary of walk stats + app name.

---

## 11. Internationalization

- Web includes `src/lib/i18n.ts` with locales: **en, ar, ur, ms, tr** and keys for nav, dashboard, prayers, etc.
- Native build should either wire same translation table or default **en** with structure ready for parity.

---

## 12. Security & validation

- **XSS:** strip/sanitize `<>` in user-visible strings from storage; mosque names / prayers sanitized on save (`sanitizeString` pattern).
- **Numeric sanity:** clamp distances, coords, ages, weights as web `saveSettings`.
- **Corrupted JSON in storage:** catch → fall back to defaults; **never crash** app on parse errors.
- **Rate limits:** respect third-party APIs; cache aggressively.

---

## 13. Edge cases checklist

- [ ] No network: show offline banner; use cached prayer/route/mosque where available; disable actions that require live route.
- [ ] Prayer API failure: user-facing error, retry, optional Makkah fallback for times only if product allows.
- [ ] OSRM returns `NoRoute` / empty geometry: null route → toast + “Open in Maps” fallback.
- [ ] User denies location: degrade to IP/saved city; walk tracking limited.
- [ ] User mid-walk kills app: recover state if implementing persistence; minimum: don’t corrupt history.
- [ ] **Midnight wrap** for leave-by math.
- [ ] **Timezone invalid** → device local fallback.
- [ ] **localStorage quota** on web: saves fail silently — on native prefer larger quota.
- [ ] **High latitude** prayer methods: user picks method in settings.
- [ ] **Duplicate mosque IDs** from Overpass: dedupe as web.
- [ ] **Invalid blog/guide slug:** 404 or redirect to list (`GuidePage` invalid id → `/guides`).
- [ ] **Deep links:** `/walk`, `/mosques`, `/dashboard` should open correct tab stack.

---

## 14. Native implementation paths

### 14.1 Recommended: Capacitor (thin native shell)

- Wrap existing Vite `dist/`; reuse React UI + Leaflet.
- Plugins: Geolocation, Local Notifications, Haptics, Share, Preferences (mirror `localStorage`), Splash, StatusBar.
- Remove dev `server.url` for production; ship bundled assets.
- Effort: **days** to first store build vs **months** for full React Native rewrite.

### 14.2 Full native / Flutter / SwiftUI / Kotlin

- Reimplement every screen in §7 with same storage keys and formulas.
- Replace Leaflet with MapKit / Google Maps; reimplement routing polyline decoding; reimplement share canvas.
- Effort: large; use this doc as acceptance checklist.

### 14.3 React Native (Expo)

- **Not** drop-in: all DOM/Leaflet/Tailwind must be rewritten; only choose if Capacitor cannot meet product goals.

---

## 15. Definition of Done (ship criteria)

### 15.1 Build & quality

- [ ] App installs and launches on **iOS** and **Android** without debugger attached.
- [ ] `npm run build` equivalent succeeds; no blocking linter errors on shared logic if shared.
- [ ] Automated tests: where logic is ported, port or rewrite Vitest suites for **prayer math**, **routing parsing**, **geocode**, **stats/streaks**, **badges**, **security sanitization** (see `src/test/*.ts`).

### 15.2 Functional acceptance (user journeys)

1. Fresh install → onboarding → dashboard shows plausible prayer times for selected city.
2. Save a mosque → set primary → walk flow shows route → complete walk → appears in history + stats + hasanat + badges update.
3. Deny notifications → app still usable; reminders disabled gracefully.
4. Deny location → IP/city fallback works.
5. Offline mode: cached content visible; no white-screen crashes.
6. Theme toggle persists across relaunch.
7. Share sheet receives image and/or text from completion.
8. All **§5 routes** reachable; redirects match; 404 for unknown URLs.
9. Legal pages accessible; hadiths show sources.

### 15.3 Store compliance

- [ ] Privacy policy URL (matches `/privacy` content).
- [ ] Accurate permission strings (no over-claiming background location).
- [ ] Content rating appropriate for religious/educational app.
- [ ] Third-party attribution (OSM, Nominatim, Aladhan, OSRM, Mapbox optional) in **Legal / Open source** screen as web.

### 15.4 Performance

- [ ] Cold start < 3s on mid-range device (target).
- [ ] Map and lists scroll at 60fps where possible.
- [ ] No main-thread ANRs on Android during prayer fetch + map render.

---

## 16. GitHub issue templates (for in-app “report” links)

Base repo: `https://github.com/codingshot/mosquesteps`

Issue query templates used in app: `bug_report.md`, `feature_request.md`, `mosque_data.md`, `content_issue.md`, `prayer_times.md` (paths under `.github/ISSUE_TEMPLATE/`).

---

## 17. Out of scope / non-goals (unless product changes)

- Social network / following friends.
- Cloud sync of walks across devices (not in core web app).
- Imam live streaming.
- Paid subscriptions (web is free).

---

## 18. Quick reference — default numerical constants

| Constant | Value |
|----------|--------|
| Default walking speed | 5 km/h |
| Leave-by buffer | 5 minutes |
| Steps per km estimate | 1333 |
| Hasanat per step | 2 |
| Check-in radius | 100 m |
| Off-route threshold | 100 m |
| Prayer cache TTL | 6 h |
| IP geo cache TTL | 24 h |
| Mosque cache TTL | 24 h |
| Route cache TTL | 7 days |
| Max stored notifications | 200 |
| Aladhan default method | 2 (ISNA) |

---

*This document was generated from the MosqueSteps web codebase (`src/App.tsx`, `src/lib/*`, `src/pages/*`, `docs/features-master-list.md`, `src/marketing/brand-guidelines.md`, `vite.config.ts`, `tailwind.config.ts`). If web behavior changes, update this file in the same PR.*
