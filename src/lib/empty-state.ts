import { AppState } from "@/lib/types";

export const emptyAppState: AppState = {
  products: [],
  cart: [],
  transactions: [],
  debts: [],
  expenses: [],
  paymentMethod: "Tunai",
  settings: {
    storeName: "",
    ownerName: "",
    ownerWhatsapp: "",
    city: "",
    stockAlertThreshold: 5,
    enabledPayments: ["Tunai", "QRIS", "Transfer"],
  },
};
