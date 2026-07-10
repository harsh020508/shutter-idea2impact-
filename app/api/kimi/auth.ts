import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import * as jose from "jose";
import { env } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { signSessionToken } from "./session";
import { users as kimiUsers } from "./platform";
import { findUserByUnionId, upsertUser } from "../queries/users";
import type { TokenResponse } from "./types";

async function exchangeAuthCode(
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.appId,
    redirect_uri: redirectUri,
    client_secret: env.appSecret,
  });

  const resp = await fetch(`${env.kimiAuthUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<TokenResponse>;
}

// Define jwks lazily to avoid throwing "Invalid URL" on import when env.kimiAuthUrl is not configured
let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) {
    const authUrl = env.kimiAuthUrl || "http://localhost:3000";
    jwks = jose.createRemoteJWKSet(
      new URL(`${authUrl}/api/.well-known/jwks.json`),
    );
  }
  return jwks;
}

async function verifyAccessToken(
  accessToken: string,
): Promise<{ userId: string; clientId: string }> {
  if (accessToken === "mock_access_token") {
    return { userId: "mock_developer", clientId: "mock_client" };
  }
  const { payload } = await jose.jwtVerify(accessToken, getJwks());
  const userId = payload.user_id as string;
  const clientId = payload.client_id as string;
  if (!userId) {
    throw new Error("user_id missing from access token");
  }
  return { userId, clientId };
}

export async function authenticateRequest(headers: Headers) {
  const authHeader = headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    console.log("[Supabase Auth DEBUG] No Bearer token found in Authorization header");
    return undefined;
  }
  const token = authHeader.substring(7);
  if (!token) {
    console.log("[Supabase Auth DEBUG] Bearer token is empty");
    return undefined;
  }

  try {
    const url = `${env.supabaseUrl}/auth/v1/user`;
    console.log("[Supabase Auth DEBUG] Verifying token with URL:", url);
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": env.supabaseAnonKey,
      }
    });

    if (!response.ok) {
      console.warn("[Supabase Auth DEBUG] Token verification failed. HTTP Status:", response.status);
      const text = await response.text().catch(() => "");
      console.warn("[Supabase Auth DEBUG] Error response body:", text);
      return undefined;
    }

    const payload: any = await response.json();
    const userId = payload.id;
    console.log("[Supabase Auth DEBUG] Token verified successfully. Supabase User UUID:", userId);
    if (!userId) {
      console.warn("[Supabase Auth DEBUG] payload.id is missing in Supabase user response");
      return undefined;
    }

    // Upsert this user in TiDB Cloud MySQL to map with user tables
    await upsertUser({
      unionId: userId,
      name: payload.user_metadata?.full_name || payload.email?.split("@")[0] || "Supabase User",
      avatar: payload.user_metadata?.avatar_url || "",
      lastSignInAt: new Date(),
    });

    const dbUser = await findUserByUnionId(userId);
    console.log("[Supabase Auth DEBUG] Database user resolved:", dbUser);
    return dbUser || undefined;
  } catch (err) {
    console.error("[Supabase Auth DEBUG] Exception during authenticateRequest:", err);
    return undefined;
  }
}

export function createOAuthCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");

    if (error) {
      if (error === "access_denied") {
        return c.redirect("/", 302);
      }
      return c.json(
        { error, error_description: errorDescription },
        400,
      );
    }

    if (!code || !state) {
      return c.json({ error: "code and state are required" }, 400);
    }

    try {
      const redirectUri = atob(state);
      let userId = "mock_developer";
      let userName = "Local Developer";
      let userAvatar = "";

      if (code !== "mock_code" && env.kimiAuthUrl) {
        const tokenResp = await exchangeAuthCode(code, redirectUri);
        const verified = await verifyAccessToken(tokenResp.access_token);
        userId = verified.userId;
        const userProfile = await kimiUsers.getProfile(tokenResp.access_token);
        if (!userProfile) {
          throw new Error("Failed to fetch user profile from Kimi Open");
        }
        userName = userProfile.name;
        userAvatar = userProfile.avatar_url;
      }

      await upsertUser({
        unionId: userId,
        name: userName,
        avatar: userAvatar,
        lastSignInAt: new Date(),
      });

      const token = await signSessionToken({
        unionId: userId,
        clientId: env.appId || "mock_app_id",
      });

      const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
      setCookie(c, Session.cookieName, token, {
        ...cookieOpts,
        maxAge: Session.maxAgeMs / 1000,
      });

      return c.redirect("/", 302);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      return c.json({ error: "OAuth callback failed" }, 500);
    }
  };
}

export { exchangeAuthCode, verifyAccessToken };
