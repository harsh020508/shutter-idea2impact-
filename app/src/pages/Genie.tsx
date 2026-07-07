import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import {
  Sparkles,
  Send,
  TrendingUp,
  MapPin,
  Package,
  Users,
  Brain,
  Zap,
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "What products are trending in my area?",
  "Where should I open a new store?",
  "What are my competitors stocking?",
  "When should I restock for maximum profit?",
  "Which categories have highest demand right now?",
  "What is the best time to stock perishable items?",
  "How can I reduce dead inventory?",
  "What pricing strategy works best for my location?",
  "Which brands should I prioritize?",
  "What are the peak shopping hours in my area?",
  "How much stock should I keep for festival seasons?",
  "What new product categories should I introduce?",
  "How is my inventory turnover compared to peers?",
  "What are the top selling items in my city?",
  "Should I focus on premium or budget products?",
  "What payment methods do customers prefer?",
  "How can I improve my store visibility?",
  "What delivery radius should I target?",
  "Which suppliers offer the best margins?",
  "How to handle seasonal demand fluctuations?",
];

export default function Genie() {
  useAuth({ redirectOnUnauthenticated: true });
  const [query, setQuery] = useState("");

  const askGenie = trpc.genie.ask.useMutation();

  const handleSubmit = () => {
    if (!query.trim()) return;
    askGenie.mutate({ query });
  };

  const handleSuggested = (q: string) => {
    setQuery(q);
    askGenie.mutate({ query: q });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[800px] mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <BlobCharacter color="orange" size={80} expression="happy" delay={1} />
            </div>
            <h1
              className="shutter-heading text-[clamp(32px,5vw,48px)] mb-3"
              style={{ color: "var(--color-charcoal-primary)" }}
            >
              Genie <span style={{ color: "var(--color-ember-orange)" }}>Toolkit</span>
            </h1>
            <p className="text-[15px] text-[#848281] max-w-[400px] mx-auto">
              AI-powered location analytics. Ask anything about demand, competition, or expansion.
            </p>
          </div>

          {/* Chat Interface */}
          <div className="shutter-card min-h-[400px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 mb-4">
              {!askGenie.data ? (
                <div className="text-center py-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSuggested(q)}
                        className="text-left p-3 rounded-xl bg-[#f8f7f4] hover:bg-[#f2f0ed] transition-colors text-[13px] text-[#474645] flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#ff3e00] shrink-0" />
                        <span className="line-clamp-1">{q}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { icon: TrendingUp, label: "Demand Trends", color: "#00ca48" },
                      { icon: MapPin, label: "Location Intel", color: "#0090ff" },
                      { icon: Package, label: "Inventory Tips", color: "#ffbb26" },
                      { icon: Users, label: "Competitor Analysis", color: "#ff3e00" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-[#f8f7f4] rounded-xl p-3 text-center"
                      >
                        <item.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: item.color }} />
                        <span className="text-[11px] text-[#848281]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User Message */}
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-[#121212] text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                      <p className="text-[13px]">{query || askGenie.variables?.query}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#ff3e00]/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-[#ff3e00]" />
                    </div>
                    <div className="bg-[#f8f7f4] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-[13px] text-[#474645] leading-relaxed mb-3">
                        {askGenie.data.response}
                      </p>

                      {/* Insights Cards */}
                      {askGenie.data.insights && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-[#f2f0ed]">
                          <InsightsDisplay insights={askGenie.data.insights} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Ask Genie anything about your market..."
                  className="w-full pl-4 pr-4 py-3 rounded-xl border border-[#f2f0ed] bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!query.trim() || askGenie.isPending}
                className="w-11 h-11 rounded-xl bg-[#121212] text-white flex items-center justify-center hover:bg-[#343433] transition-colors disabled:opacity-50 shrink-0"
              >
                {askGenie.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Markets Analyzed", value: "2,400+", icon: MapPin, color: "#0090ff" },
              { label: "Demand Signals", value: "15,000+", icon: TrendingUp, color: "#00ca48" },
              { label: "Categories", value: "120+", icon: Package, color: "#ffbb26" },
              { label: "Accuracy", value: "85%", icon: Brain, color: "#ff3e00" },
            ].map((stat) => (
              <div key={stat.label} className="shutter-card py-4 text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
                <div className="text-[18px] font-bold text-[#121212]">{stat.value}</div>
                <div className="text-[10px] text-[#848281]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function InsightsDisplay({ insights }: { insights: Record<string, unknown> }) {
  const topCategories = insights.topCategories as Array<{ category: string; score: number }> | undefined;
  const recommendation = insights.recommendation as string | undefined;
  const suggestedActions = insights.suggestedActions as string[] | undefined;

  return (
    <>
      {topCategories && (
        <div>
          <div className="text-[11px] font-medium text-[#848281] mb-1.5 uppercase tracking-wide">
            Top Categories
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topCategories.map((cat, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-full bg-white text-[11px] font-medium text-[#474645] border border-[#f2f0ed]"
              >
                {cat.category} ({cat.score})
              </span>
            ))}
          </div>
        </div>
      )}

      {recommendation && (
        <div className="flex items-center gap-2 text-[12px] text-[#00ca48]">
          <Zap className="w-3.5 h-3.5" />
          <span>{recommendation}</span>
        </div>
      )}

      {suggestedActions && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestedActions.map((action, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded-lg bg-[#0090ff]/10 text-[#0090ff] text-[11px] font-medium"
            >
              {action}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
