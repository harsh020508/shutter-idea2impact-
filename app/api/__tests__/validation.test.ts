import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Zod schemas mirroring those used in the pindrop and campaign routers.
 * We re-declare them here to unit-test validation logic without importing
 * server-side router dependencies (tRPC context, DB, etc.).
 */
const pindropInputSchema = z.object({
  productName: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  latitude: z.number(),
  longitude: z.number(),
  deviceId: z.string().min(1).max(100),
  note: z.string().max(500).optional(),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
});

const campaignInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  requestType: z.enum(["new_store", "product_category", "brand"]),
  category: z.string().max(100).optional(),
  targetSignatures: z.number().default(50),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  creatorDeviceId: z.string().max(100).optional(),
});

describe("Pindrop input validation", () => {
  const validPindrop = {
    productName: "Coca-Cola 500ml",
    category: "Beverages",
    latitude: 19.076,
    longitude: 72.877,
    deviceId: "device-abc-123",
  };

  it("accepts valid pindrop input", () => {
    const result = pindropInputSchema.safeParse(validPindrop);
    expect(result.success).toBe(true);
  });

  it("accepts valid pindrop input with all optional fields", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      note: "Need this product urgently",
      urgency: "high",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgency).toBe("high");
    }
  });

  it("applies default urgency when not provided", () => {
    const result = pindropInputSchema.safeParse(validPindrop);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgency).toBe("medium");
    }
  });

  it("rejects missing required fields", () => {
    const result = pindropInputSchema.safeParse({
      productName: "Test",
      // missing category, latitude, longitude, deviceId
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid latitude (non-number)", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      latitude: "not-a-number",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid longitude (non-number)", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      longitude: "not-a-number",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty productName", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      productName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects productName exceeding 200 characters", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      productName: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects category exceeding 100 characters", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      category: "x".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding 500 characters", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      note: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid urgency value", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      urgency: "critical",
    });
    expect(result.success).toBe(false);
  });

  it("rejects deviceId exceeding 100 characters", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      deviceId: "d".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts string values at maximum allowed lengths", () => {
    const result = pindropInputSchema.safeParse({
      ...validPindrop,
      productName: "x".repeat(200),
      category: "x".repeat(100),
      deviceId: "x".repeat(100),
      note: "x".repeat(500),
    });
    expect(result.success).toBe(true);
  });
});

describe("Campaign input validation", () => {
  const validCampaign = {
    title: "Need a new grocery store",
    requestType: "new_store" as const,
  };

  it("accepts valid campaign input with only required fields", () => {
    const result = campaignInputSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it("accepts valid campaign with all fields populated", () => {
    const result = campaignInputSchema.safeParse({
      ...validCampaign,
      description: "We need a grocery store within 2 km of this location.",
      category: "Grocery",
      targetSignatures: 100,
      latitude: 19.076,
      longitude: 72.877,
      creatorDeviceId: "device-xyz",
    });
    expect(result.success).toBe(true);
  });

  it("applies default targetSignatures when not provided", () => {
    const result = campaignInputSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetSignatures).toBe(50);
    }
  });

  it("rejects missing title", () => {
    const result = campaignInputSchema.safeParse({
      requestType: "new_store",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = campaignInputSchema.safeParse({
      ...validCampaign,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding 200 characters", () => {
    const result = campaignInputSchema.safeParse({
      ...validCampaign,
      title: "t".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 2000 characters", () => {
    const result = campaignInputSchema.safeParse({
      ...validCampaign,
      description: "d".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid requestType", () => {
    const result = campaignInputSchema.safeParse({
      ...validCampaign,
      requestType: "invalid_type",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid requestType values", () => {
    for (const rt of ["new_store", "product_category", "brand"]) {
      const result = campaignInputSchema.safeParse({
        ...validCampaign,
        requestType: rt,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing requestType", () => {
    const result = campaignInputSchema.safeParse({
      title: "Test Campaign",
    });
    expect(result.success).toBe(false);
  });

  it("rejects category exceeding 100 characters", () => {
    const result = campaignInputSchema.safeParse({
      ...validCampaign,
      category: "c".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects creatorDeviceId exceeding 100 characters", () => {
    const result = campaignInputSchema.safeParse({
      ...validCampaign,
      creatorDeviceId: "d".repeat(101),
    });
    expect(result.success).toBe(false);
  });
});
