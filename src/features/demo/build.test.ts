import { describe, expect, it } from "vitest";
import { backupDataSchema, type BackupData } from "@/features/backup/schema";
import { DEFAULT_SETTINGS } from "@/features/settings/types";
import type { Transaction } from "@/features/transactions/types";
import { buildDemoData, countDemoData, hasDemoData, isDemoTransaction, removeDemoData } from "./build";
import { getDemoFile } from "./demoFile";
import { clearedDemoMessage, confirmClearDemoText, demoContentsText } from "./messages";
import { demoFileSchema } from "./schema";
import { simulateFirstLaunch } from "./simulate";

const TODAY = "2026-11-28";
const file = getDemoFile();

const asBackup = (state: Omit<BackupData, "settings" | "alerts" | "subscriptionSync"> & Partial<BackupData>): BackupData => ({
  settings: DEFAULT_SETTINGS,
  alerts: { lowBalanceAlertTriggered: false, alertCycleStart: null },
  subscriptionSync: {},
  ...state,
});

describe("plik src/data/mock.json", () => {
  it("ma poprawną strukturę", () => {
    expect(demoFileSchema.safeParse(file).success).toBe(true);
  });

  it("wszystkie id są unikalne", () => {
    const ids = [
      ...file.categories,
      ...file.recurringIncomes,
      ...file.subscriptions,
      ...file.incomes,
      ...file.expenses,
    ].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("odrzuca operację w przyszłości i id bez prefiksu demo-", () => {
    const future = { ...file, expenses: [{ ...file.expenses[0], date: { monthsAgo: 0, day: 1 } }] };
    expect(demoFileSchema.safeParse(future).success).toBe(false);
    const noPrefix = { ...file, expenses: [{ ...file.expenses[0], id: "exp-1" }] };
    expect(demoFileSchema.safeParse(noPrefix).success).toBe(false);
  });
});

describe("buildDemoData", () => {
  const demo = buildDemoData(file, TODAY);

  it("zamienia rekordy z pliku na dane magazynów", () => {
    expect(demo.customCategories).toHaveLength(3);
    expect(demo.recurringIncomes).toHaveLength(2);
    expect(demo.subscriptions).toHaveLength(9);
    expect(demo.transactions).toHaveLength(file.incomes.length + file.expenses.length);
    expect(demo.customCategories.every((c) => c.isDefault === false)).toBe(true);
    expect(demo.recurringIncomes.every((r) => r.generatedThrough === null && r.period === "monthly")).toBe(true);
  });

  it("jest powtarzalne dla tej samej daty", () => {
    expect(buildDemoData(file, TODAY)).toEqual(demo);
  });

  it("operacje: najnowsze na początku, żadna w przyszłości, najnowsza z dzisiaj", () => {
    const dates = demo.transactions.map((t) => t.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(dates[0]).toBe(TODAY);
    expect(dates.every((d) => d <= TODAY)).toBe(true);
  });

  it("zachowuje powiązania z subskrypcją i wynagrodzeniem", () => {
    const disney = demo.transactions.filter((t) => t.subscriptionId === "demo-sub-disney");
    const scholarship = demo.transactions.filter((t) => t.recurringIncomeId === "demo-rec-scholarship");
    expect(disney.map((t) => t.date)).toEqual(["2026-09-08", "2026-08-08"]);
    expect(scholarship.map((t) => t.date)).toEqual(["2026-09-25", "2026-08-25"]);
    // Pole opcjonalne pojawia się tylko tam, gdzie jest powiązanie.
    expect(demo.transactions.find((t) => t.id === "demo-exp-001")).not.toHaveProperty("subscriptionId");
  });

  it("subskrypcja „na 31.” zaczyna się 31. dnia, a zakończona ma datę końca", () => {
    const rent = demo.subscriptions.find((s) => s.id === "demo-sub-rent");
    const max = demo.subscriptions.find((s) => s.id === "demo-sub-max");
    expect(rent?.startDate).toBe("2026-08-31");
    expect(max?.endDate).toBe("2026-10-20");
  });

  it("przechodzi walidację kopii zapasowej (F14) dla każdego dnia 2026–2028", () => {
    const failures: string[] = [];
    for (let i = 0; i < 3 * 366; i += 1) {
      const day = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      if (day > "2028-12-31") break;
      const result = backupDataSchema.safeParse(asBackup(buildDemoData(file, day)));
      if (!result.success) failures.push(`${day}: ${result.error.issues[0].message}`);
    }
    expect(failures).toEqual([]);
  });
});

describe("dane demo pokazują wszystkie funkcje", () => {
  const demo = buildDemoData(file, TODAY);
  const incomes = demo.transactions.filter((t) => t.type === "income");
  const expenses = demo.transactions.filter((t) => t.type === "expense");

  it("subskrypcje: miesięczne i roczna, aktywne, wstrzymana, zakończona, płatność 31. dnia", () => {
    const subs = demo.subscriptions;
    expect(subs.some((s) => s.period === "yearly")).toBe(true);
    expect(subs.some((s) => s.period === "monthly")).toBe(true);
    expect(subs.some((s) => !s.isActive)).toBe(true);
    expect(subs.some((s) => s.isActive && s.endDate !== null && s.endDate < TODAY)).toBe(true);
    expect(subs.some((s) => s.startDate.endsWith("-31"))).toBe(true);
    expect(subs.some((s) => s.categoryId.startsWith("demo-"))).toBe(true);
  });

  it("wynagrodzenia stałe: aktywne i wstrzymane (z historią wpływów)", () => {
    expect(demo.recurringIncomes.some((r) => r.isActive)).toBe(true);
    expect(demo.recurringIncomes.some((r) => !r.isActive)).toBe(true);
    expect(incomes.some((t) => t.recurringIncomeId !== undefined)).toBe(true);
  });

  it("przychody obu rodzajów, w kilku kategoriach (także własnej)", () => {
    expect(new Set(incomes.map((t) => t.incomeKind))).toEqual(new Set(["salary", "bonus"]));
    expect(new Set(incomes.map((t) => t.categoryId)).size).toBeGreaterThanOrEqual(4);
    expect(incomes.some((t) => t.categoryId === "demo-cat-sales")).toBe(true);
  });

  it("wydatki w każdej kategorii domyślnej i własnej", () => {
    const used = new Set([...expenses.map((t) => t.categoryId), ...demo.subscriptions.map((s) => s.categoryId)]);
    for (const id of [
      "cat-expense-food",
      "cat-expense-transport",
      "cat-expense-housing",
      "cat-expense-bills",
      "cat-expense-entertainment",
      "cat-expense-health",
      "cat-expense-shopping",
      "cat-expense-subscriptions",
      "cat-expense-other",
      "demo-cat-coffee",
      "demo-cat-sport",
    ]) {
      expect(used, id).toContain(id);
    }
  });

  it("każda kategoria własna jest w użyciu", () => {
    const used = new Set([
      ...demo.transactions.map((t) => t.categoryId),
      ...demo.subscriptions.map((s) => s.categoryId),
    ]);
    expect(demo.customCategories.every((c) => used.has(c.id))).toBe(true);
  });
});

describe("countDemoData / hasDemoData", () => {
  it("liczy rekordy demo, także płatności wygenerowane z subskrypcji demo", () => {
    const state = simulateFirstLaunch(TODAY);
    const counts = countDemoData(state);
    expect(counts).toEqual({ transactions: 113, subscriptions: 9, recurringIncomes: 2, customCategories: 3 });
    expect(hasDemoData(counts)).toBe(true);
    expect(hasDemoData({ transactions: 0, subscriptions: 0, recurringIncomes: 0, customCategories: 0 })).toBe(false);
  });

  it("operacja użytkownika nie jest operacją demo", () => {
    const own: Transaction = {
      id: "6f1c2c5e-0000-4000-8000-000000000001",
      type: "expense",
      incomeKind: null,
      amount: 10,
      categoryId: "cat-expense-food",
      date: TODAY,
      note: "",
      createdAt: "2026-11-28T10:00:00.000Z",
    };
    expect(isDemoTransaction(own)).toBe(false);
    expect(isDemoTransaction({ ...own, subscriptionId: "demo-sub-rent" })).toBe(true);
  });
});

describe("removeDemoData", () => {
  const launched = simulateFirstLaunch(TODAY);
  const ownExpense: Transaction = {
    id: "own-1",
    type: "expense",
    incomeKind: null,
    amount: 25,
    categoryId: "demo-cat-coffee",
    date: TODAY,
    note: "Moja kawa",
    createdAt: "2026-11-28T10:00:00.000Z",
  };
  const ownIncome: Transaction = {
    ...ownExpense,
    id: "own-2",
    type: "income",
    incomeKind: "bonus",
    amount: 300,
    categoryId: "demo-cat-sales",
    note: "Sprzedaż płyt",
  };
  const ownSubscription = {
    ...launched.subscriptions[0],
    id: "own-sub",
    name: "Moja siłownia",
    categoryId: "demo-cat-sport",
  };
  const data = asBackup({
    ...launched,
    transactions: [ownExpense, ownIncome, ...launched.transactions],
    subscriptions: [ownSubscription, ...launched.subscriptions],
    subscriptionSync: { ...launched.subscriptionSync, "own-sub": TODAY },
    settings: { cycleStartDay: 10, lowBalanceThreshold: 900 },
  });
  const result = removeDemoData(data);

  it("usuwa rekordy demo i płatności wygenerowane z nich", () => {
    expect(countDemoData(result.data)).toEqual({
      transactions: 0,
      subscriptions: 0,
      recurringIncomes: 0,
      customCategories: 0,
    });
    expect(result.removed).toEqual({ transactions: 113, subscriptions: 9, recurringIncomes: 2, customCategories: 3 });
  });

  it("zostawia dane użytkownika i przenosi je z kategorii demo do „Inne”", () => {
    expect(result.data.transactions.map((t) => [t.id, t.categoryId])).toEqual([
      ["own-1", "cat-expense-other"],
      ["own-2", "cat-income-other"],
    ]);
    expect(result.data.subscriptions.map((s) => [s.id, s.categoryId])).toEqual([["own-sub", "cat-expense-other"]]);
    expect(result.reassigned).toBe(3);
  });

  it("czyści znaczniki synchronizacji subskrypcji demo, a ustawień nie rusza", () => {
    expect(result.data.subscriptionSync).toEqual({ "own-sub": TODAY });
    expect(result.data.settings).toEqual({ cycleStartDay: 10, lowBalanceThreshold: 900 });
  });

  it("wynik jest poprawną kopią (F14), a ponowne czyszczenie niczego nie zmienia", () => {
    expect(backupDataSchema.safeParse(result.data).success).toBe(true);
    const again = removeDemoData(result.data);
    expect(again.data).toEqual(result.data);
    expect(hasDemoData(again.removed)).toBe(false);
  });
});

describe("komunikaty", () => {
  it("wylicza zawartość i pomija zera", () => {
    expect(
      demoContentsText({ transactions: 113, subscriptions: 9, recurringIncomes: 2, customCategories: 3 }),
    ).toBe("113 transakcji, 9 subskrypcji, 2 wynagrodzenia stałe i 3 kategorie własne");
    expect(demoContentsText({ transactions: 1, subscriptions: 0, recurringIncomes: 0, customCategories: 0 })).toBe(
      "1 transakcja",
    );
    expect(demoContentsText({ transactions: 2, subscriptions: 1, recurringIncomes: 0, customCategories: 0 })).toBe(
      "2 transakcje i 1 subskrypcja",
    );
  });

  it("treść potwierdzenia i toastu", () => {
    expect(
      confirmClearDemoText({ transactions: 5, subscriptions: 0, recurringIncomes: 0, customCategories: 0 }),
    ).toBe(
      "Usuniemy przykładowe dane: 5 transakcji. Twoje własne operacje zostaną — jeśli używają kategorii demo, trafią do kategorii „Inne”.",
    );
    expect(clearedDemoMessage(0)).toBe("Usunięto dane demo");
    expect(clearedDemoMessage(3)).toBe("Usunięto dane demo. Przeniesiono do kategorii „Inne”: 3 Twoje rekordy");
  });
});
