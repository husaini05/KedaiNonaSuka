"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function VerifyPendingScreen() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    if (!email) {
      toast.error("Email tidak ditemukan. Silakan daftar ulang.");
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
        toast.success("Email verifikasi sudah dikirim ulang! Cek inbox kamu.");
      } else {
        toast.error("Gagal mengirim ulang email. Coba beberapa saat lagi.");
      }
    } catch {
      toast.error("Terjadi kesalahan. Periksa koneksi internetmu.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf6ec] p-6">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-xl shadow-[0_8px_24px_-8px_rgba(232,130,26,0.5)]">
          🍽️
        </div>
        <div>
          <p className="font-heading text-base font-semibold">Kedai Nona Suka</p>
          <p className="text-xs text-muted-foreground">Makan enak, kantong aman</p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6 text-center">
        {/* Icon animasi */}
        <div className="flex justify-center">
          <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/10 text-5xl">
            📧
            <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-green-500 text-sm text-white shadow-sm">
              ✓
            </span>
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="font-heading text-3xl font-semibold">Cek email kamu!</h1>
          <p className="mt-3 text-muted-foreground">
            Link verifikasi sudah dikirim ke
          </p>
          {email && (
            <p className="mt-1 font-semibold text-primary break-all">{email}</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Klik link dalam email untuk mengaktifkan akun, lalu kamu bisa langsung masuk ke dashboard Kedai Nona Suka.
          </p>
        </div>

        {/* Tips */}
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-left text-sm">
          <p className="font-semibold text-amber-800">💡 Tidak menemukan email?</p>
          <ul className="mt-2 space-y-1.5 text-amber-700">
            <li>• Cek folder <strong>Spam</strong> atau <strong>Junk</strong></li>
            <li>• Pastikan alamat email sudah benar</li>
            <li>• Tunggu 1–2 menit dan refresh inbox</li>
            <li>• Kirim ulang jika masih belum ada</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className="h-12 w-full rounded-2xl bg-gradient-to-br from-primary to-[#c8681a] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(232,130,26,0.55)]"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? "Mengirim..." : "Kirim ulang email verifikasi"}
          </Button>

          <Link
            href="/auth"
            className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
