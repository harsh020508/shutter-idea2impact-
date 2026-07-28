import { TRPCError } from "@trpc/server";
import { getDb } from "../queries/connection";
import { retailers } from "@db/schema";
import { eq } from "drizzle-orm";

/**
 * Resolves the authenticated user to their retailer record.
 * Caches the result in the request context so subsequent calls
 * in the same request reuse the same row.
 */
export async function resolveRetailer(userId: number): Promise<typeof retailers.$inferSelect> {
  const db = getDb();
  const rows = await db
    .select()
    .from(retailers)
    .where(eq(retailers.userId, userId))
    .limit(1);

  if (rows.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Retailer profile not found. Please complete retailer setup first.",
    });
  }

  return rows[0];
}
