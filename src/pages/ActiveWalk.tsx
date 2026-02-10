import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Square, Pause, MapPin, Footprints, Clock, Star, Navigation, AlertTriangle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { estimateSteps, estimateWalkingTime, calculateHasanat } from "@/lib/prayer-times";
import { addWalkEntry, getSettings } from "@/lib/walking-history";
import { StepCounter, isStepCountingAvailable, getPaceCategory } from "@/lib/step-counter";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface Position {
  lat: number;
  lng: number;
}

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jumuah"] as const;

const SUNNAH_QUOTES = [
  {
    text: "Walk with calmness and dignity. Every step is worship.",
    source: "Based on Sahih al-Bukhari 636",
    link: "https://sunnah.com/bukhari:636",
  },
  {
    text: "Give glad tidings to those who walk to the mosques in darkness, of perfect light on the Day of Resurrection.",
    source: "Sunan Abi Dawud 561",
    link: "https://sunnah.com/abudawud:561",
  },
  {
    text: "He does not take a step without being raised a degree and having one of his sins removed.",
    source: "Sahih Muslim 666",
    link: "https://sunnah.com/muslim:666",
  },
  {
    text: "The people who will receive the greatest reward for prayer are those who live farthest away.",
    source: "Sahih Muslim 662",
    link: "https://sunnah.com/muslim:662",
  },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ActiveWalk = () => {
  const { toast } = useToast();
  const settings = getSettings();

  const [isWalking, setIsWalking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<string>("Dhuhr");
  const [sensorSteps, setSensorSteps] = useState(0);
  const [sensorSource, setSensorSource] = useState<string>("none");
  const [showPaceWarning, setShowPaceWarning] = useState(false);

  const stepCounterRef = useRef<StepCounter | null>(null);
  const distanceRef = useRef(0);

  // Use real sensor steps if available, otherwise estimate from GPS distance
  const useRealSteps = sensorSource !== "gps" && sensorSource !== "none";
  const displaySteps = useRealSteps ? sensorSteps : estimateSteps(distanceKm);
  const hasanat = calculateHasanat(displaySteps);

  // Pace calculation
  const stepsPerMinute = elapsedSeconds > 10 ? Math.round((displaySteps / elapsedSeconds) * 60) : 0;
  const pace = getPaceCategory(stepsPerMinute);

  // Show pace warning when too fast
  useEffect(() => {
    if (pace.isTooFast && isWalking && !isPaused) {
      setShowPaceWarning(true);
      const timer = setTimeout(() => setShowPaceWarning(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [pace.isTooFast, stepsPerMinute]);

  // Elapsed timer
  useEffect(() => {
    if (!isWalking || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWalking, isPaused]);

  // Rotate quotes
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => {
      setCurrentQuoteIdx((i) => (i + 1) % SUNNAH_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isWalking]);

  const startWalk = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not available", description: "Please enable location services.", variant: "destructive" });
      return;
    }

    setIsWalking(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setDistanceKm(0);
    distanceRef.current = 0;
    setPositions([]);
    setCompleted(false);
    setSensorSteps(0);

    // Start real step counter
    const counter = new StepCounter(
      (steps) => setSensorSteps(steps),
      (source) => setSensorSource(source)
    );
    stepCounterRef.current = counter;

    try {
      const source = await counter.start();
      if (source === "gps") {
        toast({
          title: "Using GPS estimation",
          description: "Device sensors unavailable. Steps will be estimated from distance walked.",
        });
      } else {
        toast({
          title: "Step counter active! 👣",
          description: `Using ${source === "accelerometer" ? "Accelerometer API" : "motion sensors"} for real step counting.`,
        });
      }
    } catch {
      setSensorSource("gps");
    }

    // Start GPS tracking
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: Position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPositions((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segmentDist = haversine(last.lat, last.lng, newPos.lat, newPos.lng);
            if (segmentDist > 0.005) {
              distanceRef.current += segmentDist;
              setDistanceKm(distanceRef.current);
              return [...prev, newPos];
            }
            return prev;
          }
          return [newPos];
        });
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    setWatchId(id);
  }, [toast]);

  const togglePause = () => {
    setIsPaused((p) => !p);
  };

  const stopWalk = () => {
    setIsWalking(false);
    setIsPaused(false);

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    if (stepCounterRef.current) {
      stepCounterRef.current.stop();
      stepCounterRef.current = null;
    }

    setCompleted(true);

    const walkTimeMin = Math.round(elapsedSeconds / 60);
    addWalkEntry({
      date: new Date().toISOString(),
      mosqueName: settings.selectedMosqueName,
      distanceKm: Math.round(distanceRef.current * 1000) / 1000,
      steps: displaySteps,
      walkingTimeMin: walkTimeMin,
      hasanat,
      prayer: selectedPrayer,
    });

    toast({
      title: "Walk completed! 🎉",
      description: `${displaySteps.toLocaleString()} steps · ${hasanat.toLocaleString()} hasanat earned. May Allah accept your efforts.`,
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const quote = SUNNAH_QUOTES[currentQuoteIdx];
  const progressPercent = settings.selectedMosqueDistance > 0 ? Math.min(1, distanceKm / settings.selectedMosqueDistance) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className={`${isWalking ? "bg-gradient-teal" : "bg-card border-b border-border"}`}>
        <div className="container py-4 flex items-center justify-between">
          <Link to="/dashboard" className={`flex items-center gap-2 ${isWalking ? "text-primary-foreground" : "text-foreground"}`}>
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold">Active Walk</span>
          </Link>
          {isWalking && sensorSource !== "none" && (
            <div className={`flex items-center gap-1.5 text-xs ${isWalking ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              <Smartphone className="w-3 h-3" />
              <span>{useRealSteps ? "Sensor" : "GPS"}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center container py-8">
        {/* Pre-walk screen */}
        {!isWalking && !completed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6 max-w-sm w-full">
            <div className="w-24 h-24 rounded-full bg-gradient-teal flex items-center justify-center mx-auto">
              <Footprints className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Ready to Walk?</h1>
            <p className="text-muted-foreground text-sm">
              {isStepCountingAvailable()
                ? "Your device supports motion sensors — we'll count your actual steps!"
                : "Steps will be estimated from GPS distance walked."}
            </p>

            {/* Prayer selection */}
            <div className="glass-card p-4 text-left">
              <label className="text-sm font-medium text-foreground mb-2 block">Walking for which prayer?</label>
              <div className="flex flex-wrap gap-2">
                {PRAYERS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPrayer(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedPrayer === p
                        ? "bg-gradient-teal text-primary-foreground shadow-teal"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 text-left text-sm space-y-1 text-muted-foreground">
              <p><MapPin className="w-4 h-4 inline mr-1 text-primary" /> {settings.selectedMosqueName}</p>
              <p><Navigation className="w-4 h-4 inline mr-1 text-primary" /> Est. {settings.selectedMosqueDistance} km · {estimateSteps(settings.selectedMosqueDistance)} steps</p>
              <p><Clock className="w-4 h-4 inline mr-1 text-primary" /> Est. {estimateWalkingTime(settings.selectedMosqueDistance, settings.walkingSpeed)} min</p>
            </div>
            <Button variant="hero" size="lg" className="w-full text-base" onClick={startWalk}>
              <Play className="w-5 h-5 mr-2" /> Start Walking
            </Button>
          </motion.div>
        )}

        {/* Active walk screen */}
        {isWalking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-5 w-full max-w-sm">
            {/* Prayer badge */}
            <div className="inline-block px-3 py-1 rounded-full bg-gradient-gold text-foreground text-xs font-semibold">
              Walking to {selectedPrayer}
            </div>

            {/* Progress ring */}
            <div className="relative w-52 h-52 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#activeGold)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 52 * 2 * Math.PI} ${52 * 2 * Math.PI}`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="activeGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(39, 95%, 55%)" />
                    <stop offset="100%" stopColor="hsl(39, 95%, 40%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Footprints className={`w-5 h-5 text-gold mb-1 ${!isPaused ? "animate-step-bounce" : ""}`} />
                <span className="text-4xl font-bold text-foreground">{displaySteps.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">
                  {useRealSteps ? "steps (sensor)" : "steps (est.)"}
                </span>
              </div>
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="glass-card p-2.5 text-center">
                <p className="text-base font-bold text-foreground">{(distanceKm * 1000).toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">meters</p>
              </div>
              <div className="glass-card p-2.5 text-center">
                <p className="text-base font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
                <p className="text-[10px] text-muted-foreground">time</p>
              </div>
              <div className="glass-card p-2.5 text-center">
                <p className="text-base font-bold text-gradient-gold">{hasanat.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">hasanat</p>
              </div>
              <div className="glass-card p-2.5 text-center">
                <p className="text-base font-bold text-foreground">{stepsPerMinute}</p>
                <p className="text-[10px] text-muted-foreground">steps/min</p>
              </div>
            </div>

            {/* Pace indicator */}
            <div className={`rounded-lg p-3 text-xs flex items-start gap-2 ${
              pace.isTooFast ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"
            }`}>
              {pace.isTooFast && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <div className="text-left">
                <span className="font-semibold">{pace.label}</span>
                <span className="block mt-0.5">{pace.message}</span>
                {pace.sunnahLink && (
                  <a href={pace.sunnahLink} target="_blank" rel="noopener noreferrer" className="text-primary underline mt-1 block">
                    Read the hadith →
                  </a>
                )}
              </div>
            </div>

            {/* Pace warning overlay */}
            <AnimatePresence>
              {showPaceWarning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-destructive/90 rounded-xl p-4 text-destructive-foreground"
                >
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-semibold">⚠️ Please walk with dignity and tranquility</p>
                  <p className="text-xs mt-1 italic">
                    "Do not come to it running, but come walking tranquilly with solemnity."
                  </p>
                  <a href="https://sunnah.com/bukhari:636" target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 block">
                    — Sahih al-Bukhari 636
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sunnah quote */}
            {!showPaceWarning && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuoteIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-teal rounded-xl p-4 text-primary-foreground"
                >
                  <p className="text-sm italic leading-relaxed">"{quote.text}"</p>
                  <a href={quote.link} target="_blank" rel="noopener noreferrer" className="text-xs text-gold mt-1 block hover:underline">
                    — {quote.source}
                  </a>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={togglePause}>
                {isPaused ? <Play className="w-5 h-5 mr-1" /> : <Pause className="w-5 h-5 mr-1" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={stopWalk}>
                <Square className="w-5 h-5 mr-1" /> End Walk
              </Button>
            </div>
          </motion.div>
        )}

        {/* Completion screen */}
        {completed && !isWalking && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-sm w-full">
            <div className="w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center mx-auto animate-pulse-glow">
              <Star className="w-12 h-12 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Walk Complete! 🎉</h1>
            <p className="text-muted-foreground">May Allah accept your {selectedPrayer} prayer and multiply your rewards.</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 text-center">
                <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{displaySteps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Steps {useRealSteps ? "(sensor)" : "(est.)"}</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Star className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-xl font-bold text-gradient-gold">{hasanat.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Hasanat</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Navigation className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{distanceKm.toFixed(2)} km</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            <div className="glass-card p-3 text-xs text-muted-foreground">
              {selectedPrayer} · {settings.selectedMosqueName} · {useRealSteps ? "Sensor steps" : "GPS estimated"}
            </div>

            <div className="flex gap-3">
              <Button variant="hero" className="flex-1" onClick={() => { setCompleted(false); setDistanceKm(0); setSensorSteps(0); }}>
                <Play className="w-4 h-4 mr-1" /> New Walk
              </Button>
              <Link to="/history" className="flex-1">
                <Button variant="hero-outline" className="w-full">View History</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ActiveWalk;
