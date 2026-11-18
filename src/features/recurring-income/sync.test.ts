import { beforeEach, describe, expect, it } from "vitest";
import { useTransactionsStore } from "@/features/transactions/store";
import { syncRecurringIncome } from "./sync";
import { useRecurringIncomeStore } from "./store";

const transactions = () => useTransactionsStore.getState().transactions;
const rules = () => useRecurringIncomeStore.getState().recurringIncomes;

const addSalary = (startDate = "2026-09-10") =>
  useRecurringIncomeStore.getState().addRecurringIncome({
    amount: 6500,
    categoryId: "cat-income-salary",
    startDate,
    note: "Pensja",
  });

beforeEach(() => {
  useTransactionsStore.setState({ transactions: [] });
  useRecurringIncomeStore.setState({ recurringIncomes: [] });
});

describe("syncRecurringIncome", () => {
  it("dopisuje wpływy do historii i zapisuje „rozliczone do”", () => {
    addSalary();
    expect(syncRecurringIncome("2026-11-10")).toBe(3);
    expect(transactions().map((t) => t.date).sort()).toEqual([
      "2026-09-10",
      "2026-10-10",
      "2026-11-10",
    ]);
    expect(transactions().every((t) => t.type === "income" && t.incomeKind === "salary")).toBe(true);
    expect(rules()[0].generatedThrough).toBe("2026-11-10");
  });

  it("ponowne wywołanie nie tworzy duplikatów", () => {
    addSalary();
    syncRecurringIncome("2026-11-10");
    expect(syncRecurringIncome("2026-11-10")).toBe(0);
    expect(transactions()).toHaveLength(3);
  });

  it("w kolejnym cyklu dopisuje tylko nowy wpływ", () => {
    addSalary();
    syncRecurringIncome("2026-11-10");
    expect(syncRecurringIncome("2026-12-10")).toBe(1);
    expect(transactions()).toHaveLength(4);
  });

  it("ręcznie usunięty wpływ nie wraca po ponownej synchronizacji", () => {
    addSalary();
    syncRecurringIncome("2026-11-10");
    const october = transactions().find((t) => t.date === "2026-10-10")!;
    useTransactionsStore.getState().removeTransaction(october.id);
    syncRecurringIncome("2026-11-20");
    expect(transactions().some((t) => t.date === "2026-10-10")).toBe(false);
    expect(transactions()).toHaveLength(2);
  });

  it("wstrzymane wynagrodzenie nic nie księguje, a po wznowieniu nie wracają wpływy z pauzy", () => {
    const r = addSalary("2026-11-10");
    useRecurringIncomeStore.getState().setActive(r.id, false);
    expect(syncRecurringIncome("2027-01-05")).toBe(0);
    useRecurringIncomeStore.getState().setActive(r.id, true);
    expect(syncRecurringIncome("2027-01-12")).toBe(1);
    expect(transactions().map((t) => t.date)).toEqual(["2027-01-10"]);
  });

  it("subskrypcja na magazyn (jak w AppLayout) nie wpada w pętlę i nie dubluje wpływów", () => {
    const unsubscribe = useRecurringIncomeStore.subscribe(() => {
      syncRecurringIncome("2026-11-10");
    });
    addSalary(); // zmiana magazynu → sync → markGenerated → kolejna zmiana → sync (bez efektu)
    unsubscribe();
    expect(transactions()).toHaveLength(3);
    expect(rules()[0].generatedThrough).toBe("2026-11-10");
  });

  it("nie rusza cudzych transakcji i nie dubluje wpływu dodanego ręcznie z tym samym id wynagrodzenia i datą", () => {
    const r = addSalary("2026-11-10");
    useTransactionsStore.setState({
      transactions: [
        {
          id: "manual",
          type: "income",
          incomeKind: "salary",
          amount: 6500,
          categoryId: "cat-income-salary",
          date: "2026-11-10",
          note: "Pensja",
          createdAt: "2026-11-10T07:00:00.000Z",
          recurringIncomeId: r.id,
        },
      ],
    });
    expect(syncRecurringIncome("2026-11-10")).toBe(0);
    expect(transactions()).toHaveLength(1);
  });
});
