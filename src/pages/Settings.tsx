import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, MapPin, Bell, BellOff, Locate, Download, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSettings, saveSettings, type UserSettings } from "@/lib/walking-history";
import { requestNotificationPermission, isNotificationSupported, getNotificationPermission } from "@/lib/notifications";
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

  const handleSave = () => {
    saveSettings(settings);
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
  };

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citySearch)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setSettings((s) => ({
          ...s,
          cityName: data[0].display_name?.split(",")[0] || citySearch,
          cityLat: loc.lat,
          cityLng: loc.lng,
        }));
        toast({
          title: "City set!",
          description: `Prayer times will be calculated for ${data[0].display_name?.split(",")[0]}`,
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
        // Reverse geocode for city name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || "Current Location";
          setSettings((s) => ({ ...s, cityName: city, cityLat: lat, cityLng: lng }));
          toast({ title: `Location set: ${city}`, description: "Prayer times will use your current location." });
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

      <div className="container py-6 space-y-6 max-w-lg">
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
            <Button
              variant={notifPermission === "granted" ? "outline" : "default"}
              size="sm"
              onClick={handleNotificationToggle}
              className="w-full"
            >
              {notifPermission === "granted" ? "✓ Notifications Enabled" : "Enable Notifications"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">Notifications not supported on this browser.</p>
          )}
        </div>

        {/* Walking speed */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-semibold text-foreground">Walking Speed</h2>
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
            <span className="text-sm font-medium text-foreground w-16 text-right">
              {settings.walkingSpeed} km/h
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
          <h2 className="font-semibold text-foreground">Primary Mosque</h2>
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
              Distance: {settings.selectedMosqueDistance} km
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

        <Button variant="hero" className="w-full" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" /> Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
