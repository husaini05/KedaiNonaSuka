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

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();

  const queryMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const authError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>(queryMode);
  const [showPassword, setShowPassword] = useState(false);

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({ name: "", email: "", password: "" });

  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!isSessionPending && session) {
      router.replace("/dashboard");
    }
  }, [isSessionPending, router, session]);

  useEffect(() => {
    setMode(queryMode);
  }, [queryMode]);

  const isEmailNotVerified = authError === "EMAIL_NOT_VERIFIED";

  async function handleResendVerification() {
    const email = signInForm.email;
    if (!email) {
      toast.error("Masukkan email kamu dulu di kolom email di atas.");
      return;
    }
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackURL: "/dashboard" }),
      });
      if (res.ok) {
        toast.success("Email verifikasi sudah dikirim ulang!");
      } else {
        toast.error("Gagal mengirim ulang. Coba beberapa saat lagi.");
      }
    } catch {
      toast.error("Terjadi kesalahan. Periksa koneksimu.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf6ec]">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.15fr_0.85fr]">

        {/* ── Panel Kiri (Hero) ── */}
        <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
          style={{ background: "linear-gradient(160deg, #1c0d06 0%, #2f1a0e 50%, #3d2211 100%)" }}
        >
          {/* Background dekorasi emoji makanan */}
          <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.035]">
              <div className="grid grid-cols-6 gap-10 p-10"
                style={{ transform: "rotate(-8deg) scale(1.3)", transformOrigin: "center" }}>
                {Array.from({ length: 72 }).map((_, i) => (
                  <span key={i} className="text-5xl">
                    {FOOD_EMOJIS[i % FOOD_EMOJIS.length]}
                  </span>
                ))}
              </div>
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(232,130,26,0.12) 0%, transparent 65%)" }}
            />
          </div>

          {/* Logo + Heading */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl text-2xl"
                style={{ background: "rgba(232,130,26,0.18)", border: "1px solid rgba(232,130,26,0.3)" }}>
                🍽️
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "rgba(232,130,26,0.85)" }}>
                  Kedai Nona Suka
                </p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Sistem Kasir & Operasional
                </p>
              </div>
            </div>

            <h1 className="mt-12 font-heading text-[2.8rem] font-semibold leading-[1.15] tracking-tight text-white">
              Kelola warung<br />lebih mudah,<br />
              <span style={{ color: "#E8821A" }}>lebih menguntungkan.</span>
            </h1>

            <p className="mt-6 max-w-sm text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Makan enak, kantong aman. Satu platform untuk kasir, stok, laporan, dan kasbon warungmu — dari HP atau laptop.
            </p>
          </div>

          {/* Feature cards */}
          <div className="relative z-10 grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[20px] p-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="text-2xl">{f.emoji}</span>
                <p className="mt-2 text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <span>© 2025 Kedai Nona Suka</span>
            <span>•</span>
            <span>Makan enak, kantong aman</span>
          </div>
        </div>

        {/* ── Panel Kanan (Form) ── */}
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 lg:px-10">
          {/* Logo mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-2xl shadow-[0_8px_24px_-8px_rgba(232,130,26,0.5)]">
              🍽️
            </div>
            <div>
              <p className="font-heading text-lg font-semibold">Kedai Nona Suka</p>
              <p className="text-xs text-muted-foreground">Makan enak, kantong aman</p>
            </div>
          </div>

          <div className="w-full max-w-sm">
            {/* Greeting */}
            <div className="mb-7">
              <h2 className="font-heading text-[1.8rem] font-semibold leading-tight">
                {mode === "signin" ? "Selamat datang! 👋" : "Daftar akun baru 🚀"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Masuk untuk lanjut kelola warungmu."
                  : "Gratis selamanya. Tidak perlu kartu kredit."}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="mb-6 flex w-full rounded-2xl bg-muted p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-sm font-medium transition-all",
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

            {/* Error */}
            {authError && (
              <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
                {isEmailNotVerified ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-destructive">Email belum diverifikasi ✉️</p>
                    <p className="text-muted-foreground">
                      Cek inbox atau folder spam kamu. Link verifikasi sudah dikirim saat pendaftaran.
                    </p>
                    <button
                      type="button"
                      disabled={isResending}
                      className="mt-1 font-medium text-primary underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
                      onClick={() => void handleResendVerification()}
                    >
                      {isResending ? "Mengirim..." : "Kirim ulang email verifikasi →"}
                    </button>
                  </div>
                ) : (
                  <p className="text-destructive">{authError}</p>
                )}
              </div>
            )}

            {/* ── Form Masuk ── */}
            {mode === "signin" ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        form="signin-form"
                        type="email"
                        value={signInForm.email}
                        onChange={(e) => setSignInForm((c) => ({ ...c, email: e.target.value }))}
                        autoComplete="email"
                        className="h-12 rounded-2xl bg-white pl-10"
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
                        form="signin-form"
                        type={showPassword ? "text" : "password"}
                        value={signInForm.password}
                        onChange={(e) => setSignInForm((c) => ({ ...c, password: e.target.value }))}
                        autoComplete="current-password"
                        className="h-12 rounded-2xl bg-white pl-10 pr-11"
                        placeholder="Kata sandi kamu"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    form="signin-form"
                    size="lg"
                    className="h-12 w-full rounded-2xl bg-gradient-to-br from-primary to-[#c8681a] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(232,130,26,0.55)] transition-all hover:scale-[1.01] hover:shadow-[0_12px_28px_-8px_rgba(232,130,26,0.65)]"
                  >
                    Masuk ke Dashboard →
                  </Button>
                </div>

                <form id="signin-form" action="/api/session/sign-in" method="post" className="hidden">
                  <input type="hidden" name="callbackURL" value="/dashboard" />
                </form>

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
              </>
            ) : (
              /* ── Form Daftar ── */
              <>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name">Nama pemilik warung</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        name="name"
                        form="signup-form"
                        value={signUpForm.name}
                        onChange={(e) => setSignUpForm((c) => ({ ...c, name: e.target.value }))}
                        autoComplete="name"
                        className="h-12 rounded-2xl bg-white pl-10"
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
                        form="signup-form"
                        type="email"
                        value={signUpForm.email}
                        onChange={(e) => setSignUpForm((c) => ({ ...c, email: e.target.value }))}
                        autoComplete="email"
                        className="h-12 rounded-2xl bg-white pl-10"
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
                        form="signup-form"
                        type={showPassword ? "text" : "password"}
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm((c) => ({ ...c, password: e.target.value }))}
                        autoComplete="new-password"
                        className="h-12 rounded-2xl bg-white pl-10 pr-11"
                        placeholder="Minimal 8 karakter"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    form="signup-form"
                    size="lg"
                    className="h-12 w-full rounded-2xl bg-gradient-to-br from-primary to-[#c8681a] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(232,130,26,0.55)] transition-all hover:scale-[1.01] hover:shadow-[0_12px_28px_-8px_rgba(232,130,26,0.65)]"
                  >
                    Buat Akun Gratis 🚀
                  </Button>
                </div>

                <form id="signup-form" action="/api/session/sign-up" method="post" className="hidden">
                  <input type="hidden" name="callbackURL" value="/dashboard" />
                </form>

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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
