import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Footprints, Bell, Star, Settings2, BarChart3, Smartphone, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const guides = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Smartphone className="w-5 h-5" />,
    description: "Set up MosqueSteps in under a minute.",
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
  },
  {
    id: "find-mosque",
    title: "Finding Your Mosque",
    icon: <MapPin className="w-5 h-5" />,
    description: "Discover nearby mosques and set your primary one.",
    steps: [
      "Tap the 'Mosques' tab in the bottom navigation.",
      "Allow location access when prompted, or search a specific area.",
      "Browse the list of nearby mosques sorted by distance.",
      "Tap 'Select' on your preferred mosque to set it as your primary.",
      "The app will calculate distance, estimated steps, and walking time automatically.",
    ],
    tip: "The mosque data comes from OpenStreetMap. If your mosque is missing, you can add it at openstreetmap.org.",
    page: "/mosques",
  },
  {
    id: "active-walk",
    title: "Tracking a Walk",
    icon: <Footprints className="w-5 h-5" />,
    description: "Start a real-time walking session with GPS and step counting.",
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
  },
  {
    id: "stats",
    title: "Walking Stats & Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    description: "View your comprehensive walking dashboard with charts and trends.",
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
  },
  {
    id: "notifications",
    title: "Prayer Reminders",
    icon: <Bell className="w-5 h-5" />,
    description: "Get notified when it's time to leave for the mosque.",
    steps: [
      "Enable notifications from the Dashboard banner or Settings page.",
      "Allow browser notifications when prompted.",
      "The app calculates a 'Leave by' time for each prayer based on your walking distance.",
      "You'll receive a notification before each prayer with enough time to walk comfortably.",
    ],
    tip: "Notifications work best when the app is installed as a PWA on your home screen.",
    page: "/settings",
  },
  {
    id: "rewards",
    title: "Spiritual Rewards & Badges",
    icon: <Star className="w-5 h-5" />,
    description: "Track your hasanat and earn badges for consistent walking.",
    steps: [
      "Tap Rewards in the bottom navigation to see badges.",
      "Badges are earned by reaching milestones: walks, steps, streaks, and specific prayers.",
      "Each step to the mosque earns spiritual rewards based on authentic hadiths.",
      "Switch to the 'Hadiths' tab to read verified hadith references with full Arabic text.",
      "Tap any hadith reference for the complete source and sunnah.com link.",
    ],
    tip: "Walking to Fajr and Isha earns special rewards — 'complete light on the Day of Resurrection' (Abu Dawud 561).",
    page: "/rewards",
  },
  {
    id: "history",
    title: "Walking History",
    icon: <BarChart3 className="w-5 h-5" />,
    description: "Review your walking journey and track progress over time.",
    steps: [
      "Visit the History page from Settings or Dashboard.",
      "View all recorded walks with steps, distance, and hasanat.",
      "Switch to Charts tab for weekly visualizations and prayer distribution.",
      "Delete individual walks by tapping the trash icon if needed.",
      "Export your data as JSON from Settings.",
    ],
    tip: "All data is stored locally on your device — nothing is sent to external servers.",
    page: "/history",
  },
];

const Guides = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-4 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          </Link>
          <span className="font-bold">User Guides</span>
        </div>
        <div className="container pb-8 text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">How to Use MosqueSteps</h1>
          <p className="text-sm text-primary-foreground/70 mt-2 max-w-md mx-auto">
            Step-by-step guides to help you get the most out of your walking journey to the mosque.
          </p>
        </div>
      </header>

      <div className="container py-8 space-y-6 max-w-2xl">
        {guides.map((guide, i) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="glass-card overflow-hidden"
          >
            <div className="bg-gradient-teal p-4 flex items-center gap-3 text-primary-foreground">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                {guide.icon}
              </div>
              <div>
                <h2 className="font-bold text-lg">{guide.title}</h2>
                <p className="text-xs text-primary-foreground/70">{guide.description}</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <ol className="space-y-3">
                {guide.steps.map((step, j) => (
                  <li key={j} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-gradient-gold text-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              {guide.tip && (
                <div className="bg-secondary rounded-lg p-3 text-xs text-secondary-foreground">
                  <span className="font-semibold">💡 Tip:</span> {guide.tip}
                </div>
              )}

              <Link
                to={guide.page}
                className="inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                Open {guide.title} page →
              </Link>
            </div>
          </motion.div>
        ))}

        {/* PWA Install Guide */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Install as App (PWA)
          </h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>iOS Safari:</strong> Tap the Share button → "Add to Home Screen"</p>
            <p><strong>Android Chrome:</strong> Tap the menu (⋮) → "Add to Home Screen" or "Install App"</p>
            <p><strong>Desktop Chrome/Edge:</strong> Click the install icon in the address bar</p>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Installing as a PWA enables offline support, push notifications, and a native app-like experience.
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center pt-4">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Guides;
