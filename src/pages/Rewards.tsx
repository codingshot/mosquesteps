import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Star, Footprints, BookOpen, Trophy, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { getWalkingStats } from "@/lib/walking-history";
import { getBadges, type BadgeProgress } from "@/lib/badges";
import HadithTooltip, { VERIFIED_HADITHS } from "@/components/HadithTooltip";
import logo from "@/assets/logo.png";

const hadithKeys = ["muslim_666", "abudawud_561", "bukhari_636", "muslim_662", "ibnmajah_1412", "muslim_654"] as const;

const Rewards = () => {
  const stats = getWalkingStats();
  const allBadges = getBadges(stats);
  const earned = allBadges.filter((b) => b.badge.earned);
  const inProgress = allBadges.filter((b) => !b.badge.earned);
  const [activeTab, setActiveTab] = useState<"badges" | "hadiths">("badges");

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-gold">
        <div className="container py-4 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          </Link>
          <span className="font-bold text-foreground">Spiritual Rewards</span>
        </div>
        <div className="container pb-8 text-center">
          <Star className="w-12 h-12 text-foreground mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-foreground">
            Every Step is a Blessing
          </h1>
          <p className="text-sm text-foreground/70 mt-2 max-w-md mx-auto">
            <HadithTooltip hadithKey="muslim_666" className="text-foreground/70">
              Each step toward the mosque earns you immense spiritual rewards — one step erases a sin, another raises you a degree.
            </HadithTooltip>
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-foreground/80">
            <span><Trophy className="w-4 h-4 inline mr-1" />{earned.length}/{allBadges.length} badges</span>
            <span><Star className="w-4 h-4 inline mr-1" />{stats.totalHasanat.toLocaleString()} hasanat</span>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-4">
        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab("badges")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
              activeTab === "badges" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Trophy className="w-4 h-4" /> Badges
          </button>
          <button
            onClick={() => setActiveTab("hadiths")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
              activeTab === "hadiths" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Hadiths
          </button>
        </div>

        {activeTab === "badges" && (
          <div className="space-y-6">
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

            {/* Earned badges */}
            {earned.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Earned ({earned.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {earned.map((bp, i) => (
                    <motion.div
                      key={bp.badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card p-4 text-center ring-2 ring-gold/30"
                    >
                      <span className="text-3xl block mb-2">{bp.badge.icon}</span>
                      <p className="font-semibold text-foreground text-sm">{bp.badge.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{bp.badge.description}</p>
                      <p className="text-[10px] text-gold mt-1">✓ Earned</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* In-progress badges */}
            {inProgress.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  In Progress ({inProgress.length})
                </h3>
                <div className="space-y-2">
                  {inProgress.map((bp) => (
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
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{Math.round(bp.percent)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "hadiths" && (
          <div className="space-y-4">
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
