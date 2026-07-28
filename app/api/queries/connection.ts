import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let pool: mysql.Pool | null = null;
let instance: ReturnType<typeof drizzle<typeof fullSchema>> | null = null;

export function getDb() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required. Cannot start application without a database connection.");
  }

  if (!instance) {
    pool = mysql.createPool({
      uri: env.databaseUrl,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 30000,
      connectTimeout: 10000,
      waitForConnections: true,
      queueLimit: 0,
    });
    instance = drizzle(pool, {
      mode: "default",
      schema: fullSchema,
    });
  }
  return instance;
}

/**
 * Returns the underlying mysql2 connection pool, or null if not yet initialized.
 */
export function getPool(): mysql.Pool | null {
  return pool;
}

/**
 * Closes the MySQL pool gracefully. Returns a promise that resolves when all
 * connections have been released.
 */
export function closePool(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!pool) {
      resolve();
      return;
    }
    pool.end((err) => {
      if (err) {
        reject(err);
      } else {
        pool = null;
        instance = null;
        resolve();
      }
    });
  });
}
