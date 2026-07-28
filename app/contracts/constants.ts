export const Session = {
  cookieName: "kimi_sid",
  maxAgeMs: 24 * 60 * 60 * 1000, // 24 hours — matches JWT expiry in session.ts
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
} as const;
