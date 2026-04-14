"use client";

import { useEffect, useState } from "react";
import {
  BanknoteArrowDown,
  ChevronUp,
  CreditCard,
  Minus,
  PackageSearch,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Share2,
  ShoppingBasket,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/components/providers/app-state-provider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { formatCurrency } from "@/lib/format";
import { PaymentMethod, Product, ProductCategory, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const paymentLabels: Record<PaymentMethod, string> = {
  Tunai: "Tunai",
  QRIS: "QRIS",
  Transfer: "Transfer",
};

const categoryLabels: Array<{ value: "Semua" | ProductCategory; label: string; emoji: string }> = [
  { value: "Semua",            label: "Semua",   emoji: "🏪" },
  { value: "Makanan",          label: "Makanan", emoji: "🍽️" },
  { value: "Jus Segar",        label: "Jus",     emoji: "🥤" },
  { value: "Minuman",          label: "Minum",   emoji: "☕" },
  { value: "Sembako",          label: "Sembako", emoji: "🛒" },
  { value: "Kebutuhan Harian", label: "Harian",  emoji: "✨" },
];

const categoryEmoji: Record<string, string> = {
  Makanan: "🍽️",
  "Jus Segar": "🥤",
  Minuman: "☕",
  Sembako: "🛒",
  "Kebutuhan Harian": "✨",
};

function vibrate(ms = 30) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const lowStock = product.stock <= product.minimumStock;
  const outOfStock = product.stock <= 0;

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={outOfStock}
      className={cn(
        "group relative flex flex-col rounded-[20px] border bg-white p-3.5 text-left",
        "shadow-sm transition-all duration-200 active:scale-[0.96]",
        "hover:border-primary/40 hover:shadow-md",
        "disabled:cursor-not-allowed disabled:opacity-50",
        lowStock && !outOfStock ? "border-amber-200 bg-amber-50/70" : "border-border/60"
      )}
    >
      {/* Category */}
      <div className="flex items-center gap-1">
        <span className="text-sm leading-none">{categoryEmoji[product.category] ?? "🏪"}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 truncate">
          {product.category}
        </span>
      </div>

      {/* Name */}
      <p className="mt-1.5 text-[14px] font-semibold leading-snug line-clamp-2 text-foreground">
        {product.name}
      </p>

      {/* Stock warning */}
      {lowStock && !outOfStock && (
        <p className="mt-1 text-[11px] font-medium text-amber-600">
          Sisa {product.stock}
        </p>
      )}
      {outOfStock && (
        <p className="mt-1 text-[11px] font-medium text-destructive">Stok habis</p>
      )}

      {/* Price + Add button */}
      <div className="mt-2 flex items-center justify-between">
        <p className="font-heading text-[16px] font-bold text-primary leading-none">
          {formatCurrency(product.sellPrice)}
        </p>
        {!outOfStock && (
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-150 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-active:scale-95">
            <Plus className="size-3.5" aria-hidden="true" />
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KasirSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-11 rounded-2xl bg-white/60 border border-white/60" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 shrink-0 rounded-full bg-white/60" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-[20px] bg-white/60 border border-white/60" />
        ))}
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

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
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checkoutSuccessOpen, setCheckoutSuccessOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [lastCashReceived, setLastCashReceived] = useState(0);
  const [lastChange, setLastChange] = useState(0);

  const cashReceivedNum = cashReceived ? parseFloat(cashReceived.replace(/[^0-9]/g, "")) || 0 : 0;
  const change = cashReceivedNum - cartTotal;
  const showCashInput = paymentMethod === "Tunai";
  const totalQty = cartLines.reduce((s, l) => s + l.quantity, 0);

  // Auto-close cart sheet when cart is emptied
  useEffect(() => {
    if (cartLines.length === 0) setCartSheetOpen(false);
  }, [cartLines.length]);

  if (isLoading) return <KasirSkeleton />;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const filteredProducts = products.filter((p) => {
    const q = query.toLowerCase();
    const matchQuery = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchCat = category === "Semua" || p.category === category;
    return matchQuery && matchCat;
  });

  function buildReceiptText() {
    if (!lastTransaction) return "";
    const storeName = settings.storeName || "Warung Saya";
    const date = new Date(lastTransaction.createdAt).toLocaleDateString("id-ID");
    const lines = lastTransaction.items
      .map((i) => `${i.productName} x${i.quantity} = ${formatCurrency(i.unitPrice * i.quantity)}`)
      .join("\n");
    let payText = `Pembayaran: ${paymentLabels[lastTransaction.paymentMethod]}`;
    if (lastTransaction.paymentMethod === "Tunai" && lastCashReceived > 0) {
      payText += `\nUang Diterima: ${formatCurrency(lastCashReceived)}`;
      payText += `\nKembalian: ${formatCurrency(lastChange)}`;
    }
    return `*Struk ${storeName}*\n${date}\n\n${lines}\n\nTotal: *${formatCurrency(lastTransaction.total)}*\n${payText}\n\nTerima kasih!`;
  }

  async function handleShareReceipt() {
    if (!lastTransaction) return;
    const text = buildReceiptText();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `Struk ${settings.storeName || "Warung Saya"}`, text });
        setCheckoutSuccessOpen(false);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    setCheckoutSuccessOpen(false);
  }

  function printDetailReceipt() {
    if (!lastTransaction) return;
    const storeName = settings.storeName || "Warung Saya";
    const date = new Date(lastTransaction.createdAt).toLocaleDateString("id-ID");
    const time = new Date(lastTransaction.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const html = `<!DOCTYPE html><html><head><title>Struk ${storeName}</title><meta charset="utf-8"><style>
      body{font-family:'Courier New',monospace;font-size:14px;line-height:1.4;max-width:300px;margin:0 auto;padding:20px}
      .header{text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:15px}
      .store-name{font-size:18px;font-weight:bold;margin:0 0 8px 0}
      table{width:100%;border-collapse:collapse;margin:15px 0}
      th{text-align:left;border-bottom:1px dashed #000;padding:5px 0}
      td{padding:5px 0;border-bottom:1px dashed #ddd}
      .total-row{border-top:2px dashed #000;padding-top:10px;margin-top:10px;font-weight:bold}
      .footer{text-align:center;margin-top:20px;font-size:12px;color:#666}
      @media print{.no-print{display:none}}
    </style></head><body>
      <div class="header"><div class="store-name">${storeName}</div><div>${date} ${time}</div><div>No: ${lastTransaction.id.substring(0, 8)}</div></div>
      <table><thead><tr><th>Qty</th><th>Item</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>
      ${lastTransaction.items.map((i) => `<tr><td>${i.quantity}</td><td>${i.productName}</td><td style="text-align:right">${formatCurrency(i.unitPrice * i.quantity)}</td></tr>`).join("")}
      </tbody></table>
      ${lastTransaction.paymentMethod === "Tunai" && lastCashReceived > 0 ? `<div style="margin:15px 0"><div style="display:flex;justify-content:space-between"><span>Uang Diterima:</span><span>${formatCurrency(lastCashReceived)}</span></div><div style="display:flex;justify-content:space-between"><span>Kembalian:</span><span>${formatCurrency(lastChange)}</span></div></div>` : ""}
      <div class="total-row"><div style="display:flex;justify-content:space-between"><span>Total:</span><span>${formatCurrency(lastTransaction.total)}</span></div></div>
      <div class="footer"><p>Terima kasih atas kunjungan Anda</p></div>
      <div class="no-print" style="margin-top:24px;text-align:center">
        <button onclick="window.print()" style="padding:10px 20px;background:#E8821A;color:white;border:none;border-radius:8px;cursor:pointer">Cetak / Save as PDF</button>
        <button onclick="window.close()" style="padding:10px 20px;background:#6c757d;color:white;border:none;border-radius:8px;cursor:pointer;margin-left:8px">Tutup</button>
      </div>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.onload = () => { w.focus(); w.print(); }; }
    setCheckoutSuccessOpen(false);
  }

  function handleCheckoutConfirm() {
    if (cartLines.length === 0) { toast.error("Keranjang masih kosong."); return; }
    if (paymentMethod === "Tunai") {
      if (!cashReceivedNum) { toast.error("Masukkan jumlah uang yang diterima."); return; }
      if (cashReceivedNum < cartTotal) { toast.error(`Uang kurang ${formatCurrency(cartTotal - cashReceivedNum)}.`); return; }
    }
    setCartSheetOpen(false);
    setConfirmOpen(true);
  }

  async function handleCheckoutNow() {
    try {
      const transaction = await checkout();
      if (!transaction) { toast.error("Keranjang masih kosong."); return; }

      vibrate(60);
      toast.success("Transaksi berhasil disimpan.", {
        description: `${transaction.items.length} produk · ${paymentLabels[transaction.paymentMethod]}`,
      });

      setLastTransaction(transaction);
      if (paymentMethod === "Tunai") {
        setLastCashReceived(cashReceivedNum);
        setLastChange(change);
        setCashReceived("");
      } else {
        setLastCashReceived(0);
        setLastChange(0);
      }

      setCheckoutSuccessOpen(true);
      setConfirmOpen(false);

      // Warn about low stock after checkout
      const lowItems = transaction.items.reduce<Product[]>((acc, item) => {
        const p = products.find((c) => c.id === item.productId);
        if (p && p.stock - item.quantity <= p.minimumStock) acc.push(p);
        return acc;
      }, []);
      if (lowItems.length > 0) {
        toast.warning("Stok mendekati minimum.", {
          description: lowItems.slice(0, 2).map((p) => p.name).join(", "),
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan transaksi.");
    }
  }

  // ── Cart content (shared between sheet and desktop card) ─────────────────────

  function CartItemsList() {
    return (
      <div className="space-y-2">
        {cartLines.map((line) => (
          <div
            key={line.product.id}
            className="flex items-center gap-3 rounded-[16px] border border-border/60 bg-white px-3.5 py-3"
          >
            {/* Product info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{line.product.name}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(line.product.sellPrice)} / pcs</p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-1.5 py-1">
              <button
                type="button"
                onClick={() => updateCartQuantity(line.product.id, line.quantity - 1)}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground active:scale-90"
                aria-label="Kurangi"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-bold">{line.quantity}</span>
              <button
                type="button"
                onClick={() => updateCartQuantity(line.product.id, line.quantity + 1)}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground active:scale-90"
                aria-label="Tambah"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            {/* Line total + remove */}
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-sm font-bold">{formatCurrency(line.lineTotal)}</p>
              <button
                type="button"
                onClick={() => removeFromCart(line.product.id)}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                aria-label={`Hapus ${line.product.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function PaymentSection({ compact = false }: { compact?: boolean }) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Metode pembayaran</p>
        <div className={cn("grid gap-2", compact ? "grid-cols-3" : "sm:grid-cols-3")}>
          {settings.enabledPayments.map((method) => (
            <Button
              key={method}
              type="button"
              variant={paymentMethod === method ? "default" : "outline"}
              className={cn(
                "h-11 rounded-2xl text-sm",
                paymentMethod === method && "shadow-[0_12px_28px_-14px_rgba(186,92,35,0.7)]"
              )}
              onClick={() => setPaymentMethod(method)}
            >
              {method === "Tunai" ? <BanknoteArrowDown className="size-4" /> : <CreditCard className="size-4" />}
              {paymentLabels[method]}
            </Button>
          ))}
        </div>

        {showCashInput && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Uang diterima</span>
              {cashReceivedNum > 0 && change >= 0 && (
                <span className="font-semibold text-green-600">Kembalian: {formatCurrency(change)}</span>
              )}
              {cashReceivedNum > 0 && change < 0 && (
                <span className="font-semibold text-destructive">Kurang: {formatCurrency(-change)}</span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={cashReceived}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setCashReceived(v ? parseInt(v).toLocaleString("id-ID") : "");
                }}
                placeholder="0"
                className="h-12 rounded-2xl pl-10 text-lg font-semibold"
                autoComplete="off"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Mobile cart bottom sheet (controlled) ─────────────────────────── */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-[28px] px-0 pb-0"
          style={{ maxHeight: "88vh" }}
        >
          <SheetHeader className="border-b border-border/60 px-5 pb-4 pt-2">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-center justify-between">
              <SheetTitle className="font-heading text-xl">Keranjang aktif</SheetTitle>
              <Badge className="rounded-full bg-foreground text-background">{totalQty} item</Badge>
            </div>
            <SheetDescription className="sr-only">
              Daftar item yang akan dipesan beserta total dan metode pembayaran.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col" style={{ maxHeight: "calc(88vh - 80px)" }}>
            {/* Cart items — scrollable */}
            <ScrollArea className="flex-1 px-5 py-4">
              {cartLines.length > 0 ? (
                <CartItemsList />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ReceiptText className="size-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">Keranjang kosong</p>
                </div>
              )}
            </ScrollArea>

            {/* Payment + checkout — fixed at bottom of sheet */}
            <div className="border-t border-border/60 bg-white px-5 py-4 space-y-4">
              <PaymentSection compact />

              {/* Total + CTA */}
              <div className="rounded-[20px] bg-gradient-to-br from-primary to-[#c8681a] px-4 py-4 text-white shadow-[0_12px_32px_-12px_rgba(232,130,26,0.55)]">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Total tagihan</span>
                  <span>{totalQty} item</span>
                </div>
                <p className="mt-1 font-heading text-3xl font-bold">{formatCurrency(cartTotal)}</p>
                <Button
                  type="button"
                  size="lg"
                  className="mt-3 h-12 w-full rounded-2xl bg-white font-bold text-primary hover:bg-white/90 active:scale-[0.98]"
                  onClick={handleCheckoutConfirm}
                >
                  Selesaikan Transaksi
                </Button>
              </div>
              {/* Safe area spacer */}
              <div style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Mobile cart bar (fixed above bottom nav) ──────────────────────── */}
      {cartLines.length > 0 && (
        <button
          type="button"
          onClick={() => setCartSheetOpen(true)}
          className="fixed left-3 right-3 z-40 rounded-2xl bg-primary px-4 py-3 text-white shadow-[0_8px_28px_-8px_rgba(232,130,26,0.65)] transition-transform active:scale-[0.98] lg:hidden"
          style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <ShoppingBasket className="size-5" />
                <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                  {totalQty}
                </span>
              </div>
              <span className="text-sm font-semibold">Lihat keranjang</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-lg font-bold">{formatCurrency(cartTotal)}</span>
              <ChevronUp className="size-4 opacity-70" />
            </div>
          </div>
        </button>
      )}

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">

        {/* Product section */}
        <div
          className={cn(
            "space-y-4",
            // bottom padding on mobile when cart bar is visible
            cartLines.length > 0 && "pb-20 lg:pb-0"
          )}
        >
          {/* Sticky search + category filter (mobile: sticks below top bar) */}
          <div className="sticky top-14 z-30 -mx-4 bg-background/95 px-4 pb-3 pt-2 backdrop-blur-xl lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau jenis menu..."
                className="h-11 rounded-2xl border-border/70 bg-white pl-10 text-sm"
              />
            </div>

            {/* Horizontal scroll categories */}
            <div className="scrollbar-hide mt-2.5 flex gap-2 overflow-x-auto pb-0.5">
              {categoryLabels.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-95",
                    category === item.value
                      ? "bg-primary text-white shadow-[0_6px_18px_-8px_rgba(232,130,26,0.6)]"
                      : "border border-border/60 bg-white text-muted-foreground hover:border-primary/40 hover:text-primary"
                  )}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => {
                    addToCart(product.id);
                    vibrate(30);
                    toast.success(`${product.name} ditambahkan.`, {
                      description: `Stok ${product.stock} pcs tersedia.`,
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-white/60 px-6 text-center">
              <PackageSearch className="size-12 text-muted-foreground/40" />
              <p className="mt-4 font-heading text-lg font-semibold">Produk tidak ditemukan</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Coba kata kunci lain atau pilih kategori yang berbeda.
              </p>
            </div>
          )}
        </div>

        {/* ── Desktop cart panel ─────────────────────────────────────────── */}
        <div className="hidden lg:block">
          <Card className="sticky top-5 border-white/60 bg-white/74 shadow-[0_28px_70px_-48px_rgba(66,38,20,0.6)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-2xl">Keranjang aktif</CardTitle>
                  <CardDescription>Tap produk untuk menambah ke sini.</CardDescription>
                </div>
                <Badge className="rounded-full bg-foreground text-background">{cartLines.length} item</Badge>
              </div>
            </CardHeader>
            <CardContent id="cart-section" className="space-y-5">
              {/* Cart items */}
              <ScrollArea className="h-[280px] rounded-[22px] border border-border/70 bg-white/60 p-3">
                {cartLines.length > 0 ? (
                  <CartItemsList />
                ) : (
                  <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                    <ReceiptText className="size-10 text-muted-foreground/40" />
                    <p className="mt-3 font-heading text-lg font-semibold">Belum ada item</p>
                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                      Tap produk dari kiri untuk mulai transaksi.
                    </p>
                  </div>
                )}
              </ScrollArea>

              <PaymentSection />

              {/* Total + CTA */}
              <div className="rounded-[24px] bg-gradient-to-br from-primary to-[#c8681a] px-4 py-4 text-white shadow-[0_16px_40px_-14px_rgba(232,130,26,0.55)]">
                <div className="flex items-center justify-between text-sm text-white/75">
                  <span>Total tagihan</span>
                  <span>{totalQty} item</span>
                </div>
                <p className="mt-2 font-heading text-4xl font-bold tracking-tight">
                  {formatCurrency(cartTotal)}
                </p>
                <Button
                  type="button"
                  size="lg"
                  className="mt-4 h-12 w-full rounded-2xl bg-white font-bold text-primary hover:bg-white/90 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                  onClick={handleCheckoutConfirm}
                >
                  Selesaikan Transaksi
                </Button>
                <p className="mt-2 text-center text-xs text-white/60">
                  Stok berkurang & transaksi tersimpan otomatis
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Confirm dialog ────────────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-2xl">Konfirmasi Transaksi</DialogTitle>
            <DialogDescription>
              Periksa kembali — stok berkurang dan transaksi tersimpan setelah dikonfirmasi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-6 pt-4">
            <div className="rounded-[20px] border border-border/70 bg-white/75 p-4">
              <p className="text-xs text-muted-foreground">Total tagihan</p>
              <p className="mt-1 font-heading text-3xl font-bold">{formatCurrency(cartTotal)}</p>
              <p className="text-xs text-muted-foreground">{totalQty} item</p>
            </div>
            <div className="rounded-[20px] border border-border/70 bg-white/75 p-4">
              <p className="text-xs text-muted-foreground">Metode pembayaran</p>
              <p className="mt-1 font-heading text-xl font-semibold">{paymentLabels[paymentMethod]}</p>
            </div>
            {paymentMethod === "Tunai" && cashReceivedNum > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[20px] border border-border/70 bg-white/75 p-4">
                  <p className="text-xs text-muted-foreground">Uang diterima</p>
                  <p className="mt-1 font-heading text-lg font-bold text-green-600">{formatCurrency(cashReceivedNum)}</p>
                </div>
                <div className="rounded-[20px] border border-border/70 bg-white/75 p-4">
                  <p className="text-xs text-muted-foreground">Kembalian</p>
                  <p className="mt-1 font-heading text-lg font-bold text-blue-600">{formatCurrency(change)}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="rounded-b-[28px]" showCloseButton>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Periksa Lagi
            </Button>
            <Button type="button" onClick={() => void handleCheckoutNow()}>
              Ya, Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Success dialog ────────────────────────────────────────────────── */}
      <Dialog open={checkoutSuccessOpen} onOpenChange={setCheckoutSuccessOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-heading text-2xl">Transaksi Berhasil!</DialogTitle>
            <DialogDescription>
              Cetak struk atau bagikan ke pelanggan via WhatsApp / aplikasi lain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-6 pt-4">
            <div className="rounded-[20px] border border-border/70 bg-white/75 p-4">
              <p className="text-xs text-muted-foreground">No. transaksi</p>
              <p className="mt-1 font-heading text-lg font-semibold">{lastTransaction?.id.substring(0, 8)}</p>
            </div>
            <div className="rounded-[20px] border border-border/70 bg-white/75 p-4">
              <p className="text-xs text-muted-foreground">Total terbayar</p>
              <p className="mt-1 font-heading text-3xl font-bold">{formatCurrency(lastTransaction?.total ?? 0)}</p>
            </div>
            {lastTransaction?.paymentMethod === "Tunai" && lastCashReceived > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[20px] border border-border/70 bg-white/75 p-4">
                  <p className="text-xs text-muted-foreground">Diterima</p>
                  <p className="mt-1 font-heading text-lg font-bold text-green-600">{formatCurrency(lastCashReceived)}</p>
                </div>
                <div className="rounded-[20px] border border-border/70 bg-white/75 p-4">
                  <p className="text-xs text-muted-foreground">Kembalian</p>
                  <p className="mt-1 font-heading text-lg font-bold text-blue-600">{formatCurrency(lastChange)}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="rounded-b-[28px]" showCloseButton>
            <Button type="button" variant="outline" onClick={printDetailReceipt}>
              <Printer className="size-4" />
              Cetak Struk
            </Button>
            <Button type="button" onClick={() => void handleShareReceipt()}>
              <Share2 className="size-4" />
              Bagikan Struk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
