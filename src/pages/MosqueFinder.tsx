import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, MapPin, Footprints, Clock } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { estimateSteps, estimateWalkingTime } from "@/lib/prayer-times";
import logo from "@/assets/logo.png";

// Fix leaflet default icon
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

interface Mosque {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance?: number;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
}

function haversineDistance(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MosqueFinder = () => {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number }>({
    lat: 51.5074,
    lng: -0.1278,
  });
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(loc);
          searchNearbyMosques(loc.lat, loc.lng);
        },
        () => {
          searchNearbyMosques(userPos.lat, userPos.lng);
        }
      );
    }
  }, []);

  const searchNearbyMosques = async (lat: number, lng: number) => {
    setLoading(true);
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
      const results: Mosque[] = data.elements
        .map((el: any) => ({
          id: el.id,
          name: el.tags?.name || "Mosque",
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
        }))
        .filter((m: Mosque) => m.lat && m.lon)
        .map((m: Mosque) => ({
          ...m,
          distance: haversineDistance(lat, lng, m.lat, m.lon),
        }))
        .sort((a: Mosque, b: Mosque) => (a.distance || 0) - (b.distance || 0));
      setMosques(results);
    } catch (e) {
      console.error("Failed to fetch mosques:", e);
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
        searchNearbyMosques(loc.lat, loc.lng);
      }
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <img src={logo} alt="MosqueSteps" className="w-7 h-7" />
            <span className="font-bold">Find Mosques</span>
          </Link>
        </div>

        {/* Search */}
        <div className="container pb-4">
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
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: "40vh" }}>
        <MapContainer
          center={[userPos.lat, userPos.lng]}
          zoom={14}
          className="w-full h-full absolute inset-0"
          style={{ minHeight: "40vh" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={userPos.lat} lng={userPos.lng} />
          {/* User marker */}
          <Marker position={[userPos.lat, userPos.lng]}>
            <Popup>Your location</Popup>
          </Marker>
          {/* Mosque markers */}
          {mosques.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lon]}>
              <Popup>
                <strong>{m.name}</strong>
                <br />
                {m.distance?.toFixed(2)} km away
                <br />
                ~{estimateSteps(m.distance || 0)} steps · {estimateWalkingTime(m.distance || 0)} min
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Mosque list */}
      <div className="container py-4 space-y-2 max-h-[40vh] overflow-y-auto">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {loading ? "Searching..." : `${mosques.length} mosques nearby`}
        </h2>
        {mosques.map((m) => (
          <div key={m.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-teal flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.distance?.toFixed(2)} km away
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1 justify-end">
                <Footprints className="w-3 h-3" /> {estimateSteps(m.distance || 0)} steps
              </p>
              <p className="flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" /> {estimateWalkingTime(m.distance || 0)} min walk
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MosqueFinder;
