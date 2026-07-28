import { describe, it, expect, beforeEach } from "vitest";
import { billRouter } from "../../bill-router";
import { createTestUser, createTestRetailer, createTestProduct } from "../../__tests__/setup";
import { getDb } from "../../queries/connection";
import { inventory } from "@db/schema";
import type { User } from "@db/schema";

describe("Bill Router", () => {
  let testUser: User;
  let testRetailerId: number;
  let testProductId: number;

  beforeEach(async () => {
    // Create test data
    testUser = await createTestUser();
    const retailer = await createTestRetailer(testUser.id);
    testRetailerId = retailer.id;

    const product = await createTestProduct({
      name: "Test Product",
      category: "Electronics",
      mrp: "500.00",
    });
    testProductId = product.id;

    // Add inventory for the product
    const db = getDb();
    await db.insert(inventory).values({
      retailerId: testRetailerId,
      productId: testProductId,
      quantity: 100,
      sellingPrice: "500.00",
      costPrice: "400.00",
    });
  });

  describe("create", () => {
    it("should create a bill with valid input", async () => {
      const caller = billRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: testUser,
      });

      const result = await caller.create({
        customerPhone: "+919876543210",
        paymentMethod: "upi",
        items: [
          {
            productId: testProductId,
            productName: "Test Product",
            quantity: 2,
            unitPrice: 500,
            gstRate: 18,
          },
        ],
        discount: 50,
      });

      expect(result).toBeDefined();
      expect(result.billId).toBeTypeOf("number");
      expect(result.billNumber).toMatch(/^B\d+$/);
      expect(result.total).toBeCloseTo(1130, 1); // (500*2) + 18% GST - 50 discount
      expect(result.itemCount).toBe(1);
    });

    it("should calculate totals correctly with multiple items", async () => {
      // Add another product
      const product2 = await createTestProduct({
        name: "Test Product 2",
        category: "Food",
        mrp: "200.00",
      });

      const db = getDb();
      await db.insert(inventory).values({
        retailerId: testRetailerId,
        productId: product2.id,
        quantity: 50,
        sellingPrice: "200.00",
        costPrice: "150.00",
      });

      const caller = billRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: testUser,
      });

      const result = await caller.create({
        paymentMethod: "cash",
        items: [
          {
            productId: testProductId,
            productName: "Test Product",
            quantity: 1,
            unitPrice: 500,
            gstRate: 18,
          },
          {
            productId: product2.id,
            productName: "Test Product 2",
            quantity: 3,
            unitPrice: 200,
            gstRate: 5,
          },
        ],
        discount: 0,
      });

      expect(result).toBeDefined();
      // Item 1: 500 + 90 (18% GST) = 590
      // Item 2: 600 + 30 (5% GST) = 630
      // Total: 1220
      expect(result.total).toBeCloseTo(1220, 1);
      expect(result.itemCount).toBe(2);
    });

    it("should throw error for user without retailer", async () => {
      const userWithoutRetailer = await createTestUser({
        unionId: "no-retailer-user",
      });

      const caller = billRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: userWithoutRetailer,
      });

      await expect(
        caller.create({
          paymentMethod: "cash",
          items: [
            {
              productId: testProductId,
              productName: "Test Product",
              quantity: 1,
              unitPrice: 500,
              gstRate: 18,
            },
          ],
          discount: 0,
        })
      ).rejects.toThrow("Retailer not found");
    });
  });

  describe("myBills", () => {
    it("should return empty array for new retailer", async () => {
      const caller = billRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: testUser,
      });

      const bills = await caller.myBills();
      expect(bills).toEqual([]);
    });

    it("should return bills after creation", async () => {
      const caller = billRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: testUser,
      });

      await caller.create({
        paymentMethod: "cash",
        items: [
          {
            productId: testProductId,
            productName: "Test Product",
            quantity: 1,
            unitPrice: 500,
            gstRate: 18,
          },
        ],
        discount: 0,
      });

      const bills = await caller.myBills();
      expect(bills).toHaveLength(1);
      expect(bills[0].retailerId).toBe(testRetailerId);
    });
  });

  describe("todayRevenue", () => {
    it("should return zero revenue for new retailer", async () => {
      const caller = billRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: testUser,
      });

      const revenue = await caller.todayRevenue();
      expect(revenue.count).toBe(0);
      expect(revenue.revenue).toBe(0);
    });

    it("should calculate today's revenue correctly", async () => {
      const caller = billRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: testUser,
      });

      await caller.create({
        paymentMethod: "upi",
        items: [
          {
            productId: testProductId,
            productName: "Test Product",
            quantity: 2,
            unitPrice: 500,
            gstRate: 18,
          },
        ],
        discount: 0,
      });

      const revenue = await caller.todayRevenue();
      expect(revenue.count).toBe(1);
      expect(revenue.revenue).toBeGreaterThan(0);
    });
  });
});
