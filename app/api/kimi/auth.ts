import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import * as jose from "jose";
import { env } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { signSessionToken } from "./session";
import { users as kimiUsers } from "./platform";
import { findUserByUnionId, upsertUser } from "../queries/users";
import type { TokenResponse } from "./types";
import crypto from "crypto";

// Cookie names for OAuth state and PKCE
const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_PKCE_VERIFIER_COOKIE = "oauth_pkce_verifier";

/**
 * Generates a cryptographically secure random string for state/PKCE
 */
function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

/**
 * Creates HMAC signature for state parameter to prevent tampering
 */
function signState(stateData: string): string {
  const hmac = crypto.createHmac("sha256", env.appSecret);
  hmac.update(stateData);
  const signature = hmac.digest("base64url");
  return `${stateData}.${signature}`;
}

/**
 * Verifies HMAC signature on state parameter
 */
function verifyState(signedState: string): string | null {
  try {
    const lastDotIndex = signedState.lastIndexOf(".");
    if (lastDotIndex === -1) return null;

    const stateData = signedState.substring(0, lastDotIndex);
    const providedSignature = signedState.substring(lastDotIndex + 1);

    const expectedSignature = signState(stateData).split(".")[1];

    if (!crypto.timingSafeEqual(
      Buffer.from(providedSignature, "base64url"),
      Buffer.from(expectedSignature, "base64url")
    )) {
      return null;
    }

    return stateData;
  } catch {
    return null;
  }
}

/**
 * Generates PKCE code verifier and challenge
 */
function generatePkce(): { verifier: string; challenge: string } {
  const verifier = generateRandomString(32);
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

/**
 * Builds the OAuth authorization URL with state and PKCE
 * This should be called when initiating the OAuth flow
 */
export function buildOAuthAuthorizationUrl(redirectUri: string): { url: string; state: string; verifier: string } {
  const stateNonce = generateRandomString(16);
  const stateData = Buffer.from(JSON.stringify({
    redirectUri,
    nonce: stateNonce,
    timestamp: Date.now()
  })).toString("base64url");
  const signedState = signState(stateData);

  const { verifier, challenge } = generatePkce();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.appId,
    redirect_uri: redirectUri,
    state: signedState,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const url = `${env.kimiAuthUrl}/api/oauth/authorize?${params.toString()}`;

  return { url, state: signedState, verifier };
}

async function exchangeAuthCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<TokenResponse> {
  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    client_id: env.appId,
    redirect_uri: redirectUri,
    client_secret: env.appSecret,
  };

  // Include PKCE verifier if available
  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const resp = await fetch(`${env.kimiAuthUrl}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
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
  if (!env.isProduction && accessToken === "mock_access_token") {
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
    return undefined;
  }
  const token = authHeader.substring(7);
  if (!token) {
    return undefined;
  }

  try {
    const url = `${env.supabaseUrl}/auth/v1/user`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": env.supabaseAnonKey,
      }
    });

    if (!response.ok) {
      return undefined;
    }

    const payload: any = await response.json();
    const userId = payload.id;
    if (!userId) {
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
    return dbUser || undefined;
  } catch (err) {
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
      // Verify HMAC signature on state parameter
      const stateData = verifyState(state);
      if (!stateData) {
        console.error("[OAuth] Invalid state signature - possible CSRF attack");
        return c.json({ error: "Invalid state parameter" }, 400);
      }

      // Parse state data
      let redirectUri: string;
      try {
        const decoded = JSON.parse(Buffer.from(stateData, "base64url").toString("utf-8"));
        // Check state is not too old (5 minutes max)
        const stateAge = Date.now() - decoded.timestamp;
        if (stateAge > 5 * 60 * 1000) {
          console.error("[OAuth] State expired");
          return c.json({ error: "State parameter expired" }, 400);
        }
        redirectUri = decoded.redirectUri;
      } catch {
        // Fallback for legacy state format (just base64 redirect URI)
        redirectUri = Buffer.from(stateData, "base64url").toString("utf-8");
      }

      // Get PKCE verifier from cookie if available
      const codeVerifier = getCookie(c, OAUTH_PKCE_VERIFIER_COOKIE);

      let userId = "mock_developer";
      let userName = "Local Developer";
      let userAvatar = "";

      const isMockCode = !env.isProduction && code === "mock_code";
      if (!isMockCode && env.kimiAuthUrl) {
        const tokenResp = await exchangeAuthCode(code, redirectUri, codeVerifier);
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

      // Clear OAuth cookies
      setCookie(c, OAUTH_STATE_COOKIE, "", { ...cookieOpts, maxAge: 0 });
      setCookie(c, OAUTH_PKCE_VERIFIER_COOKIE, "", { ...cookieOpts, maxAge: 0 });

      return c.redirect("/", 302);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      return c.json({ error: "OAuth callback failed" }, 500);
    }
  };
}

export { exchangeAuthCode, verifyAccessToken };
