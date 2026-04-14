"use client";

import { useState } from "react";
import { AlertTriangle, Boxes, PackagePlus, PencilLine, Search, TrendingUp, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { useAppState } from "@/components/providers/app-state-provider";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/lib/format";
import { Product, ProductCategory, ProductDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

const emptyDraft: ProductDraft = {
  name: "",
  category: "Makanan",
  buyPrice: 0,
  sellPrice: 0,
  stock: 0,
  minimumStock: 0,
  description: "",
};

function ProductForm({
  draft,
  onChange,
}: {
  draft: ProductDraft;
  onChange: (draft: ProductDraft) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="product-name">Nama barang</Label>
        <Input
          id="product-name"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="Contoh: Mi Instan Goreng"
          className="h-11 rounded-2xl"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Kategori</Label>
          <Select
            value={draft.category}
            onValueChange={(value) => onChange({ ...draft, category: value as ProductCategory })}
          >
            <SelectTrigger className="h-11 w-full rounded-2xl bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Makanan">Makanan</SelectItem>
              <SelectItem value="Minuman">Minuman</SelectItem>
              <SelectItem value="Sembako">Sembako</SelectItem>
              <SelectItem value="Kebutuhan Harian">Kebutuhan Harian</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-stock">Stok awal</Label>
          <Input
            id="product-stock"
            type="number"
            inputMode="numeric"
            min={0}
            value={draft.stock}
            onChange={(event) => onChange({ ...draft, stock: Number(event.target.value) })}
            className="h-11 rounded-2xl"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="product-buy-price">Harga beli</Label>
          <Input
            id="product-buy-price"
            type="number"
            inputMode="decimal"
            min={0}
            value={draft.buyPrice}
            onChange={(event) => onChange({ ...draft, buyPrice: Number(event.target.value) })}
            className="h-11 rounded-2xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-sell-price">Harga jual</Label>
          <Input
            id="product-sell-price"
            type="number"
            inputMode="decimal"
            min={0}
            value={draft.sellPrice}
            onChange={(event) => onChange({ ...draft, sellPrice: Number(event.target.value) })}
            className="h-11 rounded-2xl"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="product-minimum-stock">Stok minimum</Label>
        <Input
          id="product-minimum-stock"
          type="number"
          inputMode="numeric"
          min={0}
          value={draft.minimumStock}
          onChange={(event) => onChange({ ...draft, minimumStock: Number(event.target.value) })}
          className="h-11 rounded-2xl"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="product-description">Catatan singkat</Label>
        <Input
          id="product-description"
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          placeholder="Penempatan rak, paket laris, atau info kasir"
          className="h-11 rounded-2xl"
        />
      </div>
    </div>
  );
}

export function InventarisView() {
  const { isLoading, products, addProduct, updateProduct, restockProduct, lowStockProducts } = useAppState();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editDraft, setEditDraft] = useState<ProductDraft>(emptyDraft);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState(12);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
        <div className="h-10 w-64 rounded-2xl bg-white" />
        <div className="h-64 rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  const filteredProducts = products.filter((product) => {
    const keyword = query.toLowerCase();
    return (
      product.name.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword) ||
      product.description.toLowerCase().includes(keyword)
    );
  });

  const totalInventoryValue = products.reduce(
    (sum, product) => sum + product.buyPrice * product.stock,
    0
  );

  function validateProduct(nextDraft: ProductDraft) {
    return (
      nextDraft.name.trim().length > 0 &&
      nextDraft.sellPrice > 0 &&
      nextDraft.buyPrice >= 0 &&
      nextDraft.stock >= 0 &&
      nextDraft.minimumStock >= 0
    );
  }

  async function handleCreateProduct() {
    try {
      if (!validateProduct(draft)) {
        toast.error("Lengkapi data produk lebih dulu.");
        return;
      }
      await addProduct(draft);
      setDraft(emptyDraft);
      setCreateOpen(false);
      toast.success("Produk baru berhasil ditambahkan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menambah produk.");
    }
  }

  async function handleUpdateProduct() {
    try {
      if (!editingProduct || !validateProduct(editDraft)) {
        toast.error("Periksa kembali data yang ingin diperbarui.");
        return;
      }
      await updateProduct(editingProduct.id, editDraft);
      setEditingProduct(null);
      toast.success(`${editDraft.name} berhasil diperbarui.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui produk.");
    }
  }

  async function handleRestock() {
    try {
      if (!restockTarget || restockAmount <= 0) {
        toast.error("Masukkan jumlah restok yang valid.");
        return;
      }
      await restockProduct(restockTarget.id, restockAmount);
      toast.success(`${restockTarget.name} ditambah ${restockAmount} stok.`);
      setRestockTarget(null);
      setRestockAmount(12);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menambah stok.");
    }
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditDraft({
      name: product.name,
      category: product.category,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minimumStock: product.minimumStock,
      description: product.description,
    });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total SKU"
          value={`${products.length} produk`}
          description="Produk aktif di warung."
          icon={Boxes}
        />
        <StatCard
          title="Stok menipis"
          value={`${lowStockProducts.length} item`}
          description="Perlu segera direstok."
          tone="warn"
          icon={AlertTriangle}
        />
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Nilai stok"
            value={formatCurrency(totalInventoryValue)}
            description="Estimasi modal di inventaris."
            tone="accent"
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* Search + Add button */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau kategori..."
            className="h-11 rounded-2xl pl-9"
          />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="lg" className="h-11 rounded-2xl shrink-0" />}>
            <PackagePlus className="size-4" />
            <span className="hidden sm:inline">Tambah barang</span>
            <span className="sm:hidden">Tambah</span>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl rounded-[28px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
            <DialogHeader className="shrink-0 p-5 pb-0">
              <DialogTitle className="font-heading text-xl">Tambah produk baru</DialogTitle>
              <DialogDescription>
                Isi data minimum supaya kasir bisa langsung menjual barang ini.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 p-5 pt-4">
              <ProductForm draft={draft} onChange={setDraft} />
            </div>
            <DialogFooter className="shrink-0 rounded-b-[28px]" showCloseButton>
              <Button type="button" onClick={() => void handleCreateProduct()}>
                Simpan produk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Mobile card list ── */}
      <div className="space-y-3 lg:hidden">
        {filteredProducts.length === 0 && (
          <EmptyState
            emoji={products.length === 0 ? "📦" : "🔍"}
            title={products.length === 0 ? "Belum ada produk" : "Tidak ditemukan"}
            description={
              products.length === 0
                ? "Tap 'Tambah barang' untuk menambahkan produk pertama ke inventaris."
                : "Coba kata kunci lain atau hapus filter pencarian."
            }
          />
        )}
        {filteredProducts.map((product) => {
          const lowStock = product.stock <= product.minimumStock;
          return (
            <div
              key={product.id}
              className={cn(
                "rounded-2xl bg-white p-4 shadow-sm",
                lowStock && "ring-1 ring-primary/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                  {product.description ? (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{product.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {lowStock && <AlertTriangle className="size-3.5 text-primary" />}
                  <Badge
                    className={cn(
                      "rounded-full border-0",
                      lowStock ? "bg-primary text-primary-foreground" : "bg-green-100 text-green-700"
                    )}
                  >
                    {product.stock} pcs
                  </Badge>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/50 p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Harga jual</p>
                  <p className="text-sm font-semibold mt-0.5">{formatCurrency(product.sellPrice)}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Harga beli</p>
                  <p className="text-sm font-semibold mt-0.5">{formatCurrency(product.buyPrice)}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full flex-1 h-9"
                  onClick={() => openEdit(product)}
                >
                  <PencilLine className="size-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full flex-1 h-9"
                  onClick={() => setRestockTarget(product)}
                >
                  <Warehouse className="size-3.5" />
                  Restok
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop table ── */}
      <Card className="hidden lg:block border-border/60 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Inventaris barang jadi</CardTitle>
          <CardDescription>
            Semua perubahan di layar ini langsung mengubah state yang dipakai POS dan laporan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga beli</TableHead>
                  <TableHead>Harga jual</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const lowStock = product.stock <= product.minimumStock;
                  return (
                    <TableRow key={product.id} className={cn(lowStock && "bg-primary/6")}>
                      <TableCell className="min-w-[220px]">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{formatCurrency(product.buyPrice)}</TableCell>
                      <TableCell>{formatCurrency(product.sellPrice)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "rounded-full border-0",
                              lowStock ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                            )}
                          >
                            {product.stock} pcs
                          </Badge>
                          {lowStock ? <AlertTriangle className="size-4 text-primary" /> : null}
                        </div>
                      </TableCell>
                      <TableCell>{product.minimumStock} pcs</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => openEdit(product)}
                          >
                            <PencilLine className="size-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-full"
                            onClick={() => setRestockTarget(product)}
                          >
                            <Warehouse className="size-4" />
                            Restok
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Tidak ada produk yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl rounded-[28px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="shrink-0 p-5 pb-0">
            <DialogTitle className="font-heading text-xl">Edit produk</DialogTitle>
            <DialogDescription>Perbarui stok, harga, atau posisi minimum sebelum notifikasi muncul.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 p-5 pt-4">
            <ProductForm draft={editDraft} onChange={setEditDraft} />
          </div>
          <DialogFooter className="shrink-0 rounded-b-[28px]" showCloseButton>
            <Button type="button" onClick={() => void handleUpdateProduct()}>
              Simpan perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock dialog */}
      <Dialog open={Boolean(restockTarget)} onOpenChange={(open) => !open && setRestockTarget(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-[28px] p-0 flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="shrink-0 p-5 pb-0">
            <DialogTitle className="font-heading text-xl">Restok barang</DialogTitle>
            <DialogDescription>
              Tambahkan stok untuk {restockTarget?.name ?? "produk terpilih"}.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-4 p-5 pt-4">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Stok sekarang</p>
              <p className="mt-2 font-heading text-3xl font-semibold">
                {restockTarget?.stock ?? 0} pcs
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="restock-amount">Jumlah tambahan stok</Label>
              <Input
                id="restock-amount"
                type="number"
                inputMode="numeric"
                min={1}
                value={restockAmount}
                onChange={(event) => setRestockAmount(Number(event.target.value))}
                className="h-11 rounded-2xl"
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 rounded-b-[28px]" showCloseButton>
            <Button type="button" onClick={() => void handleRestock()}>
              Simpan restok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
