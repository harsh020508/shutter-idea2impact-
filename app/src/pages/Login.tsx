import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowRight } from "lucide-react";

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showChooser, setShowChooser] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async (email: string) => {
    setIsLoading(true);
    try {
      const mockToken = `mock_google_token:${email}`;
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: mockToken }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        alert(`Google Sign In failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Google login failed", err);
      alert("Google Sign In encountered an error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfaf9]">
      <Card className="w-full max-w-sm border-[#f2f0ed] shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-[24px] font-bold text-[#121212]">Welcome to Shutter</CardTitle>
          <CardDescription className="text-[12px] text-[#848281]">Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col items-center justify-center">
          {/* Official styled Google button */}
          <button
            onClick={() => setShowChooser(true)}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[#dadce0] rounded-lg bg-white text-[#3c4043] font-medium text-[14px] hover:bg-[#f7f8f9] hover:border-[#d2e3fc] transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>
        </CardContent>
      </Card>

      {/* Google Account Chooser Modal */}
      {showChooser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="bg-white w-full max-w-[400px] rounded-lg p-8 shadow-2xl relative border border-[#dadce0] animate-in fade-in zoom-in-95 duration-150">
            {/* Close */}
            <button
              onClick={() => {
                setShowChooser(false);
                setShowCustomInput(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f8f7f4] flex items-center justify-center hover:bg-[#e8e7e4] transition-colors"
            >
              <X className="w-4 h-4 text-[#474645]" />
            </button>

            {/* Google Logo */}
            <div className="flex justify-center mb-6">
              <svg className="h-[28px]" viewBox="0 0 74 24" fill="none">
                <path d="M11.6 22.2c-6.1 0-11-4.9-11-11s4.9-11 11-11c3.3 0 5.8 1.3 7.6 3l-2.7 2.7c-1.3-1.2-3.1-2.1-4.9-2.1-3.9 0-7.2 3.2-7.2 7.4s3.3 7.4 7.2 7.4c2.3 0 3.8-.9 4.6-1.8.8-.8 1.3-2.1 1.5-3.6h-6.1v-3.7h9.8c.1.5.2 1.1.2 1.8.1 2.2-.5 4.9-2.1 6.5-1.5 1.7-3.6 2.7-6.9 2.7zm17.6-.2c-3.7 0-6.6-2.9-6.6-6.6s2.9-6.6 6.6-6.6 6.6 2.9 6.6 6.6-2.9 6.6-6.6 6.6zm0-3.3c1.8 0 3.3-1.5 3.3-3.3s-1.5-3.3-3.3-3.3-3.3 1.5-3.3 3.3 1.5 3.3 3.3 3.3zm14.3 3.3c-3.7 0-6.6-2.9-6.6-6.6s2.9-6.6 6.6-6.6 6.6 2.9 6.6 6.6-2.9 6.6-6.6 6.6zm0-3.3c1.8 0 3.3-1.5 3.3-3.3s-1.5-3.3-3.3-3.3-3.3 1.5-3.3 3.3 1.5 3.3 3.3 3.3zm14-11.8v11.4c0 4.7-2.8 6.6-6.1 6.6-3.1 0-5-.5-5.7-1.1l1.3-1.3c.5.5 1.5 1.1 2.8 1.1 2 0 3.3-1.2 3.3-3.6V20c-.8.9-2.2 1.7-4 1.7-3.7 0-6.7-3.2-6.7-6.9s3-6.9 6.7-6.9c1.8 0 3.2.8 4 1.7v-1.4h3.7zm-2.8 8.6c0-1.8-1.5-3.3-3.2-3.3s-3.3 1.5-3.3 3.3 1.5 3.3 3.3 3.3 3.2-1.5 3.2-3.3zm6.6-5v14.4h-3.6V.6h3.6v4.6zm10.2 8.2c-2.3 0-4.3-1.1-5.1-2.9l9.3-3.8-.3-.8c-.8-2-3-4.1-6-4.1-3.1 0-5.6 2.4-5.6 6.6 0 3.9 2.5 6.6 6.1 6.6 2.9 0 4.6-1.8 5.3-2.8l-1.5-1c-.5.8-1.2 1.8-2.3 1.8zm-2.8-8.5c.8 0 1.5.4 1.8 1l-6 2.5c0-1.9 1.4-3.5 3.2-3.5z" fill="#4285F4"/>
              </svg>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-[22px] font-medium text-[#202124] tracking-tight">Choose an account</h3>
              <p className="text-[14px] text-[#5f6368] mt-1">to continue to <span className="font-semibold text-[#1a73e8]">Shutter</span></p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-8 h-8 border-3 border-[#f2f0ed] border-t-[#1a73e8] rounded-full animate-spin mb-4" />
                <span className="text-[13px] text-[#5f6368]">Connecting to Google...</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* Harsh's account option */}
                <button
                  onClick={() => handleGoogleLogin("harshssingh020508@gmail.com")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#dadce0] hover:bg-[#f7f8f9] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-[16px] font-bold">
                    H
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#3c4043] truncate">Harsh Singh</div>
                    <div className="text-[12px] text-[#5f6368] truncate">harshssingh020508@gmail.com</div>
                  </div>
                  <span className="text-[11px] text-[#1a73e8] font-medium px-2 py-0.5 rounded-full bg-[#e8f0fe]">Signed out</span>
                </button>

                {/* Custom input toggle */}
                {!showCustomInput ? (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#f7f8f9] transition-all text-left border border-transparent"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#f1f3f4] text-[#5f6368] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <span className="text-[14px] font-medium text-[#1a73e8]">Use another account</span>
                  </button>
                ) : (
                  <div className="border border-[#dadce0] rounded-lg p-3 animate-in slide-in-from-top-2 duration-150 bg-[#fafafa]">
                    <label className="text-[11px] font-semibold text-[#5f6368] uppercase block mb-1">Enter Gmail Address</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="username@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-[#dadce0] rounded-md text-[13px] focus:outline-none focus:border-[#1a73e8] bg-white font-sans"
                      />
                      <button
                        onClick={() => {
                          if (customEmail.includes("@")) {
                            handleGoogleLogin(customEmail);
                          } else {
                            alert("Please enter a valid email address");
                          }
                        }}
                        className="bg-[#1a73e8] hover:bg-[#1557b0] text-white p-2 rounded-md transition-colors shrink-0 flex items-center justify-center"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between text-[11px] text-[#70757a] mt-8 pt-4 border-t border-[#f1f3f4]">
              <span>English (United States)</span>
              <div className="flex gap-3">
                <span className="hover:underline cursor-pointer">Help</span>
                <span className="hover:underline cursor-pointer">Privacy</span>
                <span className="hover:underline cursor-pointer">Terms</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
