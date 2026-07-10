import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();
  const utils = trpc.useUtils();

  // ── Local Supabase session (fast, client-side) ────────────────
  const [hasLocalSession, setHasLocalSession] = useState<boolean | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

  // Initialize from local Supabase session on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasLocalSession === null) {
        console.warn("[useAuth] Session resolution timed out. Defaulting to false.");
        setHasLocalSession(false);
        setSupabaseUser(null);
      }
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timer);
      console.log("[useAuth] Local session resolved:", !!session, session?.user?.email);
      setHasLocalSession(!!session);
      setSupabaseUser(session?.user ?? null);
    }).catch(err => {
      clearTimeout(timer);
      console.error("[useAuth] Error getting session:", err);
      setHasLocalSession(false);
      setSupabaseUser(null);
    });

    return () => clearTimeout(timer);
  }, []);

  // Listen for auth state changes (e.g. after OAuth callback)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[useAuth] onAuthStateChange:", event, session?.user?.email ?? "null");
      setHasLocalSession(!!session);
      setSupabaseUser(session?.user ?? null);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Trigger background backend profile refresh — don't block on it
        refetch().catch(() => {});
      }
      if (event === "SIGNED_OUT") {
        refetch().catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Backend profile query (slow, optional) ────────────────────
  const {
    data: dbUser,
    isLoading: dbLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    // Only run when we have a local session
    enabled: hasLocalSession === true,
  });

  // ── Logout ────────────────────────────────────────────────────
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

  // ── Redirect if unauthenticated ────────────────────────────────
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;

    // Still determining local session — wait
    if (hasLocalSession === null) return;

    // Valid local session — user is authenticated, don't redirect
    if (hasLocalSession === true) return;

    // Skip if this is an OAuth callback URL
    const isCallback =
      window.location.hash.includes("access_token=") ||
      window.location.hash.includes("id_token=") ||
      window.location.search.includes("code=") ||
      window.location.search.includes("error=");
    if (isCallback) return;

    const currentPath = window.location.pathname;
    if (currentPath !== redirectPath) {
      console.warn("[useAuth] No local session — redirecting to:", redirectPath);
      navigate(redirectPath);
    }
  }, [redirectOnUnauthenticated, hasLocalSession, navigate, redirectPath]);

  // ── Build the user object ─────────────────────────────────────
  // Prefer DB user (has role/store info), fall back to Supabase user identity
  const user = dbUser ?? (supabaseUser ? {
    id: 0,
    unionId: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split("@")[0] ?? "User",
    email: supabaseUser.email ?? null,
    avatar: supabaseUser.user_metadata?.avatar_url ?? "",
    role: "user" as const,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
  } : null);

  // isLoading:
  // - true while we don't know if there's a local session yet
  // - true while logging out
  // - NOT blocked on the backend DB query (that loads in background)
  const isLoading = hasLocalSession === null || logoutMutation.isPending;

  return useMemo(
    () => ({
      user,
      isAuthenticated: hasLocalSession === true,
      isLoading,
      error,
      logout,
      refresh: refetch,
      dbLoading, // expose separately if pages need it
    }),
    [user, hasLocalSession, isLoading, dbLoading, error, logout, refetch],
  );
}


