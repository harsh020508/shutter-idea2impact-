import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import BlobCharacter from "@/components/BlobCharacter";
import {
  Store,
  CheckCircle2,
  ArrowRight,
  User,
  Phone,
  FileText,
  Shield,
} from "lucide-react";

export default function RetailerSetup() {
  const navigate = useNavigate();
  useAuth({ redirectOnUnauthenticated: true });
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [gstin, setGstin] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const registerRetailer = trpc.retailer.register.useMutation({
    onSuccess: () => {
      setStep(4);
    },
  });

  const handleSubmit = () => {
    registerRetailer.mutate({
      storeName,
      ownerName,
      gstin: gstin.toUpperCase(),
      phone,
      address,
      city,
      state,
      pincode,
      latitude: 19.076,
      longitude: 72.8777,
    });
  };

  const isGstinValid = gstin.length === 15;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-warm-canvas)" }}>
      <Navigation />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[600px] mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <BlobCharacter color="green" size={72} expression="happy" delay={1} />
            </div>
            <h1
              className="shutter-heading text-[32px] mb-2"
              style={{ color: "var(--color-charcoal-primary)" }}
            >
              Set Up Your Store
            </h1>
            <p className="text-[14px] text-[#848281]">
              Join the Shutter network and unlock AI-powered inventory intelligence
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                    step >= s
                      ? "bg-[#121212] text-white"
                      : "bg-[#f2f0ed] text-[#848281]"
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-0.5 rounded ${
                      step > s ? "bg-[#121212]" : "bg-[#f2f0ed]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="shutter-card space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-[#ff3e00]" />
                <h2 className="text-[17px] font-semibold text-[#343433]">Store Information</h2>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g., Sharma Kirana Store"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Owner Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c6c6c6]" />
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c6c6c6]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!storeName || !ownerName}
                className="w-full shutter-btn-dark py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: GSTIN & Address */}
          {step === 2 && (
            <div className="shutter-card space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#0090ff]" />
                <h2 className="text-[17px] font-semibold text-[#343433]">GSTIN & Location</h2>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  GSTIN (15 characters) *
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c6c6c6]" />
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                    placeholder="27AABCU9603R1ZM"
                    maxLength={15}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl border bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20 font-mono ${
                      isGstinValid ? "border-[#00ca48]" : "border-[#f2f0ed]"
                    }`}
                  />
                </div>
                {isGstinValid && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <CheckCircle2 className="w-3 h-3 text-[#00ca48]" />
                    <span className="text-[11px] text-[#00ca48]">Valid GSTIN format</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                  Store Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#848281] mb-1.5 block">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.slice(0, 6))}
                    placeholder="400001"
                    maxLength={6}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#f2f0ed] bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-[#ff3e00]/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="shutter-btn-light flex-1 py-3"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!isGstinValid}
                  className="shutter-btn-dark flex-[2] py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="shutter-card space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#00ca48]" />
                <h2 className="text-[17px] font-semibold text-[#343433]">Review & Submit</h2>
              </div>

              <div className="bg-[#f8f7f4] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#848281]">Store Name</span>
                  <span className="text-[13px] font-medium text-[#343433]">{storeName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#848281]">Owner</span>
                  <span className="text-[13px] font-medium text-[#343433]">{ownerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#848281]">GSTIN</span>
                  <span className="text-[13px] font-medium text-[#343433] font-mono">
                    {gstin}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#848281]">Location</span>
                  <span className="text-[13px] font-medium text-[#343433]">
                    {city}, {state}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#848281]">Phone</span>
                  <span className="text-[13px] font-medium text-[#343433]">{phone}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0090ff]/5 border border-[#0090ff]/10 flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#0090ff] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#474645]">
                  GSTIN verification will be completed within 24 hours. You'll receive a
                  notification once verified.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="shutter-btn-light flex-1 py-3"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={registerRetailer.isPending}
                  className="shutter-btn-dark flex-[2] py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {registerRetailer.isPending ? "Submitting..." : "Complete Setup"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="shutter-card text-center py-10">
              <div className="w-16 h-16 rounded-full bg-[#00ca48]/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-[#00ca48]" />
              </div>
              <h2 className="shutter-heading text-[24px] mb-3" style={{ color: "var(--color-charcoal-primary)" }}>
                Welcome to Shutter!
              </h2>
              <p className="text-[14px] text-[#848281] mb-2">
                Your store <strong className="text-[#343433]">{storeName}</strong> is registered.
              </p>
              <p className="text-[13px] text-[#848281] mb-6">
                GSTIN verification is in progress. Start exploring your dashboard!
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="shutter-btn-dark inline-flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
