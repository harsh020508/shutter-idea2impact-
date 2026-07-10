import * as jose from "jose";
import { env } from "../lib/env";
import type { SessionPayload } from "./types";

const JWT_ALG = "HS256";

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  if (env.isProduction && !env.appSecret) {
    throw new Error("APP_SECRET environment variable is required in production");
  }
  const secretStr = env.appSecret || "developer_local_secret_must_be_at_least_32_characters_long_for_hs256";
  const secret = new TextEncoder().encode(secretStr);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    console.warn("[session] No token provided for verification.");
    return null;
  }
  try {
    if (env.isProduction && !env.appSecret) {
      throw new Error("APP_SECRET environment variable is required in production");
    }
    const secretStr = env.appSecret || "developer_local_secret_must_be_at_least_32_characters_long_for_hs256";
    const secret = new TextEncoder().encode(secretStr);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { unionId, clientId } = payload;
    if (!unionId || !clientId) {
      console.warn("[session] JWT payload missing required fields.");
      return null;
    }
    return { unionId, clientId } as SessionPayload;
  } catch (error) {
    console.warn("[session] JWT verification failed:", error);
    return null;
  }
}
