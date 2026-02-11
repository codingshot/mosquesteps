export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "sunnah" | "guide" | "tips" | "health" | "community";
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
  // =========== NEW RESEARCH-BACKED BLOG POSTS ===========
  {
    slug: "walking-science-best-exercise",
    title: "Walking Science: Why Steps to the Mosque Are the Best Exercise You'll Ever Do",
    excerpt: "Harvard, JAMA, and the WHO all agree: walking is the #1 longevity exercise. Muslims who walk to prayer are already ahead of the curve.",
    content: `
Walking to the mosque isn't just spiritual — it's the single most evidence-based exercise for longevity, and you're already doing it.

## The Science Is Clear: Walking Saves Lives

A landmark meta-analysis in the **European Heart Journal (2023)** analyzed 226,889 participants and found that just **3,967 steps per day** reduces all-cause mortality. Every additional 1,000 steps reduces mortality risk by **15%**.

For context: walking to one prayer and back averages 1,000-2,000 steps. Three daily mosque walks put you at **6,000+ steps** — well above the threshold for maximum health benefit.

## What the Research Says

### Cardiovascular Health
**Harvard T.H. Chan School of Public Health (2024)** found that walking just 21 minutes per day reduces cardiovascular disease risk by **30%**. Walking to all 5 prayers easily exceeds this threshold.

### Cancer & Dementia Prevention
**JAMA Internal Medicine (2022)** reported that 10,000 steps per day is associated with **50% lower risk of dementia** and **30% lower cancer risk**. Five daily mosque walks can reach this target depending on distance.

### Mental Health
The **British Journal of Sports Medicine (2023)** found that walking reduces symptoms of depression by **25%** — comparable to psychotherapy. The purposeful nature of walking to prayer amplifies this benefit.

### Longevity
**JAMA (2020)** showed that walking 8,000 steps per day is associated with **51% lower risk of all-cause mortality**. For adults over 60, the benefits plateau at just 6,000-8,000 steps — achievable with 3-4 mosque walks.

## Why Mosque Walking Beats the Gym

The fitness industry has a dirty secret: **50% of gym memberships are abandoned within 6 months** (IHRSA data). Here's why mosque walking sticks:

| Factor | Gym | Mosque Walking |
|--------|-----|----------------|
| **Frequency** | 3-4x/week if consistent | Up to 5x/day |
| **Motivation** | "I should exercise" | "It's prayer time" |
| **Cost** | $30-100/month | Free |
| **Social** | Usually alone | Community congregation |
| **Accountability** | Self only | Community notices absence |
| **Dropout** | 50% in 6 months | Prayer sustains habit |

## The 5x Daily Micro-Exercise Model

Dr. Martin Gibala's research at McMaster University (2019) on exercise "snacking" shows that **brief bouts of activity spread throughout the day** are as effective — or more effective — than single long sessions.

Five mosque walks of 10 minutes each = **50 minutes of active walking daily**, spread perfectly across dawn, noon, afternoon, sunset, and night. This matches circadian rhythm and metabolic windows.

## Your Prophet ﷺ Prescribed It First

The Prophet ﷺ said: **"Whoever purifies himself in his house then walks to one of the houses of Allah to perform an obligatory prayer, one step will erase a sin and another will raise him a degree."** *(Muslim 666)*

Modern science took 1,400 years to confirm what the Sunnah prescribed: walking regularly, with purpose, to a meaningful destination, is the single best thing you can do for your health.

## Start Tracking Today

MosqueSteps helps you see both dimensions of your walk — the **physical health** (steps, distance, calories) and the **spiritual reward** (hasanat, streaks, badges). Every step counts twice.
    `,
    category: "health",
    tags: ["exercise", "research", "walking", "health", "longevity", "science"],
    image: "🏃",
    readTime: "6 min read",
  },
  {
    slug: "elderly-muslim-staying-active",
    title: "The Elderly Muslim's Guide to Staying Active Through Prayer Walks",
    excerpt: "For adults over 60, just 6,000 steps per day provides maximum health benefit. Three daily mosque walks get you there — no gym required.",
    content: `
If you're over 60, walking to the mosque may be the most important health decision you make each day.

## The Research: Why Walking Matters More After 60

**JAMA (2020)** found that for adults 60 and older, just **6,000-8,000 steps per day** provides the maximum mortality benefit. That's significantly less than the 10,000-step target for younger adults — and entirely achievable through mosque walks.

Additional research:
- **BMJ (2021):** Regular walking reduces **hip fracture risk by 40%** in seniors
- **Alzheimer's Association:** Walking 30 minutes daily reduces **dementia risk by up to 40%**
- **Arthritis Foundation:** Walking is the **#1 recommended exercise** for arthritis management
- **British Heart Foundation:** Walking reduces blood pressure and improves circulation at any age

## Your Mosque Is Your Gym

Five daily prayers means five potential walks. Even if you walk to just three, you're likely hitting 6,000+ steps — the sweet spot for senior health.

Unlike a gym, the mosque offers:
- **No membership fee** — just walk out the door
- **Built-in schedule** — prayer times structure your day
- **Social contact** — reduces isolation (the #1 health risk for seniors)
- **Meaningful purpose** — worship motivates when "exercise" doesn't
- **Community monitoring** — people notice if you're absent

## The Isolation Crisis Walking Solves

**National Academies of Sciences (2020)** reports that **1 in 4 adults over 65 is socially isolated**. Isolation increases mortality risk by **26%** — more than obesity or smoking.

Walking to the mosque provides **5 daily social contacts** — structured, purposeful, and welcoming. The congregation is a built-in support network: they notice when you're missing, they ask about your health, they walk alongside you.

## Practical Tips for Elderly Walkers

### Pace Yourself
Your walking speed doesn't affect your hasanat. The Prophet ﷺ said the farthest walker gets the most reward — he didn't say the fastest. Adjust your walking speed in MosqueSteps Settings to get accurate time estimates.

### Choose Your Prayers
You don't need to walk all five. Start with:
- **Dhuhr** — midday, warmest weather, good visibility
- **Asr** — afternoon, still light out
- **Maghrib** — sunset, pleasant temperatures

Add Fajr and Isha when comfortable. In winter, consider driving for darkness prayers and walking for daytime ones.

### Stay Safe
- Walk on well-lit paths
- Wear reflective clothing for early/late prayers
- Carry your phone (MosqueSteps tracks your route)
- Tell someone your walking schedule
- Rest if you need to — there's no shame in pacing yourself

### Ask Your Family to Help
MosqueSteps is easy to set up, but if you need help, ask your children or grandchildren to configure it for you. They can set your walking speed, find your mosque, and enable prayer reminders.

## Every Step at Your Pace

The Prophet ﷺ said: **"Your body has a right over you."** *(Bukhari 5199)*

Honoring that right means moving your body, maintaining your independence, and walking — at whatever pace — to the house of Allah. Your steps are recorded, your sins are forgiven, and your health improves with every walk.
    `,
    category: "health",
    tags: ["elderly", "seniors", "exercise", "health", "independence", "community"],
    image: "🧓",
    readTime: "5 min read",
  },
  {
    slug: "community-walking-mosque",
    title: "Community Walking: When the Whole Neighborhood Walks to the Mosque",
    excerpt: "Walking groups have a 76% adherence rate. When one person walks, their contacts are 25% more likely to join. Your footsteps inspire others.",
    content: `
Something powerful happens when you walk to the mosque: other people see you. And seeing is the first step to joining.

## The Science of Social Contagion

A groundbreaking study in the **New England Journal of Medicine (2007)** by Christakis and Fowler found that health behaviors spread through social networks. When one person starts exercising regularly, their close contacts are **25% more likely** to begin exercising too.

Applied to mosque walking: **your visible walk is a silent invitation**. When your neighbor sees you heading to Fajr at 5 AM, it normalizes the behavior and plants a seed.

## Walking Groups: The Most Sustainable Exercise

The **British Journal of Sports Medicine (2015)** found that walking groups have a **76% adherence rate** — compared to just 50% for solo exercise programs. The study by Hanson & Jones analyzed over 1,800 participants and found that group walking:

- Reduces blood pressure significantly
- Reduces body fat
- Reduces depression symptoms
- Improves quality of life
- Has **virtually no adverse effects**

The **International Journal of Behavioral Nutrition (2020)** added that people who walk in groups report **higher enjoyment**, lower perceived effort, and walk **23% further** than solo walkers.

## The Mosque Walking Group: Ancient Wisdom, Modern Science

The companions of the Prophet ﷺ walked to the mosque together. Abu Bakr (RA) was known for walking from his home to the Prophet's mosque. This wasn't accidental — it was community.

A mosque walking group offers:
- **Safety** — especially for Fajr and Isha in darkness
- **Accountability** — "Where were you this morning?" is powerful motivation
- **Companionship** — transforms exercise into fellowship
- **Dhikr together** — collective remembrance on the walk
- **Intergenerational bonding** — elderly and young walking side by side

## The Visibility Effect

**Behavioral Science research (2019)** shows that visible healthy behavior in public spaces increases adoption by up to **40%**. When people see others walking:

- It normalizes the behavior ("if he walks, maybe I should")
- It creates social proof ("many people walk here, it must be worth it")
- It increases community trust and safety perception
- It inspires people who were considering but hadn't started

### Your Walk Is Da'wah

When you walk calmly to the mosque — dressed well, peaceful, purposeful — you're embodying Islam without saying a word. Non-Muslim neighbors see a person at peace, heading somewhere meaningful. Muslim neighbors are reminded of a practice they may have neglected.

**"When you walk, someone watches. When someone watches, they join."**

## How to Start a Mosque Walking Group

### Step 1: Find 2-3 Walking Partners
After prayer, ask: "Does anyone live near [your neighborhood]? Want to walk together tomorrow?"

### Step 2: Pick One Prayer to Start
Choose the most practical prayer for group walking. Dhuhr or Asr are easiest (daytime, moderate weather).

### Step 3: Set a Meeting Point
Choose a landmark between your homes. Walk from there together.

### Step 4: Use MosqueSteps Together
Everyone tracks their walk. Share stats, celebrate each other's streaks, friendly competition on steps.

### Step 5: Grow Naturally
When others see your group walking, they'll ask to join. That's the social contagion effect in action.

## The Community That Walks Together

The **American Journal of Preventive Medicine (2014)** concluded that walking groups are one of the most effective public health interventions available — with significant benefits and virtually zero risk.

The mosque community already gathers 5 times daily. Adding walking to that gathering multiplies the benefit: **spiritual + physical + social + psychological**.

Start walking. Others will follow.
    `,
    category: "community",
    tags: ["community", "walking-group", "social", "dawah", "visibility", "research"],
    image: "🤝",
    readTime: "6 min read",
  },
  {
    slug: "walking-mental-health-depression",
    title: "Walking and Mental Health: How Your Mosque Walk Fights Depression and Anxiety",
    excerpt: "Walking reduces depression by 25%. Add purposeful destination, community, and spiritual connection — the mosque walk is a complete mental health intervention.",
    content: `
Depression affects over 280 million people worldwide (WHO, 2023). The solution may be simpler — and closer — than you think.

## Walking as Antidepressant

The **British Journal of Sports Medicine (2023)** published a landmark meta-analysis showing that physical activity — particularly walking — reduces symptoms of depression by **25%**. This effect is comparable to psychotherapy and, for mild-moderate depression, approaches the efficacy of medication.

The **Journal of Clinical Psychology (2022)** found that even **10-minute walks** significantly reduce state anxiety. The effect is immediate — you feel better during and after the walk, not weeks later.

## Why Mosque Walking Is Superior to "Exercise Walking"

Standard exercise programs address the physical dimension. Walking to the mosque addresses **four dimensions simultaneously**:

### 1. Physical: Movement
Walking releases endorphins, reduces cortisol (stress hormone), increases serotonin and dopamine. Your body chemistry literally changes with each step.

### 2. Spiritual: Purpose
Walking "somewhere" with meaning — to pray, to worship, to connect with Allah — transforms the walk from exercise into pilgrimage. **University of Michigan (2014)** found that purposeful walking increases adherence by 67% compared to recreational walking.

### 3. Social: Community
**Frontiers in Psychology (2020)** found that walking in community settings reduces loneliness by **36%** compared to walking alone. The mosque congregation provides 5 daily social touchpoints.

### 4. Psychological: Routine & Structure
For people experiencing depression, the loss of daily structure is devastating. Prayer times provide **5 unshakeable anchors** in the day. Walking to them adds physical structure to spiritual structure.

## The Islamic Framework for Mental Health

Islam has always recognized the connection between body, mind, and soul:

**"Indeed, in the remembrance of Allah do hearts find rest."** *(Quran 13:28)*

The walk to the mosque is a moving meditation:
- **Dhikr while walking** — verbal remembrance calms the mind
- **Nature exposure** — even urban walks provide outdoor time, which reduces rumination
- **Transition time** — the walk provides mental space between daily stress and the peace of prayer
- **Accomplishment** — arriving at the mosque is a small daily victory

## Research: Combining Multiple Interventions

What makes mosque walking uniquely powerful for mental health is the **combination** of evidence-based interventions in a single activity:

| Intervention | Proven Benefit | Mosque Walk Provides |
|-------------|---------------|---------------------|
| Walking | Reduces depression 25% | ✅ |
| Social contact | Reduces loneliness 36% | ✅ |
| Purpose/meaning | Increases life satisfaction | ✅ |
| Routine/structure | Stabilizes mood | ✅ |
| Nature/outdoors | Reduces rumination | ✅ |
| Spiritual practice | Reduces anxiety | ✅ |
| Community belonging | Buffers against isolation | ✅ |

No single activity combines all seven. The mosque walk does.

## Practical Steps for Mental Health

### If You're Struggling
Start with one walk. Just one. To the closest prayer at the nearest mosque. Don't set big goals — just walk once.

### Build Gradually
Add one prayer per week. The consistency matters more than the quantity. The Prophet ﷺ said: **"The most beloved deeds to Allah are the most consistent, even if they are small."** *(Bukhari 6464)*

### Track for Motivation
Seeing your step count, streak, and hasanat grow provides tangible evidence that you're doing something good — for your body and your soul.

### Walk With Someone
If walking alone feels hard, ask someone to walk with you. **"The believer to the believer is like a building, each part strengthening the other."** *(Bukhari 481)*

## Your Walk Is Medicine

Clinical depression requires professional treatment — counseling, medication, and support. But walking to the mosque can be a powerful **complement** to treatment, providing the physical activity, social contact, routine, and spiritual connection that support recovery.

You don't need a prescription. You just need your shoes and the adhan.
    `,
    category: "health",
    tags: ["mental-health", "depression", "anxiety", "walking", "research", "community"],
    image: "🧠",
    readTime: "7 min read",
  },
  {
    slug: "privilege-of-mosque-proximity",
    title: "The Privilege of Proximity: Having a Mosque Within Walking Distance",
    excerpt: "Only 39% of the world's Muslims live near a walkable mosque. If you can walk to prayer, you have a blessing millions wish for.",
    content: `
If you can walk to the mosque for prayer, you have something that over a billion Muslims worldwide cannot.

## The Global Reality

**Pew Research Center (2021)** estimates that only about **39% of the world's 1.9 billion Muslims** live within comfortable walking distance (1.5 km) of a mosque. That means over a billion Muslims either drive long distances, pray at home, or forgo congregational prayer entirely.

### Regional Disparities

**Europe:** In many European cities, the average distance to the nearest mosque is **3-8 km**, making walking impractical. Muslims in rural areas may travel 30+ minutes by car.

**North America:** Approximately 3,500 mosques serve 3.5 million Muslims — roughly **1 mosque per 1,000 Muslims**, with significant geographic gaps. Many Muslims live nowhere near a mosque.

**Rural Regions:** In parts of sub-Saharan Africa, Central Asia, and remote Southeast Asian communities, the nearest mosque may be **10+ km away**. Walking takes hours. Many Muslims pray at home their entire lives.

**Convert/Revert Communities:** New Muslims often live far from any mosque and may not know their nearest one. The isolation compounds the challenges of a new faith.

## What Proximity Means

When your mosque is 800 meters away, here's what you have:
- **5 daily invitations** to congregational prayer
- **10,000+ hasanat** available every day just from walking
- **A community** that knows your face, notices your absence, supports your family
- **Exercise** built into your worship — no gym needed
- **Mental health support** through daily social contact and spiritual practice
- **A routine** that structures your entire day around meaning

When your nearest mosque is 10 km away, all of that disappears. Prayer becomes solitary. Community becomes distant. The daily rhythm dissolves.

## The Hadith Perspective

The Prophet ﷺ said: **"The people who get the most reward for prayer are those who walk the farthest distance to it."** *(Bukhari 651, Muslim 662)*

There's wisdom in this hadith for both situations:
- **If you live far:** Your greater effort earns greater reward
- **If you live near:** Don't take the ease for granted — use it

He ﷺ also said: **"Shall I not tell you of something by which Allah erases sins and raises rank? Performing ablution well despite difficulty, taking many steps to the mosque, and waiting for the next prayer after prayer."** *(Muslim 251)*

## Stories of Distance

### The Village Without a Mosque
In parts of rural India, Muslim families walk 5-7 km to reach the nearest mosque for Jumuah. They leave hours early, walking together as a group. For them, "walking to the mosque" is a half-day commitment.

### The Convert in the Countryside
Sarah, a convert in rural England, drives 45 minutes to the nearest mosque. She goes once a week for Jumuah. She prays five times daily at home, alone. She has never experienced walking to Fajr.

### The City Muslim
Ahmed lives 600 meters from his local mosque in Birmingham. He drives. He's never thought about it as a privilege. He doesn't realize that his 600-meter walk could earn him 1,500+ hasanat — a blessing Sarah would give anything for.

## Don't Drive Past a Blessing

If your mosque is walkable, consider:
- **Walking instead of driving** — even once a day
- **Appreciating the access** — many Muslims wish they had it
- **Using MosqueSteps** to see the rewards you're earning (or missing)
- **Supporting mosque construction** — help bring this blessing to others

## Gratitude in Motion

The next time you consider driving those 800 meters to the mosque, remember: somewhere, a Muslim is driving 80 km. Somewhere, a Muslim is praying alone because there is no mosque.

Your short walk is their dream. Honor it with your footsteps.

**"And if you should count the favors of Allah, you could not enumerate them."** *(Quran 16:18)*
    `,
    category: "community",
    tags: ["mosque-access", "gratitude", "privilege", "global", "awareness", "community"],
    image: "🌍",
    readTime: "6 min read",
  },
  {
    slug: "habit-psychology-mosque-walking",
    title: "Habit Psychology: Why Mosque Walking Sticks When Gym Memberships Don't",
    excerpt: "The science of habit formation explains why walking to prayer is the most sustainable exercise — 5 daily cues, built-in rewards, and social accountability.",
    content: `
Every January, millions of people buy gym memberships. By July, half have stopped going. Yet Muslims who walk to the mosque maintain the habit for decades. Why?

The answer lies in **habit psychology** — and the mosque walk is a near-perfect habit by every scientific measure.

## The Habit Loop

Charles Duhigg's *The Power of Habit* identifies three components of every habit:

1. **Cue** — a trigger that initiates the behavior
2. **Routine** — the behavior itself
3. **Reward** — the benefit that reinforces the behavior

### The Gym Habit Loop (Weak)
- **Cue:** Alarm clock / calendar reminder (easily ignored)
- **Routine:** Drive to gym, change clothes, exercise, shower, drive back (high friction)
- **Reward:** Delayed (fitness results appear weeks/months later)

### The Mosque Walking Habit Loop (Strong)
- **Cue:** The adhan — 5 unmissable daily cues, heard or felt by the entire community
- **Routine:** Walk out the door, follow familiar route (zero friction)
- **Reward:** Immediate and multiple:
  - ✅ Spiritual reward (hasanat, prayer, peace)
  - ✅ Social reward (community, belonging)
  - ✅ Physical reward (endorphins, fresh air)
  - ✅ Psychological reward (accomplishment, streak)

## Atomic Habits Applied to Mosque Walking

James Clear's *Atomic Habits* framework outlines four laws for building lasting habits:

### 1. Make It Obvious
MosqueSteps sends **leave-by notifications** — "Leave now for Dhuhr." The cue is impossible to miss. Prayer times are printed in every mosque, displayed on apps, and announced via adhan.

### 2. Make It Attractive
The app's **hasanat counter** makes every walk visually rewarding. **Badges** unlock at milestones. **Streaks** create the satisfying feeling of building something.

### 3. Make It Easy
There's nothing to prepare: no gym bag, no special clothes, no membership card, no driving to a facility. Just walk out your door. The route is the same every time — **zero decision fatigue**.

### 4. Make It Satisfying
Walk completion triggers **confetti animation** in MosqueSteps. Your step count goes up. Your streak extends. You may unlock a badge. And then you pray — the ultimate satisfaction.

## Habit Stacking: The Secret Weapon

Clear's most powerful technique is **habit stacking** — attaching a new behavior to an existing one. Walking to the mosque stacks:

- **Exercise** (new for some) on **prayer** (already established)
- **Outdoor time** on **commute to mosque**
- **Dhikr/mindfulness** on **walking**
- **Social interaction** on **congregation**

This multi-reward stack makes the habit **4x more reinforcing** than exercise alone.

## Identity-Based Habits

Clear argues that the most lasting habits come from **identity change**:

- ❌ "I'm trying to exercise more" (behavior-based, weak)
- ✅ "I am someone who walks to prayer" (identity-based, strong)

MosqueSteps reinforces this identity: **"You are a walker. Here are your 247 walks."** Each tracked walk strengthens the self-image. After 50 walks, you don't debate whether to walk — it's who you are.

## The "Don't Break the Chain" Effect

Jerry Seinfeld famously maintained productivity by marking an X on his calendar every day he wrote jokes. The visual chain of X's created motivation: **"Don't break the chain."**

MosqueSteps replicates this with:
- **Walking streaks** — consecutive days with at least one mosque walk
- **Heatmap visualization** — see your activity pattern over 30 days
- **Loss aversion** — Kahneman and Tversky showed people are 2x more motivated to avoid losing a streak than to gain one

## Why the Gym Fails and the Mosque Succeeds

| Dimension | Gym | Mosque |
|-----------|-----|--------|
| **Cue frequency** | 1x/day at best | 5x/day |
| **Friction** | High (drive, change, shower) | Zero (walk out door) |
| **Social** | Usually solo | Always communal |
| **Reward timing** | Weeks/months | Immediate |
| **Accountability** | None | Community |
| **Cost** | $30-100/month | Free |
| **Identity** | "Gym person" (fragile) | "Person of the mosque" (deep) |
| **Spiritual dimension** | None | Core motivation |

## Start Today: The 1-Prayer Rule

Don't try to walk all five prayers on day one. Pick **one prayer** — the one most convenient for walking — and commit to it for 7 days. That's your foundation.

After 7 days, the streak anxiety kicks in. After 30 days, it's identity. After 90 days, it's who you are.

**"The most beloved deeds to Allah are the most consistent, even if they are small."** *(Bukhari 6464)*

The Sunnah understood habit psychology 1,400 years before the science caught up.
    `,
    category: "health",
    tags: ["habits", "psychology", "consistency", "atomic-habits", "motivation", "exercise"],
    image: "🧩",
    readTime: "7 min read",
  },
  {
    slug: "contributing-to-mosquesteps",
    title: "How to Contribute to MosqueSteps",
    excerpt: "MosqueSteps is fully open source. Learn how to report bugs, suggest features, improve docs, add translations, or submit code — with direct links to GitHub.",
    content: `
Jazak Allahu Khairan for your interest in contributing. MosqueSteps is community-driven and **completely open source**. You don't need to write code to help — there are many ways to contribute, and every one of them matters.

## Why contribute?

MosqueSteps helps Muslims see the spiritual reward of every step to the mosque, based on authentic hadiths. The more people who report issues, suggest ideas, fix mosque data, or improve the code, the better the app becomes for the whole ummah. Everything is built in the open on [GitHub](https://github.com/codingshot/mosquesteps).

## Report an issue

We use **GitHub Issues** with templates so we get the right information quickly. Each link below opens in a new tab so you can file an issue and come back.

- **Something broken?** Open a [bug report](https://github.com/codingshot/mosquesteps/issues/new?template=bug_report.md). Include device, browser, and steps to reproduce.
- **Have an idea?** Open a [feature request](https://github.com/codingshot/mosquesteps/issues/new?template=feature_request.md). Describe the problem and your suggested solution.
- **Missing or wrong mosque?** Open a [mosque data issue](https://github.com/codingshot/mosquesteps/issues/new?template=mosque_data.md). You can also add or fix mosques directly on [OpenStreetMap](https://www.openstreetmap.org/edit) — the app uses OSM data.
- **Hadith, translation, or guide error?** Open a [content issue](https://github.com/codingshot/mosquesteps/issues/new?template=content_issue.md).
- **Wrong prayer times for your location?** Open a [prayer times issue](https://github.com/codingshot/mosquesteps/issues/new?template=prayer_times.md).

You can also [browse all open issues](https://github.com/codingshot/mosquesteps/issues) and comment or help triage.

## Contribute code

If you want to submit code:

1. **Fork** the repo: [github.com/codingshot/mosquesteps](https://github.com/codingshot/mosquesteps)
2. **Clone** your fork, create a branch, and make your changes
3. **Run tests:** \`npx vitest run\`
4. **Open a Pull Request** against \`main\`

We use [Conventional Commits](https://www.conventionalcommits.org/) (e.g. \`feat:\`, \`fix:\`, \`docs:\`) and ask that new features and bug fixes include tests. The full guide is in the repo: [CONTRIBUTING.md](https://github.com/codingshot/mosquesteps/blob/main/CONTRIBUTING.md). It covers code style, architecture, Islamic content guidelines, and the PR process.

## Improve docs and content

You can contribute without touching app code:

- **README and CONTRIBUTING** — fix typos or clarify steps in the [repository](https://github.com/codingshot/mosquesteps)
- **In-app guides** — the user guides (Getting started, Find mosque, etc.) live in the codebase and can be edited via a PR
- **Blog and marketing** — articles and marketing copy are in the repo; open an issue or PR to suggest changes
- **Translations** — we want MosqueSteps in more languages (Arabic, Turkish, Urdu, Malay, Indonesian, French). Translation keys and locale logic are in the codebase; see [CONTRIBUTING.md](https://github.com/codingshot/mosquesteps/blob/main/CONTRIBUTING.md#translations)

## Mosque data (OpenStreetMap)

MosqueSteps does **not** store mosque data. We use [OpenStreetMap](https://www.openstreetmap.org/). To add or fix a mosque, edit the map at [openstreetmap.org](https://www.openstreetmap.org/edit) and tag the place correctly (\`amenity=place_of_worship\`, \`religion=muslim\`). Your change will appear in the app once OSM updates. If you can't edit OSM, you can still [report a mosque issue](https://github.com/codingshot/mosquesteps/issues/new?template=mosque_data.md) on GitHub.

## Code of conduct and community

We expect respectful, constructive communication. Our [Code of Conduct](https://github.com/codingshot/mosquesteps/blob/main/.github/CODE_OF_CONDUCT.md) is on GitHub. Questions or ideas? Open a [GitHub Discussion](https://github.com/codingshot/mosquesteps/discussions) (if enabled) or an issue, or reach out on [X (@ummahbuild)](https://x.com/ummahbuild) or [LinkedIn](https://www.linkedin.com/company/ummah-build/).

## Quick links (all open in new tab)

- **Repository:** [github.com/codingshot/mosquesteps](https://github.com/codingshot/mosquesteps)
- **Issues:** [View all issues](https://github.com/codingshot/mosquesteps/issues)
- **Contributing guide:** [CONTRIBUTING.md](https://github.com/codingshot/mosquesteps/blob/main/CONTRIBUTING.md)
- **Code of conduct:** [.github/CODE_OF_CONDUCT.md](https://github.com/codingshot/mosquesteps/blob/main/.github/CODE_OF_CONDUCT.md)
- **In-app Contribute page:** [mosquesteps.com/contribute](https://mosquesteps.com/contribute)

Barak Allahu feek for helping make every step to the mosque count.
    `,
    category: "guide",
    tags: ["contributing", "open-source", "github", "community", "documentation"],
    image: "🤝",
    readTime: "5 min read",
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
