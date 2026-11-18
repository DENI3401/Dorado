// TODO(F2): zastąpić getCycleRange/getCycleBalance
/**
 * Tymczasowy cykl budżetowy, dopóki nie ma modułu F2 (cykl budżetowy i rollover).
 * Cykl = bieżący miesiąc kalendarzowy, bez dnia startu z ustawień i bez nadwyżki
 * z poprzedniego okresu. Importowany tylko w hooks/useDashboard.ts, żeby podmiana
 * na getCycleRange/getCycleBalance z F2 była zmianą jednego importu.
 */
import { daysInMonth } from "@/features/subscriptions/schedule";
import { summarize } from "@/features/transactions/filters";
import type { Transaction } from "@/features/transactions/types";
import { isInRange, type DateRange } from "./aggregate";

/** Cykl od 1. do ostatniego dnia miesiąca, w którym leży `todayIso` (YYYY-MM-DD). */
export function getCycleRange(todayIso: string): DateRange {
  const year = Number(todayIso.slice(0, 4));
  const month = Number(todayIso.slice(5, 7));
  const prefix = todayIso.slice(0, 8);
  return {
    start: `${prefix}01`,
    end: `${prefix}${String(daysInMonth(year, month)).padStart(2, "0")}`,
  };
}

/** Saldo cyklu: przychody − wydatki z dat w cyklu (bez rollover). */
export function getCycleBalance(transactions: readonly Transaction[], range: DateRange): number {
  return summarize(transactions.filter((t) => isInRange(t.date, range))).balance;
}
