<p align="center">
  <img src="src/assets/logo.png" width="80" alt="MosqueSteps Logo" />
</p>

<h1 align="center">MosqueSteps 🕌👣</h1>

<p align="center">
  <strong>Turn every step into a blessing.</strong> Track your walk to the mosque, view prayer times, and discover the spiritual rewards of walking to prayer.
</p>

<p align="center">
  <a href="https://mosquesteps.com"><img src="https://img.shields.io/badge/Live-mosquesteps.com-0D7377" alt="Live App" /></a>
  <a href="https://ummah.build"><img src="https://img.shields.io/badge/Built%20by-ummah.build-gold" alt="Built by" /></a>
  <a href="https://github.com/codingshot/mosquesteps"><img src="https://img.shields.io/badge/GitHub-codingshot%2Fmosquesteps-181717?logo=github" alt="GitHub" /></a>
  <a href="https://www.linkedin.com/company/ummah-build/"><img src="https://img.shields.io/badge/LinkedIn-ummah--build-0A66C2?logo=linkedin" alt="LinkedIn" /></a>
</p>

---

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
git clone https://github.com/codingshot/mosquesteps.git
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
├── marketing/         # Marketing docs, research, campaigns (see src/marketing/README.md)
├── test/              # Vitest test suites
└── assets/            # Images and static assets
```

## User Flows

### Flow 1: First-Time Setup
1. User lands on **Landing Page** (`/`) → learns about the app
2. Clicks **"Start Tracking"** → redirected to **Onboarding** (`/onboarding`)
3. Onboarding: set city, walking speed, stride length, select prayers to walk to
4. Completes onboarding → redirected to **Dashboard** (`/dashboard`)
5. Dashboard prompts: **Enable Location** and **Enable Notifications**

### Flow 2: Daily Dashboard Usage
1. Opens **Dashboard** → sees current time, upcoming prayers, "Leave by" countdown
2. Views **Activity Summary** (Daily/Weekly/Monthly toggle)
3. Checks streak, badges, mosque info
4. Taps **"Start Walk"** on any prayer → **Active Walk** page

### Flow 3: Walking to the Mosque
1. Taps **"Start Walk"** → selects prayer name
2. **Active Walk** tracks in real-time: steps, distance, speed, hasanat, pace
3. Sunnah reminder if walking too fast (Bukhari 636)
4. Taps **"End Walk"** → walk saved, badges checked, streak updated, confetti

### Flow 4: Finding a Mosque
1. **Mosque Finder** → allows location → sees nearby mosques on map + list
2. Taps **"Select"** → sets as primary → Dashboard updates

### Flow 5: Viewing Stats & Progress
1. **Stats** tab → total steps, hasanat, charts, prayer consistency
2. Weekly/monthly step charts, prayer-walking correlation

### Flow 6: Notification Management
1. **Notifications** → filter by type/status, hover for exact times
2. Mark as read/unread, toggle categories

### Flow 7: Settings & Personalization
1. **Settings** → theme, units, city/timezone, notifications, per-prayer mosque

### Flow 8: Content & Education
1. **Blogs** for SEO articles, **Guides** for step-by-step tutorials
2. **Sunnah** page for hadith references

## Improvement Prompts

**[src/marketing/IMPROVEMENT_PROMPTS.md](src/marketing/IMPROVEMENT_PROMPTS.md)** — Copy-paste prompts for product, marketing, SEO, tests, and technical improvements. Use with Cursor, ChatGPT, or your dev process.

## Contributing

We welcome contributions! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for full guidelines, or the in-app **[Contribute](https://mosquesteps.com/contribute)** page for a quick overview and issue links.

### Quick Links for Issues

- 🐛 [Report a Bug](https://github.com/codingshot/mosquesteps/issues/new?template=bug_report.md)
- ✨ [Request a Feature](https://github.com/codingshot/mosquesteps/issues/new?template=feature_request.md)
- 🕌 [Report a Missing/Incorrect Mosque](https://github.com/codingshot/mosquesteps/issues/new?template=mosque_data.md)
- 📖 [Report a Hadith/Content Issue](https://github.com/codingshot/mosquesteps/issues/new?template=content_issue.md)
- ⏰ [Report Incorrect Prayer Times](https://github.com/codingshot/mosquesteps/issues/new?template=prayer_times.md)

## Hadith References

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

## Testing

```bash
npx vitest run          # Run all tests
npx vitest run src/test # Run specific directory
npx vitest --watch      # Watch mode
```

## SEO & AI Discoverability

- JSON-LD structured data (WebApplication, FAQPage, BreadcrumbList, HowTo on guides)
- Open Graph + Twitter Card meta tags
- `sitemap.xml` and `robots.txt` (allows GPTBot, ClaudeBot, PerplexityBot). When adding new blog posts or guides, update `public/sitemap.xml`: add a `<url>` with `<loc>`, `<lastmod>YYYY-MM-DD</lastmod>`, and optionally `<changefreq>` / `<priority>`.
- `llms.txt` for AI engine context (page descriptions and "For AI assistants" section)

## Links

- **Website:** [mosquesteps.com](https://mosquesteps.com)
- **GitHub:** [codingshot/mosquesteps](https://github.com/codingshot/mosquesteps)
- **Built by:** [ummah.build](https://ummah.build)
- **X/Twitter:** [@ummahbuild](https://x.com/ummahbuild)
- **LinkedIn:** [ummah-build](https://www.linkedin.com/company/ummah-build/)

## License

Built with faith and open-source technology. © 2026 MosqueSteps.
