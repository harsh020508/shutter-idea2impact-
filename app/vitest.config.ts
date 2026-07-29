import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

process.env.NODE_ENV = "test";
process.env.APP_ID = "test_app_id";
process.env.APP_SECRET = "test_secret_key_for_testing_min_32_chars_xxxxxxxxx";
process.env.DATABASE_URL = process.env.DATABASE_URL || "mysql://test:test@localhost:3306/shutter_test";
process.env.KIMI_AUTH_URL = "http://localhost:3000";
process.env.KIMI_OPEN_URL = "http://localhost:3000";
process.env.GOOGLE_CLIENT_ID = "test_google_client_id";
process.env.VITE_SUPABASE_URL = "http://localhost:3000";
process.env.VITE_SUPABASE_ANON_KEY = "test_anon_key";

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "src"),
      "@contracts": path.resolve(templateRoot, "contracts"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
      "@db": path.resolve(templateRoot, "db"),
    },
  },
  test: {
    environment: "node",
    include: ["api/**/*.test.ts", "api/**/*.spec.ts"],
    setupFiles: ["./api/__tests__/setup.ts"],
  },
});
