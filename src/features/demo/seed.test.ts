import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAlertStore } from "@/features/alerts/store";
import { collectBackupData } from "@/features/backup/backup";
import { useCategoriesStore } from "@/features/categories/store";
import { syncRecurringIncome } from "@/features/recurring-income/sync";
import { useRecurringIncomeStore } from "@/features/recurring-income/store";
import { useSettingsStore } from "@/features/settings/store";
import { DEFAULT_SETTINGS } from "@/features/settings/types";
import { nextOccurrence } from "@/features/subscriptions/schedule";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { deleteCategory } from "@/features/transactions/actions";
import { useTransactionsStore } from "@/features/transactions/store";
import type { Transaction } from "@/features/transactions/types";
import { syncSubscriptionPayments } from "@/hooks/useSyncSubscriptionPayments";
import { buildDemoData, countDemoData, hasDemoData } from "./build";
import { getDemoFile } from "./demoFile";
import { areDataStoresEmpty, clearDemoData, seedDemoDataOnFirstRun, undoClearDemoData } from "./seed";
import { DEMO_STORAGE_KEY, readDemoState } from "./storage";

/** Prosty localStorage w pamięci (testy działają w środowisku node). */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, String(value)),
  };
}

const TODAY = "2026-11-28";

const ownExpense: Transaction = {
  id: "0b6a9b1e-1111-4111-8111-111111111111",
  type: "expense",
  incomeKind: null,
  amount: 42,
  categoryId: "cat-expense-food",
  date: TODAY,
  note: "Moje zakupy",
  createdAt: "2026-11-28T09:00:00.000Z",
};

function resetStores() {
  useTransactionsStore.setState({ transactions: [] });
  useCategoriesStore.setState({ customCategories: [] });
  useSubscriptionsStore.setState({ subscriptions: [] });
  useRecurringIncomeStore.setState({ recurringIncomes: [] });
  useSettingsStore.setState({ ...DEFAULT_SETTINGS });
  useAlertStore.setState({ lowBalanceAlertTriggered: false, alertCycleStart: null });
}

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
  resetStores();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("seedDemoDataOnFirstRun — pierwsze uruchomienie", () => {
  it("puste magazyny → wczytuje demo i zapisuje znacznik", () => {
    const result = seedDemoDataOnFirstRun(TODAY);
    expect(result).toEqual({
      status: "seeded",
      counts: { transactions: 83, subscriptions: 9, recurringIncomes: 2, customCategories: 3 },
    });
    const expected = buildDemoData(getDemoFile(), TODAY);
    expect(useTransactionsStore.getState().transactions).toEqual(expected.transactions);
    expect(useSubscriptionsStore.getState().subscriptions).toEqual(expected.subscriptions);
    expect(useRecurringIncomeStore.getState().recurringIncomes).toEqual(expected.recurringIncomes);
    expect(useCategoriesStore.getState().customCategories).toEqual(expected.customCategories);
    expect(readDemoState()).toEqual({ status: "seeded", date: TODAY });
  });

  it("nie zmienia ustawień ani flagi alertu", () => {
    useSettingsStore.setState({ cycleStartDay: 15, lowBalanceThreshold: 1200 });
    useAlertStore.setState({ lowBalanceAlertTriggered: true, alertCycleStart: "2026-11-15" });
    seedDemoDataOnFirstRun(TODAY);
    expect(useSettingsStore.getState().cycleStartDay).toBe(15);
    expect(useSettingsStore.getState().lowBalanceThreshold).toBe(1200);
    expect(useAlertStore.getState().lowBalanceAlertTriggered).toBe(true);
  });

  it("są dane użytkownika → nic nie wczytuje i zapamiętuje decyzję", () => {
    useTransactionsStore.setState({ transactions: [ownExpense] });
    expect(seedDemoDataOnFirstRun(TODAY)).toEqual({ status: "skipped", reason: "has-data" });
    expect(useTransactionsStore.getState().transactions).toEqual([ownExpense]);
    expect(readDemoState()).toEqual({ status: "skipped", date: TODAY });

    // Nawet gdy użytkownik potem usunie wszystko, demo już się nie pojawi.
    resetStores();
    expect(seedDemoDataOnFirstRun(TODAY)).toEqual({ status: "skipped", reason: "already-done" });
    expect(areDataStoresEmpty()).toBe(true);
  });

  it("wystarczy jedna kategoria własna, żeby magazyny nie były puste", () => {
    useCategoriesStore.setState({
      customCategories: [{ id: "c1", name: "Moja", type: "expense", icon: "Car", color: "#ef4444", isDefault: false }],
    });
    expect(seedDemoDataOnFirstRun(TODAY).status).toBe("skipped");
    expect(useTransactionsStore.getState().transactions).toEqual([]);
  });
});

describe("seedDemoDataOnFirstRun — kolejne uruchomienia nie nadpisują danych", () => {
  it("drugie uruchomienie nic nie zmienia, także po edycji danych demo", () => {
    seedDemoDataOnFirstRun(TODAY);
    useTransactionsStore.setState((s) => ({ transactions: [ownExpense, ...s.transactions.slice(10)] }));
    const before = collectBackupData();

    expect(seedDemoDataOnFirstRun("2026-12-05")).toEqual({ status: "skipped", reason: "already-done" });
    expect(collectBackupData()).toEqual(before);
  });

  it("po „Wyczyść dane demo” i ponownym starcie demo nie wraca", () => {
    seedDemoDataOnFirstRun(TODAY);
    clearDemoData();
    expect(areDataStoresEmpty()).toBe(true);
    expect(seedDemoDataOnFirstRun(TODAY)).toEqual({ status: "skipped", reason: "already-done" });
    expect(areDataStoresEmpty()).toBe(true);
  });

  it("uszkodzony znacznik traktuje jak „decyzja już zapadła”", () => {
    localStorage.setItem(DEMO_STORAGE_KEY, "{zepsute");
    expect(seedDemoDataOnFirstRun(TODAY).status).toBe("skipped");
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ status: "coś innego" }));
    expect(seedDemoDataOnFirstRun(TODAY).status).toBe("skipped");
    expect(areDataStoresEmpty()).toBe(true);
  });

  it("bez localStorage (tryb prywatny) wczytuje demo — i tak nic nie przetrwa odświeżenia", () => {
    vi.stubGlobal("localStorage", {
      ...memoryStorage(),
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    });
    expect(seedDemoDataOnFirstRun(TODAY).status).toBe("seeded");
  });
});

describe("start aplikacji: seed + synchronizacja jak w main.tsx i AppLayout", () => {
  it("dopisuje pensje i płatności subskrypcji, a kolejny start niczego nie dubluje", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 28, 12, 0));

    expect(seedDemoDataOnFirstRun().status).toBe("seeded");
    syncSubscriptionPayments();
    syncRecurringIncome();
    expect(useTransactionsStore.getState().transactions).toHaveLength(113);

    // „Odświeżenie strony” następnego dnia: seed pominięty, synchronizacja dopisuje tylko nowe terminy.
    vi.setSystemTime(new Date(2026, 10, 29, 12, 0));
    expect(seedDemoDataOnFirstRun().status).toBe("skipped");
    syncSubscriptionPayments();
    syncRecurringIncome();
    expect(useTransactionsStore.getState().transactions).toHaveLength(113);
  });
});

describe("scenariusze na danych demo (do testów F16)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 28, 12, 0));
    seedDemoDataOnFirstRun();
    syncSubscriptionPayments();
    syncRecurringIncome();
  });

  it("usunięcie kategorii „Sport” przenosi 6 operacji i karnet do „Inne wydatki”", () => {
    const result = deleteCategory("demo-cat-sport");
    expect(result).toMatchObject({ ok: true, reassigned: 6, reassignedSubscriptions: 1 });
    const gym = useSubscriptionsStore.getState().subscriptions.find((s) => s.id === "demo-sub-gym");
    expect(gym?.categoryId).toBe("cat-expense-other");
  });

  it("wznowienie Disney+ nie dopisuje płatności z okresu pauzy; następna 8.12", () => {
    useSubscriptionsStore.getState().setActive("demo-sub-disney", true);
    syncSubscriptionPayments();
    const disney = useTransactionsStore.getState().transactions.filter((t) => t.subscriptionId === "demo-sub-disney");
    expect(disney).toHaveLength(2);
    const sub = useSubscriptionsStore.getState().subscriptions.find((s) => s.id === "demo-sub-disney");
    expect(sub && nextOccurrence(sub, "2026-11-27")).toBe("2026-12-08");
  });

  it("wznowienie stypendium nie dopisuje wpływów z okresu pauzy; następny 25.12", () => {
    useRecurringIncomeStore.getState().setActive("demo-rec-scholarship", true);
    syncRecurringIncome();
    const scholarship = useTransactionsStore
      .getState()
      .transactions.filter((t) => t.recurringIncomeId === "demo-rec-scholarship");
    expect(scholarship).toHaveLength(2);
    const rule = useRecurringIncomeStore.getState().recurringIncomes.find((r) => r.id === "demo-rec-scholarship");
    expect(rule && nextOccurrence(rule, "2026-11-27")).toBe("2026-12-25");
  });
});

describe("clearDemoData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 28, 12, 0));
    seedDemoDataOnFirstRun(TODAY);
    syncSubscriptionPayments();
    syncRecurringIncome();
  });

  it("usuwa dane demo, zostawia operacje użytkownika i przenosi je z kategorii demo", () => {
    const inDemoCategory = { ...ownExpense, id: "own-coffee", categoryId: "demo-cat-coffee" };
    useTransactionsStore.setState((s) => ({ transactions: [ownExpense, inDemoCategory, ...s.transactions] }));

    const result = clearDemoData();
    expect(result?.removed.subscriptions).toBe(9);
    expect(result?.reassigned).toBe(1);
    expect(useTransactionsStore.getState().transactions.map((t) => [t.id, t.categoryId])).toEqual([
      [ownExpense.id, "cat-expense-food"],
      ["own-coffee", "cat-expense-other"],
    ]);
    expect(useSubscriptionsStore.getState().subscriptions).toEqual([]);
    expect(useRecurringIncomeStore.getState().recurringIncomes).toEqual([]);
    expect(useCategoriesStore.getState().customCategories).toEqual([]);
    expect(collectBackupData().subscriptionSync).toEqual({});
  });

  it("drugie czyszczenie zwraca null", () => {
    clearDemoData();
    expect(clearDemoData()).toBeNull();
  });

  it("Cofnij przywraca stan sprzed czyszczenia", () => {
    const before = collectBackupData();
    const result = clearDemoData();
    expect(result).not.toBeNull();
    expect(hasDemoData(countDemoData(collectBackupData()))).toBe(false);

    undoClearDemoData(result!);
    expect(collectBackupData()).toEqual(before);
  });
});
