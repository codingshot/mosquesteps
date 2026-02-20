import { useEffect, useRef } from "react";
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

/** Big animated "walking person" icon — clearly visible on the map */
function makeUserIcon(isWalking: boolean) {
  const pulse = isWalking
    ? `<div style="
        position:absolute;
        top:-8px;left:-8px;
        width:36px;height:36px;
        border-radius:50%;
        background:rgba(13,115,119,0.25);
        animation:walkPulse 1.2s ease-out infinite;
      "></div>`
    : "";

  return L.divIcon({
    html: `
      <style>
        @keyframes walkPulse {
          0%   { transform:scale(1);   opacity:0.8; }
          100% { transform:scale(2.2); opacity:0;   }
        }
        @keyframes walkBob {
          0%,100% { transform:translateY(0);   }
          50%      { transform:translateY(-3px);}
        }
      </style>
      <div style="position:relative;width:20px;height:20px;">
        ${pulse}
        <div style="
          position:relative;
          width:20px;height:20px;
          border-radius:50%;
          background:#0D7377;
          border:3px solid white;
          box-shadow:0 3px 10px rgba(0,0,0,0.45);
          display:flex;align-items:center;justify-content:center;
          font-size:11px;
          ${isWalking ? "animation:walkBob 0.7s ease-in-out infinite;" : ""}
          z-index:2;
        ">🚶</div>
      </div>`,
    className: "user-walk-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const mosqueIcon = L.divIcon({
  html: `<div style="
    width:36px;height:36px;
    background:#D4A017;
    border:3px solid white;
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
    box-shadow:0 3px 10px rgba(0,0,0,0.4);
  ">🕌</div>`,
  className: "mosque-marker",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const PAN_THROTTLE_MS = 2500;
const USER_OFFSET_FRACTION = 0.38; // user at ~38% from top so more route is visible ahead

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
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const mosqueMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const walkedLineRef = useRef<L.Polyline | null>(null); // greyed-out already-walked portion
  const remainingLineRef = useRef<L.Polyline | null>(null); // bright upcoming portion
  const returnRouteLineRef = useRef<L.Polyline | null>(null);
  const walkLineRef = useRef<L.Polyline | null>(null);
  const stepMarkersRef = useRef<L.Marker[]>([]);
  const distLabelRef = useRef<L.Marker | null>(null);
  const lastPanRef = useRef(0);
  const recenterRequestedRef = useRef(false);

  // ── Initialize map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = userPosition || mosquePosition || { lat: 0, lng: 0 };
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 16,
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── User marker + smooth camera ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userPosition) return;

    const icon = makeUserIcon(isWalking);

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng]);
      userMarkerRef.current.setIcon(icon);
    } else {
      userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], {
        icon,
        zIndexOffset: 1000, // always on top
      }).addTo(mapRef.current);
    }

    // Accuracy circle (subtle, 20 m radius to hint GPS accuracy)
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([userPosition.lat, userPosition.lng]);
    } else {
      accuracyCircleRef.current = L.circle([userPosition.lat, userPosition.lng], {
        radius: 18,
        color: "#0D7377",
        fillColor: "#0D7377",
        fillOpacity: 0.12,
        weight: 1,
        opacity: 0.4,
      }).addTo(mapRef.current);
    }

    // Smooth camera tracking while walking
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
          map.panTo(targetLatLng, { animate: true, duration: 0.5 });
        }
      }
    }
  }, [userPosition, isWalking]);

  // ── Mosque marker ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mosquePosition) return;
    if (mosqueMarkerRef.current) {
      mosqueMarkerRef.current.setLatLng([mosquePosition.lat, mosquePosition.lng]);
    } else {
      mosqueMarkerRef.current = L.marker([mosquePosition.lat, mosquePosition.lng], { icon: mosqueIcon })
        .bindPopup("🕌 Destination Mosque")
        .addTo(mapRef.current);
    }
  }, [mosquePosition]);

  // ── Route split: walked (grey) + remaining (teal dashed) ────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing layers
    if (routeLineRef.current) { mapRef.current.removeLayer(routeLineRef.current); routeLineRef.current = null; }
    if (walkedLineRef.current) { mapRef.current.removeLayer(walkedLineRef.current); walkedLineRef.current = null; }
    if (remainingLineRef.current) { mapRef.current.removeLayer(remainingLineRef.current); remainingLineRef.current = null; }

    if (!routeCoords || routeCoords.length < 2) return;

    if (!isWalking || !userPosition) {
      // Pre-walk: show full dashed preview route
      routeLineRef.current = L.polyline(routeCoords, {
        color: "#0D7377",
        weight: 5,
        opacity: 0.7,
        dashArray: "10, 8",
      }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] });
      return;
    }

    // During walk: split route at closest point to user for visual progress
    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < routeCoords.length; i++) {
      const dlat = routeCoords[i][0] - userPosition.lat;
      const dlng = routeCoords[i][1] - userPosition.lng;
      const d = dlat * dlat + dlng * dlng;
      if (d < minDist) { minDist = d; closestIdx = i; }
    }

    const walked = routeCoords.slice(0, closestIdx + 1);
    const remaining = routeCoords.slice(closestIdx);

    if (walked.length > 1) {
      walkedLineRef.current = L.polyline(walked, {
        color: "#9ca3af",
        weight: 4,
        opacity: 0.55,
      }).addTo(mapRef.current);
    }

    if (remaining.length > 1) {
      remainingLineRef.current = L.polyline(remaining, {
        color: "#0D7377",
        weight: 6,
        opacity: 0.9,
        dashArray: "12, 6",
      }).addTo(mapRef.current);
    }
  }, [routeCoords, isWalking, userPosition?.lat, userPosition?.lng]);

  // ── Return route ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (returnRouteLineRef.current) { mapRef.current.removeLayer(returnRouteLineRef.current); returnRouteLineRef.current = null; }
    if (returnRouteCoords && returnRouteCoords.length > 1) {
      returnRouteLineRef.current = L.polyline(returnRouteCoords, {
        color: "#D4A017",
        weight: 5,
        opacity: 0.8,
        dashArray: "10, 8",
      }).addTo(mapRef.current);
    }
  }, [returnRouteCoords]);

  // ── GPS breadcrumb trail (gold line) ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (walkLineRef.current) { mapRef.current.removeLayer(walkLineRef.current); }
    if (walkPath.length > 1) {
      walkLineRef.current = L.polyline(
        walkPath.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#D4A017", weight: 3, opacity: 0.75 }
      ).addTo(mapRef.current);
    }
  }, [walkPath]);

  // ── Turn markers on route ────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    stepMarkersRef.current.forEach((m) => m.remove());
    stepMarkersRef.current = [];

    if (!routeSteps?.length || !routeCoords?.length || !isWalking) return;

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

      const lower = (step.instruction ?? "").toLowerCase();
      let arrow = "↑";
      if (lower.includes("left")) arrow = "↰";
      else if (lower.includes("right")) arrow = "↱";
      else if (lower.includes("arrive") || isLast) arrow = "🕌";
      else if (lower.includes("depart")) arrow = "▶";

      const size = isCurrent ? 30 : 20;
      const bg = isPast ? "#6b7280" : isCurrent ? "#D4A017" : "#0D7377";
      const icon = L.divIcon({
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${bg};color:white;
          display:flex;align-items:center;justify-content:center;
          font-size:${isCurrent ? 15 : 10}px;
          border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
          opacity:${isPast ? 0.45 : 1};
          ${isCurrent ? "animation:walkPulse 1.5s infinite;" : ""}
        ">${arrow}</div>`,
        className: "step-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([coord[0], coord[1]], { icon, interactive: false }).addTo(mapRef.current!);
      stepMarkersRef.current.push(marker);
    });
  }, [routeSteps, routeCoords, currentStepIdx, isWalking]);

  // ── Distance label near user ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (distLabelRef.current) { distLabelRef.current.remove(); distLabelRef.current = null; }
    if (!isWalking || !userPosition || !mosquePosition) return;

    const R = 6371;
    const dLat = ((mosquePosition.lat - userPosition.lat) * Math.PI) / 180;
    const dLng = ((mosquePosition.lng - userPosition.lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((userPosition.lat * Math.PI) / 180) * Math.cos((mosquePosition.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distText = distKm > 1 ? `${distKm.toFixed(1)} km` : `${Math.round(distKm * 1000)} m`;

    const labelIcon = L.divIcon({
      html: `<div style="
        background:rgba(13,115,119,0.92);
        color:white;padding:3px 10px;
        border-radius:14px;font-size:11px;font-weight:700;
        white-space:nowrap;pointer-events:none;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        border:1.5px solid rgba(255,255,255,0.3);
      ">${distText} to 🕌</div>`,
      className: "dist-label",
      iconAnchor: [-6, 28],
    });

    distLabelRef.current = L.marker([userPosition.lat, userPosition.lng], { icon: labelIcon, interactive: false })
      .addTo(mapRef.current);
  }, [userPosition, mosquePosition, isWalking]);

  // ── Recenter handler ─────────────────────────────────────────────────────────
  const handleRecenter = () => {
    if (!mapRef.current || !userPosition) { onRecenter?.(); return; }
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
        style={{ height: "300px" }}
      />

      {/* Map control overlay (top-right) */}
      {isWalking && (
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-[1000]">
          {(onRecenter || userPosition) && (
            <button
              onClick={handleRecenter}
              className="w-9 h-9 rounded-lg bg-background/95 backdrop-blur border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all"
              title="Re-center map on you"
              aria-label="Re-center map"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ETA badge (top-left) */}
      {isWalking && eta && (
        <div className="absolute top-2 left-2 z-[1000] bg-background/92 backdrop-blur rounded-lg px-2.5 py-1 border border-border shadow-sm">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">ETA</p>
          <p className="text-xs font-bold text-foreground">{eta}</p>
        </div>
      )}

      {/* Direction strip (bottom) */}
      {isWalking && directionOverlay && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-background/96 backdrop-blur rounded-xl px-3 py-2.5 border border-border shadow-lg flex items-center gap-3">
          <span className="text-xs font-bold text-primary shrink-0">{directionOverlay.distance}</span>
          <span className="text-sm font-semibold text-foreground truncate">{directionOverlay.instruction}</span>
        </div>
      )}

      {/* Off-route warning */}
      {isWalking && offRoute && !directionOverlay && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-destructive/90 backdrop-blur rounded-lg px-3 py-2 text-destructive-foreground text-xs font-semibold text-center">
          ⚠️ You're off route — recalculating…
        </div>
      )}
      {isWalking && offRoute && directionOverlay && (
        <div className="absolute bottom-14 left-2 right-2 z-[1000] bg-destructive/90 backdrop-blur rounded-lg px-3 py-2 text-destructive-foreground text-xs font-semibold text-center">
          ⚠️ You're off route — recalculating…
        </div>
      )}

      {/* "Pre-walk" legend when route is shown but walking hasn't started */}
      {!isWalking && routeCoords && routeCoords.length > 1 && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-background/90 backdrop-blur rounded-lg px-2.5 py-1.5 border border-border shadow-sm flex items-center gap-2">
          <span className="inline-block w-5 h-0.5 bg-primary opacity-70 rounded" style={{ borderTop: "2px dashed" }} />
          <span className="text-[10px] text-muted-foreground">Planned route</span>
        </div>
      )}
    </div>
  );
}
