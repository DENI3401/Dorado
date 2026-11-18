import { useTransactionsStore } from "@/features/transactions/store";
import { todayIso } from "@/features/transactions/utils/isoDate";
import { planRecurringIncome } from "./plan";
import { useRecurringIncomeStore } from "./store";

/**
 * Księguje wynagrodzenia, których termin już minął (lub jest dziś), w historii transakcji.
 * Zwraca liczbę dopisanych wpływów (do komunikatu w toaście). Można wołać dowolnie często:
 * ponowne wywołanie nic nie dopisze (patrz planRecurringIncome).
 */
export function syncRecurringIncome(today: string = todayIso()): number {
  const { recurringIncomes } = useRecurringIncomeStore.getState();
  const { transactions } = useTransactionsStore.getState();

  const plan = planRecurringIncome(recurringIncomes, transactions, today);

  if (plan.created.length > 0) {
    useTransactionsStore.setState((state) => ({
      transactions: [...plan.created, ...state.transactions],
    }));
  }
  // Najpierw transakcje, potem znacznik: gdyby coś przerwało w połowie, duplikatu i tak nie będzie,
  // bo istniejącą parę (wynagrodzenie, data) planer pomija.
  useRecurringIncomeStore.getState().markGenerated(plan.generatedThrough);

  return plan.created.length;
}
