import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Square, Pause, MapPin, Footprints, Clock, Star, Navigation, AlertTriangle, Smartphone, Share2, Map, Image, CheckCircle, ArrowUp, CornerDownLeft, CornerDownRight, ArrowRight, ChevronDown, Volume2, VolumeX, Route, Download, Copy, ExternalLink, Award, Flame, Trophy, WifiOff, Search, Home, Locate, Wind, CloudRain, Thermometer, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { estimateSteps, estimateWalkingTime, calculateHasanat, fetchPrayerTimes, calculateLeaveByTime, minutesUntilLeave, getNowInTimezone, getIPGeolocation, type PrayerTime } from "@/lib/prayer-times";
import { addWalkEntry, getSettings, getSavedMosques } from "@/lib/walking-history";
import { markPrayerWalked, updatePrayerLog, getTodayStr } from "@/lib/prayer-log";
import { StepCounter, isStepCountingAvailable, getPaceCategory } from "@/lib/step-counter";
import { fetchWalkingRoute } from "@/lib/routing";
import { formatDirection, formatDistanceForStep } from "@/lib/directions-utils";
import { getCachedRoute, getCachedRouteToMosque, setCachedRoute, isOnline } from "@/lib/offline-cache";
import { fetchLocationSuggestions } from "@/lib/geocode";
import { fetchWeather, type WeatherCondition } from "@/lib/weather";
import { useToast } from "@/hooks/use-toast";
import { generateShareCard, shareOrDownload } from "@/lib/share-card";
import { downloadFile } from "@/lib/stats-export";
import { isNearMosque, addCheckIn, hasCheckedInToday } from "@/lib/checkin";
import { getNewlyEarnedBadges } from "@/lib/badges";
import { getWalkingStats } from "@/lib/walking-history";
import { addNotification, getNotificationSettings } from "@/lib/notification-store";
import { sendNotification, getNotificationPermission } from "@/lib/notifications";
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
  if (lower.includes("depart")) return <Play className={size} />;
  return <ArrowUp className={size} />;
}

const ActiveWalk = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [settings, setSettingsState] = useState(getSettings);
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
  const [returnDestOverride, setReturnDestOverride] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [returnDestSearch, setReturnDestSearch] = useState("");
  const [returnDestSuggestions, setReturnDestSuggestions] = useState<{ displayName: string; lat: number; lng: number }[]>([]);
  const [showReturnDestSearch, setShowReturnDestSearch] = useState(false);
  const [offline, setOffline] = useState(!isOnline());
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [locationSource, setLocationSource] = useState<"gps" | "ip" | "city" | "none">("none");
  const [locationPermission, setLocationPermission] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showMapsSheet, setShowMapsSheet] = useState(false);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const prevDirectionIdx = useRef(-1);
  const prepareAnnouncedForStep = useRef(-1);
  const prayerMarginAlerted = useRef(false);
  const prevStepIdxRef = useRef(0);
  const [distanceToTurnM, setDistanceToTurnM] = useState<number | null>(null);

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
  const mosqueDist = prayerMosque?.distanceKm ?? settings.selectedMosqueDistance ?? 0;
  const mosqueName = prayerMosque?.name || settings.selectedMosqueName || "your mosque";
  const progressPercent = mosqueDist > 0 ? Math.min(1, distanceKm / mosqueDist) : 0;
  const hasMosqueDestination = !!mosquePosition;

  // Auto-detect nearest mosque if none is set
  useEffect(() => {
    if (mosquePosition || autoDetecting) return;
    setAutoDetecting(true);

    const detect = async (lat: number, lng: number) => {
      try {
        const { searchNearbyMosques } = await import("@/lib/mosque-search");
        const results = await searchNearbyMosques(lat, lng);
        if (results.length > 0) {
          const closest = results[0];
          const dist = Math.max(0.1, Math.round(haversine(lat, lng, closest.lat, closest.lon) * 100) / 100);
          const { saveSettings: save, saveMosque: saveMosqueEntry, setPrimaryMosque: setPrimary } = await import("@/lib/walking-history");
          save({
            selectedMosqueName: closest.name,
            selectedMosqueLat: closest.lat,
            selectedMosqueLng: closest.lon,
            selectedMosqueDistance: dist,
          });
          saveMosqueEntry({ id: String(closest.id), name: closest.name, lat: closest.lat, lng: closest.lon, distanceKm: dist, isPrimary: true });
          setPrimary(String(closest.id));
          setSettingsState(getSettings());
          toast({ title: `Found: ${closest.name}`, description: `${dist.toFixed(1)} km away — auto-selected as your mosque.` });
        }
      } catch {
        // silently fail
      } finally {
        setAutoDetecting(false);
      }
    };

    // Try GPS first, then saved coords, then IP
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => detect(pos.coords.latitude, pos.coords.longitude),
        async () => {
          const lat = settings.homeLat || settings.cityLat;
          const lng = settings.homeLng || settings.cityLng;
          if (lat && lng) {
            detect(lat, lng);
          } else {
            const ipGeo = await getIPGeolocation();
            if (ipGeo) detect(ipGeo.lat, ipGeo.lng);
            else setAutoDetecting(false);
          }
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      const lat = settings.homeLat || settings.cityLat;
      const lng = settings.homeLng || settings.cityLng;
      if (lat && lng) detect(lat, lng);
      else setAutoDetecting(false);
    }
  }, [mosquePosition]);

  const isReturnWalk = searchParams.get("returnWalk") === "1";
  const returnFromLat = searchParams.get("fromLat");
  const returnFromLng = searchParams.get("fromLng");
  const returnToLat = searchParams.get("toLat");
  const returnToLng = searchParams.get("toLng");

  const parseCoord = (v: string | null): number | null => {
    if (!v) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= -90 && n <= 90 ? n : null;
  };
  const parseLng = (v: string | null): number | null => {
    if (!v) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) && n >= -180 && n <= 180 ? n : null;
  };
  const fromLatN = parseCoord(returnFromLat);
  const fromLngN = parseLng(returnFromLng);
  const toLatN = parseCoord(returnToLat);
  const toLngN = parseLng(returnToLng);
  const returnWalkOrigin = fromLatN != null && fromLngN != null ? { lat: fromLatN, lng: fromLngN } : null;
  const returnWalkDestination = toLatN != null && toLngN != null ? { lat: toLatN, lng: toLngN } : (settings.homeLat != null && settings.homeLng != null ? { lat: settings.homeLat, lng: settings.homeLng } : null);
  const effectiveDestination = isReturnWalk ? returnWalkDestination : mosquePosition;
  const effectiveMosqueName = isReturnWalk ? (returnDestOverride?.name || "Home") : mosqueName;
  const hasMosqueDestinationEffective = isReturnWalk ? !!returnWalkDestination : !!mosquePosition;
  const useImperial = settings.distanceUnit === "mi";

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

  // Track online/offline for route loading and UI
  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Check location permission state
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        setLocationPermission(result.state as "granted" | "denied" | "prompt");
        result.onchange = () => setLocationPermission(result.state as "granted" | "denied" | "prompt");
      }).catch(() => {});
    }
  }, []);

  // Fetch weather once we have any position coords
  useEffect(() => {
    const lat = currentPosition?.lat ?? settings.cityLat ?? settings.homeLat;
    const lng = currentPosition?.lng ?? settings.cityLng ?? settings.homeLng;
    if (!lat || !lng) return;
    fetchWeather(lat, lng).then((w) => { if (w) setWeather(w); }).catch(() => {});
  }, [currentPosition?.lat, currentPosition?.lng]);

  // Return walk: fetch route from mosque to home (or override destination)
  useEffect(() => {
    if (!isReturnWalk || !returnWalkOrigin || !returnWalkDestination) return;
    setCurrentPosition(returnWalkOrigin);
    const dest = returnWalkDestination;
    let cached = getCachedRoute(returnWalkOrigin.lat, returnWalkOrigin.lng, dest.lat, dest.lng);
    if (!cached && !isOnline()) {
      cached = getCachedRouteToMosque(dest.lat, dest.lng, returnWalkOrigin.lat, returnWalkOrigin.lng) ?? null;
    }
    if (cached) {
      setRouteCoords(cached.coords);
      setRouteInfo({ distanceKm: cached.distanceKm, durationMin: cached.durationMin, steps: cached.steps });
      if (isOnline()) {
        fetchWalkingRoute(returnWalkOrigin.lat, returnWalkOrigin.lng, dest.lat, dest.lng).then((fresh) => {
          if (fresh) {
            setCachedRoute(returnWalkOrigin.lat, returnWalkOrigin.lng, dest.lat, dest.lng, fresh);
            setRouteCoords(fresh.coords);
            setRouteInfo({ distanceKm: fresh.distanceKm, durationMin: fresh.durationMin, steps: fresh.steps });
          }
        }).catch(() => {});
      }
      return;
    }
    if (!isOnline()) {
      toast({ title: "Offline — no cached route", description: "Steps still count. Connect for directions.", variant: "default" });
      return;
    }
    fetchWalkingRoute(returnWalkOrigin.lat, returnWalkOrigin.lng, dest.lat, dest.lng)
      .then((route) => {
        if (route) {
          setRouteCoords(route.coords);
          setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
          setCachedRoute(returnWalkOrigin.lat, returnWalkOrigin.lng, dest.lat, dest.lng, route);
        } else {
          toast({ title: "Directions unavailable", description: "Use Open in Maps for turn-by-turn.", variant: "default" });
        }
      })
      .catch(() => {
        toast({ title: "Directions unavailable", description: "Check your connection and try again.", variant: "default" });
      });
  }, [isReturnWalk, returnWalkOrigin?.lat, returnWalkOrigin?.lng, returnWalkDestination?.lat, returnWalkDestination?.lng]);

  // Fetch return route when override destination is set (success screen)
  useEffect(() => {
    if (returnMethod !== "walked" || !mosquePosition || !returnDestOverride) return;
    const { lat, lng } = returnDestOverride;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    setReturnRouteLoading(true);
    fetchWalkingRoute(mosquePosition.lat, mosquePosition.lng, lat, lng)
      .then((route) => {
        if (route) {
          setReturnRouteCoords(route.coords);
          setReturnRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
          setCachedRoute(mosquePosition.lat, mosquePosition.lng, lat, lng, route);
        }
      })
      .catch(() => {})
      .finally(() => setReturnRouteLoading(false));
  }, [returnMethod, mosquePosition?.lat, mosquePosition?.lng, returnDestOverride?.lat, returnDestOverride?.lng]);

  // Debounced search for return destination override
  useEffect(() => {
    const q = returnDestSearch.trim();
    if (q.length < 2) {
      setReturnDestSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      fetchLocationSuggestions(q).then((s) =>
        setReturnDestSuggestions(s.map((x) => ({ displayName: x.displayName, lat: x.lat, lng: x.lng })))
      );
    }, 300);
    return () => clearTimeout(t);
  }, [returnDestSearch]);

  // Fetch route on mount — home > current location > city (so directions work without location permission)
  useEffect(() => {
    if (isReturnWalk || !mosquePosition) return;

    const getOrigin = (): Promise<Position> => {
      if (settings.homeLat != null && settings.homeLng != null) {
        return Promise.resolve({ lat: settings.homeLat, lng: settings.homeLng });
      }
      if (navigator.geolocation) {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {
              // Fallback to city so we still get directions
              if (settings.cityLat != null && settings.cityLng != null) {
                resolve({ lat: settings.cityLat!, lng: settings.cityLng! });
              } else {
                reject();
              }
            },
            { timeout: 8000, maximumAge: 60000 }
          );
        });
      }
      if (settings.cityLat != null && settings.cityLng != null) {
        return Promise.resolve({ lat: settings.cityLat, lng: settings.cityLng });
      }
      return Promise.reject(new Error("No origin"));
    };

    getOrigin().then(async (origin) => {
      setCurrentPosition(origin);

      let cached = getCachedRoute(origin.lat, origin.lng, mosquePosition.lat, mosquePosition.lng);
      if (!cached && isOnline() === false) {
        cached = getCachedRouteToMosque(mosquePosition.lat, mosquePosition.lng, origin.lat, origin.lng) ?? null;
      }
      if (cached) {
        setRouteCoords(cached.coords);
        setRouteInfo({ distanceKm: cached.distanceKm, durationMin: cached.durationMin, steps: cached.steps });
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

      if (!isOnline()) {
        toast({ title: "Offline — no cached route", description: "Steps still count. Connect to the internet for directions.", variant: "default" });
        return;
      }

      const route = await fetchWalkingRoute(origin.lat, origin.lng, mosquePosition.lat, mosquePosition.lng);
      if (route) {
        setRouteCoords(route.coords);
        setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
        setCachedRoute(origin.lat, origin.lng, mosquePosition.lat, mosquePosition.lng, route);
      } else {
        toast({ title: "Directions unavailable", description: "Showing distance only. Use Open in Maps for turn-by-turn.", variant: "default" });
      }
    }).catch(() => {
      toast({ title: "Set location for directions", description: "Add home or city in Settings, or enable location.", variant: "default" });
    });
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

  // Sync step count from pedometer so UI and directions never miss a callback
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => {
      const counter = stepCounterRef.current;
      if (counter && sensorSource !== "gps") setSensorSteps(counter.getSteps());
    }, 1000);
    return () => clearInterval(interval);
  }, [isWalking, sensorSource]);

  // Quote rotation
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => setCurrentQuoteIdx((i) => (i + 1) % SUNNAH_QUOTES.length), 15000);
    return () => clearInterval(interval);
  }, [isWalking]);

  // Update turn-by-turn: distance-based step detection with hysteresis (GPS) or step-based (no location)
  useEffect(() => {
    if (!routeInfo?.steps?.length) return;

    const steps = routeInfo.steps;
    const safeDist = (d: unknown) => (Number.isFinite(d) ? (d as number) : 0);
    const totalRouteDist = steps.reduce((s, st) => s + safeDist(st.distance), 0);
    const stepBoundaries: number[] = [];
    let acc = 0;
    for (const st of steps) {
      acc += safeDist(st.distance);
      stepBoundaries.push(acc);
    }

    if (currentPosition && routeCoords.length > 0) {
      // Compute cumulative distance along route for each coord
      const distAlongRoute: number[] = [0];
      for (let i = 1; i < routeCoords.length; i++) {
        const seg = haversine(routeCoords[i - 1][0], routeCoords[i - 1][1], routeCoords[i][0], routeCoords[i][1]) * 1000;
        distAlongRoute.push(distAlongRoute[i - 1] + seg);
      }

      // Project position onto route: find closest segment and interpolate
      let minDist = Infinity;
      let closestCoordIdx = 0;
      for (let i = 0; i < routeCoords.length; i++) {
        const d = haversine(currentPosition.lat, currentPosition.lng, routeCoords[i][0], routeCoords[i][1]) * 1000;
        if (d < minDist) {
          minDist = d;
          closestCoordIdx = i;
        }
      }
      setOffRoute(minDist > 60); // 60m threshold — realistic for walking GPS drift

      const distAlongRouteM = distAlongRoute[closestCoordIdx];

      // Map distance to step index
      let rawStepIdx = stepBoundaries.findIndex((b) => b > distAlongRouteM);
      if (rawStepIdx === -1) rawStepIdx = steps.length - 1;
      rawStepIdx = Math.min(rawStepIdx, steps.length - 1);

      // Hysteresis: only advance when clearly past the turn (15 m buffer)
      const HYST_M = 15;
      const prevIdx = prevStepIdxRef.current;
      let stepIdx = prevIdx;
      if (rawStepIdx > prevIdx) {
        const turnPoint = stepBoundaries[prevIdx];
        if (distAlongRouteM >= turnPoint + HYST_M) stepIdx = rawStepIdx;
      } else if (rawStepIdx <= prevIdx) {
        stepIdx = rawStepIdx;
      }
      prevStepIdxRef.current = stepIdx;

      setCurrentDirectionIdx(stepIdx);

      const distToTurn = stepBoundaries[stepIdx] - distAlongRouteM;
      setDistanceToTurnM(Math.max(0, Math.round(distToTurn)));

      const remainingDist = totalRouteDist - distAlongRouteM;
      const rawSpeed = elapsedSeconds > 30 && distanceKm > 0 ? distanceKm / (elapsedSeconds / 3600) : 0;
      const speedKmh = Number.isFinite(rawSpeed) && rawSpeed > 0 ? rawSpeed : (settings.walkingSpeed || 5);
      const remainingMin = speedKmh > 0 ? Math.round((remainingDist / 1000) / speedKmh * 60) : 0;
      setEta(new Date(Date.now() + remainingMin * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      return;
    }

    // No location: advance by step count (pedometer-based)
    prevStepIdxRef.current = 0;
    setDistanceToTurnM(null);
    const strideM = settings.strideLength && settings.strideLength > 0.3 ? settings.strideLength : 0.77;
    const estimatedTotalSteps = Math.round((routeInfo.distanceKm * 1000) / strideM);
    const totalSteps = Math.max(1, estimatedTotalSteps);
    const progress = Math.min(1, displaySteps / totalSteps);
    const stepIdx = Math.min(routeInfo.steps.length - 1, Math.floor(progress * routeInfo.steps.length));
    setCurrentDirectionIdx(stepIdx);
    setOffRoute(false);
  }, [currentPosition, routeInfo, routeCoords.length, elapsedSeconds, distanceKm, displaySteps, settings.walkingSpeed, settings.strideLength]);

  // Voice directions — speak when step changes
  useEffect(() => {
    if (!voiceEnabled || !isWalking || !routeInfo?.steps?.length) return;
    if (currentDirectionIdx === prevDirectionIdx.current) return;
    prevDirectionIdx.current = currentDirectionIdx;

    const step = routeInfo.steps[currentDirectionIdx];
    if (!step || !step.instruction) return;

    const text = formatDirection(step.instruction);
    const distM = step.distance || 0;
    const distText = useImperial
      ? (distM >= 1609 ? `${(distM / 1609).toFixed(1)} miles` : `${Math.round(distM * 3.28084)} feet`)
      : (distM > 1000 ? `${(distM / 1000).toFixed(1)} kilometers` : `${Math.round(distM)} meters`);

    const isLast = currentDirectionIdx === routeInfo.steps.length - 1;
    const speech = isLast
      ? `Arriving at ${effectiveMosqueName}. You have reached your destination.`
      : `In ${distText}, ${text.toLowerCase()}.`;

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
  }, [currentDirectionIdx, voiceEnabled, isWalking, routeInfo, effectiveMosqueName, useImperial]);

  // Voice: "Prepare to turn" when within 50m of next turn
  useEffect(() => {
    if (!voiceEnabled || !isWalking || !routeInfo?.steps?.length) return;
    const step = routeInfo.steps[currentDirectionIdx];
    if (!step || !step.instruction || currentDirectionIdx === routeInfo.steps.length - 1) return;
    const dist = distanceToTurnM ?? step.distance ?? 0;
    if (dist > 50 || dist < 10) return;
    if (prepareAnnouncedForStep.current === currentDirectionIdx) return;
    prepareAnnouncedForStep.current = currentDirectionIdx;

    const text = formatDirection(step.instruction);
    const prepareText = text.toLowerCase().startsWith("turn ") ? `Prepare to ${text.toLowerCase()}` : `Coming up: ${text.toLowerCase()}`;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(prepareText);
      utterance.rate = 1.0;
      utterance.volume = 0.85;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
      if (enVoice) utterance.voice = enVoice;
      window.speechSynthesis.speak(utterance);
    }
  }, [distanceToTurnM, currentDirectionIdx, voiceEnabled, isWalking, routeInfo]);

  // Off-route: voice alert + auto-reroute (skip reroute when offline)
  const lastRerouteRef = useRef(0);
  useEffect(() => {
    if (!offRoute || !isWalking || !currentPosition || !effectiveDestination) return;
    if (!isOnline()) return;

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

    fetchWalkingRoute(currentPosition.lat, currentPosition.lng, effectiveDestination.lat, effectiveDestination.lng).then((route) => {
      if (route) {
        setRouteCoords(route.coords);
        setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
        setCachedRoute(currentPosition.lat, currentPosition.lng, effectiveDestination.lat, effectiveDestination.lng, route);
        setCurrentDirectionIdx(0);
        prevDirectionIdx.current = -1;
        prevStepIdxRef.current = 0;
        setOffRoute(false);
        toast({ title: "Route updated", description: "New directions loaded." });
      }
    }).catch(() => {});
  }, [offRoute, isWalking, currentPosition, effectiveDestination, voiceEnabled]);

  // Device compass heading (DeviceOrientationEvent alpha = degrees clockwise from north)
  useEffect(() => {
    if (!isWalking) { setDeviceHeading(null); return; }
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // `webkitCompassHeading` on iOS, or derive from `alpha` on Android
      const h = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      if (h != null && Number.isFinite(h)) {
        setDeviceHeading(h);
      } else if (e.alpha != null && Number.isFinite(e.alpha)) {
        setDeviceHeading((360 - e.alpha) % 360);
      }
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [isWalking]);

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
    setIsWalking(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setDistanceKm(0);
    distanceRef.current = 0;
    setPositions([]);
    setCompleted(false);
    setSensorSteps(0);

    // Start pedometer first so steps work even without location
    const counter = new StepCounter((steps) => setSensorSteps(steps), (source) => setSensorSource(source));
    stepCounterRef.current = counter;
    try {
      const source = await counter.start();
      toast({
        title: source === "gps" ? "Using GPS estimation" : "Pedometer active! 👣",
        description: source === "gps" ? "Steps from distance when location is on." : `Counting steps with ${source === "accelerometer" ? "accelerometer" : "motion sensors"}.`,
      });
    } catch {
      setSensorSource("gps");
      toast({ title: "Step sensor unavailable", description: "Enable location for distance-based step estimate.", variant: "default" });
    }

    // Location optional: use for live map, distance, and turn-by-turn progress
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: Position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const accuracy = pos.coords.accuracy ?? 999;
          const speed = pos.coords.speed; // m/s, null if unavailable
          const gpsHeading = pos.coords.heading; // degrees, null if unavailable

          // For walking: filter noisy readings >25m accuracy
          if (accuracy > 25) return;

          setCurrentPosition(newPos);
          setLocationSource("gps");

          // Use GPS track heading as compass fallback when moving
          if (gpsHeading != null && Number.isFinite(gpsHeading) && speed != null && speed > 0.4) {
            setDeviceHeading((prev) => {
              // Smooth heading with 30% new value blend to reduce jitter
              if (prev == null) return gpsHeading;
              const diff = ((gpsHeading - prev + 540) % 360) - 180;
              return (prev + diff * 0.3 + 360) % 360;
            });
          }

          setPositions((prev) => {
            if (prev.length > 0) {
              const last = prev[prev.length - 1];
              const segmentDist = haversine(last.lat, last.lng, newPos.lat, newPos.lng);
              // Accept if >3m (real movement) and <120m (not a GPS jump)
              if (segmentDist > 0.003 && segmentDist < 0.12) {
                distanceRef.current += segmentDist;
                setDistanceKm(distanceRef.current);
                return [...prev.slice(-300), newPos]; // cap breadcrumb trail
              }
              // Still update position on map for live dot even if not counting distance
              return [...prev.slice(-300), newPos];
            }
            return [newPos];
          });
        },
        (err) => {
          if (err.code === 1) {
            setLocationSource("city");
          }
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );
      setWatchId(id);
    } else {
      setLocationSource("city");
    }
  }, [toast]);

  const togglePause = () => {
    setIsPaused((p) => {
      const next = !p;
      const counter = stepCounterRef.current;
      if (counter) next ? counter.pause() : counter.resume();
      return next;
    });
  };

  const stopWalk = () => {
    setIsWalking(false);
    setIsPaused(false);
    if (watchId !== null && navigator.geolocation) { navigator.geolocation.clearWatch(watchId); setWatchId(null); }
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

    // In-app notification history + browser notification when enabled
    const walkTitle = `Walk complete! 🎉`;
    const walkBody = `${displaySteps.toLocaleString()} steps · ${hasanat.toLocaleString()} hasanat — ${mosqueName}`;
    addNotification("walk_complete", walkTitle, walkBody, { steps: displaySteps, hasanat });
    if (getNotificationPermission() === "granted" && getNotificationSettings().walkUpdates) {
      sendNotification(walkTitle, walkBody);
    }

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

  const openInMaps = () => setShowMapsSheet(true);

  const openMapApp = (app: "google" | "apple" | "osm" | "waze") => {
    if (!effectiveDestination) return;
    const { lat, lng } = effectiveDestination;
    const originParam = currentPosition ? `${currentPosition.lat},${currentPosition.lng}` : "";
    const destName = encodeURIComponent(effectiveMosqueName);
    let url = "";
    switch (app) {
      case "google":
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking${originParam ? `&origin=${originParam}` : ""}`;
        break;
      case "apple":
        url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w${originParam ? `&saddr=${originParam}` : ""}`;
        break;
      case "osm":
        // OsmAnd deep-link falls back to web OSM directions
        url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${originParam || `${lat},${lng}`};${lat},${lng}`;
        break;
      case "waze":
        url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&zoom=17`;
        break;
    }
    window.open(url, "_blank");
    setShowMapsSheet(false);
  };

  const estimateCalories = (steps: number): number => {
    // Base: ~0.04 kcal per step at reference 70 kg. With advanced metrics + weight, scale by (weight/70)^0.5.
    const baseKcalPerStep = 0.04;
    if (settings.advancedMetricsMode && settings.bodyWeightKg && settings.bodyWeightKg >= 20) {
      const factor = Math.sqrt(settings.bodyWeightKg / 70);
      return Math.round(steps * baseKcalPerStep * factor);
    }
    return Math.round(steps * baseKcalPerStep);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Generate shareable directions text
  const generateDirectionsText = () => {
    if (!routeInfo?.steps?.length) return "";
    const destLabel = effectiveMosqueName;
    const fromLabel = isReturnWalk ? mosqueName : (settings.homeAddress || "Your location");
    const header = `🕌 Directions to ${destLabel}\n📍 From: ${fromLabel}\n📏 ${routeInfo.distanceKm.toFixed(1)} km · ~${routeInfo.durationMin} min walk\n${"─".repeat(30)}\n`;
    const steps = routeInfo.steps.map((s, i) => {
      const distStr = formatDistanceForStep(s.distance ?? 0, useImperial).replace(/^In /, "").toLowerCase();
      return `${i + 1}. ${formatDirection(s.instruction ?? "")} (${distStr})`;
    }).join("\n");
    return `${header}${steps}\n${"─".repeat(30)}\nGenerated by MosqueSteps 🚶‍♂️`;
  };

  const downloadDirections = () => {
    const text = generateDirectionsText();
    if (!text) return;
    const date = new Date().toISOString().slice(0, 10);
    const dest = (effectiveMosqueName || "destination").replace(/\s+/g, "-");
    downloadFile(text, `mosquesteps-directions-${dest}-${date}.txt`, "text/plain;charset=utf-8");
    toast({ title: "Directions saved for offline", description: "Open the file when you lose connection." });
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
            <Link to="/dashboard" className="flex items-center gap-1.5" aria-label="Go back to dashboard">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
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
            <h1 className="text-2xl font-bold text-foreground">{isReturnWalk ? "Ready to walk home?" : "Ready to Walk?"}</h1>
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

            {/* ── Location permission banner ────────────────────────────────── */}
            {locationPermission !== "granted" && (
              <div className="glass-card p-3 text-left border border-gold/30 bg-gold/5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Location is {locationPermission === "denied" ? "blocked" : "not enabled"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Currently using <span className="font-medium text-gold">IP-based location</span> — less accurate. Enable device GPS for precise map tracking and directions.
                    </p>
                    <button
                      onClick={() => setShowLocationDialog(true)}
                      className="mt-2 text-xs font-semibold text-primary underline underline-offset-2 hover:no-underline"
                    >
                      How to enable location →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Location how-to dialog ────────────────────────────────────── */}
            {showLocationDialog && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm px-4 pb-6" onClick={() => setShowLocationDialog(false)}>
                <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground text-base">Enable Location Access</h3>
                    <button onClick={() => setShowLocationDialog(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    MosqueSteps uses your location <span className="font-medium text-foreground">only while walking</span> to show your position on the map and give turn-by-turn directions.
                  </p>
                  {/* iOS instructions */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="text-base">🍎</span> iPhone / Safari
                    </p>
                    <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                      <li>Open <span className="font-medium text-foreground">Settings → Privacy → Location Services</span></li>
                      <li>Find <span className="font-medium text-foreground">Safari Websites</span> → set to <span className="font-medium text-primary">While Using</span></li>
                      <li>Return here and tap <span className="font-medium text-foreground">Start Walking</span></li>
                    </ol>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="text-base">🤖</span> Android / Chrome
                    </p>
                    <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                      <li>Tap the <span className="font-medium text-foreground">lock icon 🔒</span> in the address bar</li>
                      <li>Tap <span className="font-medium text-foreground">Site settings → Location → Allow</span></li>
                      <li>Refresh the page and tap <span className="font-medium text-foreground">Start Walking</span></li>
                    </ol>
                  </div>
                  <Button className="w-full" onClick={() => {
                    setShowLocationDialog(false);
                    // Trigger browser permission prompt
                    navigator.geolocation?.getCurrentPosition(
                      (pos) => {
                        setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setLocationSource("gps");
                        setLocationPermission("granted");
                        toast({ title: "📍 Location enabled!", description: "Your position will be tracked live on the map." });
                      },
                      () => {
                        toast({ title: "Location still blocked", description: "Please follow the steps above in your device settings.", variant: "default" });
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }}>
                    <Locate className="w-4 h-4 mr-2" /> Request Location Now
                  </Button>
                </div>
              </div>
            )}

            {/* ── Weather-aware walking ETA ─────────────────────────────────── */}
            {weather && selectedPrayer && (
              (() => {
                const prayerData = prayerTimes.find((pt) => pt.name === selectedPrayer);
                if (!prayerData) return null;
                const baseWalkMin = routeInfo?.durationMin || estimateWalkingTime(mosqueDist, settings.walkingSpeed);
                const adjustedMin = Math.ceil(baseWalkMin / weather.speedFactor);
                const extraMin = adjustedMin - baseWalkMin;
                const minsLeft = minutesUntilLeave(prayerData.time, adjustedMin, settings.cityTimezone);
                const isUrgent = minsLeft <= 10;
                const isModified = weather.speedFactor < 0.98;
                return (
                  <div className={`glass-card p-3 text-left border ${isUrgent ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{weather.emoji}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">
                          {weather.description} · {Math.round(weather.temperatureC)}°C
                          {weather.windspeedKmh > 15 && <span className="text-muted-foreground"> · {Math.round(weather.windspeedKmh)} km/h wind</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{weather.advice}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2">
                      <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">
                          Weather-adjusted walk: <span className={isUrgent ? "text-destructive" : "text-primary"}>{adjustedMin} min</span>
                          {isModified && <span className="text-muted-foreground font-normal"> (+{extraMin} min)</span>}
                        </p>
                        <p className={`text-[10px] font-medium ${minsLeft <= 0 ? "text-destructive" : minsLeft <= 10 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {minsLeft <= 0 ? "⚠️ Leave now!" : `Leave in ${minsLeft} min for ${selectedPrayer}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Mosque / destination info card */}

            <div className="glass-card p-4 text-left space-y-2">
              {(effectiveDestination || mosquePosition) ? (
                <>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        {isReturnWalk ? <Home className="w-4 h-4 text-primary flex-shrink-0" /> : <MapPin className="w-4 h-4 text-primary flex-shrink-0" />}
                        {effectiveMosqueName}
                      </p>
                      {mosqueAddress && (
                        <p className="text-xs text-muted-foreground ml-5.5 pl-0.5">{mosqueAddress}</p>
                      )}
                      {settings.homeAddress && !isReturnWalk && (
                        <p className="text-[10px] text-muted-foreground/70 ml-5.5 pl-0.5 flex items-center gap-1">
                          🏠 Route from: {settings.homeAddress}
                        </p>
                      )}
                      {isReturnWalk && (
                        <p className="text-[10px] text-muted-foreground/70 ml-5.5 pl-0.5 flex items-center gap-1">
                          🕌 Walking from mosque to {settings.homeAddress || "home"}
                        </p>
                      )}
                    </div>
                    {!isReturnWalk && (
                      <Link to="/mosques" className="text-xs text-primary font-medium hover:underline flex-shrink-0">
                        Change
                      </Link>
                    )}
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
                  {isReturnWalk ? (
                    <>
                      <Home className="w-8 h-8 text-muted-foreground/50 mx-auto" aria-hidden />
                      <p className="text-sm font-medium text-foreground">No home address set</p>
                      <p className="text-xs text-muted-foreground">Set your home in Settings to walk home from the mosque.</p>
                      <Link to="/settings">
                        <Button variant="outline" size="sm" className="mt-1">
                          Open Settings
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-8 h-8 text-muted-foreground/50 mx-auto" aria-hidden />
                      <p className="text-sm font-medium text-foreground">No mosque selected</p>
                      <p className="text-xs text-muted-foreground">Set your mosque to see walking distance, turn-by-turn directions, and leave-by time.</p>
                      <Link to="/mosques">
                        <Button variant="outline" size="sm" className="mt-1">
                          <MapPin className="w-3 h-3 mr-1" aria-hidden /> Find Mosque
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Map preview */}
            {showMap && (currentPosition || effectiveDestination || mosquePosition) && (
              <WalkMap
                userPosition={currentPosition}
                mosquePosition={(effectiveDestination ?? mosquePosition) ?? undefined}
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
                    <Navigation className="w-3 h-3" /> Walking route ({routeInfo.steps.length} steps)
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={downloadDirections}
                      className={`rounded hover:bg-muted transition-opacity ${offline ? "p-1 text-primary opacity-100" : "p-0.5 text-muted-foreground/40 hover:text-muted-foreground/70"}`}
                      title={offline ? "Save directions for offline" : "Download for offline — save before you lose connection"}
                      aria-label="Download directions for offline"
                    >
                      <Download className={offline ? "w-3 h-3" : "w-2.5 h-2.5"} />
                    </button>
                    <button
                      onClick={() => {
                        const text = generateDirectionsText();
                        try { navigator.clipboard.writeText(text); } catch { /* fallback: no clipboard */ }
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
                          navigator.share({ title: `Directions to ${effectiveMosqueName}`, text }).catch(() => {});
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
                {offline && (
                  <p className="text-[10px] text-primary mb-2 flex items-center gap-1.5">
                    <WifiOff className="w-3 h-3 shrink-0" /> No connection — tap the download icon above to save directions for offline use.
                  </p>
                )}
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
                          <span className="text-muted-foreground/80 text-[11px]">
                            {formatDistanceForStep(s.distance, useImperial)}
                          </span>
                          <span className="text-foreground font-medium ml-1">
                            {formatDirection(s.instruction)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {autoDetecting && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Finding nearest mosque...
              </div>
            )}
            <Button
              variant="hero"
              size="lg"
              className="w-full text-base"
              onClick={startWalk}
            >
              <Play className="w-5 h-5 mr-2" /> {isReturnWalk ? "Start Walking Home" : "Start Walking"}
            </Button>
            {!hasMosqueDestinationEffective && !autoDetecting && (
              <p className="text-xs text-muted-foreground text-center">
                {isReturnWalk ? "Set your home address in Settings to walk home from the mosque." : "No mosque selected — walking in free mode. Select a mosque for directions."}
              </p>
            )}
            {(effectiveDestination || mosquePosition) && (
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={openInMaps} title="Open route in your maps app">
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden /> Open in Maps
              </Button>
            )}
          </motion.div>
        )}

        {/* Active walk screen */}
        {isWalking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 w-full max-w-sm">
            {/* Walking header with toggles */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 flex-wrap">
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-gold text-foreground text-xs font-semibold">
                  {isReturnWalk ? "Walking Home" : `Walking to ${selectedPrayer}`}
                </div>
                {isPaused && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wide">
                    Paused
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-lg transition-colors touch-manipulation ${voiceEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  title={voiceEnabled ? "Voice directions on" : "Voice directions off"}
                  aria-label={voiceEnabled ? "Turn off voice directions" : "Turn on voice directions"}
                  aria-pressed={voiceEnabled}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowDirections(!showDirections)}
                  className={`p-2 rounded-lg transition-colors touch-manipulation ${showDirections ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  title={showDirections ? "Directions visible" : "Directions hidden"}
                  aria-label={showDirections ? "Hide turn-by-turn directions" : "Show turn-by-turn directions"}
                  aria-pressed={showDirections}
                >
                  <Route className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`p-2 rounded-lg transition-colors touch-manipulation ${showMap ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  title={showMap ? "Map visible" : "Map hidden"}
                  aria-label={showMap ? "Hide map" : "Show map"}
                  aria-pressed={showMap}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Encourage location when off — steps still work */}
            {isWalking && !currentPosition && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-3 bg-primary/10 border border-primary/20 text-left" role="status" aria-live="polite">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">Steps are counting</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Enable location for live map, distance and turn-by-turn progress.</p>
                </div>
              </div>
            )}

            {/* DIRECTIONS ON TOP - Turn-by-turn navigation panel */}
            {showDirections && routeInfo && routeInfo.steps.length > 0 && (
              <div
                className="glass-card p-0 overflow-hidden text-left w-full rounded-xl relative"
                role="region"
                aria-label="Walking directions"
              >
                {/* Download for offline */}
                <button
                  onClick={downloadDirections}
                  className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg transition-opacity ${
                    offline
                      ? "text-primary-foreground/90 bg-primary-foreground/20 hover:bg-primary-foreground/30"
                      : "text-primary-foreground/40 hover:text-primary-foreground/70 hover:bg-primary-foreground/10"
                  }`}
                  title={offline ? "Save directions for offline" : "Download directions for offline use"}
                  aria-label="Download directions for offline"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {/* Current direction — large hero card */}
                {currentDirection && (
                  <div
                    className="bg-gradient-teal p-4 shadow-sm"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={`Step ${currentDirectionIdx + 1} of ${routeInfo.steps.length}. ${formatDistanceForStep(distanceToTurnM ?? currentDirection.distance, useImperial)}. ${formatDirection(currentDirection.instruction)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary-foreground/10" aria-hidden>
                        {getDirectionIcon(currentDirection.instruction)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-primary-foreground/90 uppercase tracking-wider">
                          {formatDistanceForStep(distanceToTurnM ?? currentDirection.distance, useImperial)}
                        </p>
                        <p className="text-lg font-bold text-primary-foreground leading-snug mt-1">
                          {formatDirection(currentDirection.instruction)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 tabular-nums">
                        <p className="text-[10px] text-primary-foreground/60 uppercase tracking-wide">Step</p>
                        <p className="text-xl font-bold text-primary-foreground">{currentDirectionIdx + 1}<span className="text-sm font-normal text-primary-foreground/50">/{routeInfo.steps.length}</span></p>
                      </div>
                    </div>

                    {/* Remaining distance, time, progress */}
                    {(() => {
                      const safeD = (x: unknown) => (Number.isFinite(x) ? (x as number) : 0);
                      const remainingDist = routeInfo.steps.slice(currentDirectionIdx).reduce((sum, s) => sum + safeD(s.distance), 0);
                      const remainingMin = Math.max(0, Math.round((remainingDist / 1000) / (settings.walkingSpeed || 5) * 60));
                      const totalSteps = Math.max(1, routeInfo.steps.length);
                      const pctDone = routeInfo.steps.length <= 1 ? (currentDirectionIdx >= routeInfo.steps.length - 1 ? 100 : 0) : Math.round((currentDirectionIdx / (totalSteps - 1)) * 100);
                      return (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-primary-foreground/15 text-xs text-primary-foreground/70">
                          <span className="font-medium">{remainingDist > 1000 ? `${(remainingDist / 1000).toFixed(1)} km` : `${Math.round(remainingDist)} m`} left</span>
                          <span>~{remainingMin} min</span>
                          <span className="ml-auto font-medium">{pctDone}% done</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Segmented progress bar */}
                <div className="px-3 pt-2.5 pb-1">
                  <div className="flex gap-0.5" role="progressbar" aria-valuenow={currentDirectionIdx + 1} aria-valuemin={1} aria-valuemax={routeInfo.steps.length} aria-label="Route progress">
                    {routeInfo.steps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                          i < currentDirectionIdx
                            ? "bg-primary/80"
                            : i === currentDirectionIdx
                              ? "bg-gold shadow-sm"
                              : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Upcoming directions — tappable for detailed preview */}
                {routeInfo.steps.length > currentDirectionIdx + 1 && (
                  <div className="px-3 pb-3 pt-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Coming up</p>
                    <div className="space-y-1.5">
                      {routeInfo.steps.slice(currentDirectionIdx + 1, currentDirectionIdx + 4).map((s, i) => {
                        const actualIdx = currentDirectionIdx + 1 + i;
                        const isNext = i === 0;
                        const stepDistLabel = formatDistanceForStep(s.distance, useImperial);
                        const safeD = (x: unknown) => (Number.isFinite(x) ? (x as number) : 0);
                        const remainingAfter = routeInfo.steps.slice(actualIdx).reduce((sum, st) => sum + safeD(st.distance), 0);
                        const remainingMin = Math.max(0, Math.round((remainingAfter / 1000) / (settings.walkingSpeed || 5) * 60));
                        return (
                          <button
                            key={actualIdx}
                            onClick={() => {
                              toast({
                                title: `Step ${actualIdx + 1}: ${formatDirection(s.instruction)}`,
                                description: `${stepDistLabel} · ${remainingAfter > 1000 ? `${(remainingAfter / 1000).toFixed(1)} km` : `${Math.round(remainingAfter)} m`} remaining · ~${remainingMin} min left`,
                              });
                            }}
                            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors text-left ${
                              isNext ? "bg-primary/5 border border-primary/10" : "bg-muted/50 hover:bg-muted"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isNext ? "bg-primary/15" : "bg-muted"
                            }`} aria-hidden>
                              {getDirectionIcon(s.instruction, true)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm truncate block ${isNext ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                                {formatDirection(s.instruction)}
                              </span>
                              <span className="text-[10px] text-muted-foreground/70">{stepDistLabel} · ~{remainingMin}m left</span>
                            </div>
                            <ChevronDown className="w-3 h-3 text-muted-foreground/40 -rotate-90 flex-shrink-0" />
                          </button>
                        );
                      })}
                      {routeInfo.steps.length > currentDirectionIdx + 4 && (
                        <p className="text-[10px] text-muted-foreground/50 text-center pt-1">
                          +{routeInfo.steps.length - currentDirectionIdx - 4} more steps
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Final step — arrival indicator */}
                {currentDirectionIdx === routeInfo.steps.length - 1 && (
                  <div className="px-3 pb-3 pt-2">
                    <div className="flex items-center gap-3 bg-gold/15 rounded-lg px-4 py-3 border border-gold/20">
                      <MapPin className="w-5 h-5 text-gold flex-shrink-0" />
                      <span className="text-sm font-semibold text-foreground">Arriving at {mosqueName}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Off-route banner */}
            {offRoute && isWalking && (
              <div className="glass-card px-3 py-2 flex items-center gap-2 text-left border border-amber-500/30 bg-amber-500/5" role="status" aria-live="polite">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-xs font-medium text-foreground">
                  {offline ? "Off route — reconnect to recalculate" : "Off route — recalculating…"}
                </span>
              </div>
            )}

            {/* Offline banner */}
            {offline && isWalking && routeInfo && routeInfo.steps.length > 0 && (
              <div className="glass-card px-3 py-2 flex items-center gap-2 text-left border border-primary/30 bg-primary/5" role="status" aria-live="polite">
                <WifiOff className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-medium text-foreground flex-1">Offline — using cached directions. Steps advancing your progress.</span>
                <button
                  onClick={downloadDirections}
                  className="flex items-center gap-1 text-[10px] text-primary font-medium hover:underline shrink-0"
                  title="Save directions to device for offline"
                >
                  <Download className="w-3 h-3" /> Save
                </button>
              </div>
            )}

            {/* No route fallback */}
            {(!routeInfo || routeInfo.steps.length === 0) && isWalking && mosquePosition && (
              <div className="glass-card p-3 flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {offline ? <WifiOff className="w-5 h-5 text-primary" /> : <Navigation className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  {currentPosition ? (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        {(haversine(currentPosition.lat, currentPosition.lng, mosquePosition.lat, mosquePosition.lng) * 1000).toFixed(0)} m to mosque
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {offline ? "Offline — no cached route. Steps still count." : `Head towards ${mosqueName}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">Steps advancing your walk</p>
                      <p className="text-[10px] text-muted-foreground">
                        {offline ? "Offline — no cached route." : "Enable location for distance and map."}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* MAP with recenter button */}
            {showMap && (
              <div className="relative">
                <WalkMap
                  userPosition={currentPosition}
                  mosquePosition={(effectiveDestination ?? mosquePosition) ?? undefined}
                  walkPath={positions}
                  routeCoords={routeCoords}
                  routeSteps={routeInfo?.steps}
                  currentStepIdx={currentDirectionIdx}
                  isWalking={true}
                  offRoute={offRoute}
                  eta={eta}
                  deviceHeading={deviceHeading}
                  directionOverlay={currentDirection ? {
                    distance: formatDistanceForStep(distanceToTurnM ?? currentDirection.distance, useImperial),
                    instruction: formatDirection(currentDirection.instruction),
                  } : undefined}
                  onRecenter={() => {
                    if (currentPosition) setCurrentPosition({ ...currentPosition });
                  }}
                  className="shadow-md"
                />
                {/* Reset map to current location button */}
                {currentPosition && (
                  <button
                    onClick={() => {
                      if (currentPosition) setCurrentPosition({ ...currentPosition });
                    }}
                    className="absolute bottom-3 left-3 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg hover:bg-card transition-colors"
                    title="Center map on current location"
                    aria-label="Center map on current location"
                  >
                    <Locate className="w-4 h-4 text-primary" />
                  </button>
                )}
              </div>
            )}

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
                  const safeD = (x: unknown) => (Number.isFinite(x) ? (x as number) : 0);
                  const remainingDist = routeInfo?.steps
                    ? routeInfo.steps.slice(currentDirectionIdx).reduce((sum, s) => sum + safeD(s.distance), 0) / 1000
                    : mosqueDist - distanceKm;
                  const rawSpd = elapsedSeconds > 30 && distanceKm > 0 ? distanceKm / (elapsedSeconds / 3600) : 0;
                  const currentSpeed = Number.isFinite(rawSpd) && rawSpd > 0 ? rawSpd : (settings.walkingSpeed || 5);
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



            {/* Step counter pill + stats row — compact layout */}
            <div className="flex items-center justify-between gap-2 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-sm" role="status" aria-live="polite" aria-label={`${displaySteps.toLocaleString()} steps`}>
              <div className="flex items-center gap-2">
                <Footprints className={`w-4 h-4 text-gold ${!isPaused ? "animate-step-bounce" : ""}`} />
                <span className="text-lg font-bold text-foreground tabular-nums">{displaySteps.toLocaleString()}</span>
                <span className="text-[9px] text-muted-foreground/60">{useRealSteps ? "sensor" : "est."}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-gold rounded-full transition-all duration-500" style={{ width: `${Math.min(100, progressPercent * 100)}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{Math.round(progressPercent * 100)}%</span>
              </div>
            </div>

            {/* Live stats — inline row under map area */}
            <div className="flex items-center justify-around bg-muted/50 rounded-xl px-3 py-2.5" role="status" aria-live="polite">
              <div className="text-center">
                <p className="text-sm font-bold text-foreground tabular-nums">{(distanceKm * 1000).toFixed(0)}<span className="text-[10px] text-muted-foreground font-normal ml-0.5">m</span></p>
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="text-center">
                <p className="text-sm font-bold text-foreground tabular-nums">{formatTime(elapsedSeconds)}</p>
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="text-center">
                <p className="text-sm font-bold text-gradient-gold tabular-nums">{hasanat.toLocaleString()}<span className="text-[10px] text-muted-foreground font-normal ml-0.5">✦</span></p>
              </div>
              <div className="w-px h-5 bg-border" />
              <div className="text-center">
                <p className="text-sm font-bold text-foreground tabular-nums">
                  {elapsedSeconds > 30 ? (distanceKm / (elapsedSeconds / 3600)).toFixed(1) : "—"}<span className="text-[10px] text-muted-foreground font-normal ml-0.5">km/h</span>
                </p>
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

            {/* Zero steps explanation & override */}
            {displaySteps === 0 && elapsedSeconds > 60 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="glass-card p-4 space-y-3 text-left border border-amber-500/20"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">0 steps recorded</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This can happen when: your device doesn't support motion sensors, the browser blocked sensor access, or your phone was in a bag/pocket at an unusual angle.
                    </p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">Override with estimated steps?</p>
                  <p className="text-[10px] text-muted-foreground">
                    Based on your {formatTime(elapsedSeconds)} walk{distanceKm > 0 ? ` covering ${(distanceKm * 1000).toFixed(0)}m` : ""} at ~{settings.walkingSpeed} km/h pace:
                  </p>
                  {(() => {
                    const estDistKm = distanceKm > 0.01 ? distanceKm : (settings.walkingSpeed * (elapsedSeconds / 3600));
                    const estSteps = estimateSteps(estDistKm);
                    const estHasanat = calculateHasanat(estSteps);
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSensorSteps(estSteps);
                          // Update the saved walk entry
                          const history = JSON.parse(localStorage.getItem("mosquesteps_history") || "[]");
                          if (history.length > 0) {
                            history[0].steps = estSteps;
                            history[0].hasanat = estHasanat;
                            history[0].distanceKm = Math.max(history[0].distanceKm, estDistKm);
                            localStorage.setItem("mosquesteps_history", JSON.stringify(history));
                          }
                          toast({ title: `Steps updated to ${estSteps.toLocaleString()}`, description: `${estHasanat.toLocaleString()} hasanat earned.` });
                        }}
                      >
                        Use estimated: {estSteps.toLocaleString()} steps ({estHasanat.toLocaleString()} hasanat)
                      </Button>
                    );
                  })()}
                </div>
              </motion.div>
            )}


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

            {/* Newly earned badges — prominent celebration */}
            {newBadges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.75, type: "spring", stiffness: 200 }}
                className="rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-gold/15 to-gold/5 p-5 space-y-4"
              >
                <div className="flex items-center gap-2 justify-center">
                  <motion.span
                    animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="text-2xl"
                  >
                    🏆
                  </motion.span>
                  <p className="text-base font-black text-foreground">
                    {newBadges.length > 1 ? `${newBadges.length} New Badges Unlocked!` : "New Badge Unlocked!"}
                  </p>
                </div>
                <div className="space-y-3">
                  {newBadges.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.85 + i * 0.1, type: "spring" }}
                      className="flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-xl px-4 py-3 ring-1 ring-gold/20"
                    >
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.9 + i * 0.1, type: "spring", stiffness: 300, damping: 12 }}
                        className="text-4xl flex-shrink-0"
                      >
                        {badge.icon}
                      </motion.span>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-foreground text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                      </div>
                      <span className="text-[10px] text-gold font-bold bg-gold/10 rounded-full px-2 py-0.5">NEW</span>
                    </motion.div>
                  ))}
                </div>
                <Link to="/rewards" className="block text-center text-xs text-primary font-semibold hover:underline mt-1">
                  View all your badges →
                </Link>
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
                            let cached = getCachedRoute(mosquePosition.lat, mosquePosition.lng, start.lat, start.lng);
                            if (!cached && !isOnline()) {
                              cached = getCachedRouteToMosque(start.lat, start.lng, mosquePosition.lat, mosquePosition.lng) ?? null;
                            }
                            if (cached) {
                              setReturnRouteCoords(cached.coords);
                              setReturnRouteInfo({ distanceKm: cached.distanceKm, durationMin: cached.durationMin, steps: cached.steps });
                            } else if (isOnline()) {
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
                      <Navigation className="w-3 h-3" /> Route back {returnDestOverride ? `to ${returnDestOverride.name}` : "home"}
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
                    {returnDestOverride && (
                      <button
                        type="button"
                        onClick={async () => {
                          setReturnDestOverride(null);
                          setReturnDestSearch("");
                          setShowReturnDestSearch(false);
                          if (mosquePosition && settings.homeLat != null && settings.homeLng != null) {
                            setReturnRouteLoading(true);
                            try {
                              const route = await fetchWalkingRoute(mosquePosition.lat, mosquePosition.lng, settings.homeLat, settings.homeLng);
                              if (route) {
                                setReturnRouteCoords(route.coords);
                                setReturnRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
                              }
                            } finally {
                              setReturnRouteLoading(false);
                            }
                          }
                        }}
                        className="text-[10px] text-primary hover:underline mt-1"
                      >
                        Use home instead
                      </button>
                    )}
                  </div>
                )}

                {/* Different destination? — address override */}
                <div className="glass-card p-3 space-y-2">
                  {!showReturnDestSearch ? (
                    <button
                      type="button"
                      onClick={() => setShowReturnDestSearch(true)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" /> Different destination?
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Walk to a different address</p>
                      <input
                        type="text"
                        value={returnDestSearch}
                        onChange={(e) => setReturnDestSearch(e.target.value)}
                        placeholder="Search address..."
                        className="w-full px-3 py-2 text-sm rounded-lg bg-muted border border-input"
                        autoFocus
                      />
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {returnDestSuggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setReturnDestOverride({ lat: s.lat, lng: s.lng, name: s.displayName });
                              setShowReturnDestSearch(false);
                              setReturnDestSearch("");
                              setReturnDestSuggestions([]);
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted"
                          >
                            {s.displayName}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowReturnDestSearch(false); setReturnDestSearch(""); setReturnDestSuggestions([]); }}
                        className="text-[10px] text-muted-foreground hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Start Walk Home */}
                {returnRouteInfo && mosquePosition && (
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      const dest = returnDestOverride ?? (settings.homeLat != null && settings.homeLng != null ? { lat: settings.homeLat, lng: settings.homeLng } : null);
                      if (!dest) return;
                      const params = new URLSearchParams({
                        returnWalk: "1",
                        fromLat: String(mosquePosition.lat),
                        fromLng: String(mosquePosition.lng),
                        toLat: String(dest.lat),
                        toLng: String(dest.lng),
                      });
                      navigate(`/walk?${params}`);
                    }}
                  >
                    <Home className="w-5 h-5 mr-2" /> Start Walk Home{returnDestOverride ? ` to ${returnDestOverride.name.split(",")[0]}` : ""}
                  </Button>
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
                      className="w-full min-w-0"
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
                      title={mosqueName}
                    >
                      <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />
                      <span className="truncate">Check In at {mosqueName}</span>
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

      {/* ── Map picker bottom sheet ───────────────────────────────────────── */}
      {showMapsSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowMapsSheet(false)}
        >
          <div
            className="bg-card border border-border rounded-t-2xl w-full max-w-md p-5 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" /> Open in Maps
              </h3>
              <button onClick={() => setShowMapsSheet(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {effectiveMosqueName && (
              <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 shrink-0 text-primary" />
                Walking directions to <span className="font-medium text-foreground">{effectiveMosqueName}</span>
              </p>
            )}

            <div className="space-y-2">
              {/* Google Maps */}
              <button
                onClick={() => openMapApp("google")}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted border border-border hover:border-primary/30 transition-all text-left"
              >
                <span className="text-2xl w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border shadow-sm">🗺️</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">Google Maps</p>
                  <p className="text-xs text-muted-foreground">Walking directions · works on all devices</p>
                </div>
              </button>

              {/* Apple Maps — iOS only */}
              <button
                onClick={() => openMapApp("apple")}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted border border-border hover:border-primary/30 transition-all text-left"
              >
                <span className="text-2xl w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border shadow-sm">🍎</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">Apple Maps</p>
                  <p className="text-xs text-muted-foreground">Best on iPhone &amp; iPad</p>
                </div>
              </button>

              {/* OpenStreetMap */}
              <button
                onClick={() => openMapApp("osm")}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted border border-border hover:border-primary/30 transition-all text-left"
              >
                <span className="text-2xl w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border shadow-sm">🌍</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">OpenStreetMap</p>
                  <p className="text-xs text-muted-foreground">Open-source · no account needed</p>
                </div>
              </button>

              {/* Waze */}
              <button
                onClick={() => openMapApp("waze")}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted border border-border hover:border-primary/30 transition-all text-left"
              >
                <span className="text-2xl w-9 h-9 flex items-center justify-center bg-card rounded-lg border border-border shadow-sm">🚗</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">Waze</p>
                  <p className="text-xs text-muted-foreground">Community maps · live traffic</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveWalk;
