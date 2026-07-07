import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import GoogleMapHeatmap from "@/components/GoogleMapHeatmap";
import BlobCharacter from "@/components/BlobCharacter";
import {
  MapPin,
  TrendingUp,
  Target,
  Zap,
  ArrowRight,
  Filter,
  BarChart3,
  Loader2,
} from "lucide-react";
import { Navigation as NavIcon } from "lucide-react";

const CATEGORIES = ["All", "Organic Products", "Dairy Alternatives", "Health Foods", "Pet Supplies", "Plant Based"];

const CITY_RANKINGS = [
  { city: "Bangalore", score: 0, pindrops: 0, trend: "up" as const },
  { city: "Mumbai", score: 0, pindrops: 0, trend: "up" as const },
  { city: "Delhi", score: 0, pindrops: 0, trend: "stable" as const },
  { city: "Pune", score: 0, pindrops: 0, trend: "up" as const },
  { city: "Hyderabad", score: 0, pindrops: 0, trend: "up" as const },
  { city: "Chennai", score: 0, pindrops: 0, trend: "stable" as const },
  { city: "Kolkata", score: 0, pindrops: 0, trend: "down" as const },
];

export default function Heatmap() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [computed, setComputed] = useState(false);

  const { data: heatmapData } = trpc.demand.heatmap.useQuery({
    minLat: 8,
    maxLat: 35,
    minLng: 68,
    maxLng: 92,
  });

  const { data: topCategories } = trpc.demand.topCategories.useQuery({ limit: 10 });

  const computeMutation = trpc.demand.computeAggregates.useMutation({
    onSuccess: () => setComputed(true),
  });

  // Request location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
      },
      (err) => {
        if (err.code === 1) setLocError("Location permission denied.");
        else setLocError("Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Trigger compute on mount
  useEffect(() => {
    computeMutation.mutate({});
  }, []);

  // Build city rankings from real data
  const cityRankings = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return CITY_RANKINGS;
    // Group by approximate city regions and aggregate
    const cityMap: Record<string, { score: number; count: number }> = {};
    heatmapData.forEach((d) => {
      const lat = parseFloat(String(d.latitude));
      let city = "Other";
      if (lat >= 18.5 && lat <= 19.5) city = "Mumbai";
      else if (lat >= 28 && lat <= 29) city = "Delhi";
      else if (lat >= 12.5 && lat <= 13.5) city = "Bangalore";
      else if (lat >= 12.5 && lat <= 13.5 && parseFloat(String(d.longitude)) > 79) city = "Chennai";
      else if (lat >= 17 && lat <= 18) city = "Hyderabad";
      else if (lat >= 22 && lat <= 23) city = "Kolkata";
      else if (lat >= 18 && lat <= 19 && parseFloat(String(d.longitude)) < 74) city = "Pune";

      if (!cityMap[city]) cityMap[city] = { score: 0, count: 0 };
      cityMap[city].score += d.demandScore;
      cityMap[city].count++;
    });

    return Object.entries(cityMap)
      .map(([city, data]) => ({
        city,
        score: Math.round(data.score / data.count),
        pindrops: data.count,
        trend: data.score / data.count > 70 ? "up" as const : data.score / data.count > 40 ? "stable" as const : "down" as const,
      }))
      .sort((a, b) => b.score - a.score);
  }, [heatmapData]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <BlobCharacter color="yellow" size={56} expression="happy" delay={1} />
              </div>
              <div>
                <h1 className="shutter-heading text-[32px]" style={{ color: "var(--color-charcoal-primary)" }}>
                  Demand Heatmaps
                </h1>
                <p className="text-[13px] text-[#848281]">
                  {userLocation
                    ? `Showing demand around your location (${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)})`
                    : locError || "Geospatial demand intelligence across India"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                      () => setLocError("Location access denied")
                    );
                  }
                }}
                className="shutter-btn-light flex items-center gap-2 text-[12px]"
              >
                <NavIcon className="w-3.5 h-3.5" />
                My Location
              </button>
              <button
                onClick={() => computeMutation.mutate({})}
                disabled={computeMutation.isPending}
                className="shutter-btn-light flex items-center gap-2 text-[12px]"
              >
                <Zap className="w-3.5 h-3.5" />
                {computeMutation.isPending ? "Computing..." : computed ? "Refresh" : "Compute"}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Google Map */}
            <div className="lg:col-span-2">
              <div className="shutter-card p-0 overflow-hidden" style={{ height: "500px" }}>
                <GoogleMapHeatmap />
              </div>

              {/* Category Filter */}
              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
                <Filter className="w-4 h-4 text-[#848281] shrink-0" />
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? "bg-[#121212] text-white"
                        : "bg-[#f8f7f4] text-[#848281] hover:bg-[#f2f0ed]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-4">
              {/* Top Categories from real data */}
              <div className="shutter-card">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-[#0090ff]" />
                  <h3 className="text-[15px] font-semibold text-[#343433]">
                    Top Demand Categories
                  </h3>
                </div>
                {topCategories && topCategories.length > 0 ? (
                  <div className="space-y-3">
                    {topCategories.map((stat, i) => (
                      <div key={stat.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-medium text-[#474645]">
                            {stat.category}
                          </span>
                          <span className="text-[11px] text-[#848281]">
                            {Math.round(Number(stat.totalScore))}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#f2f0ed] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Number(stat.totalScore))}%`,
                              background:
                                i === 0 ? "#ff3e00" : i === 1 ? "#ffbb26" : i === 2 ? "#0090ff" : "#00ca48",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Loader2 className="w-6 h-6 text-[#c6c6c6] animate-spin mx-auto mb-2" />
                    <p className="text-[12px] text-[#848281]">Computing demand data...</p>
                  </div>
                )}
              </div>

              {/* City Rankings from real data */}
              <div className="shutter-card">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-[#ff3e00]" />
                  <h3 className="text-[15px] font-semibold text-[#343433]">City Rankings</h3>
                </div>
                <div className="space-y-2">
                  {cityRankings.map((city, i) => (
                    <div
                      key={city.city}
                      className="flex items-center justify-between py-2 border-b border-[#f2f0ed] last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#c6c6c6] w-4">{i + 1}</span>
                        <span className="text-[13px] text-[#474645]">{city.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#343433]">
                          {city.score}
                        </span>
                        <TrendingUp
                          className={`w-3 h-3 ${
                            city.trend === "up"
                              ? "text-[#00ca48]"
                              : city.trend === "down"
                              ? "text-[#ff3e00]"
                              : "text-[#ffbb26]"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Action */}
              <div className="shutter-card bg-gradient-to-br from-[#121212] to-[#343433]">
                <Target className="w-5 h-5 text-[#ffbb26] mb-3" />
                <h3 className="text-[15px] font-semibold text-white mb-2">
                  Ready to expand?
                </h3>
                <p className="text-[12px] text-white/60 mb-4">
                  Use Genie AI for detailed location analysis and success predictions.
                </p>
                <a
                  href="/genie"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#ffbb26] hover:text-[#ffdd77] transition-colors"
                >
                  Ask Genie <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
