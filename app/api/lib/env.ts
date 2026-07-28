import "dotenv/config";

const MIN_SECRET_LENGTH = 32;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateAppSecret(secret: string): string {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`APP_SECRET must be at least ${MIN_SECRET_LENGTH} characters long for HS256 security`);
  }
  return secret;
}

const appSecret = required("APP_SECRET");
validateAppSecret(appSecret);

export const env = {
  appId: required("APP_ID"),
  appSecret: appSecret,
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
  googleClientId: required("GOOGLE_CLIENT_ID"),
  supabaseUrl: required("VITE_SUPABASE_URL"),
  supabaseAnonKey: required("VITE_SUPABASE_ANON_KEY"),
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",").map(s => s.trim()).filter(Boolean) ??
    (process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000", "http://localhost:5173"]),
};
