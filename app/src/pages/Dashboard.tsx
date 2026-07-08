import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ScanLine,
  Handshake,
  Sparkles,
  ArrowRight,
  IndianRupee,
  Receipt,
  Search,
  Flame,
  MapPin,
} from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });
  const navigate = useNavigate();

  const { data: retailer } = trpc.retailer.myRetailer.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: stats } = trpc.retailer.dashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: todayRevenue } = trpc.bill.todayRevenue.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: lowStock } = trpc.inventory.lowStock.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: trending } = trpc.pindrop.trending.useQuery(
    { hours: 24, limit: 5 },
    { enabled: isAuthenticated }
  );

  const { data: insights } = trpc.genie.quickInsights.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && retailer === null) {
      navigate("/retailer/setup");
    }
  }, [authLoading, isAuthenticated, retailer, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-warm-canvas)" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#f2f0ed] border-t-[#ff3e00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-[#848281]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1
                className="shutter-heading text-[clamp(28px,4vw,44px)]"
                style={{ color: "var(--color-charcoal-primary)" }}
              >
                {retailer?.storeName || "Your Store"}
              </h1>
              <p className="text-[13px] text-[#848281] mt-1">
                {retailer?.gstinVerified === "verified" ? (
                  <span className="inline-flex items-center gap-1 text-[#00ca48]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ca48]" />
                    GSTIN Verified — {retailer?.city}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#ffbb26]">
                    <AlertTriangle className="w-3 h-3" />
                    GSTIN Verification Pending
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/billing" className="shutter-btn-dark flex items-center gap-2 text-[13px]">
                <ScanLine className="w-4 h-4" />
                QR Billing
              </Link>
              <Link to="/restock" className="shutter-btn-light flex items-center gap-2 text-[13px]">
                <Sparkles className="w-4 h-4" />
                AI Restock
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="shutter-card py-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#00ca48]/10 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-[#00ca48]" />
                </div>
                <span className="text-[11px] font-medium text-[#848281] uppercase tracking-wide">
                  Today&apos;s Revenue
                </span>
              </div>
              <div className="text-[28px] font-semibold text-[#121212] tracking-tight">
                ₹{todayRevenue?.revenue?.toLocaleString() || "0"}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[11px] text-[#c6c6c6]">from QR billing</span>
              </div>
            </div>

            <div className="shutter-card py-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#ff3e00]/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-[#ff3e00]" />
                </div>
                <span className="text-[11px] font-medium text-[#848281] uppercase tracking-wide">
                  Bills Today
                </span>
              </div>
              <div className="text-[28px] font-semibold text-[#121212] tracking-tight">
                {todayRevenue?.count || 0}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[11px] text-[#c6c6c6]">transactions processed</span>
              </div>
            </div>

            <div className="shutter-card py-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#ffbb26]/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#ffbb26]" />
                </div>
                <span className="text-[11px] font-medium text-[#848281] uppercase tracking-wide">
                  Low Stock
                </span>
              </div>
              <div className="text-[28px] font-semibold text-[#121212] tracking-tight">
                {lowStock?.length || 0}
              </div>
              <Link
                to="/inventory"
                className="text-[11px] text-[#ff3e00] font-medium inline-flex items-center gap-0.5 mt-1 hover:underline"
              >
                Review <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="shutter-card py-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#0090ff]/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#0090ff]" />
                </div>
                <span className="text-[11px] font-medium text-[#848281] uppercase tracking-wide">
                  Total SKUs
                </span>
              </div>
              <div className="text-[28px] font-semibold text-[#121212] tracking-tight">
                {stats?.totalProducts || 0}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[11px] text-[#c6c6c6]">Tracked items</span>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Insights */}
              {insights && (
                <div className="shutter-card">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <BlobCharacter color="orange" size={56} expression="happy" delay={1} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-semibold text-[#343433] mb-1">
                        {insights.headline}
                      </h3>
                      <p className="text-[13px] text-[#848281] mb-3">{insights.tip}</p>
                      <div className="flex items-center gap-2">
                        {insights.actions?.map(
                          (action: { label: string; href: string }) => (
                            <Link
                              key={action.href}
                              to={action.href}
                              className="shutter-ghost-link text-[12px] inline-flex items-center gap-1"
                            >
                              {action.label} <ArrowRight className="w-3 h-3" />
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trending Customer Requests */}
              <div className="shutter-card">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#ff3e00]" />
                    <h3 className="text-[15px] font-semibold text-[#343433]">
                      Trending Customer Requests
                    </h3>
                  </div>
                  <Link
                    to="/pindrops"
                    className="text-[11px] text-[#ff3e00] font-medium inline-flex items-center gap-0.5"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {trending && trending.length > 0 ? (
                  <div className="space-y-3">
                    {trending.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f7f4] hover:bg-[#f2f0ed] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                            <Search className="w-3.5 h-3.5 text-[#848281]" />
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-[#343433]">
                              {item.productName}
                            </div>
                            <div className="text-[11px] text-[#848281]">
                              {item.category}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[13px] font-semibold text-[#ff3e00]">
                              {item.searchCount} searches
                            </div>
                            <div className="text-[10px] text-[#c6c6c6]">last 24h</div>
                          </div>
                          <Link
                            to="/inventory"
                            className="px-3 py-1.5 rounded-full bg-[#121212] text-white text-[11px] font-medium hover:bg-[#343433] transition-colors"
                          >
                            Restock
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-8 h-8 text-[#c6c6c6] mx-auto mb-3" />
                    <p className="text-[13px] text-[#848281]">
                      No trending requests yet. Demand data updates hourly.
                    </p>
                  </div>
                )}
              </div>

              {/* Low Stock Alerts */}
              <div className="shutter-card">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#ffbb26]" />
                    <h3 className="text-[15px] font-semibold text-[#343433]">
                      Low Stock Alerts
                    </h3>
                  </div>
                  <Link
                    to="/inventory"
                    className="text-[11px] text-[#ff3e00] font-medium inline-flex items-center gap-0.5"
                  >
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {lowStock && lowStock.length > 0 ? (
                  <div className="space-y-2">
                    {lowStock.slice(0, 5).map((item: any) => (
                      <div
                        key={item.inventory.id}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-[#f2f0ed]"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-[#848281]" />
                          <span className="text-[13px] text-[#474645]">
                            {item.product.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#ff3e00] font-medium">
                            {item.inventory.quantity} left
                          </span>
                          <span className="text-[10px] text-[#c6c6c6]">
                            threshold: {item.inventory.lowStockThreshold}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Package className="w-8 h-8 text-[#00ca48] mx-auto mb-2" />
                    <p className="text-[13px] text-[#848281]">
                      All items well stocked!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - 1/3 */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="shutter-card">
                <h3 className="text-[15px] font-semibold text-[#343433] mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "QR Billing", href: "/billing", icon: ScanLine, color: "#121212" },
                    { label: "AI Restock", href: "/restock", icon: Sparkles, color: "#ff3e00" },
                    { label: "View Trades", href: "/trades", icon: Handshake, color: "#0090ff" },
                    { label: "Explore Heatmap", href: "/heatmap", icon: Flame, color: "#ffbb26" },
                    { label: "Ask Genie", href: "/genie", icon: Sparkles, color: "#9f4fff" },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      to={action.href}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-[#f8f7f4] transition-colors group"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${action.color}10` }}
                      >
                        <action.icon
                          className="w-4 h-4"
                          style={{ color: action.color }}
                        />
                      </div>
                      <span className="text-[13px] font-medium text-[#474645] group-hover:text-[#121212]">
                        {action.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#c6c6c6] ml-auto group-hover:text-[#ff3e00] transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Weekly Forecast */}
              <div className="shutter-card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#00ca48]" />
                  <h3 className="text-[15px] font-semibold text-[#343433]">
                    Inventory Forecast
                  </h3>
                </div>
                <div className="bg-[#f8f7f4] rounded-xl p-4 mb-4">
                  <p className="text-[13px] text-[#474645] leading-relaxed">
                    AI analyzes your sales patterns to predict demand. Run the AI
                    Restock tool to get personalized recommendations for your inventory.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#848281]">
                  <TrendingUp className="w-3 h-3 text-[#00ca48]" />
                  <span>Based on your sales history</span>
                </div>
                <Link
                  to="/restock"
                  className="mt-4 w-full shutter-btn-dark text-center block text-[13px] py-2.5"
                >
                  Run AI Restock
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
