import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bills, billItems, retailers } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const billRouter = createRouter({
  // Create a new bill (QR Billing checkout)
  create: authedQuery
    .input(
      z.object({
        customerPhone: z.string().optional(),
        paymentMethod: z.enum(["cash", "upi", "card"]),
        items: z.array(
          z.object({
            productId: z.number(),
            productName: z.string(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().positive(),
            gstRate: z.number().default(0),
          })
        ),
        discount: z.number().default(0),
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

      // Calculate totals
      let subtotal = 0;
      let gstAmount = 0;
      for (const item of input.items) {
        const lineTotal = item.quantity * item.unitPrice;
        const lineGst = lineTotal * (item.gstRate / 100);
        subtotal += lineTotal;
        gstAmount += lineGst;
      }

      const total = subtotal + gstAmount - input.discount;

      // Generate bill number
      const billNumber = `B${Date.now()}`;

      // Create bill
      const billResult = await db.insert(bills).values({
        retailerId,
        billNumber,
        customerPhone: input.customerPhone,
        subtotal: subtotal.toString(),
        gstAmount: gstAmount.toString(),
        discount: input.discount.toString(),
        total: total.toString(),
        paymentMethod: input.paymentMethod,
        status: "completed",
      });

      const billId = Number(billResult[0].insertId);

      // Create bill items and update inventory
      for (const item of input.items) {
        const lineTotal = item.quantity * item.unitPrice;
        const lineGst = lineTotal * (item.gstRate / 100);

        await db.insert(billItems).values({
          billId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          gstRate: item.gstRate.toString(),
          lineTotal: (lineTotal + lineGst).toString(),
        });

        // Decrement inventory
        await db.execute(
          sql`UPDATE inventory SET quantity = GREATEST(0, quantity - ${item.quantity}), updatedAt = NOW() WHERE retailerId = ${retailerId} AND productId = ${item.productId}`
        );
      }

      return { billId, billNumber, total, itemCount: input.items.length };
    }),

  // Get my bills
  myBills: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    return db
      .select()
      .from(bills)
      .where(eq(bills.retailerId, myRetailer[0].id))
      .orderBy(desc(bills.createdAt))
      .limit(50);
  }),

  // Get bill details with items
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const myRetailer = await db
        .select()
        .from(retailers)
        .where(eq(retailers.userId, ctx.user.id))
        .limit(1);

      if (myRetailer.length === 0) throw new Error("Retailer not found");

      const bill = await db
        .select()
        .from(bills)
        .where(
          and(
            eq(bills.id, input.id),
            eq(bills.retailerId, myRetailer[0].id)
          )
        )
        .limit(1);

      if (bill.length === 0) return null;

      const items = await db
        .select()
        .from(billItems)
        .where(eq(billItems.billId, input.id));

      return { ...bill[0], items };
    }),

  // Get today's revenue
  todayRevenue: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return { count: 0, revenue: 0 };

    const result = await db.execute(
      sql`SELECT COUNT(*) as cnt, COALESCE(SUM(total), 0) as rev FROM bills WHERE retailerId = ${myRetailer[0].id} AND DATE(createdAt) = CURDATE()`
    );

    const rows = result as unknown as Array<{ cnt: number; rev: number }>;
    return {
      count: Number(rows[0]?.cnt ?? 0),
      revenue: Number(rows[0]?.rev ?? 0),
    };
  }),

  // Get revenue history (last 30 days)
  revenueHistory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    const result = await db.execute(
      sql`SELECT DATE(createdAt) as date, COUNT(*) as cnt, COALESCE(SUM(total), 0) as rev FROM bills WHERE retailerId = ${myRetailer[0].id} AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(createdAt) ORDER BY date DESC`
    );

    return (result as unknown as Array<{ date: string; cnt: number; rev: number }>).map(r => ({
      date: r.date,
      count: Number(r.cnt),
      revenue: Number(r.rev),
    }));
  }),
});
