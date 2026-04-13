"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Menu, Package2, ScrollText, Settings2, ShoppingBasket, Wallet } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useAppState } from "@/components/providers/app-state-provider";

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
    title: "Dashboard operasional warung",
    subtitle: "Lihat angka penting, stok menipis, dan aktivitas terbaru tanpa mengganggu layar kasir.",
  },
  "/kasir": {
    title: "Kasir cepat untuk jam sibuk",
    subtitle: "Layar ini khusus untuk jualan cepat: pilih produk, atur jumlah, dan selesaikan transaksi.",
  },
  "/inventaris": {
    title: "Kontrol stok tanpa buku catatan",
    subtitle: "Pantau produk aktif, restok cepat, dan sorot barang yang mulai menipis.",
  },
  "/buku-hutang": {
    title: "Catatan kasbon yang rapi",
    subtitle: "Simpan pelanggan berhutang, kirim pengingat, dan tandai pelunasan dengan satu klik.",
  },
  "/laporan": {
    title: "Laporan untung yang gampang dipahami",
    subtitle: "Lihat omzet, pengeluaran, dan preview PDF untuk kebutuhan pinjaman atau evaluasi usaha.",
  },
  "/pengaturan": {
    title: "Pengaturan warung",
    subtitle: "Atur profil warung, notifikasi stok menipis, dan metode bayar yang ingin ditampilkan.",
  },
};

export function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { settings, transactions } = useAppState();
  const activePage = pageTitles[pathname] ?? pageTitles["/kasir"];

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-4 p-3 lg:p-5">
        <aside className="glass-panel fixed top-5 hidden h-[calc(100vh-2.5rem)] w-[292px] shrink-0 overflow-hidden rounded-[30px] border border-white/60 p-5 shadow-[0_32px_80px_-50px_rgba(68,39,20,0.65)] lg:flex lg:flex-col">
          <div className="rounded-[22px] bg-sidebar px-4 py-3.5 text-sidebar-foreground border border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground text-xl leading-none shadow-[0_4px_12px_-4px_rgba(255,154,60,0.45)]">
                🍽️
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
                  {settings.storeName}
                </p>
                {settings.storeTagline && (
                  <p className="truncate text-[11px] text-sidebar-foreground/55 mt-0.5">
                    {settings.storeTagline}
                  </p>
                )}
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_16px_36px_-22px_rgba(232,130,26,0.80)]"
                      : "text-foreground/70 hover:bg-white/50 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <AccountPanel />

          <div className="mt-4 rounded-[22px] border border-border/60 bg-white/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Transaksi Tersimpan
            </p>
            <p className="mt-1.5 font-heading text-3xl font-bold text-primary">{transactions.length}</p>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Data real-time dari backend PostgreSQL.
            </p>
          </div>
        </aside>

        <div className="flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col gap-4 lg:ml-[308px]">
          <div className="pointer-events-none fixed top-3 left-3 z-40 lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-lg"
                    className="pointer-events-auto rounded-2xl bg-white/90 shadow-[0_8px_24px_-8px_rgba(232,130,26,0.25)] backdrop-blur border border-white/70"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] bg-sidebar text-sidebar-foreground">
                <SheetHeader className="px-6 pt-6 pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-xl leading-none shadow-[0_4px_12px_-4px_rgba(255,154,60,0.45)]">
                      🍽️
                    </div>
                    <div>
                      <SheetTitle className="text-sidebar-foreground leading-tight">{settings.storeName}</SheetTitle>
                      {settings.storeTagline && (
                        <p className="text-xs text-sidebar-foreground/55 mt-0.5">{settings.storeTagline}</p>
                      )}
                    </div>
                  </div>
                  <SheetDescription className="text-sidebar-foreground/60 text-xs">
                    {activePage.subtitle}
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-2 px-4 pb-6">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "lg" }),
                          "w-full justify-start rounded-2xl",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/auth"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "mt-4 h-11 w-full rounded-2xl"
                    )}
                  >
                    Akun
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
