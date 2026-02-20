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
  const [cityValidated, setCityValidated] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedPrayers, setSelectedPrayers] = useState<string[]>(
    settings.prayerPreferences || ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
  );
  const [selectedOptionalPrayers, setSelectedOptionalPrayers] = useState<string[]>([]);
  const [ramadanMode, setRamadanMode] = useState(false);
  const [homeSearch, setHomeSearch] = useState("");
  const [homeSuggestions, setHomeSuggestions] = useState<LocationSuggestion[]>([]);
  const [showHomeSuggestions, setShowHomeSuggestions] = useState(false);
  const homeSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [homeValidated, setHomeValidated] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

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
    const [selectedMosqueDetails, setSelectedMosqueDetails] = useState<MosqueResult | null>(null);
    const [showManual, setShowManual] = useState(false);
    const typeAheadRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const homeLat = s.homeLat || s.cityLat || 0;
    const homeLng = s.homeLng || s.cityLng || 0;
    const hasLocation = !!(s.homeLat || s.cityLat);

    const calcDist = (m: MosqueResult) =>
      Math.round(haversineDistance(homeLat, homeLng, m.lat, m.lon) * 100) / 100;

    const getDistLabel = (km: number) => {
      if (km < 1) return `${Math.round(km * 1000)} m`;
      return `${km.toFixed(1)} km`;
    };

    const getDistColor = (km: number) => {
      if (km < 0.5) return "text-primary bg-primary/10";
      if (km < 1.5) return "text-gold bg-gold/10";
      return "text-muted-foreground bg-muted";
    };

    const selectMosque = (m: MosqueResult) => {
      const dist = calcDist(m);
      setSS((prev) => ({
        ...prev,
        selectedMosqueName: m.name,
        selectedMosqueLat: m.lat,
        selectedMosqueLng: m.lon,
        selectedMosqueDistance: Math.max(0.1, dist),
      }));
      setSelectedMosqueDetails(m);
      setMosqueTypeAhead("");
    };

    // Auto-search on mount if we have coords — auto-select closest
    useEffect(() => {
      if (searchedOnce || !hasLocation) return;
      setSearchingMosques(true);
      setSearchedOnce(true);
      searchNearbyMosques(homeLat, homeLng)
        .then((results) => {
          const sliced = results.slice(0, 15);
          setNearbyMosques(sliced);
          setFilteredMosques(sliced);
          if (sliced.length > 0 && (!s.selectedMosqueName || s.selectedMosqueName === "My Mosque")) {
            selectMosque(sliced[0]);
          }
        })
        .catch(() => {})
        .finally(() => setSearchingMosques(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasLocation]);

    // Type-ahead: instant local filter + debounced re-fetch
    const handleMosqueTypeAhead = (value: string) => {
      setMosqueTypeAhead(value);
      if (typeAheadRef.current) clearTimeout(typeAheadRef.current);
      if (!value.trim()) {
        setFilteredMosques(nearbyMosques);
        return;
      }
      const q = value.toLowerCase();
      const immediate = nearbyMosques.filter((m) => m.name.toLowerCase().includes(q));
      setFilteredMosques(immediate);
      if (hasLocation) {
        typeAheadRef.current = setTimeout(async () => {
          try {
            const results = await searchNearbyMosques(homeLat, homeLng);
            const matched = results.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 10);
            setNearbyMosques(results.slice(0, 15));
            setFilteredMosques(matched.length > 0 ? matched : immediate);
          } catch { /* keep immediate */ }
        }, 350);
      }
    };

    const handleSearchMosques = async () => {
      if (!hasLocation) {
        t({ title: "Set location first", description: "Go back and set your city or home address.", variant: "destructive" });
        return;
      }
      setSearchingMosques(true);
      try {
        const results = await searchNearbyMosques(homeLat, homeLng);
        const sliced = results.slice(0, 15);
        setNearbyMosques(sliced);
        setFilteredMosques(mosqueTypeAhead.trim()
          ? sliced.filter((m) => m.name.toLowerCase().includes(mosqueTypeAhead.toLowerCase()))
          : sliced);
        setSearchedOnce(true);
        if (results.length === 0) t({ title: "No mosques found nearby", description: "Try the Mosque Finder from the dashboard for a wider search." });
      } catch {
        t({ title: "Search failed", description: "Check your internet connection and try again.", variant: "destructive" });
      } finally {
        setSearchingMosques(false);
      }
    };

    const isSelected = (m: MosqueResult) => s.selectedMosqueLat === m.lat && s.selectedMosqueLng === m.lon;

    const displayList = filteredMosques.length > 0 ? filteredMosques : (mosqueTypeAhead ? [] : nearbyMosques);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🕌</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Your Mosque</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {hasLocation ? "Real mosques near you — select yours below." : "Set your location first for nearby results."}
          </p>
        </div>

        {/* Selected mosque details card */}
        {s.selectedMosqueName && s.selectedMosqueName !== "My Mosque" && (
          <div className="rounded-xl border border-primary bg-primary/5 p-3.5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-teal flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug">{s.selectedMosqueName}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${getDistColor(s.selectedMosqueDistance)}`}>
                    📍 {getDistLabel(s.selectedMosqueDistance)}
                  </span>
                  {selectedMosqueDetails?.openingHours && (
                    <span className="text-[10px] text-muted-foreground">🕐 {selectedMosqueDetails.openingHours}</span>
                  )}
                  {selectedMosqueDetails?.phone && (
                    <span className="text-[10px] text-muted-foreground">📞 {selectedMosqueDetails.phone}</span>
                  )}
                  {selectedMosqueDetails?.website && (
                    <a
                      href={selectedMosqueDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 Website
                    </a>
                  )}
                </div>
                {selectedMosqueDetails && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {selectedMosqueDetails.lat.toFixed(5)}, {selectedMosqueDetails.lon.toFixed(5)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Type-ahead search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          {searchingMosques && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchingMosques ? "Searching nearby mosques…" : hasLocation ? "Type to filter mosques by name…" : "Set location above first…"}
            value={mosqueTypeAhead}
            onChange={(e) => handleMosqueTypeAhead(e.target.value)}
            disabled={searchingMosques}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            autoComplete="off"
          />
        </div>

        {/* Mosque list — always visible with top 15 or filtered */}
        {!searchingMosques && searchedOnce && (
          <div className="space-y-1.5 max-h-56 overflow-y-auto rounded-xl pr-0.5">
            {displayList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                {mosqueTypeAhead ? `No mosques matching "${mosqueTypeAhead}"` : "No mosques found nearby."}
              </p>
            ) : (
              displayList.map((m, idx) => {
                const dist = calcDist(m);
                const sel = isSelected(m);
                const isClosest = idx === 0 && !mosqueTypeAhead;
                return (
                  <button
                    key={m.id}
                    onClick={() => selectMosque(m)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      sel
                        ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/40 bg-card"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${
                      sel ? "bg-gradient-teal" : "bg-muted"
                    }`}>
                      {sel ? <Check className="w-4 h-4 text-primary-foreground" /> : "🕌"}
                    </div>
                    {/* Name + details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-sm font-semibold truncate max-w-[160px] ${sel ? "text-foreground" : "text-foreground/80"}`}>
                          {m.name}
                        </p>
                        {isClosest && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                            Closest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {m.openingHours && (
                          <span className="text-[9px] text-muted-foreground">🕐 Hours</span>
                        )}
                        {m.phone && (
                          <span className="text-[9px] text-muted-foreground">📞</span>
                        )}
                      </div>
                    </div>
                    {/* Distance badge */}
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-lg shrink-0 ${getDistColor(dist)}`}>
                      {getDistLabel(dist)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Searching skeleton */}
        {searchingMosques && (
          <div className="space-y-1.5">
            {[1,2,3].map((i) => (
              <div key={i} className="h-[52px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* Not searched yet and no location */}
        {!searchedOnce && !searchingMosques && !hasLocation && (
          <div className="text-center py-4 space-y-2">
            <p className="text-2xl">📍</p>
            <p className="text-sm text-muted-foreground">Go back and set your city or address to find nearby mosques automatically.</p>
          </div>
        )}

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearchMosques}
          disabled={searchingMosques || !hasLocation}
          className="w-full"
        >
          <MapPin className="w-3.5 h-3.5 mr-2" />
          {searchingMosques ? "Searching…" : searchedOnce ? "Refresh Nearby Mosques" : "Find Nearby Mosques"}
        </Button>

        {/* Manual entry (collapsible) */}
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setShowManual((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground py-1 transition-colors"
          >
            <span>✏️ Enter mosque manually</span>
            <span>{showManual ? "▲" : "▼"}</span>
          </button>
          {showManual && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Mosque name</label>
                <input
                  type="text"
                  value={s.selectedMosqueName}
                  onChange={(e) => setSS((prev) => ({ ...prev, selectedMosqueName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. East London Mosque"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  Distance: {s.selectedMosqueDistance} km
                </label>
                <input
                  type="range" min="0.1" max="10" step="0.1"
                  value={s.selectedMosqueDistance}
                  onChange={(e) => setSS((prev) => ({ ...prev, selectedMosqueDistance: parseFloat(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1 km</span><span>10 km</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button variant="hero" onClick={n} className="w-full mt-2">
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
  // Also stores IP coords so home address type-ahead is always biased even before GPS/city is set
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
        // Also prime homeLat/Lng so type-ahead bias works immediately
        // (only if no home address set yet)
        ...(!s.homeLat && !s.homeLng ? { homeLat: ip.lat, homeLng: ip.lng } : {}),
        ...(tz ? { cityTimezone: tz } : {}),
      }));
    }).catch(() => {});
  }, [step]);

  const handleCityInputChange = (value: string) => {
    setCitySearch(value);
    setCityValidated(false);
    setCityError(null);
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
    setCityValidated(true);
    setCityError(null);
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
    const q = citySearch.trim();
    if (!q) return;
    if (cityValidated) return;
    if (citySuggestions.length > 0) {
      selectCitySuggestion(citySuggestions[0]);
      return;
    }
    try {
      const list = await fetchLocationSuggestions(q, 6);
      if (list.length === 0) {
        setCityError("No recognised city found. Please try a different name.");
        return;
      }
      setCitySuggestions(list);
      setShowCitySuggestions(true);
      setCityError("Please select a city from the list below.");
    } catch {
      setCityError("Search failed. Check your connection and try again.");
    }
  };

  // Reference point for home address bias: GPS > saved city coords > IP geolocation
  // homeRefLat/Lng are populated via IP on step 1 load, so always have a bias
  const homeRefLat = settings.homeLat || settings.cityLat;
  const homeRefLng = settings.homeLng || settings.cityLng;

  const handleHomeInputChange = (value: string) => {
    setHomeSearch(value);
    setHomeValidated(false);
    setHomeError(null);
    if (homeSearchTimeoutRef.current) clearTimeout(homeSearchTimeoutRef.current);
    if (value.trim().length < 2) {
      setHomeSuggestions([]);
      setShowHomeSuggestions(false);
      return;
    }
    homeSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const list = await fetchLocationSuggestions(value, 6, homeRefLat ?? undefined, homeRefLng ?? undefined);
        // Filter to only geocoded results with valid coords
        const valid = list.filter(
          (r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) &&
                 r.lat >= -90 && r.lat <= 90 && r.lng >= -180 && r.lng <= 180
        );
        setHomeSuggestions(valid);
        setShowHomeSuggestions(valid.length > 0);
        if (valid.length === 0 && value.trim().length >= 3) {
          setHomeError("No verified address found. Try a different search.");
        }
      } catch {
        setHomeSuggestions([]);
        setHomeError("Search failed. Check your connection.");
      }
    }, 300);
  };

  const selectHomeSuggestion = (s: LocationSuggestion) => {
    if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) {
      toast({ title: "Invalid address", description: "That address has no valid coordinates.", variant: "destructive" });
      return;
    }
    setHomeSearch(s.displayName.split(",").slice(0, 3).join(","));
    setShowHomeSuggestions(false);
    setHomeSuggestions([]);
    setHomeValidated(true);
    setHomeError(null);
    setSettingsState((prev) => ({
      ...prev,
      homeAddress: s.displayName.split(",").slice(0, 3).join(","),
      homeLat: s.lat,
      homeLng: s.lng,
    }));
    toast({ title: "Home address set!", description: s.displayName.split(",").slice(0, 2).join(",") });
  };

  const handleHomeSearch = async () => {
    const q = homeSearch.trim();
    if (!q) return;
    if (homeValidated) return;
    if (homeSuggestions.length > 0) {
      selectHomeSuggestion(homeSuggestions[0]);
      return;
    }
    try {
      const list = await fetchLocationSuggestions(q, 6, homeRefLat ?? undefined, homeRefLng ?? undefined);
      if (list.length === 0) {
        setHomeError("No verified address found. Please try a different search.");
        return;
      }
      setHomeSuggestions(list);
      setShowHomeSuggestions(true);
      setHomeError("Please select your home address from the list below.");
    } catch {
      setHomeError("Search failed. Check your connection.");
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

                <div className="space-y-1">
                  <div className="flex gap-2 relative">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Or search city or address..."
                        value={citySearch}
                        onChange={(e) => handleCityInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
                        onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => {
                          setShowCitySuggestions(false);
                          if (citySearch.trim().length >= 2 && !cityValidated) {
                            setCityError("Select a city from the dropdown to confirm your location.");
                          }
                        }, 150)}
                        className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 transition-colors ${
                          cityError ? "border-destructive focus:ring-destructive/40" : "border-input focus:ring-ring"
                        }`}
                        autoComplete="off"
                        aria-invalid={!!cityError}
                        aria-describedby={cityError ? "ob-city-error" : undefined}
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
                  {cityError && (
                    <p id="ob-city-error" className="text-xs text-destructive flex items-center gap-1">
                      <span>⚠</span> {cityError}
                    </p>
                  )}
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
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          placeholder={homeRefLat ? "Search your street address…" : "Search home address…"}
                          value={homeSearch}
                          onChange={(e) => handleHomeInputChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (homeSuggestions.length > 0) selectHomeSuggestion(homeSuggestions[0]);
                              else handleHomeSearch();
                            }
                          }}
                          onFocus={() => homeSuggestions.length > 0 && setShowHomeSuggestions(true)}
                          onBlur={() => setTimeout(() => {
                            setShowHomeSuggestions(false);
                            if (homeSearch.trim().length >= 2 && !homeValidated) {
                              setHomeError("Select an address from the dropdown to confirm.");
                            }
                          }, 180)}
                          className={`w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 transition-colors ${
                            homeError ? "border-destructive focus:ring-destructive/40" : "border-input focus:ring-ring"
                          }`}
                          autoComplete="off"
                          aria-invalid={!!homeError}
                          aria-describedby={homeError ? "ob-home-error" : undefined}
                        />
                        {/* Type-ahead dropdown */}
                        {showHomeSuggestions && homeSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
                            {homeSuggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectHomeSuggestion(s)}
                                className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-muted flex items-start gap-2.5 border-b border-border/50 last:border-b-0"
                              >
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
                                <div className="min-w-0">
                                  <p className="font-medium truncate text-sm leading-tight">{s.shortName || s.displayName.split(",")[0]}</p>
                                  <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">{s.displayName}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button size="sm" onClick={handleHomeSearch}>Set</Button>
                    </div>
                    {homeError && (
                      <p id="ob-home-error" className="text-xs text-destructive flex items-center gap-1">
                        <span>⚠</span> {homeError}
                      </p>
                    )}
                    {homeRefLat && !homeError && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        Results biased near {settings.cityName || "your detected location"}
                      </p>
                    )}
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
