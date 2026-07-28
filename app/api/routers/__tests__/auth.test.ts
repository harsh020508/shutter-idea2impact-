import { describe, it, expect } from "vitest";
import { authRouter } from "../../auth-router";
import { createTestUser } from "../../__tests__/setup";
import { TRPCError } from "@trpc/server";

describe("Auth Router", () => {
  describe("me", () => {
    it("should return current user when authenticated", async () => {
      const testUser = await createTestUser({
        name: "John Doe",
        email: "john@example.com",
      });

      const caller = authRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: testUser,
      });

      const result = await caller.me();

      expect(result).toBeDefined();
      expect(result.id).toBe(testUser.id);
      expect(result.name).toBe("John Doe");
      expect(result.email).toBe("john@example.com");
    });

    it("should throw UNAUTHORIZED when not authenticated", async () => {
      const caller = authRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        // No user in context
      });

      await expect(caller.me()).rejects.toThrow(TRPCError);
      await expect(caller.me()).rejects.toThrow("Authentication required");
    });
  });

  describe("logout", () => {
    it("should clear session cookie on logout", async () => {
      const testUser = await createTestUser();
      const resHeaders = new Headers();

      const caller = authRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders,
        user: testUser,
      });

      const result = await caller.logout();

      expect(result).toEqual({ success: true });

      // Check that set-cookie header was added
      const setCookie = resHeaders.get("set-cookie");
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("kimi_sid=");
      expect(setCookie).toContain("Max-Age=0");
    });

    it("should set secure cookie options for non-localhost", async () => {
      const testUser = await createTestUser();
      const resHeaders = new Headers();
      const req = new Request("https://production.example.com");

      const caller = authRouter.createCaller({
        req,
        resHeaders,
        user: testUser,
      });

      const result = await caller.logout();

      expect(result.success).toBe(true);

      const setCookie = resHeaders.get("set-cookie");
      expect(setCookie).toBeDefined();

      // In production, cookies should be secure
      if (!req.url.includes("localhost")) {
        expect(setCookie).toContain("Secure");
        expect(setCookie).toContain("SameSite=None");
      }
    });

    it("should throw UNAUTHORIZED when not authenticated", async () => {
      const caller = authRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        // No user in context
      });

      await expect(caller.logout()).rejects.toThrow(TRPCError);
    });
  });

  describe("user roles", () => {
    it("should correctly identify admin users", async () => {
      const adminUser = await createTestUser({
        name: "Admin User",
        role: "admin",
      });

      const caller = authRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: adminUser,
      });

      const result = await caller.me();
      expect(result.role).toBe("admin");
    });

    it("should correctly identify regular users", async () => {
      const regularUser = await createTestUser({
        name: "Regular User",
        role: "user",
      });

      const caller = authRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
        user: regularUser,
      });

      const result = await caller.me();
      expect(result.role).toBe("user");
    });
  });
});
