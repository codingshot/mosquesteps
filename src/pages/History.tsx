import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Footprints, Clock, Star, Flame, Trash2, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getWalkHistory, getWalkingStats, deleteWalkEntry, getSettings, type WalkEntry } from "@/lib/walking-history";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png?w=256&format=webp";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const History = () => {
  const [history, setHistory] = useState<WalkEntry[]>([]);
  const [stats, setStats] = useState(getWalkingStats());
  const [activeTab, setActiveTab] = useState<"log" | "charts">("log");
  const settings = getSettings();
  const isImperial = settings.distanceUnit === "mi";
  const formatDist = (km: number) => isImperial ? `${(km * 0.621371).toFixed(2)} mi` : `${km.toFixed(2)} km`;

  useEffect(() => {
    setHistory(getWalkHistory());
    setStats(getWalkingStats());
  }, []);

  const handleDelete = (id: string) => {
    deleteWalkEntry(id);
    setHistory(getWalkHistory());
    setStats(getWalkingStats());
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  // Weekly chart data (last 7 days)
  const getWeeklyData = () => {
    const today = new Date();
    const days: { label: string; steps: number; walks: number; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayWalks = history.filter((e) => e.date.startsWith(dateStr));
      days.push({
        label: DAYS_OF_WEEK[d.getDay()],
        steps: dayWalks.reduce((s, e) => s + e.steps, 0),
        walks: dayWalks.length,
        date: dateStr,
      });
    }
    return days;
  };

  // Prayer distribution
  const getPrayerData = () => {
    const counts: Record<string, number> = {};
    history.forEach((e) => {
      if (e.prayer && e.prayer !== "Unknown") {
        counts[e.prayer] = (counts[e.prayer] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const weeklyData = getWeeklyData();
  const maxSteps = Math.max(...weeklyData.map((d) => d.steps), 1);
  const prayerData = getPrayerData();
  const totalPrayerWalks = prayerData.reduce((s, [, c]) => s + c, 0);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Walking History"
        description="View your walking history to the mosque, weekly charts, and total steps. MosqueSteps."
        path="/history"
        noindex
      />
      <header className="bg-card border-b border-border">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2" aria-label="Go back to dashboard">
            <ArrowLeft className="w-5 h-5 text-foreground" />
            <span className="text-sm font-medium">Back</span>
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold text-foreground">Walking History</span>
          </Link>
        </div>
      </header>

      <div className="container py-6 space-y-6 pb-bottom-nav">
        {/* Stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-card p-4 text-center">
            <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.totalSteps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Steps</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Star className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xl font-bold text-gradient-gold">{stats.totalHasanat.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Hasanat</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Flame className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.totalWalks}</p>
            <p className="text-xs text-muted-foreground">Total Walks</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-lg font-bold text-foreground">{formatDist(stats.totalDistance)}</p>
            <p className="text-xs text-muted-foreground">Total Distance</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-lg font-bold text-foreground">{stats.longestStreak} days</p>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab("log")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "log" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Walk Log
          </button>
          <button
            onClick={() => setActiveTab("charts")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
              activeTab === "charts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Charts
          </button>
        </div>

        {/* Charts tab */}
        {activeTab === "charts" && (
          <div className="space-y-6">
            {/* Weekly steps bar chart */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Steps This Week</h3>
              <div className="flex items-end gap-2 h-32">
                {weeklyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{d.steps > 0 ? d.steps : ""}</span>
                    <div className="w-full rounded-t-md bg-gradient-teal transition-all duration-500" style={{ height: `${(d.steps / maxSteps) * 100}%`, minHeight: d.steps > 0 ? "4px" : "2px" }} />
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Walks per day dots */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Daily Walks</h3>
              <div className="flex items-center gap-2 justify-between">
                {weeklyData.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="flex flex-col gap-1">
                      {Array.from({ length: Math.max(d.walks, 0) }).map((_, j) => (
                        <div key={j} className="w-3 h-3 rounded-full bg-gradient-gold" />
                      ))}
                      {d.walks === 0 && <div className="w-3 h-3 rounded-full bg-muted" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prayer distribution */}
            {prayerData.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Prayer Distribution</h3>
                <div className="space-y-3">
                  {prayerData.map(([prayer, count]) => (
                    <div key={prayer} className="flex items-center gap-3">
                      <span className="text-sm text-foreground w-16 font-medium">{prayer}</span>
                      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-teal rounded-full transition-all duration-500"
                          style={{ width: `${(count / totalPrayerWalks) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Walk log tab */}
        {activeTab === "log" && (
          <div>
            {history.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <span className="text-4xl mb-3 block" aria-hidden>👣</span>
                <p className="font-medium text-foreground">Your walking history will appear here</p>
                <p className="text-sm text-muted-foreground mt-1">Every walk you complete is saved so you can see your progress and rewards over time.</p>
                <Link to="/walk">
                  <Button variant="hero" size="sm" className="mt-4">Start your first walk</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-card p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-teal flex items-center justify-center flex-shrink-0">
                        <Footprints className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{entry.mosqueName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.date)} · {entry.prayer !== "Unknown" ? entry.prayer : ""} · {formatDist(entry.distanceKm)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground space-y-0.5">
                        <p className="font-medium text-foreground">{entry.steps.toLocaleString()} steps</p>
                        <p className="text-gold">{entry.hasanat.toLocaleString()} hasanat</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            aria-label="Delete walk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this walk?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this walk entry ({entry.steps.toLocaleString()} steps, {entry.hasanat.toLocaleString()} hasanat). This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
