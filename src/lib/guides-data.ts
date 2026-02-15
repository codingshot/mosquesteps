import guideGettingStarted from "@/assets/guides/guide-getting-started.jpg?w=600&format=webp";
import guideFindMosque from "@/assets/guides/guide-find-mosque.jpg?w=600&format=webp";
import guideActiveWalk from "@/assets/guides/guide-active-walk.jpg?w=600&format=webp";
import guideStats from "@/assets/guides/guide-stats.jpg?w=600&format=webp";
import guideNotifications from "@/assets/guides/guide-notifications.jpg?w=600&format=webp";
import guideRewards from "@/assets/guides/guide-rewards.jpg?w=600&format=webp";
import guideHistory from "@/assets/guides/guide-history.jpg?w=600&format=webp";

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
    title: "Getting Started with MosqueSteps",
    iconEmoji: "📱",
    description: "Set up MosqueSteps in under a minute — configure your city, units, and walking preferences.",
    screenshot: guideGettingStarted,
    steps: [
      { text: "Open the app and go to the Dashboard to see your daily overview.", link: "/dashboard", linkLabel: "Open Dashboard" },
      { text: "Tap Settings to configure your city for accurate prayer times.", link: "/settings", linkLabel: "Open Settings" },
      { text: "Choose your preferred units (km/miles, km/h or mph) in Settings → Measurement Units.", link: "/settings", linkLabel: "Open Settings" },
      { text: "Set your walking speed and stride length for better step estimates." },
      { text: "Use 'Use Current Location' or search your city manually to set your home location." },
      { text: "Settings auto-save — you're ready to start walking!" },
    ],
    tip: "Install MosqueSteps as a PWA from your browser's 'Add to Home Screen' option for offline support and push notifications.",
    page: "/settings",
    pageLabel: "Open Settings",
  },
  {
    id: "find-mosque",
    title: "Finding Nearby Mosques",
    iconEmoji: "📍",
    description: "Discover mosques near you using GPS, set your primary mosque, and get walking distance estimates.",
    screenshot: guideFindMosque,
    steps: [
      { text: "Tap the 'Mosques' tab in the bottom navigation bar.", link: "/mosques", linkLabel: "Open Mosque Finder" },
      { text: "Allow location access when prompted — this finds mosques closest to you." },
      { text: "Browse the list of nearby mosques sorted by distance in km or miles." },
      { text: "Tap 'Select' on your preferred mosque to set it as your primary destination." },
      { text: "The app calculates distance, estimated steps, and walking time automatically." },
      { text: "You can assign different mosques to different prayers in Settings → Prayer Mosques.", link: "/settings", linkLabel: "Open Settings" },
    ],
    tip: "Mosque data comes from OpenStreetMap. If your mosque is missing, you can add it in under a minute!",
    tipCTA: { label: "Add a Mosque on OpenStreetMap →", url: "https://www.openstreetmap.org/edit" },
    page: "/mosques",
    pageLabel: "Open Mosque Finder",
  },
  {
    id: "active-walk",
    title: "Tracking a Walk to the Mosque",
    iconEmoji: "🚶",
    description: "Start a real-time walking session with GPS tracking, step counting, and turn-by-turn directions.",
    screenshot: guideActiveWalk,
    steps: [
      { text: "Tap the Walk button (center) in the bottom navigation bar.", link: "/walk", linkLabel: "Start Walking" },
      { text: "Select which prayer you're walking for — Fajr, Dhuhr, Asr, Maghrib, Isha, or Jumuah." },
      { text: "Tap 'Start Walking' — the app tracks your movement via GPS and device motion sensors." },
      { text: "Watch your steps, distance, speed, hasanat, and pace update live on-screen." },
      { text: "Follow turn-by-turn walking directions with voice guidance and haptic alerts." },
      { text: "If you're walking too fast, a Sunnah reminder will appear — walk with tranquility!" },
      { text: "Tap 'End Walk' when you arrive. Your walk is saved automatically to your history.", link: "/history", linkLabel: "View History" },
    ],
    tip: "On devices with accelerometers, the app counts real physical steps. A manual override is available if sensors fail.",
    page: "/walk",
    pageLabel: "Start a Walk",
  },
  {
    id: "stats",
    title: "Walking Stats & Analytics",
    iconEmoji: "📊",
    description: "View your comprehensive walking dashboard with charts, trends, streaks, and prayer distribution.",
    screenshot: guideStats,
    steps: [
      { text: "Tap the Stats tab in the bottom navigation bar.", link: "/stats", linkLabel: "View Stats" },
      { text: "View total steps, hasanat, distance, and time walking at a glance." },
      { text: "Check your current streak and best streak to stay motivated." },
      { text: "See average speed, steps per walk, and distance per walk." },
      { text: "Review weekly and monthly step charts to track your progress." },
      { text: "See which prayers you walk to most often in the prayer distribution chart." },
      { text: "Export your stats data from Settings for personal records.", link: "/settings", linkLabel: "Export Data" },
    ],
    tip: "Stats respect your distance (km/mi) and speed (km/h or mph) settings automatically.",
    page: "/stats",
    pageLabel: "View Stats",
  },
  {
    id: "notifications",
    title: "Prayer Reminders & Notifications",
    iconEmoji: "🔔",
    description: "Get notified before each prayer with enough time to walk comfortably to the mosque.",
    screenshot: guideNotifications,
    steps: [
      { text: "Enable notifications from the Dashboard banner or the Settings page.", link: "/dashboard", linkLabel: "Go to Dashboard" },
      { text: "Allow browser notifications when prompted by your device." },
      { text: "The app calculates a 'Leave by' time for each prayer based on your walking distance." },
      { text: "You'll receive a notification before each prayer with enough time to walk comfortably." },
      { text: "If notifications are blocked, go to Settings → Prayer Notifications for instructions.", link: "/settings", linkLabel: "Open Settings" },
      { text: "View your notification history on the Notifications page.", link: "/notifications", linkLabel: "View Notifications" },
    ],
    tip: "Notifications work best when the app is installed as a PWA on your home screen.",
    page: "/settings",
    pageLabel: "Open Settings",
  },
  {
    id: "rewards",
    title: "Spiritual Rewards & Badges",
    iconEmoji: "⭐",
    description: "Track your hasanat, earn milestone badges, and read verified hadith references about walking to the mosque.",
    screenshot: guideRewards,
    steps: [
      { text: "Tap Rewards in the bottom navigation to see your earned badges.", link: "/rewards", linkLabel: "View Rewards" },
      { text: "Badges are earned by reaching milestones: walks completed, steps taken, streaks, and specific prayers." },
      { text: "Each step to the mosque earns spiritual rewards (hasanat) based on authentic hadiths.", link: "/sunnah", linkLabel: "View Sunnah References" },
      { text: "Switch to the 'Hadiths' tab to read verified hadith references with full Arabic text." },
      { text: "Tap any hadith reference for the complete source and link to sunnah.com." },
      { text: "Share your achievements with a beautiful share card after each walk." },
    ],
    tip: "Walking to Fajr and Isha earns special rewards — 'complete light on the Day of Resurrection' (Abu Dawud 561).",
    page: "/rewards",
    pageLabel: "View Rewards",
  },
  {
    id: "history",
    title: "Walking History & Data Export",
    iconEmoji: "📋",
    description: "Review your complete walking journey, view charts, and export your data for personal records.",
    screenshot: guideHistory,
    steps: [
      { text: "Visit the History page from the bottom navigation.", link: "/history", linkLabel: "View History" },
      { text: "View all recorded walks with steps, distance, hasanat, and prayer name." },
      { text: "Switch to the Charts tab for weekly visualizations and prayer distribution." },
      { text: "Delete individual walks by tapping the trash icon if needed." },
      { text: "Export your data as JSON from Settings → Data Export.", link: "/settings", linkLabel: "Export Data" },
      { text: "All data is stored locally on your device — nothing is sent to external servers." },
    ],
    tip: "Your walk data is 100% private. Export regularly to keep a backup of your spiritual journey.",
    page: "/history",
    pageLabel: "View History",
  },
];

export function getGuideById(id: string): Guide | undefined {
  return guides.find((g) => g.id === id);
}
