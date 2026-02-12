import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Square, Pause, MapPin, Footprints, Clock, Star, Navigation, AlertTriangle, Smartphone, Share2, Map, Image, CheckCircle, ArrowUp, CornerDownLeft, CornerDownRight, ArrowRight, ChevronDown, Volume2, VolumeX, Route, Download, Copy, ExternalLink, Award, Flame, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { estimateSteps, estimateWalkingTime, calculateHasanat, fetchPrayerTimes, calculateLeaveByTime, minutesUntilLeave, getNowInTimezone, getIPGeolocation, type PrayerTime } from "@/lib/prayer-times";
import { addWalkEntry, getSettings, getSavedMosques } from "@/lib/walking-history";
import { markPrayerWalked, updatePrayerLog, getTodayStr } from "@/lib/prayer-log";
import { StepCounter, isStepCountingAvailable, getPaceCategory } from "@/lib/step-counter";
import { fetchWalkingRoute } from "@/lib/routing";
import { getCachedRoute, setCachedRoute, isOnline } from "@/lib/offline-cache";
import { useToast } from "@/hooks/use-toast";
import { generateShareCard, shareOrDownload } from "@/lib/share-card";
import { isNearMosque, addCheckIn, hasCheckedInToday } from "@/lib/checkin";
import { getNewlyEarnedBadges } from "@/lib/badges";
import { getWalkingStats } from "@/lib/walking-history";
import Confetti from "@/components/Confetti";
import SEOHead from "@/components/SEOHead";
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showDirections, setShowDirections] = useState(true);
  const [offRoute, setOffRoute] = useState(false);
  const [eta, setEta] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [newBadges, setNewBadges] = useState<{ id: string; name: string; icon: string; description: string }[]>([]);
  const [returnMethod, setReturnMethod] = useState<string>("");
  const [returnRouteCoords, setReturnRouteCoords] = useState<[number, number][]>([]);
  const [returnRouteInfo, setReturnRouteInfo] = useState<{ distanceKm: number; durationMin: number; steps: { instruction: string; distance: number }[] } | null>(null);
  const [returnRouteLoading, setReturnRouteLoading] = useState(false);
  const prevDirectionIdx = useRef(-1);
  const prayerMarginAlerted = useRef(false);

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
        const data = await fetchPrayerTimes(lat, lng, undefined, settings.cityTimezone);
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

  // Fetch route on mount — prefer home location, cache for offline
  useEffect(() => {
    if (!mosquePosition) return;

    const getOrigin = (): Promise<Position> => {
      // Prefer home location for pre-walk route calculation
      if (settings.homeLat && settings.homeLng) {
        return Promise.resolve({ lat: settings.homeLat, lng: settings.homeLng });
      }
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject();
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          reject
        );
      });
    };

    getOrigin().then(async (origin) => {
      setCurrentPosition(origin);

      // Try cache first
      const cached = getCachedRoute(origin.lat, origin.lng, mosquePosition.lat, mosquePosition.lng);
      if (cached) {
        setRouteCoords(cached.coords);
        setRouteInfo({ distanceKm: cached.distanceKm, durationMin: cached.durationMin, steps: cached.steps });
        // Revalidate in background if online
        if (isOnline()) {
          fetchWalkingRoute(origin.lat, origin.lng, mosquePosition.lat, mosquePosition.lng).then((fresh) => {
            if (fresh) {
              setCachedRoute(origin.lat, origin.lng, mosquePosition.lat, mosquePosition.lng, fresh);
              setRouteCoords(fresh.coords);
              setRouteInfo({ distanceKm: fresh.distanceKm, durationMin: fresh.durationMin, steps: fresh.steps });
            }
          }).catch(() => {});
        }
        return;
      }

      // Fetch fresh route
      const route = await fetchWalkingRoute(origin.lat, origin.lng, mosquePosition.lat, mosquePosition.lng);
      if (route) {
        setRouteCoords(route.coords);
        setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
        setCachedRoute(origin.lat, origin.lng, mosquePosition.lat, mosquePosition.lng, route);
      } else {
        toast({ title: "Directions unavailable", description: "Showing distance only. Use Open in Maps for turn-by-turn.", variant: "default" });
      }
    }).catch(() => {});
  }, [mosquePosition?.lat, mosquePosition?.lng]);

  // Countdown to selected prayer (use city timezone so it matches prayer times)
  useEffect(() => {
    if (!selectedPrayer || !prayerTimes.length) return;
    const prayer = prayerTimes.find((p) => p.name === selectedPrayer);
    if (!prayer) { setTimeUntilPrayer(""); return; }
    const tz = settings.cityTimezone;
    const update = () => {
      const [h, m] = prayer.time.split(":").map(Number);
      const { hours: nowH, minutes: nowM } = getNowInTimezone(tz);
      let diffMin = (h * 60 + m) - (nowH * 60 + nowM);
      if (diffMin < 0) diffMin += 24 * 60;
      if (diffMin <= 0) { setTimeUntilPrayer("Now"); return; }
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      setTimeUntilPrayer(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [selectedPrayer, prayerTimes, settings.cityTimezone]);

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

  // Update turn-by-turn direction based on position — improved matching + off-route detection
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

    // Off-route detection: > 100m from route
    setOffRoute(minDist > 0.1);
    
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

    // Calculate ETA
    const remainingDist = routeInfo.steps.slice(stepIdx).reduce((sum, s) => sum + s.distance, 0);
    const speedKmh = elapsedSeconds > 30 ? distanceKm / (elapsedSeconds / 3600) : (settings.walkingSpeed || 5);
    const remainingMin = speedKmh > 0 ? Math.round((remainingDist / 1000) / speedKmh * 60) : 0;
    const arrivalTime = new Date(Date.now() + remainingMin * 60000);
    setEta(arrivalTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, [currentPosition, routeInfo, elapsedSeconds, distanceKm]);

  // Voice directions — speak when step changes
  useEffect(() => {
    if (!voiceEnabled || !isWalking || !routeInfo?.steps?.length) return;
    if (currentDirectionIdx === prevDirectionIdx.current) return;
    prevDirectionIdx.current = currentDirectionIdx;

    const step = routeInfo.steps[currentDirectionIdx];
    if (!step) return;

    const text = formatDirection(step.instruction);
    const distText = step.distance > 1000
      ? `${(step.distance / 1000).toFixed(1)} kilometers`
      : `${Math.round(step.distance)} meters`;

    const isLast = currentDirectionIdx === routeInfo.steps.length - 1;
    const speech = isLast
      ? `Arriving at ${mosqueName}. You have reached your destination.`
      : `${text}. ${distText}.`;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speech);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentDirectionIdx, voiceEnabled, isWalking, routeInfo, mosqueName]);

  // Off-route: voice alert + auto-reroute
  const lastRerouteRef = useRef(0);
  useEffect(() => {
    if (!offRoute || !isWalking || !currentPosition || !mosquePosition) return;
    
    // Voice warning
    if (voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("You are off route. Recalculating.");
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    // Auto-reroute (throttle to once per 30s)
    if (Date.now() - lastRerouteRef.current < 30000) return;
    lastRerouteRef.current = Date.now();

    fetchWalkingRoute(currentPosition.lat, currentPosition.lng, mosquePosition.lat, mosquePosition.lng).then((route) => {
      if (route) {
        setRouteCoords(route.coords);
        setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
        setCachedRoute(currentPosition.lat, currentPosition.lng, mosquePosition.lat, mosquePosition.lng, route);
        setCurrentDirectionIdx(0);
        prevDirectionIdx.current = -1;
        setOffRoute(false);
      }
    }).catch(() => {});
  }, [offRoute, isWalking, currentPosition, mosquePosition, voiceEnabled]);

  // Stop speech when walk ends
  useEffect(() => {
    if (!isWalking && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (!isWalking) prayerMarginAlerted.current = false;
  }, [isWalking]);

  // Voice alert when prayer margin drops below 5 minutes
  useEffect(() => {
    if (!isWalking || !voiceEnabled || !selectedPrayer || !prayerTimes.length) return;
    if (prayerMarginAlerted.current) return;

    const prayer = prayerTimes.find(pt => pt.name === selectedPrayer);
    if (!prayer) return;

    const walkTime = routeInfo?.durationMin || estimateWalkingTime(mosqueDist, settings.walkingSpeed);
    const ml = minutesUntilLeave(prayer.time, walkTime, settings.cityTimezone);

    if (ml <= 5 && ml > -10) {
      prayerMarginAlerted.current = true;
      // Vibration alert
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          "Prayer time is approaching, pick up your pace."
        );
        utterance.rate = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [isWalking, voiceEnabled, selectedPrayer, prayerTimes, elapsedSeconds, routeInfo, mosqueDist, settings.cityTimezone]);

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
    setShowCelebration(true);

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

    // Auto-mark prayer as walked in daily prayer log
    if (selectedPrayer) markPrayerWalked(selectedPrayer);

    // Check for newly earned badges
    const stats = getWalkingStats();
    const earned = getNewlyEarnedBadges(stats);
    if (earned.length > 0) setNewBadges(earned);

    toast({ title: "Walk completed! 🎉", description: `${displaySteps.toLocaleString()} steps · ${hasanat.toLocaleString()} hasanat earned.` });

    // Hide confetti after 4 seconds
    setTimeout(() => setShowCelebration(false), 4000);
  };

  const openInMaps = () => {
    if (!mosquePosition) return;
    const dest = `${mosquePosition.lat},${mosquePosition.lng}`;
    const origin = currentPosition ? `${currentPosition.lat},${currentPosition.lng}` : "";
    // Try Apple Maps on iOS, Google Maps otherwise
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      window.open(`maps://maps.apple.com/?daddr=${dest}&dirflg=w`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&origin=${origin}&travelmode=walking`, "_blank");
    }
  };

  const estimateCalories = (steps: number): number => {
    // Rough estimate: ~0.04 kcal per step for average person
    return Math.round(steps * 0.04);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Generate shareable directions text
  const generateDirectionsText = () => {
    if (!routeInfo?.steps?.length) return "";
    const header = `🕌 Directions to ${mosqueName}\n📍 From: ${settings.homeAddress || "Your location"}\n📏 ${routeInfo.distanceKm.toFixed(1)} km · ~${routeInfo.durationMin} min walk\n${"─".repeat(30)}\n`;
    const steps = routeInfo.steps.map((s, i) => {
      const dist = s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${Math.round(s.distance)}m`;
      return `${i + 1}. ${formatDirection(s.instruction)} (${dist})`;
    }).join("\n");
    return `${header}${steps}\n${"─".repeat(30)}\nGenerated by MosqueSteps 🚶‍♂️`;
  };

  const quote = SUNNAH_QUOTES[currentQuoteIdx];
  const currentDirection = routeInfo?.steps?.[currentDirectionIdx];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-bottom-nav">
      <SEOHead
        title="Track Your Walk"
        description="Track your walk to the mosque in real time. Steps, distance, hasanat, and turn-by-turn guidance. MosqueSteps."
        path="/walk"
        noindex
      />
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
                    const minsLeft = minutesUntilLeave(prayerData.time, walkTime, settings.cityTimezone);
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
                      {settings.homeAddress && (
                        <p className="text-[10px] text-muted-foreground/70 ml-5.5 pl-0.5 flex items-center gap-1">
                          🏠 Route from: {settings.homeAddress}
                        </p>
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

            {/* Turn-by-turn preview with export */}
            {routeInfo && routeInfo.steps.length > 0 && (
              <div className="glass-card p-3 text-left">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> Directions ({routeInfo.steps.length} steps)
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const text = generateDirectionsText();
                        navigator.clipboard.writeText(text);
                        toast({ title: "Directions copied! 📋" });
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                      title="Copy directions"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const text = generateDirectionsText();
                        if (navigator.share) {
                          navigator.share({ title: `Directions to ${mosqueName}`, text }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(text);
                          toast({ title: "Directions copied! 📋" });
                        }
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                      title="Share directions"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Route summary bar */}
                <div className="flex items-center gap-2 mb-2 bg-muted/50 rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    🏠 {settings.homeAddress || "Your location"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">→</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    🕌 {mosqueName}
                  </span>
                  <span className="text-[10px] text-primary font-medium ml-auto">
                    {routeInfo.distanceKm.toFixed(1)} km · {routeInfo.durationMin} min
                  </span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {routeInfo.steps.map((s, i) => {
                    const isLast = i === routeInfo.steps.length - 1;
                    return (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isLast ? "bg-gold/20 text-gold" : "bg-primary/10 text-primary"
                          }`}>
                            {isLast ? "🕌" : i + 1}
                          </div>
                          {!isLast && <div className="w-px h-3 bg-border mt-0.5" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <span className="text-foreground capitalize font-medium">
                            {formatDirection(s.instruction)}
                          </span>
                          <span className="text-muted-foreground/60 ml-1">
                            ({s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${Math.round(s.distance)}m`})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button variant="hero" size="lg" className="w-full text-base" onClick={startWalk}>
              <Play className="w-5 h-5 mr-2" /> Start Walking
            </Button>
            {mosquePosition && (
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={openInMaps}>
                <ExternalLink className="w-3.5 h-3.5" /> Open Directions in Maps App
              </Button>
            )}
          </motion.div>
        )}

        {/* Active walk screen */}
        {isWalking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 w-full max-w-sm">
            {/* Walking header with toggles */}
            <div className="flex items-center justify-between">
              <div className="inline-block px-3 py-1 rounded-full bg-gradient-gold text-foreground text-xs font-semibold">
                Walking to {selectedPrayer}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-1.5 rounded-lg transition-colors ${voiceEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  title={voiceEnabled ? "Voice ON" : "Voice OFF"}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowDirections(!showDirections)}
                  className={`p-1.5 rounded-lg transition-colors ${showDirections ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  title={showDirections ? "Directions ON" : "Directions OFF"}
                >
                  <Route className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`p-1.5 rounded-lg transition-colors ${showMap ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  title={showMap ? "Map ON" : "Map OFF"}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prayer countdown while walking */}
            {selectedPrayer && timeUntilPrayer && (
              <div className={`rounded-xl px-4 py-3 ${
                (() => {
                  const prayer = prayerTimes.find(pt => pt.name === selectedPrayer);
                  if (!prayer) return "bg-muted";
                  const walkTime = routeInfo?.durationMin || estimateWalkingTime(mosqueDist, settings.walkingSpeed);
                  const ml = minutesUntilLeave(prayer.time, walkTime, settings.cityTimezone);
                  if (ml <= 0) return "bg-destructive/15 ring-1 ring-destructive/30";
                  if (ml <= 5) return "bg-destructive/10";
                  if (ml <= 15) return "bg-gold/10";
                  return "bg-primary/5";
                })()
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <p className="text-xs font-semibold text-foreground">
                      {selectedPrayer} in <span className="text-gold">{timeUntilPrayer}</span>
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {prayerTimes.find(pt => pt.name === selectedPrayer)?.time || ""}
                  </span>
                </div>
                {/* Estimated arrival comparison */}
                {(() => {
                  const prayer = prayerTimes.find(pt => pt.name === selectedPrayer);
                  if (!prayer) return null;
                  const [ph, pm] = prayer.time.split(":").map(Number);
                  const prayerTotalMin = ph * 60 + pm;

                  // Calculate remaining walk time based on current speed
                  const remainingDist = routeInfo?.steps
                    ? routeInfo.steps.slice(currentDirectionIdx).reduce((sum, s) => sum + s.distance, 0) / 1000
                    : mosqueDist - distanceKm;
                  const currentSpeed = elapsedSeconds > 30 ? distanceKm / (elapsedSeconds / 3600) : (settings.walkingSpeed || 5);
                  const remainingWalkMin = currentSpeed > 0 ? Math.round((remainingDist / currentSpeed) * 60) : 0;

                  const { hours: nowH, minutes: nowM } = getNowInTimezone(settings.cityTimezone);
                  const arrivalTotalMin = nowH * 60 + nowM + remainingWalkMin;
                  const diffMin = prayerTotalMin - arrivalTotalMin;

                  const walkTime = routeInfo?.durationMin || estimateWalkingTime(mosqueDist, settings.walkingSpeed);
                  const ml = minutesUntilLeave(prayer.time, walkTime, settings.cityTimezone);

                  return (
                    <div className="mt-2 space-y-1">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${
                        diffMin < 0 ? "text-destructive" : diffMin <= 5 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {diffMin < 0 ? (
                          <>⚠️ You may be {Math.abs(diffMin)} min late</>
                        ) : diffMin === 0 ? (
                          <>⏰ You'll arrive just in time</>
                        ) : (
                          <>✅ You'll arrive {diffMin} min before {selectedPrayer}</>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>~{remainingWalkMin}m walk left</span>
                        <span>·</span>
                        <span>{ml}m margin</span>
                        <span>·</span>
                        <span>{currentSpeed.toFixed(1)} km/h</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Live map with overlays */}
            {showMap && (
              <WalkMap
                userPosition={currentPosition}
                mosquePosition={mosquePosition}
                walkPath={positions}
                routeCoords={routeCoords}
                routeSteps={routeInfo?.steps}
                currentStepIdx={currentDirectionIdx}
                isWalking={true}
                offRoute={offRoute}
                eta={eta}
                onRecenter={() => {
                  // Re-center handled by WalkMap's panTo
                  if (currentPosition) {
                    setCurrentPosition({ ...currentPosition });
                  }
                }}
                className="shadow-md"
              />
            )}

            {/* Turn-by-turn navigation panel */}
            {showDirections && routeInfo && routeInfo.steps.length > 0 && (
              <div className="glass-card p-0 overflow-hidden text-left w-full">
                {/* Current direction — large navigation-style card */}
                {currentDirection && (
                  <div className="bg-gradient-teal p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                        {getDirectionIcon(currentDirection.instruction)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-primary-foreground capitalize leading-tight">
                          {formatDirection(currentDirection.instruction)}
                        </p>
                        <p className="text-sm text-primary-foreground/70 mt-0.5">
                          {currentDirection.distance > 1000 
                            ? `${(currentDirection.distance / 1000).toFixed(1)} km` 
                            : `${Math.round(currentDirection.distance)} m`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-primary-foreground/50">STEP</p>
                        <p className="text-xl font-bold text-primary-foreground">{currentDirectionIdx + 1}<span className="text-sm font-normal text-primary-foreground/40">/{routeInfo.steps.length}</span></p>
                      </div>
                    </div>

                    {/* Remaining distance to mosque */}
                    {(() => {
                      const remainingDist = routeInfo.steps.slice(currentDirectionIdx).reduce((sum, s) => sum + s.distance, 0);
                      const remainingMin = Math.round((remainingDist / 1000) / (settings.walkingSpeed || 5) * 60);
                      return (
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-primary-foreground/10 text-xs text-primary-foreground/60">
                          <span>{remainingDist > 1000 ? `${(remainingDist / 1000).toFixed(1)} km` : `${Math.round(remainingDist)} m`} left</span>
                          <span>~{remainingMin} min</span>
                          <span className="ml-auto">{Math.round((currentDirectionIdx / Math.max(1, routeInfo.steps.length - 1)) * 100)}% done</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Segmented progress bar */}
                <div className="px-3 pt-2 pb-1">
                  <div className="flex gap-[2px]">
                    {routeInfo.steps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                          i < currentDirectionIdx
                            ? "bg-primary"
                            : i === currentDirectionIdx
                              ? "bg-gold animate-pulse"
                              : "bg-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Next up — upcoming directions list */}
                {routeInfo.steps.length > currentDirectionIdx + 1 && (
                  <div className="px-3 pb-3 pt-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Next up</p>
                    <div className="space-y-1.5">
                      {routeInfo.steps.slice(currentDirectionIdx + 1, currentDirectionIdx + 4).map((s, i) => {
                        const actualIdx = currentDirectionIdx + 1 + i;
                        const isNext = i === 0;
                        return (
                          <div
                            key={actualIdx}
                            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${
                              isNext ? "bg-muted/80" : ""
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                              isNext ? "bg-primary/10" : "bg-muted"
                            }`}>
                              {getDirectionIcon(s.instruction, true)}
                            </div>
                            <span className={`text-xs capitalize truncate flex-1 ${isNext ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                              {formatDirection(s.instruction)}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 tabular-nums">
                              {s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)} km` : `${Math.round(s.distance)} m`}
                            </span>
                          </div>
                        );
                      })}
                      {routeInfo.steps.length > currentDirectionIdx + 4 && (
                        <p className="text-[10px] text-muted-foreground/40 text-center pt-0.5">
                          +{routeInfo.steps.length - currentDirectionIdx - 4} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Final step — arrival indicator */}
                {currentDirectionIdx === routeInfo.steps.length - 1 && (
                  <div className="px-3 pb-3 pt-1">
                    <div className="flex items-center gap-2 bg-gold/10 rounded-lg px-3 py-2">
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="text-xs font-semibold text-foreground">Arriving at {mosqueName}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No route fallback — show basic distance guidance */}
            {(!routeInfo || routeInfo.steps.length === 0) && isWalking && mosquePosition && currentPosition && (
              <div className="glass-card p-3 flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {(haversine(currentPosition.lat, currentPosition.lng, mosquePosition.lat, mosquePosition.lng) * 1000).toFixed(0)} m to mosque
                  </p>
                  <p className="text-[10px] text-muted-foreground">Head towards {mosqueName}</p>
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

            {/* Live stats — announced to screen readers when values update */}
            <div className="grid grid-cols-4 gap-2" role="status" aria-live="polite" aria-atomic="true" aria-label={`Walk progress: ${displaySteps.toLocaleString()} steps, ${(distanceKm * 1000).toFixed(0)} meters, ${hasanat.toLocaleString()} hasanat, ${formatTime(elapsedSeconds)} elapsed`}>
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
                  <a href={quote.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold mt-1 block hover:underline" title="Open full hadith on Sunnah.com — Arabic, chain, and translations">— {quote.source}</a>
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

        {/* Completion celebration screen */}
        {completed && !isWalking && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 max-w-sm w-full">
            {showCelebration && <Confetti duration={4000} />}

            {/* Hero celebration */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center mx-auto animate-pulse-glow relative"
            >
              <Star className="w-12 h-12 text-foreground" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
              >
                <span className="text-primary-foreground text-xs font-bold">✓</span>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h1 className="text-2xl font-bold text-foreground">MashaAllah! 🎉</h1>
              <p className="text-sm text-muted-foreground mt-1">
                May Allah accept your {selectedPrayer} prayer and multiply your rewards.
              </p>
            </motion.div>

            {/* Hasanat highlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-teal rounded-2xl p-5 text-primary-foreground"
            >
              <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Spiritual Rewards Earned</p>
              <p className="text-4xl font-black text-gradient-gold">{hasanat.toLocaleString()}</p>
              <p className="text-xs opacity-70 mt-1">hasanat (2 per step)</p>
              <div className="mt-3 pt-3 border-t border-primary-foreground/10 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{displaySteps.toLocaleString()}</p>
                  <p className="text-[10px] opacity-60">steps</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{distanceKm.toFixed(2)}</p>
                  <p className="text-[10px] opacity-60">km</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{formatTime(elapsedSeconds)}</p>
                  <p className="text-[10px] opacity-60">time</p>
                </div>
              </div>
            </motion.div>

            {/* Calories & extra stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-3 gap-2"
            >
              <div className="glass-card p-3 text-center">
                <Flame className="w-4 h-4 text-destructive mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{estimateCalories(displaySteps)}</p>
                <p className="text-[10px] text-muted-foreground">kcal burned</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Navigation className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">
                  {elapsedSeconds > 30 ? (distanceKm / (elapsedSeconds / 3600)).toFixed(1) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">avg km/h</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold text-foreground">{Math.round(elapsedSeconds / 60)}</p>
                <p className="text-[10px] text-muted-foreground">min active</p>
              </div>
            </motion.div>

            {/* Newly earned badges */}
            {newBadges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="glass-card p-4 space-y-2"
              >
                <div className="flex items-center gap-2 justify-center">
                  <Trophy className="w-5 h-5 text-gold" />
                  <p className="text-sm font-bold text-foreground">New Badge{newBadges.length > 1 ? "s" : ""} Earned!</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {newBadges.map((badge) => (
                    <motion.div
                      key={badge.id}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="flex items-center gap-2 bg-gold/10 rounded-full px-3 py-1.5"
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-foreground">{badge.name}</p>
                        <p className="text-[10px] text-muted-foreground">{badge.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Walk map — with "Open in Maps" button; show return route when "Walk back" selected */}
            {(currentPosition || mosquePosition || positions.length > 1) && (
              <div className="relative">
                <WalkMap
                  userPosition={currentPosition}
                  mosquePosition={mosquePosition}
                  walkPath={positions}
                  routeCoords={routeCoords}
                  returnRouteCoords={returnMethod === "walked" && returnRouteCoords.length > 0 ? returnRouteCoords : undefined}
                  isWalking={false}
                  className="shadow-md"
                />
                {mosquePosition && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-3 right-3 shadow-lg text-xs gap-1"
                    onClick={openInMaps}
                  >
                    <ExternalLink className="w-3 h-3" /> Open in Maps
                  </Button>
                )}
              </div>
            )}

            {/* Completed route directions summary */}
            {routeInfo && routeInfo.steps.length > 0 && (
              <div className="glass-card p-3 text-left max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Route taken
                </p>
                <div className="space-y-1.5">
                  {routeInfo.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</div>
                      <span className="capitalize truncate flex-1">{formatDirection(s.instruction)}</span>
                      <span className="text-muted-foreground/60 flex-shrink-0">
                        {s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${Math.round(s.distance)}m`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Return journey */}
            <div className="glass-card p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">How will you get back home?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "walked", label: "🚶 Walk back" },
                  { id: "car", label: "🚗 Car" },
                  { id: "taxi", label: "🚕 Taxi" },
                  { id: "bus", label: "🚌 Bus" },
                  { id: "bike", label: "🚲 Bike" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={async () => {
                      setReturnMethod(m.id);
                      updatePrayerLog(getTodayStr(), selectedPrayer, { returnMethod: m.id as any });
                      if (m.id === "walked" && mosquePosition && !returnRouteInfo && returnRouteCoords.length === 0) {
                        const start = positions.length > 0
                          ? { lat: positions[0].lat, lng: positions[0].lng }
                          : (settings.homeLat != null && settings.homeLng != null
                            ? { lat: settings.homeLat, lng: settings.homeLng }
                            : null);
                        if (start) {
                          setReturnRouteLoading(true);
                          try {
                            const cached = getCachedRoute(mosquePosition.lat, mosquePosition.lng, start.lat, start.lng);
                            if (cached) {
                              setReturnRouteCoords(cached.coords);
                              setReturnRouteInfo({ distanceKm: cached.distanceKm, durationMin: cached.durationMin, steps: cached.steps });
                            } else {
                              const route = await fetchWalkingRoute(mosquePosition.lat, mosquePosition.lng, start.lat, start.lng);
                              if (route) {
                                setReturnRouteCoords(route.coords);
                                setReturnRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
                                setCachedRoute(mosquePosition.lat, mosquePosition.lng, start.lat, start.lng, route);
                              }
                            }
                          } finally {
                            setReturnRouteLoading(false);
                          }
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      returnMethod === m.id
                        ? "bg-gradient-teal text-primary-foreground shadow-teal"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {returnMethod === "walked" && (
                <p className="text-[10px] text-primary">✨ Walking back earns you even more hasanat!</p>
              )}
            </div>

            {/* Route back home — shown when "Walk back" selected */}
            {returnMethod === "walked" && (
              <>
                {returnRouteLoading && (
                  <div className="glass-card p-4 text-center text-sm text-muted-foreground">
                    Loading route back…
                  </div>
                )}
                {!returnRouteLoading && returnRouteInfo && returnRouteInfo.steps.length > 0 && (
                  <div className="glass-card p-3 text-left max-h-32 overflow-y-auto">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> Route back home
                    </p>
                    <div className="space-y-1.5">
                      {returnRouteInfo.steps.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-4 h-4 rounded-full bg-gold/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</div>
                          <span className="capitalize truncate flex-1">{formatDirection(s.instruction)}</span>
                          <span className="text-muted-foreground/60 flex-shrink-0">
                            {s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${Math.round(s.distance)}m`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {returnRouteInfo.distanceKm.toFixed(1)} km · ~{returnRouteInfo.durationMin} min
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Walk details */}
            <div className="glass-card p-3 text-xs text-muted-foreground flex items-center justify-between">
              <span>{selectedPrayer} · {mosqueName}</span>
              <span>{useRealSteps ? "Sensor" : "GPS est."}</span>
            </div>

            {/* Share buttons */}
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
                  const text = `🕌 Walk to ${selectedPrayer} complete!\n👣 ${displaySteps.toLocaleString()} steps\n⭐ ${hasanat.toLocaleString()} hasanat\n📏 ${distanceKm.toFixed(2)} km`;
                  if (navigator.share) { navigator.share({ title: "MosqueSteps Walk", text }).catch(() => {}); }
                  else { navigator.clipboard.writeText(text); toast({ title: "Copied! 📋" }); }
                }
                setSharingCard(false);
              }}>
                <Image className="w-4 h-4 mr-1" /> {sharingCard ? "Generating..." : "Share Card"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                const text = `🕌 Walk to ${selectedPrayer} complete!\n👣 ${displaySteps.toLocaleString()} steps\n⭐ ${hasanat.toLocaleString()} hasanat\n📏 ${distanceKm.toFixed(2)} km\n⏱️ ${formatTime(elapsedSeconds)}\n🔥 ${estimateCalories(displaySteps)} kcal`;
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
              <Button variant="hero" className="flex-1" onClick={() => { setCompleted(false); setDistanceKm(0); setSensorSteps(0); setCheckedIn(false); setNewBadges([]); }}>
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
