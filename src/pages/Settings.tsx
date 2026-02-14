import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Bell, BellOff, Locate, Download, Sun, Moon, Monitor, Ruler, Gauge, Footprints, Home, User, Globe, CheckCircle, Clock, BarChart3, Info } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { getAvailableLocales, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSettings, saveSettings, getSavedMosques, fetchTimezone, AGE_MIN, AGE_MAX, BODY_WEIGHT_KG_MIN, BODY_WEIGHT_KG_MAX, type UserSettings } from "@/lib/walking-history";
import { fetchLocationSuggestions, type LocationSuggestion } from "@/lib/geocode";
import { requestNotificationPermission, isNotificationSupported, getNotificationPermission } from "@/lib/notifications";
import { getRegionalDefaults } from "@/lib/regional-defaults";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [citySearch, setCitySearch] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<LocationSuggestion[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const citySearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [locating, setLocating] = useState(false);
  const [homeLocating, setHomeLocating] = useState(false);
  const { locale, setLocale } = useLocale();
  const availableLocales = getAvailableLocales();

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
          <Link to="/dashboard">
            <ArrowLeft className="w-5 h-5 text-foreground" />
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

        {/* Notifications */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            {notifPermission === "granted" ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            Prayer Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Get reminded when it's time to leave for the mosque based on walking distance.
          </p>
          {isNotificationSupported() ? (
            <>
              <Button
                variant={notifPermission === "granted" ? "outline" : "default"}
                size="sm"
                onClick={handleNotificationToggle}
                className="w-full"
              >
                {notifPermission === "granted" ? "✓ Notifications Enabled" : notifPermission === "denied" ? "🔒 Notifications Blocked" : "Enable Notifications"}
              </Button>
              {notifPermission === "denied" && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium">Notifications are blocked by your browser.</p>
                  <p className="text-xs text-muted-foreground">To re-enable them:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                    <li>Click the 🔒 lock icon in your browser's address bar</li>
                    <li>Find "Notifications" and change it to "Allow"</li>
                    <li>Refresh this page</li>
                  </ol>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      window.location.reload();
                    }}
                  >
                    I've unblocked — Refresh now
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">Notifications not supported on this browser.</p>
          )}
          <div>
            <label className="text-sm text-muted-foreground block mb-2">
              Notify {settings.notifyMinutesBefore ?? 5} minutes before "Leave by" time
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={settings.notifyMinutesBefore ?? 5}
              onChange={(e) => setSettings({ ...settings, notifyMinutesBefore: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>At leave time</span>
              <span>5 min</span>
              <span>15 min</span>
              <span>30 min early</span>
            </div>
          </div>
        </div>

        {/* Per-prayer mosque assignment */}
        {getSavedMosques().length > 1 && (
          <div className="glass-card p-5 space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Mosque per Prayer
            </h2>
            <p className="text-sm text-muted-foreground">
              Assign a different mosque for each prayer. Uses your primary mosque if not set.
            </p>
            {(settings.prayerPreferences || ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]).map((prayer) => (
              <div key={prayer} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{prayer}</span>
                <select
                  value={settings.prayerMosques?.[prayer] || ""}
                  onChange={(e) => {
                    const prayerMosques = { ...(settings.prayerMosques || {}), [prayer]: e.target.value };
                    if (!e.target.value) delete prayerMosques[prayer];
                    setSettings({ ...settings, prayerMosques });
                  }}
                  className="px-2 py-1 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring max-w-[180px]"
                >
                  <option value="">Primary mosque</option>
                  {getSavedMosques().map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.distanceKm.toFixed(1)} km)
                    </option>
                  ))}
                </select>
              </div>
            ))}
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
                  try {
                    const res = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`
                    );
                    const data = await res.json();
                    const addr = data.display_name?.split(",").slice(0, 3).join(",") || "Current Location";
                    setSettings((s) => ({
                      ...s,
                      homeAddress: addr,
                      homeLat: pos.coords.latitude,
                      homeLng: pos.coords.longitude,
                    }));
                    toast({ title: "Home address detected!", description: addr });
                  } catch {
                    setSettings((s) => ({
                      ...s,
                      homeAddress: "Current Location",
                      homeLat: pos.coords.latitude,
                      homeLng: pos.coords.longitude,
                    }));
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or search home address..."
              id="homeSearchInput"
              onKeyDown={async (e) => {
                if (e.key !== "Enter") return;
                const val = (e.target as HTMLInputElement).value;
                if (!val.trim()) return;
                try {
                  const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=1`
                  );
                  const data = await res.json();
                  if (data.length > 0) {
                    setSettings({
                      ...settings,
                      homeAddress: data[0].display_name?.split(",").slice(0, 3).join(",") || val,
                      homeLat: parseFloat(data[0].lat),
                      homeLng: parseFloat(data[0].lon),
                    });
                    toast({ title: "Home address updated!" });
                  }
                } catch {
                  toast({ title: "Search failed", variant: "destructive" });
                }
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
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
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (!data || typeof data !== "object") throw new Error("Invalid format");
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
                        const value = typeof data[key] === "string" ? data[key] : JSON.stringify(data[key]);
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
