import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Password updated successfully! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfaf9] p-4">
      <Card className="w-full max-w-sm border-[#f2f0ed] shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-[24px] font-bold text-[#121212]">New Password</CardTitle>
          <CardDescription className="text-[12px] text-[#848281]">Enter your new account password</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="bg-[#ff3e00]/10 border border-[#ff3e00]/20 rounded-xl p-3 text-[12px] text-[#ff3e00] text-center leading-relaxed">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-550/10 border border-emerald-500/20 rounded-xl p-3 text-[12px] text-emerald-600 text-center leading-relaxed">
                {successMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[11px] font-semibold text-[#848281] uppercase tracking-wider">
                New Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 border border-[#dadce0] rounded-xl text-[13px] focus:outline-none focus:border-[#121212] bg-white font-sans"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#121212] hover:bg-[#232323] text-white py-2.5 rounded-xl text-[13px] font-semibold transition-colors mt-2"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
