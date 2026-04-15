"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BanknoteArrowDown,
  CheckCircle2,
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
import { useSession } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { formatCurrency, getInitials } from "@/lib/format";
import { PaymentMethod, Product, ProductCategory, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PrintReceiptButton } from "@/components/printer-connect";

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

const categoryBg: Record<string, string> = {
  Makanan: "bg-orange-50",
  "Jus Segar": "bg-green-50",
  Minuman: "bg-blue-50",
  Sembako: "bg-yellow-50",
  "Kebutuhan Harian": "bg-purple-50",
};

function vibrate(ms = 30) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function getQuickAmounts(total: number): number[] {
  const denominations = [5000, 10000, 20000, 50000, 100000, 200000, 500000];
  return denominations.filter((d) => d >= total).slice(0, 3);
}

function ProductCard({ product, onAdd, isAnimating = false }: { product: Product; onAdd: () => void; isAnimating?: boolean }) {
  const lowStock = product.stock <= product.minimumStock && product.stock > 0;
  const outOfStock = product.stock <= 0;
  const emoji = categoryEmoji[product.category] ?? "🏪";
  const bg = categoryBg[product.category] ?? "bg-gray-50";

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={outOfStock}
      className={cn(
        "group relative flex min-h-[9.5rem] flex-col rounded-2xl bg-white p-3.5 text-left shadow-sm",
        "transition-all duration-150 active:scale-[0.94] active:shadow-none select-none",
        outOfStock
          ? "cursor-not-allowed opacity-50"
          : "hover:shadow-md hover:ring-1 hover:ring-primary/30 active:ring-1 active:ring-primary/50",
        lowStock && "ring-1 ring-amber-200"
      )}
    >
      {/* Emoji circle */}
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl text-2xl mb-2.5",
          outOfStock ? "bg-muted" : bg
        )}
      >
        {emoji}
      </div>

      {/* Name */}
      <p className="text-[13px] font-semibold leading-snug line-clamp-2 text-foreground flex-1 min-h-[2.4rem]">
        {product.name}
      </p>

      {/* Stock badge */}
      {lowStock && (
        <p className="mt-1.5 self-start rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          Sisa {product.stock}
        </p>
      )}
      {outOfStock && (
        <p className="mt-1.5 self-start rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
          Habis
        </p>
      )}

      {/* Price + Add button */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="font-mono text-[15px] font-bold text-primary leading-none">
          {formatCurrency(product.sellPrice)}
        </p>
        {!outOfStock && (
          <div className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_-4px_rgba(232,130,26,0.5)] transition-all duration-150 group-active:scale-90 group-hover:shadow-[0_8px_16px_-4px_rgba(232,130,26,0.45)]",
            isAnimating && "animate-bounce"
          )}>
            <Plus className="size-4" />
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Cart Items List ──────────────────────────────────────────────────────────

type CartLine = { product: { id: string; name: string; sellPrice: number; category: string }; quantity: number; lineTotal: number };

type CartItemsListProps = {
  cartLines: CartLine[];
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
};

function CartItemsList({ cartLines, updateCartQuantity, removeFromCart }: CartItemsListProps) {
  return (
    <div className="space-y-2.5">
      {cartLines.map((line) => (
        <div key={line.product.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-lg", categoryBg[line.product.category] ?? "bg-gray-50")}>
            {categoryEmoji[line.product.category] ?? "🏪"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{line.product.name}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(line.product.sellPrice)}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white px-1 py-0.5 shadow-sm">
            <button type="button" onClick={() => updateCartQuantity(line.product.id, line.quantity - 1)}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90" aria-label="Kurangi">
              <Minus className="size-3" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-bold">{line.quantity}</span>
            <button type="button" onClick={() => updateCartQuantity(line.product.id, line.quantity + 1)}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90" aria-label="Tambah">
              <Plus className="size-3" />
            </button>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className="text-sm font-bold text-foreground">{formatCurrency(line.lineTotal)}</p>
            <button type="button" onClick={() => removeFromCart(line.product.id)}
              className="flex size-5 items-center justify-center rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Hapus ${line.product.name}`}>
              <X className="size-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Payment Section ──────────────────────────────────────────────────────────

type PaymentSectionProps = {
  enabledPayments: PaymentMethod[];
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  showCashInput: boolean;
  cashReceived: string;
  setCashReceived: (value: string) => void;
  cashReceivedNum: number;
  change: number;
  cartTotal: number;
};

function PaymentSection({
  enabledPayments,
  paymentMethod,
  setPaymentMethod,
  showCashInput,
  cashReceived,
  setCashReceived,
  cashReceivedNum,
  change,
  cartTotal,
}: PaymentSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Metode pembayaran
      </p>

      {/* Payment method cards */}
      <div className="grid grid-cols-3 gap-2">
        {enabledPayments.map((method) => {
          const active = paymentMethod === method;
          return (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 px-2 transition-all duration-150 active:scale-95",
                active
                  ? "border-primary bg-primary/8 text-primary"
                  : "border-border bg-white text-muted-foreground hover:border-primary/40"
              )}
            >
              {method === "Tunai" ? (
                <BanknoteArrowDown className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
              ) : (
                <CreditCard className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
              )}
              <span className="text-xs font-semibold">{method}</span>
            </button>
          );
        })}
      </div>

      {/* Cash input */}
      {showCashInput && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Uang diterima</span>
            {cashReceivedNum > 0 && change >= 0 && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                Kembalian {formatCurrency(change)}
              </span>
            )}
            {cashReceivedNum > 0 && change < 0 && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
                Kurang {formatCurrency(-change)}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              Rp
            </span>
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
              className="h-12 rounded-2xl pl-10 text-lg font-bold"
              autoComplete="off"
            />
          </div>
          {/* Quick cash amount buttons */}
          {cartTotal > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {getQuickAmounts(cartTotal).map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCashReceived(amount.toLocaleString("id-ID"))}
                  className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-all active:scale-95 hover:bg-primary/10 hover:text-primary"
                >
                  Rp {(amount / 1000).toFixed(0)}rb
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCashReceived(cartTotal.toLocaleString("id-ID"))}
                className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all active:scale-95 hover:bg-primary/20"
              >
                Pas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KasirSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-11 rounded-2xl bg-white shadow-sm" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 shrink-0 rounded-full bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-white shadow-sm" />
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

  const { data: session } = useSession();
  const userInitials = getInitials(session?.user?.name || session?.user?.email || "KN");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Semua" | ProductCategory>("Semua");
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checkoutSuccessOpen, setCheckoutSuccessOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [lastCashReceived, setLastCashReceived] = useState(0);
  const [lastChange, setLastChange] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const cashReceivedNum = cashReceived ? parseFloat(cashReceived.replace(/[^0-9]/g, "")) || 0 : 0;
  const change = cashReceivedNum - cartTotal;
  const showCashInput = paymentMethod === "Tunai";
  const totalQty = cartLines.reduce((s, l) => s + l.quantity, 0);

  useEffect(() => {
    if (cartLines.length === 0) setCartSheetOpen(false);
  }, [cartLines.length]);

  if (isLoading) return <KasirSkeleton />;

  const filteredProducts = products.filter((p) => {
    const q = query.toLowerCase();
    const matchQuery = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchCat = category === "Semua" || p.category === category;
    return matchQuery && matchCat;
  });

  const productCountByCategory = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

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
    setIsCheckingOut(true);
    try {
      const transaction = await checkout();
      if (!transaction) { toast.error("Keranjang masih kosong."); return; }

      vibrate(80);
      toast.success("Transaksi berhasil!", {
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
    } finally {
      setIsCheckingOut(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Mobile cart bottom sheet ──────────────────────────────────────── */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-[28px] px-0 pb-0"
          style={{ maxHeight: "90vh" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>

          <SheetHeader className="border-b border-border/60 px-5 pb-4 pt-1">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-heading text-xl">Keranjang</SheetTitle>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                  {totalQty} item
                </span>
              </div>
            </div>
            <SheetDescription className="sr-only">
              Daftar item yang akan dipesan beserta total dan metode pembayaran.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col" style={{ maxHeight: "calc(90vh - 90px)" }}>
            {/* Cart items — scrollable */}
            <ScrollArea className="flex-1 px-5 py-4">
              {cartLines.length > 0 ? (
                <CartItemsList cartLines={cartLines} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ShoppingBasket className="size-10 text-muted-foreground/30" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">Keranjang masih kosong</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Tap produk untuk menambahkan</p>
                </div>
              )}
            </ScrollArea>

            {/* Payment + checkout */}
            <div className="space-y-4 border-t border-border/60 bg-white px-5 py-4">
              <PaymentSection
                enabledPayments={settings.enabledPayments}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                showCashInput={showCashInput}
                cashReceived={cashReceived}
                setCashReceived={setCashReceived}
                cashReceivedNum={cashReceivedNum}
                change={change}
                cartTotal={cartTotal}
              />

              {/* Total + CTA */}
              <div className="rounded-2xl bg-primary px-5 py-4 shadow-[0_8px_24px_-8px_rgba(232,130,26,0.5)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70">{totalQty} item · {paymentLabels[paymentMethod]}</p>
                    <p className="mt-0.5 font-mono text-2xl font-bold text-white">
                      {formatCurrency(cartTotal)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 rounded-2xl bg-white font-bold text-primary hover:bg-white/90 active:scale-[0.97] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.2)]"
                    onClick={handleCheckoutConfirm}
                  >
                    Bayar
                  </Button>
                </div>
              </div>

              {/* Safe area */}
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
          className="fixed left-3 right-3 z-40 rounded-2xl bg-primary px-4 py-3 text-white shadow-[0_8px_28px_-6px_rgba(232,130,26,0.6)] transition-transform active:scale-[0.98] lg:hidden"
          style={{ bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBasket className="size-5" />
                <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary leading-none">
                  {totalQty}
                </span>
              </div>
              <span className="text-sm font-semibold">Lihat keranjang</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[17px] font-bold">{formatCurrency(cartTotal)}</span>
              <ChevronUp className="size-4 opacity-70" />
            </div>
          </div>
        </button>
      )}

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">

        {/* ── Product section ───────────────────────────────────────────── */}
        <div className={cn("space-y-3", cartLines.length > 0 && "pb-20 lg:pb-0")}>

          {/* ── Compact kasir top bar ── */}
          <div className="sticky top-0 z-30 -mx-4 bg-background px-3 pb-2 pt-2 lg:static lg:mx-0 lg:bg-transparent lg:p-0">
            {/* Single row: icon + search + cart badge + avatar — mobile only */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Store icon */}
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <span className="text-base leading-none">🍽️</span>
              </div>

              {/* Search — flex-1 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari produk..."
                  className="h-10 rounded-2xl bg-white pl-8 pr-8 text-sm shadow-sm border-border/60"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  >
                    <X className="size-2.5" />
                  </button>
                )}
              </div>

              {/* Cart badge */}
              {cartLines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartSheetOpen(true)}
                  className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-white shrink-0"
                >
                  <ShoppingBasket className="size-3.5" />
                  <span className="text-xs font-bold">{totalQty}</span>
                </button>
              )}

              {/* User avatar */}
              <Link
                href="/pengaturan"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
              >
                {userInitials}
              </Link>
            </div>

            {/* Desktop search */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari menu atau produk..."
                className="h-11 rounded-2xl bg-white pl-10 shadow-sm border-border/60"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-white transition"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div className="scrollbar-hide mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
              {categoryLabels.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 active:scale-95",
                    category === item.value
                      ? "bg-primary text-white shadow-[0_4px_14px_-6px_rgba(232,130,26,0.65)]"
                      : "bg-white text-muted-foreground border border-border/60 hover:border-primary/40 hover:text-primary shadow-sm"
                  )}
                >
                  <span className="text-sm leading-none">{item.emoji}</span>
                  <span>{item.label}</span>
                  {item.value !== "Semua" && (productCountByCategory[item.value] ?? 0) > 0 && (
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      category === item.value
                        ? "bg-white/30 text-white"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {productCountByCategory[item.value]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product count */}
          {query || category !== "Semua" ? (
            <p className="text-xs text-muted-foreground px-0.5">
              {filteredProducts.length} produk ditemukan
            </p>
          ) : null}

          {/* Product grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isAnimating={animatingIds.has(product.id)}
                  onAdd={() => {
                    addToCart(product.id);
                    vibrate(30);
                    setAnimatingIds((prev) => new Set([...prev, product.id]));
                    setTimeout(() => {
                      setAnimatingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(product.id);
                        return next;
                      });
                    }, 400);
                    toast.success(`${product.name} ditambahkan`, {
                      description: formatCurrency(product.sellPrice),
                    });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white px-6 text-center shadow-sm">
              <PackageSearch className="size-12 text-muted-foreground/30" />
              <p className="mt-4 font-heading text-lg font-semibold">Tidak ditemukan</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Coba kata kunci lain atau pilih kategori yang berbeda.
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setCategory("Semua"); }}
                  className="mt-4 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
                >
                  Reset pencarian
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Desktop cart panel ─────────────────────────────────────────── */}
        <div className="hidden lg:block">
          <div className="sticky top-5 rounded-2xl bg-white shadow-sm border border-border/60 overflow-hidden">
            {/* Cart header */}
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <p className="font-heading text-xl font-bold">Keranjang</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tap produk untuk menambahkan</p>
              </div>
              <span className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                totalQty > 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                {totalQty > 0 ? `${totalQty} item` : "Kosong"}
              </span>
            </div>

            {/* Cart items */}
            <ScrollArea className="h-[260px] p-4">
              {cartLines.length > 0 ? (
                <CartItemsList cartLines={cartLines} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} />
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
                    <ReceiptText className="size-7 text-muted-foreground/40" />
                  </div>
                  <p className="mt-3 font-heading text-base font-semibold text-foreground/60">Belum ada item</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pilih produk dari panel kiri
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Payment + total */}
            <div className="border-t border-border/60 space-y-4 p-5">
              <PaymentSection
                enabledPayments={settings.enabledPayments}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                showCashInput={showCashInput}
                cashReceived={cashReceived}
                setCashReceived={setCashReceived}
                cashReceivedNum={cashReceivedNum}
                change={change}
                cartTotal={cartTotal}
              />

              {/* Total block */}
              <div className="rounded-2xl bg-primary px-5 py-4 shadow-[0_8px_24px_-8px_rgba(232,130,26,0.4)]">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Total tagihan</span>
                  <span>{totalQty} item</span>
                </div>
                <p className="mt-1 font-mono text-3xl font-bold text-white tracking-tight">
                  {formatCurrency(cartTotal)}
                </p>
                <Button
                  type="button"
                  size="lg"
                  className="mt-4 h-12 w-full rounded-2xl bg-white font-bold text-primary hover:bg-white/90 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                  onClick={handleCheckoutConfirm}
                  disabled={cartLines.length === 0}
                >
                  Selesaikan Transaksi
                </Button>
                <p className="mt-2 text-center text-xs text-white/55">
                  Stok berkurang & transaksi tersimpan otomatis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm dialog ────────────────────────────────────────────────── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="shrink-0 p-5 pb-0">
            <DialogTitle className="font-heading text-xl">Konfirmasi Transaksi</DialogTitle>
            <DialogDescription>
              Periksa kembali — stok berkurang dan transaksi tersimpan setelah dikonfirmasi.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-3 p-5 pt-4">
            <div className="rounded-2xl bg-primary/8 border border-primary/20 p-4">
              <p className="text-xs text-muted-foreground">Total tagihan</p>
              <p className="mt-1 font-mono text-3xl font-bold text-primary">{formatCurrency(cartTotal)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{totalQty} item</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Metode pembayaran</p>
              <p className="mt-1 font-heading text-xl font-semibold">{paymentLabels[paymentMethod]}</p>
            </div>
            {paymentMethod === "Tunai" && cashReceivedNum > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
                  <p className="text-xs text-muted-foreground">Uang diterima</p>
                  <p className="mt-1 font-mono text-lg font-bold text-green-700">{formatCurrency(cashReceivedNum)}</p>
                </div>
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs text-muted-foreground">Kembalian</p>
                  <p className="mt-1 font-mono text-lg font-bold text-blue-700">{formatCurrency(change)}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 rounded-b-[28px]" showCloseButton>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={isCheckingOut}>
              Periksa Lagi
            </Button>
            <Button type="button" onClick={() => void handleCheckoutNow()} disabled={isCheckingOut}>
              {isCheckingOut ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Memproses...
                </span>
              ) : (
                "Ya, Konfirmasi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Success dialog ────────────────────────────────────────────────── */}
      <Dialog open={checkoutSuccessOpen} onOpenChange={setCheckoutSuccessOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="overflow-y-auto flex-1">
            <div className="p-5 pb-0">
              {/* Success icon */}
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="size-7 text-green-600" />
              </div>
              <p className="text-center font-heading text-xl font-bold">Transaksi Berhasil!</p>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                Struk siap dibagikan atau dicetak
              </p>
            </div>

            <div className="space-y-3 p-5 pt-4">
              {/* Total */}
              <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-center">
                <p className="text-xs text-muted-foreground">{paymentLabels[lastTransaction?.paymentMethod ?? "Tunai"]}</p>
                <p className="mt-1 font-mono text-3xl font-bold text-green-700">
                  {formatCurrency(lastTransaction?.total ?? 0)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No. {lastTransaction?.id.substring(0, 8)}
                </p>
              </div>

              {/* Cash details */}
              {lastTransaction?.paymentMethod === "Tunai" && lastCashReceived > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-muted/40 p-4 text-center">
                    <p className="text-xs text-muted-foreground">Diterima</p>
                    <p className="mt-1 font-mono text-lg font-bold">{formatCurrency(lastCashReceived)}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-center">
                    <p className="text-xs text-muted-foreground">Kembalian</p>
                    <p className="mt-1 font-mono text-lg font-bold text-blue-700">{formatCurrency(lastChange)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 rounded-b-[28px]" showCloseButton>
            {lastTransaction && (
              <PrintReceiptButton
                receipt={{
                  storeName: settings.storeName || "Warung Saya",
                  storeAddress: settings.storeAddress,
                  transactionId: lastTransaction.id.substring(0, 8),
                  date: new Date(lastTransaction.createdAt).toLocaleDateString("id-ID"),
                  time: new Date(lastTransaction.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                  items: lastTransaction.items.map((i) => ({
                    name: i.productName,
                    qty: i.quantity,
                    unitPrice: i.unitPrice,
                  })),
                  total: lastTransaction.total,
                  paymentMethod: lastTransaction.paymentMethod,
                  cashReceived: lastCashReceived > 0 ? lastCashReceived : undefined,
                  change: lastCashReceived > 0 ? lastChange : undefined,
                  footer: `Terima kasih - ${settings.storeName}`,
                }}
              />
            )}
            <Button type="button" variant="outline" onClick={printDetailReceipt}>
              <Printer className="size-4" />
              Browser
            </Button>
            <Button type="button" onClick={() => void handleShareReceipt()}>
              <Share2 className="size-4" />
              Bagikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
