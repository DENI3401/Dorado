import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAlertStore } from "@/features/alerts/store";
import { useCategoriesStore } from "@/features/categories/store";
import { useRecurringIncomeStore } from "@/features/recurring-income/store";
import { useSettingsStore } from "@/features/settings/store";
import { DEFAULT_SETTINGS } from "@/features/settings/types";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { useTransactionsStore } from "@/features/transactions/store";
import type { Transaction } from "@/features/transactions/types";
import { SUBSCRIPTION_SYNC_STORAGE_KEY } from "@/lib/subscriptionSyncStorage";
import {
  MAX_BACKUP_BYTES,
  backupFileName,
  collectBackupData,
  createBackup,
  parseBackup,
  restoreBackup,
  serializeBackup,
  summarizeBackup,
} from "./backup";
import { invalidJsonMessage, tooLargeFileMessage } from "./messages";
import type { BackupData, BackupFile } from "./schema";

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

const CREATED = "2026-11-01T10:00:00.000Z";

const sampleData = (): BackupData => ({
  transactions: [
    {
      id: "t-1",
      type: "income",
      incomeKind: "salary",
      amount: 6500,
      categoryId: "cat-income-salary",
      date: "2026-11-10",
      note: "Pensja",
      createdAt: CREATED,
      recurringIncomeId: "r-1",
    },
    {
      id: "t-2",
      type: "expense",
      incomeKind: null,
      amount: 49.99,
      categoryId: "cat-expense-subscriptions",
      date: "2026-11-15",
      note: "Netflix",
      createdAt: CREATED,
      subscriptionId: "s-1",
    },
    {
      id: "t-3",
      type: "expense",
      incomeKind: null,
      amount: 120.5,
      categoryId: "custom-coffee",
      date: "2026-11-20",
      note: "",
      createdAt: CREATED,
    },
  ],
  customCategories: [
    { id: "custom-coffee", name: "Kawa", type: "expense", icon: "Coffee", color: "#f97316", isDefault: false },
  ],
  subscriptions: [
    {
      id: "s-1",
      name: "Netflix",
      amount: 49.99,
      categoryId: "cat-expense-subscriptions",
      period: "monthly",
      startDate: "2026-01-15",
      endDate: null,
      isActive: true,
      note: "",
      createdAt: CREATED,
    },
  ],
  recurringIncomes: [
    {
      id: "r-1",
      amount: 6500,
      categoryId: "cat-income-salary",
      period: "monthly",
      startDate: "2026-11-10",
      endDate: null,
      isActive: false,
      note: "Pensja",
      createdAt: CREATED,
      generatedThrough: "2026-11-10",
    },
  ],
  settings: { cycleStartDay: 10, lowBalanceThreshold: 750.5 },
  alerts: { lowBalanceAlertTriggered: true, alertCycleStart: "2026-11-10" },
  subscriptionSync: { "s-1": "2026-11-27" },
});

const fileWith = (data: unknown, over: Record<string, unknown> = {}) =>
  JSON.stringify({ app: "dorado", version: 1, exportedAt: CREATED, data, ...over });

function resetStores() {
  useTransactionsStore.setState({ transactions: [] });
  useCategoriesStore.setState({ customCategories: [] });
  useSubscriptionsStore.setState({ subscriptions: [] });
  useRecurringIncomeStore.setState({ recurringIncomes: [] });
  useSettingsStore.setState({ ...DEFAULT_SETTINGS });
  useAlertStore.setState({ lowBalanceAlertTriggered: false, alertCycleStart: null });
  localStorage.clear();
}

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
  resetStores();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("eksport i import (F14)", () => {
  it("eksport → import odtwarza identyczny stan", () => {
    restoreBackup(sampleData());
    const before = collectBackupData();

    const text = serializeBackup(createBackup(new Date("2026-11-27T12:00:00Z")));
    resetStores();
    expect(collectBackupData()).not.toEqual(before);

    const parsed = parseBackup(text);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    restoreBackup(parsed.backup.data);

    expect(collectBackupData()).toEqual(before);
    expect(collectBackupData()).toEqual(sampleData());
  });

  it("odtwarza stan także w magazynach (ustawienia, alert, znacznik subskrypcji)", () => {
    restoreBackup(sampleData());
    expect(useSettingsStore.getState().cycleStartDay).toBe(10);
    expect(useSettingsStore.getState().lowBalanceThreshold).toBe(750.5);
    expect(useAlertStore.getState().lowBalanceAlertTriggered).toBe(true);
    expect(JSON.parse(localStorage.getItem(SUBSCRIPTION_SYNC_STORAGE_KEY) ?? "{}")).toEqual({
      "s-1": "2026-11-27",
    });
  });

  it("import zastępuje dane, a nie dokleja ich do obecnych", () => {
    useTransactionsStore.setState({
      transactions: [{ ...sampleData().transactions[0], id: "stara" }],
    });
    restoreBackup(sampleData());
    const ids = useTransactionsStore.getState().transactions.map((t) => t.id);
    expect(ids).toEqual(["t-1", "t-2", "t-3"]);
  });

  it("pusty stan też da się wyeksportować i wczytać", () => {
    const parsed = parseBackup(serializeBackup(createBackup()));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(summarizeBackup(parsed.backup).transactions).toBe(0);
  });

  it("zachowuje kategorię subskrypcji (flaga) i subskrypcję w tej kategorii", () => {
    const data = sampleData();
    data.customCategories.push({
      id: "custom-insurance",
      name: "Ubezpieczenia",
      type: "expense",
      icon: "ShieldCheck",
      color: "#22c55e",
      isDefault: false,
      forSubscriptions: true,
    });
    data.subscriptions[0] = { ...data.subscriptions[0], categoryId: "custom-insurance" };
    restoreBackup(data);

    const parsed = parseBackup(serializeBackup(createBackup()));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    resetStores();
    restoreBackup(parsed.backup.data);

    expect(useCategoriesStore.getState().customCategories[1]).toMatchObject({
      name: "Ubezpieczenia",
      forSubscriptions: true,
    });
    expect(useSubscriptionsStore.getState().subscriptions[0].categoryId).toBe("custom-insurance");
    // Starsza kategoria bez flagi nie dostaje jej przy imporcie.
    expect("forSubscriptions" in useCategoriesStore.getState().customCategories[0]).toBe(false);
  });

  it("Undo: przywrócenie kopii sprzed importu wraca do poprzedniego stanu", () => {
    restoreBackup(sampleData());
    const previous: BackupFile = createBackup();
    restoreBackup({ ...sampleData(), transactions: [], settings: { cycleStartDay: 1, lowBalanceThreshold: 0 } });
    restoreBackup(previous.data);
    expect(collectBackupData()).toEqual(sampleData());
  });
});

describe("parseBackup — odrzucanie błędnych plików", () => {
  it("przyjmuje poprawny plik", () => {
    expect(parseBackup(fileWith(sampleData())).success).toBe(true);
  });

  it("odrzuca tekst, który nie jest JSON-em", () => {
    expect(parseBackup("to nie jest json")).toEqual({
      success: false,
      error: invalidJsonMessage,
      details: [],
    });
  });

  it("odrzuca zbyt duży plik", () => {
    const result = parseBackup(" ".repeat(MAX_BACKUP_BYTES + 1));
    expect(result.success ? "" : result.error).toBe(tooLargeFileMessage);
  });

  it("odrzuca JSON spoza Dorado jednym komunikatem", () => {
    const result = parseBackup(JSON.stringify({ name: "coś innego", items: [1, 2, 3] }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("To nie jest kopia zapasowa Dorado");
    expect(result.details).toHaveLength(1);
  });

  it("odrzuca nieobsługiwaną wersję", () => {
    const result = parseBackup(fileWith(sampleData(), { version: 99 }));
    expect(result.success ? "" : result.error).toBe("Nieobsługiwana wersja kopii zapasowej");
  });

  it("odrzuca kopię bez danych", () => {
    const result = parseBackup(JSON.stringify({ app: "dorado", version: 1, exportedAt: CREATED }));
    expect(result.success ? "" : result.error).toMatch(/^Dane kopii:/);
  });

  it("wskazuje pozycję i pole z błędem", () => {
    const data = sampleData();
    data.transactions[1] = { ...data.transactions[1], amount: -5 };
    const result = parseBackup(fileWith(data));
    expect(result.success ? "" : result.error).toBe(
      "Transakcje, pozycja 2, pole „kwota”: Kwota musi być większa od zera",
    );
  });

  it("odrzuca kwotę z więcej niż 2 miejscami po przecinku", () => {
    const data = sampleData();
    data.subscriptions[0] = { ...data.subscriptions[0], amount: 9.999 };
    expect(parseBackup(fileWith(data)).success).toBe(false);
  });

  it("odrzuca nieistniejącą datę", () => {
    const data = sampleData();
    data.transactions[0] = { ...data.transactions[0], date: "2026-02-31" };
    const result = parseBackup(fileWith(data));
    expect(result.success ? "" : result.error).toBe(
      "Transakcje, pozycja 1, pole „data”: Nieprawidłowa data",
    );
  });

  it("odrzuca złe typy pól z komunikatem po polsku", () => {
    const data = { ...sampleData(), transactions: [{ ...sampleData().transactions[0], amount: "6500" }] };
    const result = parseBackup(fileWith(data));
    expect(result.success ? "" : result.error).toBe(
      "Transakcje, pozycja 1, pole „kwota”: Kwota musi być liczbą",
    );
  });

  it("odrzuca transakcję z nieistniejącą kategorią", () => {
    const data = sampleData();
    data.customCategories = [];
    const result = parseBackup(fileWith(data));
    expect(result.success ? "" : result.error).toBe(
      "Transakcje, pozycja 3, pole „kategoria”: Kategoria nie istnieje",
    );
  });

  it("odrzuca kategorię niepasującą do typu operacji", () => {
    const data = sampleData();
    data.subscriptions[0] = { ...data.subscriptions[0], categoryId: "cat-income-salary" };
    const result = parseBackup(fileWith(data));
    expect(result.success ? "" : result.error).toMatch(/Kategoria nie pasuje do typu operacji$/);
  });

  it("odrzuca przychód bez rodzaju i wydatek z rodzajem", () => {
    const data = sampleData();
    data.transactions[0] = { ...data.transactions[0], incomeKind: null };
    data.transactions[1] = { ...data.transactions[1], incomeKind: "bonus" } as Transaction;
    const result = parseBackup(fileWith(data));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.details).toHaveLength(2);
  });

  it("odrzuca powtórzone identyfikatory", () => {
    const data = sampleData();
    data.transactions[1] = { ...data.transactions[1], id: "t-1" };
    const result = parseBackup(fileWith(data));
    expect(result.success ? "" : result.error).toBe(
      "Transakcje, pozycja 2, pole „identyfikator”: Powtórzony identyfikator",
    );
  });

  it("odrzuca kategorię własną, która udaje domyślną lub dubluje nazwę", () => {
    const data = sampleData();
    data.customCategories.push({
      id: "cat-expense-food",
      name: "jedzenie",
      type: "expense",
      icon: "Utensils",
      color: "#f97316",
      isDefault: false,
    });
    const result = parseBackup(fileWith(data));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details).toContain(
        "Kategorie własne, pozycja 2, pole „identyfikator”: Identyfikator zajęty przez kategorię domyślną",
      );
      expect(result.details).toContain(
        "Kategorie własne, pozycja 2, pole „nazwa”: Kategoria o takiej nazwie już istnieje",
      );
    }
  });

  it("odrzuca kategorię przychodów oznaczoną jako kategoria subskrypcji i zły typ flagi", () => {
    const data = sampleData();
    data.customCategories.push({
      id: "custom-tutoring",
      name: "Korepetycje",
      type: "income",
      icon: "BookOpen",
      color: "#6366f1",
      isDefault: false,
      forSubscriptions: true,
    });
    const result = parseBackup(fileWith(data));
    expect(result.success ? "" : result.error).toBe(
      "Kategorie własne, pozycja 2, pole „kategoria subskrypcji”: Kategoria przychodów nie może być kategorią subskrypcji",
    );

    const wrongType = sampleData();
    const raw = { ...wrongType.customCategories[0], forSubscriptions: "tak" };
    expect(parseBackup(fileWith({ ...wrongType, customCategories: [raw] })).success).toBe(false);
  });

  it("odrzuca subskrypcję kończącą się przed startem", () => {
    const data = sampleData();
    data.subscriptions[0] = { ...data.subscriptions[0], endDate: "2025-12-31" };
    expect(parseBackup(fileWith(data)).success).toBe(false);
  });

  it("odrzuca niepoprawne ustawienia", () => {
    const data = { ...sampleData(), settings: { cycleStartDay: 32, lowBalanceThreshold: -1 } };
    const result = parseBackup(fileWith(data));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.details).toEqual([
        "Ustawienia, pole „dzień początku cyklu”: Dzień cyklu musi być między 1 a 31",
        "Ustawienia, pole „próg alertu”: Próg nie może być ujemny",
      ]);
    }
  });

  it("błędny plik niczego nie zmienia w magazynach", () => {
    restoreBackup(sampleData());
    const before = collectBackupData();
    const result = parseBackup(fileWith({ ...sampleData(), transactions: "zepsute" }));
    expect(result.success).toBe(false);
    expect(collectBackupData()).toEqual(before);
  });
});

describe("pomocnicze", () => {
  it("nazwa pliku zawiera lokalną datę", () => {
    expect(backupFileName(new Date(2026, 10, 7, 23, 59))).toBe("dorado-kopia-2026-11-07.json");
  });

  it("podsumowanie liczy elementy kopii", () => {
    const backup: BackupFile = { app: "dorado", version: 1, exportedAt: CREATED, data: sampleData() };
    expect(summarizeBackup(backup)).toEqual({
      exportedAt: CREATED,
      transactions: 3,
      customCategories: 1,
      subscriptions: 1,
      recurringIncomes: 1,
    });
  });
});
