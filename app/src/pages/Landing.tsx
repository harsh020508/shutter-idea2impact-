import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import {
  ArrowRight,
  ScanLine,
  TrendingUp,
  Handshake,
  MapPin,
  Flame,
  Sparkles,
  CheckCircle2,
  Users,
  BarChart3,
  Store,
} from "lucide-react";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Blob characters scattered around */}
        <div className="absolute top-20 left-[5%] lg:left-[12%] opacity-90">
          <BlobCharacter color="orange" size={100} expression="happy" delay={1} />
        </div>
        <div className="absolute top-32 right-[8%] lg:right-[15%] opacity-90">
          <BlobCharacter color="green" size={80} expression="wink" delay={2} />
        </div>
        <div className="absolute bottom-20 left-[8%] lg:left-[20%] opacity-90">
          <BlobCharacter color="blue" size={70} expression="surprised" delay={3} />
        </div>
        <div className="absolute top-1/2 right-[5%] lg:right-[10%] opacity-80">
          <BlobCharacter color="yellow" size={60} expression="happy" delay={4} />
        </div>
        <div className="hidden lg:block absolute bottom-32 right-[25%] opacity-85">
          <BlobCharacter color="pink" size={55} expression="wink" delay={2} />
        </div>

        <div className="relative max-w-[1200px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f8f7f4] border border-[#f2f0ed] mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#ff3e00]" />
            <span className="text-[12px] font-medium text-[#848281]">
              Smart Inventory Intelligence for Retail Stores
            </span>
          </div>

          <h1
            className="shutter-heading text-[clamp(40px,7vw,68px)] max-w-[800px] mx-auto mb-6"
            style={{ color: "var(--color-charcoal-primary)" }}
          >
            The Right Products.
            <br />
            <span style={{ color: "var(--color-ember-orange)" }}>The Wrong Stores.</span>
            <br />
            Shutter Fixes It.
          </h1>

          <p
            className="shutter-body max-w-[480px] mx-auto mb-10"
            style={{ color: "var(--color-graphite)" }}
          >
            AI-powered inventory matching connects surplus stock to demand
            hotspots. Turn dead inventory into profit while communities crowdsource
            their neighborhood retail needs.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {isAuthenticated ? (
              <Link to="/dashboard" className="shutter-btn-dark flex items-center gap-2">
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/retailer/setup"
                  className="shutter-btn-dark flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="shutter-btn-light">
                  Log In
                </Link>
              </>
            )}
          </div>

          {/* Key Pillars */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-[700px] mx-auto">
            {[
              { icon: Store, label: "Inventory Management", color: "#121212" },
              { icon: ScanLine, label: "QR Billing System", color: "#ff3e00" },
              { icon: Flame, label: "Demand Heatmaps", color: "#ffbb26" },
              { icon: Sparkles, label: "AI Intelligence", color: "#0090ff" },
            ].map((item) => (
              <div
                key={item.label}
                className="shutter-card py-5 px-4 text-center"
              >
                <item.icon className="w-5 h-5 mx-auto mb-2" style={{ color: item.color }} />
                <div className="text-[12px] text-[#848281] font-medium">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2
              className="shutter-heading-lg text-[clamp(28px,4vw,44px)] mb-4"
              style={{ color: "var(--color-midnight)" }}
            >
              Three Modules. One Platform.
            </h2>
            <p className="shutter-body max-w-[500px] mx-auto text-[#848281]">
              B2B inventory intelligence, B2C demand aggregation, and expansion analytics — unified.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* B2B Module */}
            <div className="shutter-card group hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#f8f7f4] flex items-center justify-center mb-5 group-hover:bg-[#121212] transition-colors duration-300">
                <Store className="w-5 h-5 text-[#121212] group-hover:text-white transition-colors" />
              </div>
              <h3
                className="text-[19px] font-semibold mb-3"
                style={{ color: "var(--color-charcoal-primary)" }}
              >
                B2B Intelligence
              </h3>
              <p className="shutter-body text-[#848281] mb-5">
                QR billing, AI restocking, inventory forecasts, and peer-to-peer surplus trading for kirana stores.
              </p>
              <div className="space-y-2">
                {["QR Scan-to-Cart Billing", "AI Demand Forecasting", "Surplus Matching Engine", "GSTIN Verification"].map(
                  (feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ca48] shrink-0" />
                      <span className="text-[13px] text-[#474645]">{feat}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* B2C Module */}
            <div className="shutter-card group hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#f8f7f4] flex items-center justify-center mb-5 group-hover:bg-[#ff3e00] transition-colors duration-300">
                <Users className="w-5 h-5 text-[#ff3e00] group-hover:text-white transition-colors" />
              </div>
              <h3
                className="text-[19px] font-semibold mb-3"
                style={{ color: "var(--color-charcoal-primary)" }}
              >
                B2C Demand Layer
              </h3>
              <p className="shutter-body text-[#848281] mb-5">
                Consumers pindrop demand on maps, create community campaigns, and signal invisible retail needs.
              </p>
              <div className="space-y-2">
                {["Map Pindrops", "Community Campaigns", "Neighborhood Pulse", "Demand Aggregation"].map(
                  (feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ca48] shrink-0" />
                      <span className="text-[13px] text-[#474645]">{feat}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Expansion Module */}
            <div className="shutter-card group hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#f8f7f4] flex items-center justify-center mb-5 group-hover:bg-[#0090ff] transition-colors duration-300">
                <BarChart3 className="w-5 h-5 text-[#0090ff] group-hover:text-white transition-colors" />
              </div>
              <h3
                className="text-[19px] font-semibold mb-3"
                style={{ color: "var(--color-charcoal-primary)" }}
              >
                Expansion Analytics
              </h3>
              <p className="shutter-body text-[#848281] mb-5">
                Geospatial heatmaps, AI-powered Genie toolkit, and location intelligence for retail expansion.
              </p>
              <div className="space-y-2">
                {["Demand Heatmaps", "Genie AI Toolkit", "Success Probability", "Catchment Analytics"].map(
                  (feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00ca48] shrink-0" />
                      <span className="text-[13px] text-[#474645]">{feat}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8" style={{ background: "#f8f7f4" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2
              className="shutter-heading-lg text-[clamp(28px,4vw,44px)] mb-4"
              style={{ color: "var(--color-midnight)" }}
            >
              How Shutter Works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Signal Demand",
                desc: "Consumers drop demand pins on the map for products they can't find nearby.",
                icon: MapPin,
                color: "#ff3e00",
              },
              {
                step: "02",
                title: "AI Aggregates",
                desc: "Shutter clusters demand signals by geography and category in real-time.",
                icon: TrendingUp,
                color: "#00ca48",
              },
              {
                step: "03",
                title: "Match Surplus",
                desc: "The Matching Engine connects surplus stock at Store A to demand at Store B.",
                icon: Handshake,
                color: "#0090ff",
              },
              {
                step: "04",
                title: "Convert to Profit",
                desc: "Dead inventory becomes revenue. Communities get the products they need.",
                icon: Flame,
                color: "#ffbb26",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ background: `${item.color}15` }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <div
                  className="text-[12px] font-semibold mb-2"
                  style={{ color: item.color }}
                >
                  STEP {item.step}
                </div>
                <h3
                  className="text-[17px] font-semibold mb-2"
                  style={{ color: "var(--color-charcoal-primary)" }}
                >
                  {item.title}
                </h3>
                <p className="text-[13px] text-[#848281] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f8f7f4] mb-5">
                <ScanLine className="w-3.5 h-3.5 text-[#ff3e00]" />
                <span className="text-[11px] font-medium text-[#848281]">QR BILLING</span>
              </div>
              <h2
                className="shutter-heading-lg text-[clamp(24px,3vw,36px)] mb-4"
                style={{ color: "var(--color-midnight)" }}
              >
                Scan. Cart. Done.
              </h2>
              <p className="shutter-body text-[#848281] mb-6">
                Point your phone camera at any product barcode. Shutter auto-populates
                product details, calculates totals with GST, and generates digital receipts
                — all in under 30 seconds per customer.
              </p>
              <Link
                to="/billing"
                className="shutter-ghost-link inline-flex items-center gap-1"
              >
                Try QR Billing <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="shutter-card-cream p-6">
              <div className="bg-[#121212] rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white text-[13px] font-medium">Live Cart</span>
                  <span className="text-[#00ca48] text-[15px] font-semibold">₹247.00</span>
                </div>
                {[
                  { name: "Amul Gold Milk 1L", qty: 2, price: 72 },
                  { name: "Britannia Marie Gold", qty: 1, price: 35 },
                  { name: "Tata Salt 1kg", qty: 2, price: 28 },
                  { name: "Maggi Noodles", qty: 3, price: 14 },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-[#333] last:border-0"
                  >
                    <div>
                      <div className="text-white text-[12px]">{item.name}</div>
                      <div className="text-[#848281] text-[11px]">
                        Qty: {item.qty}
                      </div>
                    </div>
                    <div className="text-white text-[12px]">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))}
                <button className="w-full mt-4 bg-white text-[#121212] rounded-full py-2.5 text-[13px] font-semibold">
                  Review Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heatmap Preview */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8" style={{ background: "#f8f7f4" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="shutter-card-cream p-6">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f2f0ed]">
                  <div className="flex items-center gap-2 mb-4">
                    <Flame className="w-4 h-4 text-[#ff3e00]" />
                    <span className="text-[13px] font-semibold text-[#343433]">
                      Demand Heatmap
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const score = Math.random();
                      const bg =
                        score > 0.7
                          ? "bg-[#ff3e00]/60"
                          : score > 0.4
                          ? "bg-[#ffbb26]/50"
                          : "bg-[#00ca48]/30";
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-md ${bg} transition-all duration-500 hover:scale-110`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00ca48]/30" />
                      <span className="text-[10px] text-[#848281]">Low</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbb26]/50" />
                      <span className="text-[10px] text-[#848281]">Medium</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff3e00]/60" />
                      <span className="text-[10px] text-[#848281]">High</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white mb-5">
                <Flame className="w-3.5 h-3.5 text-[#ff3e00]" />
                <span className="text-[11px] font-medium text-[#848281]">DEMAND HEATMAPS</span>
              </div>
              <h2
                className="shutter-heading-lg text-[clamp(24px,3vw,36px)] mb-4"
                style={{ color: "var(--color-midnight)" }}
              >
                See Demand Before It Surfaces
              </h2>
              <p className="shutter-body text-[#848281] mb-6">
                Geospatial heatmaps reveal unmet demand patterns across neighborhoods.
                Pre-computed every 15 minutes from consumer pindrops, search signals, and
                community campaigns. Make data-driven expansion decisions.
              </p>
              <Link
                to="/heatmap"
                className="shutter-ghost-link inline-flex items-center gap-1"
              >
                Explore Heatmaps <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[700px] mx-auto text-center">
          <h2
            className="shutter-heading text-[clamp(32px,5vw,52px)] mb-6"
            style={{ color: "var(--color-charcoal-primary)" }}
          >
            Ready to turn dead stock into profit?
          </h2>
          <p className="shutter-body text-[#848281] mb-8 max-w-[400px] mx-auto">
            Join thousands of kirana stores using Shutter to optimize inventory,
            discover demand, and trade surplus.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/retailer/setup" className="shutter-btn-dark">
              Get Started Free
            </Link>
            <Link to="/pindrops" className="shutter-btn-light">
              Explore Pindrops
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#f2f0ed]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-[#121212] flex items-center justify-center">
                  <Store className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[15px] font-medium text-[#343433]">
                  Shutter
                </span>
              </div>
              <p className="text-[12px] text-[#848281]">
                Smart Inventory Intelligence for India's Kirana Stores
              </p>
            </div>
            <div className="flex flex-wrap gap-6 text-[12px] text-[#848281]">
              <Link to="/dashboard" className="hover:text-[#343433] transition-colors">
                Dashboard
              </Link>
              <Link to="/billing" className="hover:text-[#343433] transition-colors">
                QR Billing
              </Link>
              <Link to="/heatmap" className="hover:text-[#343433] transition-colors">
                Heatmaps
              </Link>
              <Link to="/campaigns" className="hover:text-[#343433] transition-colors">
                Campaigns
              </Link>
              <Link to="/genie" className="hover:text-[#343433] transition-colors">
                Genie
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#f2f0ed] text-center">
            <p className="text-[11px] text-[#c6c6c6]">
              Shutter v1.0 — June 2026 — Confidential & Proprietary
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
