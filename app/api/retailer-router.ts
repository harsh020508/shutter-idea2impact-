import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { retailers } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

export const retailerRouter = createRouter({
  // Register a new retailer
  register: authedQuery
    .input(
      z.object({
        storeName: z.string().min(1),
        ownerName: z.string().min(1),
        gstin: z.string().length(15),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        catchmentRadius: z.number().default(5),
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
        storeName: z.string().optional(),
        ownerName: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        catchmentRadius: z.number().optional(),
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
  verifyGstin: authedQuery
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
    const lowStockResult = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM inventory WHERE retailerId = ${retailerId} AND quantity <= lowStockThreshold`
    );

    const totalResult = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM inventory WHERE retailerId = ${retailerId}`
    );

    const billsResult = await db.execute(
      sql`SELECT COUNT(*) as cnt, COALESCE(SUM(total), 0) as rev FROM bills WHERE retailerId = ${retailerId} AND DATE(createdAt) = CURDATE()`
    );

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

// Simple geohash encoder
function encodeGeohash(lat: number, lon: number, precision: number): string {
  const base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";

  let latRange = [-90.0, 90.0];
  let lonRange = [-180.0, 180.0];

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon >= mid) {
        idx = idx * 2 + 1;
        lonRange[0] = mid;
      } else {
        idx = idx * 2;
        lonRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        idx = idx * 2 + 1;
        latRange[0] = mid;
      } else {
        idx = idx * 2;
        latRange[1] = mid;
      }
    }

    evenBit = !evenBit;
    bit++;

    if (bit === 5) {
      geohash += base32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}
