import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { genieQueries, retailers, demandAggregates } from "@db/schema";
import type { DemandAggregate } from "@db/schema";
import { eq, desc } from "drizzle-orm";

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

export const genieRouter = createRouter({
  // Ask Genie a question
  ask: authedQuery
    .input(
      z.object({
        query: z.string().min(1).max(1000),
        locationContext: z
          .object({
            city: z.string().max(100).optional(),
            pincode: z.string().max(10).optional(),
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

      // Fetch contextual store and local demand data to inject into the LLM prompt
      const retailer = myRetailer.length > 0 ? myRetailer[0] : null;
      const storeName = retailer ? retailer.storeName : "Local Kirana Store";
      const city = retailer ? retailer.city : "Mumbai";

      const demandData = await db
        .select()
        .from(demandAggregates)
        .orderBy(desc(demandAggregates.demandScore))
        .limit(5);

      const contextString = `
Store Name: ${storeName}
Location: ${city}
Top local demand categories (crowdsourced):
${demandData.map((d: DemandAggregate) => `- ${d.category} (Demand Score: ${d.demandScore}/100)`).join("\n")}
`;



      let aiResponse = "";
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("[Gemini] GEMINI_API_KEY not set, skipping AI call");
      } else {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(15_000),
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: input.query
                    }
                  ]
                }
              ],
              systemInstruction: {
                parts: [
                  {
                    text: `You are Genie, a smart retail AI assistant for the Shutter platform.
You are helping the store owner of "${storeName}" located in ${city}.
Use the following local market context to inform your advice if relevant:
${contextString}

Provide a helpful, direct, and concise response to the owner's query in 3-4 sentences. Respond to whatever they ask directly and clearly.`
                  }
                ]
              }
            }),
          });

          if (response.ok) {
            const data: GeminiResponse = await response.json();
            aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            console.error("[Gemini] API returned status", response.status, await response.text());
          }
        } catch (err) {
          console.error("[Gemini] request failed", err);
        }
      }

      if (!aiResponse) {
        aiResponse = `Based on your query about "${input.query}", convenience items and dairy products show high local demand signals. I recommend reviewing your inventory levels to match crowdsourced demand hotspots.`;
      }

      const insights = {
        topCategories: demandData.map((d: DemandAggregate) => ({
          category: d.category,
          score: d.demandScore,
        })),
        recommendation: "Review stock of top high-demand categories to capture local purchase interest.",
      };

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
      topCategories: topDemand.map((d: DemandAggregate) => ({
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
