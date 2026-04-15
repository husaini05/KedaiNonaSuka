import { headers } from "next/headers";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, pool } from "@/db/client";
import {
  debts,
  expenses,
  products,
  storeProfiles,
  transactionItems,
  transactions,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { AppState, DebtDraft, ExpenseDraft, PaymentMethod, ProductDraft, Settings, Transaction } from "@/lib/types";

// ── Environment validation ──────────────────────────────────────────────────
// Warn loudly at startup when required env vars are missing so the problem
// is obvious before a real request hits a broken code path.
if (process.env.NODE_ENV === "production") {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.BETTER_AUTH_SECRET) missing.push("BETTER_AUTH_SECRET");
  if (missing.length > 0) {
    throw new Error(
      `[warungos] Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in your hosting provider or .env.production file."
    );
  }
}

let initializationPromise: Promise<void> | null = null;
const supportedPaymentMethods: PaymentMethod[] = ["Tunai", "QRIS", "Transfer"];

type SessionHint = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
} | null;

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function parseDueDate(value: string) {
  if (value.includes("T")) {
    return new Date(value).toISOString();
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_profiles (
      user_id text PRIMARY KEY,
      store_name text NOT NULL,
      store_tagline text NOT NULL,
      store_address text NOT NULL,
      owner_name text NOT NULL,
      owner_whatsapp text NOT NULL,
      city text NOT NULL,
      business_notes text NOT NULL,
      stock_alert_threshold integer NOT NULL,
      enabled_payments jsonb NOT NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      name text NOT NULL,
      category text NOT NULL,
      buy_price integer NOT NULL,
      sell_price integer NOT NULL,
      stock integer NOT NULL,
      minimum_stock integer NOT NULL,
      description text NOT NULL,
      created_at timestamptz NOT NULL,
      updated_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      total integer NOT NULL,
      payment_method text NOT NULL,
      created_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id text PRIMARY KEY,
      transaction_id text NOT NULL,
      product_id text NOT NULL,
      product_name text NOT NULL,
      quantity integer NOT NULL,
      unit_price integer NOT NULL,
      cost_price integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS debts (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      borrower_name text NOT NULL,
      whatsapp text NOT NULL,
      amount integer NOT NULL,
      created_at timestamptz NOT NULL,
      due_date timestamptz NOT NULL,
      is_paid integer NOT NULL,
      last_reminder_at timestamptz
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      title text NOT NULL,
      amount integer NOT NULL,
      created_at timestamptz NOT NULL,
      category text NOT NULL
    );

    ALTER TABLE store_profiles
      ADD COLUMN IF NOT EXISTS store_tagline text NOT NULL DEFAULT '';

    ALTER TABLE store_profiles
      ADD COLUMN IF NOT EXISTS store_address text NOT NULL DEFAULT '';

    ALTER TABLE store_profiles
      ADD COLUMN IF NOT EXISTS business_notes text NOT NULL DEFAULT '';

    ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS customer_name text;

    ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS customer_phone text;

    ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS customer_address text;

    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS barcode text;

    -- Soft-delete columns (NULL = active, timestamp = deleted)
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

    ALTER TABLE expenses
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

    -- Performance indexes: filter-by-user queries hit these on every bootstrap
    CREATE INDEX IF NOT EXISTS idx_products_user_id
      ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id
      ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_created
      ON transactions(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_transaction_items_txn_id
      ON transaction_items(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_debts_user_id
      ON debts(user_id);
    CREATE INDEX IF NOT EXISTS idx_debts_user_paid
      ON debts(user_id, is_paid);
    CREATE INDEX IF NOT EXISTS idx_expenses_user_id
      ON expenses(user_id);

    -- FK constraints and stock CHECK (idempotent via DO blocks)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_txn_items_transaction'
      ) THEN
        ALTER TABLE transaction_items
          ADD CONSTRAINT fk_txn_items_transaction
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_stock_nonneg'
      ) THEN
        ALTER TABLE products
          ADD CONSTRAINT chk_products_stock_nonneg CHECK (stock >= 0);
      END IF;
    END $$;

    -- Rename category: Minuman → Frozen Food (idempotent)
    UPDATE products SET category = 'Frozen Food' WHERE category = 'Minuman';
  `);
}

async function ensureWorkspace(userId: string, session?: SessionHint) {
  const existing = await db
    .select({ userId: storeProfiles.userId })
    .from(storeProfiles)
    .where(eq(storeProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  const timestamp = nowIso();
  await db.insert(storeProfiles).values({
    userId,
    storeName: session?.user?.name ? `Warung ${session.user.name}` : "Warung Baru",
    storeTagline: "Warung harian untuk warga sekitar",
    storeAddress: "Alamat belum diisi",
    ownerName: session?.user?.name ?? "Pemilik Warung",
    ownerWhatsapp: "-",
    city: "Indonesia",
    businessNotes: "",
    stockAlertThreshold: 8,
    enabledPayments: ["Tunai", "QRIS", "Transfer"],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function ensureAppReady() {
  if (!initializationPromise) {
    initializationPromise = ensureTables();
  }

  await initializationPromise;
}

export async function getRequestUser() {
  await ensureAppReady();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  await ensureWorkspace(session.user.id, session);
  return { userId: session.user.id, session };
}

function mapSettings(profile: typeof storeProfiles.$inferSelect): Settings {
  return {
    storeName: profile.storeName,
    storeTagline: profile.storeTagline,
    storeAddress: profile.storeAddress,
    ownerName: profile.ownerName,
    ownerWhatsapp: profile.ownerWhatsapp,
    city: profile.city,
    businessNotes: profile.businessNotes,
    stockAlertThreshold: profile.stockAlertThreshold,
    enabledPayments: profile.enabledPayments,
  };
}

function normalizeSettings(settings: Settings): Settings {
  const enabledPayments = Array.from(
    new Set(
      settings.enabledPayments.filter((method): method is PaymentMethod =>
        supportedPaymentMethods.includes(method)
      )
    )
  );

  return {
    storeName: settings.storeName.trim(),
    storeTagline: settings.storeTagline.trim(),
    storeAddress: settings.storeAddress.trim(),
    ownerName: settings.ownerName.trim(),
    ownerWhatsapp: settings.ownerWhatsapp.trim(),
    city: settings.city.trim(),
    businessNotes: settings.businessNotes.trim(),
    stockAlertThreshold: Math.max(1, Math.round(settings.stockAlertThreshold || 0)),
    enabledPayments,
  };
}

export async function getBootstrapState(userId: string): Promise<AppState> {
  await ensureAppReady();

  // Run all independent queries in parallel — cuts bootstrap latency by ~5×
  const [profile, productRows, transactionRows, debtRows, expenseRows] =
    await Promise.all([
      db
        .select()
        .from(storeProfiles)
        .where(eq(storeProfiles.userId, userId))
        .limit(1)
        .then((rows) => rows[0] ?? null),
      db
        .select()
        .from(products)
        .where(and(eq(products.userId, userId), isNull(products.deletedAt)))
        .orderBy(desc(products.createdAt)),
      db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt)),
      db
        .select()
        .from(debts)
        .where(eq(debts.userId, userId))
        .orderBy(desc(debts.createdAt)),
      db
        .select()
        .from(expenses)
        .where(and(eq(expenses.userId, userId), isNull(expenses.deletedAt)))
        .orderBy(desc(expenses.createdAt)),
    ]);

  if (!profile) {
    throw new Error("Profil warung tidak ditemukan.");
  }

  const transactionIds = transactionRows.map((transaction) => transaction.id);
  const itemRows =
    transactionIds.length > 0
      ? await db
          .select()
          .from(transactionItems)
          .where(inArray(transactionItems.transactionId, transactionIds))
      : [];

  const itemsByTransaction = new Map<string, Transaction["items"]>();
  for (const item of itemRows) {
    const existing = itemsByTransaction.get(item.transactionId) ?? [];
    existing.push({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
    });
    itemsByTransaction.set(item.transactionId, existing);
  }

  return {
    products: productRows.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category as AppState["products"][number]["category"],
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minimumStock: product.minimumStock,
      description: product.description,
    })),
    cart: [],
    paymentMethod: (profile.enabledPayments[0] ?? "Tunai") as PaymentMethod,
    transactions: transactionRows.map((transaction) => ({
      id: transaction.id,
      paymentMethod: transaction.paymentMethod as PaymentMethod,
      total: transaction.total,
      createdAt: transaction.createdAt,
      items: itemsByTransaction.get(transaction.id) ?? [],
      customerName: transaction.customerName ?? undefined,
      customerPhone: transaction.customerPhone ?? undefined,
      customerAddress: transaction.customerAddress ?? undefined,
    })),
    debts: debtRows.map((debt) => ({
      id: debt.id,
      borrowerName: debt.borrowerName,
      whatsapp: debt.whatsapp,
      amount: debt.amount,
      createdAt: debt.createdAt,
      dueDate: debt.dueDate,
      isPaid: debt.isPaid === 1,
      lastReminderAt: debt.lastReminderAt ?? undefined,
    })),
    expenses: expenseRows.map((expense) => ({
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      createdAt: expense.createdAt,
      category: expense.category as AppState["expenses"][number]["category"],
    })),
    settings: mapSettings(profile),
  };
}

export async function createProduct(userId: string, draft: ProductDraft) {
  const timestamp = nowIso();
  const [product] = await db
    .insert(products)
    .values({
      id: createId("prd"),
      userId,
      name: draft.name,
      category: draft.category,
      buyPrice: draft.buyPrice,
      sellPrice: draft.sellPrice,
      stock: draft.stock,
      minimumStock: draft.minimumStock,
      description: draft.description,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning();

  return {
    id: product.id,
    name: product.name,
    category: product.category as AppState["products"][number]["category"],
    buyPrice: product.buyPrice,
    sellPrice: product.sellPrice,
    stock: product.stock,
    minimumStock: product.minimumStock,
    description: product.description,
  };
}

export async function updateProduct(userId: string, productId: string, draft: ProductDraft) {
  // Guard: stock must never go negative via a manual edit
  if (draft.stock < 0) {
    throw new Error("Stok tidak boleh negatif.");
  }

  const [updated] = await db
    .update(products)
    .set({
      name: draft.name,
      category: draft.category,
      buyPrice: draft.buyPrice,
      sellPrice: draft.sellPrice,
      stock: draft.stock,
      minimumStock: draft.minimumStock,
      description: draft.description,
      updatedAt: nowIso(),
    })
    .where(
      and(
        eq(products.id, productId),
        eq(products.userId, userId),
        isNull(products.deletedAt)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Data tidak ditemukan.");
  }

  return {
    id: updated.id,
    name: updated.name,
    category: updated.category as AppState["products"][number]["category"],
    buyPrice: updated.buyPrice,
    sellPrice: updated.sellPrice,
    stock: updated.stock,
    minimumStock: updated.minimumStock,
    description: updated.description,
  };
}

export async function restockProduct(userId: string, productId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Jumlah restok harus berupa angka bulat lebih dari 0.");
  }

  // Atomic increment: no read-modify-write race condition
  const [updated] = await db
    .update(products)
    .set({
      stock: sql`${products.stock} + ${quantity}`,
      updatedAt: nowIso(),
    })
    .where(
      and(
        eq(products.id, productId),
        eq(products.userId, userId),
        isNull(products.deletedAt)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Data tidak ditemukan.");
  }

  return {
    id: updated.id,
    name: updated.name,
    category: updated.category as AppState["products"][number]["category"],
    buyPrice: updated.buyPrice,
    sellPrice: updated.sellPrice,
    stock: updated.stock,
    minimumStock: updated.minimumStock,
    description: updated.description,
  };
}

export async function createTransaction(
  userId: string,
  payload: {
    paymentMethod: PaymentMethod;
    items: Array<{ productId: string; quantity: number }>;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
  }
) {
  if (payload.items.length === 0) {
    throw new Error("Keranjang masih kosong.");
  }

  const transactionId = createId("trx");
  const createdAt = nowIso();
  const productIds = payload.items.map((item) => item.productId);

  await db.transaction(async (tx) => {
    // ── Lock product rows FOR UPDATE inside the transaction ──────────────
    // This prevents two concurrent checkouts from both passing the stock
    // check before either one has committed its deduction (oversell race).
    const lockedProducts = await tx
      .select()
      .from(products)
      .where(
        and(
          eq(products.userId, userId),
          inArray(products.id, productIds),
          isNull(products.deletedAt)
        )
      )
      .for("update");

    const productMap = new Map(lockedProducts.map((p) => [p.id, p]));
    const lineItems = payload.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error("Salah satu produk tidak valid.");
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stok ${product.name} tidak cukup.`);
      }

      return { product, quantity: item.quantity };
    });

    const total = lineItems.reduce(
      (sum, item) => sum + item.product.sellPrice * item.quantity,
      0
    );

    await tx.insert(transactions).values({
      id: transactionId,
      userId,
      total,
      paymentMethod: payload.paymentMethod,
      customerName: payload.customerName || null,
      customerPhone: payload.customerPhone || null,
      customerAddress: payload.customerAddress || null,
      createdAt,
    });

    await tx.insert(transactionItems).values(
      lineItems.map((item) => ({
        id: createId("itm"),
        transactionId,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellPrice,
        costPrice: item.product.buyPrice,
      }))
    );

    // Atomic decrement using SQL expression — avoids stale-read overwrite
    for (const item of lineItems) {
      await tx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          updatedAt: createdAt,
        })
        .where(
          and(
            eq(products.id, item.product.id),
            eq(products.userId, userId),
            sql`${products.stock} >= ${item.quantity}`
          )
        );
    }
  });

  const nextState = await getBootstrapState(userId);
  const transaction = nextState.transactions.find((item) => item.id === transactionId);

  if (!transaction) {
    throw new Error("Transaksi gagal dibuat.");
  }

  return {
    transaction,
    products: nextState.products,
  };
}

export async function createDebt(userId: string, draft: DebtDraft) {
  const [debt] = await db
    .insert(debts)
    .values({
      id: createId("debt"),
      userId,
      borrowerName: draft.borrowerName,
      whatsapp: draft.whatsapp,
      amount: draft.amount,
      createdAt: nowIso(),
      dueDate: parseDueDate(draft.dueDate),
      isPaid: 0,
      lastReminderAt: null,
    })
    .returning();

  return {
    id: debt.id,
    borrowerName: debt.borrowerName,
    whatsapp: debt.whatsapp,
    amount: debt.amount,
    createdAt: debt.createdAt,
    dueDate: debt.dueDate,
    isPaid: false,
    lastReminderAt: undefined,
  };
}

export async function markDebtPaid(userId: string, debtId: string) {
  const [updated] = await db
    .update(debts)
    .set({
      isPaid: 1,
    })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Data tidak ditemukan.");
  }

  return {
    id: updated.id,
    borrowerName: updated.borrowerName,
    whatsapp: updated.whatsapp,
    amount: updated.amount,
    createdAt: updated.createdAt,
    dueDate: updated.dueDate,
    isPaid: true,
    lastReminderAt: updated.lastReminderAt ?? undefined,
  };
}

export async function remindDebt(userId: string, debtId: string) {
  const [updated] = await db
    .update(debts)
    .set({
      lastReminderAt: nowIso(),
    })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Data tidak ditemukan.");
  }

  return {
    id: updated.id,
    borrowerName: updated.borrowerName,
    whatsapp: updated.whatsapp,
    amount: updated.amount,
    createdAt: updated.createdAt,
    dueDate: updated.dueDate,
    isPaid: updated.isPaid === 1,
    lastReminderAt: updated.lastReminderAt ?? undefined,
  };
}

export async function deleteProduct(userId: string, productId: string) {
  // Soft-delete: mark deleted_at instead of removing the row so that
  // historical transaction_items retain their product reference.
  const [soft] = await db
    .update(products)
    .set({ deletedAt: nowIso() })
    .where(
      and(
        eq(products.id, productId),
        eq(products.userId, userId),
        isNull(products.deletedAt)
      )
    )
    .returning({ id: products.id });

  if (!soft) throw new Error("Data tidak ditemukan.");
  return soft.id;
}

export async function createExpense(userId: string, draft: ExpenseDraft) {
  if (!draft.title?.trim()) {
    throw new Error("Judul pengeluaran tidak boleh kosong.");
  }
  if (!draft.amount || draft.amount <= 0) {
    throw new Error("Nominal pengeluaran harus lebih dari 0.");
  }

  const [expense] = await db
    .insert(expenses)
    .values({
      id: createId("exp"),
      userId,
      title: draft.title.trim(),
      amount: Math.round(draft.amount),
      createdAt: nowIso(),
      category: draft.category,
    })
    .returning();

  return {
    id: expense.id,
    title: expense.title,
    amount: expense.amount,
    createdAt: expense.createdAt,
    category: expense.category as AppState["expenses"][number]["category"],
  };
}

export async function deleteExpense(userId: string, expenseId: string) {
  // Soft-delete: preserve for historical reporting
  const [soft] = await db
    .update(expenses)
    .set({ deletedAt: nowIso() })
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.userId, userId),
        isNull(expenses.deletedAt)
      )
    )
    .returning({ id: expenses.id });

  if (!soft) throw new Error("Data tidak ditemukan.");
  return soft.id;
}

export async function updateStoreSettings(userId: string, settings: Settings) {
  const nextSettings = normalizeSettings(settings);

  if (
    nextSettings.storeName.length === 0 ||
    nextSettings.storeAddress.length === 0 ||
    nextSettings.ownerName.length === 0 ||
    nextSettings.ownerWhatsapp.length < 10 ||
    nextSettings.city.length === 0 ||
    nextSettings.enabledPayments.length === 0
  ) {
    throw new Error(
      "Lengkapi nama warung, alamat, pemilik, WhatsApp, kota, dan pilih minimal satu metode bayar."
    );
  }

  const [updated] = await db
    .update(storeProfiles)
    .set({
      storeName: nextSettings.storeName,
      storeTagline: nextSettings.storeTagline,
      storeAddress: nextSettings.storeAddress,
      ownerName: nextSettings.ownerName,
      ownerWhatsapp: nextSettings.ownerWhatsapp,
      city: nextSettings.city,
      businessNotes: nextSettings.businessNotes,
      stockAlertThreshold: nextSettings.stockAlertThreshold,
      enabledPayments: nextSettings.enabledPayments,
      updatedAt: nowIso(),
    })
    .where(eq(storeProfiles.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("Data tidak ditemukan.");
  }

  return mapSettings(updated);
}

export async function resetWorkspace(userId: string) {
  await ensureAppReady();

  const transactionIds = (
    await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.userId, userId))
  ).map((transaction) => transaction.id);

  if (transactionIds.length > 0) {
    await db
      .delete(transactionItems)
      .where(inArray(transactionItems.transactionId, transactionIds));
  }

  await db.delete(transactions).where(eq(transactions.userId, userId));
  await db.delete(debts).where(eq(debts.userId, userId));
  await db.delete(expenses).where(eq(expenses.userId, userId));
  await db.delete(products).where(eq(products.userId, userId));
  await db.delete(storeProfiles).where(eq(storeProfiles.userId, userId));

  await ensureWorkspace(userId, null);

  return getBootstrapState(userId);
}
