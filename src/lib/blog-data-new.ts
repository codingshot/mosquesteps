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
  {
    slug: "ramadan-walking-challenge-2026",
    title: "Ramadan Walking Challenge 2026: Walk to Every Prayer for 30 Days",
    excerpt: "Set a goal to walk to the mosque for every prayer this Ramadan. Here's how MosqueSteps helps you track, stay motivated, and earn multiplied rewards.",
    content: `
# Ramadan Walking Challenge 2026: Walk to Every Prayer for 30 Days

Ramadan is the month of multiplied rewards. Every good deed is amplified — including the simple act of walking to the mosque. This Ramadan, challenge yourself: **walk to every prayer for 30 days**.

## Why Walk During Ramadan?

### Spiritual Multiplication
During Ramadan, rewards for good deeds are multiplied. The Prophet ﷺ said that walking to the mosque earns hasanat for every step — imagine that multiplied across 30 days of fasting.

### Physical Benefits While Fasting
- Walking at a gentle pace is one of the best exercises during fasting
- Short walks between prayers prevent muscle stiffness from sitting
- The pre-Fajr walk helps wake up the body naturally
- The post-Iftar walk (Isha) aids digestion

### Community Connection
Ramadan congregations are larger — walking to Taraweeh with friends and family creates lasting memories.

## The Challenge: 5 Prayers × 30 Days = 150 Walks

| Week | Goal | Badge Target |
|---|---|---|
| Week 1 | Build the habit — aim for 3 prayers/day | First Steps |
| Week 2 | Increase to 4 prayers/day | Consistency Streak |
| Week 3 | Full 5 prayers/day | Ramadan Walker |
| Week 4 | Maintain + add Taraweeh walks | Ramadan Champion |

## How MosqueSteps Helps

1. **Track every walk** — tap Walk before each prayer to log steps and distance
2. **See your streak grow** — the dashboard shows consecutive walking days
3. **Earn Ramadan badges** — special badges for walking during Ramadan
4. **View cumulative hasanat** — watch your spiritual rewards accumulate
5. **Share progress** — generate a share card after each walk

## Tips for Fasting Walkers

- **Hydrate well at Suhoor** — you'll need water for the day's walks
- **Walk at a moderate pace** — don't exhaust yourself while fasting
- **Wear comfortable shoes** — you'll be walking 50-75 minutes daily
- **Start early** — leave 5 minutes earlier than usual to walk calmly
- **Use the Leave-by timer** — MosqueSteps calculates when to depart

## Track Your Progress

Open the [Stats page](/stats) daily to see:
- Total steps this Ramadan
- Walking streak (aim for 30!)
- Prayer distribution — which prayers are you walking to most?
- Estimated hasanat earned

May Allah accept your walks and worship this Ramadan. 🌙

---

*Start tracking your Ramadan walks with [MosqueSteps](/walk). View the [Rewards page](/rewards) to see Ramadan-specific badges.*
    `,
    category: "tips",
    tags: ["ramadan", "walking-challenge", "fasting", "prayer", "motivation", "30-day-challenge"],
    image: "🌙",
    readTime: "5 min read",
  },
  {
    slug: "elderly-mosque-walking-safety-tips",
    title: "Walking to the Mosque Safely: A Guide for Elderly Muslims",
    excerpt: "Practical tips for older adults who want to continue walking to the mosque — from choosing safe routes to using assistive features in MosqueSteps.",
    content: `
# Walking to the Mosque Safely: A Guide for Elderly Muslims

Walking to the mosque is one of the most rewarded acts in Islam, and it becomes even more meritorious with age and difficulty. The Prophet ﷺ said:

> *"The one who lives farthest from the mosque has the greatest reward for prayer"* (Sahih Muslim 662)

This guide helps elderly Muslims continue this blessed practice safely.

## Before You Walk

### Check the Route
- Use the [Mosque Finder](/mosques) to preview your route before walking
- Look for sidewalks, crosswalks, and well-lit paths
- Avoid routes with steep hills or uneven terrain
- Note rest points along the way (benches, shaded areas)

### Prepare Physically
- Wear supportive, non-slip shoes
- Dress for the weather — layers in cold, light colors in heat
- Carry a water bottle (especially in warm months)
- Bring a phone for emergencies

### Time Your Departure
- Use MosqueSteps' "Leave by" timer to avoid rushing
- Add 5-10 extra minutes to the suggested walking time
- Walking calmly is Sunnah: *"When you hear the iqamah, walk to prayer calmly"* (Bukhari 636)

## During Your Walk

### Use MosqueSteps Features
- **Turn-by-turn directions** guide you step by step
- **Voice guidance** announces turns so you don't need to look at your phone
- **Manual navigation mode** works without GPS if signal is weak
- **Step counter** tracks your activity for health monitoring

### Safety Tips
- Walk on sidewalks facing traffic when no sidewalk is available
- Make eye contact with drivers before crossing
- Use pedestrian crossings with signals
- Walk with a companion when possible
- Carry identification and emergency contacts

## If Walking Becomes Difficult

Islam is merciful. If walking to the mosque becomes genuinely difficult:
- Pray at the nearest mosque, even if it's not your primary one
- Use transportation and still earn reward for the intention
- Pray at home when health doesn't permit — the reward is preserved for those who used to walk

The Prophet ﷺ said: *"When a servant falls ill or travels, he is credited with the same reward as he used to earn when he was healthy or at home"* (Bukhari 2996)

## MosqueSteps Accessibility Features

- **Large text** — adjustable in your device settings
- **High contrast** — dark mode for better visibility
- **Voice directions** — listen instead of reading the screen
- **Simple navigation** — bottom bar with clear icons

---

*Find the closest mosque to reduce walking distance with the [Mosque Finder](/mosques). Read more about [spiritual rewards](/rewards) for walking to prayer.*
    `,
    category: "health",
    tags: ["elderly", "safety", "accessibility", "walking", "health", "senior-muslims"],
    image: "🧓",
    readTime: "6 min read",
  },
  {
    slug: "family-walking-mosque-kids",
    title: "Walking to the Mosque as a Family: Getting Kids Involved",
    excerpt: "Turn the walk to the mosque into a family activity. Tips for making it fun, educational, and a habit your children will carry for life.",
    content: `
# Walking to the Mosque as a Family: Getting Kids Involved

One of the best ways to instill the love of prayer in children is to make the journey to the mosque an enjoyable family experience. Here's how to turn the daily walk into something your kids look forward to.

## Why Walk Together?

### Spiritual Teaching
- Children learn by example — seeing parents walk to prayer normalizes it
- Walking time is perfect for teaching short duas and dhikr
- Arriving together builds a sense of family worship

### Physical Activity
- The WHO recommends 60 minutes of daily activity for children
- Walking to 2-3 prayers adds 30-45 minutes of exercise
- Regular walking improves children's focus and behavior at school

### Quality Time
- No screens, no distractions — just conversation and fresh air
- Children share their day during the walk
- Parents can discuss Islamic stories and values

## Making It Fun

### 1. Step Counting Challenge
- Use MosqueSteps to track family steps
- Set a weekly family step goal
- Celebrate milestones with a special treat after Jumuah

### 2. Nature Walk
- Point out birds, trees, and weather during the walk
- Discuss how nature reflects Allah's creation
- Collect leaves or count stars (for Isha walks)

### 3. Dua of the Day
- Teach one new dua each walk
- Practice together on the way
- Review yesterday's dua on the way home

### 4. Race the Clock
- Use MosqueSteps' walking timer
- Try to beat yesterday's walking time (gently!)
- Track improvement over weeks

## Age-Appropriate Tips

| Age | Tips |
|---|---|
| 3-5 | Carry them partway if tired, focus on the experience |
| 6-9 | Let them count steps, teach the reward of each step |
| 10-13 | Give them the phone to navigate with MosqueSteps |
| 14+ | Challenge them to walk independently and meet you there |

## Safety for Family Walks

- **Hold hands** near roads — use crosswalks
- **High-visibility clothing** for Fajr and Isha walks
- **Stick to well-lit routes** — preview in MosqueSteps first
- **Set a meeting point** at the mosque if children walk ahead

## Building the Habit

Consistency matters more than perfection:
- Start with **one prayer per day** as a family walk
- **Friday (Jumuah)** is the easiest starting point
- Celebrate streaks on the [Rewards page](/rewards)
- Let children see their own step count grow

The Prophet ﷺ said: *"Command your children to pray when they are seven"* (Abu Dawud 495). Walking together makes this command joyful rather than burdensome.

---

*Track your family walks with [MosqueSteps](/walk). Find the best route to your mosque with the [Mosque Finder](/mosques).*
    `,
    category: "community",
    tags: ["family", "children", "parenting", "community", "education", "walking"],
    image: "👨‍👩‍👧‍👦",
    readTime: "6 min read",
  },
  },
  {
    slug: "new-muslim-first-time-mosque-guide",
    title: "First Time at the Mosque: A Gentle Guide for New Muslims",
    excerpt: "Walking into a mosque for the first time can feel overwhelming. This step-by-step guide covers what to expect, what to wear, and how to feel at home.",
    content: `
# First Time at the Mosque: A Gentle Guide for New Muslims

Accepting Islam is a beautiful moment. But walking into a mosque for the first time? That can feel daunting. You might wonder: What do I wear? Where do I stand? Will people judge me?

This guide is for you. Take a deep breath — you belong here.

## Before You Go

### Finding a Mosque Near You
Use the [MosqueSteps Mosque Finder](/mosques) to locate the closest mosque. It searches globally using OpenStreetMap — including prayer rooms, Islamic centers, and musallas you might not know about.

### What to Wear
- **Men:** Modest clothing that covers knees and shoulders. Anything clean and respectful works.
- **Women:** Loose clothing that covers arms and legs. Bring a headscarf (hijab) for prayer. Many mosques have spare scarves.
- **Shoes:** You'll remove them at the entrance. Wear easy slip-on shoes.

### Timing
- Arrive **10-15 minutes before** the prayer time. This gives you time to find the prayer hall and settle in.
- Use [MosqueSteps](/dashboard) to see prayer times for your location — the "Leave by" feature tells you exactly when to start walking.

## When You Arrive

### At the Door
- Remove your shoes and place them on the rack
- Enter with your **right foot** and say quietly: *"Bismillah, Allahumma iftah li abwaba rahmatik"* (O Allah, open for me the doors of Your mercy)
- Men and women usually have separate entrances or prayer areas

### Inside the Prayer Hall
- Find a spot in the rows. Fill gaps from the front.
- If you don't know the prayer movements yet, **stand behind someone and follow along**. No one will mind.
- It's okay to not be perfect. Allah sees your effort, not your performance.

## After the Prayer

### Don't Rush Out
Stay a moment. People often greet newcomers warmly. If someone says *"Assalamu Alaikum"* (peace be upon you), respond with *"Wa Alaikum Assalam"* (and upon you peace).

### Introduce Yourself
You don't have to announce that you're new to Islam, but many people find that saying "I'm new here" opens doors to friendship and support.

## Walking to the Mosque: Your First Sunnah

The Prophet ﷺ said: **"Whoever purifies himself in his house then walks to one of the houses of Allah to perform an obligatory prayer, one step will erase a sin and another will raise him a degree."** *(Muslim 666)*

As a new Muslim, every step you take toward the mosque is magnified. You're not just walking — you're beginning a lifelong journey of worship.

### Track Your First Walk
Install [MosqueSteps](/dashboard) and track your first walk. Seeing your steps, distance, and spiritual rewards (hasanat) makes the experience tangible and motivating.

## Common Worries (And Why They Don't Matter)

| Worry | Reality |
|-------|---------|
| "I don't know Arabic" | Many mosques accommodate multiple languages. Dua can be in any language. |
| "I'll make mistakes in prayer" | Everyone did at first. People will gently help if you ask. |
| "I don't know anyone" | Mosques are built for community. You'll know people within weeks. |
| "I look different" | Islam is for everyone. Mosques welcome all races, ages, and backgrounds. |
| "I'm not good enough" | You showed up. That's more than enough. |

## Resources for New Muslims

- [Sunnah of Walking to Prayer](/sunnah) — learn the etiquettes
- [Getting Started with MosqueSteps](/blogs/getting-started-with-mosquesteps) — set up the app
- [FAQ](/faq) — common questions answered

Welcome to the ummah. Your first step toward the mosque is the beginning of something beautiful. 🕌

---

*Find your nearest mosque with [MosqueSteps Mosque Finder](/mosques). Start tracking your walks on the [Dashboard](/dashboard).*
    `,
    category: "guide",
    tags: ["new-muslim", "convert", "revert", "first-time", "mosque-etiquette", "beginner"],
    image: "🌱",
    readTime: "6 min read",
  },
  {
    slug: "how-to-wake-up-for-fajr-consistently",
    title: "How to Wake Up for Fajr and Walk to the Mosque Every Day",
    excerpt: "Struggling with Fajr? Practical tips from sleep science and the Sunnah to wake up consistently and walk to the mosque for the most rewarded prayer.",
    content: `
# How to Wake Up for Fajr and Walk to the Mosque Every Day

Fajr is the prayer most Muslims struggle with — and the one with the greatest reward for those who walk.

**"Give glad tidings to those who walk to the mosques in darkness, of complete light on the Day of Resurrection."** *(Abu Dawud 561)*

Here's how to make it happen consistently.

## The Sleep Science

### Calculate Your Sleep Window
You need 7-8 hours of sleep. If Fajr is at 5:30 AM and your walk takes 15 minutes, you need to wake at **5:00 AM**. That means sleeping by **9:30-10:00 PM**.

The #1 reason people miss Fajr isn't spiritual weakness — it's **going to bed too late**.

### Optimize Sleep Quality
- **No screens 30 minutes before bed** — blue light suppresses melatonin
- **Cool room temperature** (18-20°C / 65-68°F) — your body needs to cool down to sleep deeply
- **Consistent schedule** — go to bed and wake at the same time, even weekends
- **Avoid caffeine after 2 PM** — it has a 6-hour half-life

### Strategic Alarm Placement
- Place your alarm **across the room** so you must physically get up
- Use a gradual alarm (starts quiet, gets louder) — jarring alarms increase cortisol
- Set **two alarms**: one 15 minutes before you need to leave, one at leave time

## The Sunnah Method

The Prophet ﷺ had practical habits that supported waking for Fajr:

### Sleep Early
**"The Prophet ﷺ disliked sleeping before Isha and talking after it."** *(Bukhari 568)*

This hadith establishes the Sunnah of sleeping early — directly enabling Fajr waking.

### Sleep on Your Right Side
**"When you go to bed, perform wudu as for prayer, then lie on your right side."** *(Bukhari 247)*

Sleeping on the right side is a Sunnah and some research suggests it may improve sleep quality.

### Recite Before Sleep
The Prophet ﷺ would recite Ayat al-Kursi and the last two verses of Surah Al-Baqarah before sleeping. This spiritual preparation sets the intention for waking.

## The MosqueSteps Approach

### 1. Set Leave-by Alerts
In the app, enable notifications for Fajr. MosqueSteps calculates exactly when you need to leave based on your walking distance to the mosque.

### 2. Prepare the Night Before
- Set out walking shoes and clothes
- Charge your phone (you'll need it for tracking)
- Know your route — check it in the [Mosque Finder](/mosques) before bed

### 3. Make Wudu Immediately
When your alarm rings, go straight to wudu. Cold water on your face and arms wakes you faster than coffee. The Prophet ﷺ said the first step of walking reward begins with purification at home.

### 4. Walk, Don't Drive
The walk itself wakes you fully. By the time you arrive at the mosque, you're alert, refreshed, and have already earned hasanat for every step.

### 5. Track Your Fajr Streak
Use MosqueSteps to build a Fajr-specific walking streak. The [Stats page](/stats) shows which prayers you walk to — aim to grow your Fajr percentage.

## The 7-Day Fajr Challenge

| Day | Goal | Tip |
|-----|------|-----|
| 1-2 | Just wake up on time | Don't worry about walking yet |
| 3-4 | Walk to mosque for Fajr | Allow extra time, walk slowly |
| 5-6 | Optimize your route | Find the most pleasant path |
| 7 | Celebrate your streak! | Share your MosqueSteps stats |

After 7 days, the habit begins to solidify. After 30 days, it's part of your identity.

## Why Fajr Walking Is Worth It

The Prophet ﷺ said: **"Whoever prays Fajr in congregation, it is as if he stood in prayer the entire night."** *(Muslim 656)*

Combined with the hadith about walking rewards, your Fajr walk earns:
- Hasanat for every step (sin erased + degree raised)
- The reward of praying the entire night
- Complete light on the Day of Judgment
- Health benefits of early morning movement

No other prayer combines this many blessings. Your alarm clock is a portal to extraordinary reward.

---

*Set up Fajr walking alerts in [MosqueSteps Settings](/settings). Track your morning walks on the [Dashboard](/dashboard).*
    `,
    category: "tips",
    tags: ["fajr", "morning", "sleep", "motivation", "consistency", "sunnah", "wake-up"],
    image: "⏰",
    readTime: "7 min read",
  },
  {
    slug: "calories-burned-walking-to-mosque",
    title: "Calories Burned Walking to the Mosque: A Complete Breakdown",
    excerpt: "How many calories does walking to the mosque actually burn? We break down the numbers by distance, weight, pace, and prayer frequency — with a calculator.",
    content: `
# Calories Burned Walking to the Mosque: A Complete Breakdown

"Does walking to the mosque count as exercise?" Yes — and the numbers might surprise you.

## The Basic Formula

Calories burned walking = **0.035 × body weight (kg) × distance (km) × terrain factor**

For a more practical estimate: walking burns approximately **60-100 calories per kilometer** depending on your weight and pace.

## Calorie Burn by Distance

### For a 75 kg (165 lb) person at moderate pace (5 km/h):

| Distance to Mosque | One-Way Calories | Round Trip | Daily (5 prayers) |
|---|---|---|---|
| 500 m | 30 cal | 60 cal | 300 cal |
| 800 m | 48 cal | 96 cal | 480 cal |
| 1 km | 60 cal | 120 cal | 600 cal |
| 1.5 km | 90 cal | 180 cal | 900 cal |
| 2 km | 120 cal | 240 cal | 1,200 cal |

**At 1 km distance, walking to all 5 prayers burns 600 calories per day** — equivalent to a 45-minute run!

## Calorie Burn by Body Weight

Walking 1 km to the mosque and back (2 km total):

| Body Weight | Calories Per Round Trip | Daily (5 prayers) |
|---|---|---|
| 55 kg (121 lb) | 88 cal | 440 cal |
| 70 kg (154 lb) | 112 cal | 560 cal |
| 85 kg (187 lb) | 136 cal | 680 cal |
| 100 kg (220 lb) | 160 cal | 800 cal |

Heavier individuals burn more calories — so if weight management is a goal, walking to the mosque is even more effective.

## Weekly and Monthly Impact

For a 75 kg person walking 1 km to the mosque:

| Frequency | Weekly Calories | Monthly Calories | Equivalent |
|---|---|---|---|
| 1 prayer/day | 840 cal | 3,600 cal | ~0.5 kg fat loss/month |
| 3 prayers/day | 2,520 cal | 10,800 cal | ~1.4 kg fat loss/month |
| 5 prayers/day | 4,200 cal | 18,000 cal | ~2.3 kg fat loss/month |

Walking to all 5 prayers can result in **over 2 kg of fat loss per month** — without any dietary changes.

## Comparison with Other Activities

| Activity (30 minutes) | Calories Burned |
|---|---|
| Sitting at desk | 40 cal |
| Walking to mosque (moderate) | 150 cal |
| Cycling (moderate) | 250 cal |
| Running (8 km/h) | 280 cal |
| Swimming | 250 cal |

Walking is lower intensity but **more sustainable and more frequent** — 5 times daily adds up to more total calories than a single gym session.

## The Hadith Bonus

The Prophet ﷺ said: **"The people who get the most reward for prayer are those who walk the farthest distance."** *(Bukhari 651, Muslim 662)*

Islam incentivizes the **longer walk** — which also burns more calories. The spiritual and physical benefits are perfectly aligned.

## How MosqueSteps Tracks This

MosqueSteps estimates your walk data including:
- **Steps counted** via accelerometer or GPS
- **Distance walked** via GPS tracking
- **Walking time** for each prayer

You can view your cumulative data on the [Stats page](/stats) and watch your step count grow over time.

## The Bottom Line

Walking to the mosque is legitimate, effective exercise. It burns meaningful calories, it's sustainable because prayer provides built-in motivation, and the Prophet ﷺ specifically encouraged it.

The question isn't "does walking to the mosque count as exercise?" — it's **"why would you drive?"**

---

*Track your walking calories with [MosqueSteps](/dashboard). View your weekly stats on the [Stats page](/stats).*
    `,
    category: "health",
    tags: ["calories", "exercise", "weight-loss", "fitness", "walking", "health-benefits"],
    image: "🔥",
    readTime: "6 min read",
  },
  {
    slug: "find-prayer-room-traveling-airports",
    title: "How to Find a Prayer Room While Traveling: Airports, Hotels & Cities",
    excerpt: "Traveling as a Muslim? Here's how to find mosques, prayer rooms, and musallas at airports, hotels, universities, and in unfamiliar cities worldwide.",
    content: `
# How to Find a Prayer Room While Traveling: Airports, Hotels & Cities

Maintaining your prayer while traveling is a challenge every Muslim faces. Whether you're at an airport, a new city, or a roadside rest stop, finding a clean place to pray matters.

## Airports

### Major Airports with Dedicated Prayer Rooms

Most international airports have multi-faith or Muslim-specific prayer rooms:

| Region | Airports with Prayer Rooms |
|---|---|
| Middle East | Nearly all (dedicated musallas in every terminal) |
| Southeast Asia | KLIA, Changi, Soekarno-Hatta, Suvarnabhumi |
| Europe | Heathrow, CDG, Frankfurt, Istanbul, Amsterdam, Munich |
| North America | JFK, LAX, DFW, O'Hare, Dulles, Toronto Pearson |
| Africa | Cairo, Casablanca, Johannesburg |

### How to Find Them
1. **MosqueSteps Mosque Finder** — search "prayer room" or "musalla" in the [Mosque Finder](/mosques). OpenStreetMap tags airport prayer rooms.
2. **Airport websites** — search "[airport name] prayer room" — most list locations and terminal maps
3. **Ask information desks** — airport staff can direct you
4. **Look for "Quiet Room" or "Meditation Room"** — these are often multi-faith spaces suitable for prayer

### Tips for Airport Prayer
- Carry a **travel prayer mat** — lightweight and compact
- Use the [MosqueSteps Dashboard](/dashboard) for accurate prayer times at your destination
- If no prayer room exists, find a quiet corner — airports are generally tolerant of discreet prayer
- Perform wudu at any restroom sink

## Hotels

### Finding Prayer Spaces
- **Ask the front desk** — "Is there a prayer room?" Many hotels in Muslim-majority countries have one.
- **Mosque nearby?** Use the [Mosque Finder](/mosques) to locate mosques within walking distance of your hotel
- **Conference/meeting rooms** — some hotels allow guests to use empty meeting rooms for prayer
- **Your room** — always an option. Use a compass app for qibla direction.

### Hotel Qibla
Many hotel rooms in Muslim-majority countries have a qibla direction arrow in the room or on the ceiling. If not, use any qibla app or compass.

## Universities and Hospitals

### Universities
Many universities worldwide have Muslim Student Associations (MSAs) that maintain:
- Dedicated prayer rooms
- Friday Jumuah services
- Community iftars during Ramadan

Search "[university name] prayer room" or check the university's faith services page.

### Hospitals
Most modern hospitals have:
- Multi-faith chaplaincy rooms
- Quiet rooms that can be used for prayer
- Chaplains who can direct you

## In a New City

### Step-by-Step
1. Open [MosqueSteps Mosque Finder](/mosques)
2. Allow location access or search the city name
3. Browse results sorted by distance
4. Tap any mosque for walking directions

### What the Finder Searches For
MosqueSteps searches OpenStreetMap for: mosques, masjids, musallas, prayer rooms, Islamic centers, suraus, and jamias — covering terminology used worldwide.

### Backup Options
If no mosque is nearby:
- **Parks** — find a clean, quiet spot. Carry a travel mat.
- **Shopping malls** — in Muslim-majority countries, malls have prayer rooms. In the West, look for "family rooms" or ask management.
- **Rest stops** — some highway rest areas have prayer facilities, especially in Turkey, Saudi Arabia, and Malaysia.

## Travel Prayer Essentials

| Item | Why |
|---|---|
| Travel prayer mat | Clean surface anywhere |
| Compass/qibla app | Direction in unfamiliar places |
| MosqueSteps app | Find mosques + prayer times |
| Water bottle | Emergency wudu |
| Light scarf (women) | Always available for prayer |

## The Traveler's Reward

The Prophet ﷺ said: **"When a servant of Allah falls ill or travels, the reward of what he used to do at home when healthy is recorded for him."** *(Bukhari 2996)*

Even when traveling makes it harder, your intention and effort are rewarded. And when you do find a mosque and walk to it in an unfamiliar city — that effort carries extra reward.

---

*Use [MosqueSteps Mosque Finder](/mosques) to discover prayer spaces worldwide. Check prayer times for any location on the [Dashboard](/dashboard).*
    `,
    category: "guide",
    tags: ["travel", "prayer-room", "airport", "musalla", "mosque-finder", "tips"],
    image: "✈️",
    readTime: "6 min read",
  },
  {
    slug: "set-up-mosquesteps-for-elderly-parent",
    title: "How to Set Up MosqueSteps for Your Elderly Parent or Grandparent",
    excerpt: "A quick guide for helping an older family member use MosqueSteps — from installing the PWA to configuring walking speed and prayer reminders.",
    content: `
# How to Set Up MosqueSteps for Your Elderly Parent or Grandparent

Your parent or grandparent walks to the mosque regularly — but they might not track it. Setting up MosqueSteps for them takes 5 minutes and gives them a tool that shows the rewards they're earning with every step.

## Why Set It Up for Them

- **Motivation** — seeing hasanat (spiritual rewards) counted makes each walk feel meaningful
- **Safety** — the walking route is tracked, so you know they arrived safely
- **Health tracking** — step counts help monitor their physical activity
- **Independence** — prayer time reminders help them manage their own schedule
- **Joy** — the streak counter and badges bring daily satisfaction

## Step-by-Step Setup

### 1. Install as a Home Screen App (2 min)
On their phone's browser, go to **mosquesteps.com**:
- **iPhone (Safari):** Tap the Share button (square with arrow) → "Add to Home Screen" → "Add"
- **Android (Chrome):** Tap the three-dot menu → "Install app" or "Add to Home Screen"

This creates an app icon they can tap — no app store needed.

### 2. Set Their Location (1 min)
Open the app → tap the **gear icon** (Settings):
- Tap **"Use Current Location"** — this sets prayer times automatically
- Or search for their city manually if they're not near the phone

### 3. Find Their Mosque (1 min)
Go to **Mosques** tab:
- Allow location access
- Find their regular mosque in the list
- Tap **"Select"** to set it as primary

This mosque is now used for walking distance, step estimates, and leave-by reminders.

### 4. Adjust Walking Speed (30 sec)
In **Settings**, set walking speed to match their pace:
- **3-4 km/h** for a leisurely elderly pace (default is 5)
- This ensures the "Leave by" timer gives them enough time

### 5. Set Stride Length (30 sec)
For more accurate step counts:
- Average elderly stride: **0.5-0.6 meters**
- Set this in Settings → Stride Length

### 6. Enable Prayer Reminders (30 sec)
In Settings → Notifications:
- Enable **leave-by alerts** for prayers they walk to
- The app will notify them when it's time to start walking

## Make It Easy to Use

### Simplify Their Home Screen
- Move the MosqueSteps icon to their **main home screen**
- Place it next to other apps they use daily

### Show Them Two Things
You don't need to explain every feature. Just show:
1. **"Tap here to start walking"** — the Walk button
2. **"Look, your steps and rewards are here"** — the Dashboard

### Check In Periodically
- Look at their [Stats](/stats) together during visits — celebrate their streaks
- Adjust settings if prayer times have shifted (e.g., seasonal changes)
- Make sure notifications are still working

## For Parents Who Aren't Tech-Savvy

- The app requires **zero typing** during daily use — just tap Walk, then End Walk
- Prayer times update **automatically** — no manual input needed
- Everything saves **locally on their device** — no account, no login, no password
- The interface is **large and readable** with clear buttons

## The Reward of Helping

The Prophet ﷺ said: **"Whoever guides someone to goodness will have a reward like the one who did it."** *(Muslim 1893)*

By setting up MosqueSteps for your parent, you share in the reward of every walk they track, every step they take, and every prayer they attend. That's a beautiful form of birr al-walidayn (honoring parents).

---

*Set up MosqueSteps at [mosquesteps.com](/dashboard). Learn more in the [Getting Started guide](/blogs/getting-started-with-mosquesteps).*
    `,
    category: "guide",
    tags: ["elderly", "parents", "setup", "family", "accessibility", "tutorial"],
    image: "👴",
    readTime: "5 min read",
  },
];
