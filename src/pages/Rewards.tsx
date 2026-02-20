import { useState } from "react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Star, Footprints, BookOpen, Trophy, Lock, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWalkHistory, getWalkingStats } from "@/lib/walking-history";
import { getBadges, type BadgeProgress, BADGE_CATEGORIES } from "@/lib/badges";
import HadithTooltip, { VERIFIED_HADITHS } from "@/components/HadithTooltip";
import logo from "@/assets/logo.png";

const hadithKeys = ["muslim_666", "abudawud_561", "bukhari_636", "muslim_662", "ibnmajah_1412", "muslim_654"] as const;

const Rewards = () => {
  const stats = getWalkingStats();
  const history = getWalkHistory();
  const allBadges = getBadges(stats);
  const earned = allBadges.filter((b) => b.badge.earned);
  const inProgress = allBadges.filter((b) => !b.badge.earned);
  const [activeTab, setActiveTab] = useState<"badges" | "hadiths">("badges");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Ramadan / Friday stats from history
  const ramadanWalks = stats.ramadanWalks || 0;
  const fridayWalks = stats.fridayWalks || 0;
  const fajrWalks = stats.walksByPrayer?.Fajr || 0;
  const ishaWalks = stats.walksByPrayer?.Isha || 0;

  const categories = ["all", ...Object.keys(BADGE_CATEGORIES)];

  const filteredEarned = earned.filter(b => filterCategory === "all" || b.badge.category === filterCategory);
  const filteredInProgress = inProgress.filter(b => filterCategory === "all" || b.badge.category === filterCategory);

  return (
    <div className="min-h-screen bg-background pb-bottom-nav">
      <SEOHead title="Rewards & Badges" description="Track your spiritual rewards (hasanat) and earn badges for walking to the mosque. Based on authentic hadiths." path="/rewards" />
      <header className="bg-gradient-gold">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold text-foreground">Spiritual Rewards</span>
          </Link>
        </div>
        <div className="container pb-6 text-center">
          <Star className="w-10 h-10 text-foreground mx-auto mb-2" />
          <h1 className="text-xl font-bold text-foreground">
            Every Step is a Blessing
          </h1>
          <p className="text-sm text-foreground/70 mt-2 max-w-md mx-auto">
            <HadithTooltip hadithKey="muslim_666" className="text-foreground/70">
              Each step toward the mosque earns you immense spiritual rewards — one step erases a sin, another raises you a degree.
            </HadithTooltip>
          </p>
          <div className="flex justify-center gap-4 mt-3 text-sm text-foreground/80 flex-wrap">
            <span><Trophy className="w-4 h-4 inline mr-1" />{earned.length}/{allBadges.length} badges</span>
            <span><Star className="w-4 h-4 inline mr-1" />{stats.totalHasanat.toLocaleString()} hasanat</span>
            {ramadanWalks > 0 && <span>🌙 {ramadanWalks} Ramadan walks</span>}
            {fridayWalks > 0 && <span>🕌 {fridayWalks} Fridays</span>}
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-4">
        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1" role="tablist" aria-label="Rewards sections">
          <button
            role="tab"
            aria-selected={activeTab === "badges"}
            aria-controls="rewards-badges-panel"
            id="rewards-tab-badges"
            onClick={() => setActiveTab("badges")}
            className={`flex-1 py-2 min-h-[44px] text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
              activeTab === "badges" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0" aria-hidden /> Badges
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "hadiths"}
            aria-controls="rewards-hadiths-panel"
            id="rewards-tab-hadiths"
            onClick={() => setActiveTab("hadiths")}
            className={`flex-1 py-2 min-h-[44px] text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
              activeTab === "hadiths" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden /> Hadiths
          </button>
        </div>

        {activeTab === "badges" && (
          <div id="rewards-badges-panel" role="tabpanel" aria-labelledby="rewards-tab-badges" className="space-y-5">
            {/* Reward calculation */}
            <div className="glass-card p-5">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Footprints className="w-5 h-5 text-primary" /> How Rewards Are Calculated
              </h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• <HadithTooltip hadithKey="muslim_666">Each step <strong>to</strong> the mosque: 1 sin erased + 1 degree raised</HadithTooltip></p>
                <p>• Each step <strong>from</strong> the mosque: same rewards apply</p>
                <p>• <HadithTooltip hadithKey="abudawud_561">Walking in darkness (Fajr/Isha): promised <strong>complete light</strong> on Judgment Day</HadithTooltip></p>
                <p>• <HadithTooltip hadithKey="muslim_662">Living farther = <strong>greater reward</strong> per journey</HadithTooltip></p>
              </div>
            </div>

            {/* Special walk stats */}
            {(ramadanWalks > 0 || fajrWalks > 0 || ishaWalks > 0 || fridayWalks > 0) && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold" /> Special Walks
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {ramadanWalks > 0 && (
                    <div className="bg-primary/5 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{ramadanWalks}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">🌙 Ramadan walks</p>
                    </div>
                  )}
                  {fridayWalks > 0 && (
                    <div className="bg-primary/5 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{fridayWalks}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">🕌 Friday walks</p>
                    </div>
                  )}
                  {fajrWalks > 0 && (
                    <div className="bg-primary/5 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{fajrWalks}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">🌅 Fajr walks</p>
                    </div>
                  )}
                  {ishaWalks > 0 && (
                    <div className="bg-primary/5 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{ishaWalks}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">🌃 Isha walks</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Category filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {categories.map((cat) => {
                const meta = BADGE_CATEGORIES[cat];
                const label = cat === "all" ? "All" : meta?.label ?? cat;
                const emoji = cat === "all" ? "🏅" : meta?.emoji ?? "";
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      filterCategory === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {emoji} {label}
                  </button>
                );
              })}
            </div>

            {/* Earned badges */}
            {filteredEarned.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Earned ({filteredEarned.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {filteredEarned.map((bp, i) => (
                    <motion.div
                      key={bp.badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="glass-card p-4 text-center ring-2 ring-gold/30"
                    >
                      <span className="text-3xl block mb-2">{bp.badge.icon}</span>
                      <p className="font-semibold text-foreground text-sm">{bp.badge.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{bp.badge.description}</p>
                      <p className="text-[10px] text-gold mt-1.5">✓ Earned{bp.badge.earnedDate ? ` ${new Date(bp.badge.earnedDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* In-progress badges */}
            {filteredInProgress.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mt-2">
                  In Progress ({filteredInProgress.length})
                </h3>
                <div className="space-y-2">
                  {filteredInProgress.map((bp) => (
                    <div key={bp.badge.id} className="glass-card p-4 flex items-center gap-3">
                      <span className="text-2xl opacity-40">{bp.badge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          {bp.badge.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{bp.badge.requirement}</p>
                        <div className="mt-1.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-teal rounded-full transition-all duration-500" style={{ width: `${bp.percent}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{bp.current.toLocaleString()} / {bp.target.toLocaleString()}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{Math.round(bp.percent)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {filteredEarned.length === 0 && filteredInProgress.length === 0 && (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground text-sm">No badges in this category yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "hadiths" && (
          <div id="rewards-hadiths-panel" role="tabpanel" aria-labelledby="rewards-tab-hadiths" className="space-y-4">
            {hadithKeys.map((key, i) => {
              const h = VERIFIED_HADITHS[key];
              if (!h) return null;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-5"
                >
                  {h.arabic && (
                    <p className="font-arabic text-sm text-right leading-loose text-muted-foreground mb-3">
                      {h.arabic}
                    </p>
                  )}
                  <HadithTooltip hadithKey={key}>
                    <p className="text-sm text-muted-foreground italic leading-relaxed mb-3">
                      "{h.fullText}"
                    </p>
                  </HadithTooltip>
                  <div className="flex items-center justify-between">
                    <a
                      href={h.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary hover:underline"
                      title="Open full hadith on Sunnah.com — Arabic, chain of narration, and translations"
                    >
                      — {h.source} ↗
                    </a>
                    {h.grade && (
                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                        {h.grade}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <div className="text-center py-4">
              <a
                href="https://sunnah.com/search?q=walking+to+mosque"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
                title="Search Sunnah.com for more hadiths about walking to the mosque"
              >
                Explore more on Sunnah.com →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rewards;
