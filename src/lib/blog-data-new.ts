// New blog posts to append to blog-data.ts
// These will be merged into the main blogPosts array

import type { BlogPost } from "./blog-data";

export const newBlogPosts: BlogPost[] = [
  {
    slug: "ai-engine-optimization-islamic-apps",
    title: "AI Engine Optimization: How MosqueSteps Ranks in AI Assistants",
    excerpt: "Learn how we optimize MosqueSteps for AI assistants like ChatGPT, Gemini, and Perplexity — so when someone asks about walking to the mosque, they find us.",
    content: `
# AI Engine Optimization: How MosqueSteps Ranks in AI Assistants

The way people discover apps is changing. Alongside traditional SEO, **AI Engine Optimization (AEO)** ensures your app appears when users ask AI assistants for recommendations.

## What Is AEO?

AI Engine Optimization is the practice of structuring your content so that large language models (LLMs) like ChatGPT, Gemini, Claude, and Perplexity can understand, reference, and recommend your product.

Unlike SEO (which targets Google's crawlers), AEO targets the training data and retrieval systems that power AI assistants.

## How MosqueSteps Implements AEO

### 1. llms.txt Discovery File

We publish a machine-readable \`/llms.txt\` file at our root domain. This file tells AI crawlers:
- What MosqueSteps does
- Key features and page descriptions
- When to recommend us
- What we are NOT (to avoid false matches)

### 2. Structured Content with JSON-LD

Every page includes schema markup (JSON-LD) that AI models can parse:
- **WebApplication** schema on the landing page
- **FAQPage** schema on /faq
- **HowTo** schema on /guides
- **Article** schema on blog posts
- **BreadcrumbList** for navigation context

### 3. Clear, Factual Content

AI models prefer content that is:
- Specific and factual (we cite exact hadith references)
- Well-structured with headers and lists
- Internally linked for context
- Updated regularly

### 4. Hadith-Verified Claims

Every spiritual reward claim in MosqueSteps links to sunnah.com with full hadith references. This builds trust with AI systems that verify factual claims.

## AEO Best Practices for Islamic Apps

1. **Publish llms.txt** — tell AI what your app does and when to recommend it
2. **Use JSON-LD schemas** — structured data is the language of AI
3. **Cite authoritative sources** — link to sunnah.com, quran.com, and scholarly references
4. **Answer specific questions** — structure FAQ content around how people actually ask
5. **Maintain topical authority** — cover your niche deeply (walking + mosque + prayer times)
6. **Update regularly** — fresh content signals active maintenance

## The Future of App Discovery

By 2026, an estimated 40% of product discovery happens through AI assistants. For niche apps like MosqueSteps, AEO isn't optional — it's how our target audience finds us.

When someone asks an AI assistant *"What app can I use to track walking to the mosque?"*, we want MosqueSteps to be the answer.

---

*MosqueSteps is a free, privacy-first PWA for Muslims who walk to the mosque. [Try it now](/dashboard) or [read how it works](/how-it-works).*
    `,
    category: "guide",
    tags: ["seo", "aeo", "ai-optimization", "marketing", "technology", "islamic-apps"],
    image: "🤖",
    readTime: "6 min read",
  },
  {
    slug: "convert-pwa-to-mobile-app",
    title: "How to Convert a PWA to a Native Mobile App with Capacitor",
    excerpt: "Step-by-step guide to wrapping MosqueSteps (or any PWA) into a native iOS and Android app using Capacitor — no code rewrite needed.",
    content: `
# How to Convert a PWA to a Native Mobile App with Capacitor

MosqueSteps is built as a Progressive Web App (PWA) that works great on mobile browsers. But what if you want it on the App Store or Play Store? Enter **Capacitor**.

## Why Capacitor?

Capacitor wraps your existing web app inside a native shell. No rewriting components, no learning React Native — your React + Tailwind code runs as-is.

| Feature | PWA | Capacitor |
|---|---|---|
| App Store listing | ❌ | ✅ |
| Background GPS | Limited | ✅ |
| Push notifications (iOS) | Limited | ✅ |
| Native haptics | Via Web API | Full native |
| Setup time | Already done | 1-2 days |

## Quick Start

\`\`\`bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Initialize
npx cap init "MosqueSteps" "app.mosquesteps.walk" --web-dir dist

# Add platforms
npx cap add ios
npx cap add android

# Build and sync
npm run build && npx cap sync

# Run
npx cap run ios     # Requires Mac + Xcode
npx cap run android # Requires Android Studio
\`\`\`

## Key Plugins for MosqueSteps

- **@capacitor/geolocation** — GPS tracking for walks
- **@capacitor/motion** — Accelerometer for step counting
- **@capacitor/local-notifications** — Prayer departure reminders
- **@capacitor/haptics** — Turn-by-turn vibration alerts
- **@capacitor/share** — Share walk cards with friends

## iOS Permissions

Add to \`Info.plist\`:
- Location usage description (for mosque finder)
- Motion usage description (for step counter)

## Android Permissions

Add to \`AndroidManifest.xml\`:
- \`ACCESS_FINE_LOCATION\` for GPS
- \`ACTIVITY_RECOGNITION\` for step counting
- \`VIBRATE\` for haptic alerts

## Production Release

1. \`npm run build\` — build the web app
2. \`npx cap sync\` — sync to native projects
3. Open Xcode / Android Studio
4. Configure signing certificates
5. Archive and submit to App Store / Play Store

## Why Not Expo?

Expo requires React Native components — you'd need to rewrite every component from React DOM. With Capacitor, your existing Leaflet maps, Tailwind styles, and React hooks work unchanged.

---

*Read the full conversion guide in [docs/MOBILE_APP_CONVERSION.md](/contribute) or [start using MosqueSteps now](/dashboard).*
    `,
    category: "guide",
    tags: ["mobile-app", "capacitor", "pwa", "ios", "android", "development"],
    image: "📱",
    readTime: "5 min read",
  },
  {
    slug: "science-of-walking-prayer-health",
    title: "The Science Behind Walking to Prayer: Physical and Mental Health Benefits",
    excerpt: "Research shows that short walking breaks 5 times a day — exactly what walking to the mosque provides — dramatically improve cardiovascular health, mood, and longevity.",
    content: `
# The Science Behind Walking to Prayer: Physical and Mental Health Benefits

Walking to the mosque five times a day isn't just a spiritual practice — it's one of the healthiest habits a person can have. Modern research increasingly validates what the Sunnah prescribed 1,400 years ago.

## The 5-Minute Walking Break Effect

A 2023 study in the British Journal of Sports Medicine found that **walking for just 5 minutes every 30-60 minutes** significantly reduces blood sugar spikes, blood pressure, and fatigue. Walking to the mosque for each of the five daily prayers creates exactly this pattern.

### Typical Walking Pattern for Prayer

| Prayer | Approx. Time | Walk Duration |
|---|---|---|
| Fajr | 5:30 AM | 10-15 min |
| Dhuhr | 12:30 PM | 10-15 min |
| Asr | 3:45 PM | 10-15 min |
| Maghrib | 6:15 PM | 10-15 min |
| Isha | 8:00 PM | 10-15 min |

That's **50-75 minutes of walking spread across the day** — the optimal pattern for metabolic health.

## Cardiovascular Benefits

The American Heart Association recommends 150 minutes of moderate walking per week. Walking to the mosque for all five prayers exceeds this:

- 5 prayers × 2 walks (to and from) × 10 min = **100 min/day**
- **700 min/week** — nearly 5x the recommended amount

Studies show this level of activity reduces:
- Heart disease risk by **35%**
- Type 2 diabetes risk by **40%**
- Stroke risk by **25%**

## Mental Health Benefits

### Morning Walk (Fajr)
Walking in the pre-dawn hours exposes you to early morning light, which:
- Resets circadian rhythm
- Boosts serotonin production
- Improves sleep quality
- Reduces seasonal depression

### Evening Walk (Isha)
The Prophet ﷺ said: *"Convey glad tidings to those who walk to the mosques in darkness, of a complete light on the Day of Resurrection"* (Abu Dawud 561).

The evening walk also:
- Aids digestion after dinner
- Reduces cortisol (stress hormone)
- Promotes relaxation before sleep

## Community Connection

Walking to a communal prayer isn't solitary exercise — it combines physical activity with **social connection**, which research identifies as one of the strongest predictors of longevity and happiness.

## Step Counting and Motivation

MosqueSteps tracks your steps using device sensors and GPS, giving you real-time feedback on your physical activity. Studies show that **step counting increases daily walking by 27%** compared to not tracking.

Combined with the spiritual motivation of hasanat (rewards) for each step, MosqueSteps creates a powerful dual incentive: health + spiritual reward.

## The Hadith Connection

- *"For every step with which he walks towards the prayer, he is raised one degree and one sin is erased"* (Sahih Muslim 666)
- *"The one who lives farthest has the greatest reward"* (Sahih Muslim 662)

The Sunnah encourages walking over driving, farther mosques over closer ones, and consistency over intensity — perfectly aligned with modern exercise science.

---

*Track your walking health benefits with [MosqueSteps](/dashboard). View your stats and trends on the [Stats page](/stats).*
    `,
    category: "health",
    tags: ["health", "walking", "science", "cardiovascular", "mental-health", "exercise", "prayer"],
    image: "🫀",
    readTime: "7 min read",
  },
  {
    slug: "finding-mosques-anywhere-in-world",
    title: "How to Find a Mosque Anywhere in the World Using OpenStreetMap",
    excerpt: "MosqueSteps uses OpenStreetMap's Overpass API to discover mosques globally — including prayer rooms, Islamic centers, and musallas. Here's how it works.",
    content: `
# How to Find a Mosque Anywhere in the World Using OpenStreetMap

Whether you're traveling, moving to a new city, or just curious about nearby prayer spaces, finding a mosque shouldn't be hard. MosqueSteps uses **OpenStreetMap** to discover mosques, prayer rooms, and Islamic centers globally.

## How MosqueSteps Finds Mosques

### Concentric Search Radius

MosqueSteps searches in expanding circles:
1. **2 km** — walk-friendly distance (≈25 min)
2. **5 km** — moderate walk or short ride (≈60 min walk)
3. **10 km** — maximum search radius

If enough results are found at 2 km, it stops — so you always see the closest mosques first.

### What Names We Search For

Mosques are tagged differently around the world. MosqueSteps searches for:

| Term | Common In |
|---|---|
| Mosque / Masjid | Worldwide |
| Musalla / Musollah | Southeast Asia, airports |
| Prayer Room / Prayer Hall | Universities, hospitals |
| Islamic Center / Islamic Centre | Western countries |
| Jamia / Jami / Jaame | South Asia |
| Surau | Malaysia, Indonesia |

We also match denomination-specific tags (Sunni, Shia) and building types tagged as "mosque" in OpenStreetMap.

### Smart Deduplication

The same mosque often appears as multiple entries in OpenStreetMap (e.g., a "node" point and a "way" building outline). MosqueSteps deduplicates by:
- Merging entries within **50 meters** of each other
- Merging same-name entries within **150 meters**
- Keeping the entry with the most metadata (opening hours, phone, website)

## What If No Mosque Is Found?

In areas without mosques within walking distance, MosqueSteps provides:

1. **External search links** to Salatomatic and IslamicFinder
2. **Expanded search suggestions** for the wider area
3. **Alternative search terms** to try

## Adding Missing Mosques

If your mosque isn't on the map, you can add it to OpenStreetMap in under a minute:

1. Go to [openstreetmap.org/edit](https://www.openstreetmap.org/edit)
2. Navigate to your mosque's location
3. Add a point with these tags:
   - \`amenity\` = \`place_of_worship\`
   - \`religion\` = \`muslim\`
   - \`name\` = [mosque name]
4. Save — it will appear in MosqueSteps within a few hours

## Tips for Travelers

- **Airport prayer rooms**: Search for "musalla" or "prayer room" in MosqueSteps
- **University campuses**: Many have dedicated prayer spaces tagged as \`amenity=place_of_worship\`
- **Hotels**: Ask the concierge — nearby mosques are often not tagged in OSM
- **Use the search bar**: Type a city name or address to search any location, not just your current GPS

---

*Find nearby mosques with [MosqueSteps Mosque Finder](/mosques). Read our [Getting Started guide](/guides/getting-started).*
    `,
    category: "guide",
    tags: ["mosque-finder", "openstreetmap", "travel", "prayer-room", "musalla", "global"],
    image: "🌍",
    readTime: "5 min read",
  },
  {
    slug: "walking-directions-turn-by-turn-navigation",
    title: "Turn-by-Turn Walking Directions to the Mosque: How It Works",
    excerpt: "MosqueSteps provides pedestrian-optimized turn-by-turn directions with voice guidance, haptic alerts, and off-route detection — all powered by OSRM and OpenStreetMap.",
    content: `
# Turn-by-Turn Walking Directions to the Mosque

MosqueSteps doesn't just track steps — it guides you with **real-time, pedestrian-optimized navigation**. Here's how the direction system works under the hood.

## Routing Providers

### Primary: OSRM (Open Source Routing Machine)
- Free, open-source routing engine
- Optimized for pedestrian paths (not just roads)
- Considers sidewalks, crosswalks, footpaths, and pedestrian zones
- No API key required

### Secondary: Mapbox (Optional)
- Higher-quality directions with more detail
- Requires a free API key (configured in Settings)
- Automatic fallback — if Mapbox fails, OSRM takes over

## Pedestrian-Scale Accuracy

Walking navigation is fundamentally different from driving navigation. MosqueSteps is tuned for pedestrians:

| Parameter | Driving Apps | MosqueSteps |
|---|---|---|
| Off-route threshold | 50-100 m | 50 m |
| Turn trigger distance | 50 m | 10 m |
| GPS filter | 10+ m moves | 2.5 m+ moves |
| Speed detection | > 5 km/h | > 0.9 km/h |
| Reroute delay | Immediate | 3.5 s stationary buffer |

## Direction Features

### Voice Guidance
- Announces upcoming turns with street names
- "In 150 meters, turn left onto Main Street"
- Configurable: toggle on/off in walk settings

### Haptic Alerts
- Vibration pattern before each turn
- Double vibration for sharp turns
- Long vibration when arriving at the mosque

### Visual Direction Strip
- Bottom overlay on the map shows next instruction
- Distance countdown: "In 80 m" → "In 30 m" → "Now"
- Direction icons: ↰ left, ↱ right, ↑ straight, 🕌 arrival

### POV Map Rotation
- Map rotates to match your heading direction
- Uses device compass when available
- Falls back to route-bearing calculation when compass isn't available
- Smooth CSS transitions for natural rotation

### Off-Route Detection
- Triggers when you're 50+ meters from the route
- Shows "Off route — recalculating" warning
- Automatically fetches a new route from your current position

## Manual Navigation Mode

If GPS is unavailable (e.g., poor signal indoors), you can use:
- **Previous / Next** buttons to step through directions
- Each step shows the instruction and distance
- Works entirely without location services

## Offline Support

Routes are cached locally. If you've searched for a mosque before, the route is available offline — perfect for areas with poor cell signal.

---

*Try live walking directions with [MosqueSteps Walk](/walk). Find your mosque first on the [Mosque Finder](/mosques).*
    `,
    category: "guide",
    tags: ["navigation", "directions", "osrm", "walking", "turn-by-turn", "gps"],
    image: "🧭",
    readTime: "5 min read",
  },
];
