import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Footprints, Clock, Star, Flame, BarChart3,
  TrendingUp, Route as RouteIcon, Target, Edit2, Check, ArrowLeft, Heart, Zap, Activity,
  MapPin, Calendar, Car, ChevronDown, ChevronUp
} from "lucide-react";
import { getWalkHistory, getWalkingStats, getSettings } from "@/lib/walking-history";
import { getGoals, saveGoals, type WalkingGoals } from "@/lib/goals";
import { getStepRecommendation, getHealthAssessment } from "@/lib/health-recommendations";
import { getOnboardingDate } from "@/pages/Onboarding";
import { getDayLog, getRecentLogs, updatePrayerLog, TRANSPORT_LABELS, type TransportMode } from "@/lib/prayer-log";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

// Recent walks history component
const RecentWalksSection = ({ history, formatDist }: { history: any[]; formatDist: (km: number) => string }) => {
  const [showAll, setShowAll] = useState(false);
  const recent = showAll ? history.slice(0, 30) : history.slice(0, 5);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary" /> Recent Walks
        </h3>
        {history.length > 5 && (
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-primary flex items-center gap-0.5">
            {showAll ? <>Show less <ChevronUp className="w-3 h-3" /></> : <>Show all <ChevronDown className="w-3 h-3" /></>}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {recent.map((walk: any, i: number) => {
          const date = new Date(walk.date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
          const dateLabel = isToday ? "Today" : isYesterday ? "Yesterday" : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
          return (
            <div key={walk.id || i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Footprints className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{walk.mosqueName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {walk.prayer} · {dateLabel} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium text-foreground">{walk.steps.toLocaleString()} steps</p>
                <p className="text-[10px] text-muted-foreground">{formatDist(walk.distanceKm)} · {walk.walkingTimeMin}m</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Daily prayer log component
const PRAYERS_LIST = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const TRANSPORT_OPTIONS: { id: TransportMode; label: string }[] = [
  { id: "walked", label: "🚶" },
  { id: "car", label: "🚗" },
  { id: "taxi", label: "🚕" },
  { id: "bus", label: "🚌" },
  { id: "bike", label: "🚲" },
];

const DailyPrayerLog = () => {
  const [dayOffset, setDayOffset] = useState(0);
  const getDateStr = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const dateStr = getDateStr(dayOffset);
  const [dayLog, setDayLog] = useState(getDayLog(dateStr));
  const isToday = dayOffset === 0;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - dayOffset);
  const dateLabel = isToday ? "Today" : dayOffset === 1 ? "Yesterday" : targetDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  const refreshLog = (offset: number) => {
    setDayLog(getDayLog(getDateStr(offset)));
  };

  const handleTogglePrayed = (prayer: string) => {
    const entry = dayLog.prayers.find(p => p.prayer === prayer);
    const newVal = !entry?.prayed;
    updatePrayerLog(dateStr, prayer, { prayed: newVal });
    refreshLog(dayOffset);
  };

  const handleSetTransport = (prayer: string, field: "goMethod" | "returnMethod", mode: TransportMode) => {
    updatePrayerLog(dateStr, prayer, { [field]: mode });
    refreshLog(dayOffset);
  };

  const changeDay = (offset: number) => {
    const newOffset = Math.max(0, Math.min(30, dayOffset + offset));
    setDayOffset(newOffset);
    refreshLog(newOffset);
  };

  const prayedCount = dayLog.prayers.filter(p => p.prayed).length;
  const walkedCount = dayLog.prayers.filter(p => p.goMethod === "walked").length;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-primary" /> Daily Prayer Log
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDay(1)} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <span className="text-xs font-medium text-foreground min-w-[70px] text-center">{dateLabel}</span>
          <button onClick={() => changeDay(-1)} disabled={isToday} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
        <span>{prayedCount}/5 prayed</span>
        <span>·</span>
        <span>{walkedCount} walked to</span>
      </div>

      <div className="space-y-2">
        {dayLog.prayers.map((entry) => (
          <div key={entry.prayer} className={`rounded-lg p-2.5 transition-all ${entry.prayed ? "bg-primary/5" : "bg-muted/30"}`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTogglePrayed(entry.prayer)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  entry.prayed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                }`}
              >
                {entry.prayed && <Check className="w-3 h-3" />}
              </button>

              <span className={`text-xs font-medium flex-1 ${entry.prayed ? "text-foreground" : "text-muted-foreground"}`}>
                {entry.prayer}
              </span>

              {entry.prayed && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground mr-0.5">Go:</span>
                  {TRANSPORT_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSetTransport(entry.prayer, "goMethod", t.id)}
                      className={`w-6 h-6 rounded text-[11px] flex items-center justify-center transition-all ${
                        entry.goMethod === t.id ? "bg-primary/20 ring-1 ring-primary/30" : "hover:bg-muted"
                      }`}
                      title={TRANSPORT_LABELS[t.id]}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {entry.prayed && entry.goMethod && (
              <div className="flex items-center gap-1 mt-1.5 ml-7">
                <span className="text-[9px] text-muted-foreground mr-0.5">Back:</span>
                {TRANSPORT_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSetTransport(entry.prayer, "returnMethod", t.id)}
                    className={`w-6 h-6 rounded text-[11px] flex items-center justify-center transition-all ${
                      entry.returnMethod === t.id ? "bg-gold/20 ring-1 ring-gold/30" : "hover:bg-muted"
                    }`}
                    title={TRANSPORT_LABELS[t.id]}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Stats = () => {
  const stats = getWalkingStats();
  const history = getWalkHistory();
  const settings = getSettings();
  const isImperial = settings.distanceUnit === "mi";
  const [goals, setGoals] = useState<WalkingGoals>(getGoals());
  const [editingGoals, setEditingGoals] = useState(false);

  const onboardingDate = getOnboardingDate();
  const daysSinceOnboarding = Math.max(1, Math.ceil((Date.now() - onboardingDate.getTime()) / (1000 * 60 * 60 * 24)));

  const formatDist = (km: number) => {
    if (isImperial) return `${(km * 0.621371).toFixed(1)} mi`;
    return `${km.toFixed(1)} km`;
  };

  const formatSpeed = (kmh: number) => {
    if (settings.speedUnit === "mph") return `${(kmh * 0.621371).toFixed(1)} mph`;
    return `${kmh.toFixed(1)} km/h`;
  };

  const validWalks = history.filter(e => e.walkingTimeMin > 0);
  const avgSpeedKmh = validWalks.length > 0
    ? validWalks.reduce((s, e) => s + (e.distanceKm / (e.walkingTimeMin / 60)), 0) / validWalks.length
    : 0;
  const avgSteps = history.length > 0 ? Math.round(history.reduce((s, e) => s + e.steps, 0) / history.length) : 0;
  const avgDistance = history.length > 0 ? history.reduce((s, e) => s + e.distanceKm, 0) / history.length : 0;
  const avgDuration = history.length > 0 ? Math.round(history.reduce((s, e) => s + e.walkingTimeMin, 0) / history.length) : 0;
  const totalMinutes = history.reduce((s, e) => s + e.walkingTimeMin, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const prayerCounts = Object.entries(stats.walksByPrayer).sort((a, b) => b[1] - a[1]);
  const topPrayer = prayerCounts[0];

  // Calorie estimate: ~0.04 kcal per step (walking, average weight)
  const totalCalories = Math.round(stats.totalSteps * 0.04);
  const walksPerDay = daysSinceOnboarding > 0 ? (stats.totalWalks / daysSinceOnboarding).toFixed(1) : "0";

  // Health recommendations
  const recommendation = getStepRecommendation(settings.age, settings.gender);
  const daysToAverage = Math.min(30, daysSinceOnboarding);
  const avgWindow = new Date();
  avgWindow.setDate(avgWindow.getDate() - daysToAverage);
  const recentWalks = history.filter(e => new Date(e.date) >= avgWindow);
  const totalRecentSteps = recentWalks.reduce((s, e) => s + e.steps, 0);
  const avgDailySteps = daysToAverage > 0 ? Math.round(totalRecentSteps / daysToAverage) : 0;
  const assessment = getHealthAssessment(avgDailySteps, recommendation);

  // Goal progress calculations
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todaySteps = history.filter(e => e.date.startsWith(todayStr)).reduce((s, e) => s + e.steps, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const thisWeekWalks = history.filter(e => new Date(e.date) >= weekStart).length;
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthDist = history.filter(e => new Date(e.date) >= monthStart).reduce((s, e) => s + e.distanceKm, 0);

  const goalProgress = [
    { label: "Daily Steps", current: todaySteps, target: goals.dailySteps, unit: "steps", icon: Footprints },
    { label: "Weekly Walks", current: thisWeekWalks, target: goals.weeklyWalks, unit: "walks", icon: Flame },
    { label: "Monthly Distance", current: thisMonthDist, target: goals.monthlyDistance, unit: isImperial ? "mi" : "km", icon: RouteIcon },
  ];

  // Weekly data
  const getWeeklyData = () => {
    const days: { label: string; steps: number; walks: number }[] = [];
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Skip days before onboarding
      if (d < onboardingDate) {
        days.push({ label: DAYS[d.getDay()], steps: -1, walks: 0 }); // -1 = pre-onboarding
        continue;
      }
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayWalks = history.filter((e) => e.date.startsWith(dateStr));
      days.push({ label: DAYS[d.getDay()], steps: dayWalks.reduce((s, e) => s + e.steps, 0), walks: dayWalks.length });
    }
    return days;
  };

  const getMonthlyData = () => {
    const weeks: { label: string; steps: number; walks: number; hasanat: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const ws = new Date(today); ws.setDate(ws.getDate() - (w * 7 + 6));
      const we = new Date(today); we.setDate(we.getDate() - w * 7);
      const ww = history.filter((e) => { const d = new Date(e.date); return d >= ws && d <= we; });
      weeks.push({ label: `W${4 - w}`, steps: ww.reduce((s, e) => s + e.steps, 0), walks: ww.length, hasanat: ww.reduce((s, e) => s + e.hasanat, 0) });
    }
    return weeks;
  };

  // Walk frequency heatmap — only show days since onboarding (max 30)
  const heatmapDays = Math.min(30, daysSinceOnboarding);
  const getFrequencyData = () => {
    const data: { date: string; walks: number; label: string }[] = [];
    for (let i = heatmapDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const count = history.filter(e => e.date.startsWith(dateStr)).length;
      data.push({ date: dateStr, walks: count, label: `${d.getDate()}/${d.getMonth() + 1}` });
    }
    return data;
  };

  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const frequencyData = getFrequencyData();
  const maxWeeklySteps = Math.max(...weeklyData.filter(d => d.steps >= 0).map((d) => d.steps), 1);
  const maxMonthlySteps = Math.max(...monthlyData.map((d) => d.steps), 1);
  const maxFreqWalks = Math.max(...frequencyData.map(d => d.walks), 1);

  const handleSaveGoals = () => {
    saveGoals(goals);
    setEditingGoals(false);
  };

  return (
    <div className="min-h-screen bg-background pb-bottom-nav">
      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
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
        {/* Walking Goals */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Target className="w-4 h-4 text-primary" /> Walking Goals
            </h3>
            <button onClick={() => editingGoals ? handleSaveGoals() : setEditingGoals(true)}
              className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              {editingGoals ? <><Check className="w-3 h-3" /> Save</> : <><Edit2 className="w-3 h-3" /> Edit</>}
            </button>
          </div>

          {editingGoals ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Daily Steps Goal</label>
                <input type="number" value={goals.dailySteps} onChange={(e) => setGoals({ ...goals, dailySteps: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Weekly Walks Goal</label>
                <input type="number" value={goals.weeklyWalks} onChange={(e) => setGoals({ ...goals, weeklyWalks: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Monthly Distance Goal ({isImperial ? "mi" : "km"})</label>
                <input type="number" value={goals.monthlyDistance} onChange={(e) => setGoals({ ...goals, monthlyDistance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {goalProgress.map((g) => {
                const Icon = g.icon;
                const current = g.label === "Monthly Distance" && isImperial ? g.current * 0.621371 : g.current;
                const pct = Math.min(100, g.target > 0 ? (current / g.target) * 100 : 0);
                return (
                  <div key={g.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" /> {g.label}</span>
                      <span className="font-medium text-foreground">
                        {g.label === "Monthly Distance" ? formatDist(g.current) : Math.round(current).toLocaleString()} / {g.target.toLocaleString()} {g.unit}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-gradient-gold" : "bg-gradient-teal"}`}
                      />
                    </div>
                    {pct >= 100 && <p className="text-[10px] text-gold mt-0.5">🎉 Goal achieved!</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

        {/* Extra insights */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-3 text-center">
            <Zap className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">{totalCalories.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Est. Calories</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Activity className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">{walksPerDay}</p>
            <p className="text-[10px] text-muted-foreground">Walks/Day</p>
          </div>
          <div className="glass-card p-3 text-center">
            <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">{avgDuration}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
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

        {/* Health Step Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-destructive" /> Recommended Daily Steps
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{recommendation.label}{settings.age ? ` · Age ${settings.age}` : ""}{settings.gender ? ` · ${settings.gender === "male" ? "♂" : "♀"}` : ""}</p>
              <p className="text-2xl font-bold text-foreground">{recommendation.dailySteps.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">steps/day recommended</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Your avg (30d)</p>
              <p className="text-xl font-bold text-foreground">{avgDailySteps.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">steps/day</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{Math.round((avgDailySteps / recommendation.dailySteps) * 100)}% of goal</span>
              <span>{recommendation.dailySteps.toLocaleString()} target</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (avgDailySteps / recommendation.dailySteps) * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  assessment.level === "excellent" ? "bg-gradient-gold" :
                  assessment.level === "good" ? "bg-gradient-teal" :
                  assessment.level === "fair" ? "bg-primary/60" :
                  "bg-muted-foreground/40"
                }`}
              />
            </div>
          </div>

          {/* Assessment */}
          <div className={`rounded-lg p-3 text-xs ${
            assessment.level === "excellent" ? "bg-gold/10 text-foreground" :
            assessment.level === "good" ? "bg-primary/10 text-foreground" :
            "bg-secondary text-secondary-foreground"
          }`}>
            <span className="mr-1">{assessment.emoji}</span>
            {assessment.message}
          </div>

          <p className="text-[10px] text-muted-foreground italic">{recommendation.description}</p>
          <p className="text-[10px] text-muted-foreground">Source: {recommendation.source}</p>

          {(!settings.age || !settings.gender) && (
            <Link to="/settings" className="text-xs text-primary hover:underline block">
              Set your age & gender in Settings for personalized recommendations →
            </Link>
          )}
        </motion.div>

        {/* Walk frequency heatmap */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Walk Frequency</h3>
          <p className="text-[10px] text-muted-foreground mb-3">
            {heatmapDays < 30 ? `Last ${heatmapDays} day${heatmapDays > 1 ? "s" : ""} (since you started)` : "Last 30 days"}
          </p>
          <div className="flex flex-wrap gap-1">
            {frequencyData.map((d, i) => (
              <div
                key={i}
                title={`${d.label}: ${d.walks} walks`}
                className="w-[calc(100%/10-4px)] aspect-square rounded-sm transition-colors"
                style={{
                  backgroundColor: d.walks === 0
                    ? "hsl(var(--muted))"
                    : `hsl(174, 74%, ${65 - (d.walks / maxFreqWalks) * 40}%)`,
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground justify-end">
            <span>Less</span>
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{
                backgroundColor: v === 0 ? "hsl(var(--muted))" : `hsl(174, 74%, ${65 - v * 40}%)`,
              }} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Steps This Week</h3>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map((d, i) => {
              const isPreOnboarding = d.steps === -1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{isPreOnboarding ? "" : d.steps > 0 ? d.steps : ""}</span>
                  {isPreOnboarding ? (
                    <div className="w-full rounded-t-md border border-dashed border-border transition-all" style={{ height: "2px" }} />
                  ) : (
                    <div className="w-full rounded-t-md bg-gradient-teal transition-all duration-500"
                      style={{ height: `${(d.steps / maxWeeklySteps) * 100}%`, minHeight: d.steps > 0 ? "4px" : "2px" }} />
                  )}
                  <span className={`text-[10px] ${isPreOnboarding ? "text-muted-foreground/40" : "text-muted-foreground"}`}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Overview</h3>
          <div className="flex items-end gap-3 h-28">
            {monthlyData.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{w.walks > 0 ? `${w.walks}w` : ""}</span>
                <div className="w-full rounded-t-md bg-gradient-gold transition-all duration-500"
                  style={{ height: `${(w.steps / maxMonthlySteps) * 100}%`, minHeight: w.steps > 0 ? "4px" : "2px" }} />
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
                    <div className="h-full bg-gradient-teal rounded-full transition-all duration-500"
                      style={{ width: `${(count / stats.totalWalks) * 100}%` }} />
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

        {/* Recent Walk History */}
        {history.length > 0 && (
          <RecentWalksSection history={history} formatDist={formatDist} />
        )}

        {/* Daily Prayer Log */}
        <DailyPrayerLog />

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
