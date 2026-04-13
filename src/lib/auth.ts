import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";

const globalForAuth = globalThis as typeof globalThis & {
  __warungosAuthPool?: Pool;
};

function toOrigin(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return new URL(value).origin;
  }

  return `https://${value}`;
}

function getTrustedAuthOrigins(request?: Request) {
  const origins = new Set<string>();

  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_URL,
  ]) {
    if (!value) {
      continue;
    }

    origins.add(toOrigin(value));
  }

  if (request) {
    origins.add(new URL(request.url).origin);
  }

  if (origins.size === 0) {
    origins.add("http://localhost:3000");
  }

  return Array.from(origins);
}

function resolveAuthBaseUrl() {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_BRANCH_URL ??
    process.env.VERCEL_URL;

  if (vercelHost) {
    // Vercel exposes hostnames without a protocol.
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
  trustedOrigins: async (request) => getTrustedAuthOrigins(request),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      // Log URL ke konsol — tampil di Vercel Function Logs
      console.log(`[Kedai Nona Suka] Link verifikasi untuk ${user.email}:`);
      console.log(url);
      // TODO: Pasang Resend untuk kirim email sungguhan:
      // import { Resend } from "resend";
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // await resend.emails.send({ from: "noreply@kedainonasuka.com", to: user.email, subject: "Verifikasi Email", html: `<a href="${url}">Klik di sini untuk verifikasi</a>` });
    },
  },
});
