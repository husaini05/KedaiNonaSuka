"use client";

import { useState } from "react";
import { Download, Printer, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/components/providers/app-state-provider";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import { buildSeries, estimateProductVelocity, ReportRange, summarizeReport } from "@/lib/reporting";

export function LaporanView() {
  const { isLoading, transactions, expenses, products, settings } = useAppState();
  const [range, setRange] = useState<ReportRange>("harian");

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
        />
        <StatCard
          title="Laba kotor"
          value={formatCompactCurrency(summary.grossProfit)}
          description="Penjualan dikurangi modal barang."
          tone="accent"
        />
        <StatCard
          title="Pengeluaran"
          value={formatCompactCurrency(summary.expenseTotal)}
          description="Biaya operasional periode ini."
        />
        <StatCard
          title="Laba bersih"
          value={formatCompactCurrency(summary.netProfit)}
          description="Hasil akhir setelah semua potongan."
          tone="warn"
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
                  <p className="mt-2 font-heading text-3xl font-semibold">{formatCurrency(summary.revenue)}</p>
                </div>
                <div className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                  {summary.transactionCount} transaksi
                </div>
              </div>

              <div className="mt-6 flex h-60 items-end gap-2">
                {series.map((item) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <p className="text-[10px] font-bold text-primary leading-none">
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

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
                <p className="text-sm text-muted-foreground">Rata-rata tiket</p>
                <p className="mt-2 font-heading text-3xl font-semibold">{formatCurrency(summary.averageTicket)}</p>
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
                  <p className="mt-1.5 font-heading text-xl font-semibold">{formatCurrency(summary.netProfit)}</p>
                </div>
              </div>

              <div className="grid gap-3 border-b border-dashed border-border/80 py-4 grid-cols-2">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border/70">
                  <p className="text-xs text-muted-foreground">Omzet</p>
                  <p className="mt-1.5 text-lg font-semibold">{formatCurrency(summary.revenue)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border/70">
                  <p className="text-xs text-muted-foreground">Pengeluaran</p>
                  <p className="mt-1.5 text-lg font-semibold">{formatCurrency(summary.expenseTotal)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border/70">
                  <p className="text-xs text-muted-foreground">Laba kotor</p>
                  <p className="mt-1.5 text-lg font-semibold">{formatCurrency(summary.grossProfit)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border/70">
                  <p className="text-xs text-muted-foreground">Rata-rata transaksi</p>
                  <p className="mt-1.5 text-lg font-semibold">{formatCurrency(summary.averageTicket)}</p>
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
    </div>
  );
}
