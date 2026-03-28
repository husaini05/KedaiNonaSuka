"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Bell, RotateCcw, Store, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/components/providers/app-state-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { PaymentMethod, Settings } from "@/lib/types";
import { cn } from "@/lib/utils";

const paymentMethods: PaymentMethod[] = ["Tunai", "QRIS", "Transfer"];

export function PengaturanView() {
  const { settings, lowStockProducts, resetWorkspace, updateSettings, products } = useAppState();
  const [form, setForm] = useState<Settings>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function togglePayment(method: PaymentMethod) {
    const exists = form.enabledPayments.includes(method);
    setForm({
      ...form,
      enabledPayments: exists
        ? form.enabledPayments.filter((item) => item !== method)
        : [...form.enabledPayments, method],
    });
  }

  async function handleSave() {
    try {
      if (
        form.storeName.trim().length === 0 ||
        form.ownerName.trim().length === 0 ||
        form.ownerWhatsapp.trim().length < 10 ||
        form.enabledPayments.length === 0
      ) {
        toast.error("Lengkapi profil warung, WhatsApp pemilik, dan pilih minimal satu metode bayar.");
        return;
      }

      await updateSettings(form);
      toast.success("Pengaturan warung berhasil disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengaturan.");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="border-white/60 bg-white/74 shadow-[0_28px_70px_-45px_rgba(66,38,20,0.55)]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Profil warung & notifikasi</CardTitle>
          <CardDescription>
            Simpan data warung yang nanti akan dipakai untuk reminder WhatsApp dan header laporan PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="store-name">Nama warung</Label>
              <Input
                id="store-name"
                value={form.storeName}
                onChange={(event) => setForm({ ...form, storeName: event.target.value })}
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">Kota / area</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="owner-name">Nama pemilik</Label>
              <Input
                id="owner-name"
                value={form.ownerName}
                onChange={(event) => setForm({ ...form, ownerName: event.target.value })}
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner-whatsapp">No. WhatsApp pemilik</Label>
              <Input
                id="owner-whatsapp"
                value={form.ownerWhatsapp}
                onChange={(event) => setForm({ ...form, ownerWhatsapp: event.target.value })}
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <div className="rounded-[26px] border border-border/70 bg-white/85 p-5">
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
                min={1}
                value={form.stockAlertThreshold}
                onChange={(event) =>
                  setForm({ ...form, stockAlertThreshold: Number(event.target.value) })
                }
                className="h-11 rounded-2xl"
              />
              <div className="rounded-[20px] bg-muted/55 px-4 py-3 text-sm text-muted-foreground">
                Saat ini ada {lowStockProducts.length} produk yang berada di area peringatan.
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-border/70 bg-white/85 p-5">
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
                    className={cn("rounded-full", active && "shadow-[0_20px_40px_-24px_rgba(186,92,35,0.75)]")}
                    onClick={() => togglePayment(method)}
                  >
                    {method}
                  </Button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Nanti daftar ini bisa dipakai untuk membatasi opsi pembayaran di kasir utama.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" size="lg" className="rounded-2xl" onClick={() => void handleSave()}>
              <BadgeCheck className="size-4" />
              Simpan pengaturan
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="rounded-2xl"
              onClick={async () => {
                try {
                  await resetWorkspace();
                  toast.success("Workspace dikosongkan dan dikembalikan ke kondisi awal.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Gagal mereset workspace.");
                }
              }}
            >
              <RotateCcw className="size-4" />
              Reset workspace
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-white/60 bg-white/74 shadow-[0_28px_70px_-45px_rgba(66,38,20,0.55)]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Snapshot operasional</CardTitle>
            <CardDescription>
              Ringkasan kecil untuk memastikan pengaturan yang dipilih nyambung ke aktivitas harian warung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] bg-foreground px-5 py-5 text-background">
              <div className="flex items-center gap-2">
                <Store className="size-4 text-primary" />
                <p className="text-sm font-medium text-background/75">Warung aktif</p>
              </div>
              <p className="mt-3 font-heading text-3xl font-semibold">{settings.storeName}</p>
              <p className="mt-2 text-sm text-background/75">
                Pemilik: {settings.ownerName} • {settings.city}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] border border-border/70 bg-white/85 p-4">
                <p className="text-sm text-muted-foreground">Produk aktif</p>
                <p className="mt-2 font-heading text-3xl font-semibold">{products.length}</p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-white/85 p-4">
                <p className="text-sm text-muted-foreground">Batas stok alert</p>
                <p className="mt-2 font-heading text-3xl font-semibold">
                  {settings.stockAlertThreshold} pcs
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-white/85 p-5">
              <p className="text-sm text-muted-foreground">Catatan implementasi berikutnya</p>
              <ul className="mt-4 space-y-3 text-sm text-foreground/80">
                <li>Hubungkan field WhatsApp pemilik ke provider notifikasi stok menipis.</li>
                <li>Gunakan nama warung dan kota untuk header PDF final.</li>
                <li>Sinkronkan metode pembayaran aktif ke tombol checkout POS.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/74 shadow-[0_28px_70px_-45px_rgba(66,38,20,0.55)]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Acuan bisnis</CardTitle>
            <CardDescription>Contoh kasar valuasi stok aktif untuk kebutuhan diskusi internal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[26px] border border-border/70 bg-white/85 p-5">
              <p className="text-sm text-muted-foreground">Estimasi modal stok berjalan</p>
              <p className="mt-3 font-heading text-4xl font-semibold">
                {formatCurrency(
                  products.reduce((sum, product) => sum + product.buyPrice * product.stock, 0)
                )}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Angka ini membantu saat mau membandingkan modal persediaan dengan omzet dari laporan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
