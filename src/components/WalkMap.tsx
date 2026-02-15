import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RouteStep {
  instruction: string;
  distance: number;
  lat?: number;
  lng?: number;
}

interface WalkMapProps {
  userPosition: { lat: number; lng: number } | null;
  mosquePosition: { lat: number; lng: number } | null;
  walkPath: { lat: number; lng: number }[];
  routeCoords?: [number, number][]; // OSRM route (outbound)
  returnRouteCoords?: [number, number][]; // optional return route to show on success
  routeSteps?: RouteStep[];
  currentStepIdx?: number;
  isWalking: boolean;
  offRoute?: boolean;
  eta?: string;
  /** Compact direction overlay at bottom of map (e.g. "In 150 m · Turn left") */
  directionOverlay?: { distance: string; instruction: string };
  className?: string;
  onRecenter?: () => void;
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

const PAN_THROTTLE_MS = 2500;
const USER_OFFSET_FRACTION = 0.35; // User at 35% from top = more route ahead visible

export default function WalkMap({
  userPosition,
  mosquePosition,
  walkPath,
  routeCoords,
  returnRouteCoords,
  routeSteps,
  currentStepIdx = 0,
  isWalking,
  offRoute,
  eta,
  directionOverlay,
  className = "",
  onRecenter,
}: WalkMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const mosqueMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const returnRouteLineRef = useRef<L.Polyline | null>(null);
  const walkLineRef = useRef<L.Polyline | null>(null);
  const stepMarkersRef = useRef<L.Marker[]>([]);
  const distLabelRef = useRef<L.Marker | null>(null);
  const lastPanRef = useRef(0);
  const recenterRequestedRef = useRef(false);

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

  // Update user marker and camera (route-ahead view when walking)
  useEffect(() => {
    if (!mapRef.current || !userPosition) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng]);
    } else {
      userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], { icon: userIcon }).addTo(mapRef.current);
    }
    if (isWalking) {
      const now = Date.now();
      const shouldPan = recenterRequestedRef.current || now - lastPanRef.current >= PAN_THROTTLE_MS;
      if (shouldPan) {
        const map = mapRef.current;
        const size = map.getSize();
        if (size.x > 0 && size.y > 0) {
          lastPanRef.current = now;
          recenterRequestedRef.current = false;
          const userPoint = map.latLngToContainerPoint([userPosition.lat, userPosition.lng]);
          const targetY = size.y * USER_OFFSET_FRACTION;
          const deltaY = targetY - userPoint.y;
          const targetPoint = L.point(userPoint.x, userPoint.y + deltaY);
          const targetLatLng = map.containerPointToLatLng(targetPoint);
          map.panTo(targetLatLng, { animate: true, duration: 0.4 });
        }
      }
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

  // Draw return route (e.g. on success screen when "Walk back" selected)
  useEffect(() => {
    if (!mapRef.current) return;
    if (returnRouteLineRef.current) {
      mapRef.current.removeLayer(returnRouteLineRef.current);
      returnRouteLineRef.current = null;
    }
    if (returnRouteCoords && returnRouteCoords.length > 1) {
      returnRouteLineRef.current = L.polyline(returnRouteCoords, {
        color: "#D4A017",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(mapRef.current);
    }
  }, [returnRouteCoords]);

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

  // Draw turn markers on route
  useEffect(() => {
    if (!mapRef.current) return;
    // Clear old step markers
    stepMarkersRef.current.forEach((m) => m.remove());
    stepMarkersRef.current = [];

    if (!routeSteps?.length || !routeCoords?.length || !isWalking) return;

    // Map steps to approximate coords along the route
    const totalDist = routeSteps.reduce((s, st) => s + (Number.isFinite(st.distance) ? st.distance : 0), 0);
    let accDist = 0;

    routeSteps.forEach((step, i) => {
      accDist += Number.isFinite(step.distance) ? step.distance : 0;
      const ratio = accDist / Math.max(1, totalDist);
      const coordIdx = Math.min(Math.floor(ratio * (routeCoords.length - 1)), routeCoords.length - 1);
      const coord = routeCoords[coordIdx];
      if (!coord) return;

      const isPast = i < currentStepIdx;
      const isCurrent = i === currentStepIdx;
      const isLast = i === routeSteps.length - 1;

      // Determine icon
      const lower = (step.instruction ?? "").toLowerCase();
      let emoji = "↑";
      if (lower.includes("left")) emoji = "↰";
      else if (lower.includes("right")) emoji = "↱";
      else if (lower.includes("arrive") || isLast) emoji = "🕌";
      else if (lower.includes("depart")) emoji = "▶";

      const icon = L.divIcon({
        html: `<div style="
          width:${isCurrent ? 28 : 20}px;
          height:${isCurrent ? 28 : 20}px;
          border-radius:50%;
          background:${isPast ? '#9ca3af' : isCurrent ? '#D4A017' : '#0D7377'};
          color:white;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${isCurrent ? 14 : 10}px;
          border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          opacity:${isPast ? 0.5 : 1};
          ${isCurrent ? 'animation:pulse 1.5s infinite;' : ''}
        ">${emoji}</div>`,
        className: "step-marker",
        iconSize: [isCurrent ? 28 : 20, isCurrent ? 28 : 20],
        iconAnchor: [isCurrent ? 14 : 10, isCurrent ? 14 : 10],
      });

      const marker = L.marker([coord[0], coord[1]], { icon, interactive: false })
        .addTo(mapRef.current!);
      stepMarkersRef.current.push(marker);
    });
  }, [routeSteps, routeCoords, currentStepIdx, isWalking]);

  // Distance remaining label near user
  useEffect(() => {
    if (!mapRef.current) return;
    if (distLabelRef.current) {
      distLabelRef.current.remove();
      distLabelRef.current = null;
    }
    if (!isWalking || !userPosition || !mosquePosition) return;

    // Haversine for remaining distance
    const R = 6371;
    const dLat = ((mosquePosition.lat - userPosition.lat) * Math.PI) / 180;
    const dLng = ((mosquePosition.lng - userPosition.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((userPosition.lat * Math.PI) / 180) * Math.cos((mosquePosition.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distText = distKm > 1 ? `${distKm.toFixed(1)} km` : `${Math.round(distKm * 1000)} m`;

    const icon = L.divIcon({
      html: `<div style="
        background:rgba(0,0,0,0.75);
        color:white;
        padding:2px 8px;
        border-radius:12px;
        font-size:11px;
        font-weight:600;
        white-space:nowrap;
        pointer-events:none;
      ">${distText} to 🕌</div>`,
      className: "dist-label",
      iconAnchor: [0, -20],
    });

    distLabelRef.current = L.marker([userPosition.lat, userPosition.lng], { icon, interactive: false })
      .addTo(mapRef.current);
  }, [userPosition, mosquePosition, isWalking]);

  const handleRecenter = () => {
    if (!mapRef.current || !userPosition) {
      onRecenter?.();
      return;
    }
    const map = mapRef.current;
    const size = map.getSize();
    const userPoint = map.latLngToContainerPoint([userPosition.lat, userPosition.lng]);
    const targetY = size.y * USER_OFFSET_FRACTION;
    const deltaY = targetY - userPoint.y;
    const targetPoint = L.point(userPoint.x, userPoint.y + deltaY);
    const targetLatLng = map.containerPointToLatLng(targetPoint);
    map.panTo(targetLatLng, { animate: true, duration: 0.5 });
    recenterRequestedRef.current = false;
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`rounded-xl overflow-hidden border border-border ${className}`}
        style={{ height: "280px" }}
      />
      {/* Map overlays */}
      {isWalking && (
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-[1000]">
          {/* Re-center button */}
          {(onRecenter || userPosition) && (
            <button
              onClick={handleRecenter}
              className="w-9 h-9 rounded-lg bg-background/95 backdrop-blur border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all"
              title="Re-center map on you"
              aria-label="Re-center map"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>
            </button>
          )}
        </div>
      )}
      {/* ETA badge */}
      {isWalking && eta && (
        <div className="absolute top-2 left-2 z-[1000] bg-background/90 backdrop-blur rounded-lg px-2.5 py-1 border border-border shadow-sm">
          <p className="text-[10px] text-muted-foreground">ETA</p>
          <p className="text-xs font-bold text-foreground">{eta}</p>
        </div>
      )}
      {/* Direction overlay — compact strip at bottom of map */}
      {isWalking && directionOverlay && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-background/95 backdrop-blur rounded-lg px-3 py-2.5 border border-border shadow-lg flex items-center gap-3">
          <span className="text-xs font-bold text-primary shrink-0">{directionOverlay.distance}</span>
          <span className="text-sm font-medium text-foreground truncate">{directionOverlay.instruction}</span>
        </div>
      )}
      {/* Off-route warning */}
      {isWalking && offRoute && !directionOverlay && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-destructive/90 backdrop-blur rounded-lg px-3 py-2 text-destructive-foreground text-xs font-medium text-center">
          ⚠️ You're off route — recalculating...
        </div>
      )}
      {isWalking && offRoute && directionOverlay && (
        <div className="absolute bottom-14 left-2 right-2 z-[1000] bg-destructive/90 backdrop-blur rounded-lg px-3 py-2 text-destructive-foreground text-xs font-medium text-center">
          ⚠️ You're off route — recalculating...
        </div>
      )}
    </div>
  );
}
