import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";
import { etag } from "hono/etag";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createLogger } from "./lib/logger";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const log = createLogger("boot");

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(opts: { windowMs: number; max: number }) {
  return async (c: any, next: any) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + opts.windowMs });
      await next();
      return;
    }

    if (entry.count >= opts.max) {
      return c.json({ error: "Too many requests, please try again later" }, 429);
    }

    entry.count++;
    await next();
  };
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(secureHeaders());
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (env.allowedOrigins.includes(origin)) {
        return origin;
      }
      return env.allowedOrigins[0] ?? "";
    },
    credentials: true,
  })
);
app.use(csrf());
app.use(bodyLimit({ maxSize: 2 * 1024 * 1024 }));

// ETag support for cache validation
app.use("/api/*", etag());

// Cache-Control headers for public GET endpoints
app.use("/api/trpc/*", async (c, next) => {
  await next();
  if (c.req.method === "GET" && c.res.status === 200) {
    c.res.headers.set("Cache-Control", "public, max-age=300");
  }
});

app.get(Paths.oauthCallback, createOAuthCallbackHandler());

app.post("/api/auth/google", rateLimit({ windowMs: 60_000, max: 10 }), async (c) => {
  try {
    const { idToken } = await c.req.json();
    if (!idToken) {
      return c.json({ error: "idToken is required" }, 400);
    }

    // Verify token with Google's public endpoint or use mock in local development
    let payload: any;
    if (!env.isProduction && idToken.startsWith("mock_google_token")) {
      const email = idToken.split(":")[1] || "harshssingh020508@gmail.com";
      const name = email.split("@")[0].split(".").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
      payload = {
        sub: `mock_${email}`,
        name: name,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      };
    } else {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!response.ok) {
        return c.json({ error: "Invalid Google token" }, 401);
      }
      payload = await response.json();

      // Check client ID / audience matches if configured
      if (env.googleClientId && payload.aud !== env.googleClientId) {
        return c.json({ error: "Token audience mismatch" }, 401);
      }
    }

    const userId = `google_${payload.sub}`;
    
    // Upsert user in db
    const { upsertUser } = await import("./queries/users");
    await upsertUser({
      unionId: userId,
      name: payload.name || "Google User",
      avatar: payload.picture || "",
      lastSignInAt: new Date(),
    });

    // Create session token
    const { signSessionToken } = await import("./kimi/session");
    const sessionToken = await signSessionToken({
      unionId: userId,
      clientId: env.appId || "shutter_local",
    });

    // Set cookie
    const { getSessionCookieOptions } = await import("./lib/cookies");
    const { setCookie } = await import("hono/cookie");
    const { Session } = await import("@contracts/constants");
    
    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
    setCookie(c, Session.cookieName, sessionToken, {
      ...cookieOpts,
      maxAge: Session.maxAgeMs / 1000,
    });

    return c.json({ success: true });
  } catch (error: any) {
    log.error({ err: error }, "Google Auth failed");
    return c.json({ error: error.message || "Google auth failed" }, 500);
  }
});

app.use("/api/trpc/*", rateLimit({ windowMs: 60_000, max: 30 }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Readiness probe - checks database connection
app.get("/readyz", async (c) => {
  try {
    const { getDb } = await import("./queries/connection");
    const db = getDb();
    // Simple query to verify DB connection
    await db.execute(sql`SELECT 1`);
    return c.json({ status: "ready", timestamp: new Date().toISOString() });
  } catch (error) {
    return c.json(
      { status: "not_ready", error: String(error), timestamp: new Date().toISOString() },
      503
    );
  }
});

export default app;

if (env.isProduction && !process.env.VERCEL) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  const server = serve({ fetch: app.fetch, port }, () => {
    log.info(`Server running on http://localhost:${port}/`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    log.info(`[${signal}] Shutting down gracefully...`);

    // Close database pool
    try {
      const { closePool } = await import("./queries/connection");
      await closePool();
      log.info("Database pool closed");
    } catch (err) {
      log.error({ err }, "Error closing database pool");
    }

    // Close HTTP server
    server.close(() => {
      log.info("HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      log.error("Forced exit after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
