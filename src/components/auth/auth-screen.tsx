"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";

const FEATURES = [
  { emoji: "🛒", title: "Kasir cepat & mudah", desc: "Transaksi selesai dalam hitungan detik" },
  { emoji: "📦", title: "Stok real-time", desc: "Pantau barang sebelum kehabisan" },
  { emoji: "📊", title: "Laporan otomatis", desc: "Lihat untung rugi tanpa hitung manual" },
  { emoji: "💳", title: "Catat kasbon", desc: "Tagih pelanggan tepat waktu" },
];

const FOOD_EMOJIS = ["🍽️", "🥘", "🍜", "🥤", "🍚", "🥗", "🍱", "☕", "🧋", "🍛", "🥩", "🫕"];

function Spinner() {
  return (
    <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();

  const queryMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>(queryMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  useEffect(() => {
    if (!isSessionPending && session) router.replace("/dashboard");
  }, [isSessionPending, router, session]);

  useEffect(() => { setMode(queryMode); }, [queryMode]);
  useEffect(() => { setIsSubmitting(false); }, [mode]);

  const isEmailNotVerified = authError === "EMAIL_NOT_VERIFIED";

  async function handleResendVerification() {
    const email = signInEmail;
    if (!email) { toast.error("Masukkan email kamu dulu di kolom email di atas."); return; }
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackURL: "/dashboard" }),
      });
      if (res.ok) toast.success("Email verifikasi sudah dikirim ulang!");
      else toast.error("Gagal mengirim ulang. Coba beberapa saat lagi.");
    } catch {
      toast.error("Terjadi kesalahan. Periksa koneksimu.");
    } finally {
      setIsResending(false);
    }
  }

  /* ── Shared tab + error header ─────────────────────────────────────────── */
  const TabsAndError = (
    <>
      {/* Tabs */}
      <div className="mb-6 flex w-full rounded-2xl bg-muted p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
              mode === m
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMode(m)}
          >
            {m === "signin" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>

      {/* Greeting */}
      <div className="mb-6">
        <h2 className="font-heading text-[1.65rem] font-semibold leading-tight">
          {mode === "signin" ? "Selamat datang! 👋" : "Buat akun baru 🚀"}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Masuk untuk lanjut kelola warungmu."
            : "Gratis selamanya. Tidak perlu kartu kredit."}
        </p>
      </div>

      {/* Error banner */}
      {authError && (
        <div className="mb-5 flex gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
          <span className="text-base leading-none">⚠️</span>
          <div className="flex-1">
            {isEmailNotVerified ? (
              <div className="space-y-1.5">
                <p className="font-semibold text-destructive">Email belum diverifikasi</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Cek inbox atau folder spam kamu. Link sudah dikirim saat pendaftaran.
                </p>
                <button
                  type="button"
                  disabled={isResending}
                  className="mt-1 font-semibold text-primary underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
                  onClick={() => void handleResendVerification()}
                >
                  {isResending ? "Mengirim..." : "Kirim ulang email verifikasi →"}
                </button>
              </div>
            ) : (
              <p className="text-destructive">{authError}</p>
            )}
          </div>
        </div>
      )}
    </>
  );

  /* ── Sign-in form — inputs INSIDE form for max browser compat ──────────── */
  const SignInForm = (
    <form
      action="/api/session/sign-in"
      method="post"
      onSubmit={() => setIsSubmitting(true)}
    >
      <input type="hidden" name="callbackURL" value="/dashboard" />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="signin-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signin-email"
              name="email"
              type="email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              autoComplete="email"
              className="h-12 rounded-2xl bg-muted/50 pl-10 transition-shadow duration-150 focus-visible:shadow-[0_0_0_3px_rgba(232,130,26,0.18)]"
              placeholder="warung@email.com"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signin-password">Kata sandi</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              autoComplete="current-password"
              className="h-12 rounded-2xl bg-muted/50 pl-10 pr-11 transition-shadow duration-150 focus-visible:shadow-[0_0_0_3px_rgba(232,130,26,0.18)]"
              placeholder="Kata sandi kamu"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground active:scale-90"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-12 w-full rounded-2xl bg-gradient-to-br from-primary to-[#c8681a] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(232,130,26,0.55)] transition-all active:scale-[0.98] hover:scale-[1.01] hover:shadow-[0_12px_28px_-8px_rgba(232,130,26,0.65)] disabled:opacity-80 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? <span className="flex items-center gap-2"><Spinner />Memproses...</span>
            : "Masuk ke Dashboard →"}
        </Button>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => setMode("signup")}
        >
          Daftar gratis
        </button>
      </p>
    </form>
  );

  /* ── Sign-up form ──────────────────────────────────────────────────────── */
  const SignUpForm = (
    <form
      action="/api/session/sign-up"
      method="post"
      onSubmit={() => setIsSubmitting(true)}
    >
      <input type="hidden" name="callbackURL" value="/dashboard" />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Nama pemilik warung</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-name"
              name="name"
              value={signUpName}
              onChange={(e) => setSignUpName(e.target.value)}
              autoComplete="name"
              className="h-12 rounded-2xl bg-muted/50 pl-10 transition-shadow duration-150 focus-visible:shadow-[0_0_0_3px_rgba(232,130,26,0.18)]"
              placeholder="Contoh: Ibu Nona"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-email"
              name="email"
              type="email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              autoComplete="email"
              className="h-12 rounded-2xl bg-muted/50 pl-10 transition-shadow duration-150 focus-visible:shadow-[0_0_0_3px_rgba(232,130,26,0.18)]"
              placeholder="warung@email.com"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Kata sandi</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              autoComplete="new-password"
              className="h-12 rounded-2xl bg-muted/50 pl-10 pr-11 transition-shadow duration-150 focus-visible:shadow-[0_0_0_3px_rgba(232,130,26,0.18)]"
              placeholder="Minimal 8 karakter"
              minLength={8}
              required
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground active:scale-90"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-12 w-full rounded-2xl bg-gradient-to-br from-primary to-[#c8681a] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(232,130,26,0.55)] transition-all active:scale-[0.98] hover:scale-[1.01] hover:shadow-[0_12px_28px_-8px_rgba(232,130,26,0.65)] disabled:opacity-80 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? <span className="flex items-center gap-2"><Spinner />Membuat akun...</span>
            : "Buat Akun Gratis 🚀"}
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Setelah daftar, kamu akan mendapat email verifikasi. Akun aktif setelah dikonfirmasi.
      </p>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => setMode("signin")}
        >
          Masuk sekarang
        </button>
      </p>
    </form>
  );

  /* ── Combined form content ─────────────────────────────────────────────── */
  const FormContent = (
    <div>
      {TabsAndError}
      <div
        key={mode}
        style={{ animation: "authFadeUp 0.22s cubic-bezier(0.4,0,0.2,1) both" }}
      >
        {mode === "signin" ? SignInForm : SignUpForm}
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#fdf6ec]">
      <div className="mx-auto max-w-[1440px]">

        {/* ═══════════════ MOBILE LAYOUT ═══════════════ */}
        <div className="lg:hidden">

          {/* Branded hero header */}
          <div
            className="relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #1c0d06 0%, #2f1a0e 55%, #3d2211 100%)",
              paddingTop: "max(3.5rem, env(safe-area-inset-top, 3.5rem))",
              paddingBottom: "5rem",
            }}
          >
            {/* Decorative emoji wallpaper */}
            <div className="pointer-events-none absolute inset-0 select-none overflow-hidden opacity-[0.04]">
              <div
                className="grid grid-cols-5 gap-8 p-6"
                style={{ animation: "emojiDrift 8s ease-in-out infinite" }}
              >
                {Array.from({ length: 60 }).map((_, i) => (
                  <span key={i} className="text-4xl">{FOOD_EMOJIS[i % FOOD_EMOJIS.length]}</span>
                ))}
              </div>
            </div>
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 20% 60%, rgba(232,130,26,0.18) 0%, transparent 60%)" }}
            />

            {/* Logo + tagline */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div
                className="flex size-[68px] items-center justify-center rounded-[22px] text-[32px] shadow-[0_8px_28px_-8px_rgba(232,130,26,0.6)]"
                style={{
                  background: "rgba(232,130,26,0.18)",
                  border: "1px solid rgba(232,130,26,0.35)",
                  animation: "authLogoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              >
                🍽️
              </div>
              <p
                className="mt-3 font-heading text-xl font-semibold text-white"
                style={{ animation: "authFadeUp 0.5s 0.12s ease-out both" }}
              >
                Kedai Nona Suka
              </p>
              <p
                className="mt-1 text-sm"
                style={{ color: "rgba(255,255,255,0.5)", animation: "authFadeUp 0.5s 0.22s ease-out both" }}
              >
                Makan enak, kantong aman
              </p>
            </div>
          </div>

          {/* Form card — slides up over hero */}
          <div
            className="-mt-10 rounded-t-[32px] bg-white px-6 pt-7 shadow-[0_-8px_40px_rgba(0,0,0,0.10)]"
            style={{
              paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 2.5rem))",
              animation: "authCardUp 0.5s 0.08s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {FormContent}
          </div>

          <div
            className="bg-white text-center"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
          >
            <p className="text-xs" style={{ color: "rgba(0,0,0,0.25)" }}>© 2025 Kedai Nona Suka</p>
          </div>
        </div>

        {/* ═══════════════ DESKTOP LAYOUT ═══════════════ */}
        <div className="hidden min-h-[100dvh] lg:grid lg:grid-cols-[1.15fr_0.85fr]">

          {/* Left: Hero panel */}
          <div
            className="relative overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
            style={{ background: "linear-gradient(160deg, #1c0d06 0%, #2f1a0e 50%, #3d2211 100%)" }}
          >
            <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
              <div className="absolute inset-0 opacity-[0.035]">
                <div
                  className="grid grid-cols-6 gap-10 p-10"
                  style={{ transform: "rotate(-8deg) scale(1.3)", transformOrigin: "center" }}
                >
                  {Array.from({ length: 72 }).map((_, i) => (
                    <span key={i} className="text-5xl">{FOOD_EMOJIS[i % FOOD_EMOJIS.length]}</span>
                  ))}
                </div>
              </div>
              <div
                className="absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(232,130,26,0.12) 0%, transparent 65%)" }}
              />
            </div>

            {/* Brand mark */}
            <div
              className="relative z-10"
              style={{ animation: "authFadeUp 0.6s 0.1s ease-out both" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-12 items-center justify-center rounded-2xl text-2xl"
                  style={{ background: "rgba(232,130,26,0.18)", border: "1px solid rgba(232,130,26,0.3)" }}
                >
                  🍽️
                </div>
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ color: "rgba(232,130,26,0.85)" }}
                  >
                    Kedai Nona Suka
                  </p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Sistem Kasir & Operasional
                  </p>
                </div>
              </div>

              <h1
                className="mt-12 font-heading text-[2.8rem] font-semibold leading-[1.15] tracking-tight text-white"
                style={{ animation: "authFadeUp 0.7s 0.2s ease-out both" }}
              >
                Kelola warung<br />lebih mudah,<br />
                <span style={{ color: "#E8821A" }}>lebih menguntungkan.</span>
              </h1>

              <p
                className="mt-6 max-w-sm text-base leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)", animation: "authFadeUp 0.6s 0.35s ease-out both" }}
              >
                Satu platform untuk kasir, stok, laporan, dan kasbon warungmu — dari HP atau laptop.
              </p>
            </div>

            {/* Feature cards */}
            <div className="relative z-10 grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="rounded-[20px] p-4 transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    animation: `authFadeUp 0.5s ${0.45 + i * 0.08}s ease-out both`,
                  }}
                >
                  <span className="text-2xl">{f.emoji}</span>
                  <p className="mt-2 text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="relative z-10 flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <span>© 2025 Kedai Nona Suka</span>
              <span>•</span>
              <span>Makan enak, kantong aman</span>
            </div>
          </div>

          {/* Right: Form panel */}
          <div
            className="flex min-h-[100dvh] flex-col items-center justify-center px-10 py-10"
            style={{ animation: "authFadeUp 0.5s 0.15s ease-out both" }}
          >
            <div className="w-full max-w-sm">
              {FormContent}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
