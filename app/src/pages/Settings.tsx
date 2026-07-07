import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Smartphone,
  ChevronRight,
  CheckCircle2,
  Save,
  Eye,
  Lock,
} from "lucide-react";

type ToggleProps = {
  enabled: boolean;
  onChange: () => void;
};

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? "bg-[#00ca48]" : "bg-[#f2f0ed]"
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { logout } = useAuth({ redirectOnUnauthenticated: true });

  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoRestock, setAutoRestock] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [language, setLanguage] = useState("en");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[700px] mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="w-5 h-5 text-[#474645]" />
            <h1 className="shutter-heading text-[28px]" style={{ color: "var(--color-charcoal-primary)" }}>
              Settings
            </h1>
          </div>

          {/* Notifications */}
          <div className="shutter-card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-[#ff3e00]" />
              <h2 className="text-[15px] font-semibold text-[#343433]">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#474645]">Push Notifications</div>
                  <div className="text-[11px] text-[#848281]">Receive alerts on your device</div>
                </div>
                <Toggle enabled={notifications} onChange={() => setNotifications(!notifications)} />
              </div>
              <div className="border-t border-[#f2f0ed] pt-4 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#474645]">Email Alerts</div>
                  <div className="text-[11px] text-[#848281]">Daily summary and important updates</div>
                </div>
                <Toggle enabled={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
              </div>
              <div className="border-t border-[#f2f0ed] pt-4 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#474645]">Low Stock Alerts</div>
                  <div className="text-[11px] text-[#848281]">Get notified when inventory is low</div>
                </div>
                <Toggle enabled={lowStockAlerts} onChange={() => setLowStockAlerts(!lowStockAlerts)} />
              </div>
              <div className="border-t border-[#f2f0ed] pt-4 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#474645]">Sound Effects</div>
                  <div className="text-[11px] text-[#848281]">Play sounds for scan and actions</div>
                </div>
                <Toggle enabled={soundEffects} onChange={() => setSoundEffects(!soundEffects)} />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="shutter-card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-[#0090ff]" />
              <h2 className="text-[15px] font-semibold text-[#343433]">Inventory</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#474645]">Auto Restock Suggestions</div>
                  <div className="text-[11px] text-[#848281]">AI generates restock recommendations automatically</div>
                </div>
                <Toggle enabled={autoRestock} onChange={() => setAutoRestock(!autoRestock)} />
              </div>
              <div className="border-t border-[#f2f0ed] pt-4">
                <div className="text-[13px] font-medium text-[#474645] mb-2">Default Low Stock Threshold</div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    defaultValue={10}
                    className="flex-1 accent-[#ff3e00]"
                  />
                  <span className="text-[13px] font-medium text-[#121212] w-8">10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Location */}
          <div className="shutter-card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[#00ca48]" />
              <h2 className="text-[15px] font-semibold text-[#343433]">Privacy & Location</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#474645]">Location Sharing</div>
                  <div className="text-[11px] text-[#848281]">Share location for heatmap and pindrops</div>
                </div>
                <Toggle enabled={locationSharing} onChange={() => setLocationSharing(!locationSharing)} />
              </div>
              <div className="border-t border-[#f2f0ed] pt-4 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#474645]">Anonymized Data Sharing</div>
                  <div className="text-[11px] text-[#848281]">Help improve demand predictions</div>
                </div>
                <Toggle enabled={dataSharing} onChange={() => setDataSharing(!dataSharing)} />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="shutter-card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-4 h-4 text-[#ffbb26]" />
              <h2 className="text-[15px] font-semibold text-[#343433]">Appearance</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#474645]">Dark Mode</div>
                  <div className="text-[11px] text-[#848281]">Switch to dark theme</div>
                </div>
                <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </div>
              <div className="border-t border-[#f2f0ed] pt-4">
                <div className="text-[13px] font-medium text-[#474645] mb-2">Language</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: "en", label: "English" },
                    { code: "hi", label: "Hindi" },
                    { code: "mr", label: "Marathi" },
                    { code: "ta", label: "Tamil" },
                    { code: "te", label: "Telugu" },
                    { code: "gu", label: "Gujarati" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`py-2 rounded-lg text-[12px] font-medium transition-colors ${
                        language === lang.code
                          ? "bg-[#121212] text-white"
                          : "bg-[#f8f7f4] text-[#474645] hover:bg-[#f2f0ed]"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="shutter-card mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-[#343433]" />
              <h2 className="text-[15px] font-semibold text-[#343433]">Account</h2>
            </div>
            <div className="space-y-2">
              <a
                href="/profile"
                className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#f8f7f4] transition-colors"
              >
                <span className="text-[13px] text-[#474645]">View Profile</span>
                <ChevronRight className="w-4 h-4 text-[#c6c6c6]" />
              </a>
              <button
                onClick={logout}
                className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#ff2b3a]/5 transition-colors text-left"
              >
                <span className="text-[13px] text-[#ff2b3a]">Log Out</span>
                <ChevronRight className="w-4 h-4 text-[#ff2b3a]/50" />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full shutter-btn-dark py-3 flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved Successfully
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
