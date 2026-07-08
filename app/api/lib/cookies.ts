import type { CookieOptions } from "hono/utils/cookie";
import { env } from "./env";

function isLocalhost(headers: Headers): boolean {
  if (!env.isProduction) return true;
  const host = (headers.get("host") || "").toLowerCase();
  return (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("[::1]")
  );
}

export function getSessionCookieOptions(headers: Headers): CookieOptions {
  const localhost = isLocalhost(headers);

  return {
    httpOnly: true,
    path: "/",
    sameSite: localhost ? "Lax" : "None",
    secure: !localhost,
  };
}
