import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, Footprints, Star, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchPrayerTimes,
  calculateLeaveByTime,
  estimateSteps,
  estimateWalkingTime,
  calculateHasanat,
  type PrayerTime,
} from "@/lib/prayer-times";
import logo from "@/assets/logo.png";

const Dashboard = () => {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [hijriDate, setHijriDate] = useState("");
  const [readableDate, setReadableDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mosqueDistance, setMosqueDistance] = useState(0.8); // default km
  const [walkingSpeed, setWalkingSpeed] = useState(5); // km/h

  const steps = estimateSteps(mosqueDistance * 2); // to and from
  const walkMin = estimateWalkingTime(mosqueDistance, walkingSpeed);
  const hasanat = calculateHasanat(steps);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          loadPrayers(loc.lat, loc.lng);
        },
        () => {
          // Default to Mecca coordinates
          loadPrayers(21.4225, 39.8262);
        }
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
          <Link to="/mosques">
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
              <MapPin className="w-4 h-4 mr-1" /> Find Mosques
            </Button>
          </Link>
        </div>

        <div className="container pb-8">
          <p className="text-sm text-primary-foreground/70 mb-1">
            {readableDate} · {hijriDate}
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
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-primary-foreground/20"
                />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="url(#goldGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${52 * 2 * Math.PI * 0.65} ${52 * 2 * Math.PI}`}
                />
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
        {/* Distance setting */}
        <div className="glass-card p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Distance to mosque: {mosqueDistance} km
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={mosqueDistance}
            onChange={(e) => setMosqueDistance(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use the <Link to="/mosques" className="text-primary underline">mosque finder</Link> to calculate exact distance
          </p>
        </div>

        {/* Prayer times */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Prayer Times
          </h2>
          {loading ? (
            <div className="glass-card p-6 text-center text-muted-foreground">Loading prayer times...</div>
          ) : (
            <div className="space-y-2">
              {prayers.map((p) => {
                const isNext = nextPrayer?.name === p.name;
                const leaveBy = calculateLeaveByTime(p.time, walkMin);
                return (
                  <div
                    key={p.name}
                    className={`glass-card p-4 flex items-center justify-between ${
                      isNext ? "ring-2 ring-gold shadow-gold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-xs font-arabic text-muted-foreground">{p.arabicName}</p>
                      </div>
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

        {/* Hadith reminder */}
        <div className="bg-gradient-teal rounded-xl p-5 text-primary-foreground">
          <p className="text-sm italic leading-relaxed">
            "When one of you performs ablution well and goes out to the mosque, with no motive
            other than prayer, he does not take a step without being raised a degree and having
            one of his sins removed."
          </p>
          <a
            href="https://sunnah.com/muslim:666"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold mt-2 inline-block hover:underline"
          >
            — Sahih Muslim 666
          </a>
        </div>

        {/* Rewards explanation */}
        <Link to="/rewards">
          <div className="glass-card p-4 flex items-center justify-between hover:shadow-teal transition-shadow cursor-pointer">
            <div>
              <p className="font-semibold text-foreground">View Spiritual Rewards</p>
              <p className="text-sm text-muted-foreground">See your estimated hasanat breakdown</p>
            </div>
            <Star className="w-6 h-6 text-gold" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
