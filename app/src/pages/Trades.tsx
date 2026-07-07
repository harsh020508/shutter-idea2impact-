import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import {
  Handshake,
  MapPin,
  Package,
  ArrowRight,
  AlertCircle,
  IndianRupee,
  Zap,
} from "lucide-react";

export default function Trades() {
  const { isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });

  const { data: matches, refetch } = trpc.trade.findMatches.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createTrade = trpc.trade.create.useMutation({
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
              <BlobCharacter color="blue" size={60} expression="wink" delay={1} />
            </div>
            <div>
              <h1 className="shutter-heading text-[32px]" style={{ color: "var(--color-charcoal-primary)" }}>
                Shutter Matching
              </h1>
              <p className="text-[13px] text-[#848281]">
                AI connects your surplus inventory to nearby stores with demand
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="shutter-card mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#ffbb26]" />
              <h3 className="text-[14px] font-semibold text-[#343433]">How Matching Works</h3>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Geographic Distance", value: "35%", color: "#0090ff" },
                { label: "Product Match", value: "25%", color: "#00ca48" },
                { label: "Price Margin", value: "20%", color: "#ffbb26" },
                { label: "Expiry Window", value: "20%", color: "#ff3e00" },
              ].map((factor) => (
                <div key={factor.label} className="bg-[#f8f7f4] rounded-xl p-3 text-center">
                  <div className="text-[18px] font-bold" style={{ color: factor.color }}>
                    {factor.value}
                  </div>
                  <div className="text-[10px] text-[#848281] mt-0.5">{factor.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Score Explanation */}
          <div className="mb-6 p-4 rounded-xl bg-[#0090ff]/5 border border-[#0090ff]/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#0090ff] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] text-[#474645]">
                Matches are scored 0-100 based on proximity, product alignment, pricing, and expiry urgency.
                Only GSTIN-verified retailers can participate.
              </p>
            </div>
          </div>

          {/* Trade Matches */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-[#343433] flex items-center gap-2">
                <Handshake className="w-4 h-4 text-[#0090ff]" />
                Available Matches
              </h2>
              <span className="text-[11px] text-[#848281]">
                {matches?.length || 0} opportunities found
              </span>
            </div>

            {matches && matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match, i) => (
                  <div key={i} className="shutter-card py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0090ff]/10 to-[#00ca48]/10 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-[#0090ff]" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[15px] font-semibold text-[#343433]">
                            {match?.productName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              (match?.matchScore ?? 0) > 80
                                ? "bg-[#00ca48]/10 text-[#00ca48]"
                                : (match?.matchScore ?? 0) > 60
                                ? "bg-[#ffbb26]/10 text-[#d48f00]"
                                : "bg-[#f2f0ed] text-[#848281]"
                            }`}
                          >
                            {(match?.matchScore ?? 0).toFixed(0)}% Match
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="flex items-center gap-1.5 text-[12px] text-[#848281]">
                            <IndianRupee className="w-3 h-3" />
                            <span>₹{match?.sellerPrice?.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[12px] text-[#848281]">
                            <Package className="w-3 h-3" />
                            <span>Qty: {match?.quantity}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[12px] text-[#848281]">
                            <MapPin className="w-3 h-3" />
                            <span>{match?.distance} km</span>
                          </div>
                        </div>

                        {/* Match Score Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[#848281]">Match Score</span>
                            <span className="text-[10px] font-medium text-[#0090ff]">
                              {(match?.matchScore ?? 0).toFixed(0)}/100
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#f2f0ed] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0090ff] to-[#00ca48] transition-all"
                              style={{ width: `${match?.matchScore ?? 0}%` }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            match &&
                            createTrade.mutate({
                              buyerRetailerId: match.buyerRetailerId,
                              productId: match.productId,
                              quantity: match.quantity,
                              sellerPrice: match.sellerPrice,
                            })
                          }
                          disabled={createTrade.isPending}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#121212] text-white text-[13px] font-medium hover:bg-[#343433] transition-colors disabled:opacity-50"
                        >
                          <Handshake className="w-4 h-4" />
                          Initiate Trade
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="shutter-card text-center py-12">
                <Handshake className="w-10 h-10 text-[#c6c6c6] mx-auto mb-3" />
                <p className="text-[15px] font-medium text-[#343433] mb-1">
                  No matches yet
                </p>
                <p className="text-[13px] text-[#848281] max-w-[400px] mx-auto">
                  Mark items as surplus in your inventory to start getting matched with nearby stores that need them.
                </p>
                <a
                  href="/inventory"
                  className="shutter-ghost-link inline-flex items-center gap-1 mt-4"
                >
                  Go to Inventory <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
