import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Listen for dynamic authentication events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[AuthCallback] Supabase Auth event:", event, session);
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    });

    // 2. Perform an immediate check on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthCallback] Initial session resolution:", session);
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    });

    // 3. Setup a fallback timeout if authentication fails to resolve
    const timeoutId = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          console.warn("[AuthCallback] Session resolution timed out. Returning to login.");
          navigate("/login", { replace: true });
        }
      });
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbfaf9] dark:bg-[#121212] transition-colors">
      <div className="w-10 h-10 border-4 border-[#ff3e00]/10 border-t-[#ff3e00] rounded-full animate-spin mb-4"></div>
      <div className="text-[12px] text-[#848281] dark:text-[#a7a7a7] uppercase tracking-widest font-semibold">
        Completing login...
      </div>
    </div>
  );
}
