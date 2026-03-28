import { eq } from "drizzle-orm";
import { db, pool } from "../src/db/client";
import {
  debts,
  expenses,
  products,
  storeProfiles,
  transactionItems,
  transactions,
} from "../src/db/schema";
import { seedState } from "../src/lib/mock-data";

const SEED_USER_ID = process.env.SEED_USER_ID ?? "seed-workspace";

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

async function main() {
  const [existingProfile] = await db
    .select()
    .from(storeProfiles)
    .where(eq(storeProfiles.userId, SEED_USER_ID))
    .limit(1);

  const timestamp = new Date().toISOString();
  const existingTransactions = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.userId, SEED_USER_ID));

  if (existingTransactions.length > 0) {
    await db.delete(transactionItems).where(
      eq(transactionItems.transactionId, existingTransactions[0].id)
    );

    for (const transaction of existingTransactions.slice(1)) {
      await db.delete(transactionItems).where(eq(transactionItems.transactionId, transaction.id));
    }
  }

  await db.delete(transactions).where(eq(transactions.userId, SEED_USER_ID));
  await db.delete(debts).where(eq(debts.userId, SEED_USER_ID));
  await db.delete(expenses).where(eq(expenses.userId, SEED_USER_ID));
  await db.delete(products).where(eq(products.userId, SEED_USER_ID));

  if (!existingProfile) {
    await db.insert(storeProfiles).values({
      userId: SEED_USER_ID,
      storeName: seedState.settings.storeName,
      ownerName: seedState.settings.ownerName,
      ownerWhatsapp: seedState.settings.ownerWhatsapp,
      city: seedState.settings.city,
      stockAlertThreshold: seedState.settings.stockAlertThreshold,
      enabledPayments: seedState.settings.enabledPayments,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  const productIdMap = new Map(
    seedState.products.map((product) => [product.id, createId("prd")])
  );
  const transactionIdMap = new Map(
    seedState.transactions.map((transaction) => [transaction.id, createId("trx")])
  );

  await db.insert(products).values(
    seedState.products.map((product) => ({
      id: productIdMap.get(product.id) ?? createId("prd"),
      userId: SEED_USER_ID,
      name: product.name,
      category: product.category,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minimumStock: product.minimumStock,
      description: product.description,
      createdAt: timestamp,
      updatedAt: timestamp,
    }))
  );

  await db.insert(transactions).values(
    seedState.transactions.map((transaction) => ({
      id: transactionIdMap.get(transaction.id) ?? createId("trx"),
      userId: SEED_USER_ID,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      createdAt: transaction.createdAt,
    }))
  );

  await db.insert(transactionItems).values(
    seedState.transactions.flatMap((transaction) =>
      transaction.items.map((item) => ({
        id: createId("itm"),
        transactionId: transactionIdMap.get(transaction.id) ?? createId("trx"),
        productId: productIdMap.get(item.productId) ?? createId("prd"),
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
      }))
    )
  );

  await db.insert(debts).values(
    seedState.debts.map((debt) => ({
      id: createId("debt"),
      userId: SEED_USER_ID,
      borrowerName: debt.borrowerName,
      whatsapp: debt.whatsapp,
      amount: debt.amount,
      createdAt: debt.createdAt,
      dueDate: debt.dueDate.includes("T")
        ? debt.dueDate
        : new Date(`${debt.dueDate}T00:00:00.000Z`).toISOString(),
      isPaid: debt.isPaid ? 1 : 0,
      lastReminderAt: debt.lastReminderAt ?? null,
    }))
  );

  await db.insert(expenses).values(
    seedState.expenses.map((expense) => ({
      id: createId("exp"),
      userId: SEED_USER_ID,
      title: expense.title,
      amount: expense.amount,
      createdAt: expense.createdAt,
      category: expense.category,
    }))
  );

  console.log(`Seed complete: workspace '${SEED_USER_ID}' inserted.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
