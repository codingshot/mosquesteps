# Changelog

All notable changes to MosqueSteps are documented here. The project follows [Semantic Versioning](https://semver.org/) where applicable.

## [Unreleased]

- Copy link button on blog posts and guide pages for easy sharing
- Improved empty states (History, Notifications) with friendlier copy
- Loading text uses consistent ellipsis (Loading…)
- Legal page: OSRM and TimeAPI attributions added
- Accessibility: aria-live region for active walk progress (steps, distance, time)
- Error boundary for the app with "Back to home" fallback
- CHANGELOG.md added

## [1.0.0] — 2026-02

### Added

- **Landing & marketing**
  - Landing page with Hero, Problem/Solution, Features, How it works, FAQ, CTA
  - Blog (SEO articles: sunnah, health, guides, community)
  - User guides (Getting started, Find mosque, Active walk, Stats, Notifications, Rewards, History)
  - Contribute page (`/contribute`) with issue links and contribution guide
  - Marketing folder: copy, campaigns, content calendar, press kit, email templates, keyword clusters
  - Improvement prompts (IMPROVEMENT_PROMPTS.md) for product, SEO, and technical work

- **App features**
  - Dashboard: prayer times, leave-by time, activity summary, start walk CTA
  - Active walk: GPS + optional sensor step tracking, turn-by-turn, hasanat, pace reminder
  - Mosque finder: OpenStreetMap/Overpass, Leaflet map, save primary mosque
  - Rewards: hasanat counter, 15 badges, hadith references with tooltips
  - Stats: steps, hasanat, streaks, charts, health recommendations, goals
  - History: walk log, weekly charts, prayer distribution
  - Notifications: prayer reminders, walk complete, streaks, badges, filters
  - Settings: location, units, theme, notifications, locale
  - Onboarding: location, prayers, mosque, notifications

- **Technical**
  - PWA (Vite PWA + Workbox), offline support
  - SEO: per-page SEOHead, FAQ JSON-LD, llms.txt, sitemap, robots.txt
  - Tests: Vitest + Testing Library (prayer times, walking history, badges, security, landing, SEO, edge cases)
  - Open source: CONTRIBUTING.md, Code of Conduct, PR template, issue templates (bug, feature, mosque, content, prayer times)

### Attribution

- Prayer times: Aladhan API
- Mosque data: OpenStreetMap, Overpass API, Nominatim
- Routing: OSRM
- Timezone: TimeAPI
- Hadith references: Sunnah.com
- Maps: Leaflet

---

[Unreleased]: https://github.com/codingshot/mosquesteps/compare/main...HEAD
[1.0.0]: https://github.com/codingshot/mosquesteps/releases/tag/v1.0.0
