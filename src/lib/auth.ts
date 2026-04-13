import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { Resend } from "resend";

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
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
      if (!process.env.RESEND_API_KEY) {
        console.log(`[Kedai Nona Suka] Link verifikasi untuk ${user.email}: ${url}`);
        return;
      }
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
      const firstName = (user.name ?? user.email).split(" ")[0];
      await resend.emails.send({
        from: "Kedai Nona Suka <onboarding@resend.dev>",
        to: user.email,
        subject: "Verifikasi Email — Kedai Nona Suka",
        html: `
<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf6ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1c0d06,#3d2211);padding:32px 32px 28px;text-align:center;">
            <div style="font-size:36px;margin-bottom:12px;">🍽️</div>
            <div style="color:#E8821A;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Kedai Nona Suka</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">Makan enak, kantong aman</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a0e06;">Halo, ${firstName}! 👋</h1>
            <p style="margin:0 0 20px;color:#666;font-size:15px;line-height:1.6;">
              Terima kasih sudah mendaftar di <strong>Kedai Nona Suka</strong>. Satu langkah lagi untuk mulai kelola warungmu!
            </p>
            <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
              Klik tombol di bawah untuk verifikasi email dan aktifkan akunmu:
            </p>
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:28px;">
                  <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#E8821A,#c8681a);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;box-shadow:0 4px 16px rgba(232,130,26,0.4);">
                    ✓ Verifikasi Email Saya
                  </a>
                </td>
              </tr>
            </table>
            <!-- Info box -->
            <div style="background:#fdf6ec;border:1px solid #f0d9b5;border-radius:16px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                ⏱️ Link ini berlaku selama <strong>24 jam</strong>. Jika sudah kadaluarsa, kamu bisa minta kirim ulang dari halaman login.
              </p>
            </div>
            <p style="margin:0;color:#999;font-size:13px;line-height:1.6;">
              Jika kamu tidak mendaftar di Kedai Nona Suka, abaikan email ini.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;color:#bbb;font-size:12px;">© 2025 Kedai Nona Suka. Makan enak, kantong aman.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
      } catch (err) {
        console.error(`[Kedai Nona Suka] Gagal kirim email ke ${user.email}:`, err);
        console.log(`[Kedai Nona Suka] Fallback link: ${url}`);
      }
    },
  },
});
