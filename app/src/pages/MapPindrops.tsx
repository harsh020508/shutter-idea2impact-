import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import GoogleMapHeatmap from "@/components/GoogleMapHeatmap";
import {
  MapPin,
  Search,
  Plus,
  Flame,
  X,
  Clock,
  TrendingUp,
  Crosshair,
} from "lucide-react";

export default function MapPindrops() {
  const [showAdd, setShowAdd] = useState(false);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);

  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data: trending } = trpc.pindrop.trending.useQuery({ limit: 10 });
  const { data: mapPindrops, refetch: refetchPindrops } = trpc.demand.pindropsForMap.useQuery({
    minLat: 8,
    maxLat: 35,
    minLng: 68,
    maxLng: 92,
  });

  const createPindrop = trpc.pindrop.create.useMutation({
    onSuccess: () => {
      setShowAdd(false);
      setProductName("");
      setCategory("");
      setSelectedCoords(null);
      refetchPindrops();
    },
  });

  const deviceId = useMemo(() => {
    let id = localStorage.getItem("shutter_device_id");
    if (!id) {
      id = `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("shutter_device_id", id);
    }
    return id;
  }, []);

  const { data: myPindrops } = trpc.pindrop.myPindrops.useQuery({ deviceId });
  const pindropsPlaced = myPindrops?.length || 0;

  const handleSubmit = () => {
    if (!productName || !category) return;
    
    if (selectedCoords) {
      createPindrop.mutate({
        productName,
        category,
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        deviceId,
        urgency,
      });
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            createPindrop.mutate({
              productName,
              category,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              deviceId,
              urgency,
            });
          },
          (error) => {
            console.error("Geolocation error:", error);
            alert("We need your location or a map selection to drop a pindrop.");
          }
        );
      } else {
        alert("Geolocation is not supported by this browser. Please select a location on the map.");
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      {/* Floating selection banner */}
      {isSelectingLocation && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[10000] bg-white rounded-full shadow-xl border border-[#f2f0ed] px-6 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <span className="text-[13px] font-medium text-[#343433]">
            {selectedCoords 
              ? `Selected: ${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)}`
              : "Click on the map to set pindrop location"}
          </span>
          <div className="flex gap-2">
            {selectedCoords && (
              <button
                onClick={() => {
                  setIsSelectingLocation(false);
                  setShowAdd(true);
                }}
                className="bg-[#121212] text-white px-4 py-1.5 rounded-full text-[12px] font-medium hover:bg-[#343433] transition-colors"
              >
                Confirm
              </button>
            )}
            <button
              onClick={() => {
                setIsSelectingLocation(false);
                setSelectedCoords(null);
                setShowAdd(true);
              }}
              className="bg-[#f8f7f4] text-[#848281] px-4 py-1.5 rounded-full text-[12px] font-medium hover:bg-[#f2f0ed] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <BlobCharacter color="pink" size={56} expression="surprised" delay={1} />
              </div>
              <div>
                <h1 className="shutter-heading text-[32px]" style={{ color: "var(--color-charcoal-primary)" }}>
                  Neighborhood Pulse
                </h1>
                <p className="text-[13px] text-[#848281]">
                  See what products your community is searching for
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="shutter-btn-dark flex items-center gap-2 text-[13px] self-start"
            >
              <Plus className="w-4 h-4" />
              Drop a Pindrop
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Map Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-[#f2f0ed] shadow-sm overflow-hidden" style={{ height: "500px" }}>
                <GoogleMapHeatmap
                  mode="pindrops"
                  pindropsData={mapPindrops || []}
                  selectedPindrop={selectedHotspot}
                  onSelectPindrop={(pindrop) => setSelectedHotspot(pindrop)}
                  onMapClick={(lat, lng) => {
                    if (isSelectingLocation) {
                      setSelectedCoords({ lat, lng });
                    }
                  }}
                  pendingPindropLocation={selectedCoords}
                />
              </div>

              {/* Selected Hotspot Detail */}
              {selectedHotspot && (
                <div className="mt-4 shutter-card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedHotspot.urgency === "high"
                            ? "bg-[#ff3e00]/10"
                            : selectedHotspot.urgency === "medium"
                            ? "bg-[#ffbb26]/10"
                            : "bg-[#00ca48]/10"
                        }`}
                      >
                        <MapPin
                          className={`w-5 h-5 ${
                            selectedHotspot.urgency === "high"
                              ? "text-[#ff3e00]"
                              : selectedHotspot.urgency === "medium"
                              ? "text-[#ffbb26]"
                              : "text-[#00ca48]"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-[#343433]">
                          {selectedHotspot.productName || selectedHotspot.product}
                        </h3>
                        <p className="text-[12px] text-[#848281]">{selectedHotspot.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedHotspot(null)}
                      className="w-7 h-7 rounded-full bg-[#f8f7f4] flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-[#848281]" />
                      <span className="text-[13px] font-medium text-[#ff3e00]">
                        {selectedHotspot.count || 1} searches
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#848281]" />
                      <span className="text-[12px] text-[#848281]">Last 24h</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trending Sidebar */}
            <div>
              <div className="shutter-card mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-4 h-4 text-[#ff3e00]" />
                  <h3 className="text-[15px] font-semibold text-[#343433]">Trending Now</h3>
                </div>

                {trending && trending.length > 0 ? (
                  <div className="space-y-3">
                    {trending.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-[#f2f0ed] last:border-0"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-[#343433]">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-[#848281]">{item.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[13px] font-semibold text-[#ff3e00]">
                            {item.searchCount}
                          </div>
                          <div className="text-[9px] text-[#c6c6c6]">searches</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-[#848281] text-[13px]">
                    No trending searches right now.
                  </div>
                )}
              </div>

              <div className="shutter-card">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#00ca48]" />
                  <h3 className="text-[14px] font-semibold text-[#343433]">Your Impact</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#848281]">Pindrops placed</span>
                    <span className="font-medium text-[#343433]">{pindropsPlaced}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#848281]">Campaigns joined</span>
                    <span className="font-medium text-[#343433]">-</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#848281]">Stores influenced</span>
                    <span className="font-medium text-[#00ca48]">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Pindrop Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-semibold text-[#121212]">Drop a Pindrop</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 rounded-full bg-[#f8f7f4] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="What product do you need?"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Dairy, Health Foods"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Location *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectingLocation(true);
                      setShowAdd(false);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-[#f2f0ed] bg-[#f8f7f4] text-[#343433] text-[13px] font-medium hover:bg-[#f2f0ed] transition-colors"
                  >
                    {selectedCoords
                      ? `📍 Selected: ${selectedCoords.lat.toFixed(4)}, ${selectedCoords.lng.toFixed(4)}`
                      : "📍 Choose on Map"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setSelectedCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                          },
                          (err) => {
                            console.error(err);
                            alert("Geolocation failed.");
                          }
                        );
                      }
                    }}
                    className="px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-[#f8f7f4] text-[#848281] hover:bg-[#f2f0ed] transition-colors flex items-center justify-center"
                    title="Use Current Location"
                  >
                    <Crosshair className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Urgency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => setUrgency(u)}
                      className={`py-2 rounded-xl text-[12px] font-medium capitalize transition-colors ${
                        urgency === u
                          ? u === "high"
                            ? "bg-[#ff3e00] text-white"
                            : u === "medium"
                            ? "bg-[#ffbb26] text-white"
                            : "bg-[#00ca48] text-white"
                          : "bg-[#f8f7f4] text-[#848281] hover:bg-[#f2f0ed]"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!productName || !category || createPindrop.isPending}
                className="w-full shutter-btn-dark py-3 disabled:opacity-50"
              >
                {createPindrop.isPending ? "Dropping..." : "Drop Pindrop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
