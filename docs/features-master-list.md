# MosqueSteps — Features Master List

Every feature in the app with **expected outputs** for use as a test guide. Each row can be traced to automated tests via the **Test reference** column.

**How to use**
- **Manual QA:** Walk through each feature and verify expected output.
- **Automated:** Run `npm run test:features` (or `npm test -- --run`) and cross-check with this list; see `docs/features-test-map.json` for feature → test mapping.
- **Coverage:** Add tests for any feature whose Test reference is empty or "—".

---

## Legend

| Column | Meaning |
|--------|--------|
| **ID** | Unique feature ID (use in test map and changelog). |
| **Expected output** | What the user or system should see/get; acceptance criteria. |
| **Test reference** | `file` or `file › describe › it` that validates this feature. |

---

## 1. Navigation & routes

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| NAV-001 | Landing page (/) | Hero with headline "Walk in the Footsteps", CTAs (Start, Learn More). | page-loads.test.tsx › Index (/) loads |
| NAV-002 | /onboarding | Welcome/Get started or location step; progress bar; skip available. | page-loads.test.tsx › Onboarding loads |
| NAV-003 | /dashboard | Dashboard/Prayer/Leave by/walk visible; prayer list or loading. | page-loads.test.tsx › Dashboard loads |
| NAV-004 | /mosques | Find/mosque/Near/search visible; map or list. | page-loads.test.tsx › Mosque finder loads |
| NAV-005 | /walk | Start walk / Find mosque / Steps / Distance visible. | page-loads.test.tsx › Active walk loads |
| NAV-006 | /history | History/walk/Walks visible. | page-loads.test.tsx › History loads |
| NAV-007 | /stats | Stats/Steps/Streak/Distance visible. | page-loads.test.tsx › Stats loads |
| NAV-008 | /rewards | Reward/hasanat/step visible; badges or hadiths. | page-loads.test.tsx › Rewards loads |
| NAV-009 | /settings | Settings/Location/Notification/Walking visible. | page-loads.test.tsx › Settings loads |
| NAV-010 | /privacy | Privacy Policy, Overview. | page-loads.test.tsx › Privacy loads |
| NAV-011 | /terms | Terms of Service, Disclaimer. | page-loads.test.tsx › Terms loads |
| NAV-012 | /legal | Legal, Open Source, Attribution. | page-loads.test.tsx › Legal loads |
| NAV-013 | /guides | User Guides, Getting Started. | page-loads.test.tsx › Guides loads |
| NAV-014 | /guides/:guideId | Guide title and steps (e.g. Getting Started). | page-loads.test.tsx › Guide page loads |
| NAV-015 | /faq | FAQ, Frequently, Question. | page-loads.test.tsx › FAQ loads |
| NAV-016 | /how-it-works | How it works, Walk, mosque. | page-loads.test.tsx › How it works loads |
| NAV-017 | /sunnah | Sunnah, Hadith, step, walk. | page-loads.test.tsx › Sunnah loads |
| NAV-018 | /blogs | MosqueSteps Blog, Blog. | page-loads.test.tsx › Blog loads |
| NAV-019 | /blogs/:slug | Post title/content (e.g. Virtues, Walking, Mosque). | page-loads.test.tsx › Blog post loads |
| NAV-020 | /brand | Brand, MosqueSteps, Guidelines. | page-loads.test.tsx › Brand loads |
| NAV-021 | /notifications | Notification, Alert, reminder. | page-loads.test.tsx › Notifications loads |
| NAV-022 | /contribute | Contribute, contribution, open source. | page-loads.test.tsx › Contribute loads |
| NAV-023 | /issues | Issue, GitHub, bug, feature. | page-loads.test.tsx › Issues loads |
| NAV-024 | /changelog | Changelog, What's new, Unreleased. | page-loads.test.tsx › Changelog loads |
| NAV-025 | /content | Content, Blog, FAQ, Guide. | page-loads.test.tsx › Content loads |
| NAV-026 | Unknown path (*) | 404, page doesn't exist, Quick actions. | page-loads.test.tsx › NotFound loads |
| NAV-027 | /blog → /blogs | Redirect to /blogs. | routes.test.tsx › redirects /blog to /blogs |
| NAV-028 | /mosque → /mosques | Redirect to /mosques. | routes.test.tsx › redirects /mosque to /mosques |
| NAV-029 | /changlog → /changelog | Redirect to /changelog. | routes.test.tsx › redirects /changlog |
| NAV-030 | /faqs → /faq | Redirect to /faq. | routes.test.tsx › redirects /faqs |
| NAV-031 | /contribution → /contribute | Redirect to /contribute. | routes.test.tsx › redirects /contribution |
| NAV-032 | /guide, /gude, /gides → /guides | Redirect to /guides. | routes.test.tsx › redirects /gides, /guide, /gude |
| NAV-033 | Bottom nav | Home, Mosques, Walk (center), Stats, Rewards; hidden on /, /onboarding, legal, guides, faq, how-it-works, sunnah. | — |

---

## 2. Onboarding

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| ONB-001 | Welcome step | MosqueSteps title, description, Get Started CTA. | page-loads › Onboarding loads |
| ONB-002 | Location step | Set Your Location; Use Current Location; Or search city; optional home address. | — |
| ONB-003 | IP pre-fill | On location step, city pre-filled from IP when no saved city. | location-testing.md (manual) |
| ONB-004 | City type-ahead | Typing 2+ chars shows dropdown suggestions; select sets city + timezone. | — |
| ONB-005 | Use Current Location | GPS used; city/lat/lng/timezone set; toast with city name. | — |
| ONB-006 | Prayers step | Which prayers you walk to; checkboxes; Continue. | — |
| ONB-007 | Mosque step | Your mosque; link to find mosque or skip. | — |
| ONB-008 | Notifications step | Enable Notifications CTA; Skip for now / Finish. | — |
| ONB-009 | Complete onboarding | saveSettings + markOnboardingComplete; navigate to /dashboard. | — |

---

## 3. Dashboard

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| DSH-001 | Prayer times list | Today's prayers with time, leave-by, walk CTA per prayer. | page-loads › Dashboard loads |
| DSH-002 | Location priority | GPS first → then IP → then saved city → Makkah fallback. | — |
| DSH-003 | Set City | Link/button to set city; opens Settings or inline city search. | — |
| DSH-004 | Notifications link | To /notifications; aria-label; unread count when > 0. | — |
| DSH-005 | Settings link | To /settings; icon + label. | — |
| DSH-006 | Start walk (per prayer) | Navigate to /walk with prayer param. | — |
| DSH-007 | Live clock | Current time in city timezone. | — |
| DSH-008 | Next day prayers | When all today passed, show "Tomorrow's Prayers". | — |

---

## 4. Mosque finder

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| MSQ-001 | Map loads | Leaflet map; tile layer; center from saved city or IP or default. | page-loads › Mosque finder loads |
| MSQ-002 | Nearby mosques | Overpass query; list + markers; distance from home/user. | — |
| MSQ-003 | Search input | Placeholder "Search mosque, city, or address..."; 2+ chars trigger type-ahead. | — |
| MSQ-004 | Type-ahead suggestions | Up to 8 Nominatim results; "Use my location" first when GPS/IP available. | geocode.test.ts, location.test.ts |
| MSQ-005 | Select suggestion | Map centers; nearby mosques refetched; search box shows selection. | — |
| MSQ-006 | Search button | Geocode query; map centers; nearby mosques. | — |
| MSQ-007 | Select mosque | Route fetches (OSRM); distance/duration/steps; Walk There Now. | routing.test.ts |
| MSQ-008 | Walk There Now | Save mosque as primary + navigate to /walk. | extended-coverage › Saved Mosques |
| MSQ-009 | Save / Set Primary | Save mosque; set as primary; persisted in settings. | extended-coverage › Saved Mosques |
| MSQ-010 | Saved tab | List saved mosques; Set Primary, Remove. | extended-coverage › Saved Mosques |
| MSQ-011 | Route cache | Cached route reused; background revalidate when online. | — |
| MSQ-012 | Open in Maps | External map URL (geo or directions). | — |

---

## 5. Active walk

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| WLK-001 | Pre-walk screen | Start Walking; Open in Maps if mosque set; prayer selector. | page-loads › Active walk loads |
| WLK-002 | No mosque selected | Empty state: "Set your mosque to see walking distance, turn-by-turn directions, and leave-by time." + Find Mosque. | — |
| WLK-003 | Start Walking | Start GPS/sensors; show steps, distance, map, directions. | — |
| WLK-004 | Route fetch | OSRM route; coords [lat,lng]; steps; null on NoRoute/empty/fail → toast. | routing.test.ts |
| WLK-005 | Turn-by-turn | Current step instruction; distance; next step. | — |
| WLK-006 | Off route | Detection when >100m; reroute option; optional toast. | — |
| WLK-007 | Pause / Resume | Pause freezes tracking; Resume continues. | — |
| WLK-008 | End Walk | Stops tracking; completion screen with stats. | — |
| WLK-009 | Completion screen | Steps, distance, hasanat, time; Share Card, Share Text; Check In (if near mosque); New Walk, View History. | — |
| WLK-010 | Check-in | Within 100m of mosque; Check In at {name}; persisted; toast. | — |
| WLK-011 | Return route | Option "Walk back"; return route fetched and shown. | — |
| WLK-012 | Voice toggle | Turn-by-turn read aloud when enabled. | — |
| WLK-013 | Step count | From sensor if available else estimated from distance. | step-counter.test.ts |
| WLK-014 | Hasanat | 2 per step; displayed on completion. | prayer-times.test.ts › calculateHasanat |

---

## 6. History

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| HIS-001 | Walk list | Entries reverse chronological; date, mosque, prayer, steps, distance, hasanat. | walking-history.test.ts |
| HIS-002 | Empty state | Message + CTA "Start your first walk". | — |
| HIS-003 | Delete entry | Entry removed; list and stats update. | walking-history.test.ts › deletes |

---

## 7. Stats

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| STA-001 | Totals | Total steps, distance, hasanat, walking time. | walking-history.test.ts, extended-coverage |
| STA-002 | Streaks | Current streak, longest streak (consecutive days). | extended-coverage › Walking stats edge cases |
| STA-003 | By prayer | Count or breakdown by prayer. | walking-extended.test.ts |
| STA-004 | Period filter | Daily / weekly / monthly if present. | — |

---

## 8. Rewards

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| RWD-001 | Header | Spiritual Rewards, Every Step is a Blessing; badge count; hasanat. | rewards.test.tsx |
| RWD-002 | Badges tab | How Rewards Are Calculated; earned badges; in-progress badges. | rewards.test.tsx |
| RWD-003 | Hadiths tab | Hadith content; "Explore more on Sunnah.com". | rewards.test.tsx › switching to Hadiths |
| RWD-004 | Tabs (a11y) | role=tablist, tab, tabpanel; 44px min height. | rewards.test.tsx › has Badges and Hadiths tabs |
| RWD-005 | Dashboard link | Link to /dashboard. | rewards.test.tsx › link to dashboard |

---

## 9. Notifications

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| NOT-001 | List | Notifications; filter by type, read/unread; sort newest/oldest. | filters.test.tsx › Notification filters |
| NOT-002 | Empty state | "No notifications yet" + short explanation. | — |
| NOT-003 | Mark read/unread | Single or "Mark all read"; state persists. | filters.test.tsx |
| NOT-004 | Clear all | All notifications removed. | — |
| NOT-005 | Filter chips | Type (Prayer, Walk, etc.), Status (Unread, Read); data-testid for tests. | filters.test.tsx |
| NOT-006 | Settings panel | Notification preferences (in-app). | — |

---

## 10. Settings

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| SET-001 | Location | Use Current Location; city type-ahead; Set; timezone + prayer times updated. | — |
| SET-002 | City type-ahead | 2+ chars → suggestions; select sets city, lat, lng, timezone. | geocode.test.ts |
| SET-003 | Notifications | Toggle/description; link to system settings. | — |
| SET-004 | Theme | Light / Dark / System. | — |
| SET-005 | Units | Distance (km/mi), speed, time format. | — |
| SET-006 | Walking speed | Affects leave-by and route duration. | prayer-times.test.ts |
| SET-007 | Autosave | Settings persisted after debounce. | walking-history.test.ts › saveSettings |

---

## 11. Location & geocode (shared)

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| LOC-001 | fetchLocationSuggestions | Empty/short query → []; valid Nominatim → array of { displayName, shortName, lat, lng }; non-OK or non-array → []. | geocode.test.ts |
| LOC-002 | reverseGeocode | lat,lng → city or display_name slice; non-OK → null. | geocode.test.ts › reverseGeocode |
| LOC-003 | getIPGeolocation | ipapi.co or ip-api.com → { lat, lng, city, timezone }; cache 24h; fail → null. | location.test.ts |
| LOC-004 | Location priority | GPS → IP → saved city → Makkah (Dashboard, MosqueFinder init). | docs/skills/location-testing.md |

---

## 12. Prayer & time

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| PRY-001 | fetchPrayerTimes | Aladhan API; prayers array with time, isPast; readableDate. | comprehensive.test.ts › Prayer Times API |
| PRY-002 | calculateLeaveByTime | time − (walkMin + buffer); wraps across midnight. | prayer-times.test.ts, comprehensive.test.ts |
| PRY-003 | minutesUntilLeave | Positive minutes until leave-by in given timezone. | prayer-times.test.ts |
| PRY-004 | getNowInTimezone | { hours, minutes } in timezone or device. | prayer-times.test.ts |
| PRY-005 | estimateSteps | ~1333 per km; 0 for 0. | prayer-times.test.ts |
| PRY-006 | estimateWalkingTime | distance/speed (default 5 km/h); minutes. | prayer-times.test.ts |
| PRY-007 | calculateHasanat | 2 × steps. | prayer-times.test.ts |

---

## 13. Routing (OSRM)

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| RTE-001 | fetchWalkingRoute | Correct URL (foot, lng,lat); returns { coords, distanceKm, durationMin, steps } or null. | routing.test.ts |
| RTE-002 | No route / empty / fail | null; UI shows toast or message. | routing.test.ts |
| RTE-003 | Coords format | [lat, lng] for Leaflet. | routing.test.ts |

---

## 14. Walking history & storage

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| STO-001 | getSettings / saveSettings | Defaults when empty; merge partial; persist. | walking-history.test.ts |
| STO-002 | addWalkEntry | Entry appended; reverse chronological; unique ID. | walking-history.test.ts |
| STO-003 | getWalkHistory | Array of entries; delete removes. | walking-history.test.ts |
| STO-004 | getWalkingStats | totalSteps, totalDistance, totalHasanat, streaks, byPrayer. | walking-history.test.ts, extended-coverage |
| STO-005 | Saved mosques | saveMosque, getSavedMosques, removeSavedMosque, setPrimaryMosque. | extended-coverage › Saved Mosques |

---

## 15. Changelog

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| CHG-001 | filterChangelogEntries | Filter by q, types, versions; combined; empty when no match. | filters.test.tsx › Changelog filters |
| CHG-002 | Changelog page | Search input; type/version filters; Clear filters; entry list. | filters.test.tsx › Changelog page filters |

---

## 16. Security & validation

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| SEC-001 | XSS in mosque name | Script tags stripped/sanitized. | security.test.ts |
| SEC-002 | Long input | No crash; handled gracefully. | security.test.ts |
| SEC-003 | Negative distance | Treated as 0 or sanitized. | security.test.ts |
| SEC-004 | Corrupted localStorage | Graceful fallback; no throw. | security.test.ts |
| SEC-005 | Nominatim query encoding | encodeURIComponent. | security.test.ts › encodes search queries |
| SEC-006 | Storage isolation | Different keys don't leak. | security.test.ts › different storage keys |

---

## 17. SEO & meta

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| SEO-001 | Index title/description | Set on document. | seo.test.tsx |
| SEO-002 | FAQ/How it works/Sunnah/Rewards/Privacy/Terms | Title and description. | seo.test.tsx |
| SEO-003 | NotFound | page-not-found style title. | seo.test.tsx |
| SEO-004 | FAQ JSON-LD | FAQPage schema injected. | seo.test.tsx |

---

## 18. Content & edge cases

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| CNT-001 | Blog post invalid slug | Not-found UI; link to /blogs. | edge-cases.test.tsx |
| CNT-002 | getBlogBySlug | undefined for unknown; post for valid. | edge-cases.test.tsx |
| CNT-003 | getGuideById | undefined for invalid; guide for valid. | edge-cases.test.tsx |
| CNT-004 | GuidePage invalid guideId | Redirect to /guides. | edge-cases.test.tsx |
| CNT-005 | Legal pages | Privacy/Terms/Legal key sections. | legal-pages.test.tsx |
| CNT-006 | Landing components | Hero, Features, FAQ, Footer, ProblemSolution, HowItWorks. | landing.test.tsx |

---

## 19. Step counter & health

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| STP-001 | isStepCountingAvailable | Boolean. | step-counter.test.ts |
| STP-002 | getPaceCategory | Stationary/Slow/Dignified/Brisk/Too Fast for steps/min. | step-counter.test.ts |
| STP-003 | Health recommendations | Age/gender adjustments; step goals. | extended-coverage.test.ts › Health Recommendations |

---

## 20. Badges

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| BAD-001 | getBadges | List of badges with earned, requirement, icon. | extended-coverage.test.ts › Badge edge cases |
| BAD-002 | Marathon badge | Requires 42 km. | extended-coverage.test.ts |

---

## Build & test system

| ID | Feature | Expected output | Test reference |
|----|---------|-----------------|-----------------|
| BLD-001 | npm run build | Production build succeeds (Vite). | — |
| BLD-002 | npm test -- --run | All tests pass (Vitest). | — |
| BLD-003 | Lint | No blocking errors (ESLint). | — |
| BLD-004 | Feature test map | features-test-map.json maps feature IDs to tests. | scripts/test-by-features.js |

---

*Last updated from App routes, pages, libs, and src/test/*. Add new features here and set Test reference when tests exist.*
