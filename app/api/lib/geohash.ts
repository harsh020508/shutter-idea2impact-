/**
 * Geohash encoding/decoding utilities for spatial indexing.
 * Used for proximity searches, demand heatmaps, and location-based features.
 */

/**
 * Encode latitude/longitude coordinates into a geohash string.
 * @param lat - Latitude in degrees (-90 to 90)
 * @param lon - Longitude in degrees (-180 to 180)
 * @param precision - Number of characters in output (1-12). Higher = more precise.
 *                    7 chars ≈ 153m × 153m, 12 chars ≈ 3.7cm × 1.9cm
 * @returns Geohash string
 */
export function encodeGeohash(lat: number, lon: number, precision: number): string {
  const base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";

  let latRange = [-90.0, 90.0];
  let lonRange = [-180.0, 180.0];

  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon >= mid) {
        idx = idx * 2 + 1;
        lonRange[0] = mid;
      } else {
        idx = idx * 2;
        lonRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        idx = idx * 2 + 1;
        latRange[0] = mid;
      } else {
        idx = idx * 2;
        latRange[1] = mid;
      }
    }

    evenBit = !evenBit;
    bit++;

    if (bit === 5) {
      geohash += base32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Decode a geohash string into latitude/longitude coordinates.
 * @param geohash - Geohash string to decode
 * @returns Object with latitude, longitude, and error margins
 */
export function decodeGeohash(geohash: string): {
  latitude: number;
  longitude: number;
  latitudeError: number;
  longitudeError: number;
} {
  const base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let evenBit = true;
  let latRange = [-90.0, 90.0];
  let lonRange = [-180.0, 180.0];

  for (let i = 0; i < geohash.length; i++) {
    const chr = geohash[i].toLowerCase();
    let idx = base32.indexOf(chr);
    if (idx === -1) throw new Error(`Invalid geohash character: ${chr}`);

    for (let bit = 4; bit >= 0; bit--) {
      const mask = 1 << bit;
      if (evenBit) {
        if (idx & mask) {
          lonRange = [(lonRange[0] + lonRange[1]) / 2, lonRange[1]];
        } else {
          lonRange = [lonRange[0], (lonRange[0] + lonRange[1]) / 2];
        }
      } else {
        if (idx & mask) {
          latRange = [(latRange[0] + latRange[1]) / 2, latRange[1]];
        } else {
          latRange = [latRange[0], (latRange[0] + latRange[1]) / 2];
        }
      }
      evenBit = !evenBit;
    }
  }

  const latitude = (latRange[0] + latRange[1]) / 2;
  const longitude = (lonRange[0] + lonRange[1]) / 2;
  const latitudeError = (latRange[1] - latRange[0]) / 2;
  const longitudeError = (lonRange[1] - lonRange[0]) / 2;

  return { latitude, longitude, latitudeError, longitudeError };
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula.
 * @param lat1 - Latitude of point 1 in degrees
 * @param lon1 - Longitude of point 1 in degrees
 * @param lat2 - Latitude of point 2 in degrees
 * @param lon2 - Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get the geohash prefix for proximity searches.
 * For a given precision, returns the prefix to use in LIKE queries.
 * @param geohash - Full geohash string
 * @param precision - Prefix length (default 7 for ~153m cells)
 */
export function getGeohashPrefix(geohash: string, precision = 7): string {
  return geohash.substring(0, precision);
}

/**
 * Get neighboring geohash cells for a given geohash.
 * Useful for expanding proximity searches beyond a single cell.
 * @param geohash - Geohash string
 * @returns Array of 8 neighboring geohash strings (N, NE, E, SE, S, SW, W, NW)
 */
export function getGeohashNeighbors(geohash: string): string[] {
  const base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  const neighbors: Record<string, string[]> = {
    n: ["p0r21436x8zb9dcf5h7kjnmqesgutwvy", "bc01fg45238967deuvhjyznpkmstqrwx"],
    s: ["14365h7k9dcfesgujnmqp0r2twvyx8zb", "238967debc01vghijyznpkmstqrwx45"],
    e: ["bc01fg45238967deuvhjyznpkmstqrwx", "p0r21436x8zb9dcf5h7kjnmqesgutwvy"],
    w: ["238967debc01vghijyznpkmstqrwx45", "14365h7k9dcfesgujnmqp0r2twvyx8zb"],
  };

  const border: Record<string, string[]> = {
    n: ["prxz", "bcfguvyz"],
    s: ["028b", "0145hjnp"],
    e: ["bcfguvyz", "prxz"],
    w: ["0145hjnp", "028b"],
  };

  const lastChr = geohash[geohash.length - 1];
  const parent = geohash.slice(0, -1);
  const type = geohash.length % 2;

  const result: string[] = [];

  for (const dir of ["n", "s", "e", "w"]) {
    const neighborIndex = neighbors[dir][type].indexOf(lastChr);
    if (neighborIndex !== -1) {
      const neighborChr = base32[neighborIndex];
      if (border[dir][type].includes(lastChr) && parent) {
        result.push(...getGeohashNeighbors(parent).map((n) => n + neighborChr));
      } else {
        result.push(parent + neighborChr);
      }
    }
  }

  return result;
}
