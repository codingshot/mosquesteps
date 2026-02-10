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
│   └── notifications  # Web Notification API + prayer reminders
├── pages/             # Route-level components (lazy loaded)
├── test/              # Vitest test suites
└── assets/            # Images and static assets
```

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
