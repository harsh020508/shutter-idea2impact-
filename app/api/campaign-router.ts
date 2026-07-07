import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { campaigns, campaignSignatures } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const campaignRouter = createRouter({
  // Create a community campaign
  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        requestType: z.enum(["new_store", "product_category", "brand"]),
        category: z.string().optional(),
        targetSignatures: z.number().default(50),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        creatorDeviceId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      let geohash: string | undefined;
      if (input.latitude && input.longitude) {
        geohash = encodeGeohash(input.latitude, input.longitude, 12);
      }

      const result = await db.insert(campaigns).values({
        title: input.title,
        description: input.description,
        requestType: input.requestType,
        category: input.category,
        targetSignatures: input.targetSignatures,
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
        geohash,
        creatorDeviceId: input.creatorDeviceId,
      });

      return { id: Number(result[0].insertId) };
    }),

  // List campaigns
  list: publicQuery
    .input(
      z.object({
        status: z.enum(["active", "achieved", "closed"]).optional(),
        requestType: z.enum(["new_store", "product_category", "brand"]).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let conditions = [];
      if (input.status) {
        conditions.push(eq(campaigns.status, input.status));
      } else {
        conditions.push(eq(campaigns.status, "active"));
      }
      if (input.requestType) {
        conditions.push(eq(campaigns.requestType, input.requestType));
      }

      return db
        .select()
        .from(campaigns)
        .where(conditions.length > 1 ? and(...conditions) : conditions[0])
        .orderBy(desc(campaigns.currentSignatures))
        .limit(input.limit);
    }),

  // Get campaign by ID with signatures
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const campaign = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, input.id))
        .limit(1);

      if (campaign.length === 0) return null;

      const signatures = await db
        .select()
        .from(campaignSignatures)
        .where(eq(campaignSignatures.campaignId, input.id))
        .orderBy(desc(campaignSignatures.createdAt));

      return { ...campaign[0], signatures };
    }),

  // Sign a campaign
  sign: publicQuery
    .input(
      z.object({
        campaignId: z.number(),
        deviceId: z.string(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if already signed
      const existing = await db
        .select()
        .from(campaignSignatures)
        .where(
          and(
            eq(campaignSignatures.campaignId, input.campaignId),
            eq(campaignSignatures.deviceId, input.deviceId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { signed: false, reason: "Already signed" };
      }

      await db.insert(campaignSignatures).values({
        campaignId: input.campaignId,
        deviceId: input.deviceId,
        note: input.note,
      });

      // Update campaign signature count
      await db.execute(
        sql`UPDATE campaigns SET currentSignatures = currentSignatures + 1, updatedAt = NOW() WHERE id = ${input.campaignId}`
      );

      // Check if target reached
      const campaign = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, input.campaignId))
        .limit(1);

      if (
        campaign.length > 0 &&
        campaign[0].currentSignatures >= campaign[0].targetSignatures
      ) {
        await db
          .update(campaigns)
          .set({ status: "achieved" })
          .where(eq(campaigns.id, input.campaignId));
      }

      return { signed: true };
    }),

  // Get campaigns near location
  nearby: publicQuery
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radius: z.number().default(10),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const centerGeohash = encodeGeohash(input.latitude, input.longitude, 7);

      return db
        .select()
        .from(campaigns)
        .where(
          and(
            sql`${campaigns.geohash} LIKE ${centerGeohash + "%"}`,
            eq(campaigns.status, "active")
          )
        )
        .orderBy(desc(campaigns.currentSignatures))
        .limit(input.limit);
    }),
});

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
