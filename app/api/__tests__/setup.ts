import { beforeAll, afterAll, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.APP_ID = "test_app_id";
process.env.APP_SECRET = "test_secret_key_for_testing_min_32_chars_xxxxxxxxx";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "mysql://test:test@localhost:3306/shutter_test";
process.env.KIMI_AUTH_URL = "http://localhost:3000";
process.env.KIMI_OPEN_URL = "http://localhost:3000";
process.env.GOOGLE_CLIENT_ID = "test_google_client_id";
process.env.VITE_SUPABASE_URL = "http://localhost:3000";
process.env.VITE_SUPABASE_ANON_KEY = "test_anon_key";

let db: ReturnType<typeof getDb>;

beforeAll(async () => {
  db = getDb();
  // Tables should already exist from migrations
  // Just ensure we have a clean state
});

afterEach(async () => {
  // Clean up test data after each test
  if (db) {
    try {
      // Delete in reverse order of foreign key dependencies
      await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
      await db.execute(sql`TRUNCATE TABLE bill_items`);
      await db.execute(sql`TRUNCATE TABLE bills`);
      await db.execute(sql`TRUNCATE TABLE inventory`);
      await db.execute(sql`TRUNCATE TABLE products`);
      await db.execute(sql`TRUNCATE TABLE retailers`);
      await db.execute(sql`TRUNCATE TABLE campaign_signatures`);
      await db.execute(sql`TRUNCATE TABLE campaigns`);
      await db.execute(sql`TRUNCATE TABLE pindrops`);
      await db.execute(sql`TRUNCATE TABLE trade_opportunities`);
      await db.execute(sql`TRUNCATE TABLE demand_aggregates`);
      await db.execute(sql`TRUNCATE TABLE restock_recommendations`);
      await db.execute(sql`TRUNCATE TABLE genie_queries`);
      await db.execute(sql`TRUNCATE TABLE users`);
      await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    } catch (error) {
      console.warn("Failed to clean up test data:", error);
    }
  }
});

afterAll(async () => {
  // Close database connection
  if (db) {
    try {
      // Drizzle doesn't expose a close method directly
      // The connection will be closed when the process exits
    } catch (error) {
      console.warn("Failed to close database:", error);
    }
  }
});

// Helper function to create a test user
export async function createTestUser(overrides: Partial<{
  unionId: string;
  name: string;
  email: string;
  role: "user" | "admin";
}> = {}) {
  const db = getDb();
  const { users } = await import("@db/schema");

  const result = await db.insert(users).values({
    unionId: overrides.unionId || `test-union-${Date.now()}`,
    name: overrides.name || "Test User",
    email: overrides.email || `test${Date.now()}@example.com`,
    role: overrides.role || "user",
  });

  const userId = Number(result[0].insertId);
  const [user] = await db.select().from(users).where(sql`id = ${userId}`);
  return user;
}

// Helper function to create a test retailer
export async function createTestRetailer(userId: number, overrides: Partial<{
  storeName: string;
  ownerName: string;
  gstin: string;
}> = {}) {
  const db = getDb();
  const { retailers } = await import("@db/schema");

  const result = await db.insert(retailers).values({
    userId,
    storeName: overrides.storeName || "Test Store",
    ownerName: overrides.ownerName || "Test Owner",
    gstin: overrides.gstin || `27AAAAA0000A${Date.now().toString().slice(-3)}`,
  });

  const retailerId = Number(result[0].insertId);
  const [retailer] = await db.select().from(retailers).where(sql`id = ${retailerId}`);
  return retailer;
}

// Helper function to create a test product
export async function createTestProduct(overrides: Partial<{
  name: string;
  category: string;
  mrp: string;
  barcode: string;
}> = {}) {
  const db = getDb();
  const { products } = await import("@db/schema");

  const result = await db.insert(products).values({
    name: overrides.name || "Test Product",
    category: overrides.category || "Test Category",
    mrp: overrides.mrp || "100.00",
    barcode: overrides.barcode || `TEST${Date.now()}`,
  });

  const productId = Number(result[0].insertId);
  const [product] = await db.select().from(products).where(sql`id = ${productId}`);
  return product;
}
