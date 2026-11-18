import { useCallback } from "react";
import { useRecurringIncomeStore } from "../store";
import type { RecurringIncome } from "../types";

export interface RemovedRecurringIncome {
  recurringIncome: RecurringIncome;
  /** Przywraca usunięte wynagrodzenie — podepnij pod przycisk „Cofnij” w toaście. */
  undo: () => void;
}

/** Usuwanie (z Undo) oraz pauza / wznowienie. Potwierdzenie w modalu robi UI. */
export function useRecurringIncomeActions() {
  const removeRecurringIncome = useRecurringIncomeStore((s) => s.removeRecurringIncome);
  const restoreRecurringIncome = useRecurringIncomeStore((s) => s.restoreRecurringIncome);
  const setActiveInStore = useRecurringIncomeStore((s) => s.setActive);

  const remove = useCallback(
    (id: string): RemovedRecurringIncome | null => {
      const recurringIncome = removeRecurringIncome(id);
      if (!recurringIncome) return null;
      return { recurringIncome, undo: () => restoreRecurringIncome(recurringIncome) };
    },
    [removeRecurringIncome, restoreRecurringIncome],
  );

  /** Zwraca zaktualizowane wynagrodzenie (do tekstu w toaście) albo null. */
  const setActive = useCallback(
    (id: string, isActive: boolean): RecurringIncome | null => setActiveInStore(id, isActive),
    [setActiveInStore],
  );

  return { remove, setActive };
}
