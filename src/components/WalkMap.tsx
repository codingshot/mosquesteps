import { useEffect, useRef, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { calcBearing, smoothHeading, findClosestRouteIndex, routeProgress, simplifyRoute, haversineKm, formatDistanceLabel } from "@/lib/geo-utils";
import { getTileConfig, isDarkMode } from "@/lib/map-tiles";

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
  /** Compass heading in degrees (0=north, 90=east). Controls pin direction arrow. */
  deviceHeading?: number | null;
  /** Compact direction overlay at bottom of map (e.g. "In 150 m · Turn left") */
  directionOverlay?: { distance: string; instruction: string };
  /** GPS accuracy in meters — used for accuracy circle radius */
  gpsAccuracy?: number;
  /** Callback with route completion percentage (0-100) */
  onProgress?: (pct: number) => void;
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

/**
 * User position pin: large pulsing circle + 🚶 emoji + optional heading arrow.
 */
function makeUserIcon(isWalking: boolean, heading?: number | null) {
  const showHeading = isWalking && heading != null && Number.isFinite(heading);
  const pulse = isWalking
    ? `<div style="
        position:absolute;
        top:-14px;left:-14px;
        width:48px;height:48px;
        border-radius:50%;
        background:rgba(13,115,119,0.22);
        animation:walkPulse 1.4s ease-out infinite;
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;
        top:-8px;left:-8px;
        width:36px;height:36px;
        border-radius:50%;
        background:rgba(13,115,119,0.14);
        animation:walkPulse 1.4s ease-out 0.5s infinite;
        pointer-events:none;
      "></div>`
    : "";

  const headingArrow = showHeading
    ? `<div style="
        position:absolute;
        top:-22px;left:50%;transform:translateX(-50%) rotate(${heading}deg);
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-bottom:14px solid #0D7377;
        filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));
        pointer-events:none;
      "></div>`
    : "";

  return L.divIcon({
    html: `
      <style>
        @keyframes walkPulse {
          0%   { transform:scale(1);   opacity:0.9; }
          100% { transform:scale(2.4); opacity:0;   }
        }
        @keyframes walkBob {
          0%,100% { transform:translateY(0)   scale(1);    }
          50%      { transform:translateY(-4px) scale(1.05); }
        }
      </style>
      <div style="position:relative;width:20px;height:20px;">
        ${pulse}
        ${headingArrow}
        <div style="
          position:relative;
          width:26px;height:26px;
          top:-3px;left:-3px;
          border-radius:50%;
          background:linear-gradient(135deg,#0D7377,#14a0a5);
          border:3px solid white;
          box-shadow:0 4px 14px rgba(0,0,0,0.5),0 0 0 2px rgba(13,115,119,0.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;
          ${isWalking ? "animation:walkBob 0.75s ease-in-out infinite;" : ""}
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
    width:40px;height:40px;
    background:linear-gradient(135deg,#D4A017,#c48f0d);
    border:3px solid white;
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-size:20px;
    box-shadow:0 4px 14px rgba(0,0,0,0.45),0 0 0 2px rgba(212,160,23,0.3);
  ">🕌</div>`,
  className: "mosque-marker",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

/** Arrival proximity ring icon - pulsing circle around mosque */
function makeArrivalRingIcon(radiusM: number, isArriving: boolean) {
  const size = Math.min(200, Math.max(60, radiusM * 2));
  return L.divIcon({
    html: `<div style="
      position:relative;
      width:${size}px;height:${size}px;
    ">
      <div style="
        position:absolute;
        width:100%;height:100%;
        border-radius:50%;
        border:3px ${isArriving ? 'solid' : 'dashed'} ${isArriving ? '#D4A017' : 'rgba(212,160,23,0.5)'};
        background:${isArriving ? 'rgba(212,160,23,0.15)' : 'rgba(212,160,23,0.05)'};
        ${isArriving ? 'animation:arrivalPulse 1.2s ease-out infinite;' : ''}
        box-sizing:border-box;
      "></div>
      <style>
        @keyframes arrivalPulse {
          0% { transform:scale(1); opacity:1; }
          100% { transform:scale(1.3); opacity:0; }
        }
      </style>
    </div>`,
    className: "arrival-ring",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const PAN_THROTTLE_MS = 1200;
const USER_OFFSET_FRACTION = 0.3;

export default function WalkMap({
  userPosition,
  mosquePosition,
  walkPath,
  routeCoords: rawRouteCoords,
  returnRouteCoords,
  routeSteps,
  currentStepIdx = 0,
  isWalking,
  offRoute,
  eta,
  deviceHeading,
  directionOverlay,
  gpsAccuracy,
  onProgress,
  className = "",
  onRecenter,
}: WalkMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const mosqueMarkerRef = useRef<L.Marker | null>(null);
  const arrivalRingRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const walkedLineRef = useRef<L.Polyline | null>(null);
  const remainingLineRef = useRef<L.Polyline | null>(null);
  const returnRouteLineRef = useRef<L.Polyline | null>(null);
  const walkLineRef = useRef<L.Polyline | null>(null);
  const stepMarkersRef = useRef<L.Marker[]>([]);
  const distLabelRef = useRef<L.Marker | null>(null);
  const progressLabelRef = useRef<L.Marker | null>(null);
  const progressPulseRef = useRef<L.Marker | null>(null);
  const midpointLabelRef = useRef<L.Marker | null>(null);
  const lastPanRef = useRef(0);
  const recenterRequestedRef = useRef(false);
  const smoothedHeadingRef = useRef<number | null>(null);
  const lastThemeRef = useRef<boolean>(isDarkMode());

  // Simplify long routes for performance (>200 points → reduce)
  const routeCoords = useMemo(() => {
    if (!rawRouteCoords) return undefined;
    return rawRouteCoords.length > 200
      ? simplifyRoute(rawRouteCoords, 0.00003)
      : rawRouteCoords;
  }, [rawRouteCoords]);

  // ── Initialize map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = userPosition || mosquePosition || { lat: 0, lng: 0 };
    const tileConfig = getTileConfig();

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: false })
      .addAttribution(tileConfig.attribution)
      .addTo(map);

    const tileLayer = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: "",
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-switch tiles on theme change (MutationObserver — no polling) ──────
  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      const dark = isDarkMode();
      if (dark !== lastThemeRef.current && mapRef.current && tileLayerRef.current) {
        lastThemeRef.current = dark;
        const config = getTileConfig();
        tileLayerRef.current.setUrl(config.url);
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // ── User marker + smoothed heading + camera ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userPosition) return;

    // Smooth heading to reduce jitter
    const rawHeading = deviceHeading ?? null;
    if (rawHeading != null && Number.isFinite(rawHeading)) {
      smoothedHeadingRef.current = smoothHeading(smoothedHeadingRef.current, rawHeading, 0.25);
    }
    const heading = smoothedHeadingRef.current;

    const icon = makeUserIcon(isWalking, heading);

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng]);
      userMarkerRef.current.setIcon(icon);
    } else {
      userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], {
        icon,
        zIndexOffset: 1500,
      }).addTo(mapRef.current);
    }

    // GPS accuracy circle — use real accuracy when available, fallback to 18m
    const accuracyRadius = gpsAccuracy && Number.isFinite(gpsAccuracy) && gpsAccuracy > 0
      ? Math.min(gpsAccuracy, 200) // cap at 200m to prevent huge circles
      : 18;

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([userPosition.lat, userPosition.lng]);
      accuracyCircleRef.current.setRadius(accuracyRadius);
    } else {
      accuracyCircleRef.current = L.circle([userPosition.lat, userPosition.lng], {
        radius: accuracyRadius,
        color: "#0D7377",
        fillColor: "#0D7377",
        fillOpacity: 0.1,
        weight: 1.5,
        opacity: 0.5,
      }).addTo(mapRef.current);
    }

    // Route progress callback
    if (isWalking && routeCoords && routeCoords.length > 1 && onProgress) {
      const pct = routeProgress(routeCoords, userPosition.lat, userPosition.lng);
      onProgress(pct);
    }

    // Smooth camera tracking
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
          if (Math.abs(deltaY) > 15) {
            const targetPoint = L.point(userPoint.x, userPoint.y + deltaY);
            const targetLatLng = map.containerPointToLatLng(targetPoint);
            map.panTo(targetLatLng, { animate: true, duration: 0.6, easeLinearity: 0.4 });
          }
        }
      }
    }

    // POV-style rotation with smoothed heading
    if (isWalking && containerRef.current) {
      let mapHeading: number | null = heading;

      // Fallback: bearing from user to next route point
      if (mapHeading == null && routeCoords && routeCoords.length > 2) {
        const { index: closestIdx } = findClosestRouteIndex(routeCoords, userPosition.lat, userPosition.lng);
        const lookAhead = Math.min(closestIdx + 5, routeCoords.length - 1);
        if (lookAhead > closestIdx) {
          mapHeading = calcBearing(userPosition.lat, userPosition.lng, routeCoords[lookAhead][0], routeCoords[lookAhead][1]);
        }
      }

      if (mapHeading != null && Number.isFinite(mapHeading)) {
        containerRef.current.style.transition = "transform 0.8s cubic-bezier(0.25,0.1,0.25,1)";
        containerRef.current.style.transform = `rotate(${-mapHeading}deg)`;
      }
    } else if (containerRef.current) {
      containerRef.current.style.transition = "transform 0.6s ease-out";
      containerRef.current.style.transform = "rotate(0deg)";
    }
  }, [userPosition, isWalking, deviceHeading, gpsAccuracy]);

  // ── Mosque marker with proximity ring ──────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mosquePosition) return;
    
    // Update mosque marker
    if (mosqueMarkerRef.current) {
      mosqueMarkerRef.current.setLatLng([mosquePosition.lat, mosquePosition.lng]);
    } else {
      mosqueMarkerRef.current = L.marker([mosquePosition.lat, mosquePosition.lng], { icon: mosqueIcon })
        .bindPopup("🕌 Destination Mosque")
        .addTo(mapRef.current);
    }

    // Add arrival proximity ring when walking
    if (arrivalRingRef.current) { 
      arrivalRingRef.current.remove(); 
      arrivalRingRef.current = null; 
    }
    
    if (isWalking && userPosition) {
      const distToMosque = haversineKm(userPosition.lat, userPosition.lng, mosquePosition.lat, mosquePosition.lng);
      const isNearMosque = distToMosque <= 0.1; // 100m arrival radius
      
      // Show arrival ring when within 200m
      if (distToMosque <= 0.2) {
        const ringIcon = makeArrivalRingIcon(100, isNearMosque);
        arrivalRingRef.current = L.marker([mosquePosition.lat, mosquePosition.lng], { 
          icon: ringIcon, 
          interactive: false,
          zIndexOffset: -100 // Behind mosque marker
        }).addTo(mapRef.current);
      }
    }
  }, [mosquePosition, isWalking, userPosition]);

  // ── Route split: walked (grey) + remaining (teal dashed) ────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    if (routeLineRef.current) { mapRef.current.removeLayer(routeLineRef.current); routeLineRef.current = null; }
    if (walkedLineRef.current) { mapRef.current.removeLayer(walkedLineRef.current); walkedLineRef.current = null; }
    if (remainingLineRef.current) { mapRef.current.removeLayer(remainingLineRef.current); remainingLineRef.current = null; }

    if (!routeCoords || routeCoords.length < 2) return;

    if (!isWalking || !userPosition) {
      // Pre-walk: full dashed preview line + responsive fitBounds
      routeLineRef.current = L.polyline(routeCoords, {
        color: "#0D7377",
        weight: 5,
        opacity: 0.8,
        dashArray: "12, 8",
      }).addTo(mapRef.current);

      // Responsive padding based on map size
      const size = mapRef.current.getSize();
      const padX = Math.max(30, Math.min(80, size.x * 0.1));
      const padY = Math.max(30, Math.min(80, size.y * 0.1));
      mapRef.current.fitBounds(routeLineRef.current.getBounds(), {
        padding: [padY, padX],
        maxZoom: 17,
      });
      return;
    }

    // During walk: binary split
    const { index: closestIdx } = findClosestRouteIndex(routeCoords, userPosition.lat, userPosition.lng);
    const splitAt = Math.min(closestIdx + 1, routeCoords.length);
    const walked = routeCoords.slice(0, splitAt);
    const remaining = routeCoords.slice(Math.max(0, splitAt - 1));

    if (walked.length > 1) {
      walkedLineRef.current = L.polyline(walked, {
        color: "#6b7280",
        weight: 3,
        opacity: 0.45,
      }).addTo(mapRef.current);
    }

    if (remaining.length > 1) {
      remainingLineRef.current = L.polyline(remaining, {
        color: "#0D7377",
        weight: 6,
        opacity: 0.95,
        dashArray: "0",
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

  // ── GPS breadcrumb trail (gold line) — throttled to avoid redraw on every position ──
  const lastTrailUpdateRef = useRef(0);
  useEffect(() => {
    if (!mapRef.current) return;
    // Only redraw trail every 2 seconds max
    const now = Date.now();
    if (walkPath.length > 1 && now - lastTrailUpdateRef.current < 2000) return;
    lastTrailUpdateRef.current = now;

    if (walkLineRef.current) { mapRef.current.removeLayer(walkLineRef.current); }
    if (walkPath.length > 1) {
      // Downsample trail for performance when long
      const path = walkPath.length > 200
        ? walkPath.filter((_, i) => i % 3 === 0 || i === walkPath.length - 1)
        : walkPath;
      walkLineRef.current = L.polyline(
        path.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#D4A017", weight: 3, opacity: 0.7 }
      ).addTo(mapRef.current);
    }
  }, [walkPath]);

  // ── Turn markers on route (only rebuild when step index changes) ──────────────
  const lastStepMarkerIdx = useRef(-1);
  useEffect(() => {
    if (!mapRef.current) return;
    // Skip rebuild if only the current step highlight changed
    if (lastStepMarkerIdx.current === currentStepIdx && stepMarkersRef.current.length > 0) {
      // Just update opacity/style of existing markers for perf
      stepMarkersRef.current.forEach((m, i) => {
        const el = m.getElement();
        if (el) {
          el.style.opacity = i < currentStepIdx ? "0.4" : "1";
        }
      });
      return;
    }
    lastStepMarkerIdx.current = currentStepIdx;

    stepMarkersRef.current.forEach((m) => m.remove());
    stepMarkersRef.current = [];

    if (!routeSteps?.length || !routeCoords?.length || !isWalking) return;

    const totalDist = routeSteps.reduce((s, st) => s + (Number.isFinite(st.distance) ? st.distance : 0), 0);
    let accDist = 0;

    routeSteps.forEach((step, i) => {
      accDist += Number.isFinite(step.distance) ? step.distance : 0;

      // Use explicit lat/lng from step if available, else interpolate by distance ratio
      let coord: [number, number];
      if (step.lat != null && step.lng != null && Number.isFinite(step.lat) && Number.isFinite(step.lng)) {
        coord = [step.lat, step.lng];
      } else {
        const ratio = accDist / Math.max(1, totalDist);
        const coordIdx = Math.min(Math.floor(ratio * (routeCoords.length - 1)), routeCoords.length - 1);
        coord = routeCoords[coordIdx];
      }
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

      const size = isCurrent ? 32 : 20;
      const bg = isPast ? "#6b7280" : isCurrent ? "#D4A017" : "#0D7377";
      const icon = L.divIcon({
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${bg};color:white;
          display:flex;align-items:center;justify-content:center;
          font-size:${isCurrent ? 16 : 10}px;
          border:2.5px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);
          opacity:${isPast ? 0.4 : 1};
          ${isCurrent ? "box-shadow:0 0 0 4px rgba(212,160,23,0.35),0 2px 10px rgba(0,0,0,0.4);" : ""}
        ">${arrow}</div>`,
        className: "step-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([coord[0], coord[1]], { icon, interactive: false }).addTo(mapRef.current!);
      stepMarkersRef.current.push(marker);
    });
  }, [routeSteps, routeCoords, currentStepIdx, isWalking]);

  // ── Progress pulse — animated dot on user's closest route point ──────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (progressPulseRef.current) { progressPulseRef.current.remove(); progressPulseRef.current = null; }
    if (!isWalking || !userPosition || !routeCoords || routeCoords.length < 2) return;

    const { index } = findClosestRouteIndex(routeCoords, userPosition.lat, userPosition.lng);
    const coord = routeCoords[index];
    if (!coord) return;

    const pulseIcon = L.divIcon({
      html: `<div style="position:relative;width:16px;height:16px;">
        <div style="
          position:absolute;top:-4px;left:-4px;width:24px;height:24px;
          border-radius:50%;background:rgba(13,115,119,0.25);
          animation:routePulse 1.8s ease-out infinite;
        "></div>
        <div style="
          position:relative;width:16px;height:16px;
          border-radius:50%;background:#0D7377;border:2px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        "></div>
      </div>
      <style>@keyframes routePulse { 0%{transform:scale(1);opacity:0.8;} 100%{transform:scale(2.5);opacity:0;} }</style>`,
      className: "progress-pulse",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    progressPulseRef.current = L.marker([coord[0], coord[1]], { icon: pulseIcon, interactive: false, zIndexOffset: 900 })
      .addTo(mapRef.current);
  }, [userPosition, routeCoords, isWalking]);

  // ── Midpoint distance marker on route ────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (midpointLabelRef.current) { midpointLabelRef.current.remove(); midpointLabelRef.current = null; }
    if (!routeCoords || routeCoords.length < 4 || !mosquePosition || !userPosition) return;
    if (!isWalking) return;

    // Find midpoint of remaining route
    const { index: startIdx } = findClosestRouteIndex(routeCoords, userPosition.lat, userPosition.lng);
    const remaining = routeCoords.slice(startIdx);
    if (remaining.length < 4) return;
    const midIdx = Math.floor(remaining.length / 2);
    const midCoord = remaining[midIdx];
    if (!midCoord) return;

    // Calculate distance from midpoint to mosque
    const distToEnd = haversineKm(midCoord[0], midCoord[1], mosquePosition.lat, mosquePosition.lng);
    const label = formatDistanceLabel(distToEnd);

    const icon = L.divIcon({
      html: `<div style="
        background:rgba(0,0,0,0.65);color:white;padding:2px 8px;
        border-radius:10px;font-size:10px;font-weight:600;
        white-space:nowrap;pointer-events:none;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);
      ">${label}</div>`,
      className: "midpoint-label",
      iconAnchor: [0, -8],
    });

    midpointLabelRef.current = L.marker([midCoord[0], midCoord[1]], { icon, interactive: false, zIndexOffset: 800 })
      .addTo(mapRef.current);
  }, [userPosition, routeCoords, mosquePosition, isWalking]);

  // ── Distance label near user ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (distLabelRef.current) { distLabelRef.current.remove(); distLabelRef.current = null; }
    if (!isWalking || !userPosition || !mosquePosition) return;

    const distKm = haversineKm(userPosition.lat, userPosition.lng, mosquePosition.lat, mosquePosition.lng);
    const distText = formatDistanceLabel(distKm);

    const labelIcon = L.divIcon({
      html: `<div style="
        background:rgba(13,115,119,0.95);
        color:white;padding:3px 10px;
        border-radius:14px;font-size:11px;font-weight:700;
        white-space:nowrap;pointer-events:none;
        box-shadow:0 2px 10px rgba(0,0,0,0.35);
        border:1.5px solid rgba(255,255,255,0.25);
        letter-spacing:0.01em;
      ">${distText} to 🕌</div>`,
      className: "dist-label",
      iconAnchor: [-6, 30],
    });

    distLabelRef.current = L.marker([userPosition.lat, userPosition.lng], { icon: labelIcon, interactive: false })
      .addTo(mapRef.current);
  }, [userPosition, mosquePosition, isWalking]);

  // ── Recenter handler ─────────────────────────────────────────────────────────
  const handleRecenter = useCallback(() => {
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
  }, [userPosition, onRecenter]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`rounded-xl overflow-hidden border border-border ${className}`}
        style={{ height: "320px", transformOrigin: "center center", willChange: "transform" }}
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
          {/* Compass heading indicator */}
          {smoothedHeadingRef.current != null && Number.isFinite(smoothedHeadingRef.current) && (
            <div
              className="w-9 h-9 rounded-lg bg-background/95 backdrop-blur border border-border shadow-lg flex items-center justify-center"
              title={`Heading: ${Math.round(smoothedHeadingRef.current)}°`}
              aria-label={`Compass: ${Math.round(smoothedHeadingRef.current)} degrees`}
            >
              <svg
                width="18" height="18" viewBox="0 0 24 24"
                style={{ transform: `rotate(${smoothedHeadingRef.current}deg)`, transition: "transform 0.4s ease" }}
              >
                <polygon points="12,3 15,12 12,10 9,12" fill="#0D7377"/>
                <polygon points="12,21 9,12 12,14 15,12" fill="#9ca3af"/>
              </svg>
            </div>
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
        <div className="absolute bottom-2 left-2 right-12 z-[1000] bg-background/97 backdrop-blur-md rounded-xl px-3 py-2.5 border border-border shadow-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              {directionOverlay.instruction.toLowerCase().includes("left") ? (
                <><path d="M9 18l-6-6 6-6"/><path d="M21 12H3"/></>
              ) : directionOverlay.instruction.toLowerCase().includes("right") ? (
                <><path d="M15 18l6-6-6-6"/><path d="M3 12h18"/></>
              ) : directionOverlay.instruction.toLowerCase().includes("arriv") ? (
                <><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></>
              ) : (
                <><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>
              )}
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wide leading-none mb-0.5">{directionOverlay.distance}</p>
            <p className="text-sm font-semibold text-foreground truncate leading-snug">{directionOverlay.instruction}</p>
          </div>
        </div>
      )}

      {/* Off-route warning */}
      {isWalking && offRoute && !directionOverlay && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-amber-500/90 backdrop-blur rounded-lg px-3 py-2 text-white text-xs font-semibold text-center shadow-lg">
          ⚠️ Off route — recalculating…
        </div>
      )}
    </div>
  );
}
