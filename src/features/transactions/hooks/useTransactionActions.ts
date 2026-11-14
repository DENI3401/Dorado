import { useCallback } from "react";
import { useTransactionsStore } from "../store";
import type { Transaction } from "../types";

export interface RemovedTransaction {
  transaction: Transaction;
  /** Przywraca usuniętą operację — podepnij pod przycisk "Cofnij" w toaście. */
  undo: () => void;
}

/** Usuwanie operacji z możliwością cofnięcia (Undo). Potwierdzenie w modalu robi UI. */
export function useTransactionActions() {
  const removeTransaction = useTransactionsStore((s) => s.removeTransaction);
  const restoreTransaction = useTransactionsStore((s) => s.restoreTransaction);

  const remove = useCallback(
    (id: string): RemovedTransaction | null => {
      const transaction = removeTransaction(id);
      if (!transaction) return null;
      return { transaction, undo: () => restoreTransaction(transaction) };
    },
    [removeTransaction, restoreTransaction],
  );

  return { remove };
}
