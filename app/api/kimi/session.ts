import * as jose from "jose";
import { env } from "../lib/env";
import { createLogger } from "../lib/logger";
import type { SessionPayload } from "./types";

const log = createLogger("session");

const JWT_ALG = "HS256";
const MIN_SECRET_LENGTH = 32;

function validateAppSecret(): string {
  if (!env.appSecret) {
    throw new Error("APP_SECRET environment variable is required");
  }
  if (env.appSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`APP_SECRET must be at least ${MIN_SECRET_LENGTH} characters long for HS256 security`);
  }
  return env.appSecret;
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  const secretStr = validateAppSecret();
  const secret = new TextEncoder().encode(secretStr);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) {
    log.warn("No token provided for verification");
    return null;
  }
  try {
    const secretStr = validateAppSecret();
    const secret = new TextEncoder().encode(secretStr);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const { unionId, clientId } = payload;
    if (!unionId || !clientId) {
      log.warn("JWT payload missing required fields");
      return null;
    }
    return { unionId, clientId } as SessionPayload;
  } catch (error) {
    log.warn({ err: error }, "JWT verification failed");
    return null;
  }
}
