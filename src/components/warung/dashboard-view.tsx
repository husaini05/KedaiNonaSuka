"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRightLeft, BarChart3, PackagePlus, ReceiptText, ScrollText, ShoppingBasket, TrendingUp, WalletCards } from "lucide-react";
import { useAppState } from "@/components/providers/app-state-provider";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency, formatDateTime, formatTime } from "@/lib/format";

function SkeletonCard({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white shadow-sm ${className}`} />;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function DashboardView() {
  const { isLoading, debts, lowStockProducts, products, transactions, settings } = useAppState();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard className="h-24" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-24" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <SkeletonCard className="h-72" />
          <div className="space-y-4">
            <SkeletonCard className="h-36" />
            <SkeletonCard className="h-36" />
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayTransactions = transactions.filter((t) => {
    return new Date(t.createdAt).toDateString() === today.toDateString();
  });
  const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);

  const yesterdaySales = transactions
    .filter((t) => new Date(t.createdAt).toDateString() === yesterday.toDateString())
    .reduce((sum, t) => sum + t.total, 0);

  const trendPct =
    yesterdaySales > 0
      ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
      : null;

  const todayLabel = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const outstandingDebt = debts.filter((d) => !d.isPaid).reduce((sum, d) => sum + d.amount, 0);
  const latestTransaction = transactions[0] ?? null;
  const latestDebts = debts.filter((d) => !d.isPaid).slice(0, 4);

  const ownerFirstName = settings.ownerName?.split(" ")[0] ?? "Pemilik";

  return (
    <div className="space-y-4">
      {/* ── Greeting banner ── */}
      <div className="rounded-2xl bg-primary px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-primary-foreground/70 text-xs font-medium">{todayLabel}</p>
            <p className="mt-0.5 text-primary-foreground/90 text-sm font-medium">
              {getGreeting()}, {ownerFirstName} 👋
            </p>
          </div>
          {trendPct !== null && (
            <div
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                trendPct >= 0
                  ? "bg-green-500/25 text-green-100"
                  : "bg-red-500/25 text-red-100"
              }`}
            >
              {trendPct >= 0 ? "▲" : "▼"} {Math.abs(trendPct)}% vs kemarin
            </div>
          )}
        </div>
        <p className="mt-2 font-heading text-xl font-bold text-primary-foreground leading-tight">
          {settings.storeName}
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold text-primary-foreground">
            {formatCompactCurrency(todaySales)} hari ini
          </div>
          <div className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium text-primary-foreground/80">
            {todayTransactions.length} transaksi
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/kasir"
          className="flex flex-col items-center gap-2 rounded-2xl bg-primary p-4 shadow-sm transition-transform active:scale-[0.96]"
        >
          <ShoppingBasket className="size-5 text-white" />
          <span className="text-xs font-semibold text-white">Buka Kasir</span>
        </Link>
        <Link
          href="/inventaris"
          className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-[0.96]"
        >
          <PackagePlus className="size-5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Tambah Produk</span>
        </Link>
        <Link
          href="/laporan"
          className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-[0.96]"
        >
          <ScrollText className="size-5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Laporan</span>
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Omzet hari ini"
          value={formatCompactCurrency(todaySales)}
          description={`${todayTransactions.length} transaksi masuk hari ini`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total transaksi"
          value={`${transactions.length}`}
          description="Semua transaksi yang pernah tercatat"
          tone="accent"
          icon={BarChart3}
        />
        <StatCard
          title="Stok menipis"
          value={`${lowStockProducts.length} item`}
          description="Mendekati batas minimum"
          tone="warn"
          icon={AlertTriangle}
        />
        <StatCard
          title="Kasbon aktif"
          value={formatCompactCurrency(outstandingDebt)}
          description="Piutang pelanggan belum lunas"
          icon={WalletCards}
        />
      </section>

      {/* ── Main content ── */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">

        {/* Aktivitas terbaru */}
        <Card className="border-border/60 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-xl">Aktivitas terbaru</CardTitle>
            <CardDescription>Transaksi terakhir dan timeline penjualan hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Latest transaction highlight */}
            <div className="rounded-2xl bg-foreground p-4 text-background">
              <div className="flex items-center gap-2 text-background/60">
                <ReceiptText className="size-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider">Transaksi terakhir</p>
              </div>
              {latestTransaction ? (
                <>
                  <p className="mt-3 font-mono text-2xl font-bold">
                    {formatCurrency(latestTransaction.total)}
                  </p>
                  <p className="mt-1 text-xs text-background/55">
                    {latestTransaction.paymentMethod} · {formatTime(latestTransaction.createdAt)}
                  </p>
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    {latestTransaction.items.map((item) => (
                      <div
                        key={`${latestTransaction.id}-${item.productId}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-background/75">
                          {item.productName}
                          <span className="ml-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                            ×{item.quantity}
                          </span>
                        </span>
                        <span className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-background/50">
                  Belum ada transaksi yang tersimpan.
                </p>
              )}
            </div>

            {/* Timeline */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <ArrowRightLeft className="size-4 text-primary" />
                <p className="text-sm font-semibold">Timeline transaksi</p>
              </div>
              <div className="relative space-y-2">
                {transactions.length > 1 && (
                  <div className="absolute left-[15px] top-5 bottom-5 w-px bg-border/60" />
                )}
                {transactions.slice(0, 5).map((t, idx) => (
                  <div key={t.id} className="flex items-start gap-3">
                    <div className={`relative z-10 mt-1 flex size-[30px] shrink-0 items-center justify-center rounded-full border-2 ${idx === 0 ? "border-primary bg-primary/10" : "border-border bg-white"}`}>
                      <div className={`size-2 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    </div>
                    <div className="flex-1 rounded-2xl border border-border/60 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{formatCurrency(t.total)}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.items.length} produk · {t.paymentMethod}
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Belum ada transaksi hari ini.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">

          {/* Stok menipis */}
          <Card className="border-border/60 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg">Stok perlu perhatian</CardTitle>
              <CardDescription>Restok sebelum kehabisan dan kehilangan penjualan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-primary/12 text-primary">
                        <AlertTriangle className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <Badge className="rounded-full bg-primary/15 text-primary border-0 text-xs font-semibold">
                      {product.stock} / {product.minimumStock}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-4 text-sm font-medium text-green-700">
                  ✓ Semua stok aman.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kasbon terbaru */}
          <Card className="border-border/60 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg">Kasbon belum lunas</CardTitle>
              <CardDescription>Follow-up pelanggan tanpa buka halaman penuh.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {latestDebts.length > 0 ? (
                latestDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <WalletCards className="size-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{debt.borrowerName}</p>
                        <p className="text-xs text-muted-foreground">{debt.whatsapp}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-foreground">
                      {formatCurrency(debt.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-4 text-sm font-medium text-green-700">
                  ✓ Tidak ada kasbon yang belum lunas.
                </div>
              )}
            </CardContent>
          </Card>

          {/* SKU aktif */}
          <div className="rounded-2xl border border-border/60 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SKU Aktif
            </p>
            <p className="mt-1.5 font-heading text-3xl font-bold">{products.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">produk siap jual di inventaris</p>
          </div>
        </div>
      </div>
    </div>
  );
}
