import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
        // Force refresh auth context and navigate
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during Google Sign In.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfaf9] p-4">
      <Card className="w-full max-w-sm border-[#f2f0ed] shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-[24px] font-bold text-[#121212]">Welcome to Shutter</CardTitle>
          <CardDescription className="text-[12px] text-[#848281]">Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="bg-[#ff3e00]/10 border border-[#ff3e00]/20 rounded-xl p-3 text-[12px] text-[#ff3e00] text-center leading-relaxed">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-semibold text-[#848281] uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2 border border-[#dadce0] rounded-xl text-[13px] focus:outline-none focus:border-[#121212] bg-white font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[11px] font-semibold text-[#848281] uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[11px] text-[#ff3e00] hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
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
              {loading ? "Signing in..." : "Log In"}
            </Button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-[#f2f0ed]"></div>
            <span className="text-[10px] text-[#848281] px-3 uppercase tracking-wider font-semibold">Or continue with</span>
            <div className="flex-1 border-t border-[#f2f0ed]"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[#dadce0] rounded-xl bg-white text-[#3c4043] font-medium text-[13px] hover:bg-[#f7f8f9] transition-all shadow-sm mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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

          <div className="text-center text-[12px] text-[#848281] border-t border-[#f2f0ed] pt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#ff3e00] hover:underline font-medium">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
