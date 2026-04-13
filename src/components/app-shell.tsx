"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  Menu,
  Package2,
  ScrollText,
  Settings2,
  ShoppingBasket,
  Wallet,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AccountPanel } from "@/components/auth/account-panel";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";
import { useAppState } from "@/components/providers/app-state-provider";
import { useSession } from "@/lib/auth-client";
import { getInitials } from "@/lib/format";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/kasir", label: "Kasir", icon: ShoppingBasket },
  { href: "/inventaris", label: "Inventaris", icon: Package2 },
  { href: "/buku-hutang", label: "Buku Hutang", icon: Wallet },
  { href: "/laporan", label: "Laporan", icon: ScrollText },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings2 },
];

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Lihat angka penting, stok menipis, dan aktivitas terbaru.",
  },
  "/kasir": {
    title: "Kasir",
    subtitle: "Layar khusus jualan cepat: pilih produk dan selesaikan transaksi.",
  },
  "/inventaris": {
    title: "Inventaris",
    subtitle: "Pantau produk aktif, restok cepat, dan sorot barang menipis.",
  },
  "/buku-hutang": {
    title: "Buku Hutang",
    subtitle: "Simpan kasbon pelanggan, kirim pengingat, tandai pelunasan.",
  },
  "/laporan": {
    title: "Laporan",
    subtitle: "Lihat omzet, pengeluaran, dan preview PDF laporan warung.",
  },
  "/pengaturan": {
    title: "Pengaturan",
    subtitle: "Atur profil warung, notifikasi stok, dan metode bayar.",
  },
};

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { settings, transactions } = useAppState();
  const { data: session } = useSession();
  const activePage = pageTitles[pathname] ?? pageTitles["/kasir"];
  const userInitials = getInitials(
    session?.user?.name || session?.user?.email || "KN"
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Mobile sticky top bar ── */}
      <header className="sticky top-0 z-40 lg:hidden">
        <div className="flex h-14 items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur-xl">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ml-1.5 shrink-0 rounded-xl"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>

            <SheetContent side="left" className="w-[300px] border-r border-border/60 bg-sidebar p-0 text-sidebar-foreground">
              {/* Mobile sheet header */}
              <SheetHeader className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-xl leading-none shadow-[0_4px_12px_-4px_rgba(232,130,26,0.5)]">
                    🍽️
                  </div>
                  <div>
                    <SheetTitle className="text-sm font-semibold text-sidebar-foreground leading-tight">
                      {settings.storeName}
                    </SheetTitle>
                    {settings.storeTagline && (
                      <p className="text-xs text-sidebar-foreground/50 mt-0.5">
                        {settings.storeTagline}
                      </p>
                    )}
                  </div>
                </div>
                <SheetDescription className="mt-2 text-xs text-sidebar-foreground/45 leading-relaxed">
                  {activePage.subtitle}
                </SheetDescription>
              </SheetHeader>

              {/* Mobile nav */}
              <nav className="space-y-1 p-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "lg" }),
                        "w-full justify-start rounded-2xl text-sm font-medium",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_rgba(232,130,26,0.6)]"
                          : "text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Stat + account di mobile */}
              <div className="mx-4 rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/40">
                  Transaksi Tersimpan
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-primary">
                  {transactions.length}
                </p>
              </div>

              <div className="p-4">
                <Link
                  href="/auth"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 w-full rounded-2xl"
                  )}
                >
                  Kelola Akun
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          {/* Page title */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-semibold leading-tight">
              {activePage.title}
            </p>
          </div>

          {/* User avatar */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
            {userInitials}
          </div>
        </div>
      </header>

      {/* ── Desktop layout ── */}
      <div className="mx-auto flex max-w-[1600px] gap-4 p-4 lg:min-h-screen lg:p-5">
        {/* Desktop sidebar */}
        <aside className="fixed top-5 hidden h-[calc(100vh-2.5rem)] w-[276px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-white/50 bg-sidebar shadow-[0_32px_80px_-40px_rgba(30,15,5,0.55)] lg:flex"
          style={{ background: "linear-gradient(175deg, #1e0f06 0%, #2d1a0c 60%, #3a2210 100%)" }}
        >
          {/* Store branding */}
          <div className="border-b border-white/8 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl text-xl leading-none shadow-[0_4px_14px_-4px_rgba(232,130,26,0.45)]"
                style={{ background: "rgba(232,130,26,0.2)", border: "1px solid rgba(232,130,26,0.3)" }}>
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
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-10px_rgba(232,130,26,0.7)]"
                      : "text-sidebar-foreground/60 hover:bg-white/8 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Stat card */}
          <div className="mx-4 mb-3 rounded-[20px] border border-white/8 bg-white/5 px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
              Transaksi Tersimpan
            </p>
            <p className="mt-1 font-heading text-3xl font-bold text-primary">{transactions.length}</p>
            <p className="mt-0.5 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Data real-time dari database.
            </p>
          </div>

          {/* Account panel */}
          <div className="px-4 pb-4">
            <AccountPanel />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-20 lg:ml-[292px] lg:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
  );
}
