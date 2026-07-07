import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import {
  User,
  Store,
  Shield,
  MapPin,
  Phone,
  Calendar,
  TrendingUp,
  Package,
  Receipt,
  Handshake,
  Edit3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth({ redirectOnUnauthenticated: true });

  const { data: retailer } = trpc.retailer.myRetailer.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: stats } = trpc.retailer.dashboardStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: inventory } = trpc.inventory.myInventory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: todayRevenue } = trpc.bill.todayRevenue.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-warm-canvas)" }}>
        <div className="w-8 h-8 border-3 border-[#f2f0ed] border-t-[#ff3e00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[800px] mx-auto">
          {/* Profile Header Card */}
          <div className="shutter-card mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User"}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#f2f0ed]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#f2f0ed] flex items-center justify-center">
                    <User className="w-8 h-8 text-[#848281]" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00ca48] border-2 border-white flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-[22px] font-semibold text-[#121212] flex items-center gap-2">
                  {user?.name || "Retailer"}
                  {retailer?.gstinVerified === "verified" && (
                    <Shield className="w-5 h-5 text-[#00ca48]" />
                  )}
                </h1>
                <p className="text-[13px] text-[#848281] mt-0.5">{user?.email}</p>
                {retailer && (
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#f8f7f4] text-[#474645]">
                      <Store className="w-3 h-3" />
                      {retailer.storeName}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full ${
                      retailer.gstinVerified === "verified"
                        ? "bg-[#00ca48]/10 text-[#00ca48]"
                        : "bg-[#ffbb26]/10 text-[#d48f00]"
                    }`}>
                      {retailer.gstinVerified === "verified" ? (
                        <><CheckCircle2 className="w-3 h-3" /> GSTIN Verified</>
                      ) : (
                        <><AlertCircle className="w-3 h-3" /> GSTIN Pending</>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <a
                href="/settings"
                className="shutter-btn-light flex items-center gap-2 text-[12px] self-start"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </a>
            </div>
          </div>

          {/* Store Details */}
          {retailer && (
            <div className="shutter-card mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-4 h-4 text-[#ff3e00]" />
                <h2 className="text-[15px] font-semibold text-[#343433]">Store Details</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f8f7f4] flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-[#848281]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#848281] uppercase tracking-wide">Store Name</div>
                    <div className="text-[13px] font-medium text-[#343433]">{retailer.storeName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f8f7f4] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#848281]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#848281] uppercase tracking-wide">Owner</div>
                    <div className="text-[13px] font-medium text-[#343433]">{retailer.ownerName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f8f7f4] flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-[#848281]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#848281] uppercase tracking-wide">GSTIN</div>
                    <div className="text-[13px] font-medium text-[#343433] font-mono">{retailer.gstin}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f8f7f4] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#848281]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#848281] uppercase tracking-wide">Phone</div>
                    <div className="text-[13px] font-medium text-[#343433]">{retailer.phone || "Not set"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f8f7f4] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-[#848281]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#848281] uppercase tracking-wide">Location</div>
                    <div className="text-[13px] font-medium text-[#343433]">
                      {retailer.city || "Not set"}{retailer.state ? `, ${retailer.state}` : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f8f7f4] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-[#848281]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#848281] uppercase tracking-wide">Member Since</div>
                    <div className="text-[13px] font-medium text-[#343433]">
                      {retailer.createdAt ? new Date(retailer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="shutter-card py-4 text-center">
              <TrendingUp className="w-5 h-5 text-[#00ca48] mx-auto mb-2" />
              <div className="text-[20px] font-bold text-[#121212]">
                {todayRevenue?.revenue ? `₹${todayRevenue.revenue.toLocaleString()}` : "₹0"}
              </div>
              <div className="text-[10px] text-[#848281] mt-0.5">Today's Revenue</div>
            </div>
            <div className="shutter-card py-4 text-center">
              <Receipt className="w-5 h-5 text-[#ff3e00] mx-auto mb-2" />
              <div className="text-[20px] font-bold text-[#121212]">
                {todayRevenue?.count ?? 0}
              </div>
              <div className="text-[10px] text-[#848281] mt-0.5">Bills Today</div>
            </div>
            <div className="shutter-card py-4 text-center">
              <Package className="w-5 h-5 text-[#0090ff] mx-auto mb-2" />
              <div className="text-[20px] font-bold text-[#121212]">
                {inventory?.length ?? 0}
              </div>
              <div className="text-[10px] text-[#848281] mt-0.5">Products</div>
            </div>
            <div className="shutter-card py-4 text-center">
              <Handshake className="w-5 h-5 text-[#ffbb26] mx-auto mb-2" />
              <div className="text-[20px] font-bold text-[#121212]">
                {stats?.lowStockCount ?? 0}
              </div>
              <div className="text-[10px] text-[#848281] mt-0.5">Low Stock</div>
            </div>
          </div>

          {/* Subscription */}
          <div className="shutter-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#0090ff]" />
              <h2 className="text-[15px] font-semibold text-[#343433]">Subscription</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-medium text-[#343433]">
                  {retailer?.subscriptionTier === "pro" ? "Pro Plan" : "Free Plan"}
                </div>
                <div className="text-[12px] text-[#848281] mt-0.5">
                  Status: {retailer?.subscriptionStatus || "trial"}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${
                retailer?.subscriptionTier === "pro"
                  ? "bg-[#0090ff]/10 text-[#0090ff]"
                  : "bg-[#f8f7f4] text-[#848281]"
              }`}>
                {retailer?.subscriptionTier === "pro" ? "Active" : "Upgrade Available"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
