import { getOccurrences } from "@/features/subscriptions/schedule";
import type { Transaction } from "@/features/transactions/types";
import type { RecurringIncome } from "./types";

export interface SalaryPlan {
  /** Nowe przychody (wynagrodzenie stałe) do dopisania do historii transakcji. */
  created: Transaction[];
  /** Nowe „rozliczone do” dla każdego wynagrodzenia: id → YYYY-MM-DD. */
  generatedThrough: Record<string, string>;
}

/** Czy wpływ z tego wynagrodzenia w tym dniu już istnieje (reguła bez duplikatów). */
export function isSalaryRecorded(
  transactions: readonly Transaction[],
  recurringIncomeId: string,
  date: string,
): boolean {
  return transactions.some((t) => t.recurringIncomeId === recurringIncomeId && t.date === date);
}

/**
 * Wylicza, które wpływy wynagrodzenia wpadły już w historię transakcji (daty ≤ today).
 * Czysta funkcja — nic nie zapisuje; tak samo działa plan płatności subskrypcji (F4).
 *
 * - Wpływ tworzymy tylko raz: daty ≤ generatedThrough są już rozliczone, więc ręcznie
 *   usunięta transakcja nie wraca po odświeżeniu strony.
 * - Pierwsze uruchomienie (generatedThrough = null) dopisuje wpływy od startDate.
 * - Wstrzymane wynagrodzenie nic nie tworzy, ale „rozliczone do” i tak przesuwa się na dziś,
 *   więc po wznowieniu nie dopisują się wpływy z okresu pauzy.
 * - Gdy transakcja z tą parą (recurringIncomeId, data) już istnieje, nie powstaje druga.
 * - Dzień 29–31 w krótszym miesiącu przypada na ostatni dzień tego miesiąca.
 */
export function planRecurringIncome(
  recurringIncomes: readonly RecurringIncome[],
  transactions: readonly Transaction[],
  today: string,
  now: Date = new Date(),
): SalaryPlan {
  const created: Transaction[] = [];
  const generatedThrough: Record<string, string> = {};

  for (const rule of recurringIncomes) {
    const through = rule.generatedThrough;
    for (const date of getOccurrences(rule, rule.startDate, today)) {
      if (through !== null && date <= through) continue;
      if (isSalaryRecorded(transactions, rule.id, date)) continue;
      created.push({
        id: crypto.randomUUID(),
        type: "income",
        incomeKind: "salary",
        amount: rule.amount,
        categoryId: rule.categoryId,
        date,
        note: rule.note,
        createdAt: now.toISOString(),
        recurringIncomeId: rule.id,
      });
    }
    generatedThrough[rule.id] = through !== null && through >= today ? through : today;
  }

  return { created, generatedThrough };
}
