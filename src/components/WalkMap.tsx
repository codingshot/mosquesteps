import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface WalkMapProps {
  userPosition: { lat: number; lng: number } | null;
  mosquePosition: { lat: number; lng: number } | null;
  walkPath: { lat: number; lng: number }[];
  routeCoords?: [number, number][]; // OSRM route
  isWalking: boolean;
  className?: string;
}

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const mosqueIcon = L.divIcon({
  html: '<div style="font-size:24px;text-align:center">🕌</div>',
  className: "mosque-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const userIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;background:#0D7377;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  className: "user-marker",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function WalkMap({
  userPosition,
  mosquePosition,
  walkPath,
  routeCoords,
  isWalking,
  className = "",
}: WalkMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const mosqueMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const walkLineRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = userPosition || mosquePosition || { lat: 0, lng: 0 };
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update user marker
  useEffect(() => {
    if (!mapRef.current || !userPosition) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng]);
    } else {
      userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], { icon: userIcon }).addTo(mapRef.current);
    }
    if (isWalking) {
      mapRef.current.panTo([userPosition.lat, userPosition.lng], { animate: true });
    }
  }, [userPosition, isWalking]);

  // Update mosque marker
  useEffect(() => {
    if (!mapRef.current || !mosquePosition) return;
    if (mosqueMarkerRef.current) {
      mosqueMarkerRef.current.setLatLng([mosquePosition.lat, mosquePosition.lng]);
    } else {
      mosqueMarkerRef.current = L.marker([mosquePosition.lat, mosquePosition.lng], { icon: mosqueIcon })
        .bindPopup("Mosque")
        .addTo(mapRef.current);
    }
  }, [mosquePosition]);

  // Draw OSRM route
  useEffect(() => {
    if (!mapRef.current) return;
    if (routeLineRef.current) {
      mapRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (routeCoords && routeCoords.length > 1) {
      routeLineRef.current = L.polyline(routeCoords, {
        color: "#0D7377",
        weight: 4,
        opacity: 0.6,
        dashArray: "8, 8",
      }).addTo(mapRef.current);

      if (!isWalking) {
        mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [30, 30] });
      }
    }
  }, [routeCoords, isWalking]);

  // Draw walked path
  useEffect(() => {
    if (!mapRef.current) return;
    if (walkLineRef.current) {
      mapRef.current.removeLayer(walkLineRef.current);
    }
    if (walkPath.length > 1) {
      walkLineRef.current = L.polyline(
        walkPath.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#D4A017", weight: 4, opacity: 0.9 }
      ).addTo(mapRef.current);
    }
  }, [walkPath]);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden border border-border ${className}`}
      style={{ height: "200px" }}
    />
  );
}
