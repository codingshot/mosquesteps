import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Bell, Locate, ChevronRight, Check } from "lucide-react";
import { saveSettings, getSettings } from "@/lib/walking-history";
import { requestNotificationPermission, isNotificationSupported } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const ONBOARDING_KEY = "mosquesteps_onboarded";

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

const steps = [
  { id: "welcome", title: "Welcome to MosqueSteps", icon: "🕌" },
  { id: "location", title: "Set Your Location", icon: "📍" },
  { id: "mosque", title: "Your Mosque", icon: "🕌" },
  { id: "notifications", title: "Prayer Reminders", icon: "🔔" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [settings, setSettingsState] = useState(getSettings());
  const [citySearch, setCitySearch] = useState("");
  const [locating, setLocating] = useState(false);

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    saveSettings(settings);
    markOnboardingComplete();
    navigate("/dashboard");
  };

  const skip = () => {
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
          setSettingsState((s) => ({ ...s, cityName: city, cityLat: lat, cityLng: lng }));
          toast({ title: `Location: ${city}` });
        } catch {
          setSettingsState((s) => ({ ...s, cityName: "Current Location", cityLat: lat, cityLng: lng }));
        }
        setLocating(false);
      },
      () => {
        toast({ title: "Location denied", variant: "destructive" });
        setLocating(false);
      }
    );
  };

  const handleCitySearch = async () => {
    if (!citySearch.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citySearch)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const city = data[0].display_name?.split(",")[0] || citySearch;
        setSettingsState((s) => ({
          ...s,
          cityName: city,
          cityLat: parseFloat(data[0].lat),
          cityLng: parseFloat(data[0].lon),
        }));
        toast({ title: `City set: ${city}` });
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Set Your Location</h2>
                  <p className="text-muted-foreground mt-2">
                    So we can show accurate prayer times for your area.
                  </p>
                </div>

                {settings.cityName && (
                  <div className="glass-card p-3 text-center">
                    <p className="text-sm font-medium text-primary">
                      <Check className="w-4 h-4 inline mr-1" /> {settings.cityName}
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleUseLocation}
                  disabled={locating}
                  className="w-full"
                >
                  <Locate className="w-4 h-4 mr-2" />
                  {locating ? "Detecting..." : "Use Current Location"}
                </Button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or search city..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button size="sm" onClick={handleCitySearch}>Search</Button>
                </div>

                <Button variant="hero" onClick={next} className="w-full">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <button onClick={skip} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
                  Skip →
                </button>
              </div>
            )}

            {/* Step 2: Mosque */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🕌</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Your Mosque</h2>
                  <p className="text-muted-foreground mt-2">
                    Set your primary mosque and distance for accurate step tracking.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-1">Mosque name</label>
                    <input
                      type="text"
                      value={settings.selectedMosqueName}
                      onChange={(e) => setSettingsState({ ...settings, selectedMosqueName: e.target.value })}
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
                      onChange={(e) => setSettingsState({ ...settings, selectedMosqueDistance: parseFloat(e.target.value) })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.1 km</span>
                      <span>10 km</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  You can use the <span className="text-primary font-medium">Mosque Finder</span> later for exact distances.
                </p>

                <Button variant="hero" onClick={next} className="w-full">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <button onClick={skip} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
                  Skip →
                </button>
              </div>
            )}

            {/* Step 3: Notifications */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Prayer Reminders</h2>
                  <p className="text-muted-foreground mt-2">
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
