import { beforeEach, describe, expect, it } from "vitest";
import { useCategoriesStore } from "@/features/categories/store";
import { deleteCategory } from "@/features/transactions/actions";
import { useRecurringIncomeStore } from "./store";
import type { NewRecurringIncome } from "./types";

const values = (over: Partial<NewRecurringIncome> = {}): NewRecurringIncome => ({
  amount: 6500,
  categoryId: "cat-income-salary",
  startDate: "2026-11-10",
  note: "Pensja",
  ...over,
});

beforeEach(() => {
  useRecurringIncomeStore.setState({ recurringIncomes: [] });
  useCategoriesStore.setState({ customCategories: [] });
});

describe("useRecurringIncomeStore", () => {
  it("dodaje wynagrodzenie jako aktywne, miesięczne, bez końca i jeszcze nierozliczone", () => {
    const r = useRecurringIncomeStore.getState().addRecurringIncome(values());
    expect(r.isActive).toBe(true);
    expect(r.period).toBe("monthly");
    expect(r.endDate).toBeNull();
    expect(r.generatedThrough).toBeNull();
    expect(useRecurringIncomeStore.getState().recurringIncomes).toHaveLength(1);
  });

  it("usuwa i przywraca (Undo) bez duplikatu", () => {
    const { addRecurringIncome, removeRecurringIncome, restoreRecurringIncome } =
      useRecurringIncomeStore.getState();
    const r = addRecurringIncome(values());
    const removed = removeRecurringIncome(r.id)!;
    expect(useRecurringIncomeStore.getState().recurringIncomes).toHaveLength(0);
    restoreRecurringIncome(removed);
    restoreRecurringIncome(removed);
    expect(useRecurringIncomeStore.getState().recurringIncomes).toHaveLength(1);
  });

  it("removeRecurringIncome zwraca null dla nieznanego id", () => {
    expect(useRecurringIncomeStore.getState().removeRecurringIncome("nope")).toBeNull();
  });

  it("setActive wstrzymuje i wznawia", () => {
    const { addRecurringIncome, setActive } = useRecurringIncomeStore.getState();
    const r = addRecurringIncome(values());
    expect(setActive(r.id, false)?.isActive).toBe(false);
    expect(setActive(r.id, true)?.isActive).toBe(true);
    expect(setActive("nope", true)).toBeNull();
  });

  it("markGenerated zapisuje „rozliczone do”, a gdy nic się nie zmienia — nie zmienia stanu", () => {
    const r = useRecurringIncomeStore.getState().addRecurringIncome(values());
    useRecurringIncomeStore.getState().markGenerated({ [r.id]: "2026-11-15" });
    expect(useRecurringIncomeStore.getState().recurringIncomes[0].generatedThrough).toBe(
      "2026-11-15",
    );

    const before = useRecurringIncomeStore.getState();
    useRecurringIncomeStore.getState().markGenerated({ [r.id]: "2026-11-15" });
    expect(useRecurringIncomeStore.getState()).toBe(before);
  });

  it("markGenerated pomija nieznane id", () => {
    const before = useRecurringIncomeStore.getState();
    useRecurringIncomeStore.getState().markGenerated({ unknown: "2026-11-15" });
    expect(useRecurringIncomeStore.getState()).toBe(before);
  });
});

describe("usuwanie kategorii a wynagrodzenia cykliczne", () => {
  it("przepina wynagrodzenie z usuwanej kategorii na „Inne przychody”", () => {
    const category = useCategoriesStore
      .getState()
      .addCategory({ name: "Etat 2", type: "income", icon: "Wallet", color: "#22c55e" });
    const r = useRecurringIncomeStore
      .getState()
      .addRecurringIncome(values({ categoryId: category.id }));

    const result = deleteCategory(category.id);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reassignedRecurringIncomes).toBe(1);
    expect(
      useRecurringIncomeStore.getState().recurringIncomes.find((x) => x.id === r.id)?.categoryId,
    ).toBe("cat-income-other");
  });
});
