/**
 * User-facing changelog entries. Used by /changelog page with search and filters.
 * Types match conventional commits; area helps users filter by feature area.
 */
export type ChangelogType = "feat" | "fix" | "docs" | "improvement" | "accessibility" | "technical" | "privacy" | "seo";

export type ChangelogArea =
  | "walking"
  | "prayer"
  | "mosque"
  | "rewards"
  | "notifications"
  | "dashboard"
  | "history"
  | "stats"
  | "settings"
  | "onboarding"
  | "content"
  | "ui"
  | "developer"
  | "privacy"
  | "seo";

export interface ChangelogEntry {
  id: string;
  type: ChangelogType;
  version: string;
  date: string;
  title: string;
  description: string;
  area?: ChangelogArea;
}

const SITE = "https://mosquesteps.com";

export const changelogEntries: ChangelogEntry[] = [
  // —— Unreleased ——
  {
    id: "unreleased-seo-2025",
    type: "seo",
    version: "Unreleased",
    date: "Unreleased",
    title: "SEO and discoverability improvements",
    description: "BreadcrumbList and HowTo structured data on blog and guide pages. Internal links from Blog to Dashboard, Mosque finder, Sunnah, FAQ, and Guides. Tighter meta descriptions with primary keywords. Expanded llms.txt with page descriptions and a 'For AI assistants' section. Sitemap lastmod and README note for regenerating when adding content.",
    area: "seo",
  },
  {
    id: "unreleased-copy-link",
    type: "improvement",
    version: "Unreleased",
    date: "Unreleased",
    title: "Copy link on blog and guide pages",
    description: "Share articles and guides with a single tap. Copy link button added to each blog post and user guide.",
    area: "content",
  },
  {
    id: "unreleased-empty-states",
    type: "improvement",
    version: "Unreleased",
    date: "Unreleased",
    title: "Friendlier empty states",
    description: "History and Notifications now show clearer, encouraging copy when you have no walks or notifications yet.",
    area: "ui",
  },
  {
    id: "unreleased-loading",
    type: "fix",
    version: "Unreleased",
    date: "Unreleased",
    title: "Consistent loading text",
    description: "Loading indicator now uses a consistent ellipsis (Loading…) across the app.",
    area: "ui",
  },
  {
    id: "unreleased-legal",
    type: "docs",
    version: "Unreleased",
    date: "Unreleased",
    title: "OSRM and TimeAPI attributions",
    description: "Legal page updated with attributions for routing (OSRM) and timezone (TimeAPI) services.",
    area: "developer",
  },
  {
    id: "unreleased-aria",
    type: "accessibility",
    version: "Unreleased",
    date: "Unreleased",
    title: "Screen reader updates during walk",
    description: "Active walk progress (steps, distance, time, hasanat) is now announced to screen readers as it updates.",
    area: "walking",
  },
  {
    id: "unreleased-error-boundary",
    type: "improvement",
    version: "Unreleased",
    date: "Unreleased",
    title: "Error boundary with recovery",
    description: "If something goes wrong, you now see a friendly message with options to try again or return home.",
    area: "ui",
  },
  {
    id: "unreleased-changelog-page",
    type: "docs",
    version: "Unreleased",
    date: "Unreleased",
    title: "Changelog page",
    description: "Dedicated changelog page with search and filters so you can see what’s new and what’s coming.",
    area: "content",
  },
  {
    id: "unreleased-directions-time-pedometer",
    type: "technical",
    version: "Unreleased",
    date: "Unreleased",
    title: "Directions, time, and pedometer improvements",
    description: "Walking directions: dedicated routing tests (OSRM URL, response shape, error handling), and safer handling when the route API returns no geometry. Time: tests for getNowInTimezone, getDatePartsInTimezone, and minutesUntilLeave with timezone. Pedometer: step-counter tests for getPaceCategory boundaries and isStepCountingAvailable. Route fetch failures now show a short message so you know when directions couldn't be loaded.",
    area: "walking",
  },
  {
    id: "unreleased-skills-ux-a11y",
    type: "accessibility",
    version: "Unreleased",
    date: "Unreleased",
    title: "Accessibility and UX from skills audits",
    description: "Icon-only buttons now have aria-labels (Back, Notifications, Settings, Toggle filters, Notification preferences) across Dashboard, Notifications, Sunnah, FAQ, Changelog, Contribute, How it works, and Content. App respects prefers-reduced-motion (animations and transitions reduced). Clearer empty state on Active walk when no mosque is set: “Set your mosque to see walking distance, turn-by-turn directions, and leave-by time.” Docs/skills guides added for UX, security, functionality, hadith, API, SEO, AI, blog, marketing, and brand.",
    area: "ui",
  },
  {
    id: "unreleased-button-ux-fit",
    type: "improvement",
    version: "Unreleased",
    date: "Unreleased",
    title: "Button text fit and touch targets",
    description: "Buttons: min-w-0 so label text can shrink in flex layouts; default and icon sizes meet 44px minimum touch target where applicable. Long labels: Open in Maps (shortened), Check-in mosque name truncates with full name in title; Notifications Mark as read shortened with type in title. Rewards Badges/Hadiths tabs: 44px min height, tab/panel roles and aria for screen readers.",
    area: "ui",
  },
  {
    id: "unreleased-address-typeahead-location-priority",
    type: "improvement",
    version: "Unreleased",
    date: "Unreleased",
    title: "Address type-ahead and location priority",
    description: "Location is now prioritized: current location (GPS) first, then IP geolocation, then saved or entered city. Mosque finder: address/city type-ahead from 2 characters with 8 suggestions, debounced; “Use my location” appears at top of suggestions when GPS or IP is available; map initial center uses IP when no saved city. Onboarding and Settings: city/address type-ahead with dropdown suggestions; Onboarding pre-fills city from IP on the location step. Shared geocode helper (Nominatim) used for all location search.",
    area: "mosque",
  },
  {
    id: "unreleased-location-testing-skill",
    type: "technical",
    version: "Unreleased",
    date: "Unreleased",
    title: "Location testing skill and tests",
    description: "New docs/skills/location-testing.md: checklist for location priority (GPS to IP to city), address type-ahead, mosque search, map center. Geocode tests (geocode.test.ts) and location/IP tests (location.test.ts). Geocode and prayer-times use AbortSignal.timeout only when available; geocode returns empty array for non-array or parse errors.",
    area: "developer",
  },
  {
    id: "unreleased-health-profile-advanced-metrics",
    type: "feat",
    version: "Unreleased",
    date: "Unreleased",
    title: "Health profile: age bounds, body weight, advanced metrics",
    description: "Age in Settings is validated and clamped to 5–120 years; health recommendations use the same bounds. Optional body weight (20–300 kg) for better calorie estimates. Advanced metrics mode: when enabled, calorie estimate on walk completion uses your weight; planned improvements include stride length, cadence, and gait quality from walk data for a more dignified walk.",
    area: "settings",
  },
  {
    id: "unreleased-features-master-list",
    type: "docs",
    version: "Unreleased",
    date: "Unreleased",
    title: "Features master list and test guide",
    description: "docs/features-master-list.md: single list of every app feature with expected outputs (navigation, onboarding, dashboard, mosque finder, active walk, history, stats, rewards, notifications, settings, location, prayer, routing, storage, changelog, security, SEO, content, step counter, badges, build). docs/features-test-map.json maps feature IDs to test files. scripts/test-by-features.js: run full suite (npm run test:features), list mapped features (npm run test:features:list), or run tests for one feature ID (node scripts/test-by-features.js <ID>). Use as test guide for QA and regression.",
    area: "developer",
  },
  // —— 1.0.0 ——
  {
    id: "v1-dashboard",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Dashboard with prayer times and leave-by",
    description: "Dashboard shows prayer times for your location, a “leave by” time so you know when to set off, and a quick way to start a walk.",
    area: "dashboard",
  },
  {
    id: "v1-active-walk",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Active walk tracking",
    description: "Track your walk in real time with GPS and optional device sensors. See steps, distance, hasanat, turn-by-turn directions, and a pace reminder (walk with tranquility).",
    area: "walking",
  },
  {
    id: "v1-mosque-finder",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Mosque finder",
    description: "Find nearby mosques on a map powered by OpenStreetMap. Save your primary mosque and get distance, steps, and walking time.",
    area: "mosque",
  },
  {
    id: "v1-rewards",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Rewards and badges",
    description: "Hasanat counter based on authentic hadiths (e.g. Muslim 666). 15 badges for walks, steps, streaks, and specific prayers. Hadith tooltips with links to Sunnah.com.",
    area: "rewards",
  },
  {
    id: "v1-stats",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Stats and goals",
    description: "View total steps, hasanat, streaks, weekly and monthly charts, health recommendations by age, and prayer distribution.",
    area: "stats",
  },
  {
    id: "v1-history",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Walking history",
    description: "Log of all your walks with steps, distance, hasanat, and prayer. Weekly step charts and prayer distribution.",
    area: "history",
  },
  {
    id: "v1-notifications",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Prayer and walk notifications",
    description: "Browser notifications for when it’s time to leave for prayer (based on walking distance). Walk complete, streaks, and badge alerts.",
    area: "notifications",
  },
  {
    id: "v1-settings",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Settings and personalization",
    description: "Set location, units (km/mi), theme (light/dark/system), notification preferences, and locale. All data stored locally.",
    area: "settings",
  },
  {
    id: "v1-onboarding",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Onboarding flow",
    description: "First-time setup: set your location, choose prayers to walk to, pick your mosque, and enable notifications.",
    area: "onboarding",
  },
  {
    id: "v1-pwa",
    type: "technical",
    version: "1.0.0",
    date: "2026-02",
    title: "PWA and offline support",
    description: "Install MosqueSteps as an app from your browser. Service worker caches the app for offline use.",
    area: "ui",
  },
  {
    id: "v1-privacy",
    type: "privacy",
    version: "1.0.0",
    date: "2026-02",
    title: "Privacy-first design",
    description: "No account required. All data (location, steps, history) stays on your device. No analytics or tracking.",
    area: "privacy",
  },
  {
    id: "v1-landing",
    type: "feat",
    version: "1.0.0",
    date: "2026-02",
    title: "Landing page and content",
    description: "Landing page with Hero, Features, How it works, FAQ, and CTA. Blog, user guides, Sunnah page, How it works, and Contribute page.",
    area: "content",
  },
  {
    id: "v1-seo",
    type: "seo",
    version: "1.0.0",
    date: "2026-02",
    title: "SEO and discoverability",
    description: "Per-page meta tags, Open Graph, Twitter Cards, FAQ JSON-LD, sitemap, robots.txt, and llms.txt for AI engines.",
    area: "seo",
  },
  {
    id: "v1-contribute",
    type: "docs",
    version: "1.0.0",
    date: "2026-02",
    title: "Contribute page and open source",
    description: "In-app Contribute page with links to GitHub issue templates and CONTRIBUTING.md. Code of Conduct and PR template.",
    area: "developer",
  },
];

export const changelogTypes: { value: ChangelogType; label: string }[] = [
  { value: "feat", label: "Feature" },
  { value: "fix", label: "Fix" },
  { value: "docs", label: "Docs" },
  { value: "improvement", label: "Improvement" },
  { value: "accessibility", label: "Accessibility" },
  { value: "technical", label: "Technical" },
  { value: "privacy", label: "Privacy" },
  { value: "seo", label: "SEO" },
];

export const changelogVersions = ["Unreleased", "1.0.0"] as const;

export function filterChangelogEntries(
  entries: ChangelogEntry[],
  opts: { q?: string; types?: ChangelogType[]; versions?: string[] }
): ChangelogEntry[] {
  let result = [...entries];
  const q = opts.q?.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.area && e.area.toLowerCase().includes(q)) ||
        e.type.toLowerCase().includes(q)
    );
  }
  if (opts.types?.length) {
    const set = new Set(opts.types);
    result = result.filter((e) => set.has(e.type));
  }
  if (opts.versions?.length) {
    const set = new Set(opts.versions);
    result = result.filter((e) => set.has(e.version));
  }
  return result;
}

export function getChangelogSchema(entries: ChangelogEntry[]) {
  const byVersion = entries.reduce<Record<string, ChangelogEntry[]>>((acc, e) => {
    if (!acc[e.version]) acc[e.version] = [];
    acc[e.version].push(e);
    return acc;
  }, {});
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Changelog — MosqueSteps",
    description: "User-facing updates, new features, and improvements to MosqueSteps. Search and filter by type and version.",
    url: `${SITE}/changelog`,
    mainEntity: {
      "@type": "ItemList",
      name: "MosqueSteps Changelog",
      numberOfItems: entries.length,
      itemListElement: Object.entries(byVersion).slice(0, 10).map(([version, items], i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Version ${version}`,
        description: items.map((e) => e.title).join("; "),
      })),
    },
  };
}
