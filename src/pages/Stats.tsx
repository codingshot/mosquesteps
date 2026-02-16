import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Footprints, Clock, Star, Flame, BarChart3,
  TrendingUp, Route as RouteIcon, Target, Edit2, Check, ArrowLeft, Heart, Zap, Activity,
  MapPin, Calendar, Car, ChevronDown, ChevronUp, Info, Download, FileJson, FileText, FileSpreadsheet
} from "lucide-react";
import { getWalkHistory, getWalkingStats, getSettings } from "@/lib/walking-history";
import { getGoals, saveGoals, type WalkingGoals } from "@/lib/goals";
import { getStepRecommendation, getHealthAssessment } from "@/lib/health-recommendations";
import { getOnboardingDate } from "@/pages/Onboarding";
import { getDayLog, getRecentLogs, updatePrayerLog, TRANSPORT_LABELS, type TransportMode } from "@/lib/prayer-log";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildExportReport,
  exportAsJSON,
  exportAsCSV,
  exportAsMarkdown,
  downloadFile,
} from "@/lib/stats-export";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png?w=256&format=webp";

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

  // Walks by day of week
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const walksByDayOfWeek = DAYS.reduce((acc, d) => ({ ...acc, [d]: 0 }), {} as Record<string, number>);
  history.forEach((e) => {
    const d = new Date(e.date);
    const day = DAYS[d.getDay()];
    walksByDayOfWeek[day]++;
  });
  const dayRanking = Object.entries(walksByDayOfWeek).sort((a, b) => b[1] - a[1]);
  const topDay = dayRanking[0];

  // Walks by mosque
  const walksByMosque: Record<string, { count: number; steps: number; distanceKm: number; hasanat: number }> = {};
  history.forEach((e) => {
    const name = e.mosqueName || "Unknown";
    if (!walksByMosque[name]) walksByMosque[name] = { count: 0, steps: 0, distanceKm: 0, hasanat: 0 };
    walksByMosque[name].count++;
    walksByMosque[name].steps += e.steps;
    walksByMosque[name].distanceKm += e.distanceKm;
    walksByMosque[name].hasanat += e.hasanat;
  });
  const mosqueRanking = Object.entries(walksByMosque).sort((a, b) => b[1].count - a[1].count);

  // Walks by month
  const walksByMonth: Record<string, { count: number; steps: number; distanceKm: number; hasanat: number }> = {};
  history.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!walksByMonth[key]) walksByMonth[key] = { count: 0, steps: 0, distanceKm: 0, hasanat: 0 };
    walksByMonth[key].count++;
    walksByMonth[key].steps += e.steps;
    walksByMonth[key].distanceKm += e.distanceKm;
    walksByMonth[key].hasanat += e.hasanat;
  });
  const monthRanking = Object.entries(walksByMonth).sort((a, b) => b[0].localeCompare(a[0]));

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

  const report = buildExportReport(history, stats, { limit: 500 });
  const handleExport = (format: "csv" | "json" | "md") => {
    const date = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      const csv = exportAsCSV(history, report);
      downloadFile(csv, `mosquesteps-walks-${date}.csv`, "text/csv;charset=utf-8");
    } else if (format === "json") {
      const json = exportAsJSON(report);
      downloadFile(json, `mosquesteps-report-${date}.json`, "application/json");
    } else {
      const md = exportAsMarkdown(report, formatDist);
      downloadFile(md, `mosquesteps-report-${date}.md`, "text/markdown");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-bottom-nav">
      <SEOHead
        title="Stats & Goals"
        description="Your walking stats, goals, health insights, and prayer attendance. MosqueSteps."
        path="/stats"
        noindex
      />
      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2" aria-label="Go back to dashboard">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold">Walking Stats</span>
          </Link>
        </div>
        <div className="container pb-6 text-center relative">
          <div className="absolute top-0 right-4">
            {history.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("json")}>
                    <FileJson className="w-4 h-4 mr-2" /> JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("md")}>
                    <FileText className="w-4 h-4 mr-2" /> Markdown
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 text-center cursor-help">
                <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{stats.totalSteps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Steps</p>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] p-2.5" side="bottom">
              <p className="text-xs text-popover-foreground">Total steps walked across all {stats.totalWalks} trips to the mosque since you started.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 text-center cursor-help">
                <Star className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-2xl font-bold text-gradient-gold">{stats.totalHasanat.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Hasanat</p>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] p-2.5" side="bottom">
              <p className="text-xs text-popover-foreground">Spiritual rewards earned — 2 hasanat per step (Sahih Muslim 666). One sin erased + one degree raised per step.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 text-center cursor-help">
                <RouteIcon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{formatDist(stats.totalDistance)}</p>
                <p className="text-xs text-muted-foreground">Total Distance</p>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] p-2.5" side="bottom">
              <p className="text-xs text-popover-foreground">Cumulative distance walked to and from the mosque across all sessions.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 text-center cursor-help">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{totalHours}h {remainingMinutes}m</p>
                <p className="text-xs text-muted-foreground">Time Walking</p>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] p-2.5" side="bottom">
              <p className="text-xs text-popover-foreground">Total active walking time — {totalMinutes} minutes spent walking to the mosque.</p>
            </TooltipContent>
          </Tooltip>
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

        {/* Weekly Prayer Consistency */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" /> Weekly Prayer Consistency
          </h3>
          <p className="text-[10px] text-muted-foreground mb-4">Last 7 days — how you got to each prayer</p>
          {(() => {
            const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
            const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const days: { label: string; date: string; log: ReturnType<typeof getDayLog> }[] = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              days.push({ label: DAYS_SHORT[d.getDay()], date: dateStr, log: getDayLog(dateStr) });
            }

            const totalPrayed = days.reduce((s, d) => s + d.log.prayers.filter(p => p.prayed).length, 0);
            const totalWalked = days.reduce((s, d) => s + d.log.prayers.filter(p => p.goMethod === "walked").length, 0);
            const totalDriven = days.reduce((s, d) => s + d.log.prayers.filter(p => p.goMethod === "car" || p.goMethod === "taxi" || p.goMethod === "bus").length, 0);

            return (
              <>
                {/* Summary row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-primary/5 rounded-lg p-2.5 text-center cursor-help">
                        <p className="text-lg font-bold text-foreground">{totalPrayed}<span className="text-xs text-muted-foreground font-normal">/35</span></p>
                        <p className="text-[10px] text-muted-foreground">Prayed</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] p-2.5" side="bottom">
                      <p className="text-xs text-popover-foreground">Total prayers prayed out of 35 possible (5 daily × 7 days)</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-primary">{totalWalked}</p>
                    <p className="text-[10px] text-muted-foreground">🚶 Walked</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-muted-foreground">{totalDriven}</p>
                    <p className="text-[10px] text-muted-foreground">🚗 Drove</p>
                  </div>
                </div>

                {/* Stacked bar chart */}
                <div className="flex items-end gap-1.5 h-28 mb-2">
                  {days.map((d, i) => {
                    const prayed = d.log.prayers.filter(p => p.prayed).length;
                    const walked = d.log.prayers.filter(p => p.goMethod === "walked").length;
                    const driven = d.log.prayers.filter(p => p.goMethod === "car" || p.goMethod === "taxi" || p.goMethod === "bus").length;
                    const otherPrayed = prayed - walked - driven;
                    return (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <div className="flex-1 flex flex-col items-center gap-0.5 cursor-help h-full justify-end">
                            {/* Stacked segments */}
                            <div className="w-full flex flex-col gap-px justify-end" style={{ height: `${(prayed / 5) * 100}%` }}>
                              {walked > 0 && (
                                <div className="w-full bg-gradient-teal rounded-t-sm" style={{ height: `${(walked / prayed) * 100}%`, minHeight: "4px" }} />
                              )}
                              {driven > 0 && (
                                <div className="w-full bg-muted-foreground/40 rounded-sm" style={{ height: `${(driven / prayed) * 100}%`, minHeight: "4px" }} />
                              )}
                              {otherPrayed > 0 && (
                                <div className="w-full bg-primary/20 rounded-b-sm" style={{ height: `${(otherPrayed / prayed) * 100}%`, minHeight: "4px" }} />
                              )}
                            </div>
                            <span className="text-[9px] text-muted-foreground">{d.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="p-2" side="top">
                          <p className="text-xs font-medium text-popover-foreground">{d.label} — {prayed}/5 prayed</p>
                          {walked > 0 && <p className="text-[10px] text-popover-foreground/80">🚶 {walked} walked</p>}
                          {driven > 0 && <p className="text-[10px] text-popover-foreground/80">🚗 {driven} drove</p>}
                          {otherPrayed > 0 && <p className="text-[10px] text-popover-foreground/80">📍 {otherPrayed} other</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground justify-center">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-teal inline-block" /> Walked</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40 inline-block" /> Drove</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-primary/20 inline-block" /> Other</span>
                </div>

                {/* Prayer-Walking Correlation insight */}
                {totalPrayed > 0 && (
                  <div className={`mt-4 rounded-lg p-3 text-xs ${
                    totalWalked / totalPrayed > 0.6 ? "bg-primary/10 text-foreground" :
                    totalWalked / totalPrayed > 0.3 ? "bg-gold/10 text-foreground" :
                    "bg-secondary text-secondary-foreground"
                  }`}>
                    <p className="font-medium mb-1">
                      {totalWalked / totalPrayed > 0.6 ? "🚶‍♂️ Strong walking habit!" :
                       totalWalked / totalPrayed > 0.3 ? "📈 Building momentum" :
                       "💡 Room to walk more"}
                    </p>
                    <p className="text-[11px] leading-relaxed opacity-80">
                      You walked to <strong>{Math.round((totalWalked / totalPrayed) * 100)}%</strong> of your {totalPrayed} prayers this week.
                      {totalDriven > 0 && ` You drove to ${totalDriven} prayer${totalDriven > 1 ? "s" : ""}.`}
                      {totalWalked > 0 && ` Walking earned you ~${(totalWalked * 2 * (settings.selectedMosqueDistance || 0.8) * 1312).toLocaleString()} hasanat.`}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Most walked prayers */}
        {prayerCounts.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-gold" /> Most Walked Prayers
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">Which prayers do you walk to most often?</p>
            <div className="space-y-3">
              {prayerCounts.map(([prayer, count], idx) => {
                const pct = stats.totalWalks > 0 ? Math.round((count / stats.totalWalks) * 100) : 0;
                const isTop = idx === 0;
                return (
                  <Tooltip key={prayer}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 cursor-help">
                        <span className="text-[10px] font-bold text-muted-foreground w-5">#{idx + 1}</span>
                        <span className={`text-sm font-medium w-16 ${isTop ? "text-gold" : "text-foreground"}`}>{prayer}</span>
                        <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${isTop ? "bg-gradient-gold" : "bg-gradient-teal"}`}
                            style={{ width: `${Math.max(2, (count / stats.totalWalks) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-14 text-right">{count} ({pct}%)</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-2" side="top">
                      <p className="text-xs text-popover-foreground">
                        Walked to <strong>{prayer}</strong> {count} time{count !== 1 ? "s" : ""} — {pct}% of all walks
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            {topPrayer && (
              <p className="text-xs text-gold font-medium mt-3 flex items-center gap-1">
                🏆 Top prayer: {topPrayer[0]} ({topPrayer[1]} walks)
              </p>
            )}
          </div>
        )}

        {/* Days you walk the most */}
        {history.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> Days You Walk the Most
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">Which day of the week do you walk to the mosque most?</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {dayRanking.map(([day, count], idx) => {
                const maxDay = dayRanking[0]?.[1] || 1;
                const pct = Math.round((count / maxDay) * 100);
                const isTop = idx === 0;
                return (
                  <div
                    key={day}
                    className={`flex-1 min-w-[70px] rounded-lg p-2.5 text-center ${isTop ? "bg-gradient-gold/20 ring-1 ring-gold/30" : "bg-muted/50"}`}
                  >
                    <p className="text-[10px] font-medium text-muted-foreground">{day.slice(0, 3)}</p>
                    <p className={`text-lg font-bold ${isTop ? "text-gold" : "text-foreground"}`}>{count}</p>
                    <p className="text-[9px] text-muted-foreground">walks</p>
                  </div>
                );
              })}
            </div>
            {topDay && topDay[1] > 0 && (
              <p className="text-xs text-muted-foreground">
                Your busiest walking day: <span className="font-medium text-foreground">{topDay[0]}</span>
              </p>
            )}
          </div>
        )}

        {/* In-depth reports */}
        {history.length > 0 && (
          <Collapsible className="group">
            <div className="glass-card p-5">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between text-left">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-primary" /> In-Depth Reports
                  </h3>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-5">
                  {/* By mosque */}
                  {mosqueRanking.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">By Mosque</p>
                      <div className="space-y-2">
                        {mosqueRanking.map(([name, data], i) => (
                          <div key={name} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                            <span className="text-[10px] font-bold text-muted-foreground w-5">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {data.count} walks · {data.steps.toLocaleString()} steps · {formatDist(data.distanceKm)}
                              </p>
                            </div>
                            <span className="text-xs text-gold font-medium">{data.hasanat.toLocaleString()} hasanat</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* By month */}
                  {monthRanking.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">By Month</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {monthRanking.map(([month, data]) => {
                          const [y, m] = month.split("-");
                          const monthLabel = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
                          return (
                            <div key={month} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                              <span className="text-xs font-medium">{monthLabel}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {data.count} walks · {formatDist(data.distanceKm)} · {data.hasanat.toLocaleString()} hasanat
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Export reminder */}
                  <p className="text-[10px] text-muted-foreground">
                    Export your full report as CSV, JSON, or Markdown using the Export button above.
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
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
