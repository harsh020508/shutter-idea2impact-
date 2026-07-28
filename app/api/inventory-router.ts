import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { inventory, products, restockRecommendations, retailers } from "@db/schema";
import type { Product, InventoryItem } from "@db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

export const inventoryRouter = createRouter({
  // Get my inventory
  myInventory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    return db
      .select({
        inventory: inventory,
        product: products,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(eq(inventory.retailerId, myRetailer[0].id))
      .orderBy(desc(inventory.updatedAt));
  }),

  // Get low stock items
  lowStock: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    return db
      .select({
        inventory: inventory,
        product: products,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(
        and(
          eq(inventory.retailerId, myRetailer[0].id),
          sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`
        )
      );
  }),

  // Get surplus inventory
  surplus: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    return db
      .select({
        inventory: inventory,
        product: products,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(
        and(
          eq(inventory.retailerId, myRetailer[0].id),
          eq(inventory.surplusFlag, "surplus")
        )
      );
  }),

  // Add/update inventory item
  upsert: authedQuery
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().int().min(0),
        lowStockThreshold: z.number().int().default(10),
        costPrice: z.number().optional(),
        sellingPrice: z.number().optional(),
        surplusFlag: z.enum(["normal", "surplus", "dead_stock"]).default("normal"),
        surplusQuantity: z.number().int().default(0),
        expiryDate: z.string().max(30).optional(),
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

      const retailerId = myRetailer[0].id;

      // Check if inventory item exists
      const existing = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.retailerId, retailerId),
            eq(inventory.productId, input.productId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(inventory)
          .set({
            quantity: input.quantity,
            lowStockThreshold: input.lowStockThreshold,
            costPrice: input.costPrice?.toString(),
            sellingPrice: input.sellingPrice?.toString(),
            surplusFlag: input.surplusFlag,
            surplusQuantity: input.surplusQuantity,
            expiryDate: input.expiryDate,
            updatedAt: new Date(),
          })
          .where(eq(inventory.id, existing[0].id));

        return { id: existing[0].id, updated: true };
      } else {
        const result = await db.insert(inventory).values({
          retailerId,
          productId: input.productId,
          quantity: input.quantity,
          lowStockThreshold: input.lowStockThreshold,
          costPrice: input.costPrice?.toString(),
          sellingPrice: input.sellingPrice?.toString(),
          surplusFlag: input.surplusFlag,
          surplusQuantity: input.surplusQuantity,
          expiryDate: input.expiryDate,
        });
        return { id: Number(result[0].insertId), updated: false };
      }
    }),

  // Delete inventory item
  remove: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const myRetailer = await db
        .select()
        .from(retailers)
        .where(eq(retailers.userId, ctx.user.id))
        .limit(1);

      if (myRetailer.length === 0) throw new Error("Retailer not found");

      await db
        .delete(inventory)
        .where(
          and(
            eq(inventory.id, input.id),
            eq(inventory.retailerId, myRetailer[0].id)
          )
        );

      return { success: true };
    }),

  // Scan product by barcode
  scanProductByBarcode: authedQuery
    .input(z.object({ barcode: z.string().max(50) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const myRetailer = await db
        .select()
        .from(retailers)
        .where(eq(retailers.userId, ctx.user.id))
        .limit(1);

      if (myRetailer.length === 0) throw new Error("Retailer not found");

      const productRows = await db
        .select()
        .from(products)
        .where(eq(products.barcode, input.barcode))
        .limit(1);

      if (productRows.length === 0) return null;

      const product = productRows[0];

      // Check if it is in inventory
      const invRows = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.retailerId, myRetailer[0].id),
            eq(inventory.productId, product.id)
          )
        )
        .limit(1);

      return {
        product,
        inventoryItem: invRows[0] ?? null,
      };
    }),

  // Search products for billing with local store inventory details
  searchBillingProducts: authedQuery
    .input(z.object({ query: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const myRetailer = await db
        .select()
        .from(retailers)
        .where(eq(retailers.userId, ctx.user.id))
        .limit(1);

      if (myRetailer.length === 0) throw new Error("Retailer not found");

      const searchTerm = `%${input.query.toLowerCase()}%`;
      const matchedProducts = await db
        .select()
        .from(products)
        .where(
          sql`LOWER(${products.name}) LIKE ${searchTerm} OR ${products.barcode} = ${input.query}`
        )
        .limit(15);

      if (matchedProducts.length === 0) return [];

      const productIds = matchedProducts.map((p: Product) => p.id);

      const invRows = await db
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.retailerId, myRetailer[0].id),
            inArray(inventory.productId, productIds)
          )
        );

      return matchedProducts.map((p: Product) => {
        const inv = invRows.find((i: InventoryItem) => i.productId === p.id);
        return {
          product: p,
          inventoryItem: inv ?? null,
        };
      });
    }),

  // Search products
  searchProducts: publicQuery
    .input(z.object({ query: z.string().max(200), category: z.string().max(100).optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const searchTerm = `%${input.query.toLowerCase()}%`;
      if (input.category) {
        return db
          .select()
          .from(products)
          .where(
            and(
              sql`LOWER(${products.name}) LIKE ${searchTerm}`,
              eq(products.category, input.category)
            )
          )
          .limit(20);
      }
      return db
        .select()
        .from(products)
        .where(sql`LOWER(${products.name}) LIKE ${searchTerm}`)
        .limit(20);
    }),

  // Get all product categories
  categories: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .selectDistinct({ category: products.category })
      .from(products);
    return rows.map((r: { category: string }) => r.category);
  }),

  // AI Restock: Generate recommendations
  generateRestockRecommendations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    const retailerId = myRetailer[0].id;

    // Get current inventory with products
    const items = await db
      .select({
        inventory: inventory,
        product: products,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .where(eq(inventory.retailerId, retailerId));

    // Generate AI recommendations based on stock levels and sales velocity
    const recommendations = items
      .filter((item: { inventory: InventoryItem; product: Product }) => item.inventory.quantity <= item.inventory.lowStockThreshold * 2)
      .map((item: { inventory: InventoryItem; product: Product }) => {
        const stockRatio = item.inventory.quantity / item.inventory.lowStockThreshold;
        const confidence = Math.min(95, Math.max(50, 100 - stockRatio * 30));
        const recommendedQty = Math.ceil(
          item.inventory.lowStockThreshold * 3 - item.inventory.quantity
        );

        let reason = "Stock levels are approaching threshold.";
        if (stockRatio <= 0.5) reason = "Critical: Stock below 50% of threshold.";
        else if (stockRatio <= 1) reason = "Warning: Stock at or below threshold.";

        return {
          inventoryId: item.inventory.id,
          productId: item.product.id,
          productName: item.product.name,
          category: item.product.category,
          currentStock: item.inventory.quantity,
          recommendedQuantity: Math.max(recommendedQty, 5),
          predictedDemand: Math.ceil(item.inventory.lowStockThreshold * 2.5),
          confidence: Math.round(confidence),
          reason,
        };
      })
      .sort((a: { confidence: number }, b: { confidence: number }) => b.confidence - a.confidence)
      .slice(0, 10);

    // Persist recommendations - batch operation to avoid N+1
    if (recommendations.length > 0) {
      const productIds = recommendations.map(r => r.productId);

      // Fetch all existing pending recommendations in a single query
      const existingPending = await db
        .select({ productId: restockRecommendations.productId })
        .from(restockRecommendations)
        .where(
          and(
            eq(restockRecommendations.retailerId, retailerId),
            inArray(restockRecommendations.productId, productIds),
            eq(restockRecommendations.status, "pending")
          )
        );

      const existingProductIds = new Set(existingPending.map(e => e.productId));

      // Filter to only new recommendations and batch insert
      const newRecs = recommendations.filter(r => !existingProductIds.has(r.productId));

      if (newRecs.length > 0) {
        await db.insert(restockRecommendations).values(
          newRecs.map(rec => ({
            retailerId,
            productId: rec.productId,
            currentStock: rec.currentStock,
            recommendedQuantity: rec.recommendedQuantity,
            predictedDemand: rec.predictedDemand,
            confidence: rec.confidence.toString(),
            reason: rec.reason,
            status: "pending" as const,
          }))
        );
      }
    }

    return recommendations;
  }),

  // Get my restock recommendations
  myRecommendations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    return db
      .select({
        rec: restockRecommendations,
        product: products,
      })
      .from(restockRecommendations)
      .innerJoin(products, eq(restockRecommendations.productId, products.id))
      .where(eq(restockRecommendations.retailerId, myRetailer[0].id))
      .orderBy(desc(restockRecommendations.createdAt));
  }),

  // Approve/reject recommendation
  updateRecommendation: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["approved", "rejected", "ordered"]),
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

      await db
        .update(restockRecommendations)
        .set({ status: input.status })
        .where(
          and(
            eq(restockRecommendations.id, input.id),
            eq(restockRecommendations.retailerId, myRetailer[0].id)
          )
        );

      return { success: true };
    }),
});
