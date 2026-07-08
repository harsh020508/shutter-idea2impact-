import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { genieQueries, retailers, demandAggregates } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const genieRouter = createRouter({
  // Ask Genie a question
  ask: authedQuery
    .input(
      z.object({
        query: z.string().min(1),
        locationContext: z
          .object({
            city: z.string().optional(),
            pincode: z.string().optional(),
            radius: z.number().default(5),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const myRetailer = await db
        .select()
        .from(retailers)
        .where(eq(retailers.userId, ctx.user.id))
        .limit(1);

      const retailerId = myRetailer.length > 0 ? myRetailer[0].id : null;

      // Generate AI response based on query type
      const query = input.query.toLowerCase();
      let aiResponse = "";
      let insights: Record<string, unknown> = {};

      if (query.includes("demand") || query.includes("trend")) {
        // Get demand data for location
        const demandData = await db
          .select()
          .from(demandAggregates)
          .orderBy(desc(demandAggregates.demandScore))
          .limit(10);

        const topCategories = demandData.slice(0, 5);
        aiResponse = `Based on current demand signals in your area, the top trending categories are: ${topCategories
          .map((d: any) => d.category)
          .join(", ")}. `;
        aiResponse += `Highest demand score is ${topCategories[0]?.demandScore ?? 0} in ${topCategories[0]?.category ?? "N/A"}. `;
        aiResponse += `Consider stocking these items to capture unmet demand.`;

        insights = {
          topCategories: topCategories.map((d: any) => ({
            category: d.category,
            score: d.demandScore,
            pindrops: d.pindropCount,
          })),
          recommendation: "Increase inventory for top 3 categories",
        };
      } else if (query.includes("location") || query.includes("where")) {
        aiResponse = `Analyzing your area's demand patterns... `;
        aiResponse += `High-demand zones are clustered near residential areas with limited retail access. `;
        aiResponse += `Opening hours between 7-10 AM and 5-9 PM capture 65% of daily demand. `;
        aiResponse += `Consider extending evening hours and stocking quick-commerce items.`;

        insights = {
          peakHours: ["7-10 AM", "5-9 PM"],
          opportunityZones: 3,
          recommendation: "Extend evening operating hours",
        };
      } else if (query.includes("competitor") || query.includes("market")) {
        aiResponse = `Market analysis for your catchment area shows moderate competition. `;
        aiResponse += `There are approximately 8-12 kirana stores within 2km radius. `;
        aiResponse += `Your unique opportunity lies in stocking specialty items with high demand signals: `;
        aiResponse += `organic products, pet supplies, and premium dairy alternatives. `;
        aiResponse += `These categories show 40% higher margins than standard FMCG.`;

        insights = {
          competitorCount: "8-12",
          radius: "2km",
          opportunityCategories: ["organic products", "pet supplies", "premium dairy"],
          marginPremium: "40%",
        };
      } else {
        aiResponse = `Based on your query about "${input.query}", here's my analysis: `;
        aiResponse += `The local retail landscape shows strong demand for convenience items and fresh produce. `;
        aiResponse += `Community campaigns indicate 3 new product categories being requested in your area. `;
        aiResponse += `I recommend reviewing the trending demand section on your dashboard `;
        aiResponse += `and considering the AI restock recommendations for optimal inventory mix.`;

        insights = {
          suggestedActions: [
            "Review trending demand dashboard",
            "Check AI restock recommendations",
            "Monitor community campaigns",
          ],
          confidence: 78,
        };
      }

      // Save query
      if (retailerId) {
        await db.insert(genieQueries).values({
          retailerId,
          query: input.query,
          locationContext: input.locationContext ?? undefined,
          aiResponse,
          insights,
        });
      }

      return { response: aiResponse, insights };
    }),

  // Get my query history
  myQueries: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) return [];

    return db
      .select()
      .from(genieQueries)
      .where(eq(genieQueries.retailerId, myRetailer[0].id))
      .orderBy(desc(genieQueries.createdAt))
      .limit(20);
  }),

  // Get quick insights (for dashboard widget)
  quickInsights: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myRetailer = await db
      .select()
      .from(retailers)
      .where(eq(retailers.userId, ctx.user.id))
      .limit(1);

    if (myRetailer.length === 0) {
      return {
        headline: "Welcome to Shutter Intelligence",
        tip: "Complete your retailer profile to unlock personalized insights.",
        actions: [{ label: "Complete Profile", href: "/retailer/setup" }],
      };
    }

    // Get top demand in area
    const topDemand = await db
      .select()
      .from(demandAggregates)
      .orderBy(desc(demandAggregates.demandScore))
      .limit(5);

    const topCategory = topDemand[0];

    return {
      headline: topCategory
        ? `${topCategory.category} demand is surging in your area`
        : "Your store performance is steady",
      tip: topCategory
        ? `Demand score of ${topCategory.demandScore}/100. Consider adding ${topCategory.category} items to capture this opportunity.`
        : "Keep monitoring demand trends and community campaigns for new opportunities.",
      topCategories: topDemand.map((d: any) => ({
        category: d.category,
        score: d.demandScore,
        trend: d.demandScore > 70 ? "up" : d.demandScore > 40 ? "stable" : "low",
      })),
      actions: [
        { label: "View Heatmap", href: "/expansion/heatmap" },
        { label: "AI Restock", href: "/b2b/restock" },
      ],
    };
  }),
});
