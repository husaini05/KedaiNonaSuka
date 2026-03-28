"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Menu, Package2, ScrollText, Settings2, ShoppingBasket, Store, Wallet } from "lucide-react";
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
          <div className="rounded-[22px] bg-sidebar px-4 py-3 text-sidebar-foreground">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                <Store className="size-4" />
              </div>
              <p className="truncate text-sm font-medium">{settings.storeName}</p>
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
                      ? "bg-primary text-primary-foreground shadow-[0_20px_45px_-28px_rgba(186,92,35,0.75)]"
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

          <div className="mt-4 rounded-[26px] border border-border/70 bg-white/55 p-4">
            <p className="text-sm font-medium text-foreground/70">Transaksi tersimpan</p>
            <p className="mt-2 font-heading text-3xl font-semibold">{transactions.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Data frontend sekarang sudah tersambung ke API route handlers dan backend Postgres.
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
                    className="pointer-events-auto rounded-2xl bg-white/85 shadow-[0_18px_40px_-28px_rgba(68,39,20,0.75)] backdrop-blur"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] bg-sidebar text-sidebar-foreground">
                <SheetHeader className="px-6 pt-6">
                  <SheetTitle className="text-sidebar-foreground">{settings.storeName}</SheetTitle>
                  <SheetDescription className="text-sidebar-foreground/70">
                    {activePage.title}
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
