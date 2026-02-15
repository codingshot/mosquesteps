import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Footprints, Clock, Check, Star, Trash2, Home, Navigation, ArrowLeft, Route as RouteIcon, Play, Timer, Share2, Copy, X, ExternalLink, CornerDownLeft, CornerDownRight, ArrowUp } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { estimateSteps, estimateWalkingTime, fetchPrayerTimes, calculateLeaveByTime, minutesUntilLeave, getNowInTimezone, type PrayerTime } from "@/lib/prayer-times";
import { fetchWalkingRoute } from "@/lib/routing";
import { getCachedMosques, setCachedMosques, getCachedRoute, setCachedRoute, isOnline } from "@/lib/offline-cache";
import { searchNearbyMosques as fetchMosquesFromOverpass } from "@/lib/mosque-search";
import { fetchLocationSuggestions } from "@/lib/geocode";
import { getIPGeolocation } from "@/lib/prayer-times";
import { formatTime as formatTimeStr, formatSmallDistance, formatMinutes } from "@/lib/regional-defaults";
import {
  saveSettings, getSettings,
  saveMosque, getSavedMosques, removeSavedMosque, setPrimaryMosque,
  type SavedMosque,
} from "@/lib/walking-history";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png?w=256&format=webp";

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

const createMosqueIcon = (name?: string) => L.divIcon({
  html: `<div style="text-align:center;line-height:1"><div style="font-size:22px">🕌</div>${name ? `<div style="font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;background:rgba(255,255,255,0.9);border-radius:3px;padding:0 3px;margin-top:-2px;color:#333;font-weight:600">${name.length > 12 ? name.slice(0, 12) + "…" : name}</div>` : ""}</div>`,
  className: "mosque-marker",
  iconSize: [80, 40],
  iconAnchor: [40, 20],
});

const createSelectedMosqueIcon = (name?: string) => L.divIcon({
  html: `<div style="text-align:center;line-height:1"><div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">🕌</div>${name ? `<div style="font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;background:hsl(174,80%,26%);color:white;border-radius:4px;padding:1px 5px;margin-top:-2px;font-weight:700">${name.length > 15 ? name.slice(0, 15) + "…" : name}</div>` : ""}</div>`,
  className: "mosque-marker-selected",
  iconSize: [100, 48],
  iconAnchor: [50, 24],
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
  const navigate = useNavigate();
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
  const [searchSuggestions, setSearchSuggestions] = useState<{ name: string; lat: number; lng: number; isMyLocation?: boolean }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userPosRef = useRef(userPos);
  const [hasGpsOrIpPosition, setHasGpsOrIpPosition] = useState(false);
  userPosRef.current = userPos;

  // Prayer time state
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [countdown, setCountdown] = useState("");

  // Fetch next prayer time once (use city timezone so upcoming matches city time)
  useEffect(() => {
    const lat = settings.cityLat || defaultLat;
    const lng = settings.cityLng || defaultLng;
    fetchPrayerTimes(lat, lng, undefined, settings.cityTimezone).then((data) => {
      const upcoming = data.prayers.find((p) => !p.isPast);
      if (upcoming) setNextPrayer(upcoming);
      else if (data.prayers.length > 0) setNextPrayer(data.prayers[0]); // wrap to Fajr
    }).catch(() => {});
  }, [settings.cityTimezone]);

  // Update countdown (use city time so it matches prayer times)
  useEffect(() => {
    if (!nextPrayer) return;
    const tz = settings.cityTimezone;
    const update = () => {
      const [h, m] = nextPrayer.time.split(":").map(Number);
      const { hours: nowH, minutes: nowM } = getNowInTimezone(tz);
      let diffMin = h * 60 + m - (nowH * 60 + nowM);
      if (diffMin < 0) diffMin += 24 * 60;
      const hrs = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      setCountdown(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`);
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [nextPrayer, settings.cityTimezone]);

  // Track online status
  const [online, setOnline] = useState(isOnline());
  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => { window.removeEventListener("online", onOn); window.removeEventListener("offline", onOff); };
  }, []);

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

  // Initial center: prefer saved city/home, else IP geolocation (then GPS will override)
  useEffect(() => {
    const hasSaved = settings.cityLat && settings.cityLng || settings.homeLat && settings.homeLng;
    if (hasSaved) return;
    getIPGeolocation().then((ip) => {
      if (!ip || !mapContainerRef.current) return;
      const loc = { lat: ip.lat, lng: ip.lng };
      setUserPos(loc);
      setHasGpsOrIpPosition(true);
      if (mapRef.current) {
        mapRef.current.setView([loc.lat, loc.lng], 14);
        if (homeMarkerRef.current) homeMarkerRef.current.setLatLng([loc.lat, loc.lng]);
        searchNearbyMosques(loc.lat, loc.lng);
      }
    }).catch(() => {});
  }, []);

  // GPS for precise location (overrides IP/saved when available)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(loc);
        setHasGpsOrIpPosition(true);
        if (mapRef.current) {
          mapRef.current.setView([loc.lat, loc.lng], 14);
          if (homeMarkerRef.current) homeMarkerRef.current.setLatLng([loc.lat, loc.lng]);
        }
        searchNearbyMosques(loc.lat, loc.lng);
      },
      () => {}
    );
  }, []);

  // Update map markers when mosques change
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    mosques.forEach((m) => {
      const isSelected = m.id === selectedMosqueId;
      const marker = L.marker([m.lat, m.lon], { icon: isSelected ? createSelectedMosqueIcon(m.name) : createMosqueIcon(m.name) })
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

    const origin = getDistanceOrigin();

    // Show cached results immediately (stale-while-revalidate)
    const cached = getCachedMosques(lat, lng);
    if (cached && cached.length > 0) {
      const withDist = cached
        .map((m) => ({ ...m, distance: haversineDistance(origin.lat, origin.lng, m.lat, m.lon) }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setMosques(withDist);
      if (!isOnline()) { setLoading(false); return; }
    } else if (!isOnline()) {
      setSearchError("You're offline. Connect to the internet to find mosques.");
      setLoading(false);
      return;
    }

    try {
      const results = await fetchMosquesFromOverpass(lat, lng);
      const withDist: Mosque[] = results
        .map((m) => ({ ...m, distance: haversineDistance(origin.lat, origin.lng, m.lat, m.lon) }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setMosques(withDist);

      // Auto-select closest mosque if none is currently selected
      if (withDist.length > 0 && !selectedMosqueId) {
        handleSelectMosque(withDist[0]);
      }

      setCachedMosques(lat, lng, results.map((m) => ({ id: m.id, name: m.name, lat: m.lat, lon: m.lon })));
    } catch (e) {
      console.error("Failed to fetch mosques:", e);
      if (!cached || cached.length === 0) {
        setSearchError("Failed to find mosques. Check your internet connection and try again.");
      }
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

    // Try cached route first, then fetch
    setRouteLoading(true);
    const cachedRoute = getCachedRoute(origin.lat, origin.lng, mosque.lat, mosque.lon);

    const applyRoute = (route: { coords: [number, number][]; distanceKm: number; durationMin: number; steps: { instruction: string; distance: number; duration?: number }[] }) => {
      if (!mapRef.current) return;
      routeLineRef.current = L.polyline(route.coords, {
        color: "#0D7377",
        weight: 4,
        opacity: 0.7,
        dashArray: "8, 8",
      }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] });
      setRouteInfo({ distanceKm: route.distanceKm, durationMin: route.durationMin, steps: route.steps });
      setMosques((prev) =>
        prev.map((m) =>
          m.id === mosque.id ? { ...m, walkingDistanceKm: route.distanceKm, walkingDurationMin: route.durationMin } : m
        )
      );
    };

    // Show cached immediately
    if (cachedRoute) {
      applyRoute(cachedRoute);
      setRouteLoading(false);
      // Revalidate in background if online
      if (isOnline()) {
        fetchWalkingRoute(origin.lat, origin.lng, mosque.lat, mosque.lon).then((fresh) => {
          if (fresh) {
            setCachedRoute(origin.lat, origin.lng, mosque.lat, mosque.lon, fresh);
          }
        }).catch(() => {});
      }
      return;
    }

    try {
      const route = await fetchWalkingRoute(origin.lat, origin.lng, mosque.lat, mosque.lon);
      if (route) {
        applyRoute(route);
        setCachedRoute(origin.lat, origin.lng, mosque.lat, mosque.lon, route);
      } else {
        toast({ title: "Directions unavailable", description: "Route could not be loaded. Try again or use Open in Maps.", variant: "destructive" });
      }
    } catch (e) {
      console.error("Route fetch failed:", e);
      toast({ title: "Directions unavailable", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setRouteLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
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
      } else {
        toast({ title: "Location not found", description: "Try a different search term.", variant: "destructive" });
      }
    } catch (e) {
      console.error("Search failed:", e);
      toast({ title: "Search failed", description: "Check your connection.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete search with debounce (min 2 chars, 8 suggestions, "My location" first when available)
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const list = await fetchLocationSuggestions(value, 8);
        const suggestions: { name: string; lat: number; lng: number; isMyLocation?: boolean }[] = list.map((s) => ({
          name: s.displayName.split(",").slice(0, 3).join(", ").trim(),
          lat: s.lat,
          lng: s.lng,
        }));
        if (hasGpsOrIpPosition) {
          const pos = userPosRef.current;
          suggestions.unshift({
            name: "Use my location",
            lat: pos.lat,
            lng: pos.lng,
            isMyLocation: true,
          });
        }
        setSearchSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch {}
    }, 300);
  };

  const selectSuggestion = (s: { name: string; lat: number; lng: number; isMyLocation?: boolean }) => {
    setSearchQuery(s.isMyLocation ? "My location" : s.name);
    setShowSuggestions(false);
    setUserPos({ lat: s.lat, lng: s.lng });
    if (mapRef.current) {
      mapRef.current.setView([s.lat, s.lng], 14);
      if (homeMarkerRef.current) homeMarkerRef.current.setLatLng([s.lat, s.lng]);
    }
    searchNearbyMosques(s.lat, s.lng);
  };

  // Generate shareable directions text
  const generateDirectionsText = () => {
    if (!routeInfo?.steps?.length || !selectedMosque) return "";
    const origin = settings.homeAddress || "Your location";
    const header = `🕌 Directions to ${selectedMosque.name}\n📍 From: ${origin}\n📏 ${formatDistance(routeInfo.distanceKm)} · ~${routeInfo.durationMin} min walk\n${"─".repeat(30)}\n`;
    const steps = routeInfo.steps.map((s, i) => {
      const dist = s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)}km` : `${Math.round(s.distance)}m`;
      return `${i + 1}. ${s.instruction} (${dist})`;
    }).join("\n");
    return `${header}${steps}\n${"─".repeat(30)}\nGenerated by MosqueSteps 🚶‍♂️`;
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
    <div className="min-h-screen bg-background flex flex-col pb-bottom-nav relative">
      <SEOHead title="Find Mosques Near You" description="Find mosques near you: walking routes, distance, and step estimates. OpenStreetMap. Set your mosque for prayer-time reminders." path="/mosques" />
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
                placeholder="Search mosque, city, or address..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSuggestions(false); setSearchSuggestions([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Autocomplete dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-[9999] overflow-hidden">
                  {searchSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-muted flex items-center gap-2 border-b border-border/50 last:border-b-0"
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} disabled={loading}>Search</Button>
          </div>
          {settings.homeAddress && (
            <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Home className="w-3 h-3" /> Distances from: {settings.homeAddress}
            </p>
          )}
        </div>

        {/* Offline banner */}
        {!online && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <p className="text-xs text-destructive font-medium">Offline — showing cached mosques</p>
          </div>
        )}
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

      {/* Route info panel with prayer + walk action */}
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
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-primary" /> {formatDistance(routeInfo.distanceKm)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> {formatMinutes(routeInfo.durationMin)}</span>
                <span className="flex items-center gap-1"><Footprints className="w-3 h-3 text-primary" /> {estimateSteps(routeInfo.distanceKm).toLocaleString()} steps</span>
              </div>
              {/* Action buttons */}
              <div className="flex gap-0.5">
                <button
                  onClick={() => {
                    const addr = `${selectedMosque.name}, ${selectedMosque.lat.toFixed(6)}, ${selectedMosque.lon.toFixed(6)}`;
                    navigator.clipboard.writeText(addr);
                    toast({ title: "Address copied! 📋" });
                  }}
                  className="p-1.5 rounded hover:bg-muted" title="Copy address"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const text = generateDirectionsText();
                    if (navigator.share) {
                      navigator.share({ title: `Directions to ${selectedMosque.name}`, text }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(text);
                      toast({ title: "Directions copied! 📋" });
                    }
                  }}
                  className="p-1.5 rounded hover:bg-muted" title="Share directions"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const dest = `${selectedMosque.lat},${selectedMosque.lon}`;
                    const origin = settings.homeLat ? `${settings.homeLat},${settings.homeLng}` : "";
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    if (isIOS) {
                      window.open(`maps://maps.apple.com/?daddr=${dest}&dirflg=w`, "_blank");
                    } else {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&origin=${origin}&travelmode=walking`, "_blank");
                    }
                  }}
                  className="p-1.5 rounded hover:bg-muted text-primary" title="Open in Maps app"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Route from info */}
            {settings.homeAddress && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5 text-[10px] text-muted-foreground">
                <span>🏠 {settings.homeAddress}</span>
                <span>→</span>
                <span>🕌 {selectedMosque.name}</span>
              </div>
            )}

            {/* Next prayer + leave-by time */}
            {nextPrayer && (
              <div className="bg-primary/5 rounded-lg px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-foreground">
                      {nextPrayer.name} at {formatTimeStr(nextPrayer.time, settings.timeFormat || "24h")}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary">{countdown}</span>
                </div>
                {(() => {
                  const walkMin = estimateWalkingTime(routeInfo.distanceKm, settings.walkingSpeed);
                  const leaveBy = calculateLeaveByTime(nextPrayer.time, walkMin);
                  const minsLeft = minutesUntilLeave(nextPrayer.time, walkMin, settings.cityTimezone);
                  return (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-medium ${minsLeft <= 5 ? "text-destructive" : minsLeft <= 15 ? "text-amber-500" : "text-primary"}`}>
                        Leave by {formatTimeStr(leaveBy, settings.timeFormat || "24h")} ({formatMinutes(minsLeft)} left)
                      </span>
                      <span className="text-muted-foreground">
                        {minsLeft <= 0 ? "⚠️ You should leave now!" : minsLeft <= 5 ? "⚠️ Hurry!" : minsLeft <= walkMin ? `✅ Arrive ${minsLeft - walkMin > 0 ? formatMinutes(minsLeft - walkMin) + " early" : "just in time"}` : `✅ ${formatMinutes(minsLeft)} margin`}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Walk Now button */}
            <Button
              variant="hero"
              className="w-full"
              onClick={() => {
                handleSaveMosque(selectedMosque, true);
                navigate("/walk");
              }}
            >
              <Play className="w-4 h-4 mr-1.5" /> Walk There Now
            </Button>

            {routeInfo.steps.length > 0 && (
              <div className="max-h-24 overflow-y-auto space-y-1 pt-1 border-t border-border/50">
                {routeInfo.steps.map((s, i) => {
                  const isLast = i === routeInfo.steps.length - 1;
                  const lower = s.instruction.toLowerCase();
                  const getIcon = () => {
                    if (lower.includes("left")) return <CornerDownLeft className="w-3 h-3 text-primary" />;
                    if (lower.includes("right")) return <CornerDownRight className="w-3 h-3 text-primary" />;
                    if (lower.includes("arrive") || lower.includes("destination")) return <MapPin className="w-3 h-3 text-gold" />;
                    return <ArrowUp className="w-3 h-3 text-primary" />;
                  };
                  const distUnit = settings.smallDistanceUnit || "m";
                  return (
                    <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isLast ? "bg-gold/20" : "bg-primary/10"
                        }`}>
                          {isLast ? "🕌" : getIcon()}
                        </div>
                        {!isLast && <div className="w-px h-2 bg-border mt-0.5" />}
                      </div>
                      <span className="capitalize">
                        {s.instruction}
                        <span className="text-muted-foreground/50 ml-1">
                          ({formatSmallDistance(s.distance, distUnit)})
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prayer countdown corner badge (when no mosque selected) */}
      {!selectedMosque && nextPrayer && (
        <div className="absolute top-[calc(35vh+4rem)] right-3 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 shadow-md">
          <p className="text-[10px] text-muted-foreground">{nextPrayer.name}</p>
          <p className="text-sm font-bold text-primary">{countdown}</p>
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
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card p-3 flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-lg bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-muted rounded w-3/4" />
                      <div className="h-2.5 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-7 w-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
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