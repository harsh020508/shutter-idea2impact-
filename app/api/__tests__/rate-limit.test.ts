import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Simple in-memory rate limiter for unit testing.
 * Mirrors the concept used in boot.ts without importing server dependencies.
 */
function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): { allowed: boolean; remaining: number } {
      const now = Date.now();
      const entry = requests.get(key);

      if (!entry || now >= entry.resetAt) {
        requests.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1 };
      }

      if (entry.count < maxRequests) {
        entry.count++;
        return { allowed: true, remaining: maxRequests - entry.count };
      }

      return { allowed: false, remaining: 0 };
    },

    reset(key: string) {
      requests.delete(key);
    },
  };
}

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter(5, 60_000);

    for (let i = 0; i < 5; i++) {
      const result = limiter.check("user-1");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    const limiter = createRateLimiter(3, 60_000);

    // Consume all 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const result = limiter.check("user-1");
      expect(result.allowed).toBe(true);
    }

    // 4th request should be blocked
    const result = limiter.check("user-1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks remaining requests accurately", () => {
    const limiter = createRateLimiter(5, 60_000);

    const r1 = limiter.check("user-1");
    expect(r1.remaining).toBe(4);

    const r2 = limiter.check("user-1");
    expect(r2.remaining).toBe(3);

    const r3 = limiter.check("user-1");
    expect(r3.remaining).toBe(2);
  });

  it("resets after the window expires", () => {
    const limiter = createRateLimiter(2, 60_000);

    // Exhaust all requests
    limiter.check("user-1");
    limiter.check("user-1");

    const blocked = limiter.check("user-1");
    expect(blocked.allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(60_001);

    // Should be allowed again
    const afterReset = limiter.check("user-1");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter(2, 60_000);

    // Exhaust user-1
    limiter.check("user-1");
    limiter.check("user-1");
    expect(limiter.check("user-1").allowed).toBe(false);

    // user-2 should still be allowed
    expect(limiter.check("user-2").allowed).toBe(true);
  });

  it("manual reset clears the counter", () => {
    const limiter = createRateLimiter(1, 60_000);

    limiter.check("user-1");
    expect(limiter.check("user-1").allowed).toBe(false);

    limiter.reset("user-1");
    expect(limiter.check("user-1").allowed).toBe(true);
  });
});
