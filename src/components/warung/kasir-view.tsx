"use client";

import { useState } from "react";
import { BanknoteArrowDown, CreditCard, Minus, PackageSearch, Plus, Printer, ReceiptText, Search, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/components/providers/app-state-provider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { formatCurrency } from "@/lib/format";
import { PaymentMethod, Product, ProductCategory, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

const paymentLabels: Record<PaymentMethod, string> = {
  Tunai: "Tunai",
  QRIS: "QRIS",
  Transfer: "Transfer",
};

const categoryLabels: Array<{ value: "Semua" | ProductCategory; label: string; emoji: string }> = [
  { value: "Semua", label: "Semua", emoji: "🏪" },
  { value: "Makanan", label: "Makanan", emoji: "🍽️" },
  { value: "Jus Segar", label: "Jus Segar", emoji: "🥤" },
  { value: "Minuman", label: "Minuman", emoji: "☕" },
  { value: "Sembako", label: "Sembako", emoji: "🛒" },
  { value: "Kebutuhan Harian", label: "Harian", emoji: "✨" },
];

const categoryEmoji: Record<string, string> = {
  Makanan: "🍽️",
  "Jus Segar": "🥤",
  Minuman: "☕",
  Sembako: "🛒",
  "Kebutuhan Harian": "✨",
};

function ProductCategoryIcon({ category }: { category: ProductCategory }) {
  return <span className="text-base leading-none">{categoryEmoji[category] ?? "🏪"}</span>;
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const lowStock = product.stock <= product.minimumStock;
  const outOfStock = product.stock <= 0;

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={outOfStock}
      className={cn(
        "group flex min-h-[168px] flex-col justify-between rounded-[24px] border bg-white/85 p-4 text-left shadow-[0_8px_32px_-12px_rgba(232,130,26,0.18)] transition-all duration-200",
        "hover:-translate-y-1 hover:border-primary/50 hover:bg-white hover:shadow-[0_16px_40px_-12px_rgba(232,130,26,0.30)]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        lowStock && !outOfStock
          ? "border-amber-300/80 bg-amber-50/90"
          : "border-white/70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <ProductCategoryIcon category={product.category} />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              {product.category}
            </span>
          </div>
          <p className="mt-2 font-heading text-[1.05rem] font-semibold leading-snug line-clamp-2">
            {product.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>
        {lowStock && !outOfStock && (
          <Badge className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white">
            Tipis
          </Badge>
        )}
        {outOfStock && (
          <Badge className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
            Habis
          </Badge>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="font-heading text-xl font-bold text-primary">{formatCurrency(product.sellPrice)}</p>
          <p className="text-xs text-muted-foreground">
            Stok:{" "}
            <span className={cn("font-semibold", lowStock && "text-amber-600", outOfStock && "text-red-500")}>
              {product.stock}
            </span>
          </p>
        </div>
        <div
          className="flex size-9 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 group-hover:scale-110 group-hover:bg-primary group-hover:text-white"
          aria-hidden="true"
        >
          <Plus className="size-4 text-primary transition-colors group-hover:text-white" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
}

function KasirSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr] animate-pulse">
      <div className="rounded-[26px] border border-white/60 bg-white/60 p-6 space-y-4">
        <div className="h-6 w-48 rounded-full bg-muted" />
        <div className="h-4 w-72 rounded-full bg-muted/70" />
        <div className="flex gap-2 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-muted/70" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[168px] rounded-[24px] bg-muted/50" />
          ))}
        </div>
      </div>
      <div className="rounded-[26px] border border-white/60 bg-white/60 p-6 space-y-4">
        <div className="h-6 w-36 rounded-full bg-muted" />
        <div className="h-[300px] rounded-[22px] bg-muted/50" />
        <div className="h-12 rounded-[24px] bg-muted/70" />
        <div className="h-16 rounded-[24px] bg-primary/20" />
      </div>
    </div>
  );
}

export function KasirView() {
  const {
    isLoading,
    products,
    cartLines,
    cartTotal,
    paymentMethod,
    settings,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    setPaymentMethod,
    checkout,
  } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Semua" | ProductCategory>("Semua");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checkoutSuccessOpen, setCheckoutSuccessOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [lastCashReceived, setLastCashReceived] = useState<number>(0);
  const [lastChange, setLastChange] = useState<number>(0);
  const cashReceivedNum = cashReceived ? parseFloat(cashReceived.replace(/[^0-9]/g, "")) || 0 : 0;
  const change = cashReceivedNum - cartTotal;
  const showCashInput = paymentMethod === "Tunai";

  if (isLoading) return <KasirSkeleton />;

  function handleCheckoutConfirm() {
    if (cartLines.length === 0) {
      toast.error("Keranjang masih kosong.");
      return;
    }
    
    if (paymentMethod === "Tunai") {
      if (!cashReceivedNum || cashReceivedNum === 0) {
        toast.error("Masukkan jumlah uang yang diterima.");
        return;
      }
      if (cashReceivedNum < cartTotal) {
        toast.error(`Uang kurang ${formatCurrency(cartTotal - cashReceivedNum)}.`);
        return;
      }
    }
    
    setConfirmOpen(true);
  }

  function handleSendWhatsApp() {
    if (!lastTransaction) return;
    const storeName = settings.storeName || "Warung Saya";
    const date = new Date(lastTransaction.createdAt).toLocaleDateString("id-ID");
    const itemsText = lastTransaction.items.map(item => 
      `${item.productName} x${item.quantity} = ${formatCurrency(item.unitPrice * item.quantity)}`
    ).join("%0A");
    const total = formatCurrency(lastTransaction.total);
    const payment = paymentLabels[lastTransaction.paymentMethod];
    
    let paymentText = `Pembayaran: ${payment}`;
    if (lastTransaction.paymentMethod === "Tunai" && lastCashReceived > 0) {
      paymentText += `%0AUang Diterima: ${formatCurrency(lastCashReceived)}`;
      paymentText += `%0AKembalian: ${formatCurrency(lastChange)}`;
    }
    
    const text = `*Struk ${storeName}*%0A${date}%0A%0A${itemsText}%0A%0ATotal: *${total}*%0A${paymentText}%0A%0ATerima kasih!`;
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setCheckoutSuccessOpen(false);
  }

  function printDetailReceipt() {
    if (!lastTransaction) return;
    const storeName = settings.storeName || "Warung Saya";
    const date = new Date(lastTransaction.createdAt).toLocaleDateString("id-ID");
    const time = new Date(lastTransaction.createdAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
    
    // Buat HTML untuk struk detail
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk ${storeName}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.4; max-width: 300px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
          .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .receipt-info { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .items-table th { text-align: left; border-bottom: 1px dashed #000; padding: 5px 0; }
          .items-table td { padding: 5px 0; border-bottom: 1px dashed #ddd; }
          .items-table .qty { width: 20px; text-align: center; }
          .items-table .name { flex: 1; }
          .items-table .price { text-align: right; }
          .total-row { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          @media print { 
            body { max-width: 100%; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${storeName}</div>
          <div>${date} ${time}</div>
          <div>No: ${lastTransaction.id.substring(0, 8)}</div>
        </div>
        
        <div class="receipt-info">
          <div>Kasir: Kasir</div>
          <div>${paymentLabels[lastTransaction.paymentMethod]}</div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th class="qty">Qty</th>
              <th class="name">Item</th>
              <th class="price">Harga</th>
              <th class="price">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${lastTransaction.items.map(item => `
              <tr>
                <td class="qty">${item.quantity}</td>
                <td class="name">${item.productName}</td>
                <td class="price">${formatCurrency(item.unitPrice)}</td>
                <td class="price">${formatCurrency(item.unitPrice * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${lastTransaction.paymentMethod === "Tunai" && lastCashReceived > 0 ? `
        <div class="payment-info" style="margin: 15px 0;">
          <div style="display: flex; justify-content: space-between;">
            <span>Uang Diterima:</span>
            <span>${formatCurrency(lastCashReceived)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Kembalian:</span>
            <span>${formatCurrency(lastChange)}</span>
          </div>
        </div>
        ` : ''}
        
        <div class="total-row">
          <div style="display: flex; justify-content: space-between;">
            <span>Total:</span>
            <span>${formatCurrency(lastTransaction.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div>Terima kasih atas kunjungan Anda</div>
          <div>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</div>
        </div>
        
        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Cetak Struk</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Tutup</button>
        </div>
      </body>
      </html>
    `;
    
    // Buka window baru dengan struk
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      // Auto print setelah konten loaded
      printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
      };
    }
    setCheckoutSuccessOpen(false);
  }

  const filteredProducts = products.filter((product) => {
    const queryMatch =
      query.length === 0 ||
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase());
    const categoryMatch = category === "Semua" || product.category === category;
    return queryMatch && categoryMatch;
  });

  async function handleCheckoutNow() {
    try {
      const transaction = await checkout();
      if (!transaction) {
        toast.error("Keranjang masih kosong.");
        return;
      }

      const lowProducts = transaction.items.reduce<Product[]>((items, item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) {
          return items;
        }

        if (product.stock - item.quantity <= product.minimumStock) {
          items.push(product);
        }

        return items;
      }, []);

      toast.success("Transaksi berhasil disimpan.", {
        description: `${transaction.items.length} produk masuk ke penjualan ${paymentLabels[transaction.paymentMethod]}.`,
      });

      setLastTransaction(transaction);
      
      // Simpan informasi pembayaran tunai jika metode Tunai
      if (paymentMethod === "Tunai") {
        setLastCashReceived(cashReceivedNum);
        setLastChange(change);
        // Reset input uang setelah transaksi
        setCashReceived("");
      } else {
        setLastCashReceived(0);
        setLastChange(0);
      }
      
      setCheckoutSuccessOpen(true);
      setConfirmOpen(false);

      if (lowProducts.length > 0) {
        toast.warning("Ada produk yang mendekati stok minimum.", {
          description: `Siapkan restok untuk ${lowProducts.slice(0, 2).map((item) => item.name).join(", ")}.`,
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan transaksi.");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
      <div>
        <Card className="border-white/60 bg-white/74 shadow-[0_28px_70px_-45px_rgba(66,38,20,0.55)]">
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-heading text-xl md:text-2xl">Menu Kedai Nona Suka</CardTitle>
                <CardDescription className="hidden sm:block">
                  Tap item untuk tambah ke keranjang. Filter per kategori atau cari nama menu.
                </CardDescription>
              </div>
              <div className="relative w-full sm:min-w-[220px] sm:w-auto">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari produk..."
                  className="h-10 rounded-2xl border-border/80 bg-white/80 pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryLabels.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={category === item.value ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full gap-1.5 text-xs sm:text-sm",
                    category === item.value
                      ? "shadow-[0_8px_24px_-10px_rgba(232,130,26,0.55)]"
                      : "hover:border-primary/40 hover:bg-primary/5"
                  )}
                  onClick={() => setCategory(item.value)}
                >
                  <span>{item.emoji}</span>
                  {item.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => {
                      addToCart(product.id);
                      toast.success(`${product.name} ditambahkan ke keranjang.`, {
                        description: `Stok tersedia ${product.stock} pcs.`,
                      });
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[26px] border border-dashed border-border bg-white/55 text-center">
                <PackageSearch className="size-10 text-muted-foreground" />
                <p className="mt-4 font-heading text-xl font-semibold">Produk tidak ditemukan</p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Coba kata kunci lain atau pilih kategori yang lebih luas untuk melihat produk aktif.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="border-white/60 bg-white/74 shadow-[0_28px_70px_-48px_rgba(66,38,20,0.6)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-2xl">Keranjang aktif</CardTitle>
                <CardDescription>Semua item yang sudah ditap akan muncul di sini.</CardDescription>
              </div>
              <Badge className="rounded-full bg-foreground text-background">{cartLines.length} item</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <ScrollArea className="h-[260px] lg:h-[320px] rounded-[22px] border border-border/70 bg-white/60 p-3">
              {cartLines.length > 0 ? (
                <div className="space-y-3">
                  {cartLines.map((line) => (
                    <div
                      key={line.product.id}
                      className="rounded-[20px] border border-border/70 bg-white/85 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{line.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(line.product.sellPrice)} per item
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(line.product.id)}
                          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label={`Hapus ${line.product.name}`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-2 py-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => updateCartQuantity(line.product.id, line.quantity - 1)}
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="min-w-6 text-center text-sm font-semibold">{line.quantity}</span>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="rounded-full"
                            onClick={() => updateCartQuantity(line.product.id, line.quantity + 1)}
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                        <p className="font-semibold">{formatCurrency(line.lineTotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                  <ReceiptText className="size-10 text-muted-foreground" />
                  <p className="mt-4 font-heading text-xl font-semibold">Belum ada item</p>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    Tap produk dari sisi kiri untuk mulai membuat transaksi baru.
                  </p>
                </div>
              )}
            </ScrollArea>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Metode pembayaran</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {settings.enabledPayments.map((method) => (
                  <Button
                    key={method}
                    type="button"
                    variant={paymentMethod === method ? "default" : "outline"}
                    className={cn(
                      "h-12 rounded-2xl",
                      paymentMethod === method && "shadow-[0_20px_40px_-22px_rgba(186,92,35,0.75)]"
                    )}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method === "Tunai" ? <BanknoteArrowDown className="size-4" /> : <CreditCard className="size-4" />}
                    {paymentLabels[method]}
                  </Button>
                ))}
              </div>
            </div>

            {showCashInput && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Uang Diterima</p>
                  {cashReceivedNum > 0 && change >= 0 && (
                    <p className="text-sm font-medium text-green-600">
                      Kembalian: {formatCurrency(change)}
                    </p>
                  )}
                  {cashReceivedNum > 0 && change < 0 && (
                    <p className="text-sm font-medium text-red-600">
                      Kurang: {formatCurrency(-change)}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cashReceived}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setCashReceived(value ? parseInt(value).toLocaleString('id-ID') : '');
                    }}
                    placeholder="Masukkan uang diterima"
                    className="h-12 rounded-2xl pl-10 text-lg font-medium"
                    autoComplete="off"
                  />
                </div>
                {cashReceivedNum > 0 && change < 0 && (
                  <p className="text-sm text-red-500">
                    Uang kurang {formatCurrency(-change)}. Tambahkan uang atau pilih metode pembayaran lain.
                  </p>
                )}
              </div>
            )}

            <div className="rounded-[24px] bg-gradient-to-br from-primary to-[#c8681a] px-4 py-4 text-white shadow-[0_16px_40px_-14px_rgba(232,130,26,0.55)]">
              <div className="flex items-center justify-between text-sm text-white/75">
                <span>Total tagihan</span>
                <span>{cartLines.reduce((sum, line) => sum + line.quantity, 0)} item</span>
              </div>
              <p className="mt-2 font-heading text-4xl font-bold tracking-tight">
                {formatCurrency(cartTotal)}
              </p>
              <Button
                type="button"
                size="lg"
                className="mt-4 h-12 w-full rounded-2xl bg-white text-primary font-bold hover:bg-white/90 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)] transition-all hover:scale-[1.01]"
                onClick={() => handleCheckoutConfirm()}
              >
                Selesaikan Transaksi
              </Button>
              <p className="mt-2.5 text-xs text-white/65 text-center">
                Stok otomatis berkurang & transaksi tersimpan ke laporan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-2xl">Konfirmasi Transaksi</DialogTitle>
            <DialogDescription>
              Apakah transaksi sudah benar? Setelah dikonfirmasi, stok akan berkurang dan transaksi tersimpan.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-4">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                <p className="text-sm text-muted-foreground">Total Tagihan</p>
                <p className="mt-2 font-heading text-3xl font-semibold">{formatCurrency(cartTotal)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{cartLines.reduce((sum, line) => sum + line.quantity, 0)} pcs</p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                <p className="text-sm text-muted-foreground">Metode Pembayaran</p>
                <p className="mt-2 font-heading text-xl font-semibold">{paymentLabels[paymentMethod]}</p>
              </div>
              {paymentMethod === "Tunai" && cashReceivedNum > 0 && (
                <>
                  <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                    <p className="text-sm text-muted-foreground">Uang Diterima</p>
                    <p className="mt-2 font-heading text-xl font-semibold text-green-600">{formatCurrency(cashReceivedNum)}</p>
                  </div>
                  <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                    <p className="text-sm text-muted-foreground">Kembalian</p>
                    <p className="mt-2 font-heading text-xl font-semibold text-blue-600">{formatCurrency(change)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter className="rounded-b-[28px]" showCloseButton>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Tidak, Periksa Lagi
            </Button>
            <Button type="button" onClick={() => void handleCheckoutNow()}>
              Ya, Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={checkoutSuccessOpen} onOpenChange={setCheckoutSuccessOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-2xl">Transaksi Berhasil!</DialogTitle>
            <DialogDescription>
              Transaksi telah disimpan. Cetak struk atau kirim via WhatsApp ke pelanggan.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-4">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                <p className="text-sm text-muted-foreground">Nomor Transaksi</p>
                <p className="mt-2 font-heading text-xl font-semibold">{lastTransaction?.id.substring(0, 8)}</p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="mt-2 font-heading text-3xl font-semibold">{formatCurrency(lastTransaction?.total || 0)}</p>
              </div>
              {lastTransaction?.paymentMethod === "Tunai" && lastCashReceived > 0 && (
                <>
                  <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                    <p className="text-sm text-muted-foreground">Uang Diterima</p>
                    <p className="mt-2 font-heading text-xl font-semibold text-green-600">{formatCurrency(lastCashReceived)}</p>
                  </div>
                  <div className="rounded-[22px] border border-border/70 bg-white/75 p-4">
                    <p className="text-sm text-muted-foreground">Kembalian</p>
                    <p className="mt-2 font-heading text-xl font-semibold text-blue-600">{formatCurrency(lastChange)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter className="rounded-b-[28px]" showCloseButton>
            <Button type="button" variant="outline" onClick={() => printDetailReceipt()}>
              <Printer className="size-4 mr-2" />
              Cetak Struk
            </Button>
            <Button type="button" onClick={() => handleSendWhatsApp()}>
              <MessageCircle className="size-4 mr-2" />
              Kirim WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}