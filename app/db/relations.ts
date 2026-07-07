// Relations for Shutter database schema
// Using Drizzle relational queries where needed

import { relations } from "drizzle-orm";
import {
  users,
  retailers,
  products,
  inventory,
  bills,
  billItems,
  tradeOpportunities,
  campaigns,
  campaignSignatures,
  restockRecommendations,
  genieQueries,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  retailers: many(retailers),
}));

export const retailersRelations = relations(retailers, ({ one, many }) => ({
  user: one(users, { fields: [retailers.userId], references: [users.id] }),
  inventory: many(inventory),
  bills: many(bills),
  sentTrades: many(tradeOpportunities, { relationName: "seller" }),
  receivedTrades: many(tradeOpportunities, { relationName: "buyer" }),
  restockRecommendations: many(restockRecommendations),
  genieQueries: many(genieQueries),
}));

export const productsRelations = relations(products, ({ many }) => ({
  inventory: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  retailer: one(retailers, { fields: [inventory.retailerId], references: [retailers.id] }),
  product: one(products, { fields: [inventory.productId], references: [products.id] }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  retailer: one(retailers, { fields: [bills.retailerId], references: [retailers.id] }),
  items: many(billItems),
}));

export const billItemsRelations = relations(billItems, ({ one }) => ({
  bill: one(bills, { fields: [billItems.billId], references: [bills.id] }),
}));

export const tradeOpportunitiesRelations = relations(tradeOpportunities, ({ one }) => ({
  seller: one(retailers, { fields: [tradeOpportunities.sellerRetailerId], references: [retailers.id], relationName: "seller" }),
  buyer: one(retailers, { fields: [tradeOpportunities.buyerRetailerId], references: [retailers.id], relationName: "buyer" }),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  signatures: many(campaignSignatures),
}));

export const campaignSignaturesRelations = relations(campaignSignatures, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignSignatures.campaignId], references: [campaigns.id] }),
}));
