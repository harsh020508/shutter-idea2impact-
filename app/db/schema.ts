import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  decimal,
  int,
  json,
  index,
} from "drizzle-orm/mysql-core";

// ── Core Users (managed by Kimi OAuth) ──────────────────────────────
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

// ── Retailers / Kirana Stores (B2B) ─────────────────────────────────
export const retailers = mysqlTable(
  "retailers",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    storeName: varchar("storeName", { length: 255 }).notNull(),
    ownerName: varchar("ownerName", { length: 255 }).notNull(),
    gstin: varchar("gstin", { length: 15 }).notNull().unique(),
    gstinVerified: mysqlEnum("gstinVerified", ["pending", "verified", "rejected"])
      .default("pending")
      .notNull(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    pincode: varchar("pincode", { length: 10 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    geohash: varchar("geohash", { length: 12 }),
    catchmentRadius: int("catchmentRadius").default(5).notNull(), // km
    subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro"])
      .default("free")
      .notNull(),
    subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "inactive", "trial"])
      .default("trial")
      .notNull(),
    isActive: mysqlEnum("isActive", ["active", "inactive"])
      .default("active")
      .notNull(),
    upiId: varchar("upiId", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("retailer_user_idx").on(table.userId),
    index("retailer_geohash_idx").on(table.geohash),
    index("retailer_city_idx").on(table.city),
    index("retailer_gstin_idx").on(table.gstin),
  ]
);

// ── Product Catalog ──────────────────────────────────────────────────
export const products = mysqlTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    subcategory: varchar("subcategory", { length: 100 }),
    barcode: varchar("barcode", { length: 50 }).unique(),
    mrp: decimal("mrp", { precision: 10, scale: 2 }).notNull(),
    gstRate: decimal("gstRate", { precision: 5, scale: 2 }).default("0"),
    unit: varchar("unit", { length: 20 }).default("pcs"),
    description: text("description"),
    imageUrl: text("imageUrl"),
    isActive: mysqlEnum("isActive", ["active", "inactive"])
      .default("active")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("product_category_idx").on(table.category),
    index("product_barcode_idx").on(table.barcode),
  ]
);

// ── Inventory per Retailer ──────────────────────────────────────────
export const inventory = mysqlTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    retailerId: bigint("retailerId", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
    quantity: int("quantity").default(0).notNull(),
    lowStockThreshold: int("lowStockThreshold").default(10).notNull(),
    costPrice: decimal("costPrice", { precision: 10, scale: 2 }),
    sellingPrice: decimal("sellingPrice", { precision: 10, scale: 2 }),
    surplusFlag: mysqlEnum("surplusFlag", ["normal", "surplus", "dead_stock"])
      .default("normal")
      .notNull(),
    surplusQuantity: int("surplusQuantity").default(0),
    expiryDate: varchar("expiryDate", { length: 64 }),
    lastRestockedAt: timestamp("lastRestockedAt"),
    aiForecastData: json("aiForecastData"), // { predictedDemand: number, confidence: number, restockRecommendation: number }
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("inventory_retailer_idx").on(table.retailerId),
    index("inventory_product_idx").on(table.productId),
    index("inventory_surplus_idx").on(table.surplusFlag),
  ]
);

// ── Bills / QR Billing Transactions ─────────────────────────────────
export const bills = mysqlTable(
  "bills",
  {
    id: serial("id").primaryKey(),
    retailerId: bigint("retailerId", { mode: "number", unsigned: true }).notNull(),
    billNumber: varchar("billNumber", { length: 50 }).notNull(),
    customerPhone: varchar("customerPhone", { length: 20 }),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    gstAmount: decimal("gstAmount", { precision: 12, scale: 2 }).default("0"),
    discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: mysqlEnum("paymentMethod", ["cash", "upi", "card"]).notNull(),
    status: mysqlEnum("status", ["pending", "completed", "cancelled"])
      .default("completed")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("bill_retailer_idx").on(table.retailerId),
    index("bill_created_idx").on(table.createdAt),
  ]
);

// ── Bill Items ──────────────────────────────────────────────────────
export const billItems = mysqlTable(
  "bill_items",
  {
    id: serial("id").primaryKey(),
    billId: bigint("billId", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
    productName: varchar("productName", { length: 255 }).notNull(),
    quantity: int("quantity").notNull(),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
    gstRate: decimal("gstRate", { precision: 5, scale: 2 }).default("0"),
    lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("billitem_bill_idx").on(table.billId)]
);

// ── Trade Opportunities (Matching Engine) ───────────────────────────
export const tradeOpportunities = mysqlTable(
  "trade_opportunities",
  {
    id: serial("id").primaryKey(),
    sellerRetailerId: bigint("sellerRetailerId", { mode: "number", unsigned: true }).notNull(),
    buyerRetailerId: bigint("buyerRetailerId", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
    quantity: int("quantity").notNull(),
    sellerPrice: decimal("sellerPrice", { precision: 10, scale: 2 }).notNull(),
    matchScore: decimal("matchScore", { precision: 5, scale: 2 }).notNull(), // 0-100
    distance: decimal("distance", { precision: 8, scale: 2 }), // km
    status: mysqlEnum("status", ["pending", "seller_confirmed", "buyer_confirmed", "completed", "cancelled"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("trade_seller_idx").on(table.sellerRetailerId),
    index("trade_buyer_idx").on(table.buyerRetailerId),
    index("trade_status_idx").on(table.status),
  ]
);

// ── Pindrops (B2C Consumer Demand Signals) ──────────────────────────
export const pindrops = mysqlTable(
  "pindrops",
  {
    id: serial("id").primaryKey(),
    productName: varchar("productName", { length: 255 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    geohash: varchar("geohash", { length: 12 }).notNull(),
    deviceId: varchar("deviceId", { length: 64 }).notNull(), // dedup key
    note: text("note"),
    urgency: mysqlEnum("urgency", ["low", "medium", "high"]).default("medium").notNull(),
    isActive: mysqlEnum("isActive", ["active", "resolved"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("pindrop_geohash_idx").on(table.geohash),
    index("pindrop_category_idx").on(table.category),
    index("pindrop_created_idx").on(table.createdAt),
    index("pindrop_device_idx").on(table.deviceId),
  ]
);

// ── Community Campaigns ─────────────────────────────────────────────
export const campaigns = mysqlTable(
  "campaigns",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    requestType: mysqlEnum("requestType", ["new_store", "product_category", "brand"]).notNull(),
    category: varchar("category", { length: 100 }),
    targetSignatures: int("targetSignatures").default(50).notNull(),
    currentSignatures: int("currentSignatures").default(0).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    geohash: varchar("geohash", { length: 12 }),
    status: mysqlEnum("status", ["active", "achieved", "closed"])
      .default("active")
      .notNull(),
    creatorDeviceId: varchar("creatorDeviceId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("campaign_geohash_idx").on(table.geohash),
    index("campaign_status_idx").on(table.status),
  ]
);

// ── Campaign Signatures ─────────────────────────────────────────────
export const campaignSignatures = mysqlTable(
  "campaign_signatures",
  {
    id: serial("id").primaryKey(),
    campaignId: bigint("campaignId", { mode: "number", unsigned: true }).notNull(),
    deviceId: varchar("deviceId", { length: 64 }).notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("sig_campaign_idx").on(table.campaignId),
    index("sig_device_idx").on(table.deviceId),
  ]
);

// ── Demand Aggregates (for heatmap) ─────────────────────────────────
export const demandAggregates = mysqlTable(
  "demand_aggregates",
  {
    id: serial("id").primaryKey(),
    geohash: varchar("geohash", { length: 7 }).notNull(), // 7-char geohash ~ 0.15km precision
    latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    demandScore: int("demandScore").default(0).notNull(), // 0-100
    pindropCount: int("pindropCount").default(0).notNull(),
    searchCount: int("searchCount").default(0).notNull(),
    campaignCount: int("campaignCount").default(0).notNull(),
    successProbability: mysqlEnum("successProbability", ["low", "medium", "high"])
      .default("medium")
      .notNull(),
    computedAt: timestamp("computedAt").defaultNow().notNull(),
  },
  (table) => [
    index("da_geohash_idx").on(table.geohash),
    index("da_category_idx").on(table.category),
    index("da_score_idx").on(table.demandScore),
  ]
);

// ── AI Restock Recommendations ──────────────────────────────────────
export const restockRecommendations = mysqlTable(
  "restock_recommendations",
  {
    id: serial("id").primaryKey(),
    retailerId: bigint("retailerId", { mode: "number", unsigned: true }).notNull(),
    productId: bigint("productId", { mode: "number", unsigned: true }).notNull(),
    currentStock: int("currentStock").notNull(),
    recommendedQuantity: int("recommendedQuantity").notNull(),
    predictedDemand: int("predictedDemand").notNull(),
    confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
    reason: text("reason"),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "ordered"])
      .default("pending")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("rec_retailer_idx").on(table.retailerId),
    index("rec_status_idx").on(table.status),
  ]
);

// ── Genie Toolkit Queries ───────────────────────────────────────────
export const genieQueries = mysqlTable(
  "genie_queries",
  {
    id: serial("id").primaryKey(),
    retailerId: bigint("retailerId", { mode: "number", unsigned: true }).notNull(),
    query: text("query").notNull(),
    locationContext: json("locationContext"), // { city, pincode, radius }
    aiResponse: text("aiResponse"),
    insights: json("insights"), // structured insights
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("genie_retailer_idx").on(table.retailerId)]
);

// ── Type Exports ────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Retailer = typeof retailers.$inferSelect;
export type InsertRetailer = typeof retailers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = typeof inventory.$inferInsert;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = typeof bills.$inferInsert;

export type BillItem = typeof billItems.$inferSelect;
export type InsertBillItem = typeof billItems.$inferInsert;

export type TradeOpportunity = typeof tradeOpportunities.$inferSelect;
export type InsertTradeOpportunity = typeof tradeOpportunities.$inferInsert;

export type Pindrop = typeof pindrops.$inferSelect;
export type InsertPindrop = typeof pindrops.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

export type CampaignSignature = typeof campaignSignatures.$inferSelect;
export type InsertCampaignSignature = typeof campaignSignatures.$inferInsert;

export type DemandAggregate = typeof demandAggregates.$inferSelect;
export type InsertDemandAggregate = typeof demandAggregates.$inferInsert;

export type RestockRecommendation = typeof restockRecommendations.$inferSelect;
export type InsertRestockRecommendation = typeof restockRecommendations.$inferInsert;

export type GenieQuery = typeof genieQueries.$inferSelect;
export type InsertGenieQuery = typeof genieQueries.$inferInsert;
