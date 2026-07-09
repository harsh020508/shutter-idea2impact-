import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

app.post("/api/auth/google", async (c) => {
  try {
    const { idToken } = await c.req.json();
    if (!idToken) {
      return c.json({ error: "idToken is required" }, 400);
    }

    // Verify token with Google's public endpoint or use mock in local development
    let payload: any;
    if (idToken.startsWith("mock_google_token")) {
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
    console.error("[Google Auth] failed", error);
    return c.json({ error: error.message || "Google auth failed" }, 500);
  }
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction && !process.env.VERCEL) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
