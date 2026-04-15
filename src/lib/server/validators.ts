import { z } from "zod";

const PRODUCT_CATEGORIES = [
  "Makanan",
  "Frozen Food",
  "Jus Segar",
  "Sembako",
  "Kebutuhan Harian",
] as const;

const PAYMENT_METHODS = ["Tunai", "QRIS", "Transfer"] as const;
const EXPENSE_CATEGORIES = ["Operasional", "Belanja", "Utilitas"] as const;

export const ProductDraftSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi.").max(200),
  category: z.enum(PRODUCT_CATEGORIES),
  buyPrice: z.number().int().min(0, "Harga beli tidak boleh negatif."),
  sellPrice: z.number().int().min(1, "Harga jual harus lebih dari 0."),
  stock: z.number().int().min(0, "Stok tidak boleh negatif."),
  minimumStock: z.number().int().min(0, "Stok minimum tidak boleh negatif."),
  description: z.string().max(1000).default(""),
});

export const TransactionSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1, "Jumlah harus lebih dari 0."),
      })
    )
    .min(1, "Keranjang masih kosong."),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(20).optional(),
  customerAddress: z.string().max(500).optional(),
});

export const DebtDraftSchema = z.object({
  borrowerName: z.string().min(1, "Nama peminjam wajib diisi.").max(200),
  whatsapp: z.string().min(8, "Nomor WhatsApp tidak valid.").max(20),
  amount: z.number().int().min(1, "Nominal hutang harus lebih dari 0."),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi."),
});

export const ExpenseDraftSchema = z.object({
  title: z.string().min(1, "Judul pengeluaran wajib diisi.").max(200),
  amount: z.number().int().min(1, "Nominal harus lebih dari 0."),
  category: z.enum(EXPENSE_CATEGORIES),
});

export const SettingsSchema = z.object({
  storeName: z.string().min(1, "Nama warung wajib diisi.").max(200),
  storeTagline: z.string().max(300).default(""),
  storeAddress: z.string().min(1, "Alamat warung wajib diisi.").max(500),
  ownerName: z.string().min(1, "Nama pemilik wajib diisi.").max(200),
  ownerWhatsapp: z.string().min(10, "Nomor WhatsApp tidak valid.").max(20),
  city: z.string().min(1, "Kota wajib diisi.").max(100),
  businessNotes: z.string().max(1000).default(""),
  stockAlertThreshold: z.number().int().min(1).max(9999),
  enabledPayments: z
    .array(z.enum(PAYMENT_METHODS))
    .min(1, "Pilih minimal satu metode pembayaran."),
});

export const RestockSchema = z.object({
  quantity: z.number().int().min(1, "Jumlah restok harus lebih dari 0."),
});

/** Parse request body with a Zod schema; throws {message, status:400} on failure */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    throw Object.assign(
      new Error(first?.message ?? "Input tidak valid."),
      { status: 400 }
    );
  }
  return result.data;
}
