export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "sunnah" | "guide" | "tips";
  tags: string[];
  image: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "virtues-of-walking-to-mosque",
    title: "The Immense Virtues of Walking to the Mosque",
    excerpt: "Every step you take toward the mosque earns spiritual rewards. Discover the authentic hadiths that describe the blessings of this simple act.",
    content: `
Walking to the mosque is one of the most rewarded daily acts in Islam. The Prophet ﷺ said:

**"Whoever purifies himself in his house then walks to one of the houses of Allah to perform an obligatory prayer, one step will erase a sin and another will raise him a degree in status."** *(Muslim 666)*

This means every single step counts — alternating between removing sins and elevating your rank with Allah.

## The Reward Multiplies with Distance

The further you walk, the greater your reward. The Prophet ﷺ said:

**"The people who get the most reward for prayer are those who walk the farthest distance to it."** *(Bukhari 651, Muslim 662)*

So if you live far from the mosque, don't see it as a burden — see it as an opportunity for greater blessings.

## Walking in Darkness Carries Special Light

The Prophet ﷺ gave glad tidings to those who walk to the mosque in darkness:

**"Give glad tidings to those who walk to the mosques in darkness, of complete light on the Day of Resurrection."** *(Abu Dawud 561)*

Fajr and Isha prayers, often performed when it's dark, carry this extraordinary promise.

## Practical Steps to Earn These Rewards

1. **Set your primary mosque** in MosqueSteps to see accurate walking times
2. **Track every walk** — the app counts your steps and calculates hasanat
3. **Walk with tranquility** — the Sunnah is to walk calmly, not rush
4. **Make dua while walking** — your steps are acts of worship
5. **Be consistent** — build a walking streak for lasting habits

Every step matters. Start tracking today and witness your blessings multiply.
    `,
    category: "sunnah",
    tags: ["hadith", "rewards", "walking", "mosque"],
    image: "🕌",
    readTime: "4 min read",
  },
  {
    slug: "sunnah-of-going-to-prayer",
    title: "The Sunnah Etiquettes of Going to Prayer",
    excerpt: "Learn the Prophet's ﷺ guidance on how to walk to the mosque — from making wudu at home to entering with the right foot.",
    content: `
The Prophet ﷺ taught detailed etiquettes for walking to the mosque. Following these turns a simple walk into a complete act of worship.

## 1. Make Wudu at Home

The Prophet ﷺ said: **"Whoever purifies himself in his house then walks to one of the houses of Allah..."** *(Muslim 666)*

Making wudu at home before walking amplifies your reward. Each step begins from a state of purity.

## 2. Walk with Tranquility

**"When the iqamah is called, do not come rushing. Come walking with tranquility."** *(Bukhari 908)*

Rushing negates the calm, meditative state that walking to prayer should bring. Walk at a steady, peaceful pace.

## 3. Supplicate While Walking

The Prophet ﷺ taught us a dua for going to the mosque:

**"O Allah, place light in my heart, light in my tongue, light in my hearing, light in my sight..."** *(Bukhari 6316)*

Making dhikr and dua while walking transforms every moment of your journey into worship.

## 4. Enter with the Right Foot

When entering the mosque, step in with your right foot and say:

**"Bismillah, Allahumma iftah li abwaba rahmatik"** *(O Allah, open for me the doors of Your mercy)*

## 5. Don't Interlace Your Fingers

The Prophet ﷺ said: **"If one of you performs wudu and goes out heading for the mosque, let him not interlace his fingers, for he is in prayer."** *(Abu Dawud 562)*

From the moment you leave your home for the mosque, you are considered in a state of prayer.

## Track These Habits with MosqueSteps

Use the app to build consistency in these beautiful Sunnah practices. Every tracked walk reminds you of the rewards you're earning.
    `,
    category: "sunnah",
    tags: ["etiquette", "sunnah", "dua", "wudu"],
    image: "📿",
    readTime: "5 min read",
  },
  {
    slug: "fajr-isha-special-rewards",
    title: "Why Fajr and Isha Carry the Greatest Walking Rewards",
    excerpt: "Walking to Fajr and Isha prayers in the darkness earns extraordinary spiritual rewards — complete light on the Day of Resurrection.",
    content: `
Among all five daily prayers, Fajr and Isha hold a special place for those who walk to the mosque.

## Complete Light on Judgment Day

The Prophet ﷺ said:

**"Give glad tidings to those who walk to the mosques in darkness, of complete light on the Day of Resurrection."** *(Abu Dawud 561)*

Fajr before dawn and Isha after nightfall — these are the prayers walked in darkness, and they carry the promise of divine light.

## The Heaviest Prayers for Hypocrites

**"The most burdensome prayers for the hypocrites are Isha and Fajr. If only they knew what they contain, they would come to them even if they had to crawl."** *(Bukhari 657)*

Your commitment to walk to these prayers distinguishes you as a sincere believer.

## Equal to Standing the Entire Night

**"Whoever prays Isha in congregation, it is as if he stood in prayer for half the night. And whoever prays Fajr in congregation, it is as if he stood in prayer the entire night."** *(Muslim 656)*

Combined with walking, these prayers multiply your rewards exponentially.

## Tips for Consistent Fajr and Isha Walks

1. **Set leave-by alerts** in MosqueSteps for Fajr and Isha specifically
2. **Prepare the night before** — set out walking clothes and shoes
3. **Sleep early** to wake refreshed for Fajr
4. **Find a walking buddy** for safety in darkness
5. **Track your Fajr/Isha streak** in the app's rewards section

The app shows which prayers you walk to most — aim to increase your Fajr and Isha percentage.
    `,
    category: "sunnah",
    tags: ["fajr", "isha", "rewards", "darkness"],
    image: "🌙",
    readTime: "4 min read",
  },
  {
    slug: "getting-started-with-mosquesteps",
    title: "Getting Started with MosqueSteps: A Complete Setup Guide",
    excerpt: "Set up MosqueSteps in under a minute. Configure your city, find your mosque, and start tracking your blessed walks.",
    content: `
Welcome to MosqueSteps! Here's everything you need to get started.

## Step 1: Install as a PWA

For the best experience, install MosqueSteps on your phone:
- **iOS Safari**: Tap Share → "Add to Home Screen"
- **Android Chrome**: Tap ⋮ menu → "Install App"
- **Desktop**: Click the install icon in the address bar

This enables offline support and push notifications.

## Step 2: Set Your City

Go to **Settings** and either:
- Tap **"Use Current Location"** for automatic setup
- Search for your city manually

This ensures accurate prayer times for your timezone and location.

## Step 3: Find Your Mosque

Navigate to the **Mosques** tab and:
1. Allow location access
2. Browse nearby mosques from OpenStreetMap
3. Tap **"Select"** on your preferred mosque
4. It becomes your primary mosque for distance calculations

## Step 4: Configure Your Walking Profile

In **Settings**, adjust:
- **Walking speed** (default: 5 km/h)
- **Stride length** for accurate step estimates
- **Distance units** (km or miles)

## Step 5: Start Your First Walk

Tap the **Walk** button in the bottom nav:
1. Select which prayer you're walking for
2. Tap "Start Walking"
3. Watch your steps, distance, and hasanat update live
4. Tap "End Walk" when you arrive

Your walk is saved automatically to your history.

## Step 6: Explore Your Dashboard

The Dashboard shows:
- Current prayer times with leave-by reminders
- Your walking streak
- Quick stats and hasanat counter
- Distance to your primary mosque

You're all set! Every step is a blessing. 🕌
    `,
    category: "guide",
    tags: ["setup", "getting-started", "pwa", "tutorial"],
    image: "🚀",
    readTime: "3 min read",
  },
  {
    slug: "tracking-walks-effectively",
    title: "How to Track Your Mosque Walks Effectively",
    excerpt: "Get the most accurate step counts and distance tracking. Learn tips for GPS accuracy, sensor calibration, and walk logging.",
    content: `
MosqueSteps uses your device's sensors and GPS to track walks accurately. Here's how to get the best results.

## How Step Counting Works

The app uses two methods:
1. **Device accelerometer** — counts physical steps via motion sensors (most accurate)
2. **GPS estimation** — calculates steps from distance when sensors aren't available

Your stride length setting in Settings directly affects GPS-based estimates, so calibrate it.

## Tips for Accurate Tracking

### GPS Accuracy
- Walk outdoors with a clear sky view
- Avoid starting a walk indoors — wait until you're outside
- Keep your phone in your pocket, not in a bag deep inside

### Step Counting
- Keep your phone on your body (pocket or armband)
- Walk at a natural pace — very slow walks may not register on accelerometer
- The app filters out non-walking movements automatically

## Understanding Your Walk Data

After each walk, you'll see:
- **Steps** — total physical or estimated steps
- **Distance** — GPS-measured walking distance
- **Duration** — total walk time
- **Average speed** — your pace in km/h or mph
- **Hasanat** — spiritual rewards based on step count

## Reviewing Past Walks

Go to **History** to see all recorded walks. You can:
- View individual walk details
- Switch to Charts view for weekly trends
- See prayer distribution (which prayers you walk to most)
- Delete incorrect walks

## Building Consistency

The app tracks your **walking streak** — consecutive days you walked to the mosque. Use the Stats page to see:
- Current and best streaks
- Weekly and monthly step charts
- Average distance per walk

Consistency is key. Even a short walk to a nearby mosque counts!
    `,
    category: "guide",
    tags: ["tracking", "gps", "steps", "accuracy"],
    image: "📱",
    readTime: "4 min read",
  },
  {
    slug: "health-benefits-walking-mosque",
    title: "The Physical and Spiritual Health Benefits of Walking to the Mosque",
    excerpt: "Walking to prayer combines physical exercise with spiritual devotion — a holistic approach to well-being rooted in Islamic tradition.",
    content: `
Walking to the mosque is a beautiful intersection of physical health and spiritual growth. Islam encourages both.

## Physical Benefits

### Cardiovascular Health
Walking 5 times daily to the mosque provides consistent cardiovascular exercise. Even a 10-minute walk each way adds up to 100 minutes of walking per day.

### Weight Management
A brisk walk burns approximately 3-5 calories per minute. Five daily walks can burn 300-500 extra calories.

### Joint Health
Walking is low-impact exercise that maintains joint flexibility and strengthens muscles around knees and hips.

### Mental Clarity
Regular walking reduces stress hormones and increases endorphins. Walking before prayer creates a calm, focused state of mind for khushu (concentration in prayer).

## The Islamic Perspective on Health

The Prophet ﷺ said: **"Your body has a right over you."** *(Bukhari 5199)*

Taking care of your physical health is a form of worship. By walking to the mosque, you fulfill:
- The Sunnah of walking to prayer
- Your body's right to exercise
- Your mind's need for calm and reflection

## Combining Worship and Wellness

MosqueSteps helps you see both dimensions:
- **Steps and distance** track your physical activity
- **Hasanat counter** tracks your spiritual rewards
- **Streak tracking** builds both physical and spiritual habits

## Making It a Daily Habit

1. Start with the closest prayer to your mosque's walking distance
2. Gradually add more prayers as walking becomes natural
3. Use MosqueSteps notifications to remind you when to leave
4. Track your progress in Stats to stay motivated

The best worship is that which is consistent, even if small.
    `,
    category: "tips",
    tags: ["health", "fitness", "wellness", "sunnah"],
    image: "💪",
    readTime: "4 min read",
  },
  {
    slug: "mosque-finder-tips",
    title: "Finding Mosques Near You: Tips for Using the Mosque Finder",
    excerpt: "MosqueSteps uses OpenStreetMap to find mosques. Learn how to get the best results and contribute missing mosques.",
    content: `
The Mosque Finder in MosqueSteps uses OpenStreetMap data to locate mosques near you. Here's how to use it effectively.

## How It Works

The app queries the Overpass API (OpenStreetMap) to find:
- Buildings tagged as mosques
- Places of worship with Islamic denomination
- Prayer rooms and musallas

Results are sorted by distance from your location.

## Getting Best Results

### Allow Location Access
The app needs your GPS location to find nearby mosques. Make sure location permissions are granted.

### Search Radius
By default, the app searches within 8km. If you're in a rural area, you might need to check a larger city nearby.

### Walking Routes
Tap any mosque to see a walking route with:
- Estimated walking distance (via real roads, not straight line)
- Walking time based on your speed setting
- Turn-by-turn directions
- Step count estimate

## Your Mosque Is Missing?

OpenStreetMap is community-edited. If your mosque isn't listed:

1. Go to [openstreetmap.org](https://openstreetmap.org)
2. Create a free account
3. Find your mosque's location on the map
4. Add it with the correct tags (building=mosque, amenity=place_of_worship, religion=muslim)
5. It will appear in MosqueSteps within a few days

## Setting Your Primary Mosque

Tap "Select" on any mosque to set it as primary. This mosque is used for:
- Dashboard distance display
- Walking time estimates
- Leave-by prayer reminders
- Quick-start walks

You can change your primary mosque anytime from the Mosques page.
    `,
    category: "guide",
    tags: ["mosque-finder", "openstreetmap", "gps", "navigation"],
    image: "🗺️",
    readTime: "3 min read",
  },
  {
    slug: "building-walking-streak",
    title: "Building a Walking Streak: Consistency in the Sunnah",
    excerpt: "The most beloved deeds to Allah are the most consistent. Learn how to build and maintain a walking streak to the mosque.",
    content: `
The Prophet ﷺ said: **"The most beloved deeds to Allah are the most consistent, even if they are small."** *(Bukhari 6464)*

Building a consistent walking habit to the mosque embodies this hadith perfectly.

## What Is a Walking Streak?

A walking streak counts consecutive days you've recorded at least one walk to the mosque in MosqueSteps. Your current streak and best streak are displayed on the Stats page.

## Strategies for Building Your Streak

### Start Small
Don't try to walk all five prayers on day one. Start with one prayer — perhaps the one closest to your schedule.

### Choose Your Anchor Prayer
Pick one prayer that you'll always walk to:
- **Fajr** if you're a morning person
- **Dhuhr/Asr** if you work near a mosque
- **Maghrib** if evenings are free
- **Isha** for the special darkness rewards

### Use Leave-By Alerts
Enable notifications in MosqueSteps. The app calculates when you need to leave based on walking distance and gives you a timely reminder.

### Track Progress Visually
Check your Stats page regularly:
- Weekly step charts show your consistency
- Prayer distribution shows which prayers you walk to
- Streak counter motivates you to keep going

## When You Break a Streak

Don't be discouraged! The Prophet ﷺ said: **"All the sons of Adam are sinners, and the best of sinners are those who repent."** *(Tirmidhi 2499)*

Start fresh. Your previous walks and rewards are never lost. The app saves all your history — you're building something lasting.

## The Compound Effect

Walking once might seem small. But over a year:
- 365 walks × 1,000 steps = 365,000 blessed steps
- That's roughly 250 km of walking to prayer
- Countless sins erased, degrees raised, and light accumulated

Consistency transforms small acts into monumental achievements.
    `,
    category: "tips",
    tags: ["streak", "consistency", "habits", "motivation"],
    image: "🔥",
    readTime: "4 min read",
  },
];

export function getBlogsByCategory(category: BlogPost["category"]): BlogPost[] {
  return blogPosts.filter((p) => p.category === category);
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = blogPosts.find((p) => p.slug === currentSlug);
  if (!current) return blogPosts.slice(0, limit);
  
  // Score by shared tags, then same category
  const scored = blogPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({
      post: p,
      score:
        p.tags.filter((t) => current.tags.includes(t)).length * 2 +
        (p.category === current.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.post);
}

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
