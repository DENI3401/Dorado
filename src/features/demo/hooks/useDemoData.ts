import { useMemo } from "react";
import { useCategoriesStore } from "@/features/categories/store";
import { useRecurringIncomeStore } from "@/features/recurring-income/store";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { useTransactionsStore } from "@/features/transactions/store";
import { countDemoData, hasDemoData } from "../build";
import { clearDemoData, undoClearDemoData } from "../seed";

/**
 * Bezgłowa logika przycisku „Wyczyść dane demo”. Liczy rekordy demo na żywo z magazynów,
 * więc przycisk znika sam po wyczyszczeniu, a wraca po „Cofnij” albo imporcie kopii z demo.
 */
export function useDemoData() {
  const transactions = useTransactionsStore((s) => s.transactions);
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const recurringIncomes = useRecurringIncomeStore((s) => s.recurringIncomes);
  const customCategories = useCategoriesStore((s) => s.customCategories);

  const counts = useMemo(
    () => countDemoData({ transactions, subscriptions, recurringIncomes, customCategories }),
    [transactions, subscriptions, recurringIncomes, customCategories],
  );

  return {
    counts,
    hasDemoData: hasDemoData(counts),
    clear: clearDemoData,
    undo: undoClearDemoData,
  };
}
