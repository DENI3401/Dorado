import { useMemo } from "react";
import { useAllCategories } from "@/features/categories/hooks/useAllCategories";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { summarize } from "@/features/transactions/filters";
import { useTransactionsStore } from "@/features/transactions/store";
import { aggregateByCategory, aggregateByDay, transactionsInRange } from "../aggregate";
// TODO(F2): zastąpić getCycleRange/getCycleBalance — jedyne miejsce użycia fallbacku.
import { getCycleBalance, getCycleRange } from "../cycle-fallback";
import { calculateSafeToSpend, getUpcomingPayments } from "../safeToSpend";

/**
 * Wszystkie dane Dashboardu dla bieżącego cyklu. Przelicza się przy każdej zmianie
 * transakcji, subskrypcji, kategorii albo daty (nowy dzień = być może nowy cykl).
 */
export function useDashboard(todayIso: string) {
  const transactions = useTransactionsStore((s) => s.transactions);
  const subscriptions = useSubscriptionsStore((s) => s.subscriptions);
  const categories = useAllCategories();

  return useMemo(() => {
    const cycle = getCycleRange(todayIso);
    const inCycle = transactionsInRange(transactions, cycle);
    const totals = summarize(inCycle);
    const balance = getCycleBalance(transactions, cycle);
    const upcoming = getUpcomingPayments(subscriptions, transactions, todayIso, cycle.end);

    return {
      cycle,
      totals,
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
  }, [transactions, subscriptions, categories, todayIso]);
}
