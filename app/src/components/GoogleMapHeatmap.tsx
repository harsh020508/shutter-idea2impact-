import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Crosshair, Loader2 } from "lucide-react";

// ── Leaflet CSS (must be imported before components) ──────────────
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.heat";

// Fix Leaflet default-icon path issue under bundlers (Vite / Webpack)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Constants ─────────────────────────────────────────────────────
const DEFAULT_CENTER: L.LatLngExpression = [19.076, 72.8777]; // Default to Mumbai / India region

// ── User-location marker (pulsing blue dot via SVG) ───────────────
const USER_ICON = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="
        position:absolute;inset:0;
        background:#0090ff;
        border:2.5px solid #fff;
        border-radius:50%;
        box-shadow:0 0 6px rgba(0,144,255,.5);
      "></div>
      <div style="
        position:absolute;inset:-6px;
        border:2px solid rgba(0,144,255,.35);
        border-radius:50%;
        animation:leafletPulse 2s ease-out infinite;
      "></div>
    </div>
    <style>
      @keyframes leafletPulse {
        0%   { transform:scale(.7); opacity:1; }
        100% { transform:scale(2.2); opacity:0; }
      }
    </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Create urgency color-coded icons
function createPindropIcon(urgency: "low" | "medium" | "high", label?: string) {
  const color = urgency === "high" ? "#ff3e00" : urgency === "medium" ? "#ffbb26" : "#00ca48";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="
          position:absolute;inset:0;
          background:${color};
          border:2px solid #fff;
          border-radius:50%;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-size:10px;
          font-weight:bold;
        ">${label || "!"}</div>
        <div style="
          position:absolute;inset:-4px;
          border:2px solid ${color};
          border-radius:50%;
          animation:leafletPulse 2s ease-out infinite;
          opacity: 0.4;
        "></div>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

interface GoogleMapHeatmapProps {
  mode?: "heatmap" | "pindrops";
  heatmapData?: any[];
  pindropsData?: any[];
  onSelectPindrop?: (pindrop: any) => void;
  selectedPindrop?: any;
  onMapClick?: (lat: number, lng: number) => void;
  pendingPindropLocation?: { lat: number; lng: number } | null;
}

export default function GoogleMapHeatmap({
  mode = "heatmap",
  heatmapData,
  pindropsData,
  onSelectPindrop,
  selectedPindrop,
  onMapClick,
  pendingPindropLocation,
}: GoogleMapHeatmapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // ── Get user location ──────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocationError(null);

        // Pan map to user location
        if (mapRef.current) {
          mapRef.current.setView([loc.lat, loc.lng], 13);
        }
      },
      (err) => {
        console.error("Location error:", err);
        setLocationError(
          err.code === 1
            ? "Location permission denied. Using default view."
            : "Could not get your location. Using default view."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // ── Initialise Leaflet map once the container is rendered ──────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const container = mapContainerRef.current;

    const map = L.map(container, {
      center: DEFAULT_CENTER,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersGroupRef.current = L.featureGroup().addTo(map);
    mapRef.current = map;

    // Force Leaflet to recalculate container size after CSS layout settles
    // This prevents the "grey gap" where tiles don't fill the container
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 600),
    ];

    // Also watch for container size changes (e.g. sidebar toggle, window resize)
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    // Cleanup on unmount
    return () => {
      timers.forEach(clearTimeout);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Update Heatmap / Pindrops Layer when props change ──────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old layers
    if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }

    if (mode === "heatmap") {
      const dataPoints: [number, number, number][] = [];
      const items = heatmapData || [];

      items.forEach((item) => {
        const lat = typeof item.latitude === "string" ? parseFloat(item.latitude) : Number(item.latitude);
        const lng = typeof item.longitude === "string" ? parseFloat(item.longitude) : Number(item.longitude);
        const score = typeof item.demandScore === "string" ? parseFloat(item.demandScore) : Number(item.demandScore || 50);

        if (!isNaN(lat) && !isNaN(lng)) {
          dataPoints.push([lat, lng, score / 100]);
        }
      });

      // If we have points, center the map around their average location
      if (dataPoints.length > 0) {
        const bounds = L.latLngBounds(dataPoints.map(p => [p[0], p[1]]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }

      // Add heatmap layer
      const heat = (L as any).heatLayer(dataPoints, {
        radius: 35,
        blur: 25,
        maxZoom: 13,
        max: 1.0,
        gradient: {
          0.0: "rgba(0, 202, 72, 0)",
          0.3: "rgba(0, 202, 72, 0.7)",
          0.5: "rgba(255, 187, 38, 0.7)",
          0.7: "rgba(255, 187, 38, 0.9)",
          0.85: "rgba(255, 62, 0, 0.9)",
          1.0: "rgba(255, 62, 0, 1)",
        },
      });
      heat.addTo(map);
      heatLayerRef.current = heat;

    } else if (mode === "pindrops") {
      const items = pindropsData || [];

      items.forEach((item) => {
        const lat = typeof item.latitude === "string" ? parseFloat(item.latitude) : Number(item.latitude);
        const lng = typeof item.longitude === "string" ? parseFloat(item.longitude) : Number(item.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        const count = item.count || 1;
        const icon = createPindropIcon(item.urgency || "medium", String(count));

        const marker = L.marker([lat, lng], { icon })
          .bindPopup(`
            <div style="font-family:sans-serif;padding:2px;">
              <strong style="font-size:14px;color:#121212;">${item.productName || item.product}</strong>
              <div style="font-size:12px;color:#848281;margin-top:2px;">Category: ${item.category}</div>
              <div style="font-size:12px;color:${item.urgency === "high" ? "#ff3e00" : item.urgency === "medium" ? "#ffbb26" : "#00ca48"};font-weight:bold;margin-top:4px;">
                Urgency: ${item.urgency ? item.urgency.toUpperCase() : "MEDIUM"}
              </div>
              <div style="font-size:11px;color:#c6c6c6;margin-top:4px;">${count} demand signals</div>
            </div>
          `);

        marker.on("click", () => {
          if (onSelectPindrop) {
            onSelectPindrop(item);
          }
        });

        if (markersGroupRef.current) {
          markersGroupRef.current.addLayer(marker);
        }
      });

      // Fit bounds if we have markers
      if (items.length > 0 && markersGroupRef.current) {
        const bounds = markersGroupRef.current.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
        }
      }
    }

    // After any view/bounds change, force tile reload
    setTimeout(() => map.invalidateSize(), 200);
  }, [mode, heatmapData, pindropsData, onSelectPindrop]);

  // ── Pan and Zoom to selected pindrop when it changes ───────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPindrop) return;

    const lat = typeof selectedPindrop.latitude === "string" ? parseFloat(selectedPindrop.latitude) : Number(selectedPindrop.latitude);
    const lng = typeof selectedPindrop.longitude === "string" ? parseFloat(selectedPindrop.longitude) : Number(selectedPindrop.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 14, { animate: true });
    }
  }, [selectedPindrop]);

  // ── Update user marker when location changes ──────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Remove previous marker if present
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: USER_ICON,
      zIndexOffset: 1000,
    })
      .addTo(mapRef.current)
      .bindPopup("Your Current Location");

    userMarkerRef.current = marker;
  }, [userLocation]);

  // ── Handle Map Click event ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [onMapClick]);

  // ── Draw Pending Pindrop Marker ────────────────────────────────
  const pendingMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove();
      pendingMarkerRef.current = null;
    }

    if (pendingPindropLocation) {
      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            <div style="
              position:absolute;inset:0;
              background:#0090ff;
              border:2.5px solid #fff;
              border-radius:50%;
              box-shadow:0 2px 8px rgba(0,144,255,0.5);
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:16px;
            ">📍</div>
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pendingPindropLocation.lat, pendingPindropLocation.lng], { icon })
        .addTo(map)
        .bindPopup("Pindrop Location Chosen!");
      
      pendingMarkerRef.current = marker;
      map.setView([pendingPindropLocation.lat, pendingPindropLocation.lng], map.getZoom());
    }
  }, [pendingPindropLocation]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      {/* Location request overlay */}
      {!userLocation && !locationError && (
        <div className="absolute inset-0 z-[1000] bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-3" />
            <p className="text-white text-[14px]">Requesting location access...</p>
          </div>
        </div>
      )}

      {locationError && !userLocation && (
        <div className="absolute inset-0 z-[1000] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-5 max-w-[300px] text-center mx-4">
            <MapPin className="w-8 h-8 text-[#ff3e00] mx-auto mb-3" />
            <p className="text-[13px] text-[#474645] mb-3">{locationError}</p>
            <button
              onClick={requestLocation}
              className="shutter-btn-dark text-[12px] py-2 px-4"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map container */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Controls overlay */}
      {userLocation && (
        <button
          onClick={requestLocation}
          className="absolute bottom-4 right-4 z-[1000] w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-[#f8f7f4] transition-colors border border-[#f2f0ed]"
          title="My Location"
        >
          <Crosshair className="w-5 h-5 text-[#121212]" />
        </button>
      )}
    </div>
  );
}
