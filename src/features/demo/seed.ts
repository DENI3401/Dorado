/**
 * Wczytywanie i czyszczenie danych demo w magazynach aplikacji (F15).
 *
 * Zapis idzie przez restoreBackup z F14 — ta sama droga co import kopii zapasowej, z tą samą
 * kolejnością aktualizacji magazynów i tą samą walidacją (backupDataSchema).
 */
import { collectBackupData, restoreBackup } from "@/features/backup/backup";
import { backupDataSchema, type BackupData } from "@/features/backup/schema";
import { useCategoriesStore } from "@/features/categories/store";
import { useRecurringIncomeStore } from "@/features/recurring-income/store";
import { useSubscriptionsStore } from "@/features/subscriptions/store";
import { useTransactionsStore } from "@/features/transactions/store";
import { todayIso } from "@/features/transactions/utils/isoDate";
import {
  buildDemoData,
  countDemoData,
  hasDemoData,
  removeDemoData,
  type DemoCounts,
} from "./build";
import { getDemoFile } from "./demoFile";
import { readDemoState, writeDemoState } from "./storage";

const dataStores = [
  useTransactionsStore,
  useCategoriesStore,
  useSubscriptionsStore,
  useRecurringIncomeStore,
] as const;

/**
 * Czy magazyny wczytały już stan z localStorage. Przy localStorage zustand robi to synchronicznie
 * przy tworzeniu magazynu, więc w praktyce zawsze true; bez localStorage (testy) nie ma `persist`.
 */
function storesHydrated(): boolean {
  return dataStores.every((store) => store.persist?.hasHydrated() ?? true);
}

/** Brak jakichkolwiek danych użytkownika (ustawienia i flaga alertu się nie liczą — zawsze mają wartości). */
export function areDataStoresEmpty(): boolean {
  return (
    useTransactionsStore.getState().transactions.length === 0 &&
    useCategoriesStore.getState().customCategories.length === 0 &&
    useSubscriptionsStore.getState().subscriptions.length === 0 &&
    useRecurringIncomeStore.getState().recurringIncomes.length === 0
  );
}

export type SeedResult =
  | { status: "seeded"; counts: DemoCounts }
  | {
      status: "skipped";
      /**
       * already-done — demo było już wczytane albo pominięte przy wcześniejszym starcie;
       * has-data — są dane użytkownika (zostają nietknięte);
       * not-hydrated — magazyny jeszcze się nie wczytały (spróbujemy przy następnym starcie);
       * invalid — plik demo nie przeszedł walidacji (błąd programisty, szczegóły w konsoli).
       */
      reason: "already-done" | "has-data" | "not-hydrated" | "invalid";
    };

/**
 * Wczytuje dane demo przy pierwszym uruchomieniu aplikacji. Wywoływane raz, w main.tsx, przed
 * renderem — dzięki temu synchronizacja w AppLayout od razu zaksięguje płatności subskrypcji
 * i wynagrodzenia demo, a alert niskiego salda widzi już pełne dane.
 *
 * Demo trafia tylko do PUSTYCH magazynów i tylko RAZ (znacznik w localStorage), więc kolejne
 * uruchomienia nigdy nie nadpisują danych — także po „Wyczyść dane demo”.
 */
export function seedDemoDataOnFirstRun(today: string = todayIso()): SeedResult {
  if (readDemoState() !== null) return { status: "skipped", reason: "already-done" };
  if (!storesHydrated()) return { status: "skipped", reason: "not-hydrated" };

  if (!areDataStoresEmpty()) {
    // Użytkownik miał dane, zanim pojawiło się demo — zapamiętujemy, żeby nigdy go nie wczytać.
    writeDemoState({ status: "skipped", date: today });
    return { status: "skipped", reason: "has-data" };
  }

  let demo: BackupData;
  try {
    // Ustawienia, flaga alertu i znacznik subskrypcji zostają takie, jakie są.
    demo = backupDataSchema.parse({ ...collectBackupData(), ...buildDemoData(getDemoFile(), today) });
  } catch (error) {
    console.error("[Dorado] Dane demo (src/data/mock.json) są niepoprawne — pomijam wczytanie.", error);
    return { status: "skipped", reason: "invalid" };
  }

  restoreBackup(demo);
  writeDemoState({ status: "seeded", date: today });
  return { status: "seeded", counts: countDemoData(demo) };
}

export interface ClearDemoResult {
  /** Stan sprzed czyszczenia — do „Cofnij” w toaście. */
  previous: BackupData;
  removed: DemoCounts;
  reassigned: number;
}

/** Usuwa dane demo (własne dane użytkownika zostają). Zwraca null, gdy nie było czego usuwać. */
export function clearDemoData(): ClearDemoResult | null {
  const previous = collectBackupData();
  const result = removeDemoData(previous);
  if (!hasDemoData(result.removed)) return null;
  restoreBackup(result.data);
  return { previous, removed: result.removed, reassigned: result.reassigned };
}

/** Cofnięcie „Wyczyść dane demo” (Undo z toastu). */
export function undoClearDemoData(result: ClearDemoResult): void {
  restoreBackup(result.previous);
}
