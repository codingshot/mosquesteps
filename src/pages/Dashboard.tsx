import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { hasCompletedOnboarding } from "./Onboarding";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Footprints, Star, Navigation, Play, History, Settings2, Flame, Bell, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchPrayerTimes,
  calculateLeaveByTime,
  estimateSteps,
  estimateWalkingTime,
  calculateHasanat,
  type PrayerTime,
} from "@/lib/prayer-times";
import { getSettings, getWalkingStats } from "@/lib/walking-history";
import { requestNotificationPermission, isNotificationSupported, getNotificationPermission, schedulePrayerReminder } from "@/lib/notifications";
import { getBadges } from "@/lib/badges";
import HadithTooltip from "@/components/HadithTooltip";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [hijriDate, setHijriDate] = useState("");
  const [readableDate, setReadableDate] = useState("");
  const [loading, setLoading] = useState(true);

  const settings = getSettings();
  const stats = getWalkingStats();
  const badges = getBadges(stats);
  const earnedBadges = badges.filter((b) => b.badge.earned);
  const nextBadge = badges.find((b) => !b.badge.earned);
  const mosqueDistance = settings.selectedMosqueDistance;
  const walkingSpeed = settings.walkingSpeed;

  const steps = estimateSteps(mosqueDistance * 2);
  const walkMin = estimateWalkingTime(mosqueDistance, walkingSpeed);
  const hasanat = calculateHasanat(steps);

  useEffect(() => {
    // Redirect first-time users to onboarding
    if (!hasCompletedOnboarding()) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Use saved city coordinates if available, otherwise try GPS
    if (settings.cityLat && settings.cityLng) {
      loadPrayers(settings.cityLat, settings.cityLng);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadPrayers(pos.coords.latitude, pos.coords.longitude),
        () => loadPrayers(21.4225, 39.8262) // Makkah fallback
      );
    } else {
      loadPrayers(21.4225, 39.8262);
    }
  }, []);

  const loadPrayers = async (lat: number, lng: number) => {
    try {
      const data = await fetchPrayerTimes(lat, lng);
      setPrayers(data.prayers);
      setHijriDate(data.hijriDate);
      setReadableDate(data.readableDate);

      // Schedule notifications if enabled
      if (getNotificationPermission() === "granted") {
        data.prayers.forEach((p) => {
          const leaveBy = calculateLeaveByTime(p.time, walkMin);
          schedulePrayerReminder(p.name, leaveBy);
        });
      }
    } catch (e) {
      console.error("Failed to fetch prayer times:", e);
    } finally {
      setLoading(false);
    }
  };

  const getNextPrayer = (): PrayerTime | undefined => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return prayers.find((p) => {
      const [h, m] = p.time.split(":").map(Number);
      return h * 60 + m > currentMinutes;
    });
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({ title: "Notifications enabled! 🔔", description: "You'll be reminded when to leave for prayer." });
      // Re-schedule reminders
      prayers.forEach((p) => {
        const leaveBy = calculateLeaveByTime(p.time, walkMin);
        schedulePrayerReminder(p.name, leaveBy);
      });
    }
  };

  const nextPrayer = getNextPrayer();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-teal text-primary-foreground">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold">MosqueSteps</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10 w-9 h-9">
                <Settings2 className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="container pb-8">
          <p className="text-sm text-primary-foreground/70 mb-1">
            {readableDate} · {hijriDate}
            {settings.cityName && <span> · {settings.cityName}</span>}
          </p>
          <h1 className="text-2xl font-bold mb-6">Today's Journey</h1>

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
                <span className="text-3xl font-bold">{steps.toLocaleString()}</span>
                <span className="text-xs text-primary-foreground/70">est. steps (round trip)</span>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center gap-6 mt-4 text-sm">
            <span>{(mosqueDistance * 2).toFixed(1)} km</span>
            <span>{walkMin * 2} min</span>
            <span className="text-gold">{hasanat.toLocaleString()} hasanat</span>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Notification prompt */}
        {isNotificationSupported() && getNotificationPermission() !== "granted" && (
          <button
            onClick={handleEnableNotifications}
            className="w-full glass-card p-4 flex items-center gap-3 hover:shadow-teal transition-shadow text-left"
          >
            <Bell className="w-8 h-8 text-gold flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Enable Prayer Reminders</p>
              <p className="text-xs text-muted-foreground">Get notified when it's time to leave for the mosque</p>
            </div>
          </button>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          <Link to="/walk" className="glass-card p-3 text-center hover:shadow-teal transition-shadow">
            <Play className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">Walk</p>
          </Link>
          <Link to="/mosques" className="glass-card p-3 text-center hover:shadow-teal transition-shadow">
            <MapPin className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">Mosques</p>
          </Link>
          <Link to="/history" className="glass-card p-3 text-center hover:shadow-teal transition-shadow">
            <History className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">History</p>
          </Link>
          <Link to="/rewards" className="glass-card p-3 text-center hover:shadow-teal transition-shadow">
            <Star className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xs font-medium text-foreground">Rewards</p>
          </Link>
        </div>

        {/* Streak & stats */}
        {stats.totalWalks > 0 && (
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-destructive" />
              <div>
                <p className="font-semibold text-foreground">{stats.currentStreak} day streak</p>
                <p className="text-xs text-muted-foreground">{stats.totalWalks} total walks · {stats.totalSteps.toLocaleString()} steps</p>
              </div>
            </div>
            <Link to="/history" className="text-xs text-primary font-medium hover:underline">View all →</Link>
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
                <span key={bp.badge.id} className="text-xl" title={bp.badge.name}>{bp.badge.icon}</span>
              ))}
              {earnedBadges.length > 6 && (
                <span className="text-xs text-muted-foreground self-center">+{earnedBadges.length - 6} more</span>
              )}
            </div>
            {nextBadge && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Next: {nextBadge.badge.icon} {nextBadge.badge.name}</span>
                  <span>{Math.round(nextBadge.percent)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-gold rounded-full transition-all" style={{ width: `${nextBadge.percent}%` }} />
                </div>
              </div>
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
          <Link to="/settings" className="text-xs text-primary font-medium hover:underline">Edit</Link>
        </div>

        {/* Prayer times */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Prayer Times
            {settings.cityName && <span className="text-xs text-muted-foreground font-normal">({settings.cityName})</span>}
          </h2>
          {loading ? (
            <div className="glass-card p-6 text-center text-muted-foreground">Loading prayer times...</div>
          ) : (
            <div className="space-y-2">
              {prayers.map((p) => {
                const isNext = nextPrayer?.name === p.name;
                const leaveBy = calculateLeaveByTime(p.time, walkMin);
                return (
                  <div key={p.name} className={`glass-card p-4 flex items-center justify-between ${isNext ? "ring-2 ring-gold shadow-gold" : ""}`}>
                    <div>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs font-arabic text-muted-foreground">{p.arabicName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{p.time}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Navigation className="w-3 h-3" /> Leave by {leaveBy}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center">
            <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{steps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Est. Steps</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{walkMin * 2} min</p>
            <p className="text-xs text-muted-foreground">Round Trip</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Star className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-gradient-gold">{hasanat.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Hasanat</p>
          </div>
        </div>

        {/* Hadith reminder with tooltip */}
        <div className="bg-gradient-teal rounded-xl p-5 text-primary-foreground">
          <HadithTooltip hadithKey="muslim_666" className="text-primary-foreground">
            <p className="text-sm italic leading-relaxed">
              "When one of you performs ablution well and goes out to the mosque, with no motive
              other than prayer, he does not take a step without being raised a degree and having
              one of his sins removed."
            </p>
          </HadithTooltip>
          <a href="https://sunnah.com/muslim:666" target="_blank" rel="noopener noreferrer" className="text-xs text-gold mt-2 inline-block hover:underline">
            — Sahih Muslim 666
          </a>
        </div>

        {/* Start walk CTA */}
        <Link to="/walk">
          <Button variant="hero" size="lg" className="w-full text-base">
            <Play className="w-5 h-5 mr-2" /> Start Walking to Mosque
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
