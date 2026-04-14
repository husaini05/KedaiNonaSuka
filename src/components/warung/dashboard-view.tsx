"use client";

import { AlertTriangle, ArrowRightLeft, ReceiptText, WalletCards } from "lucide-react";
import { useAppState } from "@/components/providers/app-state-provider";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime, formatTime } from "@/lib/format";

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

  const todayTransactions = transactions.filter((t) => {
    return new Date(t.createdAt).toDateString() === new Date().toDateString();
  });
  const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
  const outstandingDebt = debts.filter((d) => !d.isPaid).reduce((sum, d) => sum + d.amount, 0);
  const latestTransaction = transactions[0] ?? null;
  const latestDebts = debts.filter((d) => !d.isPaid).slice(0, 4);

  const ownerFirstName = settings.ownerName?.split(" ")[0] ?? "Pemilik";

  return (
    <div className="space-y-4">
      {/* ── Greeting banner ── */}
      <div className="rounded-2xl bg-primary px-5 py-4 shadow-sm">
        <p className="text-primary-foreground/80 text-sm font-medium">
          {getGreeting()}, {ownerFirstName} 👋
        </p>
        <p className="mt-1 font-heading text-xl font-bold text-primary-foreground leading-tight">
          {settings.storeName}
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-semibold text-primary-foreground">
            {formatCurrency(todaySales)} hari ini
          </div>
          <div className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium text-primary-foreground/80">
            {todayTransactions.length} transaksi
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Omzet hari ini"
          value={formatCurrency(todaySales)}
          description={`${todayTransactions.length} transaksi masuk hari ini`}
        />
        <StatCard
          title="Total transaksi"
          value={`${transactions.length}`}
          description="Semua transaksi yang pernah tercatat"
          tone="accent"
        />
        <StatCard
          title="Stok menipis"
          value={`${lowStockProducts.length} item`}
          description="Mendekati batas minimum"
          tone="warn"
        />
        <StatCard
          title="Kasbon aktif"
          value={formatCurrency(outstandingDebt)}
          description="Piutang pelanggan belum lunas"
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
                  <p className="mt-3 font-heading text-2xl font-bold">
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
