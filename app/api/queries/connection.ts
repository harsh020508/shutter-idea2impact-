import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

// ── Mock Database Fallback (when no database URL is provided) ─────
function createMockDbProxy(tableName?: string): any {
  const mockTarget = () => {};

  const getMockData = (tbl: string): any[] => {
    console.log(`[db-mock] Querying table name: "${tbl}"`);
    const now = new Date();
    const mockUser = {
      id: 1,
      unionId: "mock_developer",
      name: "Local Developer",
      email: "dev@localhost",
      avatar: "",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignInAt: now,
    };

    const mockRetailer = {
      id: 1,
      userId: 1,
      storeName: "Local Kirana Store",
      ownerName: "Local Developer",
      gstin: "27AAAAA1111A1Z1",
      gstinVerified: "verified",
      phone: "9876543210",
      email: "store@localhost",
      address: "123 Local Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      latitude: 19.076,
      longitude: 72.8777,
      geohash: "tshe",
      catchmentRadius: 5,
      subscriptionTier: "pro",
      subscriptionStatus: "active",
      isActive: "active",
      createdAt: now,
      updatedAt: now,
    };

    const mockProducts = [
      { id: 1, name: "Amul Gold Milk", category: "Dairy", subcategory: "Milk", barcode: "8901030633001", mrp: "72.00", gstRate: "0", unit: "1L", description: "Fresh premium milk", imageUrl: "", isActive: "active", createdAt: now },
      { id: 2, name: "Amul Butter", category: "Dairy", subcategory: "Butter", barcode: "8901030633018", mrp: "58.00", gstRate: "12", unit: "500g", description: "Delicious table butter", imageUrl: "", isActive: "active", createdAt: now },
      { id: 3, name: "Britannia Marie Gold", category: "Biscuits", subcategory: "Marie", barcode: "8901063018708", mrp: "35.00", gstRate: "18", unit: "250g", description: "Healthy tea biscuits", imageUrl: "", isActive: "active", createdAt: now },
      { id: 4, name: "Parle-G", category: "Biscuits", subcategory: "Glucose", barcode: "8901719104045", mrp: "10.00", gstRate: "18", unit: "100g", description: "Original glucose biscuits", imageUrl: "", isActive: "active", createdAt: now },
      { id: 5, name: "Maggi 2-Minute Noodles", category: "Noodles", subcategory: "Instant", barcode: "8901030742703", mrp: "14.00", gstRate: "18", unit: "70g", description: "Instant noodles", imageUrl: "", isActive: "active", createdAt: now }
    ];

    if (tbl === "users") {
      return [mockUser];
    }
    if (tbl === "retailers") {
      return [mockRetailer];
    }
    if (tbl === "products") {
      return mockProducts;
    }
    if (tbl === "demand_aggregates") {
      return [
        { id: 1, latitude: 19.076, longitude: 72.8777, category: "Dairy Alternatives", demandScore: 85, searchCount: 18, geohash: "tshe", successProbability: "high", createdAt: now },
        { id: 2, latitude: 19.08, longitude: 72.885, category: "Pet Supplies", demandScore: 72, searchCount: 15, geohash: "tshf", successProbability: "medium", createdAt: now },
        { id: 3, latitude: 28.6139, longitude: 77.209, category: "Dairy Alternatives", demandScore: 78, searchCount: 16, geohash: "ttnf", successProbability: "high", createdAt: now },
        { id: 4, latitude: 12.9716, longitude: 77.5946, category: "Dairy Alternatives", demandScore: 92, searchCount: 23, geohash: "tdnf", successProbability: "high", createdAt: now }
      ];
    }
    if (tbl === "pindrops") {
      return [
        { id: 1, productName: "Almond Milk", category: "Dairy Alternatives", latitude: 19.076, longitude: 72.8777, deviceId: "web_mock", urgency: "high", createdAt: now },
        { id: 2, productName: "Premium Pet Food", category: "Pet Supplies", latitude: 19.08, longitude: 72.885, deviceId: "web_mock", urgency: "medium", createdAt: now }
      ];
    }
    if (tbl === "campaigns") {
      return [
        { id: 1, retailerId: 1, name: "Healthy Start", description: "Discount on plant milks", targetPindrops: 10, currentPindrops: 8, discountPercent: 15, startDate: now, endDate: now, status: "active", createdAt: now }
      ];
    }
    if (tbl === "inventory") {
      return [
        {
          id: 1,
          retailerId: 1,
          productId: 1,
          quantity: 50,
          safetyStock: 10,
          reorderLevel: 15,
          reorderQuantity: 40,
          lastRestockedAt: now,
          createdAt: now,
          inventory: { id: 1, retailerId: 1, productId: 1, quantity: 50, safetyStock: 10, reorderLevel: 15, reorderQuantity: 40, lastRestockedAt: now, createdAt: now },
          product: mockProducts[0],
          products: mockProducts[0]
        },
        {
          id: 2,
          retailerId: 1,
          productId: 2,
          quantity: 8,
          safetyStock: 10,
          reorderLevel: 12,
          reorderQuantity: 20,
          lastRestockedAt: now,
          createdAt: now,
          inventory: { id: 2, retailerId: 1, productId: 2, quantity: 8, safetyStock: 10, reorderLevel: 12, reorderQuantity: 20, lastRestockedAt: now, createdAt: now },
          product: mockProducts[1],
          products: mockProducts[1]
        }
      ];
    }
    if (tbl === "trade_opportunities") {
      return [
        {
          id: 1,
          sellerRetailerId: 1,
          buyerRetailerId: 2,
          productId: 1,
          quantity: 10,
          pricePerUnit: "65.00",
          status: "pending",
          createdAt: now,
          tradeOpportunities: { id: 1, sellerRetailerId: 1, buyerRetailerId: 2, productId: 1, quantity: 10, pricePerUnit: "65.00", status: "pending", createdAt: now },
          product: mockProducts[0],
          retailer: mockRetailer
        }
      ];
    }
    if (tbl === "bills") {
      return [
        { id: 1, retailerId: 1, totalAmount: "130.00", taxAmount: "18.00", discountAmount: "0.00", paymentMethod: "upi", status: "completed", createdAt: now }
      ];
    }
    if (tbl === "restock_recommendations") {
      return [
        {
          id: 1,
          retailerId: 1,
          productId: 1,
          recommendedQuantity: 40,
          reason: "Demand is high around your catchment area",
          status: "pending",
          createdAt: now,
          restockRecommendations: { id: 1, retailerId: 1, productId: 1, recommendedQuantity: 40, reason: "Demand is high around your catchment area", status: "pending", createdAt: now },
          product: mockProducts[0]
        }
      ];
    }
    return [];
  };

  const proxy: any = new Proxy(mockTarget, {
    get(target, prop, receiver) {
      if (prop === "then") {
        const data = getMockData(tableName || "");
        return (resolve: any) => resolve(data);
      }

      if (prop === "from" || prop === "insert" || prop === "update" || prop === "delete") {
        return (arg: any) => {
          const nameSymbol = Object.getOwnPropertySymbols(arg || {}).find(
            s => s.toString() === "Symbol(drizzle:Name)"
          );
          const name = (nameSymbol ? arg[nameSymbol] : "") || (typeof arg === "string" ? arg : "");
          console.log(`[db-mock] prop: ${prop}, extracted table name: "${name}"`);
          return createMockDbProxy(name);
        };
      }

      if (typeof prop === "string") {
        return (..._args: any[]) => {
          // Propagate the current table name through query builder chains
          return createMockDbProxy(tableName);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
    apply(_target, _thisArg, _argumentsList) {
      return proxy;
    }
  });

  return proxy;
}

let pool: mysql.Pool | null = null;
let instance: ReturnType<typeof drizzle<typeof fullSchema>> | null = null;

export function getDb() {
  if (!env.databaseUrl) {
    console.warn("[Database] No DATABASE_URL provided. Falling back to Mock Database Proxy.");
    return createMockDbProxy();
  }

  if (!instance) {
    pool = mysql.createPool({
      uri: env.databaseUrl,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
    });
    instance = drizzle(pool, {
      mode: "default",
      schema: fullSchema,
    });
  }
  return instance;
}
