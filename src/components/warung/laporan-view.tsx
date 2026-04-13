"use client";

import { useRef, useState } from "react";
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
  // Use reduce instead of Math.max(...spread) to avoid empty-array edge case
  const highestValue = series.reduce((max, item) => Math.max(max, item.revenue), 1);

  const rangeLabel =
    range === "harian" ? "Hari ini" : range === "mingguan" ? "Minggu ini" : "Bulan ini";

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-[26px] bg-white/60 border border-white/60" />
          ))}
        </div>
        <div className="h-72 rounded-[26px] bg-white/60 border border-white/60" />
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
      
      const printWindow = window.open('about:blank', '_blank');
      if (!printWindow) {
        toast.error("Tidak dapat membuka jendela print. Pastikan pop-up diizinkan.");
        return;
      }
      
      const printDocument = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Laporan Warung OS - ${storeName}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
              }
              .report-container {
                max-width: 800px;
                margin: 0 auto;
                background: #fffaf5;
                border-radius: 30px;
                padding: 24px;
                box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 1px dashed rgba(0,0,0,0.2);
                padding-bottom: 20px;
                margin-bottom: 20px;
              }
              .store-name {
                font-size: 32px;
                font-weight: 700;
                margin: 0 0 8px 0;
              }
              .period-badge {
                background: #000;
                color: white;
                border-radius: 22px;
                padding: 8px 16px;
                text-align: right;
              }
              .metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 20px;
                border-bottom: 1px dashed rgba(0,0,0,0.2);
                padding-bottom: 20px;
              }
              .metric-card {
                background: white;
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: 22px;
                padding: 16px;
              }
              .metric-label {
                font-size: 14px;
                color: #666;
                margin-bottom: 8px;
              }
              .metric-value {
                font-size: 24px;
                font-weight: 600;
                margin: 0;
              }
              .notes {
                margin-top: 20px;
              }
              .note-item {
                background: white;
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: 18px;
                padding: 12px 16px;
                margin-bottom: 12px;
              }
              @media print {
                body { padding: 0; }
                .report-container { box-shadow: none; border-radius: 0; }
              }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="header">
                <div>
                  <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.22em; color: #ea580c;">Warung OS report</div>
                  <h1 class="store-name">${storeName}</h1>
                  <p style="margin: 8px 0; color: #666; font-size: 14px;">
                    ${[storeTagline, city].filter(Boolean).join(" • ")}
                  </p>
                  <p style="color: #666; font-size: 14px;">${storeAddress}</p>
                </div>
                <div class="period-badge">
                  <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; opacity: 0.7;">${rangeLabel}</div>
                  <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">${formatCurrency(summary.netProfit)}</div>
                </div>
              </div>
              
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-label">Omzet</div>
                  <p class="metric-value">${formatCurrency(summary.revenue)}</p>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Pengeluaran</div>
                  <p class="metric-value">${formatCurrency(summary.expenseTotal)}</p>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Laba kotor</div>
                  <p class="metric-value">${formatCurrency(summary.grossProfit)}</p>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Rata-rata transaksi</div>
                  <p class="metric-value">${formatCurrency(summary.averageTicket)}</p>
                </div>
              </div>
              
              <div class="notes">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 16px;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ea580c;">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  Catatan untuk pemilik warung
                </div>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li class="note-item">Laba bersih periode ${rangeLabel.toLowerCase()} tercatat ${formatCurrency(summary.netProfit)}.</li>
                  <li class="note-item">Produk paling sering bergerak: ${topVelocity.map((item) => item.name).join(", ")}.</li>
                  <li class="note-item">Total transaksi: ${summary.transactionCount} transaksi dengan rata-rata tiket ${formatCurrency(summary.averageTicket)}.</li>
                </ul>
              </div>
              
              <div style="display: flex; justify-content: space-between; border-top: 1px dashed rgba(0,0,0,0.2); padding-top: 20px; margin-top: 20px; font-size: 14px; color: #666;">
                <span>Disusun otomatis oleh Warung OS</span>
                <span>${formatDate(new Date().toISOString())}</span>
              </div>
            </div>
            <div style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                🖨️ Cetak / Save as PDF
              </button>
              <button onclick="window.close()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
                ✕ Tutup
              </button>
              <p style="margin-top: 15px; font-size: 14px; color: #666;">
                Pilih printer "Save as PDF" untuk export PDF.
              </p>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.write(printDocument);
      printWindow.document.close();
    } catch (error) {
      console.error("Print preview error:", error);
      toast.error("Gagal membuka preview print. Cek console untuk detail.");
    }
  };

  const handleDownloadPDF = () => {
    // Untuk sekarang, kita gunakan print preview juga karena browser bisa save as PDF
    handlePrintPreview();
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Omzet"
          value={formatCompactCurrency(summary.revenue)}
          description={`Total pemasukan untuk periode ${rangeLabel.toLowerCase()}.`}
        />
        <StatCard
          title="Laba kotor"
          value={formatCompactCurrency(summary.grossProfit)}
          description="Penjualan dikurangi modal barang yang terjual."
          tone="accent"
        />
        <StatCard
          title="Pengeluaran"
          value={formatCompactCurrency(summary.expenseTotal)}
          description="Biaya operasional dan belanja yang masuk di periode ini."
        />
        <StatCard
          title="Laba bersih"
          value={formatCompactCurrency(summary.netProfit)}
          description="Perkiraan hasil akhir setelah modal dan pengeluaran dikurangi."
          tone="warn"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-white/60 bg-white/74 shadow-[0_28px_70px_-45px_rgba(66,38,20,0.55)]">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="font-heading text-2xl">Ringkasan performa</CardTitle>
              <CardDescription>
                Ganti periode untuk membaca ritme omzet dan laba warung secara cepat.
              </CardDescription>
            </div>

            <Tabs value={range} onValueChange={(value) => setRange(value as ReportRange)}>
              <TabsList className="rounded-full p-1">
                <TabsTrigger value="harian" className="rounded-full px-4">
                  Harian
                </TabsTrigger>
                <TabsTrigger value="mingguan" className="rounded-full px-4">
                  Mingguan
                </TabsTrigger>
                <TabsTrigger value="bulanan" className="rounded-full px-4">
                  Bulanan
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-[26px] border border-border/70 bg-white/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tren omzet</p>
                  <p className="mt-2 font-heading text-3xl font-semibold">{formatCurrency(summary.revenue)}</p>
                </div>
                <div className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                  {summary.transactionCount} transaksi
                </div>
              </div>

              <div className="mt-6 flex h-52 items-end gap-3">
                {series.map((item) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-[18px] bg-gradient-to-t from-primary to-chart-3 shadow-[0_18px_28px_-18px_rgba(186,92,35,0.8)]"
                        style={{
                          height: `${Math.max(14, (item.revenue / highestValue) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground">{item.label}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatCompactCurrency(item.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[26px] border border-border/70 bg-white/80 p-5">
                <p className="text-sm text-muted-foreground">Rata-rata tiket</p>
                <p className="mt-2 font-heading text-3xl font-semibold">
                  {formatCurrency(summary.averageTicket)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Nilai rata-rata per transaksi untuk periode {rangeLabel.toLowerCase()}.
                </p>
              </div>

              <div className="rounded-[26px] border border-border/70 bg-white/80 p-5">
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

        <Card className="border-white/60 bg-white/74 shadow-[0_28px_70px_-45px_rgba(66,38,20,0.55)]">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="font-heading text-2xl">Preview laporan PDF</CardTitle>
              <CardDescription>
                Layout ini sengaja dibuat printable, tapi tombol ekspor masih demo frontend.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handlePrintPreview}
              >
                <Printer className="size-4" />
                Preview print
              </Button>
              <Button
                type="button"
                className="rounded-full"
                onClick={handleDownloadPDF}
              >
                <Download className="size-4" />
                Cetak PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-[30px] bg-[#fffaf5] p-6 shadow-inner ring-1 ring-border/80">
              <div className="flex items-start justify-between gap-4 border-b border-dashed border-border/80 pb-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-primary">Warung OS report</p>
                  <h3 className="mt-2 font-heading text-3xl font-semibold">{settings.storeName}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[settings.storeTagline, settings.city].filter(Boolean).join(" • ")}
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    {settings.storeAddress}
                  </p>
                </div>
                <div className="rounded-[22px] bg-foreground px-4 py-3 text-right text-background">
                  <p className="text-xs uppercase tracking-[0.18em] text-background/70">{rangeLabel}</p>
                  <p className="mt-2 font-heading text-2xl font-semibold">{formatCurrency(summary.netProfit)}</p>
                </div>
              </div>

              <div className="grid gap-4 border-b border-dashed border-border/80 py-5 sm:grid-cols-2">
                <div className="rounded-[22px] bg-white p-4 ring-1 ring-border/70">
                  <p className="text-sm text-muted-foreground">Omzet</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.revenue)}</p>
                </div>
                <div className="rounded-[22px] bg-white p-4 ring-1 ring-border/70">
                  <p className="text-sm text-muted-foreground">Pengeluaran</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.expenseTotal)}</p>
                </div>
                <div className="rounded-[22px] bg-white p-4 ring-1 ring-border/70">
                  <p className="text-sm text-muted-foreground">Laba kotor</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.grossProfit)}</p>
                </div>
                <div className="rounded-[22px] bg-white p-4 ring-1 ring-border/70">
                  <p className="text-sm text-muted-foreground">Rata-rata transaksi</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary.averageTicket)}</p>
                </div>
              </div>

              <div className="space-y-4 py-5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <TrendingUp className="size-4 text-primary" />
                  Catatan untuk pemilik warung
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-border/70">
                    Laba bersih periode {rangeLabel.toLowerCase()} tercatat {formatCurrency(summary.netProfit)}.
                  </li>
                  <li className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-border/70">
                    Produk paling sering bergerak: {topVelocity.map((item) => item.name).join(", ")}.
                  </li>
                  <li className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-border/70">
                    Data ini masih mock frontend, namun layout dan struktur metrik sudah siap dipakai saat API aktif.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between border-t border-dashed border-border/80 pt-5 text-sm text-muted-foreground">
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
