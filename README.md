# MosqueSteps 🕌👣

**Turn every step into a blessing.** Track your walk to the mosque, view prayer times, and discover the spiritual rewards of walking to prayer.

[![Live App](https://img.shields.io/badge/Live-mosquesteps.com-0D7377)](https://mosquesteps.com)
[![Built by](https://img.shields.io/badge/Built%20by-ummah.build-gold)](https://ummah.build)

## Overview

MosqueSteps is a free, privacy-first Progressive Web App (PWA) designed for Muslims who walk to the mosque. It combines real-time step tracking, accurate prayer times, and spiritual reward calculations — all grounded in verified hadith references.

## Features

- **🏃 Real Step Counting** — Uses device accelerometer (Accelerometer API / DeviceMotion) with peak detection algorithm, falling back to GPS distance estimation
- **🕐 Prayer Times** — Accurate times via [Aladhan API](https://aladhan.com/prayer-times-api) with "Leave by" alerts based on walking distance
- **🕌 Mosque Finder** — Discover nearby mosques via [OpenStreetMap](https://www.openstreetmap.org/) Overpass API with Leaflet maps
- **⭐ Hasanat Counter** — Spiritual rewards calculated per step based on Sahih Muslim 666
- **🔥 Streaks & Badges** — 15 gamification badges for walks, steps, streaks, and specific prayers
- **🔔 Notifications** — Browser push notifications for prayer departure reminders
- **📖 Hadith Library** — 6 verified hadiths with full Arabic text, grades, and sunnah.com links
- **📱 PWA / Offline** — Installable with service worker caching for offline use
- **🔒 Privacy-First** — All data stored locally in localStorage, nothing sent to servers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite + SWC |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Maps | Leaflet + React-Leaflet |
| Prayer Times | [Aladhan API](https://api.aladhan.com) |
| Mosque Data | [Overpass API](https://overpass-api.de) (OpenStreetMap) |
| Geocoding | [Nominatim](https://nominatim.openstreetmap.org) |
| Timezone | [TimeAPI](https://timeapi.io) |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest + Testing Library |

## Getting Started

```bash
# Clone
git clone <YOUR_GIT_URL>
cd mosquesteps

# Install
npm install

# Dev server
npm run dev

# Run tests
npx vitest run

# Build
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── landing/       # Landing page sections (Hero, Features, FAQ, etc.)
│   ├── ui/            # shadcn/ui components
│   ├── HadithTooltip  # Verified hadith hover cards
│   └── LegalLayout    # Shared legal page layout
├── lib/
│   ├── prayer-times   # Aladhan API + step/hasanat calculations
│   ├── walking-history# localStorage persistence + streak logic
│   ├── step-counter   # Accelerometer/DeviceMotion step detection
│   ├── badges         # Gamification badge system (15 badges)
│   ├── notifications  # Web Notification API + prayer reminders
│   ├── notification-store # Persistent notification history with filters
│   ├── regional-defaults  # Unit/time format detection by region
│   ├── routing        # OSRM walking route fetching
│   ├── blog-data      # SEO blog content (health, community, sunnah)
│   └── guides-data    # User guide content
├── pages/             # Route-level components (lazy loaded)
├── marketing/         # Marketing docs, research, campaign ideas
├── test/              # Vitest test suites
└── assets/            # Images and static assets
```

## User Flows

### Flow 1: First-Time Setup
1. User lands on **Landing Page** (`/`) → learns about the app
2. Clicks **"Start Tracking"** → redirected to **Onboarding** (`/onboarding`)
3. Onboarding: set city, walking speed, stride length, select prayers to walk to
4. Completes onboarding → redirected to **Dashboard** (`/dashboard`)
5. Dashboard prompts: **Enable Location** (for accurate prayer times/timezone) and **Enable Notifications** (for prayer reminders)

### Flow 2: Daily Dashboard Usage
1. User opens **Dashboard** (`/dashboard`)
2. Sees current time in city timezone, upcoming prayer times, "Leave by" countdown
3. Views **Activity Summary** (Daily/Weekly/Monthly toggle) comparing 1 round trip vs actual activity
4. Checks streak, badges, and mosque info at a glance
5. Taps **"Start Walk"** on any prayer → goes to **Active Walk** (`/walk?prayer=Fajr`)

### Flow 3: Walking to the Mosque
1. User taps **"Start Walk"** from Dashboard or Walk tab
2. Selects prayer name (Fajr, Dhuhr, Asr, Maghrib, Isha, Jumuah)
3. **Active Walk** page tracks in real-time: steps (accelerometer or GPS), distance, speed, hasanat, pace
4. Sunnah reminder appears if walking too fast (Bukhari 636: walk with tranquility)
5. User taps **"End Walk"** → walk saved to history, badges checked, streak updated
6. Confetti animation on completion

### Flow 4: Finding a Mosque
1. User navigates to **Mosque Finder** (`/mosques`) via bottom nav
2. Allows location access (or searches an area manually)
3. Sees nearby mosques on a Leaflet map + sorted list by distance
4. Taps **"Select"** on preferred mosque → sets as primary
5. Dashboard updates with new distance, steps, and walking time estimates

### Flow 5: Viewing Stats & Progress
1. User taps **Stats** tab (`/stats`) in bottom nav
2. Views total steps, hasanat, distance, time walking
3. Sees weekly/monthly step charts (Recharts bar charts)
4. Views **Weekly Prayer Consistency** chart (walked vs driven vs prayed at home)
5. Prayer-walking correlation insight with estimated hasanat

### Flow 6: Notification Management
1. User taps **Bell icon** on Dashboard → **Notifications** (`/notifications`)
2. Sees chronological list of notifications (prayer reminders, walk completions, streaks, badges, weekly summaries, health tips)
3. **Filter by type** using chips (Prayer, Walk, Streak, Badge, Summary, etc.) with counts
4. **Filter by status** (All, Unread, Read)
5. **Hover timestamps** → exact date/time in city timezone
6. **Mark as read/unread** per notification
7. **Mark all of a type as read** via filter panel
8. **Settings panel** to toggle notification categories on/off

### Flow 7: Settings & Personalization
1. User opens **Settings** (`/settings`) via gear icon
2. **Appearance**: Light / Dark / System theme
3. **Measurement Units**: km/mi, km/h/mph, meters/feet, 12h/24h time format, stride length
4. **Location**: Use GPS or search city manually → auto-detects timezone, updates regional defaults
5. **Notifications**: Enable/disable, set advance reminder time (0–30 min before leave time)
6. **Per-prayer mosque assignment**: Different mosques for different prayers (if multiple saved)
7. **Walking speed**: Slider for speed (2–8 km/h)
8. **Home location**: Set for walking route directions

### Flow 8: Rewards & Hadith Learning
1. User taps **Rewards** tab (`/rewards`) in bottom nav
2. **Badges tab**: 15 badges with progress bars, earned/locked status
3. **Hadiths tab**: 6 verified hadiths with full Arabic text, English translation, grade, sunnah.com links
4. Badges earned trigger in-app notifications and confetti

### Flow 9: Walking History
1. User visits **History** (`/history`)
2. Views all recorded walks: date, prayer, steps, distance, hasanat, duration
3. **Charts tab**: Weekly bar charts, prayer distribution pie chart
4. Delete individual walks, export data as JSON

### Flow 10: Directions to Mosque
1. From **Mosque Finder**, user taps a mosque
2. Sees walking route on map via OSRM
3. Step-by-step turn directions
4. Estimated distance and walking time

### Flow 11: Content & Education
1. User visits **Blogs** (`/blogs`) for SEO-optimized articles
2. Categories: Sunnah, Health, Community, Guides
3. Individual blog posts with research citations and hadith references
4. User visits **Guides** (`/guides`) for step-by-step app tutorials
5. Each guide has screenshots, numbered steps, tips, and direct links to relevant app pages

## Hadith References

All spiritual reward calculations are based on authenticated hadiths:

| Reference | Topic | Grade |
|-----------|-------|-------|
| [Sahih Muslim 666](https://sunnah.com/muslim:666) | Each step erases a sin, raises a degree | Sahih |
| [Sunan Abi Dawud 561](https://sunnah.com/abudawud:561) | Walking in darkness → perfect light | Sahih |
| [Sahih al-Bukhari 636](https://sunnah.com/bukhari:636) | Walk with tranquility, don't run | Sahih |
| [Sahih Muslim 662](https://sunnah.com/muslim:662) | Farther distance = greater reward | Sahih |
| [Sahih Muslim 654](https://sunnah.com/muslim:654) | Congregation prayer 27x better | Sahih |
| [Sunan Ibn Majah 1412](https://sunnah.com/ibnmajah:1412) | Walking to Quba like Umrah | Hasan |

## External APIs

| API | Purpose | Caching |
|-----|---------|---------|
| `api.aladhan.com` | Prayer times by coordinates | NetworkFirst (1h) |
| `overpass-api.de` | Mosque search by location | CacheFirst (24h) |
| `nominatim.openstreetmap.org` | City geocoding + reverse | CacheFirst (7d) |
| `tile.openstreetmap.org` | Map tiles | CacheFirst (30d) |
| `timeapi.io` | Timezone detection by coordinates | CacheFirst (24h) |
| `ipapi.co` / `ip-api.com` | IP-based geolocation fallback | CacheFirst (24h) |
| `router.project-osrm.org` | Walking route directions | Per-request |

## Marketing & Content

The `src/marketing/` folder contains research-backed content for outreach:

| File | Topic |
|------|-------|
| `exercise-health-research.md` | Scientific benefits of walking (WHO, Harvard, Mayo Clinic) |
| `community-mosque-benefits.md` | Social and mental health benefits of communal worship |
| `elderly-outreach.md` | Targeting elderly Muslims with gentle exercise messaging |
| `habit-psychology.md` | Habit loop science applied to mosque walking |
| `campaign-ideas.md` | Social media campaigns, mosque partnerships, influencer outreach |
| `content-calendar.md` | Weekly content schedule, hashtags, SEO keywords |
| `brand-guidelines.md` | Logo usage, colors, typography, tone of voice |
| `copy.md` | App store descriptions, taglines, social media bios |
| `improvements-roadmap.md` | Feature roadmap, technical debt, metrics targets |

## Testing

```bash
npx vitest run          # Run all tests
npx vitest run src/test # Run specific directory
npx vitest --watch      # Watch mode
```

Test coverage includes:
- Prayer time calculations and API response parsing
- Walking history CRUD, streak logic, and settings persistence
- Step counter pace detection and categories
- Badge progress calculations
- Landing page and legal page rendering
- Guides page and routing

## SEO & AI Discoverability

- JSON-LD structured data (WebApplication schema)
- Open Graph + Twitter Card meta tags
- `sitemap.xml` and `robots.txt` (allows GPTBot, ClaudeBot, PerplexityBot)
- `llms.txt` for AI engine context

## Links

- **Website:** [mosquesteps.com](https://mosquesteps.com)
- **Built by:** [ummah.build](https://ummah.build)
- **X/Twitter:** [@ummahbuild](https://x.com/ummahbuild)
- **LinkedIn:** [ummah-build](https://www.linkedin.com/company/ummah-build/)

## License

Built with faith and open-source technology. © 2025 MosqueSteps.
