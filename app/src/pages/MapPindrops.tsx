import { useState, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import {
  MapPin,
  Search,
  Plus,
  Flame,
  X,
  Clock,
  TrendingUp,
} from "lucide-react";

// Simulated demand hotspots for map visualization
const HOTSPOTS = [
  { lat: 40, lng: 30, product: "Almond Milk", category: "Dairy Alternatives", count: 42, urgency: "high" as const },
  { lat: 25, lng: 55, product: "Premium Pet Food", category: "Pet Supplies", count: 28, urgency: "medium" as const },
  { lat: 60, lng: 45, product: "Oat Flour", category: "Health Foods", count: 19, urgency: "medium" as const },
  { lat: 45, lng: 70, product: "Organic Honey", category: "Health Foods", count: 35, urgency: "high" as const },
  { lat: 70, lng: 25, product: "Quinoa Grains", category: "Health Foods", count: 15, urgency: "low" as const },
  { lat: 35, lng: 40, product: "Plant Protein", category: "Health Foods", count: 22, urgency: "medium" as const },
  { lat: 55, lng: 65, product: "Almond Milk", category: "Dairy Alternatives", count: 31, urgency: "high" as const },
  { lat: 20, lng: 35, product: "Gluten-Free Bread", category: "Bakery", count: 18, urgency: "medium" as const },
  { lat: 50, lng: 20, product: "Cold Brew Coffee", category: "Beverages", count: 24, urgency: "low" as const },
  { lat: 65, lng: 55, product: "Premium Pet Food", category: "Pet Supplies", count: 29, urgency: "high" as const },
  { lat: 40, lng: 60, product: "Greek Yogurt", category: "Dairy", count: 20, urgency: "medium" as const },
  { lat: 30, lng: 50, product: "Avocado Oil", category: "Staples", count: 16, urgency: "low" as const },
];

export default function MapPindrops() {
  const [showAdd, setShowAdd] = useState(false);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [selectedHotspot, setSelectedHotspot] = useState<(typeof HOTSPOTS)[0] | null>(null);

  const { data: trending } = trpc.pindrop.trending.useQuery({ limit: 10 });

  const createPindrop = trpc.pindrop.create.useMutation({
    onSuccess: () => {
      setShowAdd(false);
      setProductName("");
      setCategory("");
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

  const handleSubmit = () => {
    if (!productName || !category) return;
    createPindrop.mutate({
      productName,
      category,
      latitude: 19.076 + (Math.random() - 0.5) * 0.1,
      longitude: 72.8777 + (Math.random() - 0.5) * 0.1,
      deviceId,
      urgency,
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

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
              <div className="shutter-card p-0 overflow-hidden">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-[#e8f4f8] via-[#f5f0e8] to-[#f0e8f4]">
                  {/* Grid lines */}
                  <div className="absolute inset-0 opacity-20">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={`h${i}`} className="absolute left-0 right-0 h-px bg-[#121212]" style={{ top: `${(i + 1) * 10}%` }} />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={`v${i}`} className="absolute top-0 bottom-0 w-px bg-[#121212]" style={{ left: `${(i + 1) * 10}%` }} />
                    ))}
                  </div>

                  {/* Hotspots */}
                  {HOTSPOTS.map((spot, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedHotspot(spot)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: `${spot.lng}%`, top: `${spot.lat}%` }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg transition-transform group-hover:scale-125 ${
                          spot.urgency === "high"
                            ? "bg-[#ff3e00]"
                            : spot.urgency === "medium"
                            ? "bg-[#ffbb26]"
                            : "bg-[#00ca48]"
                        }`}
                      >
                        {spot.count}
                      </div>
                      <div
                        className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                          spot.urgency === "high"
                            ? "bg-[#ff3e00]"
                            : spot.urgency === "medium"
                            ? "bg-[#ffbb26]"
                            : "bg-[#00ca48]"
                        }`}
                      />
                    </button>
                  ))}

                  {/* Legend */}
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-xl p-3 shadow-sm">
                    <div className="text-[10px] font-medium text-[#848281] mb-1.5">Demand Level</div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff3e00]" />
                        <span className="text-[9px] text-[#848281]">High</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbb26]" />
                        <span className="text-[9px] text-[#848281]">Med</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#00ca48]" />
                        <span className="text-[9px] text-[#848281]">Low</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                          {selectedHotspot.product}
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
                        {selectedHotspot.count} searches
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
                  <div className="space-y-3">
                    {HOTSPOTS.slice(0, 8).map((spot, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-[#f2f0ed] last:border-0"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-[#343433]">
                            {spot.product}
                          </div>
                          <div className="text-[11px] text-[#848281]">{spot.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[13px] font-semibold text-[#ff3e00]">
                            {spot.count}
                          </div>
                          <div className="text-[9px] text-[#c6c6c6]">searches</div>
                        </div>
                      </div>
                    ))}
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
                    <span className="font-medium text-[#343433]">3</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#848281]">Campaigns joined</span>
                    <span className="font-medium text-[#343433]">1</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#848281]">Stores influenced</span>
                    <span className="font-medium text-[#00ca48]">12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Pindrop Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
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
