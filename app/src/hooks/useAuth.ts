import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";
import { supabase } from "@/lib/supabase";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const [authResolving, setAuthResolving] = useState(() => {
    // Check both hash parameters (Implicit flow) and search parameters (PKCE flow / errors)
    const hasHash = window.location.hash.includes("access_token=") || window.location.hash.includes("id_token=");
    const hasSearch = window.location.search.includes("code=") || window.location.search.includes("error=");
    return hasHash || hasSearch;
  });

  const [hasLocalSession, setHasLocalSession] = useState<boolean | null>(null);

  // Initialize by reading active Supabase session
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasLocalSession === null) {
        console.warn("[useAuth DEBUG] Local session resolution timed out. Defaulting to false.");
        setHasLocalSession(false);
      }
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timer);
      console.log("[useAuth DEBUG] Initial local session resolution:", !!session);
      setHasLocalSession(!!session);
    }).catch(err => {
      clearTimeout(timer);
      console.error("[useAuth DEBUG] Error getting session on mount:", err);
      setHasLocalSession(false);
    });

    return () => clearTimeout(timer);
  }, []);

  // ── Logging State (User Request) ──────────────────────────────────
  useEffect(() => {
    console.log("[useAuth DEBUG] Auth State Change:", {
      user: user ?? null,
      isLoading,
      authResolving,
      hasLocalSession,
      hash: window.location.hash,
      search: window.location.search,
      pathname: window.location.pathname
    });

    supabase.auth.getSession().then(({ data }) => {
      console.log("[useAuth DEBUG] Current Supabase session:", data?.session ?? "null");
      console.log("[useAuth DEBUG] Current Supabase user:", data?.session?.user ?? "null");
    }).catch(err => {
      console.error("[useAuth DEBUG] Error fetching Supabase session:", err);
    });
  }, [user, isLoading, authResolving, hasLocalSession]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[useAuth DEBUG] Supabase onAuthStateChange triggered: ${event}`, session);
      setHasLocalSession(!!session);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setAuthResolving(true);
        refetch().finally(() => {
          setAuthResolving(false);
        });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate(redirectPath);
    },
  });

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signout failed", err);
    }
    logoutMutation.mutate();
  }, [logoutMutation]);

  useEffect(() => {
    if (redirectOnUnauthenticated) {
      // Do not redirect if we are checking the local session or have an active local session
      if (hasLocalSession === null || hasLocalSession === true) {
        return;
      }

      // Also skip redirect if it's an active callback URL
      const isCallback = 
        window.location.hash.includes("access_token=") || 
        window.location.hash.includes("id_token=") ||
        window.location.search.includes("code=") ||
        window.location.search.includes("error=");

      if (isCallback) {
        console.log("[useAuth DEBUG] Redirect to /login skipped: URL indicates callback is processing");
        return;
      }

      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        console.warn("[useAuth DEBUG] Redirecting to /login because no local session exists:", {
          hasLocalSession,
          currentPath,
          redirectPath
        });
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, hasLocalSession, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || authResolving || hasLocalSession === null || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, authResolving, hasLocalSession, logoutMutation.isPending, error, logout, refetch],
  );
}
