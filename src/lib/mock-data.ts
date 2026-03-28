import { AppState, Debt, Expense, Product, Settings, Transaction } from "@/lib/types";

function daysAgo(days: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const products: Product[] = [
  {
    id: "prd_mi_goreng",
    name: "Mi Instan Goreng",
    category: "Makanan",
    buyPrice: 3000,
    sellPrice: 4000,
    stock: 42,
    minimumStock: 12,
    description: "Favorit pelanggan untuk belanja cepat.",
  },
  {
    id: "prd_air_mineral",
    name: "Air Mineral 600ml",
    category: "Minuman",
    buyPrice: 2500,
    sellPrice: 4000,
    stock: 16,
    minimumStock: 10,
    description: "Minuman dingin untuk transaksi kasir cepat.",
  },
  {
    id: "prd_kopi_sachet",
    name: "Kopi Sachet",
    category: "Minuman",
    buyPrice: 1200,
    sellPrice: 2000,
    stock: 8,
    minimumStock: 10,
    description: "Perlu notifikasi stok menipis lebih awal.",
  },
  {
    id: "prd_roti_bakar",
    name: "Roti Bakar",
    category: "Makanan",
    buyPrice: 6500,
    sellPrice: 10000,
    stock: 14,
    minimumStock: 6,
    description: "Menu sarapan dengan margin baik.",
  },
  {
    id: "prd_teh_botol",
    name: "Teh Botol",
    category: "Minuman",
    buyPrice: 4200,
    sellPrice: 6000,
    stock: 20,
    minimumStock: 8,
    description: "Cocok ditaruh di rak depan kasir.",
  },
  {
    id: "prd_beras_5kg",
    name: "Beras 5kg",
    category: "Sembako",
    buyPrice: 64500,
    sellPrice: 72000,
    stock: 7,
    minimumStock: 5,
    description: "Produk sembako dengan nilai transaksi tinggi.",
  },
  {
    id: "prd_gula_pasir",
    name: "Gula Pasir 1kg",
    category: "Sembako",
    buyPrice: 14500,
    sellPrice: 17000,
    stock: 11,
    minimumStock: 6,
    description: "Sering dibeli bersama kopi dan teh.",
  },
  {
    id: "prd_minyak_goreng",
    name: "Minyak Goreng 1L",
    category: "Sembako",
    buyPrice: 17000,
    sellPrice: 19500,
    stock: 6,
    minimumStock: 6,
    description: "Perlu dipantau karena putaran cepat.",
  },
  {
    id: "prd_sabun_cuci",
    name: "Sabun Cuci",
    category: "Kebutuhan Harian",
    buyPrice: 8500,
    sellPrice: 11000,
    stock: 18,
    minimumStock: 6,
    description: "Produk rumah tangga dengan repeat order stabil.",
  },
  {
    id: "prd_susu_uht",
    name: "Susu UHT",
    category: "Minuman",
    buyPrice: 4500,
    sellPrice: 6500,
    stock: 13,
    minimumStock: 8,
    description: "Sering dibeli untuk anak sekolah.",
  },
];

const transactions: Transaction[] = [
  {
    id: "trx_001",
    paymentMethod: "QRIS",
    total: 24000,
    createdAt: daysAgo(0, 8, 15),
    items: [
      { productId: "prd_mi_goreng", productName: "Mi Instan Goreng", quantity: 2, unitPrice: 4000, costPrice: 3000 },
      { productId: "prd_air_mineral", productName: "Air Mineral 600ml", quantity: 2, unitPrice: 4000, costPrice: 2500 },
      { productId: "prd_kopi_sachet", productName: "Kopi Sachet", quantity: 4, unitPrice: 2000, costPrice: 1200 },
    ],
  },
  {
    id: "trx_002",
    paymentMethod: "Tunai",
    total: 36500,
    createdAt: daysAgo(0, 11, 40),
    items: [
      { productId: "prd_roti_bakar", productName: "Roti Bakar", quantity: 2, unitPrice: 10000, costPrice: 6500 },
      { productId: "prd_teh_botol", productName: "Teh Botol", quantity: 1, unitPrice: 6000, costPrice: 4200 },
      { productId: "prd_susu_uht", productName: "Susu UHT", quantity: 1, unitPrice: 6500, costPrice: 4500 },
      { productId: "prd_kopi_sachet", productName: "Kopi Sachet", quantity: 2, unitPrice: 2000, costPrice: 1200 },
    ],
  },
  {
    id: "trx_003",
    paymentMethod: "Transfer",
    total: 91500,
    createdAt: daysAgo(1, 17, 5),
    items: [
      { productId: "prd_beras_5kg", productName: "Beras 5kg", quantity: 1, unitPrice: 72000, costPrice: 64500 },
      { productId: "prd_gula_pasir", productName: "Gula Pasir 1kg", quantity: 1, unitPrice: 17000, costPrice: 14500 },
      { productId: "prd_kopi_sachet", productName: "Kopi Sachet", quantity: 1, unitPrice: 2000, costPrice: 1200 },
    ],
  },
  {
    id: "trx_004",
    paymentMethod: "Tunai",
    total: 44500,
    createdAt: daysAgo(2, 9, 25),
    items: [
      { productId: "prd_minyak_goreng", productName: "Minyak Goreng 1L", quantity: 1, unitPrice: 19500, costPrice: 17000 },
      { productId: "prd_sabun_cuci", productName: "Sabun Cuci", quantity: 1, unitPrice: 11000, costPrice: 8500 },
      { productId: "prd_air_mineral", productName: "Air Mineral 600ml", quantity: 2, unitPrice: 4000, costPrice: 2500 },
      { productId: "prd_mi_goreng", productName: "Mi Instan Goreng", quantity: 1, unitPrice: 4000, costPrice: 3000 },
      { productId: "prd_kopi_sachet", productName: "Kopi Sachet", quantity: 1, unitPrice: 2000, costPrice: 1200 },
    ],
  },
  {
    id: "trx_005",
    paymentMethod: "QRIS",
    total: 32000,
    createdAt: daysAgo(5, 13, 10),
    items: [
      { productId: "prd_roti_bakar", productName: "Roti Bakar", quantity: 1, unitPrice: 10000, costPrice: 6500 },
      { productId: "prd_teh_botol", productName: "Teh Botol", quantity: 2, unitPrice: 6000, costPrice: 4200 },
      { productId: "prd_susu_uht", productName: "Susu UHT", quantity: 2, unitPrice: 6500, costPrice: 4500 },
    ],
  },
  {
    id: "trx_006",
    paymentMethod: "Tunai",
    total: 48000,
    createdAt: daysAgo(9, 10, 30),
    items: [
      { productId: "prd_mi_goreng", productName: "Mi Instan Goreng", quantity: 3, unitPrice: 4000, costPrice: 3000 },
      { productId: "prd_sabun_cuci", productName: "Sabun Cuci", quantity: 2, unitPrice: 11000, costPrice: 8500 },
      { productId: "prd_air_mineral", productName: "Air Mineral 600ml", quantity: 2, unitPrice: 4000, costPrice: 2500 },
      { productId: "prd_kopi_sachet", productName: "Kopi Sachet", quantity: 3, unitPrice: 2000, costPrice: 1200 },
    ],
  },
];

const debts: Debt[] = [
  {
    id: "debt_001",
    borrowerName: "Pak Darto",
    whatsapp: "081234567890",
    amount: 85000,
    createdAt: daysAgo(4, 9),
    dueDate: daysAgo(-1, 18),
    isPaid: false,
    lastReminderAt: daysAgo(1, 10, 30),
  },
  {
    id: "debt_002",
    borrowerName: "Bu Rini",
    whatsapp: "081298765432",
    amount: 42000,
    createdAt: daysAgo(2, 15, 10),
    dueDate: daysAgo(3, 18),
    isPaid: false,
  },
  {
    id: "debt_003",
    borrowerName: "Mas Ari",
    whatsapp: "081355599988",
    amount: 150000,
    createdAt: daysAgo(11, 8),
    dueDate: daysAgo(4, 18),
    isPaid: true,
    lastReminderAt: daysAgo(6, 8, 40),
  },
  {
    id: "debt_004",
    borrowerName: "Toko Sari",
    whatsapp: "081377744411",
    amount: 230000,
    createdAt: daysAgo(1, 12, 20),
    dueDate: daysAgo(-5, 16),
    isPaid: false,
  },
];

const expenses: Expense[] = [
  { id: "exp_001", title: "Belanja gas LPG", amount: 22000, createdAt: daysAgo(0, 7, 10), category: "Operasional" },
  { id: "exp_002", title: "Belanja kulkas minuman", amount: 45000, createdAt: daysAgo(1, 9, 40), category: "Utilitas" },
  { id: "exp_003", title: "Top up stok kopi", amount: 68000, createdAt: daysAgo(2, 14, 10), category: "Belanja" },
  { id: "exp_004", title: "Bayar listrik kios", amount: 125000, createdAt: daysAgo(6, 11, 0), category: "Utilitas" },
  { id: "exp_005", title: "Belanja roti dan susu", amount: 91000, createdAt: daysAgo(10, 8, 15), category: "Belanja" },
];

const settings: Settings = {
  storeName: "Warung Berkah Ibu Sari",
  ownerName: "Ibu Sari",
  ownerWhatsapp: "081277788899",
  city: "Jakarta Selatan",
  stockAlertThreshold: 8,
  enabledPayments: ["Tunai", "QRIS", "Transfer"],
};

export const seedState: AppState = {
  products,
  cart: [],
  transactions,
  debts,
  expenses,
  paymentMethod: "Tunai",
  settings,
};
