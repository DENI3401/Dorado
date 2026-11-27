/**
 * Czysta logika cyklu budżetowego (bez Reacta i bez magazynów).
 *
 * Rollover jest LICZONY, a nie przechowywany: saldo otwarcia cyklu to wszystkie przychody
 * minus wszystkie wydatki z datą wcześniejszą niż początek cyklu. Dzięki temu edycja starej
 * operacji, zmiana dnia cyklu albo import danych (F14) nie wymagają żadnej migracji.
 *
 * Daty to napisy YYYY-MM-DD — bez stref czasowych i bez toISOString().
 */
// Import z pliku, nie z barrelu "@/features/dashboard": barrel zawiera hooki, które importują ten moduł.
import { transactionsInRange, type DateRange } from "@/features/dashboard/aggregate";
import { addDaysIso, clampDay } from "@/features/subscriptions/schedule";
import { summarize } from "@/features/transactions/filters";
import type { Transaction } from "@/features/transactions/types";
import { roundMoney } from "@/features/transactions/utils/money";

const MIN_START_DAY = 1;
const MAX_START_DAY = 31;

/** Dzień startu zawsze jako liczba całkowita 1–31 (uszkodzone dane z localStorage → bezpieczna wartość). */
export function normalizeStartDay(startDay: number): number {
  if (!Number.isFinite(startDay)) return MIN_START_DAY;
  return Math.min(MAX_START_DAY, Math.max(MIN_START_DAY, Math.trunc(startDay)));
}

function parseIso(iso: string) {
  return {
    y: Number(iso.slice(0, 4)),
    m: Number(iso.slice(5, 7)),
    d: Number(iso.slice(8, 10)),
  };
}

function formatIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function shiftMonth(y: number, m: number, delta: number): { y: number; m: number } {
  const index = y * 12 + (m - 1) + delta;
  return { y: Math.floor(index / 12), m: (index % 12) + 1 };
}

/** Początek cyklu w danym miesiącu; w krótszym miesiącu — ostatni dzień miesiąca. */
function cycleStartIn(y: number, m: number, startDay: number): string {
  return formatIso(y, m, clampDay(y, m, startDay));
}

/**
 * Cykl, w którym leży `todayIso`, dla dnia startu `startDay` (1–31).
 * Koniec = dzień przed początkiem następnego cyklu (obie granice włącznie).
 */
export function getCycleRange(todayIso: string, startDay: number): DateRange {
  const day = normalizeStartDay(startDay);
  const { y, m, d } = parseIso(todayIso);

  const startsThisMonth = d >= clampDay(y, m, day);
  const first = startsThisMonth ? { y, m } : shiftMonth(y, m, -1);
  const next = shiftMonth(first.y, first.m, 1);

  return {
    start: cycleStartIn(first.y, first.m, day),
    end: addDaysIso(cycleStartIn(next.y, next.m, day), -1),
  };
}

/** Cykl bezpośrednio poprzedzający `range` (np. do porównań na Dashboardzie). */
export function getPreviousCycleRange(range: DateRange, startDay: number): DateRange {
  return getCycleRange(addDaysIso(range.start, -1), startDay);
}

/** Saldo otwarcia cyklu: wszystko sprzed `cycleStartIso` (nadwyżka lub niedobór). */
export function getOpeningBalance(
  transactions: readonly Transaction[],
  cycleStartIso: string,
): number {
  const before = transactions.filter((t) => t.date < cycleStartIso);
  return roundMoney(summarize(before).balance);
}

export interface CycleBalance {
  /** Saldo otwarcia (rollover z poprzednich okresów, może być ujemne). */
  opening: number;
  /** Przychody w cyklu. */
  income: number;
  /** Wydatki w cyklu. */
  expense: number;
  /** opening + income − expense. */
  balance: number;
}

export function getCycleBalance(
  transactions: readonly Transaction[],
  range: DateRange,
): CycleBalance {
  const opening = getOpeningBalance(transactions, range.start);
  const { income, expense } = summarize(transactionsInRange(transactions, range));
  return {
    opening,
    income,
    expense,
    balance: roundMoney(opening + income - expense),
  };
}
