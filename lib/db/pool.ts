import "server-only";
import { Pool } from "pg";

// A pool keeps a few open connections and lends them out per query,
// so we don't pay the cost of connecting to PostgreSQL on every request.
//
// In development, Next.js reloads modules on every save. Storing the pool on
// globalThis stops each reload from opening a new pool and leaking connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  }
  return new Pool({ connectionString, max: 5 });
}

export const pool = globalForDb.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}
