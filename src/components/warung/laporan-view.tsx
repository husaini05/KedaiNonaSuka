"use client";

import { useState } from "react";
import { BarChart3, CreditCard, Download, Plus, Printer, Sparkles, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/components/providers/app-state-provider";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCompactCurrency, formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { buildSeries, estimateProductVelocity, ReportRange, summarizeReport } from "@/lib/reporting";
import { ExpenseDraft } from "@/lib/types";

const emptyExpenseDraft: ExpenseDraft = {
  title: "",
  amount: 0,
  category: "Operasional",
};

export function LaporanView() {
  const { isLoading, transactions, expenses, products, settings, addExpense, deleteExpense } = useAppState();
  const [range, setRange] = useState<ReportRange>("harian");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>(emptyExpenseDraft);
  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState<string | null>(null);

  async function handleDeleteExpense() {
    if (!confirmDeleteExpenseId) return;
    try {
      await deleteExpense(confirmDeleteExpenseId);
      toast.success("Pengeluaran dihapus.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus pengeluaran.");
    } finally {
      setConfirmDeleteExpenseId(null);
    }
  }

  async function handleAddExpense() {
    try {
      if (!expenseDraft.title.trim()) {
        toast.error("Judul pengeluaran tidak boleh kosong.");
        return;
      }
      if (expenseDraft.amount <= 0) {
        toast.error("Nominal pengeluaran harus lebih dari 0.");
        return;
      }
      await addExpense(expenseDraft);
      setExpenseOpen(false);
      setExpenseDraft(emptyExpenseDraft);
      toast.success("Pengeluaran berhasil dicatat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengeluaran.");
    }
  }

  const summary = summarizeReport(range, transactions, expenses);
  const series = buildSeries(range, transactions);
  const topVelocity = estimateProductVelocity(products, transactions)
    .sort((left, right) => right.sold - left.sold)
    .slice(0, 4);
  const highestValue = series.reduce((max, item) => Math.max(max, item.revenue), 1);

  const rangeLabel =
    range === "harian" ? "Hari ini" : range === "mingguan" ? "Minggu ini" : "Bulan ini";

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  const handlePrintPreview = () => {
    try {
      toast.success("Membuka preview print...");

      if (!settings) {
        toast.error("Settings belum dimuat. Tunggu sebentar.");
        return;
      }

      const storeName = settings.storeName || "Warung Saya";
      const storeTagline = settings.storeTagline || "";
      const city = settings.city || "";
      const storeAddress = settings.storeAddress || "";

      const printWindow = window.open("about:blank", "_blank");
      if (!printWindow) {
        toast.error("Tidak dapat membuka jendela print. Pastikan pop-up diizinkan.");
        return;
      }

      const printDocument = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Laporan ${storeName}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; color: #333; }
              .report-container { max-width: 800px; margin: 0 auto; background: #fffaf5; border-radius: 30px; padding: 24px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08); }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px dashed rgba(0,0,0,0.2); padding-bottom: 20px; margin-bottom: 20px; }
              .store-name { font-size: 32px; font-weight: 700; margin: 0 0 8px 0; }
              .period-badge { background: #000; color: white; border-radius: 22px; padding: 8px 16px; text-align: right; }
              .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; border-bottom: 1px dashed rgba(0,0,0,0.2); padding-bottom: 20px; }
              .metric-card { background: white; border: 1px solid rgba(0,0,0,0.1); border-radius: 22px; padding: 16px; }
              .metric-label { font-size: 14px; color: #666; margin-bottom: 8px; }
              .metric-value { font-size: 24px; font-weight: 600; margin: 0; }
              .note-item { background: white; border: 1px solid rgba(0,0,0,0.1); border-radius: 18px; padding: 12px 16px; margin-bottom: 12px; }
              @media print { body { padding: 0; } .report-container { box-shadow: none; border-radius: 0; } }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="header">
                <div>
                  <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.22em; color: #ea580c;">Laporan Operasional</div>
                  <h1 class="store-name">${storeName}</h1>
                  <p style="margin: 8px 0; color: #666; font-size: 14px;">${[storeTagline, city].filter(Boolean).join(" • ")}</p>
                  <p style="color: #666; font-size: 14px;">${storeAddress}</p>
                </div>
                <div class="period-badge">
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; opacity: 0.7;">${rangeLabel}</div>
                  <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">${formatCurrency(summary.netProfit)}</div>
                </div>
              </div>
              <div class="metrics-grid">
                <div class="metric-card"><div class="metric-label">Omzet</div><p class="metric-value">${formatCurrency(summary.revenue)}</p></div>
                <div class="metric-card"><div class="metric-label">Pengeluaran</div><p class="metric-value">${formatCurrency(summary.expenseTotal)}</p></div>
                <div class="metric-card"><div class="metric-label">Laba kotor</div><p class="metric-value">${formatCurrency(summary.grossProfit)}</p></div>
                <div class="metric-card"><div class="metric-label">Rata-rata transaksi</div><p class="metric-value">${formatCurrency(summary.averageTicket)}</p></div>
              </div>
              <div>
                <div style="font-size: 14px; font-weight: 500; margin-bottom: 16px;">Catatan untuk pemilik warung</div>
                <div class="note-item">Laba bersih periode ${rangeLabel.toLowerCase()} tercatat ${formatCurrency(summary.netProfit)}.</div>
                <div class="note-item">Produk paling sering bergerak: ${topVelocity.map((item) => item.name).join(", ")}.</div>
                <div class="note-item">Total ${summary.transactionCount} transaksi dengan rata-rata tiket ${formatCurrency(summary.averageTicket)} per transaksi.</div>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(0,0,0,0.2); padding-top: 20px; margin-top: 20px; font-size: 14px; color: #666;">
                <span>Disusun otomatis oleh Warung OS</span>
                <span>${formatDate(new Date().toISOString())}</span>
              </div>
            </div>
            <div style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-right: 10px;">🖨️ Cetak / Save as PDF</button>
              <button onclick="window.close()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">✕ Tutup</button>
              <p style="margin-top: 15px; font-size: 14px; color: #666;">Pilih printer "Save as PDF" untuk export PDF.</p>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(printDocument);
      printWindow.document.close();
    } catch (error) {
      console.error("Print preview error:", error);
      toast.error("Gagal membuka preview print.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Omzet"
          value={formatCompactCurrency(summary.revenue)}
          description={`Total pemasukan ${rangeLabel.toLowerCase()}.`}
          icon={TrendingUp}
        />
        <StatCard
          title="Laba kotor"
          value={formatCompactCurrency(summary.grossProfit)}
          description="Penjualan dikurangi modal barang."
          tone="accent"
          icon={BarChart3}
        />
        <StatCard
          title="Pengeluaran"
          value={formatCompactCurrency(summary.expenseTotal)}
          description="Biaya operasional periode ini."
          icon={CreditCard}
        />
        <StatCard
          title="Laba bersih"
          value={formatCompactCurrency(summary.netProfit)}
          description="Hasil akhir setelah semua potongan."
          tone="warn"
          icon={Sparkles}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Ringkasan performa */}
        <Card className="border-border/60 bg-white shadow-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="font-heading text-xl">Ringkasan performa</CardTitle>
              <CardDescription>
                Ganti periode untuk membaca ritme omzet dan laba warung secara cepat.
              </CardDescription>
            </div>
            <Tabs value={range} onValueChange={(value) => setRange(value as ReportRange)}>
              <TabsList className="rounded-full p-1">
                <TabsTrigger value="harian" className="rounded-full px-4">Harian</TabsTrigger>
                <TabsTrigger value="mingguan" className="rounded-full px-4">Mingguan</TabsTrigger>
                <TabsTrigger value="bulanan" className="rounded-full px-4">Bulanan</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tren omzet</p>
                  <p className="mt-2 font-mono text-3xl font-semibold">{formatCurrency(summary.revenue)}</p>
                </div>
                <div className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                  {summary.transactionCount} transaksi
                </div>
              </div>

              {series.every((s) => s.revenue === 0) ? (
                <div className="mt-6 flex h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center">
                  <BarChart3 className="size-10 text-muted-foreground/25" />
                  <p className="mt-3 text-sm font-semibold text-muted-foreground">Belum ada data penjualan</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Mulai catat transaksi di kasir untuk melihat grafik omzet.
                  </p>
                </div>
              ) : (
                <div className="relative mt-6 h-60">
                  {/* Horizontal grid lines */}
                  {[25, 50, 75].map((pct) => (
                    <div
                      key={pct}
                      className="pointer-events-none absolute inset-x-0 border-t border-border/40"
                      style={{ bottom: `${pct}%` }}
                    >
                      <span className="absolute -top-3.5 right-0 text-[11px] text-muted-foreground/50">
                        {formatCompactCurrency((highestValue * pct) / 100)}
                      </span>
                    </div>
                  ))}
                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end gap-2">
                    {series.map((item) => (
                      <div key={item.label} className="flex flex-1 flex-col items-center gap-1.5">
                        <p className="font-mono text-[11px] font-bold text-primary leading-none">
                          {item.revenue > 0 ? formatCompactCurrency(item.revenue) : ""}
                        </p>
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-[14px] bg-gradient-to-t from-primary to-chart-3 shadow-[0_12px_24px_-14px_rgba(186,92,35,0.75)] transition-all duration-500"
                            style={{
                              height: `${Math.max(8, (item.revenue / highestValue) * 100)}%`,
                              opacity: item.revenue === 0 ? 0.25 : 1,
                            }}
                          />
                        </div>
                        <p className="text-[11px] font-medium text-foreground leading-none">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-sm text-muted-foreground">Rata-rata tiket</p>
                <p className="mt-2 font-mono text-3xl font-semibold">{formatCurrency(summary.averageTicket)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Nilai rata-rata per transaksi untuk periode {rangeLabel.toLowerCase()}.
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-sm text-muted-foreground">Produk paling bergerak</p>
                <div className="mt-4 space-y-3">
                  {topVelocity.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{item.sold} terjual</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview laporan */}
        <Card className="border-border/60 bg-white shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-xl">Preview laporan PDF</CardTitle>
              <CardDescription>
                Klik "Cetak PDF" untuk membuka dialog print — pilih "Save as PDF" untuk menyimpan.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-full" onClick={handlePrintPreview}>
                <Printer className="size-4" />
                Preview
              </Button>
              <Button type="button" className="rounded-full" onClick={handlePrintPreview}>
                <Download className="size-4" />
                Cetak PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-[28px] bg-[#fffaf5] p-5 shadow-inner ring-1 ring-border/80">
              <div className="flex items-start justify-between gap-4 border-b border-dashed border-border/80 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Laporan operasional</p>
                  <h3 className="mt-2 font-heading text-2xl font-semibold">{settings.storeName}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {[settings.storeTagline, settings.city].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <div className="rounded-2xl bg-foreground px-4 py-3 text-right text-background shrink-0">
                  <p className="text-xs uppercase tracking-[0.18em] text-background/70">{rangeLabel}</p>
                  <p className="mt-1.5 font-mono text-xl font-semibold">{formatCurrency(summary.netProfit)}</p>
                </div>
              </div>

              <div className="grid gap-3 border-b border-dashed border-border/80 py-4 grid-cols-2">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border/70">
                  <p className="text-xs text-muted-foreground">Omzet</p>
                  <p className="mt-1.5 font-mono text-lg font-semibold">{formatCurrency(summary.revenue)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border/70">
                  <p className="text-xs text-muted-foreground">Pengeluaran</p>
                  <p className="mt-1.5 font-mono text-lg font-semibold">{formatCurrency(summary.expenseTotal)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border/70">
                  <p className="text-xs text-muted-foreground">Laba kotor</p>
                  <p className="mt-1.5 font-mono text-lg font-semibold">{formatCurrency(summary.grossProfit)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border/70">
                  <p className="text-xs text-muted-foreground">Rata-rata transaksi</p>
                  <p className="mt-1.5 font-mono text-lg font-semibold">{formatCurrency(summary.averageTicket)}</p>
                </div>
              </div>

              <div className="space-y-3 py-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <TrendingUp className="size-4 text-primary" />
                  Catatan untuk pemilik warung
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="rounded-2xl bg-white px-4 py-3 ring-1 ring-border/70">
                    Laba bersih periode {rangeLabel.toLowerCase()} tercatat {formatCurrency(summary.netProfit)}.
                  </li>
                  <li className="rounded-2xl bg-white px-4 py-3 ring-1 ring-border/70">
                    Produk paling sering bergerak: {topVelocity.length > 0 ? topVelocity.map((item) => item.name).join(", ") : "Belum ada data transaksi."}.
                  </li>
                  <li className="rounded-2xl bg-white px-4 py-3 ring-1 ring-border/70">
                    Total {summary.transactionCount} transaksi, rata-rata tiket {formatCurrency(summary.averageTicket)}.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between border-t border-dashed border-border/80 pt-4 text-xs text-muted-foreground">
                <span>Disusun otomatis oleh Warung OS</span>
                <span>{formatDate(new Date().toISOString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Pengeluaran ── */}
      <Card className="border-border/60 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-heading text-xl">Catat Pengeluaran</CardTitle>
            <CardDescription>
              Operasional, belanja bahan, atau utilitas — semua tercatat untuk laporan laba bersih yang akurat.
            </CardDescription>
          </div>
          <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
            <DialogTrigger render={<Button size="lg" className="h-11 rounded-2xl shrink-0" />}>
              <Plus className="size-4" />
              Tambah pengeluaran
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0 flex flex-col overflow-hidden">
              <DialogHeader className="shrink-0 p-5 pb-0">
                <DialogTitle className="font-heading text-xl">Catat pengeluaran baru</DialogTitle>
                <DialogDescription>
                  Simpan pengeluaran untuk menghitung laba bersih yang akurat.
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 grid gap-4 p-5 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="expense-title">Keterangan</Label>
                  <Input
                    id="expense-title"
                    value={expenseDraft.title}
                    onChange={(e) => setExpenseDraft({ ...expenseDraft, title: e.target.value })}
                    placeholder="Contoh: Beli minyak goreng, bayar listrik"
                    className="h-11 rounded-2xl"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="expense-amount">Nominal (Rp)</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={expenseDraft.amount || ""}
                      onChange={(e) => setExpenseDraft({ ...expenseDraft, amount: Number(e.target.value) })}
                      className="h-11 rounded-2xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Kategori</Label>
                    <Select
                      value={expenseDraft.category}
                      onValueChange={(v) => setExpenseDraft({ ...expenseDraft, category: v as ExpenseDraft["category"] })}
                    >
                      <SelectTrigger className="h-11 rounded-2xl bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operasional">Operasional</SelectItem>
                        <SelectItem value="Belanja">Belanja</SelectItem>
                        <SelectItem value="Utilitas">Utilitas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="shrink-0 rounded-b-[28px]" showCloseButton>
                <Button type="button" onClick={() => void handleAddExpense()}>
                  Simpan pengeluaran
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
              <CreditCard className="size-10 text-muted-foreground/25" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Belum ada pengeluaran</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Tap &ldquo;Tambah pengeluaran&rdquo; untuk mulai mencatat biaya operasional.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 10).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{expense.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {expense.category} · {formatDateTime(expense.createdAt)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-bold text-foreground">
                    {formatCurrency(expense.amount)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteExpenseId(expense.id)}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground/40 transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Hapus pengeluaran"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              {expenses.length > 10 && (
                <p className="pt-1 text-center text-xs text-muted-foreground">
                  +{expenses.length - 10} pengeluaran lainnya
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Confirm delete expense ── */}
      <Dialog open={Boolean(confirmDeleteExpenseId)} onOpenChange={(open) => !open && setConfirmDeleteExpenseId(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-[28px] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="font-heading text-xl">Hapus pengeluaran?</DialogTitle>
            <DialogDescription>
              {confirmDeleteExpenseId
                ? `Hapus "${expenses.find((e) => e.id === confirmDeleteExpenseId)?.title ?? "pengeluaran ini"}". Tindakan ini tidak bisa dibatalkan.`
                : "Konfirmasi penghapusan pengeluaran."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="shrink-0 rounded-b-[28px]" showCloseButton>
            <Button
              type="button"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void handleDeleteExpense()}
            >
              <Trash2 className="size-4" />
              Ya, hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
