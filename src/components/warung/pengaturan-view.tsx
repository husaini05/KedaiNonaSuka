"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BadgeCheck, Bell, LogOut, MapPin, RotateCcw, Store, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { useAppState } from "@/components/providers/app-state-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { getInitials } from "@/lib/format";
import { PaymentMethod, Settings } from "@/lib/types";
import { cn } from "@/lib/utils";

const paymentMethods: PaymentMethod[] = ["Tunai", "QRIS", "Transfer"];

export function PengaturanView() {
  const router = useRouter();
  const { data: session } = useSession();
  const { settings, lowStockProducts, resetWorkspace, updateSettings, products } = useAppState();
  const [form, setForm] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(settings);

  function updateField<Key extends keyof Settings>(field: Key, value: Settings[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function togglePayment(method: PaymentMethod) {
    const exists = form.enabledPayments.includes(method);
    updateField(
      "enabledPayments",
      exists
        ? form.enabledPayments.filter((item) => item !== method)
        : [...form.enabledPayments, method]
    );
  }

  async function handleSave() {
    try {
      if (
        form.storeName.trim().length === 0 ||
        form.storeAddress.trim().length === 0 ||
        form.ownerName.trim().length === 0 ||
        form.ownerWhatsapp.trim().length < 10 ||
        form.city.trim().length === 0 ||
        form.enabledPayments.length === 0
      ) {
        toast.error("Lengkapi nama warung, alamat, pemilik, WhatsApp, kota, dan pilih minimal satu metode bayar.");
        return;
      }
      setIsSaving(true);
      await updateSettings(form);
      toast.success("Profil warung berhasil diperbarui.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleWorkspaceReset() {
    try {
      setIsResetting(true);
      await resetWorkspace();
      toast.success("Workspace dikosongkan dan dikembalikan ke kondisi awal.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mereset workspace.");
    } finally {
      setIsResetting(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Kamu sudah keluar dari akun.");
      router.refresh();
      router.push("/auth");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal keluar dari akun.");
    }
  }

  const userInitials = getInitials(session?.user?.name || session?.user?.email || "KN");

  return (
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      {/* ── Left column: form ── */}
      <div className="space-y-4">
        {/* Mobile account card (sign-out) — visible on mobile only since sidebar is hidden */}
        {session && (
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm lg:hidden">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{session.user.name || "Pemilik Warung"}</p>
              <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full shrink-0 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="size-3.5" />
              Keluar
            </Button>
          </div>
        )}

        <Card className="border-border/60 bg-white shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="font-heading text-xl">Profil warung & notifikasi</CardTitle>
                <CardDescription className="mt-1">
                  Atur identitas warung yang akan dipakai di dashboard, laporan, dan pengingat operasional.
                </CardDescription>
              </div>
              <div
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium",
                  hasUnsavedChanges
                    ? "bg-primary/12 text-primary"
                    : "bg-green-50 text-green-700"
                )}
              >
                {hasUnsavedChanges ? "Ada perubahan belum disimpan" : "Profil sudah sinkron"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            {/* Identitas warung */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-primary" />
                <p className="font-medium">Identitas warung</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Ubah nama warung, tagline singkat, kota, dan alamat lengkap dari satu tempat.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="store-name">Nama warung</Label>
                  <Input
                    id="store-name"
                    value={form.storeName}
                    onChange={(event) => updateField("storeName", event.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Contoh: Warung Berkah Bu Rani"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="store-tagline">Tagline / fokus jualan</Label>
                  <Input
                    id="store-tagline"
                    value={form.storeTagline}
                    onChange={(event) => updateField("storeTagline", event.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Contoh: Sembako, kopi, dan jajanan harian"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Kota / area</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Contoh: Depok"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="store-address">Alamat warung</Label>
                  <Textarea
                    id="store-address"
                    value={form.storeAddress}
                    onChange={(event) => updateField("storeAddress", event.target.value)}
                    className="min-h-24 rounded-[22px]"
                    placeholder="Contoh: Jl. Mawar No. 8, dekat mushola Al-Ikhlas"
                  />
                </div>
              </div>
            </div>

            {/* Pemilik */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <p className="font-medium">Pemilik & catatan bisnis</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Data ini berguna untuk reminder WhatsApp, laporan internal, dan catatan operasional warung.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="owner-name">Nama pemilik</Label>
                  <Input
                    id="owner-name"
                    value={form.ownerName}
                    onChange={(event) => updateField("ownerName", event.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Contoh: Ibu Rani"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="owner-whatsapp">No. WhatsApp pemilik</Label>
                  <Input
                    id="owner-whatsapp"
                    type="tel"
                    inputMode="tel"
                    value={form.ownerWhatsapp}
                    onChange={(event) => updateField("ownerWhatsapp", event.target.value)}
                    className="h-11 rounded-2xl"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="business-notes">Catatan bisnis</Label>
                  <Textarea
                    id="business-notes"
                    value={form.businessNotes}
                    onChange={(event) => updateField("businessNotes", event.target.value)}
                    className="min-h-28 rounded-[22px]"
                    placeholder="Contoh: Fokus belanja stok tiap Senin pagi, pelanggan ramai setelah magrib."
                  />
                </div>
              </div>
            </div>

            {/* Batas notifikasi stok */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                <p className="font-medium">Batas notifikasi stok menipis</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Produk dengan stok di bawah angka ini akan disorot lebih agresif di kasir dan inventaris.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.stockAlertThreshold}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    updateField("stockAlertThreshold", Number.isFinite(nextValue) ? nextValue : 0);
                  }}
                  className="h-11 rounded-2xl"
                />
                <div className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  Saat ini ada {lowStockProducts.length} produk yang berada di area peringatan.
                </div>
              </div>
            </div>

            {/* Metode bayar */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <div className="flex items-center gap-2">
                <WalletCards className="size-4 text-primary" />
                <p className="font-medium">Metode bayar yang ditampilkan</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {paymentMethods.map((method) => {
                  const active = form.enabledPayments.includes(method);
                  return (
                    <Button
                      key={method}
                      type="button"
                      variant={active ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => togglePayment(method)}
                    >
                      {method}
                    </Button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Daftar ini langsung dipakai untuk opsi pembayaran di kasir utama.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                size="lg"
                className="rounded-2xl"
                onClick={() => void handleSave()}
                disabled={isSaving}
              >
                <BadgeCheck className="size-4" />
                {isSaving ? "Menyimpan..." : "Simpan pengaturan"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setForm(settings)}
                disabled={!hasUnsavedChanges || isSaving}
              >
                Kembalikan draft
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={() => setConfirmResetOpen(true)}
                disabled={isResetting}
              >
                <RotateCcw className="size-4" />
                {isResetting ? "Mereset..." : "Reset workspace"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Right column: preview ── */}
      <div className="space-y-4">
        <Card className="border-border/60 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Preview identitas warung</CardTitle>
            <CardDescription>
              Cek ringkasan yang akan muncul di area operasional dan header laporan setelah disimpan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-foreground px-5 py-5 text-background">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-primary" />
                <p className="text-sm font-medium text-background/75">Warung aktif</p>
              </div>
              <p className="mt-3 font-heading text-3xl font-semibold">{form.storeName || "Nama warung"}</p>
              <p className="mt-2 text-sm text-background/75">
                {form.storeTagline || "Tagline warung akan muncul di sini"}
              </p>
              <div className="mt-4 space-y-2 text-sm text-background/75">
                <p>{form.city || "Kota / area belum diisi"}</p>
                <p>{form.storeAddress || "Alamat warung belum diisi"}</p>
                <p>Pemilik: {form.ownerName || "-"} • {form.ownerWhatsapp || "-"}</p>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Produk aktif</p>
                <p className="mt-2 font-heading text-3xl font-semibold">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Batas stok alert</p>
                <p className="mt-2 font-heading text-3xl font-semibold">
                  {form.stockAlertThreshold || 0} pcs
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Catatan bisnis</p>
              <p className="mt-3 text-sm leading-6 text-foreground/80">
                {form.businessNotes || "Belum ada catatan bisnis. Tambahkan info penting untuk operasional harian."}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Metode pembayaran aktif</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.enabledPayments.map((method) => (
                  <span
                    key={method}
                    className="rounded-full bg-primary/12 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Acuan bisnis</CardTitle>
            <CardDescription>Contoh kasar valuasi stok aktif untuk kebutuhan diskusi internal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
              <p className="text-sm text-muted-foreground">Estimasi modal stok berjalan</p>
              <p className="mt-3 font-heading text-4xl font-semibold">
                {formatCurrency(products.reduce((sum, product) => sum + product.buyPrice * product.stock, 0))}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Angka ini membantu saat mau membandingkan modal persediaan dengan omzet dari laporan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset workspace confirmation */}
      <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="shrink-0 p-5 pb-0">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle className="font-heading text-2xl">Reset workspace?</DialogTitle>
            <DialogDescription className="mt-1 leading-relaxed">
              Semua data produk, transaksi, hutang, dan pengaturan akan dikembalikan ke kondisi awal demo.
              Tindakan ini <strong>tidak bisa dibatalkan</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 p-5 pt-4">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Data yang terhapus: produk, riwayat transaksi, buku hutang, dan pengaturan warung.
            </div>
          </div>
          <DialogFooter className="shrink-0 rounded-b-[28px]" showCloseButton>
            <Button type="button" variant="outline" onClick={() => setConfirmResetOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => { setConfirmResetOpen(false); void handleWorkspaceReset(); }}
            >
              <RotateCcw className="size-4" />
              Ya, Reset Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
