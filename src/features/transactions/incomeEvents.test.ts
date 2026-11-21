import { beforeEach, describe, expect, it } from "vitest";
import { useRecurringIncomeStore } from "@/features/recurring-income/store";
import { syncRecurringIncome } from "@/features/recurring-income/sync";
import { findNewIncome, onNewIncome } from "./incomeEvents";
import { useTransactionsStore } from "./store";
import type { TransactionFormValues } from "./schema";
import type { Transaction } from "./types";

const NOW = new Date("2026-11-10T12:00:00.000Z");

function tx(over: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1",
    type: "income",
    incomeKind: "bonus",
    amount: 100,
    categoryId: "cat-income-bonus",
    date: "2026-11-10",
    note: "",
    createdAt: NOW.toISOString(),
    ...over,
  };
}

const values = (over: Partial<TransactionFormValues> = {}): TransactionFormValues => ({
  type: "income",
  incomeKind: "bonus",
  amount: 500,
  categoryId: "cat-income-bonus",
  date: "2026-11-10",
  note: "",
  ...over,
});

describe("findNewIncome", () => {
  it("zwraca tylko nowe przychody (po id)", () => {
    const old = tx({ id: "old" });
    const added = tx({ id: "new" });
    expect(findNewIncome([old], [added, old], NOW)).toEqual([added]);
  });

  it("pomija wydatki", () => {
    const expense = tx({ id: "e", type: "expense", incomeKind: null });
    expect(findNewIncome([], [expense], NOW)).toEqual([]);
  });

  it("pomija stare operacje (wczytanie danych, import, Undo)", () => {
    const restored = tx({ id: "r", createdAt: "2026-10-01T00:00:00.000Z" });
    expect(findNewIncome([], [restored], NOW)).toEqual([]);
  });

  it("dla tej samej tablicy nic nie zwraca", () => {
    const list = [tx()];
    expect(findNewIncome(list, list, NOW)).toEqual([]);
  });
});

describe("onNewIncome", () => {
  beforeEach(() => {
    useTransactionsStore.setState({ transactions: [] });
    useRecurringIncomeStore.setState({ recurringIncomes: [] });
  });

  it("powiadamia o przychodzie dodanym z formularza", () => {
    const seen: number[] = [];
    const off = onNewIncome((income) => seen.push(income.length));
    useTransactionsStore.getState().addTransaction(values());
    off();
    expect(seen).toEqual([1]);
  });

  it("nie powiadamia o wydatku", () => {
    let calls = 0;
    const off = onNewIncome(() => (calls += 1));
    useTransactionsStore
      .getState()
      .addTransaction(values({ type: "expense", incomeKind: undefined, categoryId: "cat-expense-food" }));
    off();
    expect(calls).toBe(0);
  });

  it("nie powiadamia o cofnięciu usunięcia starego przychodu", () => {
    const { addTransaction, removeTransaction, restoreTransaction } = useTransactionsStore.getState();
    const t = addTransaction(values());
    const removed = removeTransaction(t.id)!;
    // „stary” przychód: utworzony dawno temu
    const old = { ...removed, createdAt: "2026-01-01T00:00:00.000Z" };
    let calls = 0;
    const off = onNewIncome(() => (calls += 1));
    restoreTransaction(old);
    off();
    expect(calls).toBe(0);
  });

  it("powiadamia o wynagrodzeniu zaksięgowanym automatycznie", () => {
    useRecurringIncomeStore.getState().addRecurringIncome({
      amount: 6500,
      categoryId: "cat-income-salary",
      startDate: "2026-11-10",
      note: "Pensja",
    });
    const seen: string[] = [];
    const off = onNewIncome((income) => seen.push(...income.map((t) => t.date)));
    syncRecurringIncome("2026-11-10");
    off();
    expect(seen).toEqual(["2026-11-10"]);
  });

  it("po odpięciu nie powiadamia", () => {
    let calls = 0;
    const off = onNewIncome(() => (calls += 1));
    off();
    useTransactionsStore.getState().addTransaction(values());
    expect(calls).toBe(0);
  });
});
