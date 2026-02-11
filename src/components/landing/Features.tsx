import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Footprints, Clock, Star, MapPin, BookOpen, TrendingUp, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Footprints,
    title: "Smart Step Tracking",
    description:
      "Estimate steps to and from the mosque based on distance. Works with your phone's GPS to calculate your journey accurately.",
    page: "/walk",
    pageLabel: "Start Walking",
  },
  {
    icon: Clock,
    title: "Prayer Time Intelligence",
    description:
      "Get prayer times for your mosque with walking adjustments. Know exactly when to leave so you arrive before iqamah.",
    page: "/dashboard",
    pageLabel: "View Dashboard",
  },
  {
    icon: Star,
    title: "Spiritual Rewards Tracker",
    description:
      "Watch your hasanat counter grow with each step. Based on authentic hadiths about the rewards of walking to the mosque.",
    page: "/rewards",
    pageLabel: "View Rewards",
  },
  {
    icon: MapPin,
    title: "Find Nearby Mosques",
    description:
      "Discover mosques near you using OpenStreetMap. See distance, estimated walking time, and steps for each one.",
    page: "/mosques",
    pageLabel: "Find Mosques",
  },
  {
    icon: BookOpen,
    title: "Sunnah Education",
    description:
      "Learn about the virtues of walking to prayer through curated hadith references with links to Sunnah.com.",
    page: "/sunnah",
    pageLabel: "Read Hadiths",
  },
  {
    icon: TrendingUp,
    title: "Progress & Streaks",
    description:
      "Track your daily walking streaks, weekly stats, and long-term spiritual journey growth over time.",
    page: "/stats",
    pageLabel: "View Stats",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-card">
      <div className="container">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2">
            Everything You Need for Your <span className="text-gradient-gold">Blessed Walk</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={f.page}
                className="glass-card p-6 hover:shadow-teal transition-shadow duration-300 block group h-full"
                title={f.page === "/sunnah" ? "Hadiths on walking to the mosque — rewards, Fajr & Isha, tranquility. Links to Sunnah.com." : undefined}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-teal flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{f.description}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">
                  {f.pageLabel} <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
