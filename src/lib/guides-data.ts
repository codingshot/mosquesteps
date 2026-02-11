import guideGettingStarted from "@/assets/guides/guide-getting-started.jpg";
import guideFindMosque from "@/assets/guides/guide-find-mosque.jpg";
import guideActiveWalk from "@/assets/guides/guide-active-walk.jpg";
import guideStats from "@/assets/guides/guide-stats.jpg";
import guideNotifications from "@/assets/guides/guide-notifications.jpg";
import guideRewards from "@/assets/guides/guide-rewards.jpg";
import guideHistory from "@/assets/guides/guide-history.jpg";

export interface GuideStep {
  text: string;
  link?: string; // optional link to a page
  linkLabel?: string; // label for the link
}

export interface Guide {
  id: string;
  title: string;
  iconEmoji: string;
  description: string;
  screenshot: string;
  steps: GuideStep[];
  tip?: string;
  tipCTA?: { label: string; url: string }; // optional CTA button in tip
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
      { text: "Open the app and go to the Dashboard.", link: "/dashboard", linkLabel: "Open Dashboard" },
      { text: "Tap Settings to configure your city for accurate prayer times.", link: "/settings", linkLabel: "Open Settings" },
      { text: "Choose your preferred units (km/miles, km/h or mph) in Settings → Measurement Units.", link: "/settings", linkLabel: "Open Settings" },
      { text: "Set your walking speed and stride length for better estimates." },
      { text: "Use 'Use Current Location' or search your city manually." },
      { text: "Settings auto-save — you're ready!" },
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
      { text: "Tap the 'Mosques' tab in the bottom navigation.", link: "/mosques", linkLabel: "Open Mosque Finder" },
      { text: "Allow location access when prompted, or search a specific area." },
      { text: "Browse the list of nearby mosques sorted by distance." },
      { text: "Tap 'Select' on your preferred mosque to set it as your primary." },
      { text: "The app will calculate distance, estimated steps, and walking time automatically." },
    ],
    tip: "The mosque data comes from OpenStreetMap. If your mosque is missing, you can contribute to the community by adding it — it only takes a minute!",
    tipCTA: { label: "Add a Mosque on OpenStreetMap →", url: "https://www.openstreetmap.org/edit" },
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
      { text: "Tap the Walk button (center) in the bottom navigation.", link: "/walk", linkLabel: "Start Walking" },
      { text: "Select which prayer you're walking for (Fajr, Dhuhr, Asr, Maghrib, Isha, or Jumuah)." },
      { text: "Tap 'Start Walking' — the app tracks via GPS and device sensors." },
      { text: "Watch your steps, distance, speed, hasanat, and pace update live." },
      { text: "If you're walking too fast, a Sunnah reminder will appear — walk with tranquility!" },
      { text: "Tap 'End Walk' when you arrive. Your walk is saved automatically." },
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
      { text: "Tap the Stats tab in the bottom navigation.", link: "/stats", linkLabel: "View Stats" },
      { text: "View total steps, hasanat, distance, and time walking." },
      { text: "Check your current streak and best streak." },
      { text: "See average speed, steps per walk, and distance per walk." },
      { text: "Review weekly and monthly step charts." },
      { text: "See which prayers you walk to most often." },
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
      { text: "Enable notifications from the Dashboard banner or Settings page.", link: "/dashboard", linkLabel: "Go to Dashboard" },
      { text: "Allow browser notifications when prompted." },
      { text: "The app calculates a 'Leave by' time for each prayer based on your walking distance." },
      { text: "You'll receive a notification before each prayer with enough time to walk comfortably." },
      { text: "If notifications are blocked, go to Settings → Prayer Notifications for instructions to re-enable.", link: "/settings", linkLabel: "Open Settings" },
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
      { text: "Tap Rewards in the bottom navigation to see badges.", link: "/rewards", linkLabel: "View Rewards" },
      { text: "Badges are earned by reaching milestones: walks, steps, streaks, and specific prayers." },
      { text: "Each step to the mosque earns spiritual rewards based on authentic hadiths.", link: "/sunnah", linkLabel: "View Sunnah References" },
      { text: "Switch to the 'Hadiths' tab to read verified hadith references with full Arabic text." },
      { text: "Tap any hadith reference for the complete source and sunnah.com link." },
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
      { text: "Visit the History page from the bottom navigation.", link: "/history", linkLabel: "View History" },
      { text: "View all recorded walks with steps, distance, and hasanat." },
      { text: "Switch to Charts tab for weekly visualizations and prayer distribution." },
      { text: "Delete individual walks by tapping the trash icon if needed." },
      { text: "Export your data as JSON from Settings.", link: "/settings", linkLabel: "Open Settings" },
    ],
    tip: "All data is stored locally on your device — nothing is sent to external servers.",
    page: "/history",
    pageLabel: "View History",
  },
];

export function getGuideById(id: string): Guide | undefined {
  return guides.find((g) => g.id === id);
}
