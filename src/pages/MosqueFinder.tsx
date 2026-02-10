import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Footprints, Clock, Check, Star, Trash2, Home } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { estimateSteps, estimateWalkingTime } from "@/lib/prayer-times";
import {
  saveSettings, getSettings,
  saveMosque, getSavedMosques, removeSavedMosque, setPrimaryMosque,
  type SavedMosque,
} from "@/lib/walking-history";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const mosqueIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Mosque {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MosqueFinder = () => {
  const { toast } = useToast();
  const settings = getSettings();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Default to user's saved city, then home, then London
  const defaultLat = settings.cityLat || settings.homeLat || 51.5074;
  const defaultLng = settings.cityLng || settings.homeLng || -0.1278;

  const [userPos, setUserPos] = useState<{ lat: number; lng: number }>({ lat: defaultLat, lng: defaultLng });
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<SavedMosque[]>(getSavedMosques());
  const [activeTab, setActiveTab] = useState<"nearby" | "saved">("nearby");

  // Initialize vanilla Leaflet map — default to user's city
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.marker([defaultLat, defaultLng]).addTo(map).bindPopup(
      settings.homeAddress ? `🏠 ${settings.homeAddress}` : "Your location"
    );

    mapRef.current = map;

    // Auto-search nearby mosques at user's city
    searchNearbyMosques(defaultLat, defaultLng);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Also try GPS for more precise location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(loc);
          if (mapRef.current) {
            mapRef.current.setView([loc.lat, loc.lng], 14);
          }
          searchNearbyMosques(loc.lat, loc.lng);
        },
        () => {
          // GPS denied — already showing city default, do nothing
        }
      );
    }
  }, []);

  // Update map markers when mosques change
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mosques.forEach((m) => {
      const marker = L.marker([m.lat, m.lon], { icon: mosqueIcon })
        .addTo(mapRef.current!)
        .bindPopup(
          `<div style="font-size:13px"><strong>${m.name}</strong><br/>${m.distance?.toFixed(2)} km · ~${estimateSteps(m.distance || 0)} steps · ${estimateWalkingTime(m.distance || 0)} min</div>`
        );
      markersRef.current.push(marker);
    });
  }, [mosques]);

  const getDistanceOrigin = () => {
    // Use home address if set, otherwise user position
    if (settings.homeLat && settings.homeLng) {
      return { lat: settings.homeLat, lng: settings.homeLng };
    }
    return userPos;
  };

  const searchNearbyMosques = async (lat: number, lng: number) => {
    setLoading(true);
    setSearchError(null);
    try {
      const query = `
        [out:json][timeout:10];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lng});
          way["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lng});
        );
        out center 20;
      `;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      const origin = getDistanceOrigin();
      const results: Mosque[] = data.elements
        .map((el: any) => ({
          id: el.id,
          name: el.tags?.name || "Mosque",
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
        }))
        .filter((m: Mosque) => m.lat && m.lon)
        .map((m: Mosque) => ({ ...m, distance: haversineDistance(origin.lat, origin.lng, m.lat, m.lon) }))
        .sort((a: Mosque, b: Mosque) => (a.distance || 0) - (b.distance || 0));
      setMosques(results);
    } catch (e) {
      console.error("Failed to fetch mosques:", e);
      setSearchError("Failed to find mosques. Check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setUserPos(loc);
        if (mapRef.current) {
          mapRef.current.setView([loc.lat, loc.lng], 14);
        }
        searchNearbyMosques(loc.lat, loc.lng);
      }
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMosque = (mosque: Mosque, asPrimary: boolean) => {
    const dist = Math.round((mosque.distance || 0.5) * 100) / 100;
    const saved: SavedMosque = {
      id: String(mosque.id),
      name: mosque.name,
      lat: mosque.lat,
      lng: mosque.lon,
      distanceKm: dist,
      isPrimary: asPrimary,
    };
    saveMosque(saved);
    if (asPrimary) {
      setPrimaryMosque(String(mosque.id));
    }
    setSavedList(getSavedMosques());
    toast({
      title: asPrimary ? `${mosque.name} set as primary! 🕌` : `${mosque.name} saved!`,
      description: `${formatDistance(dist)} · ${estimateSteps(dist)} steps · ${estimateWalkingTime(dist)} min walk`,
    });
  };

  const handleRemoveSaved = (id: string) => {
    removeSavedMosque(id);
    setSavedList(getSavedMosques());
    toast({ title: "Mosque removed" });
  };

  const handleSetPrimary = (id: string) => {
    setPrimaryMosque(id);
    setSavedList(getSavedMosques());
    toast({ title: "Primary mosque updated! 🕌" });
  };

  const formatDistance = (km: number) => {
    const unit = settings.distanceUnit || "km";
    if (unit === "mi") return `${(km * 0.621371).toFixed(2)} mi`;
    return `${km.toFixed(2)} km`;
  };

  const isSaved = (mosqueId: number) => savedList.some((s) => s.id === String(mosqueId));
  const primaryId = savedList.find((s) => s.isPrimary)?.id;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-bottom-nav">
      <header className="bg-card border-b border-border">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold text-foreground">Find Mosques</span>
          </Link>
        </div>
        <div className="container pb-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search location or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>Search</Button>
          </div>
          {settings.homeAddress && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Home className="w-3 h-3" /> Distances from: {settings.homeAddress}
            </p>
          )}
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: "35vh" }}>
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0" style={{ minHeight: "35vh" }} />
      </div>

      {/* Tabs */}
      <div className="container pt-3">
        <div className="flex bg-muted rounded-lg p-1 mb-3">
          <button
            onClick={() => setActiveTab("nearby")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "nearby" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Nearby ({mosques.length})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "saved" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Saved ({savedList.length})
          </button>
        </div>
      </div>

      {/* Mosque list */}
      <div className="container pb-4 space-y-2 max-h-[35vh] overflow-y-auto">
        {activeTab === "nearby" && (
          <>
            {loading && (
              <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
            )}
            {searchError && (
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-destructive mb-1">⚠️ {searchError}</p>
                <p className="text-xs text-muted-foreground">Try searching for a different location.</p>
              </div>
            )}
            {!loading && !searchError && mosques.length === 0 && (
              <div className="glass-card p-6 text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No mosques found nearby.</p>
              </div>
            )}
            {mosques.map((m) => {
              const saved = isSaved(m.id);
              const isPrimary = primaryId === String(m.id);
              return (
                <div key={m.id} className={`glass-card p-3 flex items-center justify-between gap-2 ${isPrimary ? "ring-2 ring-primary" : ""}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPrimary ? "bg-gradient-gold" : "bg-gradient-teal"}`}>
                      {isPrimary ? <Star className="w-4 h-4 text-foreground" /> : <MapPin className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistance(m.distance || 0)} · <Footprints className="w-2.5 h-2.5 inline" /> {estimateSteps(m.distance || 0)} · <Clock className="w-2.5 h-2.5 inline" /> {estimateWalkingTime(m.distance || 0)} min
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!saved && (
                      <Button variant="outline" size="sm" className="text-[10px] h-7 px-2" onClick={() => handleSaveMosque(m, false)}>
                        Save
                      </Button>
                    )}
                    <Button
                      variant={isPrimary ? "outline" : "default"}
                      size="sm"
                      className="text-[10px] h-7 px-2"
                      onClick={() => handleSaveMosque(m, true)}
                    >
                      {isPrimary ? "★ Primary" : "Set Primary"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === "saved" && (
          <>
            {savedList.length === 0 && (
              <div className="glass-card p-6 text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No saved mosques yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Search and save mosques from the Nearby tab.</p>
              </div>
            )}
            {savedList.map((m) => (
              <div key={m.id} className={`glass-card p-3 flex items-center justify-between gap-2 ${m.isPrimary ? "ring-2 ring-primary" : ""}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${m.isPrimary ? "bg-gradient-gold" : "bg-gradient-teal"}`}>
                    {m.isPrimary ? <Star className="w-4 h-4 text-foreground" /> : <MapPin className="w-4 h-4 text-primary-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistance(m.distanceKm)} · {estimateSteps(m.distanceKm)} steps · {estimateWalkingTime(m.distanceKm)} min
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!m.isPrimary && (
                    <Button variant="outline" size="sm" className="text-[10px] h-7 px-2" onClick={() => handleSetPrimary(m.id)}>
                      Set Primary
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-[10px] h-7 w-7 p-0 text-destructive" onClick={() => handleRemoveSaved(m.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default MosqueFinder;
