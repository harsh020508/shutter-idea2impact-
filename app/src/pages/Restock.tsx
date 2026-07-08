import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  Package,
  Brain,
} from "lucide-react";

export default function Restock() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });

  const { data: recommendations, refetch } = trpc.inventory.generateRestockRecommendations.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: myRecommendations } = trpc.inventory.myRecommendations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateRec = trpc.inventory.updateRecommendation.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[900px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="shrink-0">
              <BlobCharacter color="green" size={60} expression="happy" delay={1} />
            </div>
            <div>
              <h1 className="shutter-heading text-[32px]" style={{ color: "var(--color-charcoal-primary)" }}>
                AI Restock
              </h1>
              <p className="text-[13px] text-[#848281]">
                Smart inventory recommendations based on demand signals and stock levels
              </p>
            </div>
          </div>

          {/* AI Insight Banner */}
          <div className="shutter-card mb-8 bg-gradient-to-r from-[#f8f7f4] to-white">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff3e00]/10 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-[#ff3e00]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#343433] mb-1">
                  AI-Powered Restock Recommendations
                </h3>
                <p className="text-[13px] text-[#848281] mb-3">
                  Shutter analyzes your current stock levels, sales velocity, and local demand signals to generate personalized restock suggestions.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00ca48]/10">
                    <TrendingUp className="w-3 h-3 text-[#00ca48]" />
                    <span className="text-[11px] font-medium text-[#00ca48]">Live data</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0090ff]/10">
                    <Sparkles className="w-3 h-3 text-[#0090ff]" />
                    <span className="text-[11px] font-medium text-[#0090ff]">AI-powered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-[#343433] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff3e00]" />
                AI Recommendations
              </h2>
              <span className="text-[11px] text-[#848281]">
                {recommendations?.length || 0} items need attention
              </span>
            </div>

            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec: any) => (
                  <div key={rec.productId} className="shutter-card py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#ffbb26]/10 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-[#ffbb26]" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-semibold text-[#343433]">
                            {rec.productName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#f8f7f4] text-[10px] text-[#848281]">
                            {rec.category}
                          </span>
                        </div>

                        <p className="text-[12px] text-[#848281] mb-3">{rec.reason}</p>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-[#f8f7f4] rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-[#848281]">Current</div>
                            <div className="text-[16px] font-semibold text-[#ff3e00]">
                              {rec.currentStock}
                            </div>
                          </div>
                          <div className="bg-[#f8f7f4] rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-[#848281]">Recommended</div>
                            <div className="text-[16px] font-semibold text-[#00ca48]">
                              {rec.recommendedQuantity}
                            </div>
                          </div>
                          <div className="bg-[#f8f7f4] rounded-lg p-2.5 text-center">
                            <div className="text-[10px] text-[#848281]">Confidence</div>
                            <div className="text-[16px] font-semibold text-[#0090ff]">
                              {rec.confidence}%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateRec.mutate({ id: rec.productId, status: "approved" })}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#121212] text-white text-[12px] font-medium hover:bg-[#343433] transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => updateRec.mutate({ id: rec.productId, status: "ordered" })}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00ca48] text-white text-[12px] font-medium hover:bg-[#00a23a] transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Order Now
                          </button>
                          <button
                            onClick={() => updateRec.mutate({ id: rec.productId, status: "rejected" })}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f2f0ed] text-[#848281] text-[12px] font-medium hover:bg-[#e5e3e0] transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="shutter-card text-center py-12">
                <CheckCircle2 className="w-10 h-10 text-[#00ca48] mx-auto mb-3" />
                <p className="text-[15px] font-medium text-[#343433] mb-1">
                  All stocked up!
                </p>
                <p className="text-[13px] text-[#848281]">
                  No restock recommendations at the moment. Your inventory is healthy.
                </p>
              </div>
            )}
          </div>

          {/* History */}
          {myRecommendations && myRecommendations.length > 0 && (
            <div>
              <h2 className="text-[17px] font-semibold text-[#343433] mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0090ff]" />
                Restock History
              </h2>
              <div className="space-y-2">
                {myRecommendations.slice(0, 5).map((item: any) => (
                  <div
                    key={item.rec.id}
                    className="flex items-center justify-between py-3 px-4 rounded-xl bg-white border border-[#f2f0ed]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.rec.status === "ordered"
                            ? "bg-[#00ca48]"
                            : item.rec.status === "approved"
                            ? "bg-[#0090ff]"
                            : "bg-[#c6c6c6]"
                        }`}
                      />
                      <span className="text-[13px] text-[#474645]">{item.product.name}</span>
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        item.rec.status === "ordered"
                          ? "bg-[#00ca48]/10 text-[#00ca48]"
                          : item.rec.status === "approved"
                          ? "bg-[#0090ff]/10 text-[#0090ff]"
                          : "bg-[#f2f0ed] text-[#848281]"
                      }`}
                    >
                      {item.rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
