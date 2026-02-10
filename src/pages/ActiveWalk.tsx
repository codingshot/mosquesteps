import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Square, MapPin, Footprints, Clock, Star, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { estimateSteps, estimateWalkingTime, calculateHasanat } from "@/lib/prayer-times";
import { addWalkEntry, getSettings } from "@/lib/walking-history";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface Position {
  lat: number;
  lng: number;
}

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
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  const steps = estimateSteps(distanceKm);
  const hasanat = calculateHasanat(steps);

  // Elapsed timer
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWalking]);

  // Rotate quotes
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => {
      setCurrentQuoteIdx((i) => (i + 1) % SUNNAH_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isWalking]);

  const startWalk = () => {
    if (!navigator.geolocation) {
      toast({ title: "Location not available", description: "Please enable location services.", variant: "destructive" });
      return;
    }

    setIsWalking(true);
    setStartTime(new Date());
    setElapsedSeconds(0);
    setDistanceKm(0);
    setPositions([]);
    setCompleted(false);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: Position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPositions((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const segmentDist = haversine(last.lat, last.lng, newPos.lat, newPos.lng);
            // Only add if moved more than 5 meters (filter noise)
            if (segmentDist > 0.005) {
              setDistanceKm((d) => d + segmentDist);
              return [...prev, newPos];
            }
            return prev;
          }
          return [newPos];
        });
      },
      (err) => {
        console.error("GPS error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setWatchId(id);
  };

  const stopWalk = () => {
    setIsWalking(false);
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setCompleted(true);

    // Save walk
    const walkTimeMin = Math.round(elapsedSeconds / 60);
    addWalkEntry({
      date: new Date().toISOString(),
      mosqueName: settings.selectedMosqueName,
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      steps,
      walkingTimeMin: walkTimeMin,
      hasanat,
      prayer: "Unknown",
    });

    toast({
      title: "Walk completed! 🎉",
      description: `${steps} steps · ${hasanat} hasanat earned. May Allah accept your efforts.`,
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const quote = SUNNAH_QUOTES[currentQuoteIdx];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className={`${isWalking ? "bg-gradient-teal" : "bg-card border-b border-border"}`}>
        <div className="container py-4 flex items-center justify-between">
          <Link to="/dashboard" className={`flex items-center gap-2 ${isWalking ? "text-primary-foreground" : "text-foreground"}`}>
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold">Active Walk</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center container py-8">
        {!isWalking && !completed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6 max-w-sm">
            <div className="w-24 h-24 rounded-full bg-gradient-teal flex items-center justify-center mx-auto">
              <Footprints className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Ready to Walk?</h1>
            <p className="text-muted-foreground">
              Tap start when you begin walking to the mosque. We'll track your distance using GPS
              and estimate your steps and rewards.
            </p>
            <div className="glass-card p-4 text-left text-sm space-y-1 text-muted-foreground">
              <p><MapPin className="w-4 h-4 inline mr-1 text-primary" /> Mosque: {settings.selectedMosqueName}</p>
              <p><Navigation className="w-4 h-4 inline mr-1 text-primary" /> Est. distance: {settings.selectedMosqueDistance} km</p>
              <p><Clock className="w-4 h-4 inline mr-1 text-primary" /> Est. time: {estimateWalkingTime(settings.selectedMosqueDistance, settings.walkingSpeed)} min</p>
            </div>
            <Button variant="hero" size="lg" className="w-full text-base" onClick={startWalk}>
              <Play className="w-5 h-5 mr-2" /> Start Walking
            </Button>
          </motion.div>
        )}

        {isWalking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 w-full max-w-sm">
            {/* Live stats */}
            <div className="relative w-48 h-48 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#activeGold)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${Math.min(1, distanceKm / (settings.selectedMosqueDistance || 1)) * 52 * 2 * Math.PI} ${52 * 2 * Math.PI}`}
                />
                <defs>
                  <linearGradient id="activeGold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(39, 95%, 55%)" />
                    <stop offset="100%" stopColor="hsl(39, 95%, 40%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{steps.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">steps</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card p-3 text-center">
                <p className="text-lg font-bold text-foreground">{(distanceKm * 1000).toFixed(0)}m</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-lg font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
                <p className="text-xs text-muted-foreground">Time</p>
              </div>
              <div className="glass-card p-3 text-center">
                <p className="text-lg font-bold text-gradient-gold">{hasanat.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Hasanat</p>
              </div>
            </div>

            {/* Sunnah quote */}
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

            <Button variant="destructive" size="lg" className="w-full text-base" onClick={stopWalk}>
              <Square className="w-5 h-5 mr-2" /> End Walk
            </Button>
          </motion.div>
        )}

        {completed && !isWalking && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-sm">
            <div className="w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center mx-auto animate-pulse-glow">
              <Star className="w-12 h-12 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Walk Complete! 🎉</h1>
            <p className="text-muted-foreground">May Allah accept your efforts and multiply your rewards.</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 text-center">
                <Footprints className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{steps.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Steps</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Star className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-xl font-bold text-gradient-gold">{hasanat.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Hasanat</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Navigation className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{(distanceKm).toFixed(2)} km</p>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{formatTime(elapsedSeconds)}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="hero" className="flex-1" onClick={() => { setCompleted(false); }}>
                <Play className="w-4 h-4 mr-1" /> New Walk
              </Button>
              <Link to="/dashboard" className="flex-1">
                <Button variant="hero-outline" className="w-full">Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ActiveWalk;
