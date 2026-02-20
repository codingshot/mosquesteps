import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Bell, BellOff, Locate, Download, Sun, Moon, Monitor, Ruler, Gauge, Footprints, Home, User, Globe, CheckCircle, Clock, BarChart3, Info, BookOpen, Heart, ChevronUp, ChevronDown } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { getAvailableLocales, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSettings, saveSettings, getSavedMosques, fetchTimezone, AGE_MIN, AGE_MAX, BODY_WEIGHT_KG_MIN, BODY_WEIGHT_KG_MAX, type UserSettings, toggleFavoriteMosque, getFavoriteMosques, reorderFavoriteMosque, recomputeMosqueDistancesFromHome } from "@/lib/walking-history";
import { PRAYER_CALCULATION_METHODS } from "@/lib/prayer-times";
import { fetchLocationSuggestions, type LocationSuggestion } from "@/lib/geocode";
import { requestNotificationPermission, isNotificationSupported, getNotificationPermission } from "@/lib/notifications";
import { getRegionalDefaults } from "@/lib/regional-defaults";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

/** Address type-ahead component for home address, with location bias and validity checks. */
function HomeAddressSearch({
  currentSettings,
  onSelect,
}: {
  currentSettings: UserSettings;
  onSelect: (addr: string, lat: number, lng: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const handleChange = (val: string) => {
    setQuery(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Bias toward city/home location if available
        const nearLat = currentSettings.homeLat || currentSettings.cityLat;
        const nearLng = currentSettings.homeLng || currentSettings.cityLng;
        const results = await fetchLocationSuggestions(val.trim(), 6, nearLat, nearLng);
        // Validate each result has sane coords
        const valid = results.filter(
          (r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) &&
                 r.lat >= -90 && r.lat <= 90 && r.lng >= -180 && r.lng <= 180
        );
        setSuggestions(valid);
        setShowSuggestions(valid.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (s: LocationSuggestion) => {
    // Final validity check
    if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) {
      toast({ title: "Invalid address coordinates", variant: "destructive" });
      return;
    }
    onSelect(s.displayName.split(",").slice(0, 3).join(","), s.lat, s.lng);
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search home address…"
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(s)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span className="font-medium">{s.shortName}</span>
              <span className="text-[11px] text-muted-foreground ml-1 line-clamp-1">{s.displayName.split(",").slice(1, 3).join(",")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [savedMosques, setSavedMosques] = useState(getSavedMosques());
  const [citySearch, setCitySearch] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<LocationSuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const citySearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [locating, setLocating] = useState(false);
  const [homeLocating, setHomeLocating] = useState(false);
  const { locale, setLocale } = useLocale();
  const availableLocales = getAvailableLocales();

  const favoriteMosques = savedMosques.filter((m) => m.isFavorite).sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  const handleToggleFavorite = (id: string) => {
    toggleFavoriteMosque(id);
    const updated = getSavedMosques();
    setSavedMosques(updated);
    const m = updated.find((x) => x.id === id);
    toast({ title: m?.isFavorite ? "⭐ Added to favorites" : "Removed from favorites" });
  };

  const handleReorder = (id: string, dir: "up" | "down") => {
    reorderFavoriteMosque(id, dir);
    setSavedMosques(getSavedMosques());
  };

  // Autosave with debounce
  const isFirstRender = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveSettings(settings);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1500);
    }, 400);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [settings]);

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
      const cityName = s.shortName || s.displayName.split(",")[0] || citySearch;
      const defaults = getRegionalDefaults(cityName, tz || undefined);
      const oldTz = settings.cityTimezone;
      const isNewTimezone = tz && oldTz && tz !== oldTz;
      setSettings((prev) => ({
        ...prev,
        cityName,
        cityLat: s.lat,
        cityLng: s.lng,
        ...(tz ? { cityTimezone: tz } : {}),
        ...(!prev.timeFormat ? { timeFormat: defaults.timeFormat } : {}),
        ...(!prev.smallDistanceUnit ? { smallDistanceUnit: defaults.smallDistanceUnit } : {}),
      }));
      toast({
        title: isNewTimezone ? `📍 Location changed to ${cityName}` : "City set!",
        description: isNewTimezone
          ? `Timezone updated: ${oldTz} → ${tz}. All prayer times and clocks now use ${cityName} local time.`
          : `Prayer times will be calculated for ${cityName}${tz ? ` (${tz})` : ""}`,
      });
    } catch {
      toast({ title: "Search failed", description: "Could not find that city.", variant: "destructive" });
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
        toast({ title: "Search failed", description: "Could not find that city.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Search failed", description: "Could not find that city.", variant: "destructive" });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not available", description: "Your browser doesn't support location.", variant: "destructive" });
      return;
    }
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
          const defaults = getRegionalDefaults(city, tz || undefined);
          setSettings((s) => ({
            ...s,
            cityName: city, cityLat: lat, cityLng: lng,
            ...(tz ? { cityTimezone: tz } : {}),
            ...(!s.timeFormat ? { timeFormat: defaults.timeFormat } : {}),
            ...(!s.smallDistanceUnit ? { smallDistanceUnit: defaults.smallDistanceUnit } : {}),
          }));
          toast({ title: `Location set: ${city}`, description: `Prayer times and clock now use ${city} local time.${tz ? ` (${tz})` : ""}` });
        } catch {
          setSettings((s) => ({ ...s, cityName: "Current Location", cityLat: lat, cityLng: lng }));
        }
        setLocating(false);
      },
      () => {
        toast({ title: "Location denied", description: "Please enable location access or search for your city.", variant: "destructive" });
        setLocating(false);
      }
    );
  };

  const handleNotificationToggle = async () => {
    if (notifPermission === "granted") {
      toast({ title: "Notifications already enabled", description: "Manage in your browser settings." });
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
    if (granted) {
      toast({ title: "Notifications enabled! 🔔", description: "You'll get prayer departure reminders." });
    } else {
      toast({ title: "Notifications blocked", description: "Enable them in your browser settings.", variant: "destructive" });
    }
  };

  const distanceUnit = settings.distanceUnit || "km";
  const speedUnit = settings.speedUnit || "kmh";
  const displaySpeed = speedUnit === "mph"
    ? (settings.walkingSpeed * 0.621371).toFixed(1)
    : settings.walkingSpeed.toFixed(1);

  return (
    <div className="min-h-screen bg-background pb-bottom-nav">
      <SEOHead
        title="Settings"
        description="Configure location, prayer times, units, and notifications. MosqueSteps."
        path="/settings"
        noindex
      />
      <header className="bg-card border-b border-border">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-1.5" aria-label="Go back to dashboard">
            <ArrowLeft className="w-5 h-5 text-foreground" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          <span className="font-bold text-foreground">Settings</span>
        </div>
      </header>

      <div className="container py-6 space-y-6 max-w-lg pb-32">
        {/* Theme */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Sun className="w-4 h-4 text-primary" /> Appearance
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "light" as const, label: "Light", icon: Sun },
              { value: "dark" as const, label: "Dark", icon: Moon },
              { value: "system" as const, label: "System", icon: Monitor },
            ]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  theme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Measurement Units */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Ruler className="w-4 h-4 text-primary" /> Measurement Units
          </h2>

          {/* Distance */}
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Distance</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "km" as const, label: "Kilometers (km)" },
                { value: "mi" as const, label: "Miles (mi)" },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSettings({ ...settings, distanceUnit: value })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    distanceUnit === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Speed</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "kmh" as const, label: "km/h" },
                { value: "mph" as const, label: "mph" },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSettings({ ...settings, speedUnit: value })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    speedUnit === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stride length */}
          <div>
            <label className="text-sm text-muted-foreground block mb-2 flex items-center gap-1.5">
              Stride Length: {(settings.strideLength || 0.75).toFixed(2)} m ({((settings.strideLength || 0.75) * 3.281).toFixed(1)} ft)
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded" aria-label="Stride length benchmarks">
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] p-3 text-left" side="bottom">
                  <p className="font-medium text-foreground mb-1.5">Benchmarks</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li><strong className="text-foreground">National average:</strong> ~0.76 m (adults)</li>
                    <li><strong className="text-foreground">Elderly (65+):</strong> ~0.60–0.70 m</li>
                    <li><strong className="text-foreground">Athletes / brisk:</strong> ~0.85–1.0 m</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-1.5">Used to estimate steps from distance when sensors aren’t used.</p>
                </TooltipContent>
              </Tooltip>
            </label>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.01"
              value={settings.strideLength || 0.75}
              onChange={(e) => setSettings({ ...settings, strideLength: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short (0.5m)</span>
              <span>Avg (0.75m)</span>
              <span>Long (1.0m)</span>
            </div>
          </div>

          {/* Time Format */}
          <div>
            <label className="text-sm text-muted-foreground block mb-2">
              <Clock className="w-3.5 h-3.5 inline mr-1" />Time Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "12h" as const, label: "12-hour (AM/PM)" },
                { value: "24h" as const, label: "24-hour" },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSettings({ ...settings, timeFormat: value })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    (settings.timeFormat || "24h") === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Small distance unit */}
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Small Distances</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "m" as const, label: "Meters (m)" },
                { value: "ft" as const, label: "Feet (ft)" },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSettings({ ...settings, smallDistanceUnit: value })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    (settings.smallDistanceUnit || "m") === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location / City for prayer times */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Location for Prayer Times
          </h2>
          <p className="text-sm text-muted-foreground">
            Set your city so prayer times are accurate even without GPS.
            {settings.cityName && (
              <span className="block mt-1 font-medium text-foreground">Current: {settings.cityName}</span>
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="w-full"
          >
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
            <Button size="sm" onClick={handleCitySearch}>Set</Button>
          </div>
        </div>

        {/* Prayer Calculation Method */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Prayer Calculation Method
            </h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-64 text-xs">
                Different Islamic organisations use different angles for Fajr and Isha calculations. 
                Choose the method endorsed by scholars in your region. The default is ISNA (North America).
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-xs text-muted-foreground">
            Determines Fajr & Isha angles. Choose the method used in your region for the most accurate prayer times.
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {Object.entries(PRAYER_CALCULATION_METHODS).map(([key, method]) => {
              const isSelected = (settings.prayerCalculationMethod || "ISNA") === key;
              return (
                <button
                  key={key}
                  onClick={() => setSettings({ ...settings, prayerCalculationMethod: key })}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? "border-primary" : "border-border"
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                        {method.name}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                        isSelected ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                      }`}>{key}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{method.region}</p>
                    {isSelected && (
                      <p className="text-[11px] text-primary/70 mt-1 italic">{method.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {settings.prayerCalculationMethod && settings.prayerCalculationMethod !== "ISNA" && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 text-center">
              ℹ️ Changing the calculation method clears the prayer time cache. Times will refresh on next load.
            </p>
          )}
        </div>

        {/* Notifications */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            {notifPermission === "granted" ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            Prayer Notifications
            {notifPermission === "granted" && (
              <span className="ml-auto text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium">Active</span>
            )}
          </h2>

          {!isNotificationSupported() ? (
            <div className="bg-muted/50 border border-border rounded-lg p-3 text-center">
              <BellOff className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Notifications are not supported in this browser. Try Chrome, Firefox, or Edge on desktop, or Chrome on Android.</p>
            </div>
          ) : notifPermission === "denied" ? (
            <div className="space-y-3">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <BellOff className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-destructive font-semibold">Notifications blocked</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Your browser is blocking notifications. Follow the steps below to re-enable them.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {/iPhone|iPad|iPod/.test(navigator.userAgent) ? (
                    <>
                      <p className="text-xs font-semibold text-foreground">On iPhone / iPad (Safari):</p>
                      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                        <li>Open <strong>Settings</strong> app → <strong>Apps</strong> → <strong>Safari</strong></li>
                        <li>Tap <strong>Notifications</strong> and toggle <strong>Allow</strong></li>
                        <li>Return here and tap <strong>Enable Notifications</strong> again</li>
                      </ol>
                    </>
                  ) : /Android/.test(navigator.userAgent) ? (
                    <>
                      <p className="text-xs font-semibold text-foreground">On Android (Chrome):</p>
                      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                        <li>Tap the <strong>🔒 lock icon</strong> in the address bar</li>
                        <li>Tap <strong>Permissions</strong> → <strong>Notifications</strong> → <strong>Allow</strong></li>
                        <li>Refresh the page and try again</li>
                      </ol>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-foreground">On Desktop (Chrome / Firefox / Edge):</p>
                      <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                        <li>Click the <strong>🔒 lock / info icon</strong> in the address bar</li>
                        <li>Find <strong>Notifications</strong> and set it to <strong>Allow</strong></li>
                        <li>Click the button below to refresh</li>
                      </ol>
                    </>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full border-destructive/30 text-destructive hover:text-destructive" onClick={() => window.location.reload()}>
                  I've unblocked — Refresh now
                </Button>
              </div>
            </div>
          ) : notifPermission === "granted" ? (
            <div className="space-y-3">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Notifications are enabled ✓</p>
                  <p className="text-xs text-muted-foreground">You'll get prayer departure reminders.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary h-7"
                  onClick={() => {
                    try {
                      new Notification("MosqueSteps Test 🔔", {
                        body: "Notifications are working! You'll be notified before each prayer.",
                        icon: "/favicon.png",
                      });
                    } catch {}
                  }}
                >
                  Test
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Get reminded when it's time to leave for the mosque based on your walking distance.</p>
              <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                {[
                  { emoji: "🕌", text: "Prayer departure reminders" },
                  { emoji: "🔥", text: "Streak & badge alerts" },
                  { emoji: "📊", text: "Weekly walking summary" },
                  { emoji: "💡", text: "Health & wellness tips" },
                ].map(({ emoji, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <span>{emoji}</span><span>{text}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleNotificationToggle} className="w-full" size="sm">
                <Bell className="w-4 h-4 mr-2" /> Enable Notifications
              </Button>
            </div>
          )}

          {/* ── Leave-by reminder ── */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🚶</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Departure reminder</p>
                  <p className="text-[11px] text-muted-foreground">Notify when it's time to leave for the mosque</p>
                </div>
              </div>
              <Switch
                checked={settings.notifyLeaveByEnabled !== false}
                onCheckedChange={(v) => setSettings({ ...settings, notifyLeaveByEnabled: v })}
              />
            </div>

            {settings.notifyLeaveByEnabled !== false && (
              <div className="space-y-2 pl-2">
                {/* Show computed walk time if home + mosque set */}
                {settings.homeLat && settings.homeLng && settings.selectedMosqueLat && settings.selectedMosqueLng ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground">
                      ~<strong>{Math.ceil(settings.selectedMosqueDistance / (settings.walkingSpeed / 60))} min</strong> walk
                      · {settings.selectedMosqueDistance.toFixed(2)} km from home
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Set your home address to see your calculated walk time</span>
                    <Link to="/settings" className="text-primary font-semibold ml-auto shrink-0">Set address</Link>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">
                    Notify <strong className="text-foreground">{settings.notifyMinutesBefore ?? 5} min</strong> before leave time
                  </label>
                  <input
                    type="range" min="0" max="30" step="5"
                    value={settings.notifyMinutesBefore ?? 5}
                    onChange={(e) => setSettings({ ...settings, notifyMinutesBefore: parseInt(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>At leave time</span><span>5 min</span><span>15 min</span><span>30 min</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Prayer-time reminder ── */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🕐</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Prayer-time reminder</p>
                  <p className="text-[11px] text-muted-foreground">Notify before each prayer starts</p>
                </div>
              </div>
              <Switch
                checked={settings.notifyPrayerTimeEnabled !== false}
                onCheckedChange={(v) => setSettings({ ...settings, notifyPrayerTimeEnabled: v })}
              />
            </div>

            {settings.notifyPrayerTimeEnabled !== false && (
              <div className="pl-2">
                <label className="text-xs text-muted-foreground block mb-1.5">
                  Notify <strong className="text-foreground">{settings.notifyMinutesBeforePrayer ?? 10} min</strong> before prayer starts
                </label>
                <input
                  type="range" min="0" max="30" step="5"
                  value={settings.notifyMinutesBeforePrayer ?? 10}
                  onChange={(e) => setSettings({ ...settings, notifyMinutesBeforePrayer: parseInt(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>At prayer time</span><span>5 min</span><span>15 min</span><span>30 min</span>
                </div>
              </div>
            )}
          </div>

          {/* Per-prayer toggles */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active prayers</p>
            {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => {
              const key = `prayer_${prayer.toLowerCase()}` as keyof typeof settings;
              const enabled = settings[key] !== false;
              return (
                <div key={prayer} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{prayer}</span>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(v) => setSettings({ ...settings, [key]: v })}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite Mosques & Priority */}
        {savedMosques.length > 0 && (
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" /> Favorite Mosques
            </h2>
            <p className="text-sm text-muted-foreground">
              Mark mosques as favorites and set their priority. Prayer dropdowns use your favorites list.
            </p>

            {/* All saved mosques — toggle favorite + reorder */}
            <div className="space-y-2">
              {savedMosques.map((m) => {
                const favIdx = favoriteMosques.findIndex((f) => f.id === m.id);
                const isFav = m.isFavorite;
                return (
                  <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isFav ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    {/* Priority up/down — only shown for favorites */}
                    {isFav && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleReorder(m.id, "up")}
                          disabled={favIdx === 0}
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorder(m.id, "down")}
                          disabled={favIdx === favoriteMosques.length - 1}
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Mosque icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${isFav ? "bg-gradient-gold" : "bg-muted"}`}>
                      {isFav ? <Heart className="w-4 h-4 text-foreground" fill="currentColor" /> : "🕌"}
                    </div>

                    {/* Name + info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.distanceKm.toFixed(2)} km
                        {m.isPrimary && <span className="ml-1.5 text-primary font-medium">★ Primary</span>}
                        {isFav && <span className="ml-1.5 text-primary/70">Priority #{favIdx + 1}</span>}
                      </p>
                    </div>

                    {/* Favorite toggle */}
                    <button
                      onClick={() => handleToggleFavorite(m.id)}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                        isFav
                          ? "border-primary text-primary bg-primary/5 hover:bg-primary/10"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                      }`}
                      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                      {isFav ? "Unfavorite" : "Favorite"}
                    </button>
                  </div>
                );
              })}
            </div>

            {favoriteMosques.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                Tap "Favorite" on any mosque above to add it to your favorites list.
              </p>
            )}
          </div>
        )}

        {/* Per-prayer mosque assignment — sourced from favorites */}
        {savedMosques.length > 1 && (
          <div className="glass-card p-5 space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Mosque per Prayer
            </h2>
            <p className="text-sm text-muted-foreground">
              Assign a specific mosque for each prayer.
              {favoriteMosques.length > 0 ? " Favorites are listed first." : " Mark mosques as favorites above to pin them here."}
            </p>
            {(settings.prayerPreferences || ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]).map((prayer) => {
              // Dropdown: favorites first, then remaining saved
              const dropdownMosques = [
                ...favoriteMosques,
                ...savedMosques.filter((m) => !m.isFavorite),
              ];
              return (
                <div key={prayer} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground shrink-0">{prayer}</span>
                  <select
                    value={settings.prayerMosques?.[prayer] || ""}
                    onChange={(e) => {
                      const prayerMosques = { ...(settings.prayerMosques || {}), [prayer]: e.target.value };
                      if (!e.target.value) delete prayerMosques[prayer];
                      setSettings({ ...settings, prayerMosques });
                    }}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring max-w-[200px]"
                  >
                    <option value="">Primary mosque</option>
                    {favoriteMosques.length > 0 && (
                      <optgroup label="⭐ Favorites">
                        {favoriteMosques.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.distanceKm.toFixed(1)} km)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {savedMosques.filter((m) => !m.isFavorite).length > 0 && (
                      <optgroup label="All saved">
                        {savedMosques.filter((m) => !m.isFavorite).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.distanceKm.toFixed(1)} km)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {/* Home Address */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" /> Home Address
          </h2>
          <p className="text-sm text-muted-foreground">
            Used to calculate walking distances to mosques.
            {settings.homeAddress && (
              <span className="block mt-1 font-medium text-foreground">Current: {settings.homeAddress}</span>
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!navigator.geolocation) {
                toast({ title: "Not available", description: "Your browser doesn't support location.", variant: "destructive" });
                return;
              }
              setHomeLocating(true);
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const { latitude, longitude } = pos.coords;
                  // Validate coords
                  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
                      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                    toast({ title: "Invalid GPS coordinates", variant: "destructive" });
                    setHomeLocating(false);
                    return;
                  }
                  try {
                    const res = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
                    );
                    const data = await res.json();
                    const addr = data.display_name?.split(",").slice(0, 3).join(",") || "Current Location";
                    setSettings((s) => ({
                      ...s,
                      homeAddress: addr,
                      homeLat: latitude,
                      homeLng: longitude,
                    }));
                    // Recalculate all mosque distances from new home
                    saveSettings({ homeAddress: addr, homeLat: latitude, homeLng: longitude });
                    recomputeMosqueDistancesFromHome();
                    setSavedMosques(getSavedMosques());
                    toast({ title: "✅ Home address detected!", description: addr });
                  } catch {
                    setSettings((s) => ({
                      ...s,
                      homeAddress: "Current Location",
                      homeLat: latitude,
                      homeLng: longitude,
                    }));
                    saveSettings({ homeAddress: "Current Location", homeLat: latitude, homeLng: longitude });
                    recomputeMosqueDistancesFromHome();
                    setSavedMosques(getSavedMosques());
                  }
                  setHomeLocating(false);
                },
                () => {
                  toast({ title: "Location denied", description: "Please enable location or search manually.", variant: "destructive" });
                  setHomeLocating(false);
                }
              );
            }}
            disabled={homeLocating}
            className="w-full"
          >
            <Locate className="w-4 h-4 mr-2" />
            {homeLocating ? "Detecting..." : "Detect My Home Address"}
          </Button>

          {/* Address search using fetchLocationSuggestions with bias toward city */}
          <HomeAddressSearch
            currentSettings={settings}
            onSelect={(addr, lat, lng) => {
              setSettings((s) => ({ ...s, homeAddress: addr, homeLat: lat, homeLng: lng }));
              saveSettings({ homeAddress: addr, homeLat: lat, homeLng: lng });
              recomputeMosqueDistancesFromHome();
              setSavedMosques(getSavedMosques());
              toast({ title: "✅ Home address updated!", description: addr });
            }}
          />
        </div>

        {/* Age, Gender, Body weight (for health recommendations and advanced metrics) */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Health Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Used for personalized daily step recommendations on the Stats page. Optional weight improves calorie estimates when Advanced metrics is on.
          </p>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Age (years)</label>
            <input
              type="number"
              min={AGE_MIN}
              max={AGE_MAX}
              placeholder={`e.g. 30 (${AGE_MIN}–${AGE_MAX})`}
              value={settings.age ?? ""}
              onChange={(e) => {
                const raw = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                if (raw === undefined || Number.isNaN(raw)) {
                  setSettings({ ...settings, age: undefined });
                  return;
                }
                const clamped = Math.min(AGE_MAX, Math.max(AGE_MIN, raw));
                if (clamped !== raw) toast({ title: `Age set to ${clamped} (must be ${AGE_MIN}–${AGE_MAX})`, variant: "default" });
                setSettings({ ...settings, age: clamped });
              }}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">Ages {AGE_MIN}–{AGE_MAX} for accurate recommendations.</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Body weight (kg, optional)</label>
            <input
              type="number"
              min={BODY_WEIGHT_KG_MIN}
              max={BODY_WEIGHT_KG_MAX}
              step="0.5"
              placeholder="e.g. 70"
              value={settings.bodyWeightKg ?? ""}
              onChange={(e) => {
                const raw = e.target.value === "" ? undefined : parseFloat(e.target.value);
                if (raw === undefined || Number.isNaN(raw)) {
                  setSettings({ ...settings, bodyWeightKg: undefined });
                  return;
                }
                const clamped = Math.min(BODY_WEIGHT_KG_MAX, Math.max(BODY_WEIGHT_KG_MIN, raw));
                setSettings({ ...settings, bodyWeightKg: clamped });
              }}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">Used for calorie estimates when Advanced metrics is on. {BODY_WEIGHT_KG_MIN}–{BODY_WEIGHT_KG_MAX} kg.</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "male" as const, label: "Male" },
                { value: "female" as const, label: "Female" },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSettings({ ...settings, gender: value })}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    settings.gender === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced metrics mode */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Advanced metrics
          </h2>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Enable advanced metrics</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Improves calorie estimates using your weight. Future: stride length, cadence, and gait quality from your walk data.
              </p>
            </div>
            <Switch
              checked={!!settings.advancedMetricsMode}
              onCheckedChange={(checked) => setSettings({ ...settings, advancedMetricsMode: checked })}
              aria-label="Toggle advanced metrics mode"
            />
          </div>
          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
            <li>Calories: weight-adjusted estimate on walk completion when weight is set.</li>
            <li>Planned: stride length (from steps + distance), cadence (steps/min), and gait consistency for a more dignified walk.</li>
          </ul>
        </div>

        {/* Walking speed */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" /> Walking Speed
          </h2>
          <p className="text-sm text-muted-foreground">
            Adjust your average walking pace. This affects time estimates and "Leave by" calculations.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="3"
              max="7"
              step="0.5"
              value={settings.walkingSpeed}
              onChange={(e) => setSettings({ ...settings, walkingSpeed: parseFloat(e.target.value) })}
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-medium text-foreground w-20 text-right">
              {displaySpeed} {speedUnit === "mph" ? "mph" : "km/h"}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Slow (3)</span>
            <span>Average (5)</span>
            <span>Fast (7)</span>
          </div>
        </div>

        {/* Mosque name */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Primary Mosque
          </h2>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Mosque name</label>
            <input
              type="text"
              value={settings.selectedMosqueName}
              onChange={(e) => setSettings({ ...settings, selectedMosqueName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">
              Distance: {distanceUnit === "mi"
                ? `${(settings.selectedMosqueDistance * 0.621371).toFixed(2)} mi`
                : `${settings.selectedMosqueDistance} km`}
            </label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={settings.selectedMosqueDistance}
              onChange={(e) => setSettings({ ...settings, selectedMosqueDistance: parseFloat(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Use the <Link to="/mosques" className="text-primary underline">mosque finder</Link> to get exact distance.
          </p>
        </div>

        {/* Language */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Language
          </h2>
          <p className="text-sm text-muted-foreground">Choose your preferred language.</p>
          <div className="grid grid-cols-2 gap-2">
            {availableLocales.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
                  locale === l.code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Data management */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Data</h2>
          <p className="text-sm text-muted-foreground">
            All data is stored locally on your device. Nothing is sent to external servers.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allKeys = [
                    "mosquesteps_history", "mosquesteps_settings", "mosquesteps_badges",
                    "mosquesteps_onboarded", "mosquesteps_onboarded_date", "mosquesteps_saved_mosques",
                    "mosquesteps_prayer_log", "mosquesteps_checkins", "mosquesteps_goals",
                    "mosquesteps_notifications", "mosquesteps_notification_settings",
                  ];
                  const exportObj: Record<string, unknown> = { exportedAt: new Date().toISOString(), version: 1 };
                  for (const key of allKeys) {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                      try { exportObj[key] = JSON.parse(raw); } catch { exportObj[key] = raw; }
                    }
                  }
                  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `mosquesteps-full-backup-${new Date().toISOString().split("T")[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: "Full backup exported! 📥", description: "All app data (walks, settings, badges, mosques, prayer logs) saved." });
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" /> Export All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Clear all walking history? This cannot be undone.")) {
                    localStorage.removeItem("mosquesteps_history");
                    localStorage.removeItem("mosquesteps_badges");
                    toast({ title: "History cleared", description: "All walking data has been removed." });
                  }
                }}
                className="flex-1"
              >
                Clear History
              </Button>
            </div>

            {/* Import / Restore */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  // Reject files over 10MB to prevent abuse
                  if (file.size > 10 * 1024 * 1024) {
                    toast({ title: "File too large", description: "Backup files must be under 10MB.", variant: "destructive" });
                    return;
                  }
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid format");
                    const knownKeys = [
                      "mosquesteps_history", "mosquesteps_settings", "mosquesteps_badges",
                      "mosquesteps_onboarded", "mosquesteps_onboarded_date", "mosquesteps_saved_mosques",
                      "mosquesteps_prayer_log", "mosquesteps_checkins", "mosquesteps_goals",
                      "mosquesteps_notifications", "mosquesteps_notification_settings",
                    ];
                    // Handle legacy format: { walks: [...], settings: {...} }
                    if (data.walks && !data.mosquesteps_history) {
                      data.mosquesteps_history = data.walks;
                    }
                    if (data.settings && !data.mosquesteps_settings) {
                      data.mosquesteps_settings = data.settings;
                    }
                    let restored = 0;
                    for (const key of knownKeys) {
                      if (data[key] !== undefined) {
                        // Only allow string, array, or plain object values — reject functions/symbols
                        const val = data[key];
                        if (val !== null && typeof val !== "string" && typeof val !== "number" && typeof val !== "boolean" && typeof val !== "object") continue;
                        const value = typeof val === "string" ? val : JSON.stringify(val);
                        // Limit individual value size to 2MB
                        if (value.length > 2 * 1024 * 1024) continue;
                        localStorage.setItem(key, value);
                        restored++;
                      }
                    }
                    if (restored === 0) {
                      toast({ title: "No data found", description: "The file doesn't contain MosqueSteps data.", variant: "destructive" });
                      return;
                    }
                    toast({ title: `Restored ${restored} data items! 🔄`, description: "Reloading to apply changes..." });
                    setTimeout(() => window.location.reload(), 1500);
                  } catch {
                    toast({ title: "Import failed", description: "Invalid file format. Use a MosqueSteps export file.", variant: "destructive" });
                  }
                };
                input.click();
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2 rotate-90" /> Import Backup
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Import a previously exported MosqueSteps backup to restore all your progress, settings, and badges.
            </p>
          </div>
        </div>

      </div>

      {/* Autosave indicator */}
      {showSaved && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-3.5 h-3.5" /> Saved
        </div>
      )}
    </div>
  );
};

export default Settings;
