import type { Category } from "@/features/categories/types";
import type { IncomeKind, Transaction, TransactionType } from "./types";
import { roundMoney } from "./utils/money";

export interface TransactionFilters {
  /** Szukanie po notatce i nazwie kategorii (bez wielkości liter i polskich znaków). */
  query: string;
  type: "all" | TransactionType;
  incomeKind: "all" | IncomeKind;
  categoryIds: string[];
  /** YYYY-MM-DD, włącznie. */
  dateFrom: string | null;
  dateTo: string | null;
  amountMin: number | null;
  amountMax: number | null;
  sortBy: "date" | "amount";
  sortDir: "asc" | "desc";
}

export const DEFAULT_FILTERS: TransactionFilters = {
  query: "",
  type: "all",
  incomeKind: "all",
  categoryIds: [],
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
  sortBy: "date",
  sortDir: "desc",
};

/** Czy użytkownik zawęził listę (sortowanie się nie liczy). */
export function hasActiveFilters(f: TransactionFilters): boolean {
  return (
    f.query.trim() !== "" ||
    f.type !== "all" ||
    f.incomeKind !== "all" ||
    f.categoryIds.length > 0 ||
    f.dateFrom !== null ||
    f.dateTo !== null ||
    f.amountMin !== null ||
    f.amountMax !== null
  );
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filterTransactions(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
  categories: readonly Category[],
): Transaction[] {
  const names = new Map(categories.map((c) => [c.id, normalizeText(c.name)]));
  const query = normalizeText(filters.query.trim());
  const selected = new Set(filters.categoryIds);

  const result = transactions.filter((t) => {
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (filters.incomeKind !== "all" && t.incomeKind !== filters.incomeKind) return false;
    if (selected.size > 0 && !selected.has(t.categoryId)) return false;
    if (filters.dateFrom && t.date < filters.dateFrom) return false;
    if (filters.dateTo && t.date > filters.dateTo) return false;
    if (filters.amountMin !== null && t.amount < filters.amountMin) return false;
    if (filters.amountMax !== null && t.amount > filters.amountMax) return false;
    if (query) {
      const haystack = `${normalizeText(t.note)} ${names.get(t.categoryId) ?? ""}`;
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const dir = filters.sortDir === "asc" ? 1 : -1;
  return result.sort((a, b) => {
    const primary =
      filters.sortBy === "amount"
        ? a.amount - b.amount
        : a.date.localeCompare(b.date);
    if (primary !== 0) return primary * dir;
    return a.createdAt.localeCompare(b.createdAt) * dir;
  });
}

export interface TransactionTotals {
  income: number;
  expense: number;
  balance: number;
}

export function summarize(transactions: readonly Transaction[]): TransactionTotals {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return {
    income: roundMoney(income),
    expense: roundMoney(expense),
    balance: roundMoney(income - expense),
  };
}
