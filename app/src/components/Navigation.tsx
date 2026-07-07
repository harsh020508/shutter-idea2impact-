import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  ScanLine,
  Package,
  TrendingUp,
  Handshake,
  MapPin,
  Megaphone,
  Flame,
  Sparkles,
  Menu,
  X,
  LogOut,
  User,
  Store,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Billing", href: "/billing", icon: ScanLine },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "AI Restock", href: "/restock", icon: TrendingUp },
  { label: "Trades", href: "/trades", icon: Handshake },
  { label: "Pindrops", href: "/pindrops", icon: MapPin },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Heatmap", href: "/heatmap", icon: Flame },
  { label: "Genie", href: "/genie", icon: Sparkles },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isLanding = location.pathname === "/";
  if (isLanding && !scrolled) return null;

  return (
    <nav className="shutter-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 lg:px-8">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center">
          <Store className="w-4 h-4 text-white" />
        </div>
        <span
          className="text-[15px] font-medium tracking-tight"
          style={{ color: "var(--color-charcoal-primary)" }}
        >
          Shutter
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
        {isAuthenticated &&
          navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-[#121212] text-white"
                    : "text-[#474645] hover:bg-[#f2f0ed]"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f8f7f4]">
              <User className="w-3.5 h-3.5 text-[#848281]" />
              <span className="text-[12px] font-medium text-[#474645] max-w-[120px] truncate">
                {user?.name || "Retailer"}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-[#848281] hover:bg-[#f2f0ed] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="shutter-btn-light text-[13px] py-2 px-4">
              Log In
            </Link>
            <Link to="/retailer/setup" className="shutter-btn-dark text-[13px] py-2 px-4">
              Get Started
            </Link>
          </>
        )}

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-[#f2f0ed] transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5 text-[#474645]" />
          ) : (
            <Menu className="w-5 h-5 text-[#474645]" />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#fbfaf9] border-t border-[#f2f0ed] shadow-lg max-h-[70vh] overflow-y-auto">
          <div className="p-4 grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-[#121212] text-white"
                      : "text-[#474645] hover:bg-[#f2f0ed]"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
