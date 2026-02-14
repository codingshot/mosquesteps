import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { hasCompletedOnboarding } from "./Onboarding";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Footprints, Star, Navigation, Settings2, Flame, Bell, Trophy, Info, Play, ChevronDown, Locate, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchPrayerTimes,
  calculateLeaveByTime,
  estimateSteps,
  estimateWalkingTime,
  calculateHasanat,
  minutesUntilLeave,
  getIPGeolocation,
  type PrayerTime,
} from "@/lib/prayer-times";
import { getSettings, saveSettings, getWalkingStats, getWalkHistory, getSavedMosques, fetchTimezone, type WalkEntry } from "@/lib/walking-history";
import { formatTime as formatTimeStr, formatMinutes } from "@/lib/regional-defaults";
import { getRegionalDefaults } from "@/lib/regional-defaults";
import { requestNotificationPermission, isNotificationSupported, getNotificationPermission, schedulePrayerReminder, checkAndSendWeeklyInsight, startReminderPolling, clearScheduledReminders } from "@/lib/notifications";
import { getUnreadCount, getNotificationSettings } from "@/lib/notification-store";
import { getStepRecommendation } from "@/lib/health-recommendations";
import { getOnboardingDate } from "./Onboarding";
import { getBadges } from "@/lib/badges";
import HadithTooltip from "@/components/HadithTooltip";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [readableDate, setReadableDate] = useState("");
  const [prayerError, setPrayerError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNextDay, setIsNextDay] = useState(false);
  const [hasanatTooltipOpen, setHasanatTooltipOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [summaryPeriod, setSummaryPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check location permission
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        setLocationStatus(result.state as any);
        result.onchange = () => setLocationStatus(result.state as any);
      }).catch(() => {});
    }
  }, []);

  // Start reminder polling so scheduled prayer reminders fire even after tab refresh
  useEffect(() => {
    const stop = startReminderPolling();
    return stop;
  }, []);

  // Weekly health insight notification
  useEffect(() => {
    if (getNotificationPermission() !== "granted") return;
    const history = getWalkHistory();
    const onboardingDate = getOnboardingDate();
    const daysSince = Math.max(1, Math.ceil((Date.now() - onboardingDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysWindow = Math.min(7, daysSince);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - daysWindow);
    const recentWalks = history.filter((e) => new Date(e.date) >= weekAgo);
    const totalRecentSteps = recentWalks.reduce((s, e) => s + e.steps, 0);
    const avgDaily = daysWindow > 0 ? Math.round(totalRecentSteps / daysWindow) : 0;
    const rec = getStepRecommendation(settings.age, settings.gender);
    checkAndSendWeeklyInsight({
      totalSteps: totalRecentSteps,
      totalWalks: recentWalks.length,
      avgDailySteps: avgDaily,
      recommendedSteps: rec.dailySteps,
      currentStreak: stats.currentStreak,
    });
  }, []);

  const settings = getSettings();
  const stats = getWalkingStats();
  const history = getWalkHistory();
  const badges = getBadges(stats);
  const savedMosques = getSavedMosques();
  const earnedBadges = badges.filter((b) => b.badge.earned);
  const nextBadge = badges.find((b) => !b.badge.earned);
  const mosqueDistance = settings.selectedMosqueDistance;
  const walkingSpeed = settings.walkingSpeed;

  const steps = estimateSteps(mosqueDistance * 2);
  const walkMin = estimateWalkingTime(mosqueDistance, walkingSpeed);
  const hasanat = calculateHasanat(steps);
  const notifyMinBefore = settings.notifyMinutesBefore ?? 5;

  // Summary period data
  const onboardingDate = getOnboardingDate();
  const daysSinceOnboarding = Math.max(1, Math.ceil((Date.now() - onboardingDate.getTime()) / (1000 * 60 * 60 * 24)));
  const canShowMonthly = daysSinceOnboarding >= 14;

  const summaryData = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let periodWalks: WalkEntry[];
    let periodLabel: string;

    if (summaryPeriod === "daily") {
      periodWalks = history.filter(e => e.date.startsWith(todayStr));
      periodLabel = "Today";
    } else if (summaryPeriod === "weekly") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      periodWalks = history.filter(e => new Date(e.date) >= weekAgo);
      periodLabel = "This Week";
    } else {
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);
      periodWalks = history.filter(e => new Date(e.date) >= monthAgo);
      periodLabel = "This Month";
    }

    const totalSteps = periodWalks.reduce((s, e) => s + e.steps, 0);
    const totalDist = periodWalks.reduce((s, e) => s + e.distanceKm, 0);
    const totalHasanat = periodWalks.reduce((s, e) => s + e.hasanat, 0);
    const totalMinutes = periodWalks.reduce((s, e) => s + e.walkingTimeMin, 0);

    return { walks: periodWalks.length, totalSteps, totalDist, totalHasanat, totalMinutes, periodLabel };
  }, [summaryPeriod, history]);

  const handleEnableLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "Current Location";
          const tz = await fetchTimezone(lat, lng);
          const defaults = getRegionalDefaults(city, tz || undefined);
          saveSettings({
            cityName: city, cityLat: lat, cityLng: lng,
            ...(tz ? { cityTimezone: tz } : {}),
            timeFormat: defaults.timeFormat,
            smallDistanceUnit: defaults.smallDistanceUnit,
          });
          setLocationStatus("granted");
          toast({ title: `Location set: ${city}`, description: tz ? `Timezone: ${tz}` : "Prayer times updated." });
          window.location.reload();
        } catch {
          setLocationStatus("granted");
        }
      },
      () => {
        setLocationStatus("denied");
        toast({ title: "Location denied", description: "Go to Settings to search for your city manually.", variant: "destructive" });
      }
    );
  };

  // Filter prayers to only ones user walks to
  const prayerPrefs = settings.prayerPreferences || ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  // Get mosque for a specific prayer
  const getMosqueForPrayer = (prayerName: string) => {
    const mosqueId = settings.prayerMosques?.[prayerName];
    if (mosqueId) {
      const mosque = savedMosques.find((m) => m.id === mosqueId);
      if (mosque) return mosque;
    }
    // Fallback to primary mosque
    const primary = savedMosques.find((m) => m.isPrimary);
    return primary || null;
  };

  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Priority: current location (GPS) → IP geolocation → saved city → Makkah
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadPrayers(pos.coords.latitude, pos.coords.longitude),
        () => fallbackToIPOrCity()
      );
    } else {
      fallbackToIPOrCity();
    }
  }, []);

  const fallbackToIPOrCity = async () => {
    const ipGeo = await getIPGeolocation();
    if (ipGeo) {
      const tz = ipGeo.timezone || await fetchTimezone(ipGeo.lat, ipGeo.lng) || undefined;
      saveSettings({
        cityName: ipGeo.city,
        cityLat: ipGeo.lat,
        cityLng: ipGeo.lng,
        ...(tz ? { cityTimezone: tz } : {}),
      });
      loadPrayers(ipGeo.lat, ipGeo.lng);
      return;
    }
    if (settings.cityLat && settings.cityLng) {
      loadPrayers(settings.cityLat, settings.cityLng);
      return;
    }
    loadPrayers(21.4225, 39.8262); // Makkah fallback
  };

  const loadPrayers = async (lat: number, lng: number) => {
    try {
      let data = await fetchPrayerTimes(lat, lng, undefined, settings.cityTimezone);

      // If all prayers have passed, fetch next day's times (in city timezone)
      if (data.isNextDay) {
        const nextDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
        data = await fetchPrayerTimes(lat, lng, nextDay, settings.cityTimezone);
        setIsNextDay(true);
      }

      setPrayers(data.prayers);
      setReadableDate(data.readableDate);

      if (getNotificationPermission() === "granted" && getNotificationSettings().prayerReminders) {
        clearScheduledReminders();
        data.prayers.forEach((p) => {
          if (prayerPrefs.includes(p.name) && !p.isPast) {
            const leaveBy = calculateLeaveByTime(p.time, walkMin);
            schedulePrayerReminder(p.name, leaveBy, notifyMinBefore);
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch prayer times:", e);
      setPrayerError(true);
    } finally {
      setLoading(false);
    }
  };

  const getNextPrayer = (): PrayerTime | undefined => {
    // Return the first non-past prayer
    return prayers.find((p) => !p.isPast);
  };

  const handleEnableNotifications = async () => {
    const permission = getNotificationPermission();
    if (permission === "denied") {
      toast({
        title: "Notifications blocked 🔒",
        description: "Open Settings → Prayer Notifications to see how to unblock them.",
        variant: "destructive",
      });
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({ title: "Notifications enabled! 🔔", description: `You'll be reminded ${notifyMinBefore} min before leave time.` });
      clearScheduledReminders();
      prayers.forEach((p) => {
        if (prayerPrefs.includes(p.name) && !p.isPast) {
          const leaveBy = calculateLeaveByTime(p.time, walkMin);
          schedulePrayerReminder(p.name, leaveBy, notifyMinBefore);
        }
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Go to Settings to learn how to unblock notifications in your browser.",
        variant: "destructive",
      });
    }
  };

  const nextPrayer = getNextPrayer();

  // Filter to only upcoming prayers (hide past ones)
  const upcomingPrayers = prayers.filter((p) => !p.isPast);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Dashboard — Track Your Walk" description="View prayer times, walking distance, and spiritual rewards. Start your blessed walk to the mosque." path="/dashboard" noindex />
      {/* Header */}
      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold">MosqueSteps</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/notifications" className="relative" aria-label={getUnreadCount() > 0 ? `Notifications (${getUnreadCount()} unread)` : "Notifications"}>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 w-9 h-9" aria-label={getUnreadCount() > 0 ? `Notifications (${getUnreadCount()} unread)` : "Notifications"}>
                <Bell className="w-4 h-4" />
                {getUnreadCount() > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" aria-hidden />
                )}
              </Button>
            </Link>
            <Link to="/settings" aria-label="Settings">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 w-9 h-9" aria-label="Settings">
                <Settings2 className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="container pb-6">
          <p className="text-sm text-primary-foreground/70 mb-1">
            {isNextDay ? "Tomorrow · " : ""}{readableDate}
            {settings.cityName && <span> · {settings.cityName}</span>}
          </p>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">
              {isNextDay ? "Tomorrow's Prayers" : "Today's Journey"}
            </h1>
            <div className="text-right">
              <span className="text-2xl font-bold tabular-nums">
                {settings.cityTimezone
                  ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: settings.cityTimezone })
                  : currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <p className="text-[10px] text-primary-foreground/60">
                {settings.cityName || "Local Time"}
              </p>
            </div>
          </div>

          {/* Circular progress */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center"
          >
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary-foreground/20" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#goldGradient)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${52 * 2 * Math.PI * 0.65} ${52 * 2 * Math.PI}`} />
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(39, 95%, 55%)" />
                    <stop offset="100%" stopColor="hsl(39, 95%, 40%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Footprints className="w-6 h-6 text-gold mb-1" />
                <span className="text-3xl font-bold">{summaryData.totalSteps.toLocaleString()}</span>
                <span className="text-xs text-primary-foreground/70">steps today</span>
                <span className="text-[10px] text-primary-foreground/50">est. {steps.toLocaleString()}/trip</span>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center gap-1 cursor-help">
                  {(mosqueDistance * 2).toFixed(1)} km
                  <Info className="w-2.5 h-2.5 opacity-50" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] p-2.5" side="bottom">
                <p className="text-xs text-popover-foreground">
                  <strong>Round-trip distance</strong> — {mosqueDistance.toFixed(1)} km to your mosque × 2 (there and back).
                  Based on your selected mosque distance.
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center gap-1 cursor-help">
                  {formatMinutes(walkMin * 2)}
                  <Info className="w-2.5 h-2.5 opacity-50" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] p-2.5" side="bottom">
                <p className="text-xs text-popover-foreground">
                  <strong>Estimated round-trip walk time</strong> — {formatMinutes(walkMin)} each way at {settings.walkingSpeed} km/h walking speed.
                  Change pace in Settings.
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip open={hasanatTooltipOpen} onOpenChange={setHasanatTooltipOpen}>
              <TooltipTrigger asChild>
                <button
                  className="text-gold flex items-center gap-1"
                  onClick={() => setHasanatTooltipOpen(!hasanatTooltipOpen)}
                >
                  {hasanat.toLocaleString()} hasanat
                  <Info className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3" side="bottom">
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-popover-foreground">What are Hasanat?</p>
                  <p className="text-xs text-popover-foreground/80 leading-relaxed">
                    <strong>Hasanat</strong> (حسنات) are spiritual reward points in Islam — good deeds recorded by Allah.
                    Each step to the mosque earns <strong>2 hasanat</strong>: one sin is erased and you're raised one degree in rank.
                  </p>
                  <p className="text-xs text-popover-foreground/80 italic">
                    "He does not take a step without being raised a degree and having one of his sins removed."
                  </p>
                  <a
                    href="https://sunnah.com/muslim:666"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline"
                    title="Open Sahih Muslim 666 on Sunnah.com — each step erases a sin and raises a degree"
                  >
                    — Sahih Muslim 666
                  </a>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6 pb-bottom-nav">
        {/* Location permission prompt */}
        {locationStatus !== "granted" && !settings.cityLat && (
          <button
            onClick={handleEnableLocation}
            className="w-full glass-card p-4 flex items-center gap-3 hover:shadow-teal transition-shadow text-left border-primary/20"
          >
            <Locate className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">Enable Location</p>
              <p className="text-xs text-muted-foreground">Required for accurate prayer times, mosque finder, timezone, and walking routes</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          </button>
        )}

        {/* Notification prompt */}
        {isNotificationSupported() && getNotificationPermission() !== "granted" && (
          <button
            onClick={handleEnableNotifications}
            className="w-full glass-card p-4 flex items-center gap-3 hover:shadow-teal transition-shadow text-left"
          >
            <Bell className="w-8 h-8 text-gold flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Enable Prayer Reminders</p>
              <p className="text-xs text-muted-foreground">Get notified {notifyMinBefore} min before it's time to leave</p>
            </div>
          </button>
        )}

        {/* Activity Summary — 1 trip vs done */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Activity Summary</h3>
            <div className="relative">
              <button
                onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg"
              >
                {summaryData.periodLabel} <ChevronDown className="w-3 h-3" />
              </button>
              {periodDropdownOpen && (
                <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                  {(["daily", "weekly", "monthly"] as const).map((p) => {
                    const disabled = p === "monthly" && !canShowMonthly;
                    return (
                      <button
                        key={p}
                        disabled={disabled}
                        onClick={() => { setSummaryPeriod(p); setPeriodDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-xs capitalize ${
                          summaryPeriod === p ? "text-primary font-medium bg-primary/5" :
                          disabled ? "text-muted-foreground/40 cursor-not-allowed" :
                          "text-foreground hover:bg-muted"
                        }`}
                      >
                        {p}{disabled ? " (too soon)" : ""}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 1 trip estimate vs actual */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">1 Round Trip</p>
              <p className="text-sm font-bold text-foreground">{steps.toLocaleString()} steps</p>
              <p className="text-[10px] text-muted-foreground">{(mosqueDistance * 2).toFixed(1)} km · {formatMinutes(walkMin * 2)} · {hasanat.toLocaleString()} hasanat</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <p className="text-[10px] text-primary font-medium mb-0.5">{summaryData.periodLabel} Done</p>
              <p className="text-sm font-bold text-foreground">{summaryData.totalSteps.toLocaleString()} steps</p>
              <p className="text-[10px] text-muted-foreground">
                {summaryData.walks} walk{summaryData.walks !== 1 ? "s" : ""} · {summaryData.totalDist.toFixed(1)} km · {summaryData.totalHasanat.toLocaleString()} hasanat
              </p>
            </div>
          </div>

          {/* Comparison bar */}
          {steps > 0 && (
            <div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>{summaryData.walks}× trips walked</span>
                <span>{summaryData.totalSteps > 0 ? `${(summaryData.totalSteps / steps).toFixed(1)}× of 1 trip` : "No walks yet"}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-teal rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (summaryData.totalSteps / (steps * 5)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                Goal: 5 round trips ({(steps * 5).toLocaleString()} steps)
              </p>
            </div>
          )}
        </div>

        {/* Streak & stats */}
        {stats.totalWalks > 0 && (
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <Flame className="w-8 h-8 text-destructive" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] p-2.5" side="bottom">
                  <p className="text-xs text-popover-foreground">
                    <strong>Walking Streak</strong> — consecutive days you've walked to the mosque. Your best streak is {stats.longestStreak} days.
                  </p>
                </TooltipContent>
              </Tooltip>
              <div>
                <p className="font-semibold text-foreground">{stats.currentStreak} day streak</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground cursor-help">
                      {stats.totalWalks} total walks · {stats.totalSteps.toLocaleString()} steps
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px] p-2.5" side="bottom">
                    <p className="text-xs text-popover-foreground">
                      You've walked to the mosque <strong>{stats.totalWalks} times</strong> totaling <strong>{stats.totalSteps.toLocaleString()} steps</strong> and <strong>{stats.totalDistance.toFixed(1)} km</strong> since you started.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <Link to="/stats" className="text-xs text-primary font-medium hover:underline">View stats →</Link>
          </div>
        )}

        {/* Badges preview */}
        {earnedBadges.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-gold" /> Badges
              </h3>
              <Link to="/rewards" className="text-xs text-primary font-medium hover:underline">
                {earnedBadges.length}/{badges.length} →
              </Link>
            </div>
            <div className="flex gap-2 flex-wrap">
              {earnedBadges.slice(0, 6).map((bp) => (
                <Tooltip key={bp.badge.id}>
                  <TooltipTrigger asChild>
                    <button className="text-xl cursor-help">{bp.badge.icon}</button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] p-2.5" side="bottom">
                    <p className="text-xs font-semibold text-popover-foreground">{bp.badge.name}</p>
                    <p className="text-[10px] text-popover-foreground/80 mt-0.5">{bp.badge.description}</p>
                    {bp.badge.earnedDate && (
                      <p className="text-[10px] text-popover-foreground/60 mt-1">Earned {new Date(bp.badge.earnedDate).toLocaleDateString()}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ))}
              {earnedBadges.length > 6 && (
                <span className="text-xs text-muted-foreground self-center">+{earnedBadges.length - 6} more</span>
              )}
            </div>
            {nextBadge && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-3 cursor-help">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Next: {nextBadge.badge.icon} {nextBadge.badge.name}</span>
                      <span>{Math.round(nextBadge.percent)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${nextBadge.percent}%` }} />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] p-2.5" side="bottom">
                  <p className="text-xs text-popover-foreground">
                    <strong>{nextBadge.badge.name}</strong> — {nextBadge.badge.description}
                  </p>
                  <p className="text-[10px] text-popover-foreground/80 mt-1">
                    Progress: {nextBadge.current}/{nextBadge.target} ({nextBadge.badge.requirement})
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Mosque info */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{settings.selectedMosqueName}</p>
            <p className="text-xs text-muted-foreground">
              {mosqueDistance} km · {walkMin} min walk · {estimateSteps(mosqueDistance)} steps one way
            </p>
          </div>
          <Link to="/mosques" className="text-xs text-primary font-medium hover:underline">Change</Link>
        </div>

        {/* Prayer times - only upcoming */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {isNextDay ? "Tomorrow's Prayers" : "Upcoming Prayers"}
            {settings.cityName && <span className="text-xs text-muted-foreground font-normal">({settings.cityName})</span>}
          </h2>
          {loading ? (
            <div className="glass-card p-6 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading prayer times...</p>
            </div>
          ) : prayerError ? (
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-destructive mb-2">Failed to load prayer times</p>
              <p className="text-xs text-muted-foreground mb-3">Check your internet connection or set your city in Settings.</p>
              <Link to="/settings">
                <Button variant="outline" size="sm">Set City</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(isNextDay ? prayers : upcomingPrayers).map((p) => {
                const isNext = nextPrayer?.name === p.name;
                const prayerMosque = getMosqueForPrayer(p.name);
                const pMosqueDist = prayerMosque?.distanceKm || mosqueDistance;
                const pWalkMin = estimateWalkingTime(pMosqueDist, walkingSpeed);
                const leaveBy = calculateLeaveByTime(p.time, pWalkMin);
                const walksToThis = prayerPrefs.includes(p.name);
                const minsLeft = !isNextDay && walksToThis ? minutesUntilLeave(p.time, pWalkMin, settings.cityTimezone) : null;

                return (
                  <div key={p.name} className={`glass-card p-4 transition-all ${isNext ? "ring-2 ring-gold shadow-gold" : "hover:shadow-md"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          {p.name}
                          {walksToThis && <Footprints className="w-3 h-3 text-primary" />}
                        </p>
                        <p className="text-xs font-arabic text-muted-foreground">{p.arabicName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatTimeStr(p.time, settings.timeFormat || "24h")}</p>
                        {walksToThis && (
                          <p className={`text-xs flex items-center gap-1 justify-end font-medium ${minsLeft !== null && minsLeft <= 5 ? "text-destructive" : minsLeft !== null && minsLeft <= 15 ? "text-amber-500" : "text-muted-foreground"}`}>
                            <Navigation className="w-3 h-3" /> Leave by {formatTimeStr(leaveBy, settings.timeFormat || "24h")}
                            {minsLeft !== null && (
                              <span className="ml-1 opacity-80">
                                ({minsLeft <= 0 ? "now!" : `${minsLeft}m left`})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {walksToThis && (
                      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {prayerMosque && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {prayerMosque.name}
                            </span>
                          )}
                          <span>{pMosqueDist.toFixed(1)} km · {pWalkMin} min</span>
                          {minsLeft !== null && minsLeft > 0 && (
                            <span className={`font-medium ${minsLeft <= 10 ? "text-destructive" : minsLeft <= 30 ? "text-gold" : "text-primary"}`}>
                              {minsLeft <= 60 ? `${minsLeft}m left` : `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`}
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/walk?prayer=${p.name}`}
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Play className="w-3 h-3" /> Start Walk
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isNextDay && upcomingPrayers.length === 0 && (
                <div className="glass-card p-4 text-center">
                  <p className="text-sm text-muted-foreground">All prayers have passed for today.</p>
                  <p className="text-xs text-muted-foreground mt-1">Showing tomorrow's times above.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="glass-card p-4 text-center cursor-help">
                <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{summaryData.totalSteps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Today's Steps</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">est. {steps.toLocaleString()}/trip</p>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-2.5" side="top">
              <p className="text-xs text-popover-foreground">
                <strong>Today's actual steps</strong> from walks you've completed. Estimated round trip: {steps.toLocaleString()} steps ({(mosqueDistance * 2).toFixed(1)} km).
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="glass-card p-4 text-center cursor-help">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{formatMinutes(walkMin * 2)}</p>
                <p className="text-xs text-muted-foreground">Round Trip</p>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] p-2.5" side="top">
              <p className="text-xs text-popover-foreground">
                Walk time there and back at <strong>{settings.walkingSpeed} km/h</strong>. {formatMinutes(walkMin)} each way.
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="glass-card p-4 text-center cursor-help">
                <Star className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-lg font-bold text-gradient-gold">{hasanat.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Hasanat ⓘ</p>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-3" side="top">
              <p className="text-xs text-popover-foreground">
                <strong>Hasanat</strong> = spiritual rewards. Each step earns 2 hasanat (1 sin erased + 1 degree raised). Based on <a href="https://sunnah.com/muslim:666" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" title="Open Sahih Muslim 666 on Sunnah.com — each step erases a sin and raises a degree">Sahih Muslim 666</a>.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Hadith reminder */}
        <div className="bg-gradient-teal rounded-xl p-5 text-primary-foreground">
          <HadithTooltip hadithKey="muslim_666" className="text-primary-foreground">
            <p className="text-sm italic leading-relaxed">
              "When one of you performs ablution well and goes out to the mosque, with no motive
              other than prayer, he does not take a step without being raised a degree and having
              one of his sins removed."
            </p>
          </HadithTooltip>
          <a href="https://sunnah.com/muslim:666" target="_blank" rel="noopener noreferrer" className="text-xs text-gold mt-2 inline-block hover:underline" title="Open Sahih Muslim 666 on Sunnah.com — each step erases a sin and raises a degree">
            — Sahih Muslim 666
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
