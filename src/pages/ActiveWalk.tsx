import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Square, Pause, MapPin, Footprints, Clock, Star, Navigation, AlertTriangle, Smartphone, Share2, Map, Image, CheckCircle, ArrowUp, CornerDownLeft, CornerDownRight, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { estimateSteps, estimateWalkingTime, calculateHasanat, fetchPrayerTimes, calculateLeaveByTime, minutesUntilLeave, getIPGeolocation, type PrayerTime } from "@/lib/prayer-times";
import { addWalkEntry, getSettings, getSavedMosques } from "@/lib/walking-history";
import { StepCounter, isStepCountingAvailable, getPaceCategory } from "@/lib/step-counter";
import { fetchWalkingRoute } from "@/lib/routing";
import { useToast } from "@/hooks/use-toast";
import { generateShareCard, shareOrDownload } from "@/lib/share-card";
import { isNearMosque, addCheckIn, hasCheckedInToday } from "@/lib/checkin";
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

function getDirectionIcon(instruction: string, small = false) {
  const size = small ? "w-3 h-3" : "w-6 h-6 text-primary-foreground";
  const lower = instruction.toLowerCase();
  if (lower.includes("left")) return <CornerDownLeft className={size} />;
  if (lower.includes("right")) return <CornerDownRight className={size} />;
  if (lower.includes("arrive") || lower.includes("destination")) return <MapPin className={size} />;
  if (lower.includes("straight") || lower.includes("continue")) return <ArrowUp className={size} />;
  if (lower.includes("depart")) return <Play className={`${size}`} />;
  return <ArrowUp className={size} />;
}

function formatDirection(instruction: string): string {
  const parts = instruction.split(" ");
  const type = parts[0];
  const rest = parts.slice(1).join(" ");
  const typeMap: Record<string, string> = {
    turn: "Turn",
    "new": "Continue on",
    depart: "Start walking",
    arrive: "Arrive at destination",
    continue: "Continue",
    merge: "Merge",
    fork: "Take fork",
    "end": "End",
    roundabout: "Enter roundabout",
  };
  const mapped = typeMap[type.toLowerCase()] || type;
  return rest ? `${mapped} ${rest}` : mapped;
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
  const [selectedPrayer, setSelectedPrayer] = useState<string>(searchParams.get("prayer") || "");
  const [sensorSteps, setSensorSteps] = useState(0);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerLoading, setPrayerLoading] = useState(true);
  const [timeUntilPrayer, setTimeUntilPrayer] = useState<string>("");
  const [mosqueAddress, setMosqueAddress] = useState<string>("");
  const [sensorSource, setSensorSource] = useState<string>("none");
  const [showPaceWarning, setShowPaceWarning] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number; steps: { instruction: string; distance: number }[] } | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [currentDirectionIdx, setCurrentDirectionIdx] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);

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

  // Fetch prayer times and auto-select next prayer
  useEffect(() => {
    const loadPrayers = async () => {
      try {
        let lat = settings.cityLat;
        let lng = settings.cityLng;
        if (!lat || !lng) {
          const ipGeo = await getIPGeolocation();
          if (ipGeo) { lat = ipGeo.lat; lng = ipGeo.lng; }
          else { lat = 21.42; lng = 39.83; }
        }
        const data = await fetchPrayerTimes(lat, lng);
        setPrayerTimes(data.prayers);
        
        // Auto-select next upcoming prayer if none specified
        if (!searchParams.get("prayer")) {
          const nextPrayer = data.prayers.find((p) => !p.isPast);
          if (nextPrayer) {
            setSelectedPrayer(nextPrayer.name);
          } else {
            setSelectedPrayer("Fajr"); // All passed, default to Fajr (next day)
          }
        }
      } catch {
        if (!selectedPrayer) setSelectedPrayer("Dhuhr");
      } finally {
        setPrayerLoading(false);
      }
    };
    loadPrayers();
  }, []);

  // Reverse-geocode mosque address
  useEffect(() => {
    if (!mosquePosition) return;
    const fetchAddress = async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${mosquePosition.lat}&lon=${mosquePosition.lng}&format=json`, {
          headers: { "Accept-Language": "en" },
        });
        const data = await res.json();
        if (data.display_name) {
          // Shorten: take first 3 parts
          const parts = data.display_name.split(", ");
          setMosqueAddress(parts.slice(0, 3).join(", "));
        }
      } catch {}
    };
    fetchAddress();
  }, [mosquePosition?.lat, mosquePosition?.lng]);

  // Fetch route on mount if we have user position and mosque
  useEffect(() => {
    if (!mosquePosition) return;
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

  // Countdown to selected prayer
  useEffect(() => {
    if (!selectedPrayer || !prayerTimes.length) return;
    const prayer = prayerTimes.find((p) => p.name === selectedPrayer);
    if (!prayer) { setTimeUntilPrayer(""); return; }
    
    const update = () => {
      const [h, m] = prayer.time.split(":").map(Number);
      const now = new Date();
      let diffMin = (h * 60 + m) - (now.getHours() * 60 + now.getMinutes());
      if (diffMin < 0) diffMin += 24 * 60;
      if (diffMin <= 0) { setTimeUntilPrayer("Now"); return; }
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      setTimeUntilPrayer(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [selectedPrayer, prayerTimes]);

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

  // Update turn-by-turn direction based on position — improved matching
  useEffect(() => {
    if (!routeInfo?.steps?.length || !currentPosition || !routeCoords.length) return;
    
    // Find closest point on route
    let minDist = Infinity;
    let closestCoordIdx = 0;
    for (let i = 0; i < routeCoords.length; i++) {
      const d = haversine(currentPosition.lat, currentPosition.lng, routeCoords[i][0], routeCoords[i][1]);
      if (d < minDist) {
        minDist = d;
        closestCoordIdx = i;
      }
    }
    
    // Map closest coord to the right direction step by accumulating distances
    let accDist = 0;
    const totalRouteDist = routeInfo.steps.reduce((s, st) => s + st.distance, 0);
    const progressRatio = closestCoordIdx / Math.max(1, routeCoords.length - 1);
    const targetDist = progressRatio * totalRouteDist;
    
    let stepIdx = 0;
    for (let i = 0; i < routeInfo.steps.length; i++) {
      accDist += routeInfo.steps[i].distance;
      if (accDist >= targetDist) {
        stepIdx = i;
        break;
      }
      stepIdx = i;
    }
    
    setCurrentDirectionIdx(stepIdx);
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
        const accuracy = pos.coords.accuracy;
        setCurrentPosition(newPos);
        setPositions((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segmentDist = haversine(last.lat, last.lng, newPos.lat, newPos.lng);
            // Filter out GPS noise: ignore < 5m moves, jumps > 200m, and low accuracy > 50m
            if (segmentDist > 0.005 && segmentDist < 0.2 && accuracy < 50) {
              distanceRef.current += segmentDist;
              setDistanceKm(distanceRef.current);
              return [...prev, newPos];
            }
            return prev;
          }
          // Only accept first position if accuracy is reasonable
          if (accuracy < 50) return [newPos];
          return prev;
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

            {/* Prayer selection with time info */}
            <div className="glass-card p-4 text-left">
              <label className="text-sm font-medium text-foreground mb-2 block">Walking for which prayer?</label>
              {prayerLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Detecting next prayer...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {PRAYERS.map((p) => {
                    const prayerData = prayerTimes.find((pt) => pt.name === p);
                    const isNext = prayerData && !prayerData.isPast && !prayerTimes.slice(0, prayerTimes.indexOf(prayerData)).some((pt) => !pt.isPast);
                    return (
                      <button key={p} onClick={() => setSelectedPrayer(p)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all relative ${
                          selectedPrayer === p 
                            ? "bg-gradient-teal text-primary-foreground shadow-teal" 
                            : prayerData?.isPast 
                              ? "bg-muted/50 text-muted-foreground/50" 
                              : isNext 
                                ? "bg-gold/20 text-gold ring-1 ring-gold/30" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {p}
                        {prayerData && !prayerData.isPast && (
                          <span className="block text-[9px] opacity-70">{prayerData.time}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Time until selected prayer */}
              {selectedPrayer && timeUntilPrayer && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gold" />
                  <span className="text-foreground font-medium">
                    {selectedPrayer} in <span className="text-gold font-bold">{timeUntilPrayer}</span>
                  </span>
                  {(() => {
                    const prayerData = prayerTimes.find((pt) => pt.name === selectedPrayer);
                    if (!prayerData) return null;
                    const walkTime = routeInfo?.durationMin || estimateWalkingTime(mosqueDist, settings.walkingSpeed);
                    const leaveBy = calculateLeaveByTime(prayerData.time, walkTime);
                    const minsLeft = minutesUntilLeave(prayerData.time, walkTime);
                    return (
                      <span className={`text-xs ml-auto font-medium ${minsLeft <= 5 ? "text-destructive" : minsLeft <= 15 ? "text-gold" : "text-primary"}`}>
                        Leave by {leaveBy}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Mosque info card */}
            <div className="glass-card p-4 text-left space-y-2">
              {mosquePosition ? (
                <>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        {mosqueName}
                      </p>
                      {mosqueAddress && (
                        <p className="text-xs text-muted-foreground ml-5.5 pl-0.5">{mosqueAddress}</p>
                      )}
                    </div>
                    <Link to="/mosques" className="text-xs text-primary font-medium hover:underline flex-shrink-0">
                      Change
                    </Link>
                  </div>

                  {/* Distance & route details */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-foreground">
                        {routeInfo ? routeInfo.distanceKm.toFixed(1) : mosqueDist.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">km</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-foreground">
                        {routeInfo ? estimateSteps(routeInfo.distanceKm).toLocaleString() : estimateSteps(mosqueDist).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">steps</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-foreground">
                        ~{routeInfo ? routeInfo.durationMin : estimateWalkingTime(mosqueDist, settings.walkingSpeed)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">min</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-2 space-y-2">
                  <MapPin className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-medium text-foreground">No mosque selected</p>
                  <p className="text-xs text-muted-foreground">Find a nearby mosque to get route info and distance tracking.</p>
                  <Link to="/mosques">
                    <Button variant="outline" size="sm" className="mt-1">
                      <MapPin className="w-3 h-3 mr-1" /> Find Mosque
                    </Button>
                  </Link>
                </div>
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

            {/* Direction progress panel */}
            {routeInfo && routeInfo.steps.length > 0 && (
              <div className="glass-card p-0 overflow-hidden text-left">
                {/* Current direction - hero */}
                {currentDirection && (
                  <div className="bg-gradient-teal p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                      {getDirectionIcon(currentDirection.instruction)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-primary-foreground capitalize leading-tight">
                        {formatDirection(currentDirection.instruction)}
                      </p>
                      <p className="text-sm text-primary-foreground/70 mt-0.5">
                        {currentDirection.distance > 1000 
                          ? `${(currentDirection.distance / 1000).toFixed(1)} km` 
                          : `${Math.round(currentDirection.distance)} m`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-primary-foreground/60">Step</p>
                      <p className="text-lg font-bold text-primary-foreground">{currentDirectionIdx + 1}<span className="text-sm font-normal text-primary-foreground/50">/{routeInfo.steps.length}</span></p>
                    </div>
                  </div>
                )}

                {/* Direction step progress bar */}
                <div className="px-4 pt-2 pb-1">
                  <div className="flex gap-0.5">
                    {routeInfo.steps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                          i < currentDirectionIdx
                            ? "bg-primary"
                            : i === currentDirectionIdx
                              ? "bg-gold"
                              : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Upcoming directions */}
                <div className="px-4 pb-3 pt-1 space-y-1 max-h-24 overflow-y-auto">
                  {routeInfo.steps.slice(currentDirectionIdx + 1, currentDirectionIdx + 4).map((s, i) => {
                    const actualIdx = currentDirectionIdx + 1 + i;
                    return (
                      <div key={actualIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          {getDirectionIcon(s.instruction, true)}
                        </div>
                        <span className="capitalize truncate flex-1">{formatDirection(s.instruction)}</span>
                        <span className="text-muted-foreground/60 flex-shrink-0">
                          {s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${Math.round(s.distance)}m`}
                        </span>
                      </div>
                    );
                  })}
                  {routeInfo.steps.length > currentDirectionIdx + 4 && (
                    <p className="text-[10px] text-muted-foreground/50 text-center">
                      +{routeInfo.steps.length - currentDirectionIdx - 4} more steps
                    </p>
                  )}
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
              <Button variant="outline" className="flex-1" onClick={async () => {
                setSharingCard(true);
                try {
                  const blob = await generateShareCard({
                    title: `Walk to ${selectedPrayer} Complete!`,
                    subtitle: `${mosqueName} • ${new Date().toLocaleDateString()}`,
                    stats: [
                      { label: "Steps", value: displaySteps.toLocaleString() },
                      { label: "Hasanat", value: hasanat.toLocaleString() },
                      { label: "Distance", value: `${distanceKm.toFixed(2)} km` },
                    ],
                    hadith: "He does not take a step without being raised a degree and having one of his sins removed.",
                    type: "walk",
                  });
                  await shareOrDownload(blob, `${displaySteps.toLocaleString()} steps to ${selectedPrayer} — ${hasanat.toLocaleString()} hasanat earned!`);
                } catch {
                  // Fallback to text share
                  const text = `🕌 Walk to ${selectedPrayer} complete!\n👣 ${displaySteps.toLocaleString()} steps\n⭐ ${hasanat.toLocaleString()} hasanat\n📏 ${distanceKm.toFixed(2)} km`;
                  if (navigator.share) { navigator.share({ title: "MosqueSteps Walk", text }).catch(() => {}); }
                  else { navigator.clipboard.writeText(text); toast({ title: "Copied! 📋" }); }
                }
                setSharingCard(false);
              }}>
                <Image className="w-4 h-4 mr-1" /> {sharingCard ? "Generating..." : "Share Card"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                const text = `🕌 Walk to ${selectedPrayer} complete!\n👣 ${displaySteps.toLocaleString()} steps\n⭐ ${hasanat.toLocaleString()} hasanat\n📏 ${distanceKm.toFixed(2)} km\n⏱️ ${formatTime(elapsedSeconds)}`;
                if (navigator.share) { navigator.share({ title: "MosqueSteps Walk", text }).catch(() => {}); }
                else { navigator.clipboard.writeText(text); toast({ title: "Copied! 📋" }); }
              }}>
                <Share2 className="w-4 h-4 mr-1" /> Share Text
              </Button>
            </div>

            {/* Check-in button */}
            {mosquePosition && currentPosition && (
              <div className="glass-card p-4">
                {isNearMosque(currentPosition.lat, currentPosition.lng, mosquePosition.lat, mosquePosition.lng) ? (
                  checkedIn || hasCheckedInToday(String(mosquePosition.lat), selectedPrayer) ? (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold text-sm">Checked in at {mosqueName}! 🕌</span>
                    </div>
                  ) : (
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => {
                        addCheckIn({
                          mosqueId: String(mosquePosition.lat),
                          mosqueName,
                          date: new Date().toISOString(),
                          prayer: selectedPrayer,
                          lat: currentPosition!.lat,
                          lng: currentPosition!.lng,
                        });
                        setCheckedIn(true);
                        toast({ title: "Checked in! 🕌", description: `${mosqueName} — ${selectedPrayer}` });
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Check In at {mosqueName}
                    </Button>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    📍 Get within 100m of the mosque to check in
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="hero" className="flex-1" onClick={() => { setCompleted(false); setDistanceKm(0); setSensorSteps(0); setCheckedIn(false); }}>
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
