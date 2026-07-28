import { describe, it, expect } from "vitest";
import {
  encodeGeohash,
  decodeGeohash,
  haversineDistance,
  getGeohashPrefix,
  getGeohashNeighbors,
} from "../lib/geohash";

describe("encodeGeohash", () => {
  it("returns correct geohash for Mumbai (19.076, 72.877)", () => {
    const hash = encodeGeohash(19.076, 72.877, 7);
    expect(hash.startsWith("te7")).toBe(true);
    expect(hash).toHaveLength(7);
  });

  it("returns correct geohash for known reference point (0, 0) — Gulf of Guinea", () => {
    const hash = encodeGeohash(0, 0, 5);
    // (0,0) encodes to "s0000" at precision 5
    expect(hash).toBe("s0000");
    expect(hash).toHaveLength(5);
  });

  it("handles equator (lat = 0)", () => {
    const hash = encodeGeohash(0, 45, 6);
    expect(hash).toHaveLength(6);
    expect(typeof hash).toBe("string");
  });

  it("handles prime meridian (lon = 0)", () => {
    const hash = encodeGeohash(45, 0, 6);
    expect(hash).toHaveLength(6);
    expect(typeof hash).toBe("string");
  });

  it("handles negative coordinates (Buenos Aires: -34.6, -58.38)", () => {
    const hash = encodeGeohash(-34.6, -58.38, 7);
    expect(hash).toHaveLength(7);
    expect(typeof hash).toBe("string");
    // Buenos Aires geohash should start with "69y"
    expect(hash.startsWith("69y")).toBe(true);
  });

  it("handles extreme coordinates (-90, -180)", () => {
    const hash = encodeGeohash(-90, -180, 5);
    expect(hash).toHaveLength(5);
    expect(typeof hash).toBe("string");
  });

  it("handles extreme coordinates (90, 180)", () => {
    const hash = encodeGeohash(90, 180, 5);
    expect(hash).toHaveLength(5);
    expect(typeof hash).toBe("string");
  });

  it("respects precision parameter", () => {
    for (const precision of [1, 3, 5, 7, 12]) {
      const hash = encodeGeohash(19.076, 72.877, precision);
      expect(hash).toHaveLength(precision);
    }
  });
});

describe("decodeGeohash", () => {
  it("is the inverse of encodeGeohash within precision tolerance", () => {
    const lat = 19.076;
    const lon = 72.877;
    const precision = 9;

    const hash = encodeGeohash(lat, lon, precision);
    const decoded = decodeGeohash(hash);

    // Decoded values should be within the error margin of the originals
    expect(Math.abs(decoded.latitude - lat)).toBeLessThan(decoded.latitudeError + 0.001);
    expect(Math.abs(decoded.longitude - lon)).toBeLessThan(decoded.longitudeError + 0.001);
  });

  it("round-trips for multiple coordinates at high precision", () => {
    const coords = [
      { lat: 0, lon: 0 },
      { lat: 28.6139, lon: 77.209 },    // Delhi
      { lat: -33.8688, lon: 151.2093 },  // Sydney
      { lat: 51.5074, lon: -0.1278 },    // London
    ];

    for (const { lat, lon } of coords) {
      const hash = encodeGeohash(lat, lon, 10);
      const decoded = decodeGeohash(hash);

      expect(Math.abs(decoded.latitude - lat)).toBeLessThan(0.001);
      expect(Math.abs(decoded.longitude - lon)).toBeLessThan(0.001);
    }
  });

  it("returns error margins that shrink with precision", () => {
    const shortHash = encodeGeohash(19.076, 72.877, 3);
    const longHash = encodeGeohash(19.076, 72.877, 9);

    const shortDecoded = decodeGeohash(shortHash);
    const longDecoded = decodeGeohash(longHash);

    expect(longDecoded.latitudeError).toBeLessThan(shortDecoded.latitudeError);
    expect(longDecoded.longitudeError).toBeLessThan(shortDecoded.longitudeError);
  });

  it("throws on invalid geohash characters", () => {
    expect(() => decodeGeohash("abc!xyz")).toThrow("Invalid geohash character");
  });
});

describe("haversineDistance", () => {
  it("returns ~1,150 km for Mumbai to Delhi", () => {
    // Mumbai: 19.076, 72.877  Delhi: 28.6139, 77.209
    const distance = haversineDistance(19.076, 72.877, 28.6139, 77.209);
    expect(distance).toBeGreaterThan(1100);
    expect(distance).toBeLessThan(1200);
  });

  it("returns 0 for same point", () => {
    const distance = haversineDistance(19.076, 72.877, 19.076, 72.877);
    expect(distance).toBe(0);
  });

  it("returns ~20,000 km for antipodal points (half circumference)", () => {
    // North pole to south pole
    const distance = haversineDistance(90, 0, -90, 0);
    // Should be ~20,015 km (half of Earth's circumference through the poles)
    expect(distance).toBeGreaterThan(19500);
    expect(distance).toBeLessThan(20500);
  });

  it("is symmetric (A->B == B->A)", () => {
    const d1 = haversineDistance(19.076, 72.877, 28.6139, 77.209);
    const d2 = haversineDistance(28.6139, 77.209, 19.076, 72.877);
    expect(d1).toBeCloseTo(d2, 10);
  });

  it("returns plausible distance for London to New York (~5,570 km)", () => {
    const distance = haversineDistance(51.5074, -0.1278, 40.7128, -74.006);
    expect(distance).toBeGreaterThan(5500);
    expect(distance).toBeLessThan(5650);
  });
});

describe("getGeohashPrefix", () => {
  it("returns first N characters of a geohash", () => {
    const hash = "te7ud8b";
    expect(getGeohashPrefix(hash, 3)).toBe("te7");
    expect(getGeohashPrefix(hash, 5)).toBe("te7ud");
  });

  it("defaults to precision 7", () => {
    const hash = "te7ud8bxyz";
    expect(getGeohashPrefix(hash)).toBe("te7ud8b");
    expect(getGeohashPrefix(hash)).toHaveLength(7);
  });

  it("returns full hash when precision >= hash length", () => {
    const hash = "te7";
    expect(getGeohashPrefix(hash, 5)).toBe("te7");
  });

  it("returns empty string for precision 0", () => {
    expect(getGeohashPrefix("te7ud8b", 0)).toBe("");
  });
});

describe("getGeohashNeighbors", () => {
  it("returns an array of strings", () => {
    const neighbors = getGeohashNeighbors("te7ud8b");
    expect(Array.isArray(neighbors)).toBe(true);
    expect(neighbors.length).toBeGreaterThan(0);
    for (const n of neighbors) {
      expect(typeof n).toBe("string");
    }
  });

  it("returns neighbors with the same length as the input", () => {
    const hash = "te7ud8b";
    const neighbors = getGeohashNeighbors(hash);
    for (const n of neighbors) {
      expect(n).toHaveLength(hash.length);
    }
  });

  it("does not include the original geohash in neighbors", () => {
    const hash = "te7ud8b";
    const neighbors = getGeohashNeighbors(hash);
    expect(neighbors).not.toContain(hash);
  });

  it("returns at least 4 neighbors (N, S, E, W directions)", () => {
    const neighbors = getGeohashNeighbors("te7ud8b");
    expect(neighbors.length).toBeGreaterThanOrEqual(4);
  });
});
