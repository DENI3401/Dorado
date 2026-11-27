import { useMemo } from "react";
import { getCycleBalance, getCycleRange } from "@/features/budget-cycle";
import { useAllCategories } from "@/features/categories/hooks/useAllCategories";
import { useSettingsStore } from "@/features/settings";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { summarize } from "@/features/transactions/filters";
import { useTransactionsStore } from "@/features/transactions/store";
import { aggregateByCategory, aggregateByDay, transactionsInRange } from "../aggregate";
import { calculateSafeToSpend, getUpcomingPayments } from "../safeToSpend";

/**
 * Wszystkie dane Dashboardu dla bieżącego cyklu (dzień startu z ustawień). Przelicza się przy
 * każdej zmianie transakcji, subskrypcji, kategorii, ustawień albo daty (nowy dzień = być może
 * nowy cykl). `balance` uwzględnia rollover; `opening` to saldo otwarcia cyklu
 * (np. do pokazania „zostało z poprzedniego cyklu”).
 */
export function useDashboard(todayIso: string) {
  const transactions = useTransactionsStore((s) => s.transactions);
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const categories = useAllCategories();
  const cycleStartDay = useSettingsStore((s) => s.cycleStartDay);

  return useMemo(() => {
    const cycle = getCycleRange(todayIso, cycleStartDay);
    const inCycle = transactionsInRange(transactions, cycle);
    const totals = summarize(inCycle);
    const { opening, balance } = getCycleBalance(transactions, cycle);
    const upcoming = getUpcomingPayments(subscriptions, transactions, todayIso, cycle.end);

    return {
      cycle,
      totals,
      opening,
      balance,
      daily: aggregateByDay(inCycle, cycle),
      expensesByCategory: aggregateByCategory(inCycle, cycle, categories, "expense"),
      incomeByCategory: aggregateByCategory(inCycle, cycle, categories, "income"),
      upcoming,
      safeToSpend: calculateSafeToSpend({
        balance,
        upcomingTotal: upcoming.total,
        todayIso,
        cycleEndIso: cycle.end,
      }),
      isEmpty: inCycle.length === 0,
    };
  }, [transactions, subscriptions, categories, todayIso, cycleStartDay]);
}
