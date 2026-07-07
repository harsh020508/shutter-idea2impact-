import { useEffect, useState, useCallback, useRef } from "react";
import { GoogleMap, LoadScriptNext, HeatmapLayer, Marker } from "@react-google-maps/api";
import { MapPin, Crosshair, Loader2 } from "lucide-react";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

// Default center (India)
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

const HEATMAP_DATA = [
  { lat: 19.076, lng: 72.8777, weight: 5 },  // Mumbai
  { lat: 19.08, lng: 72.885, weight: 3 },
  { lat: 19.07, lng: 72.87, weight: 2 },
  { lat: 19.09, lng: 72.89, weight: 4 },
  { lat: 19.065, lng: 72.88, weight: 2 },
  { lat: 28.6139, lng: 77.209, weight: 4 },  // Delhi
  { lat: 28.62, lng: 77.22, weight: 3 },
  { lat: 28.61, lng: 77.2, weight: 2 },
  { lat: 28.63, lng: 77.215, weight: 4 },
  { lat: 12.9716, lng: 77.5946, weight: 5 }, // Bangalore
  { lat: 12.98, lng: 77.6, weight: 4 },
  { lat: 12.965, lng: 77.59, weight: 3 },
  { lat: 12.975, lng: 77.585, weight: 3 },
  { lat: 13.0827, lng: 80.2707, weight: 2 }, // Chennai
  { lat: 17.385, lng: 78.4867, weight: 3 },  // Hyderabad
  { lat: 17.39, lng: 78.495, weight: 2 },
  { lat: 22.5726, lng: 88.3639, weight: 2 }, // Kolkata
  { lat: 18.5204, lng: 73.8567, weight: 3 }, // Pune
  { lat: 18.53, lng: 73.865, weight: 2 },
  { lat: 26.9124, lng: 75.7873, weight: 2 }, // Jaipur
  { lat: 23.2599, lng: 77.4126, weight: 1 }, // Bhopal
  { lat: 21.1458, lng: 79.0882, weight: 1 }, // Nagpur
  { lat: 15.2993, lng: 74.124, weight: 2 },  // Goa
  { lat: 11.9416, lng: 79.8083, weight: 1 }, // Puducherry
  { lat: 9.9252, lng: 78.1198, weight: 2 },  // Madurai
  { lat: 8.5241, lng: 76.9366, weight: 2 },  // Trivandrum
  { lat: 31.1048, lng: 77.1734, weight: 1 }, // Shimla
  { lat: 34.0837, lng: 74.7973, weight: 1 }, // Srinagar
  { lat: 22.7196, lng: 75.8577, weight: 2 }, // Indore
  { lat: 23.0225, lng: 72.5714, weight: 3 }, // Ahmedabad
];

export default function GoogleMapHeatmap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Array<{ location: google.maps.LatLng; weight: number }>>([]);
  const mapRef = useRef<google.maps.Map | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // Get user location
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
          mapRef.current.panTo(loc);
          mapRef.current.setZoom(13);
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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);

    // Build heatmap data
    const data = HEATMAP_DATA.map(
      (p) => ({
        location: new google.maps.LatLng(p.lat, p.lng),
        weight: p.weight,
      })
    );
    setHeatmapData(data);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      {/* Location request overlay */}
      {!userLocation && !locationError && (
        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-3" />
            <p className="text-white text-[14px]">Requesting location access...</p>
          </div>
        </div>
      )}

      {locationError && !userLocation && (
        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
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

      {/* Google Map */}
      {apiKey ? (
        <LoadScriptNext
          googleMapsApiKey={apiKey}
          libraries={["visualization"]}
          loadingElement={
            <div className="w-full h-full flex items-center justify-center bg-[#f8f7f4]">
              <Loader2 className="w-8 h-8 text-[#848281] animate-spin" />
            </div>
          }
        >
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={userLocation || DEFAULT_CENTER}
            zoom={userLocation ? 13 : 5}
            onLoad={onMapLoad}
            options={{
              mapTypeId: "roadmap",
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: true,
              styles: [
                { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
              ],
            }}
          >
            {/* User location marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#ff3e00",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }}
              />
            )}

            {/* Heatmap layer */}
            {mapLoaded && heatmapData.length > 0 && (
              <HeatmapLayer
                data={heatmapData}
                options={{
                  radius: 30,
                  opacity: 0.7,
                  gradient: [
                    "rgba(0, 202, 72, 0)",
                    "rgba(0, 202, 72, 0.4)",
                    "rgba(0, 202, 72, 0.7)",
                    "rgba(255, 187, 38, 0.7)",
                    "rgba(255, 187, 38, 0.9)",
                    "rgba(255, 62, 0, 0.9)",
                    "rgba(255, 62, 0, 1)",
                  ],
                }}
              />
            )}
          </GoogleMap>
        </LoadScriptNext>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#f8f7f4]">
          <div className="text-center px-6">
            <MapPin className="w-10 h-10 text-[#c6c6c6] mx-auto mb-3" />
            <p className="text-[13px] text-[#848281] mb-2">
              Google Maps API key not configured
            </p>
            <p className="text-[11px] text-[#c6c6c6]">
              Add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable the map
            </p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {userLocation && (
        <button
          onClick={requestLocation}
          className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-[#f8f7f4] transition-colors"
          title="My Location"
        >
          <Crosshair className="w-5 h-5 text-[#121212]" />
        </button>
      )}
    </div>
  );
}
