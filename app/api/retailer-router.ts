import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { retailers } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import { encodeGeohash } from "./lib/geohash";

export const retailerRouter = createRouter({
  // Register a new retailer
  register: authedQuery
    .input(
      z.object({
        storeName: z.string().min(1).max(100),
        ownerName: z.string().min(1).max(100),
        gstin: z.string().length(15),
        phone: z.string().max(15).optional(),
        email: z.string().email().max(255).optional(),
        address: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        pincode: z.string().max(10).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        catchmentRadius: z.number().default(5),
        upiId: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Check if GSTIN already registered
      const existing = await db
        .select()
        .from(retailers)
        .where(eq(retailers.gstin, input.gstin))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("GSTIN already registered");
      }

      // Compute geohash if coords provided
      let geohash: string | undefined;
      if (input.latitude && input.longitude) {
        geohash = encodeGeohash(input.latitude, input.longitude, 12);
      }

      const result = await db.insert(retailers).values({
        userId,
        storeName: input.storeName,
        ownerName: input.ownerName,
        gstin: input.gstin,
        gstinVerified: "pending",
        phone: input.phone,
        email: input.email,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
        geohash,
        catchmentRadius: input.catchmentRadius,
        upiId: input.upiId,
      });

      return { id: Number(result[0].insertId), success: true };
    }),

  // Get my retailer profile
  myRetailer: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);
    return rows[0] ?? null;
  }),

  // Get retailer by ID
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(retailers)
        .where(eq(retailers.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  // Update retailer
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        storeName: z.string().max(100).optional(),
        ownerName: z.string().max(100).optional(),
        phone: z.string().max(15).optional(),
        address: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(100).optional(),
        pincode: z.string().max(10).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        catchmentRadius: z.number().optional(),
        upiId: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updates } = input;

      // Verify ownership
      const existing = await db
        .select()
        .from(retailers)
        .where(and(eq(retailers.id, id), eq(retailers.userId, ctx.user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new Error("Retailer not found or access denied");
      }

      const updateData: Record<string, unknown> = { ...updates };
      if (updates.latitude !== undefined) {
        updateData.latitude = updates.latitude.toString();
      }
      if (updates.longitude !== undefined) {
        updateData.longitude = updates.longitude.toString();
      }
      if (updates.latitude && updates.longitude) {
        updateData.geohash = encodeGeohash(updates.latitude, updates.longitude, 12);
      }

      await db.update(retailers).set(updateData).where(eq(retailers.id, id));
      return { success: true };
    }),

  // Verify GSTIN (admin or automated)
  verifyGstin: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      // In production, this would call the GST Portal API
      // For now, simulate verification
      await db
        .update(retailers)
        .set({ gstinVerified: "verified" })
        .where(eq(retailers.id, input.id));
      return { verified: true };
    }),

  // List retailers in a city
  listByCity: publicQuery
    .input(z.object({ city: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(retailers)
        .where(and(eq(retailers.city, input.city), eq(retailers.isActive, "active")));
    }),

  // Get dashboard stats
  dashboardStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) {
      return null;
    }

    const retailerId = myRetailer[0].id;

    // Get counts from related tables
    const [lowStockResult, totalResult, billsResult] = await Promise.all([
      db.execute(
        sql`SELECT COUNT(*) as cnt FROM inventory WHERE retailerId = ${retailerId} AND quantity <= lowStockThreshold`
      ),
      db.execute(
        sql`SELECT COUNT(*) as cnt FROM inventory WHERE retailerId = ${retailerId}`
      ),
      db.execute(
        sql`SELECT COUNT(*) as cnt, COALESCE(SUM(total), 0) as rev FROM bills WHERE retailerId = ${retailerId} AND DATE(createdAt) = CURDATE()`
      ),
    ]);

    const lowRows = lowStockResult as unknown as Array<{ cnt: number }>;
    const totalRows = totalResult as unknown as Array<{ cnt: number }>;
    const billRows = billsResult as unknown as Array<{ cnt: number; rev: number }>;

    return {
      retailer: myRetailer[0],
      lowStockCount: Number(lowRows[0]?.cnt ?? 0),
      totalProducts: Number(totalRows[0]?.cnt ?? 0),
      todayBills: Number(billRows[0]?.cnt ?? 0),
      todayRevenue: Number(billRows[0]?.rev ?? 0),
    };
  }),
});
