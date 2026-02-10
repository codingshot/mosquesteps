import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Footprints, Clock, Star, Flame, Calendar, BarChart3,
  TrendingUp, MapPin, Gauge, Route as RouteIcon
} from "lucide-react";
import { getWalkHistory, getWalkingStats, getSettings } from "@/lib/walking-history";
import logo from "@/assets/logo.png";

const Stats = () => {
  const stats = getWalkingStats();
  const history = getWalkHistory();
  const settings = getSettings();
  const isImperial = settings.distanceUnit === "mi";

  const formatDist = (km: number) => {
    if (isImperial) return `${(km * 0.621371).toFixed(1)} mi`;
    return `${km.toFixed(1)} km`;
  };

  const formatSpeed = (kmh: number) => {
    if (settings.speedUnit === "mph") return `${(kmh * 0.621371).toFixed(1)} mph`;
    return `${kmh.toFixed(1)} km/h`;
  };

  // Calculate average walking speed from history
  const avgSpeedKmh = history.length > 0
    ? history.reduce((s, e) => s + (e.walkingTimeMin > 0 ? (e.distanceKm / (e.walkingTimeMin / 60)) : 0), 0) / history.filter(e => e.walkingTimeMin > 0).length || 0
    : 0;

  // Average steps per walk
  const avgSteps = history.length > 0
    ? Math.round(history.reduce((s, e) => s + e.steps, 0) / history.length)
    : 0;

  // Average distance per walk
  const avgDistance = history.length > 0
    ? history.reduce((s, e) => s + e.distanceKm, 0) / history.length
    : 0;

  // Total time walking
  const totalMinutes = history.reduce((s, e) => s + e.walkingTimeMin, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Most walked prayer
  const prayerCounts = Object.entries(stats.walksByPrayer).sort((a, b) => b[1] - a[1]);
  const topPrayer = prayerCounts[0];

  // Weekly data
  const getWeeklyData = () => {
    const today = new Date();
    const days: { label: string; steps: number; distance: number; walks: number }[] = [];
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayWalks = history.filter((e) => e.date.startsWith(dateStr));
      days.push({
        label: DAYS[d.getDay()],
        steps: dayWalks.reduce((s, e) => s + e.steps, 0),
        distance: dayWalks.reduce((s, e) => s + e.distanceKm, 0),
        walks: dayWalks.length,
      });
    }
    return days;
  };

  // Monthly data (last 4 weeks)
  const getMonthlyData = () => {
    const today = new Date();
    const weeks: { label: string; steps: number; walks: number; hasanat: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekWalks = history.filter((e) => {
        const d = new Date(e.date);
        return d >= weekStart && d <= weekEnd;
      });
      weeks.push({
        label: `W${4 - w}`,
        steps: weekWalks.reduce((s, e) => s + e.steps, 0),
        walks: weekWalks.length,
        hasanat: weekWalks.reduce((s, e) => s + e.hasanat, 0),
      });
    }
    return weeks;
  };

  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const maxWeeklySteps = Math.max(...weeklyData.map((d) => d.steps), 1);
  const maxMonthlySteps = Math.max(...monthlyData.map((d) => d.steps), 1);

  return (
    <div className="min-h-screen bg-background pb-bottom-nav">
      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold">Walking Stats</span>
          </Link>
        </div>
        <div className="container pb-6 text-center">
          <BarChart3 className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Your Walking Journey</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            {stats.totalWalks} walks · {formatDist(stats.totalDistance)} total
          </p>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 text-center">
            <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{stats.totalSteps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Steps</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 text-center">
            <Star className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-2xl font-bold text-gradient-gold">{stats.totalHasanat.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Hasanat</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 text-center">
            <RouteIcon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{formatDist(stats.totalDistance)}</p>
            <p className="text-xs text-muted-foreground">Total Distance</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalHours}h {remainingMinutes}m</p>
            <p className="text-xs text-muted-foreground">Time Walking</p>
          </motion.div>
        </div>

        {/* Streaks */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 text-center">
            <Flame className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Current Streak 🔥</p>
          </div>
          <div className="glass-card p-4 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{stats.longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>

        {/* Averages */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Averages</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{avgSteps.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Steps/Walk</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatDist(avgDistance)}</p>
              <p className="text-[10px] text-muted-foreground">Dist/Walk</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatSpeed(avgSpeedKmh)}</p>
              <p className="text-[10px] text-muted-foreground">Avg Speed</p>
            </div>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Steps This Week</h3>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{d.steps > 0 ? d.steps : ""}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-teal transition-all duration-500"
                  style={{ height: `${(d.steps / maxWeeklySteps) * 100}%`, minHeight: d.steps > 0 ? "4px" : "2px" }}
                />
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Overview</h3>
          <div className="flex items-end gap-3 h-28">
            {monthlyData.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{w.walks > 0 ? `${w.walks}w` : ""}</span>
                <div
                  className="w-full rounded-t-md bg-gradient-gold transition-all duration-500"
                  style={{ height: `${(w.steps / maxMonthlySteps) * 100}%`, minHeight: w.steps > 0 ? "4px" : "2px" }}
                />
                <span className="text-[10px] text-muted-foreground">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prayer distribution */}
        {prayerCounts.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Prayer Distribution</h3>
            <div className="space-y-3">
              {prayerCounts.map(([prayer, count]) => (
                <div key={prayer} className="flex items-center gap-3">
                  <span className="text-sm text-foreground w-16 font-medium">{prayer}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-teal rounded-full transition-all duration-500"
                      style={{ width: `${(count / stats.totalWalks) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
            {topPrayer && (
              <p className="text-xs text-muted-foreground mt-3">
                Most walked: <span className="font-medium text-foreground">{topPrayer[0]}</span> ({topPrayer[1]} times)
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {stats.totalWalks === 0 && (
          <div className="glass-card p-8 text-center">
            <Footprints className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No walking data yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Start your first walk to see your stats here.</p>
            <Link to="/walk" className="text-sm text-primary font-medium hover:underline mt-3 inline-block">
              Start Walking →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
