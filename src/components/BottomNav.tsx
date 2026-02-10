import { Link, useLocation } from "react-router-dom";
import { MapPin, Footprints, BarChart3, Trophy, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/mosques", label: "Mosques", icon: MapPin },
  { path: "/walk", label: "Walk", icon: Footprints, isMain: true },
  { path: "/stats", label: "Stats", icon: BarChart3 },
  { path: "/rewards", label: "Rewards", icon: Trophy },
];

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show on landing, onboarding, legal, or guide pages
  const hiddenPaths = ["/", "/onboarding", "/privacy", "/terms", "/legal", "/guides", "/faq", "/how-it-works", "/sunnah"];
  if (hiddenPaths.includes(currentPath)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-end justify-around px-1 pt-1 pb-1">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path;
          const Icon = tab.icon;

          if (tab.isMain) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center -mt-5"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isActive
                      ? "bg-gradient-teal shadow-teal scale-110"
                      : "bg-gradient-teal shadow-teal/50"
                  }`}
                >
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center py-1.5 px-2 min-w-[56px] relative"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomnav-indicator"
                  className="absolute -top-0.5 w-5 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
