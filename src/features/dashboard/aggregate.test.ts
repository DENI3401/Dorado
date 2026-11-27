import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID } from "@/features/categories/defaultCategories";
import type { Category } from "@/features/categories/types";
import type { Transaction } from "@/features/transactions/types";
import { aggregateByCategory, aggregateByDay, transactionsInRange } from "./aggregate";

let seq = 0;
const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: `t${++seq}`,
  type: "expense",
  incomeKind: null,
  amount: 10,
  categoryId: "cat-expense-food",
  date: "2026-11-05",
  note: "",
  createdAt: "2026-11-05T10:00:00.000Z",
  ...over,
});

const NOV = { start: "2026-11-01", end: "2026-11-30" };

describe("transactionsInRange", () => {
  it("bierze obie granice włącznie i pomija resztę", () => {
    const list = [
      tx({ date: "2026-10-31" }),
      tx({ date: "2026-11-01" }),
      tx({ date: "2026-11-30" }),
      tx({ date: "2026-12-01" }),
    ];
    expect(transactionsInRange(list, NOV).map((t) => t.date)).toEqual(["2026-11-01", "2026-11-30"]);
  });
});

describe("aggregateByDay", () => {
  it("zwraca każdy dzień cyklu, także dni bez operacji", () => {
    const days = aggregateByDay([], NOV);
    expect(days).toHaveLength(30);
    expect(days[0]).toEqual({ date: "2026-11-01", day: 1, income: 0, expense: 0 });
    expect(days[29].date).toBe("2026-11-30");
  });

  it("sumuje przychody i wydatki osobno dla każdego dnia", () => {
    const days = aggregateByDay(
      [
        tx({ date: "2026-11-05", amount: 12.5 }),
        tx({ date: "2026-11-05", amount: 7.5 }),
        tx({ date: "2026-11-05", type: "income", incomeKind: "salary", amount: 5000 }),
        tx({ date: "2026-11-06", amount: 3 }),
      ],
      NOV,
    );
    expect(days[4]).toMatchObject({ date: "2026-11-05", income: 5000, expense: 20 });
    expect(days[5]).toMatchObject({ income: 0, expense: 3 });
  });

  it("zaokrągla sumy do 2 miejsc (bez błędów float)", () => {
    const days = aggregateByDay([tx({ amount: 0.1 }), tx({ amount: 0.2 })], NOV);
    expect(days[4].expense).toBe(0.3);
  });

  it("pomija operacje spoza cyklu", () => {
    const days = aggregateByDay([tx({ date: "2026-12-01", amount: 99 })], NOV);
    expect(days.every((d) => d.expense === 0)).toBe(true);
  });

  it("obsługuje cykl przez przełom miesięcy i roku", () => {
    const days = aggregateByDay([], { start: "2026-12-15", end: "2027-01-14" });
    expect(days).toHaveLength(31);
    expect(days[17]).toMatchObject({ date: "2027-01-01", day: 1 });
  });

  it("obsługuje cykl jednodniowy i odwrócony przedział", () => {
    expect(aggregateByDay([], { start: "2026-11-30", end: "2026-11-30" })).toHaveLength(1);
    expect(aggregateByDay([], { start: "2026-11-30", end: "2026-11-01" })).toEqual([]);
  });
});

describe("aggregateByCategory — wydatki", () => {
  const categories: Category[] = [...DEFAULT_CATEGORIES];

  it("pusta lista dla braku wydatków (przychody się nie liczą)", () => {
    expect(aggregateByCategory([], NOV, categories, "expense")).toEqual([]);
    expect(
      aggregateByCategory(
        [tx({ type: "income", incomeKind: "bonus", categoryId: "cat-income-bonus" })],
        NOV,
        categories,
        "expense",
      ),
    ).toEqual([]);
  });

  it("grupuje wg kategorii, sortuje malejąco i liczy udział", () => {
    const slices = aggregateByCategory(
      [
        tx({ categoryId: "cat-expense-food", amount: 30 }),
        tx({ categoryId: "cat-expense-food", amount: 30 }),
        tx({ categoryId: "cat-expense-transport", amount: 40 }),
      ],
      NOV,
      categories,
      "expense",
    );
    expect(slices.map((s) => [s.categoryId, s.amount])).toEqual([
      ["cat-expense-food", 60],
      ["cat-expense-transport", 40],
    ]);
    expect(slices[0]).toMatchObject({ name: "Jedzenie", color: "#f97316", icon: "Utensils" });
    expect(slices[0].share).toBeCloseTo(0.6);
    expect(slices.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1);
  });

  it("przy równych kwotach sortuje po nazwie (stabilna kolejność kolorów)", () => {
    const slices = aggregateByCategory(
      [
        tx({ categoryId: "cat-expense-transport", amount: 10 }),
        tx({ categoryId: "cat-expense-food", amount: 10 }),
      ],
      NOV,
      categories,
      "expense",
    );
    expect(slices.map((s) => s.name)).toEqual(["Jedzenie", "Transport"]);
  });

  it("nieznaną kategorię dolicza do „Inne wydatki”", () => {
    const slices = aggregateByCategory(
      [
        tx({ categoryId: "usunieta", amount: 5 }),
        tx({ categoryId: FALLBACK_CATEGORY_ID.expense, amount: 5 }),
      ],
      NOV,
      categories,
      "expense",
    );
    expect(slices).toHaveLength(1);
    expect(slices[0]).toMatchObject({ categoryId: FALLBACK_CATEGORY_ID.expense, name: "Inne wydatki", amount: 10 });
  });

  it("używa koloru kategorii własnej", () => {
    const custom: Category = {
      id: "c1",
      name: "Kot",
      type: "expense",
      icon: "PawPrint",
      color: "#a855f7",
      isDefault: false,
    };
    const slices = aggregateByCategory([tx({ categoryId: "c1" })], NOV, [...categories, custom], "expense");
    expect(slices[0]).toMatchObject({ name: "Kot", color: "#a855f7", share: 1 });
  });

  it("pomija wydatki spoza cyklu", () => {
    expect(aggregateByCategory([tx({ date: "2026-10-31" })], NOV, categories, "expense")).toEqual([]);
  });
});

describe("aggregateByCategory — przychody", () => {
  const categories: Category[] = [...DEFAULT_CATEGORIES];
  const inc = (over: Partial<Transaction> = {}) =>
    tx({ type: "income", incomeKind: "bonus", categoryId: "cat-income-bonus", ...over });

  it("kilka kategorii: grupuje, sortuje malejąco i liczy udział (wydatki się nie liczą)", () => {
    const slices = aggregateByCategory(
      [
        inc({ categoryId: "cat-income-salary", incomeKind: "salary", amount: 5400 }),
        inc({ categoryId: "cat-income-freelance", amount: 1000 }),
        inc({ categoryId: "cat-income-freelance", amount: 600 }),
        inc({ categoryId: "cat-income-bonus", amount: 1000 }),
        tx({ categoryId: "cat-expense-food", amount: 9999 }),
      ],
      NOV,
      categories,
      "income",
    );
    expect(slices.map((s) => [s.categoryId, s.amount])).toEqual([
      ["cat-income-salary", 5400],
      ["cat-income-freelance", 1600],
      ["cat-income-bonus", 1000],
    ]);
    expect(slices[0]).toMatchObject({ name: "Wynagrodzenie", color: "#22c55e", icon: "Wallet" });
    expect(slices[0].share).toBeCloseTo(0.675);
    expect(slices[1].share).toBeCloseTo(0.2);
    expect(slices[2].share).toBeCloseTo(0.125);
    expect(slices.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1);
  });

  it("jedna kategoria ma 100% udziału", () => {
    const slices = aggregateByCategory(
      [
        inc({ categoryId: "cat-income-salary", incomeKind: "salary", amount: 2700 }),
        inc({ categoryId: "cat-income-salary", incomeKind: "salary", date: "2026-11-25", amount: 2700 }),
      ],
      NOV,
      categories,
      "income",
    );
    expect(slices).toHaveLength(1);
    expect(slices[0]).toMatchObject({ categoryId: "cat-income-salary", amount: 5400, share: 1 });
  });

  it("kwoty z groszami sumuje i zaokrągla do 2 miejsc (bez błędów float)", () => {
    const slices = aggregateByCategory(
      [
        inc({ categoryId: "cat-income-freelance", amount: 1629.01 }),
        inc({ categoryId: "cat-income-freelance", amount: 0.1 }),
        inc({ categoryId: "cat-income-freelance", amount: 0.2 }),
        inc({ categoryId: "cat-income-bonus", amount: 350.55 }),
      ],
      NOV,
      categories,
      "income",
    );
    expect(slices.map((s) => s.amount)).toEqual([1629.31, 350.55]);
    expect(slices[0].share).toBeCloseTo(1629.31 / 1979.86, 10);
  });

  it("brak przychodów w cyklu daje pustą listę", () => {
    expect(aggregateByCategory([], NOV, categories, "income")).toEqual([]);
    expect(aggregateByCategory([tx({ amount: 50 })], NOV, categories, "income")).toEqual([]);
    expect(aggregateByCategory([inc({ date: "2026-10-31" })], NOV, categories, "income")).toEqual([]);
  });

  it("nieznaną kategorię dolicza do „Inne przychody”", () => {
    const slices = aggregateByCategory(
      [inc({ categoryId: "usunieta", amount: 20 }), inc({ categoryId: FALLBACK_CATEGORY_ID.income, amount: 5 })],
      NOV,
      categories,
      "income",
    );
    expect(slices).toEqual([
      expect.objectContaining({ categoryId: FALLBACK_CATEGORY_ID.income, name: "Inne przychody", amount: 25, share: 1 }),
    ]);
  });
});
