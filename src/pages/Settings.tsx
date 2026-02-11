import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Bell, BellOff, Locate, Download, Sun, Moon, Monitor, Ruler, Gauge, Footprints, Home, User, Globe, CheckCircle, Clock } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { getAvailableLocales, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { getSettings, saveSettings, getSavedMosques, fetchTimezone, type UserSettings } from "@/lib/walking-history";
import { requestNotificationPermission, isNotificationSupported, getNotificationPermission } from "@/lib/notifications";
import { getRegionalDefaults } from "@/lib/regional-defaults";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(getSettings());
  const [citySearch, setCitySearch] = useState("");
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

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citySearch)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        const tz = await fetchTimezone(loc.lat, loc.lng);
        const cityName = data[0].display_name?.split(",")[0] || citySearch;
        const defaults = getRegionalDefaults(cityName, tz || undefined);
        setSettings((s) => ({
          ...s,
          cityName,
          cityLat: loc.lat,
          cityLng: loc.lng,
          ...(tz ? { cityTimezone: tz } : {}),
          // Apply regional defaults only if not explicitly set
          ...(!s.timeFormat ? { timeFormat: defaults.timeFormat } : {}),
          ...(!s.smallDistanceUnit ? { smallDistanceUnit: defaults.smallDistanceUnit } : {}),
        }));
        toast({
          title: "City set!",
          description: `Prayer times will be calculated for ${cityName}${tz ? ` (${tz})` : ""}`,
        });
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
          setSettings((s) => ({ ...s, cityName: city, cityLat: lat, cityLng: lng, ...(tz ? { cityTimezone: tz } : {}) }));
          toast({ title: `Location set: ${city}`, description: `Prayer times will use your current location.${tz ? ` (${tz})` : ""}` });
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
            <label className="text-sm text-muted-foreground block mb-2">
              Stride Length: {(settings.strideLength || 0.75).toFixed(2)} m ({((settings.strideLength || 0.75) * 3.281).toFixed(1)} ft)
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or search city (e.g. London, Makkah)..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
              className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
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

        {/* Age & Gender (for health recommendations) */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Health Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Used to calculate personalized daily step recommendations on the Stats page.
          </p>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Age</label>
            <input
              type="number"
              min="5"
              max="120"
              placeholder="e.g. 30"
              value={settings.age || ""}
              onChange={(e) => setSettings({ ...settings, age: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const history = localStorage.getItem("mosquesteps_history") || "[]";
                const settingsData = localStorage.getItem("mosquesteps_settings") || "{}";
                const exportData = JSON.stringify({ walks: JSON.parse(history), settings: JSON.parse(settingsData) }, null, 2);
                const blob = new Blob([exportData], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `mosquesteps-export-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast({ title: "Data exported! 📥", description: "Your walking data has been saved as JSON." });
              }}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" /> Export Data
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
