import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "@/features/categories/defaultCategories";
import {
  DEFAULT_FILTERS,
  filterTransactions,
  hasActiveFilters,
  summarize,
} from "./filters";
import type { Transaction } from "./types";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: crypto.randomUUID(),
  type: "expense",
  incomeKind: null,
  amount: 10,
  categoryId: "cat-expense-food",
  date: "2026-11-01",
  note: "",
  createdAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

const data: Transaction[] = [
  tx({ id: "a", amount: 25.5, note: "Żabka", date: "2026-11-01" }),
  tx({ id: "b", amount: 100, categoryId: "cat-expense-transport", note: "Bilet", date: "2026-11-03" }),
  tx({ id: "c", type: "income", incomeKind: "salary", amount: 5000, categoryId: "cat-income-salary", date: "2026-11-02" }),
  tx({ id: "d", type: "income", incomeKind: "bonus", amount: 300, categoryId: "cat-income-bonus", note: "Premia kwartalna", date: "2026-10-15" }),
];

const run = (f: Partial<typeof DEFAULT_FILTERS>) =>
  filterTransactions(data, { ...DEFAULT_FILTERS, ...f }, DEFAULT_CATEGORIES).map((t) => t.id);

describe("filterTransactions", () => {
  it("domyślnie sortuje od najnowszej daty", () => {
    expect(run({})).toEqual(["b", "c", "a", "d"]);
  });
  it("filtruje po typie i rodzaju przychodu", () => {
    expect(run({ type: "income" })).toEqual(["c", "d"]);
    expect(run({ incomeKind: "bonus" })).toEqual(["d"]);
  });
  it("szuka bez polskich znaków i wielkości liter", () => {
    expect(run({ query: "zabka" })).toEqual(["a"]);
    expect(run({ query: "TRANSPORT" })).toEqual(["b"]);
  });
  it("filtruje po zakresie dat i kwot", () => {
    expect(run({ dateFrom: "2026-11-01", dateTo: "2026-11-02" })).toEqual(["c", "a"]);
    expect(run({ amountMin: 100, amountMax: 400 })).toEqual(["b", "d"]);
  });
  it("sortuje po kwocie rosnąco", () => {
    expect(run({ sortBy: "amount", sortDir: "asc" })).toEqual(["a", "b", "d", "c"]);
  });
});

describe("hasActiveFilters", () => {
  it("ignoruje sortowanie", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sortBy: "amount" })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: "x" })).toBe(true);
  });
});

describe("summarize", () => {
  it("liczy przychody, wydatki i saldo", () => {
    expect(summarize(data)).toEqual({ income: 5300, expense: 125.5, balance: 5174.5 });
  });
});
