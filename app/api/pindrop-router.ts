import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { pindrops, demandAggregates } from "@db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

async function syncDemandAggregate(db: any, geohash: string, category: string) {
  const shortGeohash = geohash.substring(0, 7);
  const countResult = await db
    .select({
      pindropCount: sql<number>`count(*)`,
      avgLat: sql<string>`avg(latitude)`,
      avgLng: sql<string>`avg(longitude)`,
    })
    .from(pindrops)
    .where(
      and(
        sql`SUBSTRING(${pindrops.geohash}, 1, 7) = ${shortGeohash}`,
        eq(pindrops.category, category),
        eq(pindrops.isActive, "active")
      )
    );

  if (countResult && countResult.length > 0) {
    const row = countResult[0];
    const pindropCount = Number(row.pindropCount || 0);

    if (pindropCount > 0) {
      const demandScore = pindropCount === 1 ? 35 : pindropCount === 2 ? 65 : 95;
      const successProbability =
        demandScore > 70 ? "high" : demandScore > 40 ? "medium" : "low";

      const existing = await db
        .select()
        .from(demandAggregates)
        .where(
          and(
            eq(demandAggregates.geohash, shortGeohash),
            eq(demandAggregates.category, category)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(demandAggregates)
          .set({
            demandScore,
            pindropCount,
            successProbability,
            computedAt: new Date(),
          })
          .where(eq(demandAggregates.id, existing[0].id));
      } else {
        await db.insert(demandAggregates).values({
          geohash: shortGeohash,
          latitude: (row.avgLat || 0).toString(),
          longitude: (row.avgLng || 0).toString(),
          category,
          demandScore,
          pindropCount,
          successProbability,
        });
      }
    } else {
      await db
        .delete(demandAggregates)
        .where(
          and(
            eq(demandAggregates.geohash, shortGeohash),
            eq(demandAggregates.category, category)
          )
        );
    }
  }
}

export const pindropRouter = createRouter({
  // Create a pindrop (consumer demand signal)
  create: publicQuery
    .input(
      z.object({
        productName: z.string().min(1),
        category: z.string().min(1),
        latitude: z.number(),
        longitude: z.number(),
        deviceId: z.string().min(1),
        note: z.string().optional(),
        urgency: z.enum(["low", "medium", "high"]).default("medium"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check for duplicate from same device in last 24 hours
      const existing = await db
        .select()
        .from(pindrops)
        .where(
          and(
            eq(pindrops.deviceId, input.deviceId),
            eq(pindrops.productName, input.productName),
            gte(
              pindrops.createdAt,
              sql`DATE_SUB(NOW(), INTERVAL 24 HOUR)`
            )
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { id: existing[0].id, deduped: true };
      }

      const geohash = encodeGeohash(input.latitude, input.longitude, 12);

      const result = await db.insert(pindrops).values({
        productName: input.productName,
        category: input.category,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        geohash,
        deviceId: input.deviceId,
        note: input.note,
        urgency: input.urgency,
      });

      // Update aggregate in real time
      await syncDemandAggregate(db, geohash, input.category);

      return { id: Number(result[0].insertId), deduped: false };
    }),

  // Get pindrops near a location
  nearby: publicQuery
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radius: z.number().default(5), // km
        category: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      // Use geohash prefix for efficient proximity search
      const centerGeohash = encodeGeohash(input.latitude, input.longitude, 7);

      let query = db
        .select()
        .from(pindrops)
        .where(
          and(
            sql`${pindrops.geohash} LIKE ${centerGeohash + "%"}`,
            eq(pindrops.isActive, "active")
          )
        )
        .orderBy(desc(pindrops.createdAt))
        .limit(input.limit);

      if (input.category) {
        query = db
          .select()
          .from(pindrops)
          .where(
            and(
              sql`${pindrops.geohash} LIKE ${centerGeohash + "%"}`,
              eq(pindrops.isActive, "active"),
              eq(pindrops.category, input.category)
            )
          )
          .orderBy(desc(pindrops.createdAt))
          .limit(input.limit);
      }

      return query;
    }),

  // Get trending searches (aggregated pindrops by product)
  trending: publicQuery
    .input(
      z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        hours: z.number().default(24),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      if (input.latitude && input.longitude) {
        const centerGeohash = encodeGeohash(input.latitude, input.longitude, 7);
        const result = await db.execute(
          sql`SELECT productName, category, COUNT(*) as searchCount, MAX(createdAt) as lastSearch 
              FROM pindrops 
              WHERE geohash LIKE ${centerGeohash + "%"} 
              AND createdAt >= DATE_SUB(NOW(), INTERVAL ${input.hours} HOUR)
              AND isActive = 'active'
              GROUP BY productName, category
              HAVING COUNT(*) >= 2
              ORDER BY searchCount DESC
              LIMIT ${input.limit}`
        );
        return (result as unknown as Array<{ productName: string; category: string; searchCount: number; lastSearch: Date }>);
      }

      const result = await db.execute(
        sql`SELECT productName, category, COUNT(*) as searchCount, MAX(createdAt) as lastSearch 
            FROM pindrops 
            WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${input.hours} HOUR)
            AND isActive = 'active'
            GROUP BY productName, category
            HAVING COUNT(*) >= 2
            ORDER BY searchCount DESC
            LIMIT ${input.limit}`
      );
      return (result as unknown as Array<{ productName: string; category: string; searchCount: number; lastSearch: Date }>);
    }),

  // Resolve a pindrop
  resolve: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const pin = await db
        .select()
        .from(pindrops)
        .where(eq(pindrops.id, input.id))
        .limit(1);

      if (pin.length === 0) throw new Error("Pindrop not found");

      await db
        .update(pindrops)
        .set({ isActive: "resolved" })
        .where(eq(pindrops.id, input.id));

      // Update aggregate in real time
      await syncDemandAggregate(db, pin[0].geohash, pin[0].category);

      return { success: true };
    }),

  // Get my pindrops by device
  myPindrops: publicQuery
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(pindrops)
        .where(eq(pindrops.deviceId, input.deviceId))
        .orderBy(desc(pindrops.createdAt));
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
