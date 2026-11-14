import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction } from "./types";
import type { TransactionFormValues } from "./schema";
import { applyValues, createTransaction } from "./model";

interface TransactionsState {
  transactions: Transaction[];
  addTransaction: (values: TransactionFormValues) => Transaction;
  updateTransaction: (id: string, values: TransactionFormValues) => Transaction | null;
  /** Zwraca usuniętą operację (potrzebna do Undo w toaście) albo null. */
  removeTransaction: (id: string) => Transaction | null;
  /** Przywraca wcześniej usuniętą operację (Undo). */
  restoreTransaction: (transaction: Transaction) => void;
  /** Przepina operacje z jednej kategorii na inną; zwraca liczbę zmienionych. */
  reassignCategory: (fromId: string, toId: string) => number;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (values) => {
        const transaction = createTransaction(values);
        set((s) => ({ transactions: [transaction, ...s.transactions] }));
        return transaction;
      },

      updateTransaction: (id, values) => {
        const current = get().transactions.find((t) => t.id === id);
        if (!current) return null;
        const updated = applyValues(current, values);
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
        }));
        return updated;
      },

      removeTransaction: (id) => {
        const removed = get().transactions.find((t) => t.id === id) ?? null;
        if (removed) {
          set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
        }
        return removed;
      },

      restoreTransaction: (transaction) => {
        set((s) =>
          s.transactions.some((t) => t.id === transaction.id)
            ? s
            : { transactions: [transaction, ...s.transactions] },
        );
      },

      reassignCategory: (fromId, toId) => {
        let count = 0;
        set((s) => ({
          transactions: s.transactions.map((t) => {
            if (t.categoryId !== fromId) return t;
            count += 1;
            return { ...t, categoryId: toId };
          }),
        }));
        return count;
      },
    }),
    {
      name: "dorado-transactions",
      version: 1,
      partialize: (s) => ({ transactions: s.transactions }),
    },
  ),
);
