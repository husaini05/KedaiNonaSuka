"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Package2,
  Settings2,
  ShoppingBasket,
} from "lucide-react";
import { AccountPanel } from "@/components/auth/account-panel";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";
import { useAppState } from "@/components/providers/app-state-provider";
import { useSession } from "@/lib/auth-client";
import { getInitials } from "@/lib/format";

const navigation = [
  { href: "/dashboard",   label: "Beranda",     icon: LayoutDashboard },
  { href: "/kasir",       label: "Kasir",        icon: ShoppingBasket },
  { href: "/inventaris",  label: "Inventaris",   icon: Package2 },
  { href: "/buku-hutang", label: "Buku Hutang",  icon: BookOpen },
  { href: "/laporan",     label: "Laporan",      icon: BarChart3 },
  { href: "/pengaturan",  label: "Pengaturan",   icon: Settings2 },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":   { title: "Beranda",     subtitle: "Lihat angka penting, stok menipis, dan aktivitas terbaru." },
  "/kasir":       { title: "Kasir",       subtitle: "Layar khusus jualan cepat: pilih produk dan selesaikan transaksi." },
  "/inventaris":  { title: "Inventaris",  subtitle: "Pantau produk aktif, restok cepat, dan sorot barang menipis." },
  "/buku-hutang": { title: "Buku Hutang", subtitle: "Simpan kasbon pelanggan, kirim pengingat, tandai pelunasan." },
  "/laporan":     { title: "Laporan",     subtitle: "Lihat omzet, pengeluaran, dan preview PDF laporan warung." },
  "/pengaturan":  { title: "Pengaturan",  subtitle: "Atur profil warung, notifikasi stok, dan metode bayar." },
};

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { settings, transactions, loadError } = useAppState();
  const { data: session } = useSession();
  const activePage = pageTitles[pathname] ?? pageTitles["/kasir"];
  const userInitials = getInitials(
    session?.user?.name || session?.user?.email || "KN"
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Skip-to-content — keyboard users jump past nav ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-2xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Lewati ke konten utama
      </a>

      {/* ── Mobile sticky top bar — hidden on /kasir (POS uses its own header) ── */}
      <header
        aria-label="Header aplikasi"
        className={cn("sticky top-0 z-40 lg:hidden", pathname === "/kasir" && "hidden")}
      >
        <div className="flex h-14 items-center gap-3 border-b border-border/60 bg-white px-4">
          {/* Store icon — taps to Beranda */}
          <Link
            href="/dashboard"
            aria-label="Beranda"
            className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10"
          >
            <span aria-hidden="true" className="text-base leading-none">🍽️</span>
          </Link>

          {/* Page title */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-[15px] font-bold leading-tight text-foreground">
              {activePage.title}
            </p>
          </div>

          {/* User avatar — taps to Pengaturan */}
          <Link
            href="/pengaturan"
            title="Pengaturan"
            aria-label="Buka pengaturan warung"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            {userInitials}
          </Link>
        </div>
      </header>

      {/* ── Desktop layout ── */}
      <div className="mx-auto flex max-w-[1600px] gap-4 p-4 lg:min-h-screen lg:p-5">
        {/* Desktop sidebar */}
        <aside
          aria-label="Sidebar navigasi"
          className="fixed top-5 hidden h-[calc(100vh-2.5rem)] w-[276px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-white/50 bg-sidebar shadow-[0_32px_80px_-40px_rgba(30,15,5,0.55)] lg:flex"
          style={{ background: "linear-gradient(175deg, #1e0f06 0%, #2d1a0c 60%, #3a2210 100%)" }}
        >
          {/* Store branding */}
          <div className="border-b border-white/8 px-5 py-5">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-xl text-xl leading-none shadow-[0_4px_14px_-4px_rgba(232,130,26,0.45)]"
                style={{ background: "rgba(232,130,26,0.2)", border: "1px solid rgba(232,130,26,0.3)" }}
              >
                🍽️
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
                  {settings.storeName}
                </p>
                {settings.storeTagline && (
                  <p className="truncate text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {settings.storeTagline}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav aria-label="Menu navigasi" className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_rgba(232,130,26,0.7)]"
                      : "text-sidebar-foreground/60 hover:bg-white/8 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Transaction counter */}
          <div
            aria-label={`${transactions.length} transaksi tersimpan`}
            className="mx-4 mb-3 rounded-[20px] border border-white/8 bg-white/5 px-4 py-3.5"
          >
            <p aria-hidden="true" className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
              Transaksi Tersimpan
            </p>
            <p aria-hidden="true" className="mt-1 font-heading text-3xl font-bold text-primary">{transactions.length}</p>
            <p aria-hidden="true" className="mt-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Data real-time dari database.
            </p>
          </div>

          {/* Account panel */}
          <div className="px-4 pb-4">
            <AccountPanel />
          </div>
        </aside>

        {/* Main content */}
        <main id="main-content" key={pathname} className="min-w-0 flex-1 pb-20 lg:ml-[292px] lg:pb-0 animate-page-enter">
          {/* Desktop-only page header */}
          <div className="mb-6 hidden lg:block">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {activePage.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{activePage.subtitle}</p>
          </div>
          {/* Network / bootstrap error banner */}
          {loadError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/8 px-4 py-3"
            >
              <span aria-hidden="true" className="text-lg leading-none">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-destructive">Gagal memuat data</p>
                <p className="mt-0.5 text-xs text-destructive/80">{loadError}</p>
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="shrink-0 rounded-xl bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
              >
                Muat ulang
              </button>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
  );
}
