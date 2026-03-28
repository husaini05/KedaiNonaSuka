import { betterAuth } from "better-auth";
import { Pool } from "pg";

const globalForAuth = globalThis as typeof globalThis & {
  __warungosAuthPool?: Pool;
};

function getAuthPool() {
  if (!globalForAuth.__warungosAuthPool) {
    globalForAuth.__warungosAuthPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@127.0.0.1:5432/warungos",
    });
  }

  return globalForAuth.__warungosAuthPool;
}

export const auth = betterAuth({
  database: getAuthPool(),
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "warungos-dev-secret-please-change-this-in-production",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
});
