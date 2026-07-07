import { authRouter } from "./auth-router";
import { retailerRouter } from "./retailer-router";
import { inventoryRouter } from "./inventory-router";
import { billRouter } from "./bill-router";
import { tradeRouter } from "./trade-router";
import { pindropRouter } from "./pindrop-router";
import { campaignRouter } from "./campaign-router";
import { demandRouter } from "./demand-router";
import { genieRouter } from "./genie-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  retailer: retailerRouter,
  inventory: inventoryRouter,
  bill: billRouter,
  trade: tradeRouter,
  pindrop: pindropRouter,
  campaign: campaignRouter,
  demand: demandRouter,
  genie: genieRouter,
});

export type AppRouter = typeof appRouter;
