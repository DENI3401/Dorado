/**
 * Czysta agregacja danych do wykresów Dashboardu (bez Reacta i bez magazynów).
 * Daty to napisy YYYY-MM-DD, porównywane leksykograficznie — bez stref czasowych.
 */
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID } from "@/features/categories/defaultCategories";
import type { Category } from "@/features/categories/types";
import { addDaysIso } from "@/features/subscriptions/schedule";
import type { Transaction, TransactionType } from "@/features/transactions/types";
import { roundMoney } from "@/features/transactions/utils/money";

/** Przedział dat YYYY-MM-DD, obie granice włącznie. */
export interface DateRange {
  start: string;
  end: string;
}

export function isInRange(date: string, { start, end }: DateRange): boolean {
  return date >= start && date <= end;
}

export function transactionsInRange(
  transactions: readonly Transaction[],
  range: DateRange,
): Transaction[] {
  return transactions.filter((t) => isInRange(t.date, range));
}

export interface DailyCashflow {
  /** YYYY-MM-DD */
  date: string;
  /** Dzień miesiąca (etykieta osi X). */
  day: number;
  income: number;
  expense: number;
}

/**
 * Przychody i wydatki dla każdego dnia cyklu — także dni bez operacji (zera),
 * żeby oś X pokazywała cały cykl. Operacje spoza przedziału są pomijane.
 */
export function aggregateByDay(
  transactions: readonly Transaction[],
  range: DateRange,
): DailyCashflow[] {
  if (range.start > range.end) return [];

  const days: DailyCashflow[] = [];
  const byDate = new Map<string, DailyCashflow>();
  for (let date = range.start; date <= range.end; date = addDaysIso(date, 1)) {
    const point = { date, day: Number(date.slice(8, 10)), income: 0, expense: 0 };
    days.push(point);
    byDate.set(date, point);
  }

  for (const t of transactions) {
    const point = byDate.get(t.date);
    if (!point) continue;
    if (t.type === "income") point.income += t.amount;
    else point.expense += t.amount;
  }

  // Zaokrąglamy dopiero po zsumowaniu, żeby nie kumulować błędów float.
  for (const point of days) {
    point.income = roundMoney(point.income);
    point.expense = roundMoney(point.expense);
  }
  return days;
}

export interface CategorySlice {
  categoryId: string;
  name: string;
  /** Kolor HEX kategorii. */
  color: string;
  icon: string;
  amount: number;
  /** Udział w sumie operacji danego typu (wydatków albo przychodów), 0–1. */
  share: number;
}

/**
 * Operacje danego typu z przedziału zgrupowane wg kategorii, malejąco po kwocie.
 * Działa tak samo dla wydatków i przychodów. Operacje z nieistniejącą kategorią
 * trafiają do kategorii zapasowej typu („Inne wydatki” / „Inne przychody”) — tak samo
 * jak przy usuwaniu kategorii (deleteCategory).
 */
export function aggregateByCategory(
  transactions: readonly Transaction[],
  range: DateRange,
  categories: readonly Category[],
  type: TransactionType,
): CategorySlice[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const fallbackId = FALLBACK_CATEGORY_ID[type];
  const sums = new Map<string, number>();
  let total = 0;

  for (const t of transactions) {
    if (t.type !== type || !isInRange(t.date, range)) continue;
    const id = byId.has(t.categoryId) ? t.categoryId : fallbackId;
    sums.set(id, (sums.get(id) ?? 0) + t.amount);
    total += t.amount;
  }

  const fallback = DEFAULT_CATEGORIES.find((c) => c.id === fallbackId)!;
  const slices: CategorySlice[] = [];
  for (const [categoryId, sum] of sums) {
    const category = byId.get(categoryId) ?? fallback;
    slices.push({
      categoryId,
      name: category.name,
      color: category.color,
      icon: category.icon,
      amount: roundMoney(sum),
      share: total > 0 ? sum / total : 0,
    });
  }

  return slices.sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, "pl"));
}
