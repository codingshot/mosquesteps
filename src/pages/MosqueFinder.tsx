import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Footprints, Clock, Check, Star, Trash2, Home, Navigation, ArrowLeft, Route as RouteIcon } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { estimateSteps, estimateWalkingTime } from "@/lib/prayer-times";
import { fetchWalkingRoute } from "@/lib/routing";
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

const mosqueIcon = L.divIcon({
  html: '<div style="font-size:22px;text-align:center;line-height:1">🕌</div>',
  className: "mosque-marker",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const selectedMosqueIcon = L.divIcon({
  html: '<div style="font-size:28px;text-align:center;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">🕌</div>',
  className: "mosque-marker-selected",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const homeIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#0D7377;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  className: "home-marker",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface Mosque {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
  walkingDistanceKm?: number;
  walkingDurationMin?: number;
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
  const routeLineRef = useRef<L.Polyline | null>(null);
  const homeMarkerRef = useRef<L.Marker | null>(null);

  const defaultLat = settings.cityLat || settings.homeLat || 51.5074;
  const defaultLng = settings.cityLng || settings.homeLng || -0.1278;

  const [userPos, setUserPos] = useState<{ lat: number; lng: number }>({ lat: defaultLat, lng: defaultLng });
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<SavedMosque[]>(getSavedMosques());
  const [activeTab, setActiveTab] = useState<"nearby" | "saved">("nearby");
  const [selectedMosqueId, setSelectedMosqueId] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number; steps: { instruction: string; distance: number }[] } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Home/user marker
    homeMarkerRef.current = L.marker([defaultLat, defaultLng], { icon: homeIcon })
      .addTo(map)
      .bindPopup(settings.homeAddress ? `🏠 ${settings.homeAddress}` : "Your location");

    mapRef.current = map;
    searchNearbyMosques(defaultLat, defaultLng);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // GPS for precise location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(loc);
          if (mapRef.current) {
            mapRef.current.setView([loc.lat, loc.lng], 14);
            if (homeMarkerRef.current) {
              homeMarkerRef.current.setLatLng([loc.lat, loc.lng]);
            }
          }
          searchNearbyMosques(loc.lat, loc.lng);
        },
        () => {}
      );
    }
  }, []);

  // Update map markers when mosques change
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mosques.forEach((m) => {
      const isSelected = m.id === selectedMosqueId;
      const marker = L.marker([m.lat, m.lon], { icon: isSelected ? selectedMosqueIcon : mosqueIcon })
        .addTo(mapRef.current!)
        .bindPopup(
          `<div style="font-size:13px"><strong>${m.name}</strong><br/>${formatDistance(m.distance || 0)} · ~${estimateSteps(m.distance || 0)} steps</div>`
        );
      marker.on("click", () => handleSelectMosque(m));
      markersRef.current.push(marker);
    });
  }, [mosques, selectedMosqueId]);

  const getDistanceOrigin = () => {
    if (settings.homeLat && settings.homeLng) {
      return { lat: settings.homeLat, lng: settings.homeLng };
    }
    return userPos;
  };

  const searchNearbyMosques = async (lat: number, lng: number) => {
    setLoading(true);
    setSearchError(null);
    setSelectedMosqueId(null);
    clearRoute();
    try {
      // Expanded query: node + way + relation, also building=mosque, wider radius
      const query = `
        [out:json][timeout:15];
        (
          node["amenity"="place_of_worship"]["religion"="muslim"](around:8000,${lat},${lng});
          way["amenity"="place_of_worship"]["religion"="muslim"](around:8000,${lat},${lng});
          relation["amenity"="place_of_worship"]["religion"="muslim"](around:8000,${lat},${lng});
          node["building"="mosque"](around:8000,${lat},${lng});
          way["building"="mosque"](around:8000,${lat},${lng});
          node["amenity"="place_of_worship"]["denomination"="sunni"](around:8000,${lat},${lng});
          way["amenity"="place_of_worship"]["denomination"="sunni"](around:8000,${lat},${lng});
          node["amenity"="place_of_worship"]["denomination"="shia"](around:8000,${lat},${lng});
          way["amenity"="place_of_worship"]["denomination"="shia"](around:8000,${lat},${lng});
        );
        out center 50;
      `;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      const origin = getDistanceOrigin();

      // Deduplicate by id
      const seen = new Set<number>();
      const results: Mosque[] = data.elements
        .map((el: any) => ({
          id: el.id,
          name: el.tags?.name || el.tags?.["name:en"] || el.tags?.["name:ar"] || "Mosque",
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
        }))
        .filter((m: Mosque) => {
          if (!m.lat || !m.lon || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        })
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

  const clearRoute = () => {
    if (routeLineRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    setRouteInfo(null);
  };

  const handleSelectMosque = async (mosque: Mosque) => {
    setSelectedMosqueId(mosque.id);
    clearRoute();

    const origin = getDistanceOrigin();

    // Pan map to show both user and mosque
    if (mapRef.current) {
      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [mosque.lat, mosque.lon]
      );
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }

    // Fetch walking route
    setRouteLoading(true);
    try {
      const route = await fetchWalkingRoute(origin.lat, origin.lng, mosque.lat, mosque.lon);
      if (route && mapRef.current) {
        routeLineRef.current = L.polyline(route.coords, {
          color: "#0D7377",
          weight: 4,
          opacity: 0.7,
          dashArray: "8, 8",
        }).addTo(mapRef.current);

        mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] });

        setRouteInfo({
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
          steps: route.steps,
        });

        // Update the mosque's walking distance in the list
        setMosques((prev) =>
          prev.map((m) =>
            m.id === mosque.id
              ? { ...m, walkingDistanceKm: route.distanceKm, walkingDurationMin: route.durationMin }
              : m
          )
        );
      }
    } catch (e) {
      console.error("Route fetch failed:", e);
    } finally {
      setRouteLoading(false);
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
          if (homeMarkerRef.current) {
            homeMarkerRef.current.setLatLng([loc.lat, loc.lng]);
          }
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
    const dist = mosque.walkingDistanceKm || Math.round((mosque.distance || 0.5) * 100) / 100;
    const saved: SavedMosque = {
      id: String(mosque.id),
      name: mosque.name,
      lat: mosque.lat,
      lng: mosque.lon,
      distanceKm: Math.round(dist * 100) / 100,
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
  const selectedMosque = mosques.find((m) => m.id === selectedMosqueId);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-bottom-nav">
      <header className="bg-card border-b border-border">
        <div className="container py-3 flex items-center gap-2">
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-foreground" />
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
        {routeLoading && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-md flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading route...
          </div>
        )}
      </div>

      {/* Route info panel */}
      {selectedMosque && routeInfo && (
        <div className="container py-2">
          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{selectedMosque.name}</span>
              </div>
              <button onClick={() => { setSelectedMosqueId(null); clearRoute(); }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-primary" /> {formatDistance(routeInfo.distanceKm)} walking</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> {routeInfo.durationMin} min</span>
              <span className="flex items-center gap-1"><Footprints className="w-3 h-3 text-primary" /> {estimateSteps(routeInfo.distanceKm).toLocaleString()} steps</span>
            </div>
            {routeInfo.steps.length > 0 && (
              <div className="max-h-20 overflow-y-auto space-y-1 pt-1 border-t border-border/50">
                {routeInfo.steps.slice(0, 6).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                    <span className="w-3.5 h-3.5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="capitalize">{s.instruction} <span className="text-muted-foreground/50">({s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${Math.round(s.distance)}m`})</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="container pt-2">
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
              <p className="text-sm text-muted-foreground text-center py-4">Searching nearby mosques...</p>
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
                <p className="text-xs text-muted-foreground mt-1">Try searching for a different city or area.</p>
              </div>
            )}
            {mosques.map((m) => {
              const saved = isSaved(m.id);
              const isPrimary = primaryId === String(m.id);
              const isSelected = m.id === selectedMosqueId;
              const displayDist = m.walkingDistanceKm || m.distance || 0;
              const displayDuration = m.walkingDurationMin || estimateWalkingTime(m.distance || 0);
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMosque(m)}
                  className={`glass-card p-3 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isPrimary ? "ring-2 ring-primary" : ""
                  } ${isSelected ? "ring-2 ring-gold bg-gold/5" : "hover:bg-muted/50"}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isPrimary ? "bg-gradient-gold" : isSelected ? "bg-gold/20" : "bg-gradient-teal"}`}>
                      {isPrimary ? <Star className="w-4 h-4 text-foreground" /> : <MapPin className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.walkingDistanceKm ? (
                          <><RouteIcon className="w-2.5 h-2.5 inline" /> {formatDistance(m.walkingDistanceKm)} walking · </>
                        ) : (
                          <>{formatDistance(m.distance || 0)} · </>
                        )}
                        <Footprints className="w-2.5 h-2.5 inline" /> {estimateSteps(displayDist).toLocaleString()} · <Clock className="w-2.5 h-2.5 inline" /> {displayDuration} min
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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