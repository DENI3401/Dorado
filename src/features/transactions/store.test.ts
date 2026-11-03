import { beforeEach, describe, expect, it } from "vitest";
import { useCategoriesStore } from "@/features/categories/store";
import { FALLBACK_CATEGORY_ID } from "@/features/categories/defaultCategories";
import { deleteCategory } from "./actions";
import { useTransactionsStore } from "./store";
import type { TransactionFormValues } from "./schema";

const values = (over: Partial<TransactionFormValues> = {}): TransactionFormValues => ({
  type: "expense",
  amount: 20,
  categoryId: "cat-expense-food",
  date: "2026-11-03",
  note: "",
  ...over,
});

beforeEach(() => {
  useTransactionsStore.setState({ transactions: [] });
  useCategoriesStore.setState({ customCategories: [] });
});

describe("useTransactionsStore", () => {
  it("dodaje, edytuje i usuwa operację", () => {
    const { addTransaction, updateTransaction, removeTransaction } = useTransactionsStore.getState();
    const t = addTransaction(values());
    expect(useTransactionsStore.getState().transactions).toHaveLength(1);
    expect(updateTransaction(t.id, values({ amount: 35 }))?.amount).toBe(35);
    expect(removeTransaction(t.id)?.id).toBe(t.id);
    expect(useTransactionsStore.getState().transactions).toHaveLength(0);
  });

  it("przychód dostaje incomeKind, wydatek — null", () => {
    const { addTransaction } = useTransactionsStore.getState();
    expect(addTransaction(values()).incomeKind).toBeNull();
    const inc = addTransaction(values({ type: "income", incomeKind: "salary", categoryId: "cat-income-salary" }));
    expect(inc.incomeKind).toBe("salary");
  });

  it("restoreTransaction cofa usunięcie i nie duplikuje", () => {
    const { addTransaction, removeTransaction, restoreTransaction } = useTransactionsStore.getState();
    const t = addTransaction(values());
    const removed = removeTransaction(t.id)!;
    restoreTransaction(removed);
    restoreTransaction(removed);
    expect(useTransactionsStore.getState().transactions).toHaveLength(1);
  });

  it("operacje na nieistniejącym id zwracają null", () => {
    const s = useTransactionsStore.getState();
    expect(s.updateTransaction("nope", values())).toBeNull();
    expect(s.removeTransaction("nope")).toBeNull();
  });
});

describe("deleteCategory", () => {
  it("przenosi operacje do kategorii zapasowej", () => {
    const cat = useCategoriesStore.getState().addCategory({
      name: "Siłownia", type: "expense", icon: "Dumbbell", color: "#22c55e",
    });
    useTransactionsStore.getState().addTransaction(values({ categoryId: cat.id }));
    const r = deleteCategory(cat.id);
    expect(r.ok && r.reassigned).toBe(1);
    expect(useTransactionsStore.getState().transactions[0].categoryId).toBe(FALLBACK_CATEGORY_ID.expense);
    expect(useCategoriesStore.getState().customCategories).toHaveLength(0);
  });

  it("nie usuwa kategorii domyślnych", () => {
    expect(deleteCategory("cat-expense-food")).toEqual({ ok: false, reason: "not_found" });
  });
});
