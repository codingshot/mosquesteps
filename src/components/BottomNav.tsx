import { Link, useLocation } from "react-router-dom";
import { MapPin, Footprints, BarChart3, Trophy, LayoutDashboard, Play } from "lucide-react";
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

  // Show prominent Walk Now CTA on dashboard
  const showWalkCTA = currentPath === "/dashboard";

  return (
    <>
      {/* Sticky Walk Now CTA above bottom nav on dashboard */}
      {showWalkCTA && (
        <div className="fixed bottom-[68px] left-0 right-0 z-[9998] px-4 pb-2 safe-area-bottom">
          <Link to="/walk">
            <button className="w-full bg-gradient-teal text-primary-foreground font-bold py-3.5 rounded-2xl shadow-teal flex items-center justify-center gap-2 text-base active:scale-[0.98] transition-transform">
              <Play className="w-5 h-5" /> Walk Now
            </button>
          </Link>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-end justify-around px-2 pt-2 pb-2">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path;
            const Icon = tab.icon;

            if (tab.isMain) {
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className="flex flex-col items-center -mt-6"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-teal shadow-teal scale-110 ring-4 ring-background"
                        : "bg-gradient-teal shadow-teal/50 ring-4 ring-background"
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
    </>
  );
};

export default BottomNav;
