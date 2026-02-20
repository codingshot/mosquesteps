import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Bell, Locate, ChevronRight, Check, Home, Moon, Search, Star } from "lucide-react";
import { saveSettings, getSettings, fetchTimezone, type UserSettings } from "@/lib/walking-history";
import { fetchLocationSuggestions, type LocationSuggestion } from "@/lib/geocode";
import { getIPGeolocation } from "@/lib/prayer-times";
import { searchNearbyMosques, type MosqueResult } from "@/lib/mosque-search";
import { requestNotificationPermission, isNotificationSupported } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const ONBOARDING_KEY = "mosquesteps_onboarded";
const ONBOARDING_DATE_KEY = "mosquesteps_onboarded_date";

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, "true");
  if (!localStorage.getItem(ONBOARDING_DATE_KEY)) {
    localStorage.setItem(ONBOARDING_DATE_KEY, new Date().toISOString());
  }
}

export function getOnboardingDate(): Date {
  const stored = localStorage.getItem(ONBOARDING_DATE_KEY);
  if (stored) return new Date(stored);
  // Fallback: if no onboarding date but user is onboarded, use earliest walk or now
  return new Date();
}

const ALL_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

const OPTIONAL_PRAYERS = [
  {
    id: "Taraweeh",
    label: "Taraweeh",
    arabic: "تراويح",
    icon: "🌙",
    description: "Night prayers during Ramadan — special reward for congregation",
    hadith: "Whoever prays Taraweeh with the imam until he finishes, Allah will record for him as if he prayed the whole night. — Tirmidhi 806",
    ramadanOnly: true,
  },
  {
    id: "Tahajjud",
    label: "Tahajjud",
    arabic: "تهجد",
    icon: "⭐",
    description: "Late-night voluntary prayer — one of the most beloved acts",
    hadith: "The best prayer after the obligatory is the night prayer. — Sahih Muslim 1163",
    ramadanOnly: false,
  },
  {
    id: "Witr",
    label: "Witr",
    arabic: "وتر",
    icon: "🤲",
    description: "Concluding night prayer — highly recommended sunnah",
    hadith: "Allah is Witr (one) and loves Witr, so pray Witr. — Abu Dawud 1416",
    ramadanOnly: false,
  },
  {
    id: "Qiyam",
    label: "Qiyam al-Layl",
    arabic: "قيام الليل",
    icon: "✨",
    description: "Standing in prayer at night — particularly in last 10 nights",
    hadith: "Whoever stands in prayer during Laylat al-Qadr with faith and hoping for reward will have his previous sins forgiven. — Bukhari 1901",
    ramadanOnly: false,
  },
  {
    id: "Jumuah",
    label: "Jumuah (Friday)",
    arabic: "الجمعة",
    icon: "🕋",
    description: "Friday congregational prayer — obligatory for men",
    hadith: "The best day on which the sun rises is Friday. — Sahih Muslim 854",
    ramadanOnly: false,
  },
] as const;

const steps = [
  { id: "welcome", title: "Welcome to MosqueSteps", icon: "🕌" },
  { id: "location", title: "Set Your Location", icon: "📍" },
  { id: "prayers", title: "Your Prayers", icon: "🕌" },
  { id: "mosque", title: "Your Mosque", icon: "🕌" },
  { id: "notifications", title: "Prayer Reminders", icon: "🔔" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [settings, setSettingsState] = useState(getSettings());
  const [citySearch, setCitySearch] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<LocationSuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const citySearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedPrayers, setSelectedPrayers] = useState<string[]>(
    settings.prayerPreferences || ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
  );
  const [selectedOptionalPrayers, setSelectedOptionalPrayers] = useState<string[]>([]);
  const [ramadanMode, setRamadanMode] = useState(false);
  const [homeSearch, setHomeSearch] = useState("");

  // --- OnboardingMosqueStep extracted inline to avoid build errors ---
  const OnboardingMosqueStep = ({ settings: s, setSettingsState: setSS, toast: t, next: n, skip: sk }: {
    settings: UserSettings;
    setSettingsState: React.Dispatch<React.SetStateAction<UserSettings>>;
    toast: typeof toast;
    next: () => void;
    skip: () => void;
  }) => {
    const [mosqueTypeAhead, setMosqueTypeAhead] = useState("");
    const [nearbyMosques, setNearbyMosques] = useState<MosqueResult[]>([]);
    const [filteredMosques, setFilteredMosques] = useState<MosqueResult[]>([]);
    const [searchingMosques, setSearchingMosques] = useState(false);
    const [searchedOnce, setSearchedOnce] = useState(false);
    const typeAheadRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-search on mount if we have coords — auto-select closest
    useEffect(() => {
      if (searchedOnce) return;
      const lat = s.homeLat || s.cityLat;
      const lng = s.homeLng || s.cityLng;
      if (lat && lng) {
        setSearchingMosques(true);
        setSearchedOnce(true);
        searchNearbyMosques(lat, lng)
          .then((results) => {
            const sliced = results.slice(0, 12);
            setNearbyMosques(sliced);
            setFilteredMosques(sliced);
            // Auto-select closest mosque if none is set
            if (sliced.length > 0 && (!s.selectedMosqueName || s.selectedMosqueName === "My Mosque")) {
              const closest = sliced[0];
              selectMosque(closest);
            }
          })
          .catch(() => {})
          .finally(() => setSearchingMosques(false));
      }
    }, [s.homeLat, s.homeLng, s.cityLat, s.cityLng, searchedOnce]);

    // Type-ahead filter — filter already-fetched results + fuzzy name search
    const handleMosqueTypeAhead = (value: string) => {
      setMosqueTypeAhead(value);
      if (typeAheadRef.current) clearTimeout(typeAheadRef.current);
      if (!value.trim()) {
        setFilteredMosques(nearbyMosques);
        return;
      }
      const q = value.toLowerCase();
      // Filter from cached results first (instant)
      const immediate = nearbyMosques.filter((m) => m.name.toLowerCase().includes(q));
      setFilteredMosques(immediate);
      // Also trigger a fresh nearby search with the typed query acting as a name filter
      typeAheadRef.current = setTimeout(async () => {
        const lat = s.homeLat || s.cityLat;
        const lng = s.homeLng || s.cityLng;
        if (!lat || !lng) return;
        try {
          const results = await searchNearbyMosques(lat, lng);
          const matched = results.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 8);
          setFilteredMosques(matched.length > 0 ? matched : immediate);
        } catch { /* keep immediate results */ }
      }, 400);
    };

    const handleSearchMosques = async () => {
      const lat = s.homeLat || s.cityLat;
      const lng = s.homeLng || s.cityLng;
      if (!lat || !lng) {
        t({ title: "Set location first", description: "Go back and set your city or home address.", variant: "destructive" });
        return;
      }
      setSearchingMosques(true);
      try {
        const results = await searchNearbyMosques(lat, lng);
        const sliced = results.slice(0, 12);
        setNearbyMosques(sliced);
        setFilteredMosques(sliced);
        setSearchedOnce(true);
        if (results.length === 0) t({ title: "No mosques found", description: "Try the Mosque Finder on the dashboard." });
      } catch {
        t({ title: "Search failed", description: "Check your internet and try again.", variant: "destructive" });
      } finally {
        setSearchingMosques(false);
      }
    };

    const selectMosque = (m: MosqueResult) => {
      const homeLat = s.homeLat || s.cityLat || 0;
      const homeLng = s.homeLng || s.cityLng || 0;
      const dist = Math.round(haversineDistance(homeLat, homeLng, m.lat, m.lon) * 100) / 100;
      setSS((prev) => ({
        ...prev,
        selectedMosqueName: m.name,
        selectedMosqueLat: m.lat,
        selectedMosqueLng: m.lon,
        selectedMosqueDistance: Math.max(0.1, dist),
      }));
    };

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🕌</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Your Mosque</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            We'll find real mosques near you. Select yours.
          </p>
        </div>

        {/* Selected mosque banner */}
        {s.selectedMosqueName && s.selectedMosqueName !== "My Mosque" && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-primary bg-primary/5">
            <div className="w-8 h-8 rounded-full bg-gradient-teal flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{s.selectedMosqueName}</p>
              <p className="text-xs text-muted-foreground">{s.selectedMosqueDistance.toFixed(1)} km away · Selected</p>
            </div>
          </div>
        )}

        {/* Type-ahead search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchingMosques ? "Loading nearby mosques..." : "Search nearby mosques by name..."}
            value={mosqueTypeAhead}
            onChange={(e) => handleMosqueTypeAhead(e.target.value)}
            disabled={searchingMosques}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            autoComplete="off"
          />
        </div>

        {/* Refresh search button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearchMosques}
          disabled={searchingMosques}
          className="w-full"
        >
          <MapPin className="w-4 h-4 mr-2" />
          {searchingMosques ? "Searching..." : searchedOnce ? "Refresh Nearby Mosques" : "Find Nearby Mosques"}
        </Button>

        {/* Mosques list */}
        {filteredMosques.length > 0 && (
          <div className="space-y-1.5 max-h-52 overflow-y-auto rounded-xl">
            {filteredMosques.map((m) => {
              const homeLat = s.homeLat || s.cityLat || 0;
              const homeLng = s.homeLng || s.cityLng || 0;
              const dist = haversineDistance(homeLat, homeLng, m.lat, m.lon);
              const isSelected = s.selectedMosqueLat === m.lat && s.selectedMosqueLng === m.lon;
              return (
                <button
                  key={m.id}
                  onClick={() => selectMosque(m)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-gradient-teal" : "bg-muted"
                  }`}>
                    {isSelected ? <Check className="w-4 h-4 text-primary-foreground" /> : <span className="text-sm">🕌</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {m.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-muted-foreground">{dist.toFixed(2)} km away</p>
                      {m.openingHours && <span className="text-[10px] text-primary/70">· Hours available</span>}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {searchedOnce && filteredMosques.length === 0 && !searchingMosques && (
          <p className="text-xs text-muted-foreground text-center py-2">
            {mosqueTypeAhead ? `No mosques matching "${mosqueTypeAhead}"` : "No mosques found nearby."} Enter manually below.
          </p>
        )}

        {/* Manual entry */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Or enter manually:</p>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Mosque name</label>
            <input
              type="text"
              value={s.selectedMosqueName}
              onChange={(e) => setSS((prev) => ({ ...prev, selectedMosqueName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              Distance: {s.selectedMosqueDistance} km
            </label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={s.selectedMosqueDistance}
              onChange={(e) => setSS((prev) => ({ ...prev, selectedMosqueDistance: parseFloat(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1 km</span>
              <span>10 km</span>
            </div>
          </div>
        </div>

        <Button variant="hero" onClick={n} className="w-full">
          Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
        <button onClick={sk} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
          Skip →
        </button>
      </div>
    );
  };



  // Helper for distance
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    const allPrayers = [...selectedPrayers, ...selectedOptionalPrayers];
    saveSettings({ ...settings, prayerPreferences: allPrayers, ramadanMode, optionalPrayers: selectedOptionalPrayers });
    markOnboardingComplete();
    navigate("/dashboard");
  };

  const skip = () => {
    const allPrayers = [...selectedPrayers, ...selectedOptionalPrayers];
    saveSettings({ ...settings, prayerPreferences: allPrayers, ramadanMode, optionalPrayers: selectedOptionalPrayers });
    markOnboardingComplete();
    navigate("/dashboard");
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "Current Location";
          const tz = await fetchTimezone(lat, lng);
          setSettingsState((s) => ({
            ...s,
            cityName: city,
            cityLat: lat,
            cityLng: lng,
            homeLat: lat,
            homeLng: lng,
            homeAddress: data.display_name?.split(",").slice(0, 3).join(",") || "Home",
            ...(tz ? { cityTimezone: tz } : {}),
          }));
          toast({ title: `Location: ${city}` });
        } catch {
          setSettingsState((s) => ({ ...s, cityName: "Current Location", cityLat: lat, cityLng: lng, homeLat: lat, homeLng: lng }));
        }
        setLocating(false);
      },
      () => {
        toast({ title: "Location denied", variant: "destructive" });
        setLocating(false);
      }
    );
  };

  // Pre-fill location from IP when user reaches location step (prioritize current/IP before manual city)
  useEffect(() => {
    if (step !== 1) return;
    if (settings.cityLat && settings.cityLng) return;
    getIPGeolocation().then((ip) => {
      if (!ip) return;
      const tz = ip.timezone || "";
      setSettingsState((s) => ({
        ...s,
        cityName: ip.city,
        cityLat: ip.lat,
        cityLng: ip.lng,
        ...(tz ? { cityTimezone: tz } : {}),
      }));
    }).catch(() => {});
  }, [step]);

  const handleCityInputChange = (value: string) => {
    setCitySearch(value);
    if (citySearchTimeoutRef.current) clearTimeout(citySearchTimeoutRef.current);
    if (value.trim().length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    citySearchTimeoutRef.current = setTimeout(async () => {
      try {
        const list = await fetchLocationSuggestions(value, 6);
        setCitySuggestions(list);
        setShowCitySuggestions(list.length > 0);
      } catch {
        setCitySuggestions([]);
      }
    }, 300);
  };

  const selectCitySuggestion = async (s: LocationSuggestion) => {
    setCitySearch(s.shortName || s.displayName.split(",")[0] || "");
    setShowCitySuggestions(false);
    setCitySuggestions([]);
    try {
      const tz = await fetchTimezone(s.lat, s.lng);
      setSettingsState((prev) => ({
        ...prev,
        cityName: s.shortName || s.displayName.split(",")[0],
        cityLat: s.lat,
        cityLng: s.lng,
        ...(tz ? { cityTimezone: tz } : {}),
      }));
      toast({ title: `City set: ${s.shortName || s.displayName.split(",")[0]}` });
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    }
  };

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;
    if (citySuggestions.length > 0) {
      selectCitySuggestion(citySuggestions[0]);
      return;
    }
    try {
      const list = await fetchLocationSuggestions(citySearch, 1);
      if (list.length > 0) {
        await selectCitySuggestion(list[0]);
      } else {
        toast({ title: "No results", description: "Try a different city name.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    }
  };

  const handleHomeSearch = async () => {
    if (!homeSearch.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(homeSearch)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        setSettingsState((s) => ({
          ...s,
          homeAddress: data[0].display_name?.split(",").slice(0, 3).join(",") || homeSearch,
          homeLat: parseFloat(data[0].lat),
          homeLng: parseFloat(data[0].lon),
        }));
        toast({ title: "Home address set!" });
      }
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    }
  };

  const handleNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({ title: "Notifications enabled! 🔔" });
    }
    next();
  };

  const togglePrayer = (prayer: string) => {
    setSelectedPrayers((prev) =>
      prev.includes(prayer) ? prev.filter((p) => p !== prayer) : [...prev, prayer]
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Get Started"
        description="Set up MosqueSteps: location, mosque, and prayer reminders in a few steps."
        path="/onboarding"
      />
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <div
          className="h-full bg-gradient-gold transition-all duration-500"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-6">
                <img src={logo} alt="MosqueSteps" className="w-20 h-20 mx-auto" />
                <h1 className="text-3xl font-extrabold text-foreground">
                  Mosque<span className="text-primary">Steps</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Count every step to the mosque as a blessing. Track your walk, view prayer times, and see your spiritual rewards grow.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  "One step will erase a sin and another will raise him a degree."
                  <br />
                  <span className="text-xs">— Sahih Muslim 666</span>
                </p>
                <Button variant="hero" size="lg" onClick={next} className="w-full text-base">
                  Get Started <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <button onClick={skip} className="text-sm text-muted-foreground hover:text-primary">
                  Skip setup →
                </button>
              </div>
            )}

            {/* Step 1: Location + Home Address */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Set Your Location</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    For accurate prayer times and mosque distance calculations.
                  </p>
                </div>

                {settings.cityName && (
                  <div className="glass-card p-3 text-center">
                    <p className="text-sm font-medium text-primary">
                      <Check className="w-4 h-4 inline mr-1" /> {settings.cityName}
                    </p>
                  </div>
                )}

                <Button variant="outline" onClick={handleUseLocation} disabled={locating} className="w-full">
                  <Locate className="w-4 h-4 mr-2" />
                  {locating ? "Detecting..." : "Use Current Location"}
                </Button>

                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Or search city or address..."
                      value={citySearch}
                      onChange={(e) => handleCityInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
                      onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      autoComplete="off"
                    />
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                        {citySuggestions.map((s, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectCitySuggestion(s)}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 border-b border-border/50 last:border-b-0"
                          >
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden />
                            <span className="truncate">{s.displayName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" onClick={handleCitySearch}>Search</Button>
                </div>

                {/* Home address */}
                <div className="border-t border-border pt-4">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
                    <Home className="w-4 h-4 text-primary" /> Home Address (optional)
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Set your home address so we can calculate exact walking distances to mosques.
                  </p>
                  {settings.homeAddress && (
                    <div className="glass-card p-2 mb-2 text-center">
                      <p className="text-xs font-medium text-primary truncate">
                        <Check className="w-3 h-3 inline mr-1" /> {settings.homeAddress}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search home address..."
                      value={homeSearch}
                      onChange={(e) => setHomeSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleHomeSearch()}
                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button size="sm" onClick={handleHomeSearch}>Set</Button>
                  </div>
                </div>

                <Button variant="hero" onClick={next} className="w-full">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <button onClick={skip} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
                  Skip →
                </button>
              </div>
            )}

            {/* Step 2: Which prayers do you walk to? */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🤲</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Which prayers do you walk to?</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Select prayers you typically walk to the mosque for. You can change this later.
                  </p>
                </div>

                {/* Ramadan Mode toggle */}
                <button
                  onClick={() => setRamadanMode((v) => !v)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    ramadanMode
                      ? "border-gold/60 bg-gold/5 shadow-sm"
                      : "border-border hover:border-gold/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      ramadanMode ? "bg-gold/20" : "bg-muted"
                    }`}>
                      <Moon className={`w-5 h-5 ${ramadanMode ? "text-gold" : "text-muted-foreground"}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold text-sm ${ramadanMode ? "text-foreground" : "text-muted-foreground"}`}>
                        Ramadan Mode 🌙
                      </p>
                      <p className="text-[10px] text-muted-foreground">Enables Taraweeh tracking & Ramadan badges</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${ramadanMode ? "bg-gold" : "bg-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-background absolute top-1 transition-all ${ramadanMode ? "left-5" : "left-1"}`} />
                  </div>
                </button>

                {/* Fard prayers */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Fard (Obligatory)</p>
                  <div className="space-y-2">
                    {ALL_PRAYERS.map((prayer) => {
                      const isSelected = selectedPrayers.includes(prayer);
                      const prayerIcons: Record<string, string> = {
                        Fajr: "🌅", Dhuhr: "☀️", Asr: "🌤️", Maghrib: "🌅", Isha: "🌙"
                      };
                      return (
                        <button
                          key={prayer}
                          onClick={() => togglePrayer(prayer)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base ${
                              isSelected ? "bg-gradient-teal" : "bg-muted"
                            }`}>
                              {isSelected ? <Check className="w-4 h-4 text-primary-foreground" /> : prayerIcons[prayer]}
                            </div>
                            <span className={`font-medium text-sm ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                              {prayer}
                            </span>
                          </div>
                          {(prayer === "Fajr" || prayer === "Isha") && (
                            <span className="text-[10px] text-gold font-medium bg-gold/10 px-2 py-0.5 rounded-full">
                              ✨ Full light promised
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional / Voluntary prayers */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Voluntary (Sunnah / Nafl)</p>
                  <div className="space-y-2">
                    {OPTIONAL_PRAYERS.filter((p) => !p.ramadanOnly || ramadanMode).map((prayer) => {
                      const isSelected = selectedOptionalPrayers.includes(prayer.id);
                      return (
                        <button
                          key={prayer.id}
                          onClick={() =>
                            setSelectedOptionalPrayers((prev) =>
                              prev.includes(prayer.id) ? prev.filter((x) => x !== prayer.id) : [...prev, prayer.id]
                            )
                          }
                          className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                            isSelected
                              ? "border-gold/60 bg-gold/5 shadow-sm"
                              : "border-border hover:border-gold/30"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 mt-0.5 ${
                            isSelected ? "bg-gold/20" : "bg-muted"
                          }`}>
                            {isSelected ? <Star className="w-4 h-4 text-gold" /> : <span>{prayer.icon}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium text-sm ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                                {prayer.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-arabic">{prayer.arabic}</span>
                              {prayer.ramadanOnly && (
                                <span className="text-[10px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">Ramadan</span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{prayer.description}</p>
                            {isSelected && (
                              <p className="text-[10px] text-primary/80 mt-1 italic leading-snug">"{prayer.hadith}"</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center italic px-2">
                  "Walking to Fajr and Isha in darkness earns complete light on the Day of Resurrection" — Abu Dawud 561
                </p>

                <Button variant="hero" onClick={next} className="w-full">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <button onClick={skip} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
                  Skip →
                </button>
              </div>
            )}

            {/* Step 3: Mosque */}
            {step === 3 && (
              <OnboardingMosqueStep
                settings={settings}
                setSettingsState={setSettingsState}
                toast={toast}
                next={next}
                skip={skip}
              />
            )}

            {/* Step 4: Notifications */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Prayer Reminders</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Get notified when it's time to leave for the mosque based on your walking distance.
                  </p>
                </div>

                {isNotificationSupported() ? (
                  <Button variant="hero" onClick={handleNotifications} className="w-full">
                    Enable Notifications <Bell className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground text-center italic">
                    Notifications not supported in this browser.
                  </p>
                )}

                <Button variant="outline" onClick={finish} className="w-full">
                  {isNotificationSupported() ? "Skip for now" : "Finish Setup"}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 pb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === step ? "bg-primary" : i < step ? "bg-primary/50" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Onboarding;
