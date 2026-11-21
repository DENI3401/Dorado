import { useMemo } from "react";
import { addDaysIso, nextOccurrence } from "@/features/subscriptions/schedule";
import { todayIso } from "@/features/transactions/utils/isoDate";
import { roundMoney } from "@/features/transactions/utils/money";
import { useRecurringIncomeStore } from "../store";

/**
 * Lista wynagrodzeń cyklicznych + podsumowanie. Aktywne na górze (potem wstrzymane),
 * w grupach od najnowszych. `monthlyTotal` liczy tylko aktywne.
 */
export function useRecurringIncomes() {
  const all = useRecurringIncomeStore((s) => s.recurringIncomes);

  return useMemo(() => {
    const recurringIncomes = [...all].sort(
      (a, b) => Number(b.isActive) - Number(a.isActive) || b.createdAt.localeCompare(a.createdAt),
    );
    const yesterday = addDaysIso(todayIso(), -1);
    /** Najbliższy wpływ każdego wynagrodzenia (null: wstrzymane lub zakończone). */
    const nextById: Record<string, string | null> = {};
    for (const r of recurringIncomes) nextById[r.id] = nextOccurrence(r, yesterday);

    return {
      recurringIncomes,
      nextById,
      monthlyTotal: roundMoney(
        recurringIncomes.filter((r) => r.isActive).reduce((sum, r) => sum + r.amount, 0),
      ),
      isEmpty: all.length === 0,
    };
  }, [all]);
}
