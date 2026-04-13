import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/db/schema";

const globalForDatabase = globalThis as typeof globalThis & {
  __warungosPool?: Pool;
};

function createPool() {
  return new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/warungos",
  });
}

export const pool = globalForDatabase.__warungosPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.__warungosPool = pool;
}

export const db = drizzle({ client: pool, schema });
