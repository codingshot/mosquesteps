import guideGettingStarted from "@/assets/guides/guide-getting-started.jpg";
import guideFindMosque from "@/assets/guides/guide-find-mosque.jpg";
import guideActiveWalk from "@/assets/guides/guide-active-walk.jpg";
import guideStats from "@/assets/guides/guide-stats.jpg";
import guideNotifications from "@/assets/guides/guide-notifications.jpg";
import guideRewards from "@/assets/guides/guide-rewards.jpg";
import guideHistory from "@/assets/guides/guide-history.jpg";

export interface Guide {
  id: string;
  title: string;
  iconEmoji: string;
  description: string;
  screenshot: string;
  steps: string[];
  tip?: string;
  page: string;
  pageLabel: string;
}

export const guides: Guide[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    iconEmoji: "📱",
    description: "Set up MosqueSteps in under a minute.",
    screenshot: guideGettingStarted,
    steps: [
      "Open the app and go to the Dashboard.",
      "Tap Settings to configure your city for accurate prayer times.",
      "Choose your preferred units (km/miles, km/h or mph) in Settings → Measurement Units.",
      "Set your walking speed and stride length for better estimates.",
      "Use 'Use Current Location' or search your city manually.",
      "Tap 'Save Settings' and you're ready!",
    ],
    tip: "Install MosqueSteps as a PWA from your browser's 'Add to Home Screen' option for the best experience.",
    page: "/settings",
    pageLabel: "Open Settings",
  },
  {
    id: "find-mosque",
    title: "Finding Your Mosque",
    iconEmoji: "📍",
    description: "Discover nearby mosques and set your primary one.",
    screenshot: guideFindMosque,
    steps: [
      "Tap the 'Mosques' tab in the bottom navigation.",
      "Allow location access when prompted, or search a specific area.",
      "Browse the list of nearby mosques sorted by distance.",
      "Tap 'Select' on your preferred mosque to set it as your primary.",
      "The app will calculate distance, estimated steps, and walking time automatically.",
    ],
    tip: "The mosque data comes from OpenStreetMap. If your mosque is missing, you can add it at openstreetmap.org.",
    page: "/mosques",
    pageLabel: "Open Mosque Finder",
  },
  {
    id: "active-walk",
    title: "Tracking a Walk",
    iconEmoji: "🚶",
    description: "Start a real-time walking session with GPS and step counting.",
    screenshot: guideActiveWalk,
    steps: [
      "Tap the Walk button (center) in the bottom navigation.",
      "Select which prayer you're walking for (Fajr, Dhuhr, Asr, Maghrib, Isha, or Jumuah).",
      "Tap 'Start Walking' — the app tracks via GPS and device sensors.",
      "Watch your steps, distance, speed, hasanat, and pace update live.",
      "If you're walking too fast, a Sunnah reminder will appear — walk with tranquility!",
      "Tap 'End Walk' when you arrive. Your walk is saved automatically.",
    ],
    tip: "On devices with accelerometers, the app counts real physical steps. Otherwise, it estimates from GPS distance.",
    page: "/walk",
    pageLabel: "Start a Walk",
  },
  {
    id: "stats",
    title: "Walking Stats & Analytics",
    iconEmoji: "📊",
    description: "View your comprehensive walking dashboard with charts and trends.",
    screenshot: guideStats,
    steps: [
      "Tap the Stats tab in the bottom navigation.",
      "View total steps, hasanat, distance, and time walking.",
      "Check your current streak and best streak.",
      "See average speed, steps per walk, and distance per walk.",
      "Review weekly and monthly step charts.",
      "See which prayers you walk to most often.",
    ],
    tip: "Stats respect your distance (km/mi) and speed (km/h or mph) settings.",
    page: "/stats",
    pageLabel: "View Stats",
  },
  {
    id: "notifications",
    title: "Prayer Reminders",
    iconEmoji: "🔔",
    description: "Get notified when it's time to leave for the mosque.",
    screenshot: guideNotifications,
    steps: [
      "Enable notifications from the Dashboard banner or Settings page.",
      "Allow browser notifications when prompted.",
      "The app calculates a 'Leave by' time for each prayer based on your walking distance.",
      "You'll receive a notification before each prayer with enough time to walk comfortably.",
      "If notifications are blocked, go to Settings → Prayer Notifications for instructions to re-enable.",
    ],
    tip: "Notifications work best when the app is installed as a PWA on your home screen.",
    page: "/settings",
    pageLabel: "Open Settings",
  },
  {
    id: "rewards",
    title: "Spiritual Rewards & Badges",
    iconEmoji: "⭐",
    description: "Track your hasanat and earn badges for consistent walking.",
    screenshot: guideRewards,
    steps: [
      "Tap Rewards in the bottom navigation to see badges.",
      "Badges are earned by reaching milestones: walks, steps, streaks, and specific prayers.",
      "Each step to the mosque earns spiritual rewards based on authentic hadiths.",
      "Switch to the 'Hadiths' tab to read verified hadith references with full Arabic text.",
      "Tap any hadith reference for the complete source and sunnah.com link.",
    ],
    tip: "Walking to Fajr and Isha earns special rewards — 'complete light on the Day of Resurrection' (Abu Dawud 561).",
    page: "/rewards",
    pageLabel: "View Rewards",
  },
  {
    id: "history",
    title: "Walking History",
    iconEmoji: "📋",
    description: "Review your walking journey and track progress over time.",
    screenshot: guideHistory,
    steps: [
      "Visit the History page from Settings or Dashboard.",
      "View all recorded walks with steps, distance, and hasanat.",
      "Switch to Charts tab for weekly visualizations and prayer distribution.",
      "Delete individual walks by tapping the trash icon if needed.",
      "Export your data as JSON from Settings.",
    ],
    tip: "All data is stored locally on your device — nothing is sent to external servers.",
    page: "/history",
    pageLabel: "View History",
  },
];

export function getGuideById(id: string): Guide | undefined {
  return guides.find((g) => g.id === id);
}
