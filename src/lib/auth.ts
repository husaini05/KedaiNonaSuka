import { betterAuth } from "better-auth";
import { Pool } from "pg";


const globalForAuth = globalThis as typeof globalThis & {
  __warungosAuthPool?: Pool;
};

//Yo
function resolveAuthBaseUrl() {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_BRANCH_URL ??
    process.env.VERCEL_URL;

  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  return "http://localhost:3000";
}

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
  baseURL: resolveAuthBaseUrl(),
  emailAndPassword: {
    enabled: true,
  },
});
