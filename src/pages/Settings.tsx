import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSettings, saveSettings, type UserSettings } from "@/lib/walking-history";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(getSettings());

  const handleSave = () => {
    saveSettings(settings);
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container py-4 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
          </Link>
          <span className="font-bold text-foreground">Settings</span>
        </div>
      </header>

      <div className="container py-6 space-y-6 max-w-lg">
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
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Clear all walking history? This cannot be undone.")) {
                localStorage.removeItem("mosquesteps_history");
                toast({ title: "History cleared", description: "All walking data has been removed." });
              }
            }}
          >
            Clear Walking History
          </Button>
        </div>

        <Button variant="hero" className="w-full" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" /> Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
