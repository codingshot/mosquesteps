import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Square, Pause, MapPin, Footprints, Clock, Star, Navigation, AlertTriangle, Smartphone, Share2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { estimateSteps, estimateWalkingTime, calculateHasanat } from "@/lib/prayer-times";
import { addWalkEntry, getSettings, getSavedMosques } from "@/lib/walking-history";
import { StepCounter, isStepCountingAvailable, getPaceCategory } from "@/lib/step-counter";
import { fetchWalkingRoute } from "@/lib/routing";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import WalkMap from "@/components/WalkMap";

interface Position {
  lat: number;
  lng: number;
}

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Jumuah"] as const;

const SUNNAH_QUOTES = [
  { text: "Walk with calmness and dignity. Every step is worship.", source: "Based on Sahih al-Bukhari 636", link: "https://sunnah.com/bukhari:636" },
  { text: "Give glad tidings to those who walk to the mosques in darkness, of perfect light on the Day of Resurrection.", source: "Sunan Abi Dawud 561", link: "https://sunnah.com/abudawud:561" },
  { text: "He does not take a step without being raised a degree and having one of his sins removed.", source: "Sahih Muslim 666", link: "https://sunnah.com/muslim:666" },
  { text: "The people who will receive the greatest reward for prayer are those who live farthest away.", source: "Sahih Muslim 662", link: "https://sunnah.com/muslim:662" },
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ActiveWalk = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const settings = getSettings();
  const savedMosques = getSavedMosques();

  const [isWalking, setIsWalking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<string>(searchParams.get("prayer") || "Dhuhr");
  const [sensorSteps, setSensorSteps] = useState(0);
  const [sensorSource, setSensorSource] = useState<string>("none");
  const [showPaceWarning, setShowPaceWarning] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number; steps: { instruction: string; distance: number }[] } | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [currentDirectionIdx, setCurrentDirectionIdx] = useState(0);

  const stepCounterRef = useRef<StepCounter | null>(null);
  const distanceRef = useRef(0);

  // Mosque position from settings or prayer-specific mosque
  const prayerMosqueId = settings.prayerMosques?.[selectedPrayer];
  const prayerMosque = prayerMosqueId ? savedMosques.find((m) => m.id === prayerMosqueId) : null;
  const mosquePosition = prayerMosque
    ? { lat: prayerMosque.lat, lng: prayerMosque.lng }
    : settings.selectedMosqueLat && settings.selectedMosqueLng
      ? { lat: settings.selectedMosqueLat, lng: settings.selectedMosqueLng }
      : null;

  const useRealSteps = sensorSource !== "gps" && sensorSource !== "none";
  const displaySteps = useRealSteps ? sensorSteps : estimateSteps(distanceKm);
  const hasanat = calculateHasanat(displaySteps);
  const stepsPerMinute = elapsedSeconds > 10 ? Math.round((displaySteps / elapsedSeconds) * 60) : 0;
  const pace = getPaceCategory(stepsPerMinute);
  const mosqueDist = prayerMosque?.distanceKm || settings.selectedMosqueDistance;
  const mosqueName = prayerMosque?.name || settings.selectedMosqueName;
  const progressPercent = mosqueDist > 0 ? Math.min(1, distanceKm / mosqueDist) : 0;

  // Fetch route on mount if we have user position and mosque
  useEffect(() => {
    if (!mosquePosition) return;
    // Get initial position for route
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPosition(userPos);
          const route = await fetchWalkingRoute(userPos.lat, userPos.lng, mosquePosition.lat, mosquePosition.lng);
          if (route) {
            setRouteCoords(route.coords);
            setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
          }
        },
        () => {}
      );
    }
  }, [mosquePosition?.lat, mosquePosition?.lng]);

  // Show pace warning
  useEffect(() => {
    if (pace.isTooFast && isWalking && !isPaused) {
      setShowPaceWarning(true);
      const timer = setTimeout(() => setShowPaceWarning(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [pace.isTooFast, stepsPerMinute]);

  // Timer
  useEffect(() => {
    if (!isWalking || isPaused) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isWalking, isPaused]);

  // Quote rotation
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => setCurrentQuoteIdx((i) => (i + 1) % SUNNAH_QUOTES.length), 15000);
    return () => clearInterval(interval);
  }, [isWalking]);

  // Update turn-by-turn direction based on position
  useEffect(() => {
    if (!routeInfo?.steps?.length || !currentPosition || !routeCoords.length) return;
    // Find closest route segment
    let minDist = Infinity;
    let closestIdx = 0;
    let cumSteps = 0;
    for (let i = 0; i < routeInfo.steps.length; i++) {
      cumSteps++;
      if (i < routeCoords.length) {
        const d = haversine(currentPosition.lat, currentPosition.lng, routeCoords[i][0], routeCoords[i][1]);
        if (d < minDist) {
          minDist = d;
          closestIdx = cumSteps - 1;
        }
      }
    }
    setCurrentDirectionIdx(Math.min(closestIdx, routeInfo.steps.length - 1));
  }, [currentPosition, routeInfo]);

  const startWalk = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not available", description: "GPS is required.", variant: "destructive" });
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

    const counter = new StepCounter((steps) => setSensorSteps(steps), (source) => setSensorSource(source));
    stepCounterRef.current = counter;
    try {
      const source = await counter.start();
      toast({
        title: source === "gps" ? "Using GPS estimation" : "Step counter active! 👣",
        description: source === "gps" ? "Steps estimated from distance." : `Using ${source === "accelerometer" ? "Accelerometer" : "motion sensors"}.`,
      });
    } catch {
      setSensorSource("gps");
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: Position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentPosition(newPos);
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
      (err) => {
        if (err.code === 1) toast({ title: "Location denied", variant: "destructive" });
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    setWatchId(id);
  }, [toast]);

  const togglePause = () => setIsPaused((p) => !p);

  const stopWalk = () => {
    setIsWalking(false);
    setIsPaused(false);
    if (watchId !== null) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
    if (stepCounterRef.current) { stepCounterRef.current.stop(); stepCounterRef.current = null; }
    setCompleted(true);

    const walkTimeMin = Math.round(elapsedSeconds / 60);
    addWalkEntry({
      date: new Date().toISOString(),
      mosqueName,
      distanceKm: Math.round(distanceRef.current * 1000) / 1000,
      steps: displaySteps,
      walkingTimeMin: walkTimeMin,
      hasanat,
      prayer: selectedPrayer,
    });
    toast({ title: "Walk completed! 🎉", description: `${displaySteps.toLocaleString()} steps · ${hasanat.toLocaleString()} hasanat earned.` });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const quote = SUNNAH_QUOTES[currentQuoteIdx];
  const currentDirection = routeInfo?.steps?.[currentDirectionIdx];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-bottom-nav">
      <header className={`${isWalking ? "bg-gradient-teal" : "bg-card border-b border-border"}`}>
        <div className="container py-3 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${isWalking ? "text-primary-foreground" : "text-foreground"}`}>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold">Active Walk</span>
          </div>
          <div className="flex items-center gap-2">
            {isWalking && sensorSource !== "none" && (
              <span className={`text-xs flex items-center gap-1 ${isWalking ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                <Smartphone className="w-3 h-3" /> {useRealSteps ? "Sensor" : "GPS"}
              </span>
            )}
            <button onClick={() => setShowMap(!showMap)} className={`p-1.5 rounded-lg ${isWalking ? "text-primary-foreground/70 hover:bg-primary-foreground/10" : "text-muted-foreground hover:bg-muted"}`}>
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center container py-4">
        {/* Pre-walk screen */}
        {!isWalking && !completed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-sm w-full">
            <div className="w-20 h-20 rounded-full bg-gradient-teal flex items-center justify-center mx-auto">
              <Footprints className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Ready to Walk?</h1>
            <p className="text-sm text-muted-foreground">
              {isStepCountingAvailable() ? "Motion sensors available — real step counting!" : "Steps estimated from GPS."}
            </p>

            {/* Prayer selection */}
            <div className="glass-card p-4 text-left">
              <label className="text-sm font-medium text-foreground mb-2 block">Walking for which prayer?</label>
              <div className="flex flex-wrap gap-2">
                {PRAYERS.map((p) => (
                  <button key={p} onClick={() => setSelectedPrayer(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedPrayer === p ? "bg-gradient-teal text-primary-foreground shadow-teal" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >{p}</button>
                ))}
              </div>
            </div>

            {/* Route info */}
            <div className="glass-card p-4 text-left text-sm space-y-1 text-muted-foreground">
              <p><MapPin className="w-4 h-4 inline mr-1 text-primary" /> {mosqueName}</p>
              {routeInfo ? (
                <>
                  <p><Navigation className="w-4 h-4 inline mr-1 text-primary" /> {routeInfo.distanceKm.toFixed(1)} km route · {estimateSteps(routeInfo.distanceKm)} steps</p>
                  <p><Clock className="w-4 h-4 inline mr-1 text-primary" /> ~{routeInfo.durationMin} min walk</p>
                </>
              ) : (
                <>
                  <p><Navigation className="w-4 h-4 inline mr-1 text-primary" /> Est. {mosqueDist} km · {estimateSteps(mosqueDist)} steps</p>
                  <p><Clock className="w-4 h-4 inline mr-1 text-primary" /> Est. {estimateWalkingTime(mosqueDist, settings.walkingSpeed)} min</p>
                </>
              )}
            </div>

            {/* Map preview */}
            {showMap && (currentPosition || mosquePosition) && (
              <WalkMap
                userPosition={currentPosition}
                mosquePosition={mosquePosition}
                walkPath={[]}
                routeCoords={routeCoords}
                isWalking={false}
                className="shadow-md"
              />
            )}

            {/* Turn-by-turn preview */}
            {routeInfo && routeInfo.steps.length > 0 && (
              <div className="glass-card p-3 text-left max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1"><Navigation className="w-3 h-3" /> Directions</p>
                <div className="space-y-1.5">
                  {routeInfo.steps.slice(0, 8).map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                      <span className="capitalize">{s.instruction} <span className="text-muted-foreground/60">({s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${Math.round(s.distance)}m`})</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="hero" size="lg" className="w-full text-base" onClick={startWalk}>
              <Play className="w-5 h-5 mr-2" /> Start Walking
            </Button>
          </motion.div>
        )}

        {/* Active walk screen */}
        {isWalking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 w-full max-w-sm">
            <div className="inline-block px-3 py-1 rounded-full bg-gradient-gold text-foreground text-xs font-semibold">
              Walking to {selectedPrayer}
            </div>

            {/* Live map */}
            {showMap && (
              <WalkMap
                userPosition={currentPosition}
                mosquePosition={mosquePosition}
                walkPath={positions}
                routeCoords={routeCoords}
                isWalking={true}
                className="shadow-md"
              />
            )}

            {/* Current direction */}
            {currentDirection && (
              <div className="glass-card p-3 flex items-center gap-2 text-left">
                <Navigation className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{currentDirection.instruction}</p>
                  <p className="text-xs text-muted-foreground">{currentDirection.distance > 1000 ? `${(currentDirection.distance / 1000).toFixed(1)} km` : `${Math.round(currentDirection.distance)} m`}</p>
                </div>
              </div>
            )}

            {/* Progress ring */}
            <div className="relative w-44 h-44 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#activeGold)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 52 * 2 * Math.PI} ${52 * 2 * Math.PI}`} className="transition-all duration-500" />
                <defs>
                  <linearGradient id="activeGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(39, 95%, 55%)" />
                    <stop offset="100%" stopColor="hsl(39, 95%, 40%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Footprints className={`w-5 h-5 text-gold mb-1 ${!isPaused ? "animate-step-bounce" : ""}`} />
                <span className="text-3xl font-bold text-foreground">{displaySteps.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">{useRealSteps ? "steps (sensor)" : "steps (est.)"}</span>
              </div>
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="glass-card p-2 text-center">
                <p className="text-sm font-bold text-foreground">{(distanceKm * 1000).toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">meters</p>
              </div>
              <div className="glass-card p-2 text-center">
                <p className="text-sm font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
                <p className="text-[10px] text-muted-foreground">time</p>
              </div>
              <div className="glass-card p-2 text-center">
                <p className="text-sm font-bold text-gradient-gold">{hasanat.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">hasanat</p>
              </div>
              <div className="glass-card p-2 text-center">
                <p className="text-sm font-bold text-foreground">
                  {elapsedSeconds > 30 ? (distanceKm / (elapsedSeconds / 3600)).toFixed(1) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">km/h</p>
              </div>
            </div>

            {/* Pace indicator */}
            <div className={`rounded-lg p-2.5 text-xs flex items-start gap-2 ${pace.isTooFast ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
              {pace.isTooFast && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <div className="text-left">
                <span className="font-semibold">{pace.label}</span>
                <span className="block mt-0.5">{pace.message}</span>
              </div>
            </div>

            {/* Pace warning */}
            <AnimatePresence>
              {showPaceWarning && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-destructive/90 rounded-xl p-3 text-destructive-foreground">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-semibold">⚠️ Walk with dignity and tranquility</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sunnah quote */}
            {!showPaceWarning && (
              <AnimatePresence mode="wait">
                <motion.div key={currentQuoteIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-teal rounded-xl p-3 text-primary-foreground">
                  <p className="text-xs italic leading-relaxed">"{quote.text}"</p>
                  <a href={quote.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold mt-1 block hover:underline">— {quote.source}</a>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 max-w-sm w-full">
            <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center mx-auto animate-pulse-glow">
              <Star className="w-10 h-10 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Walk Complete! 🎉</h1>
            <p className="text-sm text-muted-foreground">May Allah accept your {selectedPrayer} prayer and multiply your rewards.</p>

            {/* Walk map replay */}
            {showMap && positions.length > 1 && (
              <WalkMap userPosition={null} mosquePosition={mosquePosition} walkPath={positions} routeCoords={routeCoords} isWalking={false} className="shadow-md" />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-3 text-center">
                <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{displaySteps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Steps {useRealSteps ? "(sensor)" : "(est.)"}</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Star className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-xl font-bold text-gradient-gold">{hasanat.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Hasanat</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Navigation className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{distanceKm.toFixed(2)} km</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            <div className="glass-card p-3 text-xs text-muted-foreground">
              {selectedPrayer} · {mosqueName} · {useRealSteps ? "Sensor steps" : "GPS estimated"}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
                const text = `🕌 Walk to ${selectedPrayer} complete!\n👣 ${displaySteps.toLocaleString()} steps\n⭐ ${hasanat.toLocaleString()} hasanat\n📏 ${distanceKm.toFixed(2)} km\n⏱️ ${formatTime(elapsedSeconds)}`;
                if (navigator.share) { navigator.share({ title: "MosqueSteps Walk", text }).catch(() => {}); }
                else { navigator.clipboard.writeText(text); toast({ title: "Copied! 📋" }); }
              }}>
                <Share2 className="w-4 h-4 mr-1" /> Share
              </Button>
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
