import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tradeOpportunities, inventory, products, retailers } from "@db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export const tradeRouter = createRouter({
  // Get trade opportunities for my store
  myTrades: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    const retailerId = myRetailer[0].id;

    const trades = await db
      .select({
        trade: tradeOpportunities,
        product: products,
        seller: retailers,
        buyer: retailers,
      })
      .from(tradeOpportunities)
      .innerJoin(products, eq(tradeOpportunities.productId, products.id))
      .innerJoin(retailers, eq(tradeOpportunities.sellerRetailerId, retailers.id))
      .innerJoin(
        retailers,
        eq(tradeOpportunities.buyerRetailerId, retailers.id)
      )
      .where(
        or(
          eq(tradeOpportunities.sellerRetailerId, retailerId),
          eq(tradeOpportunities.buyerRetailerId, retailerId)
        )
      )
      .orderBy(desc(tradeOpportunities.matchScore));

    return trades;
  }),

  // Find matches for my surplus inventory
  findMatches: authedQuery
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    const retailerId = myRetailer[0].id;

    // Get my surplus items
    const surplusItems = await db
      .select({
        inventory: inventory,
        product: products,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(
        and(
          eq(inventory.retailerId, retailerId),
          eq(inventory.surplusFlag, "surplus")
        )
      );

    if (surplusItems.length === 0) return [];

    // Get nearby retailers with demand (low stock on same products)
    const productIds = surplusItems.map((s: any) => s.product.id);
    if (productIds.length === 0) return [];

    const potentialBuyers = await db
      .select({
        inventory: inventory,
        product: products,
        retailer: retailers,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .innerJoin(retailers, eq(inventory.retailerId, retailers.id))
      .where(
        and(
          sql`${inventory.productId} IN (${sql.join(productIds.map(String), sql.raw(","))})`,
          sql`${inventory.retailerId} != ${retailerId}`,
          sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`,
          eq(retailers.isActive, "active")
        )
      );

    // Get seller's coordinates for distance calculation
    const sellerLat = parseFloat(myRetailer[0].latitude || "0") || 0;
    const sellerLng = parseFloat(myRetailer[0].longitude || "0") || 0;

    // Calculate match scores
    const matches = potentialBuyers
      .map((buyer: any) => {
        const surplusItem = surplusItems.find(
          (s: any) => s.product.id === buyer.product.id
        );
        if (!surplusItem) return null;

        // Calculate actual distance using Haversine formula
        const buyerLat = parseFloat(buyer.retailer.latitude) || 0;
        const buyerLng = parseFloat(buyer.retailer.longitude) || 0;
        const distance = haversineDistance(sellerLat, sellerLng, buyerLat, buyerLng);

        // Geo score: closer = higher score (max 50, decreases with distance)
        const geoScore = Math.max(0, 50 - distance * 5);
        const productScore = 25;
        const priceScore = 20;
        const expiryScore = surplusItem.inventory.expiryDate ? 20 : 10;
        const matchScore = geoScore + productScore + priceScore + expiryScore;

        return {
          sellerRetailerId: retailerId,
          buyerRetailerId: buyer.retailer.id,
          productId: buyer.product.id,
          productName: buyer.product.name,
          quantity: Math.min(
            surplusItem.inventory.surplusQuantity ?? 0,
            (buyer.inventory.lowStockThreshold ?? 10) * 2
          ),
          sellerPrice: Number(
            surplusItem.inventory.sellingPrice ||
              surplusItem.inventory.costPrice ||
              0
          ),
          matchScore: Math.min(100, matchScore),
          distance,
          status: "pending" as const,
        };
      })
      .filter((m: any): m is NonNullable<typeof m> => m !== null);

    return matches
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(input.offset, input.offset + input.limit);
  }),

  // Create a trade opportunity
  create: authedQuery
    .input(
      z.object({
        buyerRetailerId: z.number(),
        productId: z.number(),
        quantity: z.number().int().positive(),
        sellerPrice: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const myRetailer = await db
        .select()
        .from(retailers)
        .where(eq(retailers.userId, ctx.user.id))
        .limit(1);

      if (myRetailer.length === 0) throw new Error("Retailer not found");

      const sellerRetailerId = myRetailer[0].id;

      // Calculate match score
      const matchScore = 75; // Simplified

      const result = await db.insert(tradeOpportunities).values({
        sellerRetailerId,
        buyerRetailerId: input.buyerRetailerId,
        productId: input.productId,
        quantity: input.quantity,
        sellerPrice: input.sellerPrice.toString(),
        matchScore: matchScore.toString(),
        distance: "3.5",
        status: "pending",
      });

      return { id: Number(result[0].insertId), matchScore };
    }),

  // Confirm trade (as seller or buyer)
  confirm: authedQuery
    .input(
      z.object({
        tradeId: z.number(),
        role: z.enum(["seller", "buyer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const myRetailer = await db
        .select()
        .from(retailers)
        .where(eq(retailers.userId, ctx.user.id))
        .limit(1);

      if (myRetailer.length === 0) throw new Error("Retailer not found");

      const trade = await db
        .select()
        .from(tradeOpportunities)
        .where(eq(tradeOpportunities.id, input.tradeId))
        .limit(1);

      if (trade.length === 0) throw new Error("Trade not found");

      const retailerId = myRetailer[0].id;

      // Verify caller is a party to this trade
      if (
        trade[0].sellerRetailerId !== retailerId &&
        trade[0].buyerRetailerId !== retailerId
      ) {
        throw new Error("Unauthorized: you are not a party to this trade");
      }

      // Verify the claimed role matches actual position
      if (input.role === "seller" && trade[0].sellerRetailerId !== retailerId) {
        throw new Error("Unauthorized: you are not the seller in this trade");
      }
      if (input.role === "buyer" && trade[0].buyerRetailerId !== retailerId) {
        throw new Error("Unauthorized: you are not the buyer in this trade");
      }

      let newStatus = trade[0].status;
      if (input.role === "seller") {
        if (trade[0].status === "buyer_confirmed") newStatus = "completed";
        else newStatus = "seller_confirmed";
      } else {
        if (trade[0].status === "seller_confirmed") newStatus = "completed";
        else newStatus = "buyer_confirmed";
      }

      await db
        .update(tradeOpportunities)
        .set({ status: newStatus })
        .where(eq(tradeOpportunities.id, input.tradeId));

      return { success: true, status: newStatus };
    }),

  // Cancel trade
  cancel: authedQuery
    .input(z.object({ tradeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      const myRetailer = await db
        .select()
        .from(retailers)
        .where(eq(retailers.userId, ctx.user.id))
        .limit(1);

      if (myRetailer.length === 0) throw new Error("Retailer not found");

      const trade = await db
        .select()
        .from(tradeOpportunities)
        .where(eq(tradeOpportunities.id, input.tradeId))
        .limit(1);

      if (trade.length === 0) throw new Error("Trade not found");
      
      if (trade[0].sellerRetailerId !== myRetailer[0].id && trade[0].buyerRetailerId !== myRetailer[0].id) {
        throw new Error("Unauthorized to cancel this trade");
      }

      await db
        .update(tradeOpportunities)
        .set({ status: "cancelled" })
        .where(eq(tradeOpportunities.id, input.tradeId));
      return { success: true };
    }),
});

/**
 * Calculate the distance between two points on Earth using the Haversine formula.
 * @param lat1 - Latitude of point 1 in degrees
 * @param lon1 - Longitude of point 1 in degrees
 * @param lat2 - Latitude of point 2 in degrees
 * @param lon2 - Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
