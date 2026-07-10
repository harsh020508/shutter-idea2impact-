import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { demandAggregates, pindrops } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const demandRouter = createRouter({
  // Get heatmap data for a region
  heatmap: publicQuery
    .input(
      z.object({
        minLat: z.number(),
        maxLat: z.number(),
        minLng: z.number(),
        maxLng: z.number(),
        category: z.string().optional(),
        precision: z.number().default(7), // geohash precision
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      // Return demand aggregates within bounds
      if (input.category) {
        return db
          .select()
          .from(demandAggregates)
          .where(
            and(
              sql`${demandAggregates.latitude} BETWEEN ${input.minLat} AND ${input.maxLat}`,
              sql`${demandAggregates.longitude} BETWEEN ${input.minLng} AND ${input.maxLng}`,
              eq(demandAggregates.category, input.category)
            )
          )
          .orderBy(desc(demandAggregates.demandScore));
      }

      return db
        .select()
        .from(demandAggregates)
        .where(
          and(
            sql`${demandAggregates.latitude} BETWEEN ${input.minLat} AND ${input.maxLat}`,
            sql`${demandAggregates.longitude} BETWEEN ${input.minLng} AND ${input.maxLng}`
          )
        )
        .orderBy(desc(demandAggregates.demandScore));
    }),

  // Get raw pindrop data for map visualization
  pindropsForMap: publicQuery
    .input(
      z.object({
        minLat: z.number(),
        maxLat: z.number(),
        minLng: z.number(),
        maxLng: z.number(),
        category: z.string().optional(),
        limit: z.number().default(500),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [
        sql`${pindrops.latitude} BETWEEN ${input.minLat} AND ${input.maxLat}`,
        sql`${pindrops.longitude} BETWEEN ${input.minLng} AND ${input.maxLng}`,
        eq(pindrops.isActive, "active"),
      ];

      if (input.category) {
        conditions.push(eq(pindrops.category, input.category));
      }

      return db
        .select({
          id: pindrops.id,
          productName: pindrops.productName,
          category: pindrops.category,
          latitude: pindrops.latitude,
          longitude: pindrops.longitude,
          urgency: pindrops.urgency,
          createdAt: pindrops.createdAt,
        })
        .from(pindrops)
        .where(and(...conditions))
        .orderBy(desc(pindrops.createdAt))
        .limit(input.limit);
    }),

  // Compute demand aggregates (for cron job or manual trigger)
  computeAggregates: authedQuery
    .input(
      z.object({
        city: z.string().optional(),
        hours: z.number().default(8760), // Default to 1 year so all testing pins are aggregated
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Aggregate pindrops by geohash (7-char) and category using Drizzle query builder
      const rows = await db
        .select({
          geo: sql<string>`SUBSTRING(${pindrops.geohash}, 1, 7)`,
          category: pindrops.category,
          pindropCount: sql<number>`count(*)`,
          avgLat: sql<string>`avg(latitude)`,
          avgLng: sql<string>`avg(longitude)`,
        })
        .from(pindrops)
        .where(
          and(
            sql`${pindrops.createdAt} >= DATE_SUB(NOW(), INTERVAL ${input.hours} HOUR)`,
            eq(pindrops.isActive, "active")
          )
        )
        .groupBy(sql`SUBSTRING(${pindrops.geohash}, 1, 7)`, pindrops.category);

      // Upsert into demand_aggregates
      for (const row of rows) {
        const pindropCount = Number(row.pindropCount || 0);
        if (pindropCount === 0) continue;

        // Adjust demand score based on count to get clear Green (35), Yellow (65), Red (95) levels
        const demandScore = pindropCount === 1 ? 35 : pindropCount === 2 ? 65 : 95;
        const successProbability =
          demandScore > 70 ? "high" : demandScore > 40 ? "medium" : "low";

        const existing = await db
          .select()
          .from(demandAggregates)
          .where(
            and(
              eq(demandAggregates.geohash, row.geo),
              eq(demandAggregates.category, row.category)
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
            geohash: row.geo,
            latitude: (row.avgLat || 0).toString(),
            longitude: (row.avgLng || 0).toString(),
            category: row.category,
            demandScore,
            pindropCount,
            successProbability,
          });
        }
      }

      return { computed: rows.length };
    }),

  // Get demand score for a specific location
  locationScore: publicQuery
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const geohash = encodeGeohash(input.latitude, input.longitude, 7);

      let query = db
        .select()
        .from(demandAggregates)
        .where(eq(demandAggregates.geohash, geohash));

      if (input.category) {
        query = db
          .select()
          .from(demandAggregates)
          .where(
            and(
              eq(demandAggregates.geohash, geohash),
              eq(demandAggregates.category, input.category)
            )
          );
      }

      const results = await query;

      if (results.length === 0) {
        return {
          geohash,
          demandScore: 0,
          pindropCount: 0,
          successProbability: "low" as const,
          message: "No demand data for this location yet",
        };
      }

      // Aggregate across categories if no specific category
      const totalScore = Math.min(
        100,
        results.reduce((sum: number, r: any) => sum + r.demandScore, 0)
      );
      const totalPindrops = results.reduce((sum: number, r: any) => sum + r.pindropCount, 0);

      return {
        geohash,
        demandScore: totalScore,
        pindropCount: totalPindrops,
        successProbability:
          totalScore > 70 ? "high" : totalScore > 40 ? "medium" : "low",
        breakdown: results,
      };
    }),

  // Get top demand categories
  topCategories: publicQuery
    .input(
      z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      if (input.latitude && input.longitude) {
        const centerGeohash = encodeGeohash(
          input.latitude,
          input.longitude,
          7
        );
        const result = await db.execute(
          sql`SELECT category, SUM(demandScore) as totalScore, SUM(pindropCount) as totalPindrops
              FROM demand_aggregates
              WHERE geohash LIKE ${centerGeohash + "%"}
              GROUP BY category
              ORDER BY totalScore DESC
              LIMIT ${input.limit}`
        );
        return result as unknown as Array<{
          category: string;
          totalScore: number;
          totalPindrops: number;
        }>;
      }

      const result = await db.execute(
        sql`SELECT category, SUM(demandScore) as totalScore, SUM(pindropCount) as totalPindrops
            FROM demand_aggregates
            GROUP BY category
            ORDER BY totalScore DESC
            LIMIT ${input.limit}`
      );
      return result as unknown as Array<{
        category: string;
        totalScore: number;
        totalPindrops: number;
      }>;
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
