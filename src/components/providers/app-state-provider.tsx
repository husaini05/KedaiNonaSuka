"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { emptyAppState } from "@/lib/empty-state";
import { AppState, Debt, DebtDraft, Expense, ExpenseDraft, PaymentMethod, Product, ProductDraft, Settings, Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type CartLine = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

type AppStateContextValue = AppState & {
  isLoading: boolean;
  loadError: string | null;
  cartLines: CartLine[];
  cartTotal: number;
  lowStockProducts: Product[];
  addToCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  checkout: (customerData?: {
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
  }) => Promise<Transaction | null>;
  addProduct: (draft: ProductDraft) => Promise<void>;
  updateProduct: (productId: string, draft: ProductDraft) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  restockProduct: (productId: string, quantity: number) => Promise<void>;
  addDebt: (draft: DebtDraft) => Promise<void>;
  markDebtPaid: (debtId: string) => Promise<void>;
  sendDebtReminder: (debtId: string) => Promise<Debt | null>;
  addExpense: (draft: ExpenseDraft) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  resetWorkspace: () => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

// Simple in-memory cache for GET requests — avoids redundant server calls
// when the user navigates back to a page within the same session.
const _getCache = new Map<string, { data: unknown; ts: number }>();
const GET_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function invalidateGetCache() {
  _getCache.clear();
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isGet = method === "GET";
  const key = typeof input === "string" ? input : input.toString();

  if (isGet) {
    const cached = _getCache.get(key);
    if (cached && Date.now() - cached.ts < GET_CACHE_TTL_MS) {
      return cached.data as T;
    }
  } else {
    // Any mutation invalidates all cached GET responses so data stays fresh
    invalidateGetCache();
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null;

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(data?.error ?? "Permintaan ke server gagal.");
  }

  if (data === null) {
    throw new Error("Server mengembalikan respons kosong.");
  }

  if (isGet) {
    _getCache.set(key, { data, ts: Date.now() });
  }

  return data as T;
}

// Normalise Indonesian phone numbers to international format (628xxx)
function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return "62" + digits;
}

export function AppStateProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [state, setState] = useState<AppState>(emptyAppState);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { data: session, isPending } = useSession();
  const sessionUserId = session?.user?.id ?? null;

  // Keep a ref so async callbacks always have the latest state without
  // needing to list state as a useCallback dep (avoids stale closures).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (isPending) return;

    if (!sessionUserId) {
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);

    void requestJson<{ appState: AppState }>("/api/bootstrap")
      .then((response) => {
        if (!isActive) return;
        setLoadError(null);
        setState((current) => ({
          ...response.appState,
          cart: current.cart,
          paymentMethod: response.appState.settings.enabledPayments.includes(current.paymentMethod)
            ? current.paymentMethod
            : response.appState.paymentMethod,
        }));
      })
      .catch((error) => {
        if (!isActive) return;
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          setState(emptyAppState);
          router.replace("/auth");
        } else {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Gagal memuat data. Periksa koneksi internet lalu muat ulang."
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isPending, router, sessionUserId]);

  // ── Computed values (memoised so they only recalculate when deps change) ──

  const cartLines = useMemo(
    () =>
      state.cart.flatMap((line) => {
        const product = state.products.find((item) => item.id === line.productId);
        if (!product) return [];
        return [{ product, quantity: line.quantity, lineTotal: product.sellPrice * line.quantity }];
      }),
    [state.cart, state.products]
  );

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.lineTotal, 0),
    [cartLines]
  );

  const lowStockProducts = useMemo(
    () =>
      state.products.filter(
        (product) => product.stock <= Math.max(product.minimumStock, state.settings.stockAlertThreshold)
      ),
    [state.products, state.settings.stockAlertThreshold]
  );

  // ── Cart actions ──────────────────────────────────────────────────────────

  const addToCart = useCallback((productId: string) => {
    setState((current) => {
      const product = current.products.find((item) => item.id === productId);
      if (!product || product.stock <= 0) return current;

      const existing = current.cart.find((item) => item.productId === productId);
      const nextCart = existing
        ? current.cart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
              : item
          )
        : [...current.cart, { productId, quantity: 1 }];

      return { ...current, cart: nextCart };
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setState((current) => {
      const product = current.products.find((item) => item.id === productId);
      if (!product) return current;

      const nextQuantity = Math.max(0, Math.min(quantity, product.stock));
      return {
        ...current,
        cart:
          nextQuantity === 0
            ? current.cart.filter((item) => item.productId !== productId)
            : current.cart.map((item) =>
                item.productId === productId ? { ...item, quantity: nextQuantity } : item
              ),
      };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setState((current) => ({
      ...current,
      cart: current.cart.filter((item) => item.productId !== productId),
    }));
  }, []);

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setState((current) => ({ ...current, paymentMethod: method }));
  }, []);

  // ── Async mutations ───────────────────────────────────────────────────────

  const checkout = useCallback(
    async (customerData?: {
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string;
    }) => {
      const current = stateRef.current;
      if (current.cart.length === 0) return null;

      const response = await requestJson<{ transaction: Transaction; products: Product[] }>(
        "/api/transactions",
        {
          method: "POST",
          body: JSON.stringify({
            paymentMethod: current.paymentMethod,
            items: current.cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            ...customerData,
          }),
        }
      );

      setState((prev) => ({
        ...prev,
        cart: [],
        transactions: [response.transaction, ...prev.transactions],
        products: response.products,
      }));

      return response.transaction;
    },
    []
  );

  const addProduct = useCallback(async (draft: ProductDraft) => {
    const response = await requestJson<{ product: Product }>("/api/products", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    setState((current) => ({
      ...current,
      products: [response.product, ...current.products],
    }));
  }, []);

  const updateProduct = useCallback(async (productId: string, draft: ProductDraft) => {
    const response = await requestJson<{ product: Product }>(`/api/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(draft),
    });
    setState((current) => ({
      ...current,
      products: current.products.map((p) => (p.id === productId ? response.product : p)),
    }));
  }, []);

  const restockProduct = useCallback(async (productId: string, quantity: number) => {
    const response = await requestJson<{ product: Product }>(
      `/api/products/${productId}/restock`,
      { method: "POST", body: JSON.stringify({ quantity }) }
    );
    setState((current) => ({
      ...current,
      products: current.products.map((p) => (p.id === productId ? response.product : p)),
    }));
  }, []);

  const addDebt = useCallback(async (draft: DebtDraft) => {
    const response = await requestJson<{ debt: Debt }>("/api/debts", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    setState((current) => ({
      ...current,
      debts: [response.debt, ...current.debts],
    }));
  }, []);

  const markDebtPaid = useCallback(async (debtId: string) => {
    const response = await requestJson<{ debt: Debt }>(`/api/debts/${debtId}`, {
      method: "PATCH",
      body: JSON.stringify({ isPaid: true }),
    });
    setState((current) => ({
      ...current,
      debts: current.debts.map((d) => (d.id === debtId ? response.debt : d)),
    }));
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    await requestJson(`/api/products/${productId}`, { method: "DELETE" });
    setState((current) => ({
      ...current,
      products: current.products.filter((p) => p.id !== productId),
    }));
  }, []);

  const deleteExpense = useCallback(async (expenseId: string) => {
    await requestJson(`/api/expenses/${expenseId}`, { method: "DELETE" });
    setState((current) => ({
      ...current,
      expenses: current.expenses.filter((e) => e.id !== expenseId),
    }));
  }, []);

  const addExpense = useCallback(async (draft: ExpenseDraft) => {
    const response = await requestJson<{ expense: Expense }>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    setState((current) => ({
      ...current,
      expenses: [response.expense, ...current.expenses],
    }));
  }, []);

  const sendDebtReminder = useCallback(async (debtId: string) => {
    // Open WhatsApp BEFORE the API call so the browser doesn't block the popup
    const debt = stateRef.current.debts.find((d) => d.id === debtId);
    if (debt?.whatsapp) {
      const phone = normalizePhoneNumber(debt.whatsapp);
      if (phone.length >= 10) {
        const dueDate = new Date(debt.dueDate).toLocaleDateString("id-ID");
        const amount = formatCurrency(debt.amount);
        const message = `Halo ${debt.borrowerName}, pengingat hutang sebesar ${amount} jatuh tempo ${dueDate}. Mohon segera dilunasi. Terima kasih — Kedai Nona Suka.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
      }
    }

    const response = await requestJson<{ debt: Debt }>(`/api/debts/${debtId}/remind`, {
      method: "POST",
    });

    setState((current) => ({
      ...current,
      debts: current.debts.map((d) => (d.id === debtId ? response.debt : d)),
    }));

    return response.debt;
  }, []);

  const updateSettings = useCallback(async (settings: Settings) => {
    const response = await requestJson<{ settings: Settings }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    setState((current) => ({
      ...current,
      paymentMethod: response.settings.enabledPayments.includes(current.paymentMethod)
        ? current.paymentMethod
        : response.settings.enabledPayments[0] ?? "Tunai",
      settings: response.settings,
    }));
  }, []);

  const resetWorkspace = useCallback(async () => {
    const response = await requestJson<{ appState: AppState }>("/api/bootstrap/reset", {
      method: "POST",
    });
    setState((current) => ({
      ...response.appState,
      cart: [],
      paymentMethod: response.appState.settings.enabledPayments.includes(current.paymentMethod)
        ? current.paymentMethod
        : response.appState.paymentMethod,
    }));
  }, []);

  // ── Context value (memoised to prevent unnecessary consumer re-renders) ──

  const contextValue = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      isLoading,
      loadError,
      cartLines,
      cartTotal,
      lowStockProducts,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      setPaymentMethod,
      checkout,
      addProduct,
      updateProduct,
      restockProduct,
      addDebt,
      markDebtPaid,
      sendDebtReminder,
      addExpense,
      deleteExpense,
      deleteProduct,
      updateSettings,
      resetWorkspace,
    }),
    [
      state, isLoading, loadError, cartLines, cartTotal, lowStockProducts,
      addToCart, updateCartQuantity, removeFromCart, setPaymentMethod,
      checkout, addProduct, updateProduct, restockProduct,
      addDebt, markDebtPaid, sendDebtReminder,
      addExpense, deleteExpense, deleteProduct,
      updateSettings, resetWorkspace,
    ]
  );

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error("useAppState harus dipakai di dalam AppStateProvider.");
  }
  return value;
}
