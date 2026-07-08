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
  findMatches: authedQuery.query(async ({ ctx }) => {
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

    // Calculate match scores
    const matches = potentialBuyers
      .map((buyer: any) => {
        const surplusItem = surplusItems.find(
          (s: any) => s.product.id === buyer.product.id
        );
        if (!surplusItem) return null;

        const geoScore = 35;
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
          distance: 3.5,
          status: "pending" as const,
        };
      })
      .filter((m: any): m is NonNullable<typeof m> => m !== null);

    return matches.sort((a: any, b: any) => b.matchScore - a.matchScore);
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
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(tradeOpportunities)
        .set({ status: "cancelled" })
        .where(eq(tradeOpportunities.id, input.tradeId));
      return { success: true };
    }),
});
